import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

/**
 * Validates req.body/query/params against a Zod schema and replaces them
 * with the parsed (and coerced) values, so downstream controllers can
 * trust the shape of the data they receive.
 */
export const validate = (schema: AnyZodObject) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      req.body = parsed.body ?? req.body;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
        });
      }
      next(error);
    }
  };
};
