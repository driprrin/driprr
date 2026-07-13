import { Throttle } from '@nestjs/throttler';
import { applyDecorators } from '@nestjs/common';

/**
 * Stricter rate limit for authentication routes.
 * Limits to 5 requests per 60 seconds per IP to prevent
 * brute-force login/registration attacks.
 */
export function AuthThrottle() {
  return applyDecorators(Throttle({ default: { ttl: 60000, limit: 5 } }));
}
