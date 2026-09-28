import { z } from 'zod';
import { basePaginationSchema, idParamSchema } from './common.schema';

export const menuItemParamsSchema = idParamSchema('menu');

export const listMenuItemsQuerySchema = basePaginationSchema.extend({
  restaurantId: z.string().optional(),
  category: z.string().optional(),
  minPrice: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (!isNaN(val) && val >= 0), {
      message: 'minPrice must be a non-negative integer (in cents)',
    }),
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
