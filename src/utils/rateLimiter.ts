import { storage } from '@forge/api';

interface RateLimitRecord {
  key: string;
  count: number;
  resetAt: number;
}

/**
 * Rate Limiter
 * Prevent API abuse and ensure fair usage
 */
export class RateLimiter {
  private static readonly LIMIT = 100; // requests per hour
  private static readonly WINDOW = 60 * 60 * 1000; // 1 hour

  static async checkLimit(key: string): Promise<{ allowed: boolean; remaining: number }> {
    const records: RateLimitRecord[] = (await storage.get('rate-limits')) || [];
    const now = Date.now();

    // Clean expired records
    const active = records.filter(r => r.resetAt > now);

    const record = active.find(r => r.key === key);

    if (!record) {
      active.push({ key, count: 1, resetAt: now + this.WINDOW });
      await storage.set('rate-limits', active);
      return { allowed: true, remaining: this.LIMIT - 1 };
    }

    if (record.count >= this.LIMIT) {
      return { allowed: false, remaining: 0 };
    }

    record.count++;
    await storage.set('rate-limits', active);
    return { allowed: true, remaining: this.LIMIT - record.count };
  }
}
