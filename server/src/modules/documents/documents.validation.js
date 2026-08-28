import { z } from 'zod';

const id = z.string().trim().min(1).max(60);
const DOC_TYPES = ['BROCHURE', 'FLOOR_PLAN', 'PERMIT', 'TITLE', 'OTHER'];
const VISIBILITIES = ['PRIVATE', 'AGENTS', 'PUBLIC'];

export const listDocumentsSchema = {
  query: z.object({ propertyId: id }),
};

// Multipart: these text fields arrive as strings after multer parses the form.
export const uploadDocumentSchema = {
  body: z.object({
    propertyId: id,
    title: z.string().trim().min(2, 'Give the document a title').max(160),
    docType: z.enum(DOC_TYPES).optional(),
    visibility: z.enum(VISIBILITIES).optional(),
  }),
};

export const documentIdSchema = { params: z.object({ id }) };

export const patchDocumentSchema = {
  params: z.object({ id }),
  body: z
    .object({
      title: z.string().trim().min(2).max(160).optional(),
      docType: z.enum(DOC_TYPES).optional(),
      visibility: z.enum(VISIBILITIES).optional(),
    })
    .refine((b) => Object.keys(b).length > 0, { message: 'Nothing to update' }),
};
