import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { sendCollection, sendItem, sendError } from '../lib/response';
import { validateRequest } from '../middleware/validate';
import {
  restaurantParamsSchema,
  listRestaurantsQuerySchema,
  nestedMenuQuerySchema,
} from '../schemas/restaurant.schema';
import { Prisma } from '@prisma/client';

export const restaurantRouter = Router();

// GET /api/v1/restaurants - List restaurants with filtering, sorting, cursor/offset paging
restaurantRouter.get(
  '/',
  validateRequest({ query: listRestaurantsQuerySchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { limit, cursor, offset, order, sort, search, cuisine, city, minRating, isOpen } = req.query as any;

      const where: Prisma.RestaurantWhereInput = {};
      if (search) {
        where.OR = [{ name: { contains: search } }, { city: { contains: search } }];
      }
      if (cuisine) {
        where.cuisine = { equals: cuisine };
      }
      if (city) {
        where.city = { equals: city };
      }
      if (minRating !== undefined) {
        where.rating = { gte: minRating };
      }
      if (isOpen !== undefined) {
        where.isOpen = isOpen;
      }

      const total = await prisma.restaurant.count({ where });

      const findArgs: Prisma.RestaurantFindManyArgs = {
        where,
        take: limit + 1, // take one extra to determine hasMore
        orderBy: [{ [sort]: order }, { id: order }],
      };

      if (cursor) {
        findArgs.cursor = { id: cursor };
        findArgs.skip = 1; // skip the cursor record itself
      } else if (offset !== undefined) {
        findArgs.skip = offset;
      }

      const items = await prisma.restaurant.findMany(findArgs);
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

// GET /api/v1/restaurants/:id - Get single restaurant
restaurantRouter.get(
  '/:id',
  validateRequest({ params: restaurantParamsSchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const restaurant = await prisma.restaurant.findUnique({
        where: { id },
        include: {
          _count: {
            select: { menuItems: true, orders: true },
          },
        },
      });

      if (!restaurant) {
        sendError(res, 404, 'NOT_FOUND', `Restaurant with ID '${id}' not found`);
        return;
      }

      sendItem(res, 200, restaurant);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/restaurants/:id/menu - Nested endpoint for restaurant menu items
restaurantRouter.get(
  '/:id/menu',
  validateRequest({ params: restaurantParamsSchema, query: nestedMenuQuerySchema }),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { limit, cursor, offset, order, sort, category, maxPrice, isAvailable } = req.query as any;

      // Verify restaurant exists first
      const restaurantExists = await prisma.restaurant.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!restaurantExists) {
        sendError(res, 404, 'NOT_FOUND', `Restaurant with ID '${id}' not found`);
        return;
      }

      const where: Prisma.MenuItemWhereInput = {
        restaurantId: id,
      };

      if (category) {
        where.category = { equals: category };
      }
      if (maxPrice !== undefined) {
        where.priceInCents = { lte: maxPrice };
      }
      if (isAvailable !== undefined) {
        where.isAvailable = isAvailable;
      }

      const total = await prisma.menuItem.count({ where });

      const findArgs: Prisma.MenuItemFindManyArgs = {
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
