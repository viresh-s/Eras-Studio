interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory token bucket / sliding window storage
const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale records periodically to prevent memory leaks
const CLEANUP_INTERVAL_MS = 60 * 1000;
let lastCleanup = Date.now();

function purgeStaleRecords() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
}

export interface FriendlyRateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(
  optionsOrKey: RateLimitOptions | string,
  config?: FriendlyRateLimitConfig
): RateLimitResult {
  purgeStaleRecords();

  let key: string;
  let limit: number;
  let windowMs: number;

  if (typeof optionsOrKey === 'string') {
    key = optionsOrKey;
    limit = config?.maxRequests || 10;
    windowMs = (config?.windowSeconds || 60) * 1000;
  } else {
    key = optionsOrKey.key;
    limit = optionsOrKey.limit;
    windowMs = optionsOrKey.windowMs;
  }

  const now = Date.now();
  const existing = rateLimitStore.get(key);

  if (!existing || existing.resetAt <= now) {
    // New window
    const newRecord: RateLimitRecord = {
      count: 1,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(key, newRecord);
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: newRecord.resetAt,
      retryAfterSeconds: 0,
    };
  }

  // Existing window
  if (existing.count >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterSeconds,
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
    retryAfterSeconds: 0,
  };
}

/**
 * Asserts rate limit, throws error with retry delay if exceeded
 */
export function assertRateLimit(
  optionsOrKey: RateLimitOptions | string,
  configOrMessage?: FriendlyRateLimitConfig | string,
  customErrorMessage?: string
): void {
  let result: RateLimitResult;
  let message: string | undefined;

  if (typeof optionsOrKey === 'string' && typeof configOrMessage === 'object') {
    result = checkRateLimit(optionsOrKey, configOrMessage);
    message = customErrorMessage;
  } else {
    result = checkRateLimit(optionsOrKey as RateLimitOptions);
    message = typeof configOrMessage === 'string' ? configOrMessage : undefined;
  }

  if (!result.allowed) {
    const errorMsg =
      message ||
      `Rate limit exceeded. Please wait ${result.retryAfterSeconds} second(s) before retrying.`;
    throw new Error(errorMsg);
  }
}
