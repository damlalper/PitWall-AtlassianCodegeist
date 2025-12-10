import { z } from 'zod';
import { JiraIssueEventSchema } from '../shared/types/incident.types';

/**
 * Incident Trigger Handler
 * Triggered when a new Jira issue is created
 *
 * This is the "Pit Wall Alarm" - detects when something goes wrong
 */
export async function handler(event: unknown): Promise<void> {
  try {
    console.warn('[PitWall] 🏎️ Incident detected! Race Engineer activating...');

    // Validate event payload
    const parsedEvent = JiraIssueEventSchema.parse(event);
    const { issue } = parsedEvent;

    console.warn(`[PitWall] Issue Key: ${issue.key}`);
    console.warn(`[PitWall] Summary: ${issue.fields.summary}`);
    console.warn(`[PitWall] Priority: ${issue.fields.priority?.name || 'Unknown'}`);

    // Check if this is a P1 or P2 incident (our main targets)
    const priority = issue.fields.priority?.name || '';
    const isHighPriority = priority === 'Highest' || priority === 'High';

    if (isHighPriority) {
      console.warn('[PitWall] 🚨 HIGH PRIORITY INCIDENT - Starting telemetry scan...');

      // TODO: Phase 2 - Call Bitbucket API
      // TODO: Phase 2 - Call Rovo Agent
      // TODO: Phase 2 - Post analysis to Jira comment

      console.warn('[PitWall] ✅ Telemetry scan queued for processing');
    } else {
      console.warn('[PitWall] ℹ️  Low priority incident - monitoring only');
    }

    console.warn('[PitWall] 🏁 Trigger handler completed successfully');
  } catch (error) {
    console.error('[PitWall] ❌ Error in incident trigger:', error);

    // Graceful degradation - don't break Jira
    if (error instanceof z.ZodError) {
      console.error('[PitWall] Invalid event payload:', error.errors);
    }
  }
}
