import { asyncHandler } from '../../lib/asyncHandler.js';
import { ApiError } from '../../lib/ApiError.js';
import * as service from './documents.service.js';

export const list = asyncHandler(async (req, res) => {
  res.json({ data: await service.listDocuments(req.user, req.query.propertyId) });
});

export const upload = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.validation('Choose a file to upload');
  res.status(201).json({ document: await service.uploadDocument(req, req.body, req.file) });
});

export const patch = asyncHandler(async (req, res) => {
  res.json({ document: await service.patchDocument(req.user, req.params.id, req.body) });
});

export const remove = asyncHandler(async (req, res) => {
  await service.deleteDocument(req.user, req.params.id);
  res.status(204).end();
});

export const download = asyncHandler(async (req, res) => {
  const { doc, stream } = await service.getDownload(req.user, req.params.id);
  res.setHeader('Content-Type', doc.mimeType);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${encodeURIComponent(doc.fileName)}"`,
  );
  res.setHeader('Content-Length', String(doc.sizeBytes));
  stream.on('error', () => res.destroy());
  stream.pipe(res);
});
