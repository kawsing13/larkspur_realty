// Property documents. Files live in a private bucket; every download runs through
// getDownload() which checks the document's visibility against the caller.
//
//   PUBLIC  - anyone (shown on the public listing page)
//   AGENTS  - any authenticated agent / admin / property manager
//   PRIVATE - an admin, or the property's own agent / creator

import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../lib/ApiError.js';
import { loadPropertyForAccess, ownsProperty } from '../../lib/propertyAccess.js';
import { putDocument, getDocumentStream, removeDocument } from '../../lib/storage.js';
import { writeAudit } from '../../lib/audit.js';
import { logger } from '../../config/logger.js';

const isAdmin = (user) =>
  !!user && (user.roles.includes('ADMINISTRATOR') || user.roles.includes('SUPER_ADMIN'));
const isStaff = (user) =>
  !!user &&
  ['ADMINISTRATOR', 'SUPER_ADMIN', 'AGENT', 'PROPERTY_MANAGER'].some((r) => user.roles.includes(r));

const canSee = (user, doc) => {
  if (doc.visibility === 'PUBLIC') return true;
  if (!isStaff(user)) return false;
  if (doc.visibility === 'AGENTS') return true;
  // PRIVATE
  return isAdmin(user) || ownsProperty(user, doc.property);
};

const shape = (d) => ({
  id: d.id,
  propertyId: d.propertyId,
  title: d.title,
  docType: d.docType,
  visibility: d.visibility,
  fileName: d.fileName,
  mimeType: d.mimeType,
  sizeBytes: d.sizeBytes,
  createdAt: d.createdAt,
  uploadedBy: d.uploadedBy ? `${d.uploadedBy.firstName} ${d.uploadedBy.lastName}` : null,
});

const DOC_INCLUDE = {
  uploadedBy: { select: { firstName: true, lastName: true } },
  property: { select: { agentId: true, createdById: true, reference: true } },
};

export const listDocuments = async (user, propertyId) => {
  const docs = await prisma.propertyDocument.findMany({
    where: { propertyId },
    orderBy: { createdAt: 'desc' },
    include: DOC_INCLUDE,
  });
  return docs.filter((d) => canSee(user, d)).map(shape);
};

export const getDownload = async (user, docId) => {
  const doc = await prisma.propertyDocument.findUnique({
    where: { id: docId },
    include: DOC_INCLUDE,
  });
  if (!doc) throw ApiError.notFound('Document not found');
  if (!canSee(user, doc)) throw ApiError.forbidden('You cannot download this document');

  const stream = await getDocumentStream(doc.storageKey);
  return { doc, stream };
};

export const uploadDocument = async (req, body, file) => {
  await loadPropertyForAccess(req.user, body.propertyId, { forWrite: true });

  const { key } = await putDocument({
    propertyId: body.propertyId,
    buffer: file.buffer,
    mimeType: file.mimetype,
    fileName: file.originalname,
  });

  const doc = await prisma.propertyDocument.create({
    data: {
      propertyId: body.propertyId,
      title: body.title,
      docType: body.docType || 'OTHER',
      visibility: body.visibility || 'PRIVATE',
      storageKey: key,
      fileName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      uploadedById: req.user.id,
    },
    include: DOC_INCLUDE,
  });

  await writeAudit({
    req,
    action: 'document.uploaded',
    entityType: 'PropertyDocument',
    entityId: doc.id,
    summary: `Uploaded "${doc.title}" to ${doc.property.reference}`,
  });

  return shape(doc);
};

export const patchDocument = async (user, docId, body) => {
  const doc = await prisma.propertyDocument.findUnique({
    where: { id: docId },
    include: DOC_INCLUDE,
  });
  if (!doc) throw ApiError.notFound('Document not found');
  await loadPropertyForAccess(user, doc.propertyId, { forWrite: true });

  const updated = await prisma.propertyDocument.update({
    where: { id: docId },
    data: {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.docType !== undefined ? { docType: body.docType } : {}),
      ...(body.visibility !== undefined ? { visibility: body.visibility } : {}),
    },
    include: DOC_INCLUDE,
  });
  return shape(updated);
};

export const deleteDocument = async (user, docId) => {
  const doc = await prisma.propertyDocument.findUnique({ where: { id: docId } });
  if (!doc) throw ApiError.notFound('Document not found');
  await loadPropertyForAccess(user, doc.propertyId, { forWrite: true });

  await removeDocument(doc.storageKey).catch((err) =>
    logger.warn({ err, key: doc.storageKey }, 'Could not delete document from storage'),
  );
  await prisma.propertyDocument.delete({ where: { id: docId } });
};
