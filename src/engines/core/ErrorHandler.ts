import { AppError } from '../../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Comprehensive error handling system for production-ready error management
 * Handles errors gracefully, logs them, and provides user-friendly feedback
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorQueue: AppError[] = [];
  private maxQueueSize = 100;
  private errorHandlers: Map<string, (error: AppError) => void> = new Map();
  private isOnline: boolean = true;
  private userId?: string;
  private isInitialized: boolean = false;

  private constructor() {
    // Don't setup handlers in constructor - wait for initialize()
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // FIXED: Added missing initialize method
  public initialize(): void {
    if (this.isInitialized) {
      return;
    }

    this.setupGlobalErrorHandlers();
    this.setupNetworkListener();
    this.isInitialized = true;
    console.log('ErrorHandler initialized');
  }

  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        this.handleError({
          code: 'UNHANDLED_PROMISE_REJECTION',
          message: event.reason?.message || 'Unhandled promise rejection',
          severity: 'high',
          context: { reason: event.reason },
          timestamp: new Date(),
        });
        event.preventDefault();
      });

      // Handle global errors
      window.addEventListener('error', (event) => {
        this.handleError({
          code: 'GLOBAL_ERROR',
          message: event.message,
          severity: 'high',
          context: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
          timestamp: new Date(),
        });
      });
    }
  }

  private setupNetworkListener(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.flushErrorQueue();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
  }

  public setUserId(userId: string): void {
    this.userId = userId;
  }

  public handleError(error: AppError): void {
    // Add user context
    if (this.userId) {
      error.userId = this.userId;
    }

    // Log to console in development
    if (__DEV__) {
      console.error('App Error:', error);
    }

    // Store error locally
    this.storeError(error);

    // Execute registered handlers
    this.executeHandlers(error);

    // Send to remote logging if online
    if (this.isOnline) {
      this.sendToRemoteLogging(error);
    } else {
      this.queueError(error);
    }

    // Show user notification for critical errors
    if (error.severity === 'critical') {
      this.notifyUser(error);
    }
  }

  private async storeError(error: AppError): Promise<void> {
    try {
      const errors = await this.getStoredErrors();
      errors.push(error);
      
      // Keep only last 100 errors
      if (errors.length > this.maxQueueSize) {
        errors.splice(0, errors.length - this.maxQueueSize);
      }
      
      await AsyncStorage.setItem('app_errors', JSON.stringify(errors));
    } catch (e) {
      console.error('Failed to store error:', e);
    }
  }

  private async getStoredErrors(): Promise<AppError[]> {
    try {
      const stored = await AsyncStorage.getItem('app_errors');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private executeHandlers(error: AppError): void {
    this.errorHandlers.forEach((handler, code) => {
      if (error.code === code || code === '*') {
        handler(error);
      }
    });
  }

  private queueError(error: AppError): void {
    this.errorQueue.push(error);
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }
  }

  private async flushErrorQueue(): Promise<void> {
    const errors = [...this.errorQueue];
    this.errorQueue = [];
    
    for (const error of errors) {
      await this.sendToRemoteLogging(error);
    }
  }

  private async sendToRemoteLogging(error: AppError): Promise<void> {
    // In production, this would send to a service like Sentry or LogRocket
    try {
      // Placeholder for remote logging service
      if (typeof fetch !== 'undefined' && process.env.ERROR_LOGGING_ENDPOINT) {
        await fetch(process.env.ERROR_LOGGING_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(error),
        });
      }
    } catch (e) {
      // Silently fail - we don't want error logging to cause more errors
      console.warn('Failed to send error to remote logging:', e);
    }
  }

  private notifyUser(error: AppError): void {
    // This would integrate with a toast/alert system
    if (typeof window !== 'undefined' && (window as any).showErrorNotification) {
      (window as any).showErrorNotification({
        title: 'An error occurred',
        message: this.getUserFriendlyMessage(error),
        severity: error.severity,
      });
    }
  }

  private getUserFriendlyMessage(error: AppError): string {
    const messages: Record<string, string> = {
      NETWORK_ERROR: 'Unable to connect. Please check your internet connection.',
      AUTH_ERROR: 'Authentication failed. Please try logging in again.',
      STORAGE_FULL: 'Device storage is full. Please free up some space.',
      DRAWING_ERROR: 'An error occurred while drawing. Your work has been saved.',
      LESSON_LOAD_ERROR: 'Unable to load lesson. Please try again.',
      SYNC_ERROR: 'Unable to sync your progress. Changes saved locally.',
      PERMISSION_DENIED: 'Permission denied. Please check app settings.',
      DEFAULT: 'Something went wrong. Please try again.',
    };

    return messages[error.code] || messages.DEFAULT;
  }

  public registerHandler(code: string, handler: (error: AppError) => void): void {
    this.errorHandlers.set(code, handler);
  }

  public unregisterHandler(code: string): void {
    this.errorHandlers.delete(code);
  }

  public async getErrorLog(): Promise<AppError[]> {
    return this.getStoredErrors();
  }

  public async clearErrorLog(): Promise<void> {
    await AsyncStorage.removeItem('app_errors');
  }

  // Error creation helpers
  public createError(
    code: string,
    message: string,
    severity: AppError['severity'] = 'medium',
    context?: any
  ): AppError {
    return {
      code,
      message,
      severity,
      context,
      timestamp: new Date(),
      userId: this.userId,
    };
  }

  // Common error creators
  public networkError(message: string, context?: any): AppError {
    return this.createError('NETWORK_ERROR', message, 'medium', context);
  }

  public authError(message: string, context?: any): AppError {
    return this.createError('AUTH_ERROR', message, 'high', context);
  }

  public validationError(message: string, context?: any): AppError {
    return this.createError('VALIDATION_ERROR', message, 'low', context);
  }

  public storageError(message: string, context?: any): AppError {
    return this.createError('STORAGE_ERROR', message, 'high', context);
  }

  public drawingError(message: string, context?: any): AppError {
    return this.createError('DRAWING_ERROR', message, 'medium', context);
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();