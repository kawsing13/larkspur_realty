// One error type for the whole API. Throw it from anywhere (service, controller,
// middleware) and the error handler turns it into a clean JSON response:
//   { error: { message, code, details? } }
//
//   throw new ApiError(404, 'Property not found');
//   throw ApiError.validation('Some fields need attention', { fields });

export class ApiError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    // Marks errors we raised on purpose, so the handler knows the message is safe to show.
    this.expected = true;
  }

  static badRequest(message = 'Bad request', details) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'Not authenticated') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Not allowed') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Not found') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Conflict', details) {
    return new ApiError(409, message, details);
  }

  static validation(message = 'Validation failed', details) {
    return new ApiError(422, message, details);
  }
}
