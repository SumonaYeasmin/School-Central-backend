// src/shared/cache.service.ts

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class InMemoryCache {
  private static store = new Map<string, CacheEntry<any>>();

  /**
   * Get cached item if it exists and has not expired
   */
  static get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Store item with TTL in seconds (default 180s / 3 mins)
   */
  static set<T>(key: string, value: T, ttlSeconds: number = 180): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Invalidate exact key or pattern match (e.g., 'teachers:*')
   */
  static invalidate(pattern: string): void {
    if (pattern.includes('*')) {
      const prefix = pattern.replace('*', '');
      for (const key of this.store.keys()) {
        if (key.startsWith(prefix)) {
          this.store.delete(key);
        }
      }
    } else {
      this.store.delete(pattern);
    }
  }

  /**
   * Clear all cache
   */
  static clear(): void {
    this.store.clear();
  }
}
