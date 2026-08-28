import { z } from 'zod';

const email = z.string().trim().toLowerCase().email('Enter a valid email address');
const strongPassword = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(200, 'That password is too long');

export const registerSchema = {
  body: z.object({
    email,
    password: strongPassword,
    firstName: z.string().trim().min(1, 'First name is required').max(80),
    lastName: z.string().trim().min(1, 'Last name is required').max(80),
    phone: z.string().trim().max(40).optional(),
  }),
};

export const loginSchema = {
  body: z.object({
    email,
    password: z.string().min(1, 'Enter your password'),
  }),
};

export const changePasswordSchema = {
  body: z.object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: strongPassword,
  }),
};
