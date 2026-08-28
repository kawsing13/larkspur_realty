// Rate limiters for endpoints that are cheap to abuse. The brief asks for limits on
// authentication and the public inquiry form.

import rateLimit from 'express-rate-limit';

const tooMany = { error: { message: 'Too many requests, please slow down', code: 429 } };

const make = (windowMs, limit) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: tooMany,
  });

// Login / register: slows down credential stuffing without blocking a normal
// person who mistypes a password a few times.
export const authLimiter = make(15 * 60 * 1000, 50);

// Public inquiry submission: slows down spam.
export const inquiryLimiter = make(60 * 60 * 1000, 15);

// A gentle ceiling for everything else.
export const apiLimiter = make(15 * 60 * 1000, 600);
