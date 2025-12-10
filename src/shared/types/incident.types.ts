import { z } from 'zod';

/**
 * Incident Priority Levels
 * P1 = Critical, P2 = High (Our main targets)
 */
export const IncidentPrioritySchema = z.enum(['P1', 'P2', 'P3', 'P4', 'P5']);
export type IncidentPriority = z.infer<typeof IncidentPrioritySchema>;

/**
 * Jira Issue Event Schema
 * Represents the webhook payload when a Jira issue is created
 */
export const JiraIssueEventSchema = z.object({
  issue: z.object({
    id: z.string(),
    key: z.string(),
    fields: z.object({
      summary: z.string(),
      description: z.string().optional(),
      priority: z
        .object({
          name: z.string(),
        })
        .optional(),
      created: z.string(),
      issuetype: z.object({
        name: z.string(),
      }),
    }),
  }),
});

export type JiraIssueEvent = z.infer<typeof JiraIssueEventSchema>;

/**
 * Incident Analysis Result
 * The output from our AI Race Engineer
 */
export const IncidentAnalysisSchema = z.object({
  confidenceScore: z.number().min(0).max(100),
  rootCause: z.string(),
  recommendedStrategy: z.string(),
  affectedComponent: z.string().optional(),
  suspectedCommit: z
    .object({
      hash: z.string(),
      author: z.string(),
      message: z.string(),
      timestamp: z.string(),
    })
    .optional(),
});

export type IncidentAnalysis = z.infer<typeof IncidentAnalysisSchema>;

/**
 * Risk Level (Williams Racing themed)
 */
export enum RiskLevel {
  CRITICAL = 'CRITICAL', // Red Flag - Stop everything
  HIGH = 'HIGH', // Yellow Flag - Caution
  MEDIUM = 'MEDIUM', // Blue Flag - Monitor
  LOW = 'LOW', // Green Flag - All clear
}
