// Production Health Check System
interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, {
    status: 'pass' | 'fail' | 'warn';
    message: string;
    duration: number;
  }>;
  timestamp: number;
}

class HealthCheck {
  async runHealthCheck(): Promise<HealthCheckResult> {
    const checks: HealthCheckResult['checks'] = {};
    
    // Check memory usage
    const memoryCheck = await this.checkMemoryUsage();
    checks.memory = memoryCheck;
    
    // Check performance
    const perfCheck = await this.checkPerformance();
    checks.performance = perfCheck;
    
    // Check storage
    const storageCheck = await this.checkStorage();
    checks.storage = storageCheck;
    
    // Determine overall status
    const failedChecks = Object.values(checks).filter(c => c.status === 'fail').length;
    const warnChecks = Object.values(checks).filter(c => c.status === 'warn').length;
    
    let status: HealthCheckResult['status'] = 'healthy';
    if (failedChecks > 0) status = 'unhealthy';
    else if (warnChecks > 1) status = 'degraded';
    
    return {
      status,
      checks,
      timestamp: Date.now()
    };
  }
  
  private async checkMemoryUsage(): Promise<HealthCheckResult['checks']['memory']> {
    const start = performance.now();
    
    try {
      // Basic memory check (platform-specific implementation needed)
      const memoryInfo = (performance as any).memory;
      const used = memoryInfo?.usedJSHeapSize || 0;
      const limit = memoryInfo?.jsHeapSizeLimit || 100000000;
      const usage = used / limit;
      
      return {
        status: usage > 0.8 ? 'fail' : usage > 0.6 ? 'warn' : 'pass',
        message: `Memory usage: ${(usage * 100).toFixed(1)}%`,
        duration: performance.now() - start
      };
    } catch (error) {
      return {
        status: 'warn',
        message: 'Memory check not available on this platform',
        duration: performance.now() - start
      };
    }
  }
  
  private async checkPerformance(): Promise<HealthCheckResult['checks']['performance']> {
    const start = performance.now();
    
    // Simple performance test
    const iterations = 10000;
    const testStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      Math.random();
    }
    const testDuration = performance.now() - testStart;
    
    return {
      status: testDuration > 100 ? 'warn' : 'pass',
      message: `Performance test: ${testDuration.toFixed(2)}ms`,
      duration: performance.now() - start
    };
  }
  
  private async checkStorage(): Promise<HealthCheckResult['checks']['storage']> {
    const start = performance.now();
    
    try {
      // Test local storage access
      const testKey = '__health_check__';
      localStorage.setItem(testKey, 'test');
      const value = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      return {
        status: value === 'test' ? 'pass' : 'fail',
        message: value === 'test' ? 'Storage operational' : 'Storage not working',
        duration: performance.now() - start
      };
    } catch (error) {
      return {
        status: 'fail',
        message: 'Storage access failed',
        duration: performance.now() - start
      };
    }
  }
}

export const healthCheck = new HealthCheck();
