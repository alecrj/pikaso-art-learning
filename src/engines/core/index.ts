// src/engines/core/index.ts - ENTERPRISE CORE ENGINE EXPORTS

// FIXED: Properly export both classes and instances
export { ErrorHandler, errorHandler } from './ErrorHandler';
export { EventBus } from './EventBus';
export { dataManager } from './DataManager';
export { PerformanceMonitor, performanceMonitor } from './PerformanceMonitor';

// FIXED: Proper type exports with correct names
export type { 
  StructuredError, 
  ErrorReport, 
  ErrorHandlerConfig,
  ErrorSeverity,
  ErrorCategory 
} from './ErrorHandler';

export type { PerformanceMetrics } from './PerformanceMonitor';

// Create instances for global access
const errorHandlerInstance = errorHandler;
const performanceMonitorInstance = performanceMonitor;

// FIXED: Create a unified core API for enterprise use
class CoreEngine {
  private static instance: CoreEngine;

  private constructor() {}

  public static getInstance(): CoreEngine {
    if (!CoreEngine.instance) {
      CoreEngine.instance = new CoreEngine();
    }
    return CoreEngine.instance;
  }

  public async initialize(): Promise<boolean> {
    try {
      // Initialize error handler first
      errorHandlerInstance.initialize({
        enableLogging: true,
        enableReporting: true,
        enableUserNotification: true,
        maxErrorsPerSession: 100,
        environment: __DEV__ ? 'development' : 'production',
      });

      // Start performance monitoring
      performanceMonitorInstance.startMonitoring();

      console.log('🚀 Core Engine initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Core Engine initialization failed:', error);
      return false;
    }
  }

  public async cleanup(): Promise<void> {
    try {
      errorHandlerInstance.cleanup();
      performanceMonitorInstance.stopMonitoring();
      console.log('🧹 Core Engine cleaned up');
    } catch (error) {
      console.error('❌ Core Engine cleanup failed:', error);
    }
  }

  public isReady(): boolean {
    return errorHandlerInstance.isInitialized() && performanceMonitorInstance.isMonitoring();
  }
}

export const coreEngine = CoreEngine.getInstance();
export { CoreEngine };

// Convenience function for initializing all core systems
export async function initializeCoreEngine(): Promise<boolean> {
  return coreEngine.initialize();
}