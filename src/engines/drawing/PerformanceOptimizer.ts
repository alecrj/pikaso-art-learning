// src/engines/drawing/PerformanceOptimizer.ts - ENHANCED FOR 120FPS
import { Platform } from 'react-native';
import { performanceMonitor } from '../core/PerformanceMonitor';
import { EventBus } from '../core/EventBus';
import { Point, Stroke } from '../../types';

/**
 * Enhanced Performance Optimizer for 120fps Drawing
 * Implements aggressive optimization strategies for ProMotion displays
 */
export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private eventBus: EventBus = EventBus.getInstance();
  
  // Performance targets
  private readonly TARGET_FPS = Platform.OS === 'ios' ? 120 : 60;
  private readonly FRAME_BUDGET = 1000 / this.TARGET_FPS; // 8.33ms for 120fps
  private readonly CRITICAL_FRAME_TIME = this.FRAME_BUDGET * 0.8; // 80% of budget
  
  // Performance metrics
  private frameCount: number = 0;
  private lastFrameTime: number = 0;
  private frameTimeHistory: number[] = [];
  private consecutiveSlowFrames: number = 0;
  
  // Optimization state
  private optimizationLevel: 0 | 1 | 2 = 0;
  private qualitySettings = {
    strokeSmoothing: 1.0,
    pathComplexity: 1.0,
    renderingQuality: 1.0,
    pointDensity: 1.0,
  };
  
  // Frame timing
  private rafId: number | null = null;
  private isMonitoring: boolean = false;
  
  // Canvas optimization
  private shouldSimplifyPaths: boolean = false;
  private shouldReducePointDensity: boolean = false;
  private shouldBatchRenders: boolean = false;
  private renderBatchSize: number = 10;
  
  // Memory management
  private lastGC: number = 0;
  private readonly GC_INTERVAL = 30000; // 30 seconds

  private constructor() {
    this.setupOptimizations();
  }

  public static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  // ---- PUBLIC API ----

  public startFrame(): void {
    this.lastFrameTime = performance.now();
  }

  public endFrame(): void {
    const frameTime = performance.now() - this.lastFrameTime;
    this.recordFrameTime(frameTime);
    
    // Check if we need to optimize
    if (frameTime > this.CRITICAL_FRAME_TIME) {
      this.consecutiveSlowFrames++;
      
      if (this.consecutiveSlowFrames > 3) {
        this.increaseOptimization();
      }
    } else {
      this.consecutiveSlowFrames = 0;
      
      // Consider reducing optimization if performance is good
      if (this.getAverageFPS() > this.TARGET_FPS * 0.95) {
        this.considerReducingOptimization();
      }
    }
  }

  public recordDrawCall(): void {
    this.frameCount++;
  }

  public getMetrics() {
    const avgFrameTime = this.getAverageFrameTime();
    const fps = avgFrameTime > 0 ? Math.round(1000 / avgFrameTime) : this.TARGET_FPS;
    
    return {
      fps,
      frameTime: avgFrameTime,
      optimizationLevel: this.optimizationLevel,
      qualitySettings: { ...this.qualitySettings },
      targetFPS: this.TARGET_FPS,
      frameCount: this.frameCount,
    };
  }

  public optimizeStroke(stroke: Stroke): Stroke {
    if (this.optimizationLevel === 0) return stroke;
    
    let optimizedStroke = { ...stroke };
    
    // Reduce point density based on optimization level
    if (this.shouldReducePointDensity) {
      optimizedStroke.points = this.reducePointDensity(
        stroke.points,
        this.qualitySettings.pointDensity
      );
    }
    
    // Simplify path if needed
    if (this.shouldSimplifyPaths && optimizedStroke.points.length > 10) {
      optimizedStroke.points = this.simplifyPath(
        optimizedStroke.points,
        this.qualitySettings.pathComplexity
      );
    }
    
    return optimizedStroke;
  }

  public shouldBatchRender(): boolean {
    return this.shouldBatchRenders;
  }

  public getBatchSize(): number {
    return this.renderBatchSize;
  }

  public getQualitySettings() {
    return { ...this.qualitySettings };
  }

  public forceOptimizationLevel(level: 0 | 1 | 2): void {
    this.setOptimizationLevel(level);
  }

  // ---- PRIVATE METHODS ----

  private setupOptimizations(): void {
    // iOS ProMotion specific optimizations
    if (Platform.OS === 'ios') {
      // Enable CADisplayLink for 120Hz displays
      this.enableHighRefreshRate();
    }
    
    // Start monitoring
    this.startPerformanceMonitoring();
  }

  private enableHighRefreshRate(): void {
    // This would interface with native code to enable ProMotion
    console.log('🚀 Enabling 120Hz ProMotion display support');
  }

  private startPerformanceMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    const monitor = () => {
      if (!this.isMonitoring) return;
      
      // Check for memory pressure
      const now = Date.now();
      if (now - this.lastGC > this.GC_INTERVAL) {
        this.performGarbageCollection();
        this.lastGC = now;
      }
      
      // Calculate FPS
      const fps = this.getAverageFPS();
      
      // Emit performance event
      this.eventBus.emit('performance:update', {
        fps,
        optimizationLevel: this.optimizationLevel,
        qualitySettings: this.qualitySettings,
      });
      
      // Continue monitoring
      this.rafId = requestAnimationFrame(monitor);
    };
    
    this.rafId = requestAnimationFrame(monitor);
  }

  private recordFrameTime(frameTime: number): void {
    this.frameTimeHistory.push(frameTime);
    
    // Keep only last 60 frames
    if (this.frameTimeHistory.length > 60) {
      this.frameTimeHistory.shift();
    }
  }

  private getAverageFrameTime(): number {
    if (this.frameTimeHistory.length === 0) return this.FRAME_BUDGET;
    
    const sum = this.frameTimeHistory.reduce((a, b) => a + b, 0);
    return sum / this.frameTimeHistory.length;
  }

  private getAverageFPS(): number {
    const avgFrameTime = this.getAverageFrameTime();
    return avgFrameTime > 0 ? 1000 / avgFrameTime : this.TARGET_FPS;
  }

  private increaseOptimization(): void {
    if (this.optimizationLevel >= 2) return;
    
    this.setOptimizationLevel((this.optimizationLevel + 1) as 0 | 1 | 2);
    
    console.warn(`⚡ Increasing optimization to level ${this.optimizationLevel}`);
    
    this.eventBus.emit('performance:optimization_changed', {
      level: this.optimizationLevel,
      reason: 'low_fps',
    });
  }

  private considerReducingOptimization(): void {
    if (this.optimizationLevel === 0) return;
    
    const fps = this.getAverageFPS();
    
    // Only reduce if we're consistently hitting target FPS
    if (fps >= this.TARGET_FPS * 0.95 && this.frameTimeHistory.length >= 30) {
      const recentFrames = this.frameTimeHistory.slice(-30);
      const allFast = recentFrames.every(time => time < this.FRAME_BUDGET * 0.7);
      
      if (allFast) {
        this.setOptimizationLevel((this.optimizationLevel - 1) as 0 | 1 | 2);
        
        console.log(`✨ Reducing optimization to level ${this.optimizationLevel}`);
        
        this.eventBus.emit('performance:optimization_changed', {
          level: this.optimizationLevel,
          reason: 'high_fps',
        });
      }
    }
  }

  private setOptimizationLevel(level: 0 | 1 | 2): void {
    this.optimizationLevel = level;
    
    switch (level) {
      case 0: // No optimization - full quality
        this.qualitySettings = {
          strokeSmoothing: 1.0,
          pathComplexity: 1.0,
          renderingQuality: 1.0,
          pointDensity: 1.0,
        };
        this.shouldSimplifyPaths = false;
        this.shouldReducePointDensity = false;
        this.shouldBatchRenders = false;
        this.renderBatchSize = 1;
        break;
        
      case 1: // Mild optimization
        this.qualitySettings = {
          strokeSmoothing: 0.8,
          pathComplexity: 0.8,
          renderingQuality: 0.9,
          pointDensity: 0.8,
        };
        this.shouldSimplifyPaths = true;
        this.shouldReducePointDensity = true;
        this.shouldBatchRenders = true;
        this.renderBatchSize = 5;
        break;
        
      case 2: // Aggressive optimization
        this.qualitySettings = {
          strokeSmoothing: 0.5,
          pathComplexity: 0.5,
          renderingQuality: 0.7,
          pointDensity: 0.5,
        };
        this.shouldSimplifyPaths = true;
        this.shouldReducePointDensity = true;
        this.shouldBatchRenders = true;
        this.renderBatchSize = 10;
        break;
    }
  }

  private reducePointDensity(points: Point[], density: number): Point[] {
    if (density >= 1 || points.length < 3) return points;
    
    const step = Math.ceil(1 / density);
    const reduced: Point[] = [points[0]]; // Always keep first point
    
    for (let i = step; i < points.length - 1; i += step) {
      reduced.push(points[i]);
    }
    
    // Always keep last point
    reduced.push(points[points.length - 1]);
    
    return reduced;
  }

  private simplifyPath(points: Point[], complexity: number): Point[] {
    if (complexity >= 1 || points.length < 3) return points;
    
    // Douglas-Peucker algorithm with dynamic epsilon
    const epsilon = (1 - complexity) * 5; // Adjust epsilon based on complexity
    return this.douglasPeucker(points, epsilon);
  }

  private douglasPeucker(points: Point[], epsilon: number): Point[] {
    if (points.length < 3) return points;
    
    // Find point with maximum distance
    let maxDistance = 0;
    let maxIndex = 0;
    
    for (let i = 1; i < points.length - 1; i++) {
      const distance = this.perpendicularDistance(
        points[i],
        points[0],
        points[points.length - 1]
      );
      
      if (distance > maxDistance) {
        maxDistance = distance;
        maxIndex = i;
      }
    }
    
    // If max distance is greater than epsilon, recursively simplify
    if (maxDistance > epsilon) {
      const left = this.douglasPeucker(points.slice(0, maxIndex + 1), epsilon);
      const right = this.douglasPeucker(points.slice(maxIndex), epsilon);
      
      return [...left.slice(0, -1), ...right];
    } else {
      return [points[0], points[points.length - 1]];
    }
  }

  private perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    
    if (dx === 0 && dy === 0) {
      return Math.sqrt(
        Math.pow(point.x - lineStart.x, 2) +
        Math.pow(point.y - lineStart.y, 2)
      );
    }
    
    const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / 
              (dx * dx + dy * dy);
    
    const projX = lineStart.x + t * dx;
    const projY = lineStart.y + t * dy;
    
    return Math.sqrt(
      Math.pow(point.x - projX, 2) +
      Math.pow(point.y - projY, 2)
    );
  }

  private performGarbageCollection(): void {
    // Clear frame time history if too large
    if (this.frameTimeHistory.length > 120) {
      this.frameTimeHistory = this.frameTimeHistory.slice(-60);
    }
    
    // Reset frame count periodically
    if (this.frameCount > 10000) {
      this.frameCount = 0;
    }
    
    console.log('🗑️ Performed garbage collection');
  }

  public destroy(): void {
    this.isMonitoring = false;
    
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    
    this.frameTimeHistory = [];
    this.frameCount = 0;
  }
}

// Export singleton instance
export const performanceOptimizer = PerformanceOptimizer.getInstance();