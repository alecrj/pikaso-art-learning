export const APP_CONFIG = {
  environment: process.env.EXPO_PUBLIC_ENV || 'development',
  apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
  
  performance: {
    memory: {
      maxCacheSize: 100 * 1024 * 1024, // 100MB
      gcThreshold: 0.8,
    },
    rendering: {
      targetFPS: 60,
      maxDrawCalls: 1000,
    },
    network: {
      timeout: 30000,
      retryAttempts: 3,
    }
  },
  
  security: {
    enableEncryption: true,
    enableRateLimiting: true,
    maxLoginAttempts: 5,
  },
  
  features: {
    realTimeCollaboration: true,
    aiAssistance: true,
    advancedAnalytics: true,
  }
};
