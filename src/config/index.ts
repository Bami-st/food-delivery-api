import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  
  // Rate Limiting (Stage 5)
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10), // 100 requests per minute
  },

  // Pagination (Stage 3 & Stage 5)
  pagination: {
    defaultLimit: parseInt(process.env.PAGINATION_DEFAULT_LIMIT || '20', 10),
    maxLimit: parseInt(process.env.PAGINATION_MAX_LIMIT || '100', 10),
  },
};
