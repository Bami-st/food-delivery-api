import { createApp } from './app';
import { config } from './config';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`🚀 Food Delivery API is running on http://localhost:${config.port}`);
  console.log(`📡 Base API URL: http://localhost:${config.port}/api/v1`);
  console.log(`🛡️ Rate Limiting: ${config.rateLimit.maxRequests} requests / ${config.rateLimit.windowMs / 1000}s`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
