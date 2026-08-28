import { z } from 'zod';

export const listUsersSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
    search: z.string().trim().min(1).optional(),
    role: z
      .enum(['SUPER_ADMIN', 'ADMINISTRATOR', 'AGENT', 'PROPERTY_MANAGER', 'CUSTOMER'])
      .optional(),
  }),
};

export const userIdSchema = {
  params: z.object({ id: z.string().min(1) }),
};

export const setStatusSchema = {
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ status: z.enum(['ACTIVE', 'SUSPENDED', 'INVITED']) }),
};
