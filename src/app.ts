import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { apiRateLimiter } from './middleware/rateLimiter';
import { notFoundHandler, globalErrorHandler } from './middleware/errorHandler';
import { restaurantRouter } from './routes/restaurant.routes';
import { menuItemRouter } from './routes/menuItem.routes';
import { customerRouter } from './routes/customer.routes';
import { orderRouter } from './routes/order.routes';

export function createApp(): Express {
  const app = express();

  // Security and common middlewares
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  // Apply rate limiting to all /api/ endpoints (Stage 5)
  app.use('/api', apiRateLimiter);

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // REST API v1 Routes
  const apiV1Router = express.Router();
  apiV1Router.use('/restaurants', restaurantRouter);
  apiV1Router.use('/menu-items', menuItemRouter);
  apiV1Router.use('/customers', customerRouter);
  apiV1Router.use('/orders', orderRouter);

  app.use('/api/v1', apiV1Router);

  // 404 handler
  app.use(notFoundHandler);

  // Global unhandled error handler
  app.use(globalErrorHandler);

  return app;
}
