/**
 * High-performance TTL Cache with automatic memory expiration.
 * Protects MySQL from repeated heavy aggregation queries (e.g. Leaderboard, Practice Problems)
 * under high concurrent traffic (500+ users).
 */

class MemoryCache {
  constructor(defaultTtlMs = 60000, maxEntries = 500) {
    this.cache = new Map();
    this.defaultTtlMs = defaultTtlMs;
    this.maxEntries = maxEntries;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  set(key, value, ttlSeconds) {
    const ttlMs = (ttlSeconds ? ttlSeconds * 1000 : this.defaultTtlMs);

    // Evict oldest entries if cache exceeds max capacity to prevent memory bloat
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlMs,
    });
  }

  invalidate(prefix = '') {
    if (!prefix) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  async getOrSet(key, ttlSeconds, fetchFn) {
    const cached = this.get(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const fresh = await fetchFn();
    if (fresh !== null && fresh !== undefined) {
      this.set(key, fresh, ttlSeconds);
    }
    return fresh;
  }
}

export const appCache = new MemoryCache();
export default appCache;

