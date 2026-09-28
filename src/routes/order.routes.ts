import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { sendCollection, sendItem, sendError } from '../lib/response';
import { validateRequest } from '../middleware/validate';
import {
  orderParamsSchema,
  listOrdersQuerySchema,
  createOrderBodySchema,
  updateOrderBodySchema,
} from '../schemas/order.schema';
import { generateOrderId, generateOrderItemId } from '../lib/id';
import { Prisma } from '@prisma/client';

export const orderRouter = Router();

// GET /api/v1/orders - List orders with filtering, sorting, cursor/offset paging
orderRouter.get(
  '/',
  validateRequest({ query: listOrdersQuerySchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { limit, cursor, offset, order, sort, customerId, restaurantId, status } = req.query as any;

      const where: Prisma.OrderWhereInput = {};
      if (customerId) {
        where.customerId = { equals: customerId };
      }
      if (restaurantId) {
        where.restaurantId = { equals: restaurantId };
      }
      if (status) {
        where.status = { equals: status };
      }

      const total = await prisma.order.count({ where });

      const findArgs: Prisma.OrderFindManyArgs = {
        where,
        take: limit + 1,
        orderBy: [{ [sort]: order }, { id: order }],
        include: {
          customer: { select: { id: true, name: true, email: true } },
          restaurant: { select: { id: true, name: true, cuisine: true } },
          items: true,
        },
      };

      if (cursor) {
        findArgs.cursor = { id: cursor };
        findArgs.skip = 1;
      } else if (offset !== undefined) {
        findArgs.skip = offset;
      }

      const items = await prisma.order.findMany(findArgs);
      const hasMore = items.length > limit;
      const data = hasMore ? items.slice(0, limit) : items;
      const nextCursor = hasMore && data.length > 0 ? data[data.length - 1].id : null;

      sendCollection(res, 200, data, {
        total,
        limit,
        nextCursor,
        hasMore,
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/orders/:id - Get single order with items and customer/restaurant details
orderRouter.get(
  '/:id',
  validateRequest({ params: orderParamsSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          customer: true,
          restaurant: true,
          items: {
            include: {
              menuItem: true,
            },
          },
        },
      });

      if (!order) {
        sendError(res, 404, 'NOT_FOUND', `Order with ID '${id}' not found`);
        return;
      }

      sendItem(res, 200, order);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/orders - Create a new order with items
orderRouter.post(
  '/',
  validateRequest({ body: createOrderBodySchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { customerId, restaurantId, deliveryAddress, notes, items } = req.body;

      // 1. Verify Customer exists
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
      });
      if (!customer) {
        sendError(res, 404, 'NOT_FOUND', `Customer with ID '${customerId}' does not exist`);
        return;
      }

      // 2. Verify Restaurant exists
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
      });
      if (!restaurant) {
        sendError(res, 404, 'NOT_FOUND', `Restaurant with ID '${restaurantId}' does not exist`);
        return;
      }

      // 3. Verify Menu Items exist and belong to the specified restaurant
      const menuItemIds = items.map((i: { menuItemId: string }) => i.menuItemId);
      const menuItemsInDb = await prisma.menuItem.findMany({
        where: {
          id: { in: menuItemIds },
          restaurantId: restaurantId,
        },
      });

      if (menuItemsInDb.length !== menuItemIds.length) {
        sendError(
          res,
          422,
          'UNPROCESSABLE_ENTITY',
          'One or more menu items do not exist or do not belong to this restaurant'
        );
        return;
      }

      // 4. Calculate total amount
      const menuItemMap = new Map(menuItemsInDb.map((m) => [m.id, m]));
      let totalAmountInCents = 0;
      const orderId = generateOrderId();

      const orderItemsToCreate = items.map((item: { menuItemId: string; quantity: number }) => {
        const itemRecord = menuItemMap.get(item.menuItemId)!;
        const lineTotal = itemRecord.priceInCents * item.quantity;
        totalAmountInCents += lineTotal;

        return {
          id: generateOrderItemId(),
          orderId,
          menuItemId: item.menuItemId,
          name: itemRecord.name,
          quantity: item.quantity,
          unitPriceInCents: itemRecord.priceInCents,
        };
      });

      // 5. Create Order and OrderItems in single transaction
      const newOrder = await prisma.$transaction(async (tx) => {
        const createdOrder = await tx.order.create({
          data: {
            id: orderId,
            customerId,
            restaurantId,
            status: 'PENDING',
            totalAmountInCents,
            deliveryAddress,
            notes: notes || null,
          },
        });

        await tx.orderItem.createMany({
          data: orderItemsToCreate,
        });

        return tx.order.findUnique({
          where: { id: createdOrder.id },
          include: {
            customer: true,
            restaurant: true,
            items: true,
          },
        });
      });

      sendItem(res, 201, newOrder);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/v1/orders/:id - Partial update of order
orderRouter.patch(
  '/:id',
  validateRequest({ params: orderParamsSchema, body: updateOrderBodySchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { status, deliveryAddress, notes } = req.body;

      const existingOrder = await prisma.order.findUnique({
        where: { id },
      });

      if (!existingOrder) {
        sendError(res, 404, 'NOT_FOUND', `Order with ID '${id}' not found`);
        return;
      }

      const updateData: Prisma.OrderUpdateInput = {};
      if (status !== undefined) updateData.status = status;
      if (deliveryAddress !== undefined) updateData.deliveryAddress = deliveryAddress;
      if (notes !== undefined) updateData.notes = notes;

      const updatedOrder = await prisma.order.update({
        where: { id },
        data: updateData,
        include: {
          customer: true,
          restaurant: true,
          items: true,
        },
      });

      sendItem(res, 200, updatedOrder);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/v1/orders/:id - Cancel and delete order
orderRouter.delete(
  '/:id',
  validateRequest({ params: orderParamsSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;

      const existingOrder = await prisma.order.findUnique({
        where: { id },
      });

      if (!existingOrder) {
        sendError(res, 404, 'NOT_FOUND', `Order with ID '${id}' not found`);
        return;
      }

      await prisma.order.delete({
        where: { id },
      });

      sendItem(res, 200, {
        id,
        deleted: true,
        message: `Order '${id}' successfully deleted`,
      });
    } catch (err) {
      next(err);
    }
  }
);
