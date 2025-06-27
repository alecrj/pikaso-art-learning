// Production Performance Monitoring
interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  context?: any;
}

class PerformanceMonitoring {
  private metrics: PerformanceMetric[] = [];
  private enabled: boolean;
  
  constructor() {
    this.enabled = process.env.EXPO_PUBLIC_ENABLE_PERFORMANCE_MONITORING === 'true';
  }
  
  startTiming(name: string): () => void {
    if (!this.enabled) return () => {};
    
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration);
    };
  }
  
  recordMetric(name: string, value: number, context?: any): void {
    if (!this.enabled) return;
    
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      context
    };
    
    this.metrics.push(metric);
    
    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500);
    }
    
    // Log slow operations
    if (value > 1000) { // > 1 second
      console.warn(`🐌 Slow operation: ${name} took ${value.toFixed(2)}ms`);
    }
  }
  
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }
  
  getAverageMetric(name: string): number {
    const matchingMetrics = this.metrics.filter(m => m.name === name);
    if (matchingMetrics.length === 0) return 0;
    
    const sum = matchingMetrics.reduce((acc, m) => acc + m.value, 0);
    return sum / matchingMetrics.length;
  }
  
  generateReport(): any {
    const uniqueNames = [...new Set(this.metrics.map(m => m.name))];
    
    return {
      totalMetrics: this.metrics.length,
      timeRange: {
        start: Math.min(...this.metrics.map(m => m.timestamp)),
        end: Math.max(...this.metrics.map(m => m.timestamp))
      },
      averages: uniqueNames.reduce((acc, name) => {
        acc[name] = this.getAverageMetric(name);
        return acc;
      }, {} as Record<string, number>)
    };
  }
}

export const performanceMonitoring = new PerformanceMonitoring();
