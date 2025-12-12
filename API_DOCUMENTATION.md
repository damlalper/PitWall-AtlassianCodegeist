# PitWall API Documentation

## Overview

PitWall is an enterprise-grade Cross-Product AI Context Engine for Atlassian Jira, designed for intelligent incident management and automated analysis.

**Version:** 2.2.0
**Base URL:** Forge App Runtime
**Authentication:** Atlassian OAuth 2.0

---

## Table of Contents

1. [Analytics APIs](#analytics-apis)
2. [Search & Export APIs](#search--export-apis)
3. [Workflow & Automation APIs](#workflow--automation-apis)
4. [Monitoring & Health APIs](#monitoring--health-apis)
5. [Compliance & Security APIs](#compliance--security-apis)
6. [Data Models](#data-models)

---

## Analytics APIs

### MTTR Tracker

#### Get MTTR Statistics

```typescript
import { MTTRTracker } from './analytics/mttrTracker';

const stats = await MTTRTracker.getStats();
```

**Response:**
```json
{
  "averageMTTR": 120,
  "medianMTTR": 95,
  "totalIncidents": 150,
  "resolvedIncidents": 120,
  "openIncidents": 30,
  "mttrByPriority": {
    "Highest": 45,
    "High": 90,
    "Medium": 180
  },
  "weeklyTrend": [
    { "week": "2025-01-06", "avgMTTR": 110 }
  ]
}
```

#### Get SLA Compliance

```typescript
const sla = await MTTRTracker.getSLACompliance();
```

**Response:**
```json
{
  "complianceRate": 95,
  "violations": 3
}
```

### Pattern Detection

#### Detect Patterns

```typescript
import { PatternDetector } from './analytics/patternDetector';

const patterns = await PatternDetector.detectPatterns();
```

**Response:**
```json
{
  "patterns": [
    {
      "type": "recurring_error",
      "description": "Database connection timeout",
      "occurrences": 15,
      "affectedComponents": ["auth-service", "user-api"],
      "riskScore": 85,
      "recommendation": "Investigate database connection pool settings",
      "firstSeen": "2025-01-01T10:00:00Z",
      "lastSeen": "2025-01-10T15:30:00Z"
    }
  ],
  "totalIncidents": 150
}
```

### Velocity Metrics

#### Calculate Team Velocity

```typescript
import { VelocityMetrics } from './analytics/velocityMetrics';

const velocity = await VelocityMetrics.calculate();
```

**Response:**
```json
{
  "incidentsPerDay": 5.2,
  "avgResolutionTime": 120,
  "analysisSuccessRate": 95,
  "topPerformers": [],
  "weeklyTrend": []
}
```

---

## Search & Export APIs

### Search Engine

#### Search Incidents

```typescript
import { SearchEngine } from './search/searchEngine';

const results = await SearchEngine.search(
  {
    priorities: ['Highest', 'High'],
    dateRange: { from: '2025-01-01', to: '2025-01-31' },
    minConfidence: 80,
    textQuery: 'database error'
  },
  {
    sortBy: 'createdAt',
    sortOrder: 'desc',
    limit: 20,
    offset: 0
  }
);
```

**Response:**
```json
{
  "results": [
    {
      "issueKey": "INC-123",
      "summary": "Database connection timeout",
      "priority": "Highest",
      "status": "Open",
      "labels": ["database", "urgent"],
      "createdAt": "2025-01-15T10:00:00Z",
      "confidence": 92,
      "riskLevel": "CRITICAL",
      "analysisSnippet": "Root cause: Connection pool exhausted..."
    }
  ],
  "total": 45,
  "page": 1,
  "pageSize": 20,
  "hasMore": true
}
```

#### Get Search Facets

```typescript
const facets = await SearchEngine.getFacets();
```

**Response:**
```json
{
  "priorities": ["Highest", "High", "Medium", "Low"],
  "statuses": ["Open", "In Progress", "Resolved"],
  "labels": ["database", "api", "frontend"],
  "riskLevels": ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
  "assignees": ["user1", "user2"]
}
```

### Data Exporter

#### Export Data

```typescript
import { DataExporter } from './export/dataExporter';

const exportResult = await DataExporter.export({
  format: 'csv',
  type: 'incidents',
  dateRange: { from: '2025-01-01', to: '2025-01-31' }
});
```

**Response:**
```json
{
  "filename": "incidents_2025-01-15T10-30-00.csv",
  "content": "issueKey,summary,priority,...",
  "mimeType": "text/csv",
  "recordCount": 45,
  "generatedAt": "2025-01-15T10:30:00Z"
}
```

**Export Types:**
- `incidents` - Incident metrics
- `mttr_records` - MTTR tracking data
- `audit_logs` - Audit trail
- `patterns` - Detected patterns
- `velocity_metrics` - Team velocity
- `performance_metrics` - Performance data

**Formats:**
- `csv` - Comma-separated values
- `json` - JSON format

---

## Workflow & Automation APIs

### Workflow Manager

#### Execute Workflows

```typescript
import { WorkflowManager } from './workflows/workflowManager';

await WorkflowManager.executeWorkflows('on_analysis', {
  issueKey: 'INC-123',
  priority: 'Highest',
  riskLevel: 'CRITICAL'
});
```

**Workflow Rule Structure:**
```json
{
  "id": "workflow-1",
  "name": "Auto-escalate critical incidents",
  "trigger": "on_analysis",
  "conditions": [
    { "field": "priority", "operator": "equals", "value": "Highest" },
    { "field": "riskLevel", "operator": "equals", "value": "CRITICAL" }
  ],
  "actions": [
    { "type": "transition", "targetStatus": "In Progress" },
    { "type": "assign", "assignee": "incident-lead" },
    { "type": "add_label", "label": "escalated" },
    { "type": "add_comment", "comment": "Auto-escalated by PitWall" }
  ],
  "enabled": true
}
```

### Report Scheduler

#### Create Scheduled Report

```typescript
import { ReportScheduler } from './reports/reportScheduler';

const reportId = await ReportScheduler.createReport({
  name: 'Weekly Incident Report',
  type: 'weekly',
  recipients: ['team@example.com'],
  sections: ['mttr_summary', 'sla_compliance', 'pattern_detection'],
  enabled: true
});
```

#### Generate Report

```typescript
const report = await ReportScheduler.generateReport(reportId);
```

**Response:**
```json
{
  "id": "generated-1234567890",
  "configId": "report-1234567890",
  "generatedAt": "2025-01-15T10:00:00Z",
  "period": {
    "from": "2025-01-08T00:00:00Z",
    "to": "2025-01-15T00:00:00Z"
  },
  "summary": "Report generated with 3 sections: MTTR, SLA, Patterns",
  "sections": [...],
  "recipients": ["team@example.com"]
}
```

---

## Monitoring & Health APIs

### Health Check

#### System Health Check

```typescript
import { HealthCheck } from './monitoring/healthCheck';

const health = await HealthCheck.check();
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:00:00Z",
  "uptime": 86400000,
  "version": "2.2.0",
  "components": [
    {
      "name": "storage",
      "status": "healthy",
      "responseTime": 45,
      "message": "Storage operational",
      "lastCheck": "2025-01-15T10:00:00Z"
    },
    {
      "name": "incident_metrics",
      "status": "healthy",
      "responseTime": 120,
      "message": "150 incidents tracked",
      "lastCheck": "2025-01-15T10:00:00Z"
    }
  ],
  "metrics": {
    "totalIncidents": 150,
    "totalErrors": 25,
    "cacheHitRate": 85,
    "avgResponseTime": 120
  }
}
```

**Component Statuses:**
- `healthy` - Component functioning normally
- `degraded` - Component functional but slow
- `unhealthy` - Component not functioning

### Job Queue

#### Enqueue Job

```typescript
import { JobQueue } from './jobs/jobQueue';

const jobId = await JobQueue.enqueue(
  'analyze_incident',
  { issueKey: 'INC-123' },
  'high',
  3
);
```

**Job Types:**
- `analyze_incident` - Analyze an incident
- `generate_report` - Generate a report
- `detect_patterns` - Detect patterns
- `cleanup_old_data` - Clean up old data
- `sync_external_api` - Sync external API
- `send_notification` - Send notification

**Priorities:**
- `critical` - Highest priority
- `high` - High priority
- `normal` - Normal priority
- `low` - Low priority

#### Get Job Status

```typescript
const job = await JobQueue.getJob(jobId);
```

**Response:**
```json
{
  "id": "job-1234567890",
  "type": "analyze_incident",
  "priority": "high",
  "status": "completed",
  "payload": { "issueKey": "INC-123" },
  "createdAt": "2025-01-15T10:00:00Z",
  "startedAt": "2025-01-15T10:01:00Z",
  "completedAt": "2025-01-15T10:02:00Z",
  "attempts": 1,
  "maxAttempts": 3,
  "result": { "analyzed": true }
}
```

---

## Compliance & Security APIs

### GDPR Tools

#### Submit Data Subject Request

```typescript
import { GDPRTools } from './compliance/gdprTools';

const requestId = await GDPRTools.submitRequest(
  'access',
  'user123',
  'user@example.com'
);
```

**Request Types:**
- `access` - Right to access personal data
- `deletion` - Right to erasure
- `portability` - Right to data portability
- `rectification` - Right to rectification

#### Process Request

```typescript
const result = await GDPRTools.processRequest(requestId);
```

#### Anonymize Data

```typescript
const anonymized = GDPRTools.anonymize('user@example.com');
// Returns: "anonymous-a1b2c3d4"
```

#### Enforce Retention Policy

```typescript
const cleanupResult = await GDPRTools.enforceRetentionPolicy(90);
```

**Response:**
```json
{
  "recordsDeleted": 450,
  "storageKeysAffected": ["audit-logs", "error-logs"]
}
```

### Security Scanner

#### Run Security Scan

```typescript
import { SecurityScanner } from './security/securityScanner';

const scanResult = await SecurityScanner.runScan(['dependency', 'code', 'secrets']);
```

**Response:**
```json
{
  "id": "scan-1234567890",
  "scanType": "dependency",
  "startedAt": "2025-01-15T10:00:00Z",
  "completedAt": "2025-01-15T10:05:00Z",
  "status": "completed",
  "vulnerabilities": [
    {
      "id": "vuln-1",
      "type": "dependency",
      "severity": "high",
      "title": "Outdated package with known CVE",
      "description": "Package 'example' has known vulnerability",
      "affectedComponent": "package.json",
      "remediation": "Update to version 2.0.0",
      "cveId": "CVE-2024-1234",
      "cvssScore": 7.5,
      "foundAt": "2025-01-15T10:05:00Z"
    }
  ],
  "summary": {
    "total": 5,
    "critical": 1,
    "high": 2,
    "medium": 1,
    "low": 1,
    "info": 0
  }
}
```

**Scan Types:**
- `dependency` - Dependency vulnerabilities
- `code` - Code security issues
- `configuration` - Configuration security
- `secrets` - Exposed secrets
- `license` - License compliance

---

## Data Models

### Incident Metric

```typescript
interface IncidentMetric {
  issueKey: string;
  summary: string;
  priority: 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest';
  status: string;
  labels: string[];
  confidence: number;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  assignee?: string;
  timestamp: string;
  analysis?: string;
}
```

### MTTR Record

```typescript
interface MTTRRecord {
  issueKey: string;
  createdAt: string;
  resolvedAt?: string;
  mttr?: number; // minutes
  priority: string;
  status: 'open' | 'resolved';
  autoAnalyzed: boolean;
}
```

### Pattern

```typescript
interface Pattern {
  type: 'recurring_error' | 'time_based' | 'component_hotspot' | 'cascading_failure' | 'deployment_correlation';
  description: string;
  occurrences: number;
  affectedComponents: string[];
  riskScore: number; // 0-100
  recommendation: string;
  firstSeen: string;
  lastSeen: string;
}
```

### Audit Log Entry

```typescript
interface AuditLogEntry {
  timestamp: string;
  action: string;
  actor: string;
  resource: string;
  details: Record<string, any>;
  outcome: 'success' | 'failure';
}
```

### Workflow Rule

```typescript
interface WorkflowRule {
  id: string;
  name: string;
  trigger: 'on_analysis' | 'on_priority_change' | 'on_label_add';
  conditions: Array<{
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
    value: any;
  }>;
  actions: WorkflowAction[];
  enabled: boolean;
}
```

---

## Error Handling

All APIs use standard error handling:

```typescript
try {
  const result = await SomeAPI.method();
} catch (error) {
  console.error('API error:', error);
  // Error will be logged to error tracking system
}
```

Common error scenarios:
- **Storage errors**: Failed to read/write from Forge storage
- **Validation errors**: Invalid parameters or missing required fields
- **Not found errors**: Resource not found (e.g., job ID, request ID)
- **Rate limit errors**: API rate limit exceeded

---

## Rate Limiting

PitWall implements rate limiting to ensure fair usage:

```typescript
import { RateLimiter } from './utils/rateLimiter';

const { allowed, remaining } = await RateLimiter.checkLimit('api-key');

if (!allowed) {
  throw new Error('Rate limit exceeded');
}
```

**Limits:**
- 100 requests per hour per key
- 1-hour sliding window
- Automatic cleanup of expired records

---

## Caching

PitWall uses intelligent caching to improve performance:

```typescript
import { CacheManager } from './utils/cacheManager';

// Get from cache
const cached = await CacheManager.get('key');

// Set cache with 15-minute TTL
await CacheManager.set('key', data, 15 * 60 * 1000);

// Clear cache
await CacheManager.clear('pattern:*');
```

**Default TTL:** 15 minutes
**Max cache entries:** 100

---

## Best Practices

1. **Error Handling**: Always wrap API calls in try-catch blocks
2. **Rate Limiting**: Check rate limits before making bulk operations
3. **Caching**: Use caching for frequently accessed data
4. **Audit Logging**: All sensitive operations are automatically logged
5. **GDPR Compliance**: Use anonymization for user data when required
6. **Performance**: Monitor response times using performance metrics API

---

## Support

For issues and feature requests, please contact the PitWall team.

**Version:** 2.2.0
**Last Updated:** January 2025
