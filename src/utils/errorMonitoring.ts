// Production Error Monitoring
import * as Sentry from '@sentry/react-native';

interface ErrorMonitoringConfig {
  dsn?: string;
  environment: string;
  enabled: boolean;
}

class ErrorMonitoring {
  private config: ErrorMonitoringConfig;
  
  constructor() {
    this.config = {
      dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
      environment: process.env.EXPO_PUBLIC_ENV || 'development',
      enabled: process.env.EXPO_PUBLIC_ENV === 'production'
    };
  }
  
  initialize(): void {
    if (!this.config.enabled) return;
    
    Sentry.init({
      dsn: this.config.dsn,
      environment: this.config.environment,
      enableAutoSessionTracking: true,
      debug: false,
    });
    
    console.log('✅ Error monitoring initialized');
  }
  
  captureError(error: Error, context?: any): void {
    if (this.config.enabled && this.config.dsn) {
      Sentry.captureException(error, { extra: context });
    } else {
      console.error('Error captured:', error, context);
    }
  }
  
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    if (this.config.enabled && this.config.dsn) {
      Sentry.captureMessage(message, level);
    } else {
      console.log(`[${level.toUpperCase()}] ${message}`);
    }
  }
  
  setUser(user: { id: string; email?: string }): void {
    if (this.config.enabled) {
      Sentry.setUser(user);
    }
  }
}

export const errorMonitoring = new ErrorMonitoring();
