import { storage } from '@forge/api';

export interface TenantConfig {
  tenantId: string;
  name: string;
  projects: string[];
  quotas: { maxIncidents: number; maxStorage: number };
  features: string[];
}

/**
 * Tenant Manager
 * Multi-tenant workspace isolation
 */
export class TenantManager {
  static async getTenantConfig(tenantId: string): Promise<TenantConfig | null> {
    const tenants: TenantConfig[] = (await storage.get('tenants')) || [];
    return tenants.find(t => t.tenantId === tenantId) || null;
  }

  static async checkQuota(tenantId: string, resource: string): Promise<boolean> {
    const config = await this.getTenantConfig(tenantId);
    if (!config) return true;

    const usage = await storage.get(`tenant-${tenantId}-usage`) || { incidents: 0, storage: 0 };

    if (resource === 'incidents') {
      return usage.incidents < config.quotas.maxIncidents;
    }
    return true;
  }

  static async incrementUsage(tenantId: string, resource: string, amount: number = 1): Promise<void> {
    const usage = await storage.get(`tenant-${tenantId}-usage`) || { incidents: 0, storage: 0 };
    usage[resource] = (usage[resource] || 0) + amount;
    await storage.set(`tenant-${tenantId}-usage`, usage);
  }
}
