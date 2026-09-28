import rateLimit from 'express-rate-limit';
import { config } from '../config';
import { sendError } from '../lib/response';

export const apiRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true, // draft-6 / draft-7 RateLimit-* headers
  legacyHeaders: false, // X-RateLimit-* headers
  handler: (req, res) => {
    // Return honest 429 with standard error envelope
    res.setHeader('Retry-After', Math.ceil(config.rateLimit.windowMs / 1000));
    sendError(
      res,
      429,
      'RATE_LIMIT_EXCEEDED',
      `Too many requests. Limit is ${config.rateLimit.maxRequests} requests per ${config.rateLimit.windowMs / 1000} seconds.`
    );
  },
});
