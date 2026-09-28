import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { config } from '../config';
import { sendError } from '../lib/response';

// In-Memory Express Rate Limiter fallback
const localLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.setHeader('Retry-After', Math.ceil(config.rateLimit.windowMs / 1000));
    sendError(
      res,
      429,
      'RATE_LIMIT_EXCEEDED',
      `Too many requests. Limit is ${config.rateLimit.maxRequests} requests per ${config.rateLimit.windowMs / 1000} seconds.`
    );
  },
});

// Upstash Redis instance (if configured for Vercel Serverless)
let upstashRatelimit: Ratelimit | null = null;
if (config.upstash.url && config.upstash.token) {
  try {
    const redis = new Redis({
      url: config.upstash.url,
      token: config.upstash.token,
    });
    upstashRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        config.rateLimit.maxRequests,
        `${Math.ceil(config.rateLimit.windowMs / 1000)} s` as any
      ),
      analytics: true,
      prefix: '@food-delivery/ratelimit',
    });
  } catch (err) {
    console.warn('Could not initialize Upstash Ratelimit, falling back to local memory limiter:', err);
  }
}

export async function apiRateLimiter(req: Request, res: Response, next: NextFunction): Promise<void> {
  // If Upstash Redis is active (Vercel Serverless)
  if (upstashRatelimit) {
    try {
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '127.0.0.1';
      const { success, limit, remaining, reset } = await upstashRatelimit.limit(ip);

      res.setHeader('RateLimit-Limit', limit);
      res.setHeader('RateLimit-Remaining', remaining);
      res.setHeader('RateLimit-Reset', reset);

      if (!success) {
        const retryAfterSeconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
        res.setHeader('Retry-After', retryAfterSeconds);
        sendError(
          res,
          429,
          'RATE_LIMIT_EXCEEDED',
          `Too many requests. Limit is ${config.rateLimit.maxRequests} requests per ${config.rateLimit.windowMs / 1000} seconds.`
        );
        return;
      }
      next();
      return;
    } catch (err) {
      // Fail open or fallback to localLimiter on redis network failure
      console.error('Upstash rate limit error, falling back:', err);
    }
  }

  // Fallback to Express memory limiter
  localLimiter(req, res, next);
}
