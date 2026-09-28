import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { sendCollection, sendItem, sendError } from '../lib/response';
import { validateRequest } from '../middleware/validate';
import { customerParamsSchema, listCustomersQuerySchema } from '../schemas/customer.schema';
import { Prisma } from '@prisma/client';

export const customerRouter = Router();

// GET /api/v1/customers - List customers with filtering, sorting, cursor/offset paging
customerRouter.get(
  '/',
  validateRequest({ query: listCustomersQuerySchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { limit, cursor, offset, order, sort, search, city } = req.query as any;

      const where: Prisma.CustomerWhereInput = {};
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { email: { contains: search } },
        ];
      }
      if (city) {
        where.deliveryAddress = { contains: city };
      }

      const total = await prisma.customer.count({ where });

      const findArgs: Prisma.CustomerFindManyArgs = {
        where,
        take: limit + 1,
        orderBy: [{ [sort]: order }, { id: order }],
      };

      if (cursor) {
        findArgs.cursor = { id: cursor };
        findArgs.skip = 1;
      } else if (offset !== undefined) {
        findArgs.skip = offset;
      }

      const items = await prisma.customer.findMany(findArgs);
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

// GET /api/v1/customers/:id - Get single customer
customerRouter.get(
  '/:id',
  validateRequest({ params: customerParamsSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
          _count: {
            select: { orders: true },
          },
        },
      });

      if (!customer) {
        sendError(res, 404, 'NOT_FOUND', `Customer with ID '${id}' not found`);
        return;
      }

      sendItem(res, 200, customer);
    } catch (err) {
      next(err);
    }
  }
);
