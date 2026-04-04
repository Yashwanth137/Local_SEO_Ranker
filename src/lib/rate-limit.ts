/**
 * Simple in-memory rate limiter for Next.js API routes.
 * 
 * Uses a sliding window approach per IP address.
 * NOTE: This resets on server restart and is per-instance only.
 * For production with multiple serverless instances, use Redis-based rate limiting.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const ipMap = new Map<string, RateLimitEntry>();

// Clean up stale entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of ipMap) {
    if (now > entry.resetTime) {
      ipMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitConfig {
  /** Max requests allowed within the window */
  maxRequests: number;
  /** Time window in seconds */
  windowSeconds: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Check if a request from the given IP is allowed.
 * 
 * @example
 * ```ts
 * const ip = req.headers.get('x-forwarded-for') || 'unknown';
 * const result = checkRateLimit(ip, { maxRequests: 10, windowSeconds: 60 });
 * if (!result.allowed) {
 *   return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
 * }
 * ```
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const entry = ipMap.get(identifier);

  // No existing record or window has expired — allow and create new entry
  if (!entry || now > entry.resetTime) {
    ipMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetInSeconds: config.windowSeconds,
    };
  }

  // Within the window — check the count
  if (entry.count < config.maxRequests) {
    entry.count++;
    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetInSeconds: Math.ceil((entry.resetTime - now) / 1000),
    };
  }

  // Rate limit exceeded
  return {
    allowed: false,
    remaining: 0,
    resetInSeconds: Math.ceil((entry.resetTime - now) / 1000),
  };
}

/**
 * Extract client IP from a Next.js Request object.
 * Checks x-forwarded-for (Vercel/proxy) first, then falls back.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  return 'unknown';
}
