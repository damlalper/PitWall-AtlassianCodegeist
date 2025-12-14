import { AdvancedForecasting } from './advancedForecasting';

/**
 * Trend Forecasting - Backward Compatibility Wrapper
 *
 * This module now uses the advanced ML forecasting engine under the hood.
 * All methods delegate to AdvancedForecasting for professional-grade predictions.
 *
 * Features:
 * - ARIMA-style autoregressive models
 * - Prophet-style seasonal decomposition
 * - Outlier detection and cleaning
 * - Confidence intervals
 * - Drift detection
 * - Model ensemble with validation-based weighting
 */

// Re-export types for backward compatibility
export type {
  ForecastPeriod,
  TrendDirection,
  ForecastResult,
} from './advancedForecasting';

/**
 * Trend Forecasting (Legacy API)
 * Now powered by AdvancedForecasting engine
 */
export class TrendForecasting {
  /**
   * Forecast MTTR for next period
   * Delegates to AdvancedForecasting engine
   */
  static async forecastMTTR(period: import('./advancedForecasting').ForecastPeriod = '7days'): Promise<import('./advancedForecasting').ForecastResult> {
    return AdvancedForecasting.forecastMTTR(period);
  }

  /**
   * Forecast incident volume
   * Delegates to AdvancedForecasting engine
   */
  static async forecastIncidentVolume(period: import('./advancedForecasting').ForecastPeriod = '7days'): Promise<import('./advancedForecasting').ForecastResult> {
    return AdvancedForecasting.forecastIncidentVolume(period);
  }

  /**
   * Detect risk trends
   * Delegates to AdvancedForecasting engine
   */
  static async detectRiskTrends(): Promise<{
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    indicators: { name: string; severity: string; message: string }[];
  }> {
    return AdvancedForecasting.detectRiskTrends();
  }
}
