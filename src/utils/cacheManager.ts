import { storage } from '@forge/api';

interface CacheEntry {
  key: string;
  value: any;
  expiresAt: number;
}

/**
 * Cache Manager
 * In-memory caching for external API calls
 */
export class CacheManager {
  private static readonly DEFAULT_TTL = 15 * 60 * 1000; // 15 minutes

  static async get(key: string): Promise<any | null> {
    try {
      const cache: CacheEntry[] = (await storage.get('cache')) || [];
      const entry = cache.find(e => e.key === key);

      if (!entry || entry.expiresAt < Date.now()) {
        return null;
      }

      console.warn(`[Cache] HIT: ${key}`);
      return entry.value;
    } catch (error) {
      console.error('[Cache] Get failed:', error);
      return null;
    }
  }

  static async set(key: string, value: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      const cache: CacheEntry[] = (await storage.get('cache')) || [];
      const now = Date.now();

      // Remove expired and matching key entries
      const cleaned = cache.filter(e => e.key !== key && e.expiresAt > now);

      cleaned.push({
        key,
        value,
        expiresAt: now + ttl,
      });

      // Keep cache size reasonable
      await storage.set('cache', cleaned.slice(-100));
      console.warn(`[Cache] SET: ${key} (TTL: ${ttl}ms)`);
    } catch (error) {
      console.error('[Cache] Set failed:', error);
    }
  }

  static async clear(pattern?: string): Promise<void> {
    try {
      const cache: CacheEntry[] = (await storage.get('cache')) || [];

      if (!pattern) {
        await storage.set('cache', []);
        console.warn('[Cache] Cleared all');
        return;
      }

      const filtered = cache.filter(e => !e.key.includes(pattern));
      await storage.set('cache', filtered);
      console.warn(`[Cache] Cleared pattern: ${pattern}`);
    } catch (error) {
      console.error('[Cache] Clear failed:', error);
    }
  }
}
