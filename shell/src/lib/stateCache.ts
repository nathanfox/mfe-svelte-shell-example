import type { CacheOptions, MfeCache } from '../types/mfe';

interface CacheEntry<T> {
  value: T;
  expiresAt: number | null;
  version?: number;
}

class StateCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private maxSize = 50;
  private defaultTtl = 5 * 60 * 1000; // 5 minutes

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T, options?: CacheOptions): void {
    // Enforce size limit (LRU-style: remove oldest)
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    const ttl = options?.ttl ?? this.defaultTtl;
    this.cache.set(key, {
      value,
      expiresAt: ttl > 0 ? Date.now() + ttl : null,
      version: options?.version,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  // Create a namespaced cache for a specific MFE
  forMfe(mfeId: string): MfeCache {
    const prefix = `${mfeId}:`;
    return {
      get: <T>(key: string) => this.get<T>(`${prefix}${key}`),
      set: <T>(key: string, value: T, options?: CacheOptions) =>
        this.set(`${prefix}${key}`, value, options),
      clear: () => {
        for (const key of this.cache.keys()) {
          if (key.startsWith(prefix)) {
            this.cache.delete(key);
          }
        }
      },
    };
  }
}

export const stateCache = new StateCache();
