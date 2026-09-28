import { z } from 'zod';
import { basePaginationSchema, idParamSchema } from './common.schema';

export const restaurantParamsSchema = idParamSchema('rest');

export const listRestaurantsQuerySchema = basePaginationSchema.extend({
  cuisine: z.string().optional(),
  city: z.string().optional(),
  minRating: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .refine((val) => val === undefined || (!isNaN(val) && val >= 1.0 && val <= 5.0), {
      message: 'minRating must be a number between 1.0 and 5.0',
    }),
  isOpen: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true')),
  sort: z.enum(['name', 'rating', 'createdAt']).default('createdAt'),
});

export const nestedMenuQuerySchema = basePaginationSchema.extend({
  category: z.string().optional(),
  maxPrice: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (!isNaN(val) && val >= 0), {
      message: 'maxPrice must be a non-negative integer (in cents)',
    }),
  isAvailable: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true')),
  sort: z.enum(['name', 'priceInCents', 'createdAt']).default('createdAt'),
});
