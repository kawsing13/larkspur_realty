// Validates and normalises request input with a Zod schema before the controller runs.
// The parsed value (typed, with defaults applied) replaces the original.
//
//   const schema = { body: z.object({ email: z.string().email() }) };
//   router.post('/', validate(schema), controller.create);

import { ApiError } from '../lib/ApiError.js';

export const validate = (schema) => (req, res, next) => {
  for (const part of ['body', 'query', 'params']) {
    if (!schema[part]) continue;

    const result = schema[part].safeParse(req[part]);
    if (!result.success) {
      const fields = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || part,
        message: issue.message,
      }));
      return next(ApiError.validation('Some fields need attention', { fields }));
    }
    req[part] = result.data;
  }
  next();
};
