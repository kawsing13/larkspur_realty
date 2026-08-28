import { ApiError } from '../lib/ApiError.js';

// Any /api/* path that no router matched.
export const notFound = (req, res, next) => {
  next(ApiError.notFound(`No route for ${req.method} ${req.originalUrl}`));
};
