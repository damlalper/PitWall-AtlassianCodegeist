import { AtlassianIntelligence, AIAnalysisContext, AIAnalysisResult } from './atlassianIntelligence';

/**
 * Backward compatibility wrapper for analyzeWithAtlassianAI
 * Now uses the new multi-provider AI system with:
 * - Groq (ultra-fast, free)
 * - Gemini (Google, free tier)
 * - Anthropic Claude (paid)
 * - Fallback pattern matching
 */
export async function analyzeWithAtlassianAI(
  context: AIAnalysisContext
): Promise<AIAnalysisResult> {
  // Delegate to new AI system
  return await AtlassianIntelligence.analyze(context);
}

// Re-export types for backward compatibility
export type { AIAnalysisContext, AIAnalysisResult };
