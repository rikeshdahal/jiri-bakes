/**
 * Minimal in-memory sliding-window rate limiter.
 *
 * NOTE: state is per server instance. Good enough for a single-region
 * deployment and for self-hosted Next on one box. For a multi-instance
 * fleet, move this to Redis.
 */

const buckets = new Map<string, number[]>();

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds?: number;
}

export function slidingWindowRateLimit(
  key: string,
  limit = 10,
  windowMs = 10 * 60 * 1000,
): RateLimitResult {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);

  if (hits.length >= limit) {
    buckets.set(key, hits);
    const retryAfterSeconds = Math.max(1, Math.ceil((hits[0] + windowMs - now) / 1000));
    return { ok: false, retryAfterSeconds };
  }

  hits.push(now);
  buckets.set(key, hits);
  return { ok: true };
}

/** Best-effort cleanup so the map never grows without bound. */
export function pruneRateLimitBuckets(now = Date.now()): void {
  for (const [key, hits] of buckets) {
    const live = hits.filter((t) => now - t < 10 * 60 * 1000);
    if (live.length === 0) buckets.delete(key);
    else buckets.set(key, live);
  }
}

// Opportunistic pruning once an hour.
const timer = setInterval(() => pruneRateLimitBuckets(), 60 * 60 * 1000);
timer.unref?.();
