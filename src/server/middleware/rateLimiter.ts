import rateLimit from 'express-rate-limit';

/**
 * Authentication endpoint rate limiter to prevent credential stuffing and brute-force attacks.
 * Limits each IP to 10 requests per 15-minute window.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 requests per window
  standardHeaders: true, // Return standard RateLimit headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  message: {
    error: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  skip: () => process.env.NODE_ENV === 'test' && !process.env.TEST_RATE_LIMIT,
});

/**
 * AI Assistant endpoint rate limiter to prevent abuse and excessive compute load.
 * Limits each client to 30 requests per 15-minute window.
 */
export const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many AI Assistant requests. Please wait a few moments before trying again.',
  },
  skip: () => process.env.NODE_ENV === 'test' && !process.env.TEST_RATE_LIMIT,
});

