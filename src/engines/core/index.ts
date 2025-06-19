// src/engines/core/index.ts
export { ErrorHandler } from './ErrorHandler';
export { ErrorBoundary, withErrorBoundary } from './ErrorBoundary';
export { PerformanceMonitor } from './PerformanceMonitor';
export { dataManager } from './DataManager';
export { EventBus } from './EventBus';

import { ErrorHandler } from './ErrorHandler';
import { PerformanceMonitor } from './PerformanceMonitor';
import { dataManager } from './DataManager';
import { EventBus } from './EventBus';

export const errorHandler = ErrorHandler.getInstance();
export const performanceMonitor = PerformanceMonitor.getInstance();
export const eventBus = EventBus.getInstance();

export async function initializeCoreEngine(): Promise<void> {
  try {
    performanceMonitor.startMonitoring();
    errorHandler.initialize();
    console.log('Core engine initialized successfully');
  } catch (error) {
    console.error('Failed to initialize core engine:', error);
    throw error;
  }
}