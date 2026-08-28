// Wraps an async route handler so a thrown error or rejected promise is passed to
// Express's error middleware instead of becoming an unhandled rejection.
//
//   router.get('/', asyncHandler(async (req, res) => { ... }));

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
