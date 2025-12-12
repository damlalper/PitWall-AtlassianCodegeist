import api, { storage } from '@forge/api';
import { logWebhookTrigger } from '../utils/auditLogger';

interface WebhookConfig {
  slackUrl?: string;
  teamsUrl?: string;
  enabled: boolean;
}

/**
 * Webhook Manager
 * Send notifications to Slack/Teams
 */
export class WebhookManager {
  static async sendSlackNotification(issueKey: string, priority: string, action: string): Promise<void> {
    try {
      const config: WebhookConfig = (await storage.get('webhook-config')) || { enabled: false };

      if (!config.enabled || !config.slackUrl) {
        console.warn('[Webhook] Slack not configured');
        return;
      }

      const payload = {
        text: `🚨 *PitWall Alert*`,
        attachments: [{
          color: priority === 'Highest' ? 'danger' : 'warning',
          fields: [
            { title: 'Issue', value: issueKey, short: true },
            { title: 'Priority', value: priority, short: true },
            { title: 'Action', value: action, short: false },
          ]
        }]
      };

      const response = await api.fetch(config.slackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      await logWebhookTrigger('slack', config.slackUrl, response.ok ? 'success' : 'failure');
    } catch (error) {
      console.error('[Webhook] Slack notification failed:', error);
    }
  }
}
