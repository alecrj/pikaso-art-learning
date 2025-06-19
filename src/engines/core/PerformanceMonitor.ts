import { AppState, AppStateStatus } from 'react-native';
import { PerformanceMetrics } from '../../types';
import { errorHandler } from './ErrorHandler';

/**
 * Performance Monitor - React Native Compatible
 * Tracks app performance metrics without relying on web APIs
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private isMonitoring: boolean = false;
  private metrics: PerformanceMetrics = {
    fps: 60,
    frameTime: 16.67,
    memoryUsage: 0,
    drawCalls: 0,
    inputLatency: 0,
    renderTime: 0,
  };

  private frameCount: number = 0;
  private lastFrameTime: number = 0;
  private drawCallCount: number = 0;
  private renderTimes: number[] = [];
  private memoryWarningThreshold: number = 100; // MB

  // Performance tracking intervals
  private fpsInterval: NodeJS.Timeout | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;
  // FIXED: Use subscription instead of removeEventListener
  private appStateSubscription: any = null;

  private constructor() {}

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  public startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('Performance monitoring started (React Native mode)');

    // FIXED: Use modern addEventListener that returns subscription
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);

    // Start FPS monitoring
    this.startFPSMonitoring();

    // Start periodic metrics collection
    this.startMetricsCollection();
  }

  public stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    console.log('Performance monitoring stopped');

    // FIXED: Remove subscription properly
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    // Clear intervals
    if (this.fpsInterval) {
      clearInterval(this.fpsInterval);
      this.fpsInterval = null;
    }

    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }

  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      console.log('App became active - resuming performance monitoring');
      if (!this.isMonitoring) {
        this.startMonitoring();
      }
    } else if (nextAppState === 'background') {
      console.log('App went to background - pausing performance monitoring');
    }
  };

  private startFPSMonitoring(): void {
    let frameStartTime = performance.now();
    let frameCount = 0;

    const measureFrame = () => {
      const now = performance.now();
      frameCount++;

      // Calculate FPS every second
      if (now - frameStartTime >= 1000) {
        this.metrics.fps = frameCount;
        this.metrics.frameTime = 1000 / frameCount;

        // Check for performance issues
        if (this.metrics.fps < 50) {
          this.reportPerformanceIssue({
            type: 'low_fps',
            fps: this.metrics.fps,
            frameTime: this.metrics.frameTime,
            recommendation: 'Reduce active layers or drawing complexity'
          });
        }

        // Reset counters
        frameCount = 0;
        frameStartTime = now;
      }

      if (this.isMonitoring) {
        requestAnimationFrame(measureFrame);
      }
    };

    requestAnimationFrame(measureFrame);
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, 5000); // Collect metrics every 5 seconds
  }

  private collectMetrics(): void {
    // Estimate memory usage (React Native doesn't have direct access)
    // This is a rough estimate based on app usage patterns
    const estimatedMemory = this.estimateMemoryUsage();
    this.metrics.memoryUsage = estimatedMemory;

    // Calculate average render time
    if (this.renderTimes.length > 0) {
      const avgRenderTime = this.renderTimes.reduce((sum, time) => sum + time, 0) / this.renderTimes.length;
      this.metrics.renderTime = avgRenderTime;
      
      // Keep only recent render times
      if (this.renderTimes.length > 100) {
        this.renderTimes = this.renderTimes.slice(-50);
      }
    }

    // Check for memory warnings
    if (this.metrics.memoryUsage > this.memoryWarningThreshold) {
      this.reportPerformanceIssue({
        type: 'high_memory',
        memoryUsage: this.metrics.memoryUsage,
        recommendation: 'Clear unused resources or reduce layer count'
      });
    }
  }

  private estimateMemoryUsage(): number {
    // Rough estimation based on draw calls and other factors
    // In a real app, you might use native modules to get actual memory usage
    const baseMemory = 30; // Base app memory in MB
    const drawCallMemory = this.drawCallCount * 0.1; // Estimate memory per draw call
    const layerMemory = 10; // Estimate for layers and canvas data
    
    return baseMemory + drawCallMemory + layerMemory;
  }

  private reportPerformanceIssue(issue: any): void {
    console.warn('Critical performance issue detected:', issue);
    
    errorHandler.handleError({
      code: 'PERFORMANCE_ISSUE',
      message: `Performance issue: ${issue.type}`,
      severity: 'medium',
      context: issue,
      timestamp: new Date(),
    });
  }

  // Public API methods
  public recordDrawCall(): void {
    this.drawCallCount++;
    this.metrics.drawCalls = this.drawCallCount;
  }

  public recordRenderTime(renderTime: number): void {
    this.renderTimes.push(renderTime);
  }

  public recordInputLatency(latency: number): void {
    this.metrics.inputLatency = latency;
  }

  // FIXED: Added missing resetDrawCalls method that LessonEngine needs
  public resetDrawCalls(): void {
    this.drawCallCount = 0;
    this.metrics.drawCalls = 0;
    console.log('Draw calls counter reset');
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public resetMetrics(): void {
    this.drawCallCount = 0;
    this.renderTimes = [];
    this.metrics = {
      fps: 60,
      frameTime: 16.67,
      memoryUsage: 0,
      drawCalls: 0,
      inputLatency: 0,
      renderTime: 0,
    };
  }

  // App lifecycle methods
  public recordAppLaunch(): void {
    console.log('App launch recorded');
    this.resetMetrics();
  }

  public recordScreenTransition(screenName: string): void {
    console.log(`Screen transition recorded: ${screenName}`);
  }

  // Performance optimization suggestions
  public getOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];

    if (this.metrics.fps < 50) {
      suggestions.push('Reduce number of active layers');
      suggestions.push('Simplify brush complexity');
      suggestions.push('Lower canvas resolution for complex scenes');
    }

    if (this.metrics.memoryUsage > this.memoryWarningThreshold) {
      suggestions.push('Clear undo history');
      suggestions.push('Merge completed layers');
      suggestions.push('Reduce image resolution');
    }

    if (this.metrics.renderTime > 20) {
      suggestions.push('Enable performance mode');
      suggestions.push('Reduce anti-aliasing quality');
      suggestions.push('Limit simultaneous animations');
    }

    return suggestions;
  }

  // Debug information
  public getDebugInfo(): object {
    return {
      isMonitoring: this.isMonitoring,
      metrics: this.metrics,
      frameCount: this.frameCount,
      drawCallCount: this.drawCallCount,
      renderTimesCount: this.renderTimes.length,
      memoryWarningThreshold: this.memoryWarningThreshold,
      optimizationSuggestions: this.getOptimizationSuggestions(),
    };
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();