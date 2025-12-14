import api, { storage } from '@forge/api';
import { UsageAnalytics } from '../analytics/usageAnalytics';

/**
 * AI Provider Type
 */
export type AIProvider = 'atlassian' | 'anthropic' | 'gemini' | 'groq' | 'fallback';

/**
 * AI Model Configuration
 */
export interface AIModelConfig {
  provider: AIProvider;
  model: string;
  temperature: number;
  maxTokens: number;
  enabled: boolean;
}

/**
 * AI Analysis Context
 */
export interface AIAnalysisContext {
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

/**
 * AI Analysis Result
 */
export interface AIAnalysisResult {
  rootCauseHypothesis: string;
  confidenceLevel: number;
  recommendedAction: string;
  reasoning: string;
  provider: AIProvider;
  tokensUsed?: number;
  cachedResult?: boolean;
}

/**
 * AI Usage Statistics
 */
export interface AIUsageStats {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  cachedResults: number;
  totalTokensUsed: number;
  costEstimate: number; // USD
  providerBreakdown: Record<AIProvider, number>;
}

/**
 * Atlassian Intelligence Integration
 * Multi-provider AI system with fallback and caching
 */
export class AtlassianIntelligence {
  private static readonly CACHE_KEY = 'ai-response-cache';
  private static readonly USAGE_KEY = 'ai-usage-stats';
  private static readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Analyze incident with AI (primary method)
   */
  static async analyze(context: AIAnalysisContext): Promise<AIAnalysisResult> {
    const startTime = Date.now();

    try {
      // Check cache first
      const cachedResult = await this.getCachedResult(context);
      if (cachedResult) {
        console.warn('[AI] ✅ Using cached result');
        await this.trackUsage('cache_hit', 0);
        return { ...cachedResult, cachedResult: true };
      }

      // Get AI config
      const config = await this.getConfig();

      let result: AIAnalysisResult;

      // Try primary provider
      if (config.provider === 'atlassian' && config.enabled) {
        result = await this.callAtlassianAI(context, config);
      } else if (config.provider === 'anthropic' && config.enabled) {
        result = await this.callAnthropicAI(context, config);
      } else if (config.provider === 'gemini' && config.enabled) {
        result = await this.callGeminiAI(context, config);
      } else if (config.provider === 'groq' && config.enabled) {
        result = await this.callGroqAI(context, config);
      } else {
        result = await this.fallbackAnalysis(context);
      }

      // Cache the result
      await this.cacheResult(context, result);

      // Track usage
      const duration = Date.now() - startTime;
      await this.trackUsage('success', result.tokensUsed || 0, result.provider);
      await UsageAnalytics.trackEvent('incident_analyzed', 'system', {
        aiProvider: result.provider,
        tokensUsed: result.tokensUsed,
        cached: false,
      }, duration, true);

      return result;
    } catch (error) {
      console.error('[AI] ❌ Analysis failed:', error);

      // Track failure
      await this.trackUsage('failure', 0);

      // Return fallback
      return await this.fallbackAnalysis(context);
    }
  }

  /**
   * Call Atlassian Intelligence API
   */
  private static async callAtlassianAI(
    context: AIAnalysisContext,
    config: AIModelConfig
  ): Promise<AIAnalysisResult> {
    console.warn('[AI] 🤖 Calling Atlassian Intelligence API...');

    try {
      const prompt = this.buildPrompt(context);

      // Note: This endpoint is hypothetical - Forge doesn't have official AI API yet
      // In production, this would use the real Atlassian Intelligence endpoint
      const response = await api.fetch('/ai/v1/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: config.model,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
        }),
      });

      if (!response.ok) {
        throw new Error(`Atlassian AI API error: ${response.status}`);
      }

      const data = await response.json();
      const analysisText = data.choices?.[0]?.text || data.text || '';
      const tokensUsed = data.usage?.totalTokens || 0;

      return {
        ...this.parseAIResponse(analysisText, context),
        provider: 'atlassian',
        tokensUsed,
      };
    } catch (error) {
      console.error('[AI] ❌ Atlassian AI call failed:', error);
      throw error;
    }
  }

  /**
   * Call Anthropic Claude API (fallback)
   */
  private static async callAnthropicAI(
    context: AIAnalysisContext,
    config: AIModelConfig
  ): Promise<AIAnalysisResult> {
    console.warn('[AI] 🧠 Calling Anthropic Claude API...');

    try {
      const prompt = this.buildPrompt(context);

      // Get API key from storage (configured by admin)
      const apiKey = await storage.get('anthropic-api-key');
      if (!apiKey) {
        throw new Error('Anthropic API key not configured');
      }

      // Call Anthropic API
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey as string,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.model || 'claude-3-5-sonnet-20241022',
          max_tokens: config.maxTokens,
          temperature: config.temperature,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`);
      }

      const data = await response.json() as any;
      const analysisText = data.content?.[0]?.text || '';
      const tokensUsed = data.usage?.input_tokens + data.usage?.output_tokens || 0;

      return {
        ...this.parseAIResponse(analysisText, context),
        provider: 'anthropic',
        tokensUsed,
      };
    } catch (error) {
      console.error('[AI] ❌ Anthropic API call failed:', error);
      throw error;
    }
  }

  /**
   * Call Google Gemini API (free tier available)
   */
  private static async callGeminiAI(
    context: AIAnalysisContext,
    config: AIModelConfig
  ): Promise<AIAnalysisResult> {
    console.warn('[AI] 💎 Calling Google Gemini API...');

    try {
      const prompt = this.buildPrompt(context);

      // Get API key from storage
      const apiKey = await storage.get('gemini-api-key');
      if (!apiKey) {
        throw new Error('Gemini API key not configured');
      }

      // Call Gemini API (free tier: 15 requests/minute, 1M tokens/day)
      const model = config.model || 'gemini-1.5-flash'; // Fast and free
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: config.temperature,
              maxOutputTokens: config.maxTokens,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json() as any;
      const analysisText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const tokensUsed = data.usageMetadata?.totalTokenCount || 0;

      return {
        ...this.parseAIResponse(analysisText, context),
        provider: 'gemini',
        tokensUsed,
      };
    } catch (error) {
      console.error('[AI] ❌ Gemini API call failed:', error);
      throw error;
    }
  }

  /**
   * Call Groq API (ultra-fast, free tier available)
   */
  private static async callGroqAI(
    context: AIAnalysisContext,
    config: AIModelConfig
  ): Promise<AIAnalysisResult> {
    console.warn('[AI] ⚡ Calling Groq API (ultra-fast)...');

    try {
      const prompt = this.buildPrompt(context);

      // Get API key from storage
      const apiKey = await storage.get('groq-api-key');
      if (!apiKey) {
        throw new Error('Groq API key not configured');
      }

      // Call Groq API (free tier: 30 requests/minute, very fast inference)
      const model = config.model || 'llama-3.3-70b-versatile'; // Fast and powerful
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: config.temperature,
          max_tokens: config.maxTokens,
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json() as any;
      const analysisText = data.choices?.[0]?.message?.content || '';
      const tokensUsed = data.usage?.total_tokens || 0;

      return {
        ...this.parseAIResponse(analysisText, context),
        provider: 'groq',
        tokensUsed,
      };
    } catch (error) {
      console.error('[AI] ❌ Groq API call failed:', error);
      throw error;
    }
  }

  /**
   * Fallback pattern-based analysis
   */
  private static async fallbackAnalysis(context: AIAnalysisContext): Promise<AIAnalysisResult> {
    console.warn('[AI] ⚙️ Using fallback pattern-based analysis');

    const summary = context.issueSummary.toLowerCase();
    let rootCause = 'Incident requires investigation';
    let action = 'INVESTIGATE';
    let confidence = 60;

    // Pattern matching for common issues
    if (summary.includes('timeout') || summary.includes('slow')) {
      rootCause = 'Performance degradation detected, likely database connection pool timeout';
      action = 'HOTFIX';
      confidence = 80;
    } else if (summary.includes('500') || summary.includes('error') || summary.includes('failed')) {
      rootCause = 'API error rate spike detected after recent deployment';
      action = 'ROLLBACK';
      confidence = 85;
    } else if (summary.includes('memory') || summary.includes('oom')) {
      rootCause = 'Memory leak or OOM error detected';
      action = 'HOTFIX';
      confidence = 75;
    } else if (summary.includes('database') || summary.includes('sql')) {
      rootCause = 'Database connectivity or query performance issue';
      action = 'INVESTIGATE';
      confidence = 70;
    } else if (context.priority === 'Highest' || context.priority === 'High') {
      rootCause = 'Critical incident requiring immediate investigation';
      action = 'INVESTIGATE';
      confidence = 70;
    }

    // Increase confidence if we have matching commits
    if (context.suspectCommits.length > 0) {
      confidence = Math.min(confidence + 10, 95);
      rootCause += ` (${context.suspectCommits.length} recent commits detected)`;
    }

    return {
      rootCauseHypothesis: rootCause,
      confidenceLevel: confidence,
      recommendedAction: action,
      reasoning: `Pattern-based analysis: ${rootCause}. Found ${context.suspectCommits.length} recent commits and ${context.runbooks.length} related runbooks.`,
      provider: 'fallback',
      tokensUsed: 0,
    };
  }

  /**
   * Build comprehensive AI prompt
   */
  private static buildPrompt(context: AIAnalysisContext): string {
    return `You are an expert Site Reliability Engineer and Formula 1 Race Strategist analyzing a production incident.

**INCIDENT CONTEXT:**
Issue: ${context.issueKey}
Summary: ${context.issueSummary}
Description: ${context.issueDescription || 'Not provided'}
Priority: ${context.priority}

**RECENT CODE CHANGES (Suspect Commits):**
${context.suspectCommits.length > 0 ? context.suspectCommits.map((c, i) => `${i + 1}. "${c.message}" by ${c.author}
   Files: ${c.files.join(', ')}`).join('\n') : 'No recent commits found'}

**AVAILABLE RUNBOOKS:**
${context.runbooks.length > 0 ? context.runbooks.map((r, i) => `${i + 1}. ${r.title}
   ${r.excerpt}`).join('\n') : 'No runbooks found'}

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
  private static parseAIResponse(aiText: string, context: AIAnalysisContext): Omit<AIAnalysisResult, 'provider' | 'tokensUsed'> {
    // Extract confidence level
    const confidenceMatch = aiText.match(/confidence.*?(\d+)/i);
    const confidence = confidenceMatch?.[1] ? parseInt(confidenceMatch[1]) : 75;

    // Extract recommended action
    let recommendedAction = 'INVESTIGATE';
    const lowerText = aiText.toLowerCase();
    if (lowerText.includes('rollback')) {
      recommendedAction = 'ROLLBACK';
    } else if (lowerText.includes('hotfix')) {
      recommendedAction = 'HOTFIX';
    } else if (lowerText.includes('monitor')) {
      recommendedAction = 'MONITOR';
    }

    // Extract root cause
    const rootCauseMatch = aiText.match(/root cause.*?[:.]\s*([^.]+\.)/i);
    const rootCause =
      rootCauseMatch?.[1] ||
      aiText.split('\n').find(line => line.length > 20) ||
      `Analyzing ${context.issueSummary} with ${context.suspectCommits.length} recent commits`;

    return {
      rootCauseHypothesis: rootCause.trim(),
      confidenceLevel: Math.min(confidence, 95),
      recommendedAction,
      reasoning: aiText.trim(),
    };
  }

  /**
   * Get cached AI result
   */
  private static async getCachedResult(context: AIAnalysisContext): Promise<AIAnalysisResult | null> {
    try {
      const cache: any[] = (await storage.get(this.CACHE_KEY)) || [];
      const cacheKey = this.generateCacheKey(context);

      const cached = cache.find(
        (entry) => entry.key === cacheKey && entry.expiresAt > Date.now()
      );

      return cached?.result || null;
    } catch (error) {
      console.error('[AI] ❌ Cache lookup failed:', error);
      return null;
    }
  }

  /**
   * Cache AI result
   */
  private static async cacheResult(context: AIAnalysisContext, result: AIAnalysisResult): Promise<void> {
    try {
      const cache: any[] = (await storage.get(this.CACHE_KEY)) || [];
      const cacheKey = this.generateCacheKey(context);

      // Remove old entry if exists
      const filtered = cache.filter((e) => e.key !== cacheKey);

      // Add new entry
      filtered.push({
        key: cacheKey,
        result,
        expiresAt: Date.now() + this.CACHE_TTL,
      });

      // Keep last 100 entries
      await storage.set(this.CACHE_KEY, filtered.slice(-100));
    } catch (error) {
      console.error('[AI] ❌ Cache storage failed:', error);
    }
  }

  /**
   * Generate cache key from context
   */
  private static generateCacheKey(context: AIAnalysisContext): string {
    const summary = context.issueSummary.toLowerCase().replace(/[^a-z0-9]/g, '');
    const commitCount = context.suspectCommits.length;
    const priority = context.priority.toLowerCase();
    return `${summary}-${commitCount}-${priority}`.substring(0, 50);
  }

  /**
   * Track AI usage statistics
   */
  private static async trackUsage(
    type: 'success' | 'failure' | 'cache_hit',
    tokensUsed: number,
    provider?: AIProvider
  ): Promise<void> {
    try {
      const stats: AIUsageStats = (await storage.get(this.USAGE_KEY)) || {
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        cachedResults: 0,
        totalTokensUsed: 0,
        costEstimate: 0,
        providerBreakdown: {},
      };

      stats.totalCalls++;

      if (type === 'success') {
        stats.successfulCalls++;
        stats.totalTokensUsed += tokensUsed;

        // Estimate cost (rough approximation)
        // Anthropic Claude: $3 per 1M input tokens, $15 per 1M output tokens (avg $9/1M)
        // Atlassian: Assume similar pricing
        stats.costEstimate += (tokensUsed / 1000000) * 9;

        if (provider) {
          stats.providerBreakdown[provider] = (stats.providerBreakdown[provider] || 0) + 1;
        }
      } else if (type === 'failure') {
        stats.failedCalls++;
      } else if (type === 'cache_hit') {
        stats.cachedResults++;
      }

      await storage.set(this.USAGE_KEY, stats);
    } catch (error) {
      console.error('[AI] ❌ Usage tracking failed:', error);
    }
  }

  /**
   * Get AI configuration
   */
  private static async getConfig(): Promise<AIModelConfig> {
    const config = await storage.get('ai-config');
    return (
      config || {
        provider: 'groq' as AIProvider, // Default to Groq (fast and free)
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        maxTokens: 500,
        enabled: false, // Must be enabled by admin
      }
    );
  }

  /**
   * Get AI usage statistics
   */
  static async getUsageStats(): Promise<AIUsageStats> {
    return (
      (await storage.get(this.USAGE_KEY)) || {
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        cachedResults: 0,
        totalTokensUsed: 0,
        costEstimate: 0,
        providerBreakdown: {},
      }
    );
  }

  /**
   * Update AI configuration
   */
  static async updateConfig(config: Partial<AIModelConfig>): Promise<void> {
    const current = await this.getConfig();
    await storage.set('ai-config', { ...current, ...config });
  }

  /**
   * Clear AI cache
   */
  static async clearCache(): Promise<number> {
    const cache: any[] = (await storage.get(this.CACHE_KEY)) || [];
    const count = cache.length;
    await storage.set(this.CACHE_KEY, []);
    return count;
  }
}
