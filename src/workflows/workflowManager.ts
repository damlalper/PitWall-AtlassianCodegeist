import api, { route, storage } from '@forge/api';

export interface WorkflowRule {
  id: string;
  name: string;
  trigger: 'on_analysis' | 'on_priority_change' | 'on_label_add';
  conditions: { field: string; operator: string; value: any }[];
  actions: WorkflowAction[];
  enabled: boolean;
}

export interface WorkflowAction {
  type: 'transition' | 'assign' | 'add_label' | 'add_comment' | 'webhook';
  params: Record<string, any>;
}

/**
 * Workflow Manager
 * Custom automation rules for incident handling
 */
export class WorkflowManager {
  private static readonly STORAGE_KEY = 'workflow-rules';

  static async executeWorkflows(trigger: string, context: any): Promise<void> {
    try {
      const rules: WorkflowRule[] = (await storage.get(this.STORAGE_KEY)) || [];
      const matchingRules = rules.filter(r => r.enabled && r.trigger === trigger);

      for (const rule of matchingRules) {
        if (this.evaluateConditions(rule.conditions, context)) {
          await this.executeActions(rule.actions, context);
        }
      }
    } catch (error) {
      console.error('[Workflow] Execution failed:', error);
    }
  }

  private static evaluateConditions(conditions: any[], context: any): boolean {
    return conditions.every(c => {
      const value = context[c.field];
      switch (c.operator) {
        case 'equals': return value === c.value;
        case 'contains': return String(value).includes(c.value);
        case 'greater_than': return value > c.value;
        default: return false;
      }
    });
  }

  private static async executeActions(actions: WorkflowAction[], context: any): Promise<void> {
    for (const action of actions) {
      switch (action.type) {
        case 'transition':
          await this.transitionIssue(context.issueKey, action.params.status);
          break;
        case 'add_label':
          await this.addLabel(context.issueKey, action.params.label);
          break;
        case 'add_comment':
          await this.addComment(context.issueKey, action.params.text);
          break;
      }
    }
  }

  private static async transitionIssue(_issueKey: string, _status: string): Promise<void> {
    // Placeholder - implementation from incidentAnalyzer
  }

  private static async addLabel(issueKey: string, label: string): Promise<void> {
    const response = await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}`);
    const data = await response.json();
    const labels = [...(data.fields.labels || []), label];

    await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { labels } }),
    });
  }

  private static async addComment(issueKey: string, text: string): Promise<void> {
    await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        body: { type: 'doc', version: 1, content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] }
      }),
    });
  }
}
