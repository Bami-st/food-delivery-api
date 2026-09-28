import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import { apiRateLimiter } from './middleware/rateLimiter';
import { notFoundHandler, globalErrorHandler } from './middleware/errorHandler';
import { restaurantRouter } from './routes/restaurant.routes';
import { menuItemRouter } from './routes/menuItem.routes';
import { customerRouter } from './routes/customer.routes';
import { orderRouter } from './routes/order.routes';

export function createApp(): Express {
  const app = express();

  // Security and common middlewares
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        fontSrc: ["'self'"],
        // The client can be pointed at another API origin from the UI, so
        // same-origin-only would break a documented feature.
        connectSrc: ["'self'", 'http:', 'https:'],
        upgradeInsecureRequests: null,
      },
    },
    crossOriginEmbedderPolicy: false,
  }));
  app.use(cors());
  app.use(express.json());

  // Serve static consumer client (Stage 8)
  app.use(express.static(path.join(__dirname, '../public')));

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Apply rate limiting to all /api/ endpoints (Stage 5)
  app.use('/api', apiRateLimiter);

  // REST API v1 Routes
  const apiV1Router = express.Router();
  apiV1Router.use('/restaurants', restaurantRouter);
  apiV1Router.use('/menu-items', menuItemRouter);
  apiV1Router.use('/customers', customerRouter);
  apiV1Router.use('/orders', orderRouter);

  app.use('/api/v1', apiV1Router);

  // 404 handler for API routes
  app.use(notFoundHandler);

  // Global unhandled error handler
  app.use(globalErrorHandler);

  return app;
}
