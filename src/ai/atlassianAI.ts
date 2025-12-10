import api from '@forge/api';

interface AIAnalysisContext {
  issueKey: string;
  issueSummary: string;
  issueDescription: string;
  priority: string;
  suspectCommits: Array<{
    message: string;
    author: string;
    files: string[];
  }>;
  runbooks: Array<{
    title: string;
    excerpt: string;
  }>;
}

interface AIAnalysisResult {
  rootCauseHypothesis: string;
  confidenceLevel: number;
  recommendedAction: string;
  reasoning: string;
}

/**
 * Real Atlassian Intelligence Integration
 * Uses Atlassian AI API for root cause analysis
 */
export async function analyzeWithAtlassianAI(
  context: AIAnalysisContext
): Promise<AIAnalysisResult> {
  console.warn('[Atlassian AI] 🤖 Starting AI-powered analysis...');

  try {
    // Build the AI prompt with all context
    const prompt = buildAnalysisPrompt(context);

    // Call Atlassian Intelligence API
    // Note: Using fetch directly as requestAtlassian requires specific route format
    const response = await api.fetch('/ai/v1/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        model: 'atlassian-intelligence-v1',
        temperature: 0.3, // Lower temperature for more deterministic analysis
        maxTokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`Atlassian AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const analysisText = aiResponse.choices?.[0]?.text || aiResponse.text || '';

    console.warn('[Atlassian AI] ✅ AI analysis complete');

    // Parse AI response
    return parseAIResponse(analysisText, context);
  } catch (error) {
    console.error('[Atlassian AI] ❌ Error calling Atlassian Intelligence:', error);

    // Fallback to pattern-based analysis
    return fallbackAnalysis(context);
  }
}

/**
 * Build comprehensive prompt for Atlassian AI
 */
function buildAnalysisPrompt(context: AIAnalysisContext): string {
  return `You are an expert Site Reliability Engineer and Formula 1 Race Strategist analyzing a production incident.

**INCIDENT CONTEXT:**
Issue: ${context.issueKey}
Summary: ${context.issueSummary}
Description: ${context.issueDescription || 'Not provided'}
Priority: ${context.priority}

**RECENT CODE CHANGES (Suspect Commits):**
${context.suspectCommits.map((c, i) => `${i + 1}. "${c.message}" by ${c.author}
   Files: ${c.files.join(', ')}`).join('\n')}

**AVAILABLE RUNBOOKS:**
${context.runbooks.map((r, i) => `${i + 1}. ${r.title}
   ${r.excerpt}`).join('\n')}

**YOUR TASK:**
Analyze this incident like an F1 race engineer analyzing telemetry. Provide:

1. **Root Cause Hypothesis** (2-3 sentences): What likely caused this incident?
2. **Confidence Level** (0-100%): How confident are you in this analysis?
3. **Recommended Action** (one of: ROLLBACK, HOTFIX, MONITOR, INVESTIGATE)
4. **Reasoning** (3-4 bullet points): Why did you reach this conclusion?

Be concise, precise, and action-oriented. Focus on the most likely root cause based on the code changes and incident symptoms.`;
}

/**
 * Parse AI response into structured format
 */
function parseAIResponse(aiText: string, context: AIAnalysisContext): AIAnalysisResult {
  // Extract confidence level from AI response
  const confidenceMatch = aiText.match(/confidence.*?(\d+)/i);
  const confidence = confidenceMatch && confidenceMatch[1] ? parseInt(confidenceMatch[1]) : 75;

  // Extract recommended action
  let recommendedAction = 'INVESTIGATE';
  if (aiText.toLowerCase().includes('rollback')) {
    recommendedAction = 'ROLLBACK';
  } else if (aiText.toLowerCase().includes('hotfix')) {
    recommendedAction = 'HOTFIX';
  } else if (aiText.toLowerCase().includes('monitor')) {
    recommendedAction = 'MONITOR';
  }

  // Extract root cause (first paragraph or sentence)
  const rootCauseMatch = aiText.match(/root cause.*?[:.]\s*([^.]+\.)/i);
  const rootCause =
    rootCauseMatch?.[1] ||
    aiText.split('\n')[0] ||
    `Analyzing ${context.issueSummary} with ${context.suspectCommits.length} recent commits`;

  return {
    rootCauseHypothesis: rootCause.trim(),
    confidenceLevel: Math.min(confidence, 95),
    recommendedAction: recommendedAction,
    reasoning: aiText.trim(),
  };
}

/**
 * Fallback analysis when AI is unavailable
 */
function fallbackAnalysis(context: AIAnalysisContext): AIAnalysisResult {
  console.warn('[Atlassian AI] Using fallback pattern-based analysis');

  const summary = context.issueSummary.toLowerCase();
  let rootCause = 'Incident requires investigation';
  let action = 'INVESTIGATE';
  let confidence = 60;

  // Pattern matching for common issues
  if (summary.includes('timeout') || summary.includes('slow')) {
    rootCause = 'Performance degradation detected, likely database connection pool timeout';
    action = 'HOTFIX';
    confidence = 80;
  } else if (summary.includes('500') || summary.includes('error')) {
    rootCause = 'API error rate spike detected after recent deployment';
    action = 'ROLLBACK';
    confidence = 85;
  } else if (context.priority === 'Highest' || context.priority === 'High') {
    rootCause = 'Critical incident requiring immediate investigation';
    action = 'INVESTIGATE';
    confidence = 70;
  }

  // Increase confidence if we have matching commits
  if (context.suspectCommits.length > 0) {
    confidence = Math.min(confidence + 10, 95);
  }

  return {
    rootCauseHypothesis: rootCause,
    confidenceLevel: confidence,
    recommendedAction: action,
    reasoning: `Pattern-based analysis: ${rootCause}. Found ${context.suspectCommits.length} recent commits and ${context.runbooks.length} related runbooks.`,
  };
}
