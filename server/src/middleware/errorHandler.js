// The single place errors become HTTP responses. Mounted last, after all routes.
// Response shape is always: { error: { message, code, details? } }

import { Prisma } from '@prisma/client';
import { MulterError } from 'multer';
import { ApiError } from '../lib/ApiError.js';
import { isProd } from '../config/env.js';
import { logger } from '../config/logger.js';

// Translate the Prisma errors we expect into friendly API errors.
const fromPrisma = (err) => {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError)) return null;

  if (err.code === 'P2002') {
    const target = err.meta?.target;
    const field = Array.isArray(target) ? target.join(', ') : target;
    return ApiError.conflict(`That ${field || 'value'} is already in use`);
  }
  if (err.code === 'P2025') return ApiError.notFound('That record does not exist');
  if (err.code === 'P2003') return ApiError.badRequest('A referenced record is missing');
  return null;
};

// Translate multer upload errors (size, count, unexpected field) into 422s.
const fromMulter = (err) => {
  if (!(err instanceof MulterError)) return null;
  if (err.code === 'LIMIT_FILE_SIZE') return ApiError.validation('That file is too large');
  if (err.code === 'LIMIT_FILE_COUNT') return ApiError.validation('Upload one file at a time');
  return ApiError.validation('There was a problem with the upload');
};

// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by the 4-arg signature
export const errorHandler = (err, req, res, next) => {
  let apiError = err instanceof ApiError ? err : fromPrisma(err) || fromMulter(err);

  if (!apiError) {
    // Unexpected: log the real error with request context, return a generic message.
    (req.log || logger).error(
      { err, method: req.method, url: req.originalUrl },
      'Unhandled error',
    );
    apiError = new ApiError(500, 'Something went wrong on our side');
  }

  const body = { error: { message: apiError.message, code: apiError.statusCode } };
  if (apiError.details) body.error.details = apiError.details;
  if (!isProd && apiError.statusCode === 500) body.error.stack = err.stack;

  res.status(apiError.statusCode).json(body);
};
