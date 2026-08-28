import { z } from 'zod';

const id = z.string().trim().min(1).max(60);
const text = (max) => z.string().trim().max(max).optional();

export const agentIdSchema = { params: z.object({ id }) };

// The public profile page: agent details plus a page of their live listings.
export const publicProfileSchema = {
  params: z.object({ id }),
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
  }),
};

export const listAgentsSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    search: z.string().trim().min(1).optional(),
  }),
};

// An agent editing their own public profile.
export const updateMeSchema = {
  body: z.object({
    title: text(80),
    bio: text(2000),
    photoUrl: z.string().trim().url().max(500).optional().or(z.literal('')),
    phone: text(40),
  }),
};

// An admin editing any agent.
export const updateAgentSchema = {
  params: z.object({ id }),
  body: z.object({
    title: text(80),
    bio: text(2000),
    licenseNumber: text(60),
    photoUrl: z.string().trim().url().max(500).optional().or(z.literal('')),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  }),
};

export const createAgentSchema = {
  body: z.object({
    email: z.string().trim().toLowerCase().email(),
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    phone: text(40),
    title: text(80),
    licenseNumber: text(60),
    // A starter password the admin shares with the new agent.
    temporaryPassword: z.string().min(8).max(200),
  }),
};
