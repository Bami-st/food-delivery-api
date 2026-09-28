import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { sendCollection, sendItem, sendError } from '../lib/response';
import { validateRequest } from '../middleware/validate';
import { menuItemParamsSchema, listMenuItemsQuerySchema } from '../schemas/menuItem.schema';
import { Prisma } from '@prisma/client';

export const menuItemRouter = Router();

// GET /api/v1/menu-items - List menu items across all restaurants
menuItemRouter.get(
  '/',
  validateRequest({ query: listMenuItemsQuerySchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { limit, cursor, offset, order, sort, restaurantId, category, minPrice, maxPrice, isAvailable } = req.query as any;

      const where: Prisma.MenuItemWhereInput = {};
      if (restaurantId) {
        where.restaurantId = { equals: restaurantId };
      }
      if (category) {
        where.category = { equals: category };
      }
      if (minPrice !== undefined || maxPrice !== undefined) {
        where.priceInCents = {};
        if (minPrice !== undefined) where.priceInCents.gte = minPrice;
        if (maxPrice !== undefined) where.priceInCents.lte = maxPrice;
      }
      if (isAvailable !== undefined) {
        where.isAvailable = isAvailable;
      }

      const total = await prisma.menuItem.count({ where });

      const findArgs: Prisma.MenuItemFindManyArgs = {
        where,
        take: limit + 1,
        orderBy: [{ [sort]: order }, { id: order }],
        include: {
          restaurant: {
            select: { id: true, name: true, cuisine: true, city: true },
          },
        },
      };

      if (cursor) {
        findArgs.cursor = { id: cursor };
        findArgs.skip = 1;
      } else if (offset !== undefined) {
        findArgs.skip = offset;
      }

      const items = await prisma.menuItem.findMany(findArgs);
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

// GET /api/v1/menu-items/:id - Get single menu item
menuItemRouter.get(
  '/:id',
  validateRequest({ params: menuItemParamsSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const item = await prisma.menuItem.findUnique({
        where: { id },
        include: {
          restaurant: true,
        },
      });

      if (!item) {
        sendError(res, 404, 'NOT_FOUND', `Menu item with ID '${id}' not found`);
        return;
      }

      sendItem(res, 200, item);
    } catch (err) {
      next(err);
    }
  }
);
