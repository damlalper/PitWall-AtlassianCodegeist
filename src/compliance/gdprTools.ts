import { storage } from '@forge/api';
import { AuditLogger } from '../utils/auditLogger';

/**
 * Personal Data Type
 */
export type PersonalDataType = 'email' | 'name' | 'ip_address' | 'user_id' | 'assignee' | 'custom';

/**
 * Data Subject Request Type
 */
export type DataSubjectRequestType = 'access' | 'deletion' | 'portability' | 'rectification';

/**
 * Personal Data Record
 */
export interface PersonalDataRecord {
  dataType: PersonalDataType;
  value: string;
  location: string; // Storage key or field path
  collectedAt: string;
  purpose: string;
}

/**
 * Data Subject Request
 */
export interface DataSubjectRequest {
  id: string;
  type: DataSubjectRequestType;
  userId: string;
  email: string;
  requestedAt: string;
  completedAt?: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  results?: any;
}

/**
 * Anonymization Result
 */
export interface AnonymizationResult {
  recordsProcessed: number;
  recordsAnonymized: number;
  storageKeysUpdated: string[];
  completedAt: string;
}

/**
 * GDPR Compliance Tools
 * Data privacy, anonymization, and subject rights management
 */
export class GDPRTools {
  private static readonly DSR_STORAGE_KEY = 'gdpr-requests';
  private static readonly RETENTION_DAYS = 90; // Default retention period

  /**
   * Submit a Data Subject Request (DSR)
   */
  static async submitRequest(
    type: DataSubjectRequestType,
    userId: string,
    email: string
  ): Promise<string> {
    try {
      const request: DataSubjectRequest = {
        id: `dsr-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        type,
        userId,
        email,
        requestedAt: new Date().toISOString(),
        status: 'pending',
      };

      const requests: DataSubjectRequest[] = (await storage.get(this.DSR_STORAGE_KEY)) || [];
      requests.push(request);
      await storage.set(this.DSR_STORAGE_KEY, requests);

      // Audit log
      await AuditLogger.log({
        action: 'gdpr_request',
        actor: userId,
        resource: request.id,
        resourceType: 'system',
        status: 'success',
        metadata: { type, email },
      });

      console.warn(`[GDPR Tools] 📋 New DSR: ${request.id} (${type} for ${email})`);
      return request.id;
    } catch (error) {
      console.error('[GDPR Tools] ❌ Failed to submit request:', error);
      throw error;
    }
  }

  /**
   * Process a Data Subject Request
   */
  static async processRequest(requestId: string): Promise<DataSubjectRequest> {
    try {
      const requests: DataSubjectRequest[] = (await storage.get(this.DSR_STORAGE_KEY)) || [];
      const request = requests.find((r) => r.id === requestId);

      if (!request) {
        throw new Error(`Request not found: ${requestId}`);
      }

      request.status = 'processing';
      await storage.set(this.DSR_STORAGE_KEY, requests);

      let results: any;

      switch (request.type) {
        case 'access':
          results = await this.handleAccessRequest(request.userId);
          break;
        case 'deletion':
          results = await this.handleDeletionRequest(request.userId);
          break;
        case 'portability':
          results = await this.handlePortabilityRequest(request.userId);
          break;
        case 'rectification':
          results = await this.handleRectificationRequest(request.userId);
          break;
      }

      request.status = 'completed';
      request.completedAt = new Date().toISOString();
      request.results = results;

      await storage.set(this.DSR_STORAGE_KEY, requests);

      // Audit log
      await AuditLogger.log({
        action: 'gdpr_request_completed',
        actor: 'system',
        resource: requestId,
        resourceType: 'system',
        status: 'success',
        metadata: { type: request.type, userId: request.userId },
      });

      console.warn(`[GDPR Tools] ✅ Completed DSR: ${requestId}`);
      return request;
    } catch (error) {
      console.error('[GDPR Tools] ❌ Failed to process request:', error);

      const requests: DataSubjectRequest[] = (await storage.get(this.DSR_STORAGE_KEY)) || [];
      const request = requests.find((r) => r.id === requestId);
      if (request) {
        request.status = 'rejected';
        await storage.set(this.DSR_STORAGE_KEY, requests);
      }

      throw error;
    }
  }

  /**
   * Handle Right to Access request
   */
  private static async handleAccessRequest(userId: string): Promise<PersonalDataRecord[]> {
    const personalData: PersonalDataRecord[] = [];

    // Search across all storage keys for user data
    const storageKeys = [
      'incident-metrics',
      'mttr-records',
      'audit-logs',
      'detected-patterns',
      'error-logs',
    ];

    for (const key of storageKeys) {
      const data: any[] = (await storage.get(key)) || [];

      data.forEach((item) => {
        // Check for user-related fields
        if (item.assignee && item.assignee === userId) {
          personalData.push({
            dataType: 'assignee',
            value: item.assignee,
            location: `${key}.assignee`,
            collectedAt: item.timestamp || item.createdAt || 'Unknown',
            purpose: 'Incident assignment and tracking',
          });
        }

        if (item.actor && item.actor === userId) {
          personalData.push({
            dataType: 'user_id',
            value: item.actor,
            location: `${key}.actor`,
            collectedAt: item.timestamp || 'Unknown',
            purpose: 'Audit trail and action tracking',
          });
        }
      });
    }

    return personalData;
  }

  /**
   * Handle Right to Erasure (Deletion) request
   */
  private static async handleDeletionRequest(userId: string): Promise<AnonymizationResult> {
    const result: AnonymizationResult = {
      recordsProcessed: 0,
      recordsAnonymized: 0,
      storageKeysUpdated: [],
      completedAt: new Date().toISOString(),
    };

    const storageKeys = [
      'incident-metrics',
      'mttr-records',
      'audit-logs',
      'detected-patterns',
      'error-logs',
    ];

    for (const key of storageKeys) {
      const data: any[] = (await storage.get(key)) || [];
      let modified = false;

      data.forEach((item) => {
        result.recordsProcessed++;

        // Anonymize user-related fields
        if (item.assignee === userId) {
          item.assignee = this.anonymize(item.assignee);
          result.recordsAnonymized++;
          modified = true;
        }

        if (item.actor === userId) {
          item.actor = this.anonymize(item.actor);
          result.recordsAnonymized++;
          modified = true;
        }
      });

      if (modified) {
        await storage.set(key, data);
        result.storageKeysUpdated.push(key);
      }
    }

    return result;
  }

  /**
   * Handle Right to Data Portability request
   */
  private static async handlePortabilityRequest(userId: string): Promise<any> {
    const personalData = await this.handleAccessRequest(userId);

    // Format data for export (JSON format)
    return {
      userId,
      exportedAt: new Date().toISOString(),
      dataRecords: personalData,
      format: 'JSON',
      version: '1.0',
    };
  }

  /**
   * Handle Right to Rectification request
   */
  private static async handleRectificationRequest(userId: string): Promise<any> {
    // This would typically update incorrect personal data
    // For now, return instructions for manual rectification
    return {
      message: 'Rectification requests require manual review',
      userId,
      instructions: 'Contact system administrator to update personal information',
    };
  }

  /**
   * Anonymize personal data
   */
  static anonymize(value: string): string {
    // Generate consistent anonymous identifier
    const hash = this.simpleHash(value);
    return `anonymous-${hash.substring(0, 8)}`;
  }

  /**
   * Simple hash function for consistent anonymization
   */
  private static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Clean up old personal data based on retention policy
   */
  static async enforceRetentionPolicy(retentionDays: number = this.RETENTION_DAYS): Promise<{
    recordsDeleted: number;
    storageKeysAffected: string[];
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffTime = cutoffDate.getTime();

    let recordsDeleted = 0;
    const storageKeysAffected: string[] = [];

    const storageKeys = ['audit-logs', 'error-logs', 'perf-metrics'];

    for (const key of storageKeys) {
      const data: any[] = (await storage.get(key)) || [];
      const initialCount = data.length;

      const filtered = data.filter((item) => {
        const timestamp = new Date(item.timestamp || item.createdAt || 0).getTime();
        return timestamp > cutoffTime;
      });

      if (filtered.length < initialCount) {
        await storage.set(key, filtered);
        recordsDeleted += initialCount - filtered.length;
        storageKeysAffected.push(key);
      }
    }

    console.warn(`[GDPR Tools] 🗑️  Retention policy: Deleted ${recordsDeleted} old records`);

    return {
      recordsDeleted,
      storageKeysAffected,
    };
  }

  /**
   * Get all Data Subject Requests
   */
  static async getRequests(filter?: { status?: string; userId?: string }): Promise<DataSubjectRequest[]> {
    let requests: DataSubjectRequest[] = (await storage.get(this.DSR_STORAGE_KEY)) || [];

    if (filter) {
      if (filter.status) {
        requests = requests.filter((r) => r.status === filter.status);
      }
      if (filter.userId) {
        requests = requests.filter((r) => r.userId === filter.userId);
      }
    }

    return requests;
  }

  /**
   * Generate GDPR compliance report
   */
  static async generateComplianceReport(): Promise<{
    totalRequests: number;
    requestsByType: Record<string, number>;
    averageProcessingTime: number;
    retentionPolicyStatus: string;
    dataInventory: { storageKey: string; recordCount: number }[];
  }> {
    const requests: DataSubjectRequest[] = (await storage.get(this.DSR_STORAGE_KEY)) || [];

    const requestsByType: Record<string, number> = {};
    let totalProcessingTime = 0;
    let completedRequests = 0;

    requests.forEach((r) => {
      requestsByType[r.type] = (requestsByType[r.type] || 0) + 1;

      if (r.status === 'completed' && r.requestedAt && r.completedAt) {
        const processingTime =
          new Date(r.completedAt).getTime() - new Date(r.requestedAt).getTime();
        totalProcessingTime += processingTime;
        completedRequests++;
      }
    });

    const averageProcessingTime =
      completedRequests > 0 ? totalProcessingTime / completedRequests / (1000 * 60 * 60) : 0; // hours

    // Data inventory
    const inventoryKeys = [
      'incident-metrics',
      'mttr-records',
      'audit-logs',
      'detected-patterns',
      'error-logs',
    ];
    const dataInventory = [];

    for (const key of inventoryKeys) {
      const data: any[] = (await storage.get(key)) || [];
      dataInventory.push({
        storageKey: key,
        recordCount: data.length,
      });
    }

    return {
      totalRequests: requests.length,
      requestsByType,
      averageProcessingTime: Math.round(averageProcessingTime * 100) / 100,
      retentionPolicyStatus: `${this.RETENTION_DAYS} days`,
      dataInventory,
    };
  }
}
