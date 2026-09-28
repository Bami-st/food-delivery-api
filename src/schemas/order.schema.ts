import { z } from 'zod';
import { basePaginationSchema, idParamSchema } from './common.schema';

export const orderParamsSchema = idParamSchema('ord');

export const ORDER_STATUS_ENUM = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
] as const;

export const listOrdersQuerySchema = basePaginationSchema.extend({
  customerId: z.string().optional(),
  restaurantId: z.string().optional(),
  status: z.enum(ORDER_STATUS_ENUM).optional(),
  sort: z.enum(['totalAmountInCents', 'status', 'createdAt']).default('createdAt'),
});

export const createOrderBodySchema = z.object({
  customerId: z.string({ required_error: 'customerId is required' }).min(1, 'customerId cannot be empty'),
  restaurantId: z.string({ required_error: 'restaurantId is required' }).min(1, 'restaurantId cannot be empty'),
  deliveryAddress: z.string({ required_error: 'deliveryAddress is required' }).min(1, 'deliveryAddress cannot be empty'),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string({ required_error: 'menuItemId is required' }).min(1, 'menuItemId cannot be empty'),
        quantity: z.number({ required_error: 'quantity is required' }).int().positive('quantity must be a positive integer'),
      }),
      { required_error: 'items array is required' }
    )
    .min(1, 'Order must contain at least one item'),
});

export const updateOrderBodySchema = z
  .object({
    status: z.enum(ORDER_STATUS_ENUM).optional(),
    deliveryAddress: z.string().min(1, 'deliveryAddress cannot be empty').optional(),
    notes: z.string().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field (status, deliveryAddress, or notes) must be provided for update',
  });
