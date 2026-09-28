import { z } from 'zod';
import { config } from '../config';

export const basePaginationSchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return config.pagination.defaultLimit;
      const num = parseInt(val, 10);
      if (isNaN(num) || num <= 0) {
        throw new Error('Limit must be a positive integer');
      }
      // Clamped to maximum limit (e.g. 5000 -> 100)
      return Math.min(num, config.pagination.maxLimit);
    }),
  cursor: z.string().optional(),
  offset: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const num = parseInt(val, 10);
      if (isNaN(num) || num < 0) {
        throw new Error('Offset must be a non-negative integer (>= 0)');
      }
      return num;
    }),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const idParamSchema = (prefix: string) =>
  z.object({
    id: z.string().refine((val) => val.startsWith(`${prefix}_`), {
      message: `Identifier must start with '${prefix}_'`,
    }),
  });
