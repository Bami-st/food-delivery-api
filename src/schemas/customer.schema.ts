import { z } from 'zod';
import { basePaginationSchema, idParamSchema } from './common.schema';

export const customerParamsSchema = idParamSchema('cust');

export const listCustomersQuerySchema = basePaginationSchema.extend({
  search: z.string().optional(),
  city: z.string().optional(),
  sort: z.enum(['name', 'email', 'createdAt']).default('createdAt'),
});
