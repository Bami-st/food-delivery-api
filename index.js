const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const Joi = require('joi');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware
app.set('trust proxy', 1); // Trust first proxy (important for rate limiting behind a reverse proxy/CDN)
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate Limiting Config
const RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS ? parseInt(process.env.RATE_LIMIT_WINDOW_MS) : 60000;
const RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX) : 100;

const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    res.status(429).json({
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'You have exceeded the rate limit. Please try again later.'
      }
    });
  }
});
app.use('/api', apiLimiter);

// Consistent Response Envelopes
const sendSuccess = (res, data, meta = null, statusCode = 200) => {
  const payload = { data };
  if (meta) payload.meta = meta;
  res.status(statusCode).json(payload);
};

const sendError = (res, statusCode, code, message) => {
  res.status(statusCode).json({ error: { code, message } });
};

// Pagination Helper (Offset based)
const getPaginationOptions = (req) => {
  let limit = parseInt(req.query.limit);
  if (isNaN(limit)) limit = 20;
  if (limit > 100) limit = 100;
  if (limit < 0) throw new Error('NEGATIVE_LIMIT'); // Reject negative limits with 400, consistent with negative offset

  let offset = parseInt(req.query.offset);
  if (isNaN(offset)) offset = 0;
  if (offset < 0) throw new Error('NEGATIVE_OFFSET');

  return { limit, offset };
};

const buildMeta = (limit, offset, totalCount) => ({
  totalCount,
  limit,
  offset,
  hasNextPage: offset + limit < totalCount
});

// Common Validator Helpers
const validateOr400 = (schema, data, res) => {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) {
    const message = error.details.map(d => d.message).join(', ');
    sendError(res, 400, 'VALIDATION_ERROR', message);
    return null;
  }
  return value;
};

// --- ENDPOINTS ---
const router = express.Router();

// 1. Restaurants
router.get('/restaurants', async (req, res, next) => {
  try {
    let pagination;
    try { pagination = getPaginationOptions(req); } catch(e) {
      if (e.message === 'NEGATIVE_LIMIT') return sendError(res, 400, 'INVALID_PAGINATION', 'Limit cannot be negative');
      return sendError(res, 400, 'INVALID_PAGINATION', 'Offset cannot be negative');
    }
    const { limit, offset } = pagination;

    // Filtering & Sorting
    const schema = Joi.object({
      name: Joi.string().optional(),
      address: Joi.string().optional(),
      sort: Joi.string().valid('name', 'createdAt').default('createdAt'),
      order: Joi.string().valid('asc', 'desc').default('desc'),
      limit: Joi.any(), offset: Joi.any()
    });
    const query = validateOr400(schema, req.query, res);
    if (!query) return;

    const where = {};
    if (query.name) where.name = { contains: query.name };
    if (query.address) where.address = { contains: query.address };

    const [data, totalCount] = await Promise.all([
      prisma.restaurant.findMany({ where, take: limit, skip: offset, orderBy: [{ [query.sort]: query.order }, { id: 'asc' }] }),
      prisma.restaurant.count({ where })
    ]);

    sendSuccess(res, data, buildMeta(limit, offset, totalCount));
  } catch (error) { next(error); }
});

router.get('/restaurants/:id', async (req, res, next) => {
  try {
    const restaurant = await prisma.restaurant.findUnique({ where: { id: req.params.id } });
    if (!restaurant) return sendError(res, 404, 'NOT_FOUND', 'Restaurant not found');
    sendSuccess(res, restaurant);
  } catch (error) { next(error); }
});

router.get('/restaurants/:id/menu-items', async (req, res, next) => {
  try {
    let pagination;
    try { pagination = getPaginationOptions(req); } catch(e) {
      if (e.message === 'NEGATIVE_LIMIT') return sendError(res, 400, 'INVALID_PAGINATION', 'Limit cannot be negative');
      return sendError(res, 400, 'INVALID_PAGINATION', 'Offset cannot be negative');
    }
    const { limit, offset } = pagination;

    const restaurant = await prisma.restaurant.findUnique({ where: { id: req.params.id } });
    if (!restaurant) return sendError(res, 404, 'NOT_FOUND', 'Restaurant not found');

    const schema = Joi.object({
      isAvailable: Joi.boolean().optional(),
      sort: Joi.string().valid('name', 'priceCents').default('name'),
      order: Joi.string().valid('asc', 'desc').default('asc'),
      limit: Joi.any(), offset: Joi.any()
    });
    const query = validateOr400(schema, req.query, res);
    if (!query) return;

    const where = { restaurantId: req.params.id };
    if (query.isAvailable !== undefined) where.isAvailable = query.isAvailable;

    const [data, totalCount] = await Promise.all([
      prisma.menuItem.findMany({ where, take: limit, skip: offset, orderBy: [{ [query.sort]: query.order }, { id: 'asc' }] }),
      prisma.menuItem.count({ where })
    ]);

    sendSuccess(res, data, buildMeta(limit, offset, totalCount));
  } catch (error) { next(error); }
});

// 2. Menu Items
router.get('/menu-items', async (req, res, next) => {
  try {
    let pagination;
    try { pagination = getPaginationOptions(req); } catch(e) {
      if (e.message === 'NEGATIVE_LIMIT') return sendError(res, 400, 'INVALID_PAGINATION', 'Limit cannot be negative');
      return sendError(res, 400, 'INVALID_PAGINATION', 'Offset cannot be negative');
    }
    const { limit, offset } = pagination;

    const schema = Joi.object({
      name: Joi.string().optional(),
      isAvailable: Joi.boolean().optional(),
      sort: Joi.string().valid('name', 'priceCents').default('name'),
      order: Joi.string().valid('asc', 'desc').default('asc'),
      limit: Joi.any(), offset: Joi.any()
    });
    const query = validateOr400(schema, req.query, res);
    if (!query) return;

    const where = {};
    if (query.name) where.name = { contains: query.name };
    if (query.isAvailable !== undefined) where.isAvailable = query.isAvailable;

    const [data, totalCount] = await Promise.all([
      prisma.menuItem.findMany({ where, take: limit, skip: offset, orderBy: [{ [query.sort]: query.order }, { id: 'asc' }] }),
      prisma.menuItem.count({ where })
    ]);

    sendSuccess(res, data, buildMeta(limit, offset, totalCount));
  } catch (error) { next(error); }
});

router.get('/menu-items/:id', async (req, res, next) => {
  try {
    const item = await prisma.menuItem.findUnique({ where: { id: req.params.id } });
    if (!item) return sendError(res, 404, 'NOT_FOUND', 'Menu item not found');
    sendSuccess(res, item);
  } catch (error) { next(error); }
});

// 3. Customers
router.get('/customers', async (req, res, next) => {
  try {
    let pagination;
    try { pagination = getPaginationOptions(req); } catch(e) {
      if (e.message === 'NEGATIVE_LIMIT') return sendError(res, 400, 'INVALID_PAGINATION', 'Limit cannot be negative');
      return sendError(res, 400, 'INVALID_PAGINATION', 'Offset cannot be negative');
    }
    const { limit, offset } = pagination;

    const schema = Joi.object({
      firstName: Joi.string().optional(),
      email: Joi.string().optional(),
      sort: Joi.string().valid('firstName', 'createdAt').default('createdAt'),
      order: Joi.string().valid('asc', 'desc').default('desc'),
      limit: Joi.any(), offset: Joi.any()
    });
    const query = validateOr400(schema, req.query, res);
    if (!query) return;

    const where = {};
    if (query.firstName) where.firstName = { contains: query.firstName };
    if (query.email) where.email = query.email;

    const [data, totalCount] = await Promise.all([
      prisma.customer.findMany({ where, take: limit, skip: offset, orderBy: [{ [query.sort]: query.order }, { id: 'asc' }] }),
      prisma.customer.count({ where })
    ]);

    sendSuccess(res, data, buildMeta(limit, offset, totalCount));
  } catch (error) { next(error); }
});

router.get('/customers/:id', async (req, res, next) => {
  try {
    const customer = await prisma.customer.findUnique({ where: { id: req.params.id } });
    if (!customer) return sendError(res, 404, 'NOT_FOUND', 'Customer not found');
    sendSuccess(res, customer);
  } catch (error) { next(error); }
});

// 4. Orders
router.get('/orders', async (req, res, next) => {
  try {
    let pagination;
    try { pagination = getPaginationOptions(req); } catch(e) {
      if (e.message === 'NEGATIVE_LIMIT') return sendError(res, 400, 'INVALID_PAGINATION', 'Limit cannot be negative');
      return sendError(res, 400, 'INVALID_PAGINATION', 'Offset cannot be negative');
    }
    const { limit, offset } = pagination;

    const schema = Joi.object({
      status: Joi.string().optional(),
      customerId: Joi.string().optional(),
      sort: Joi.string().valid('createdAt', 'totalPriceCents').default('createdAt'),
      order: Joi.string().valid('asc', 'desc').default('desc'),
      limit: Joi.any(), offset: Joi.any()
    });
    const query = validateOr400(schema, req.query, res);
    if (!query) return;

    const where = {};
    if (query.status) where.status = query.status;
    if (query.customerId) where.customerId = query.customerId;

    const [data, totalCount] = await Promise.all([
      prisma.order.findMany({ 
        where, 
        take: limit, 
        skip: offset, 
        orderBy: [{ [query.sort]: query.order }, { id: 'asc' }],
        include: { orderItems: true } // Include nested items for convenience
      }),
      prisma.order.count({ where })
    ]);

    sendSuccess(res, data, buildMeta(limit, offset, totalCount));
  } catch (error) { next(error); }
});

router.get('/orders/:id', async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({ 
      where: { id: req.params.id },
      include: { orderItems: true }
    });
    if (!order) return sendError(res, 404, 'NOT_FOUND', 'Order not found');
    sendSuccess(res, order);
  } catch (error) { next(error); }
});

router.post('/orders', async (req, res, next) => {
  try {
    const schema = Joi.object({
      customerId: Joi.string().uuid().required(),
      restaurantId: Joi.string().uuid().required(),
      items: Joi.array().items(Joi.object({
        menuItemId: Joi.string().uuid().required(),
        quantity: Joi.number().integer().min(1).required()
      })).min(1).required()
    });

    const { error, value: body } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const message = error.details.map(d => d.message).join(', ');
      return sendError(res, 422, 'UNPROCESSABLE_ENTITY', message);
    }

    const { customerId, restaurantId, items } = body;

    // Validations: check customer exists, restaurant exists, items exist and belong to restaurant
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) return sendError(res, 422, 'INVALID_REFERENCE', 'Customer does not exist');

    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) return sendError(res, 422, 'INVALID_REFERENCE', 'Restaurant does not exist');

    const menuItemIds = items.map(i => i.menuItemId);

    // Reject duplicate menuItemId entries upfront — combining quantities silently would
    // hide client mistakes; a clear 422 tells callers to deduplicate before retrying.
    const uniqueMenuItemIds = new Set(menuItemIds);
    if (uniqueMenuItemIds.size !== menuItemIds.length) {
      return sendError(res, 422, 'DUPLICATE_ITEM', 'Duplicate menuItemId entries are not allowed. Each menu item may only appear once per order.');
    }

    const menuItems = await prisma.menuItem.findMany({ where: { id: { in: menuItemIds } } });

    if (menuItems.length !== uniqueMenuItemIds.size) {
      return sendError(res, 422, 'INVALID_REFERENCE', 'One or more menu items do not exist');
    }

    let totalPriceCents = 0;
    const orderItemsData = items.map(reqItem => {
      const dbItem = menuItems.find(m => m.id === reqItem.menuItemId);
      if (dbItem.restaurantId !== restaurantId) {
        throw { status: 422, code: 'INVALID_REFERENCE', message: `Menu item ${dbItem.id} does not belong to restaurant ${restaurantId}` };
      }
      totalPriceCents += dbItem.priceCents * reqItem.quantity;
      return {
        menuItemId: dbItem.id,
        quantity: reqItem.quantity,
        priceAtOrderCents: dbItem.priceCents,
        currency: dbItem.currency
      };
    });

    // Atomic transaction for order creation
    const newOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          customerId,
          restaurantId,
          totalPriceCents,
          currency: menuItems[0].currency, // assuming uniform currency
          orderItems: {
            create: orderItemsData
          }
        },
        include: { orderItems: true }
      });
      return order;
    });

    sendSuccess(res, newOrder, null, 201);
  } catch (error) {
    if (error.status) return sendError(res, error.status, error.code, error.message);
    next(error);
  }
});

router.patch('/orders/:id', async (req, res, next) => {
  try {
    const schema = Joi.object({
      status: Joi.string().valid('pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'cancelled').required()
    });
    const body = validateOr400(schema, req.body, res);
    if (!body) return;

    const existingOrder = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!existingOrder) return sendError(res, 404, 'NOT_FOUND', 'Order not found');

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: body.status },
      include: { orderItems: true }
    });
    sendSuccess(res, updated);
  } catch (error) { next(error); }
});

router.delete('/orders/:id', async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return sendError(res, 404, 'NOT_FOUND', 'Order not found');
    
    if (order.status !== 'pending') {
      return sendError(res, 422, 'UNPROCESSABLE_ENTITY', 'Only pending orders can be deleted');
    }

    await prisma.order.delete({ where: { id: req.params.id } });
    sendSuccess(res, { deleted: true }, null, 200);
  } catch (error) { next(error); }
});

app.use('/api/v1', router);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  
  if (err.name === 'PrismaClientKnownRequestError') {
    // Handling bad UUID format for parameters like :id
    if (err.code === 'P2023') { // P2023: Inconsistent column data (e.g. malformed UUID)
      return sendError(res, 400, 'BAD_REQUEST', 'Malformed identifier in request');
    }
    // Record not found
    if (err.code === 'P2025') {
      return sendError(res, 404, 'NOT_FOUND', 'Record not found');
    }
  }

  sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred.');
});

// 404 for unknown routes
app.use((req, res) => {
  sendError(res, 404, 'NOT_FOUND', 'Endpoint not found');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
