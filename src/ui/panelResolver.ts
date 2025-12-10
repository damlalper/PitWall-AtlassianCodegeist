import Resolver from '@forge/resolver';

const resolver = new Resolver();

/**
 * Panel Resolver for Custom UI
 * Provides dynamic data to the static HTML panel
 */
resolver.define('getData', async (_req) => {
  console.warn('[PitWall Panel] 🏎️ Loading telemetry dashboard...');

  try {
    // Return panel data - can be extended with real-time data
    return {
      status: 'online',
      telemetryReady: true,
      aiEngineActive: true,
      mttrTarget: '< 5 minutes',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[PitWall Panel] Error loading panel data:', error);
    return {
      status: 'error',
      telemetryReady: false,
      aiEngineActive: false,
      mttrTarget: 'N/A',
      timestamp: new Date().toISOString(),
    };
  }
});

export const handler = resolver.getDefinitions();
