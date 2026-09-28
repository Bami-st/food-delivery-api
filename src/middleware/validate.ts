import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../lib/response';

interface ValidationTargets {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validateRequest(schemas: ValidationTargets) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));

        // Use 422 for unprocessable request bodies, 400 for bad query/params
        const isBodyError = err.issues.some((issue) => issue.path[0] === 'body' || schemas.body);
        const statusCode = isBodyError && req.method !== 'GET' ? 422 : 400;
        const errorCode = statusCode === 422 ? 'UNPROCESSABLE_ENTITY' : 'BAD_REQUEST';

        const mainMessage = issues.length === 1 
          ? `Validation error on '${issues[0].field}': ${issues[0].message}`
          : 'Invalid request data';

        sendError(res, statusCode, errorCode, mainMessage, issues);
        return;
      }

      sendError(res, 400, 'BAD_REQUEST', 'Failed to validate request');
    }
  };
}
