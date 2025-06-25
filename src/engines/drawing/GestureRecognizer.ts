// src/engines/drawing/GestureRecognizer.ts - ENTERPRISE GESTURE RECOGNITION
/**
 * Advanced Gesture Recognition System
 * Handles complex multi-touch gestures for professional drawing
 * - Multi-finger gesture detection
 * - Palm rejection algorithms
 * - Apple Pencil vs finger differentiation
 * - Quick menu gestures
 * - Drawing shortcuts and hotkeys
 * - Adaptive gesture sensitivity
 */

import { EventBus } from '../core/EventBus';
import { applePencilManager } from './ApplePencilManager';
import { deviceCapabilities } from './DeviceCapabilities';
import { 
  Point, 
  GestureType, 
  GestureState, 
  GestureConfig 
} from '../../types/drawing';

// Touch tracking for multi-finger gestures
interface TrackedTouch {
  id: string;
  startPoint: Point;
  currentPoint: Point;
  lastPoint: Point;
  startTime: number;
  pressure: number;
  radius: number;
  inputType: 'finger' | 'pencil' | 'unknown';
  isActive: boolean;
}

// Gesture detection results
interface GestureResult {
  type: GestureType;
  state: GestureState;
  touches: TrackedTouch[];
  center: Point;
  scale?: number;
  rotation?: number;
  velocity?: Point;
  distance?: number;
  confidence: number; // 0-1
}

// Palm rejection context
interface PalmRejectionContext {
  recentTouches: TrackedTouch[];
  pencilActive: boolean;
  timeWindow: number;
  spatialThreshold: number;
}

/**
 * Enterprise Gesture Recognition System
 */
export class GestureRecognizer {
  private static instance: GestureRecognizer;
  private eventBus = EventBus.getInstance();
  
  // Configuration
  private config: GestureConfig = {
    panThreshold: 10,
    pinchThreshold: 0.1,
    rotationThreshold: 0.1,
    tapDuration: 200,
    doubleTapDuration: 300,
    longPressDuration: 500,
    priorityOrder: ['draw', 'pinch', 'rotate', 'pan', 'tap'],
    enableQuickMenu: true,
    enableTwoFingerTap: true,
    enableThreeFingerSwipe: true,
    enableFourFingerTap: true,
  };
  
  // Touch tracking
  private activeTouches: Map<string, TrackedTouch> = new Map();
  private touchHistory: TrackedTouch[] = [];
  private readonly MAX_TOUCH_HISTORY = 50;
  
  // Gesture state
  private currentGesture: GestureResult | null = null;
  private lastGesture: GestureResult | null = null;
  private gestureStartTime = 0;
  
  // Palm rejection
  private palmRejection: PalmRejectionContext = {
    recentTouches: [],
    pencilActive: false,
    timeWindow: 1000, // 1 second
    spatialThreshold: 40, // pixels
  };
  
  // Quick menu state
  private quickMenuActive = false;
  private quickMenuCenter: Point = { x: 0, y: 0 };
  
  // Performance tracking
  private gestureStats = {
    totalGestures: 0,
    recognizedGestures: 0,
    rejectedTouches: 0,
    averageRecognitionTime: 0,
  };

  private constructor() {
    this.setupEventListeners();
  }

  public static getInstance(): GestureRecognizer {
    if (!GestureRecognizer.instance) {
      GestureRecognizer.instance = new GestureRecognizer();
    }
    return GestureRecognizer.instance;
  }

  // ===== TOUCH PROCESSING =====

  public processTouchStart(touchId: string, point: Point, pressure: number = 0.5, radius: number = 5): boolean {
    // Check if touch should be rejected (palm rejection)
    if (this.shouldRejectTouch(point, pressure, radius)) {
      this.palmRejection.rejectedTouches++;
      return false;
    }
    
    const touch: TrackedTouch = {
      id: touchId,
      startPoint: point,
      currentPoint: point,
      lastPoint: point,
      startTime: Date.now(),
      pressure,
      radius,
      inputType: this.determineInputType(pressure, radius),
      isActive: true,
    };
    
    this.activeTouches.set(touchId, touch);
    this.addToHistory(touch);
    
    // Update palm rejection context
    this.updatePalmRejectionContext(touch);
    
    // Start gesture recognition
    this.recognizeGesture();
    
    return true;
  }

  public processTouchMove(touchId: string, point: Point, pressure: number = 0.5): void {
    const touch = this.activeTouches.get(touchId);
    if (!touch) return;
    
    touch.lastPoint = touch.currentPoint;
    touch.currentPoint = point;
    touch.pressure = pressure;
    
    // Continue gesture recognition
    this.recognizeGesture();
  }

  public processTouchEnd(touchId: string): void {
    const touch = this.activeTouches.get(touchId);
    if (!touch) return;
    
    touch.isActive = false;
    this.activeTouches.delete(touchId);
    
    // Finalize gesture recognition
    this.finalizeGesture();
  }

  // ===== GESTURE RECOGNITION =====

  private recognizeGesture(): void {
    const startTime = performance.now();
    const touches = Array.from(this.activeTouches.values());
    
    if (touches.length === 0) {
      this.currentGesture = null;
      return;
    }
    
    let recognizedGesture: GestureResult | null = null;
    
    // Try to recognize gestures in priority order
    for (const gestureType of this.config.priorityOrder) {
      switch (gestureType) {
        case 'draw':
          recognizedGesture = this.recognizeDrawGesture(touches);
          break;
        case 'pinch':
          recognizedGesture = this.recognizePinchGesture(touches);
          break;
        case 'rotate':
          recognizedGesture = this.recognizeRotationGesture(touches);
          break;
        case 'pan':
          recognizedGesture = this.recognizePanGesture(touches);
          break;
        case 'tap':
          recognizedGesture = this.recognizeTapGesture(touches);
          break;
        case 'long-press':
          recognizedGesture = this.recognizeLongPressGesture(touches);
          break;
        case 'quick-menu':
          recognizedGesture = this.recognizeQuickMenuGesture(touches);
          break;
      }
      
      if (recognizedGesture && recognizedGesture.confidence > 0.7) {
        break;
      }
    }
    
    // Update current gesture
    this.currentGesture = recognizedGesture;
    
    // Emit gesture events
    if (recognizedGesture) {
      this.emitGestureEvent(recognizedGesture);
    }
    
    // Update performance stats
    const recognitionTime = performance.now() - startTime;
    this.gestureStats.averageRecognitionTime = 
      (this.gestureStats.averageRecognitionTime + recognitionTime) / 2;
  }

  private recognizeDrawGesture(touches: TrackedTouch[]): GestureResult | null {
    // Single touch with Apple Pencil or primary finger
    if (touches.length !== 1) return null;
    
    const touch = touches[0];
    const distance = this.calculateDistance(touch.startPoint, touch.currentPoint);
    
    // Must have some movement to be considered drawing
    if (distance < 3) return null;
    
    // Prefer Apple Pencil for drawing
    const confidence = touch.inputType === 'pencil' ? 0.95 : 0.8;
    
    return {
      type: 'draw',
      state: 'changed',
      touches,
      center: touch.currentPoint,
      velocity: this.calculateVelocity(touch),
      confidence,
    };
  }

  private recognizePinchGesture(touches: TrackedTouch[]): GestureResult | null {
    if (touches.length !== 2) return null;
    
    const touch1 = touches[0];
    const touch2 = touches[1];
    
    const startDistance = this.calculateDistance(touch1.startPoint, touch2.startPoint);
    const currentDistance = this.calculateDistance(touch1.currentPoint, touch2.currentPoint);
    
    const scale = currentDistance / startDistance;
    const scaleChange = Math.abs(scale - 1);
    
    if (scaleChange < this.config.pinchThreshold) return null;
    
    const center = this.calculateMidpoint(touch1.currentPoint, touch2.currentPoint);
    
    return {
      type: 'pinch',
      state: 'changed',
      touches,
      center,
      scale,
      confidence: Math.min(0.9, scaleChange * 2),
    };
  }

  private recognizeRotationGesture(touches: TrackedTouch[]): GestureResult | null {
    if (touches.length !== 2) return null;
    
    const touch1 = touches[0];
    const touch2 = touches[1];
    
    const startAngle = this.calculateAngle(touch1.startPoint, touch2.startPoint);
    const currentAngle = this.calculateAngle(touch1.currentPoint, touch2.currentPoint);
    
    const rotation = currentAngle - startAngle;
    const rotationMagnitude = Math.abs(rotation);
    
    if (rotationMagnitude < this.config.rotationThreshold) return null;
    
    const center = this.calculateMidpoint(touch1.currentPoint, touch2.currentPoint);
    
    return {
      type: 'rotate',
      state: 'changed',
      touches,
      center,
      rotation,
      confidence: Math.min(0.9, rotationMagnitude),
    };
  }

  private recognizePanGesture(touches: TrackedTouch[]): GestureResult | null {
    if (touches.length < 1 || touches.length > 3) return null;
    
    // Calculate average movement
    let totalDistance = 0;
    let center = { x: 0, y: 0 };
    
    for (const touch of touches) {
      const distance = this.calculateDistance(touch.startPoint, touch.currentPoint);
      totalDistance += distance;
      center.x += touch.currentPoint.x;
      center.y += touch.currentPoint.y;
    }
    
    const averageDistance = totalDistance / touches.length;
    center.x /= touches.length;
    center.y /= touches.length;
    
    if (averageDistance < this.config.panThreshold) return null;
    
    // Higher confidence for multi-finger pan
    const confidence = touches.length > 1 ? 0.85 : 0.7;
    
    return {
      type: 'pan',
      state: 'changed',
      touches,
      center,
      distance: averageDistance,
      confidence,
    };
  }

  private recognizeTapGesture(touches: TrackedTouch[]): GestureResult | null {
    if (touches.length === 0) return null;
    
    const now = Date.now();
    const touch = touches[0];
    const duration = now - touch.startTime;
    
    // Too long to be a tap
    if (duration > this.config.tapDuration) return null;
    
    // Too much movement to be a tap
    const distance = this.calculateDistance(touch.startPoint, touch.currentPoint);
    if (distance > 10) return null;
    
    // Check for double tap
    const isDoubleTap = this.isDoubleTap(touch);
    const gestureType: GestureType = isDoubleTap ? 'double-tap' : 'tap';
    
    return {
      type: gestureType,
      state: 'ended',
      touches,
      center: touch.currentPoint,
      confidence: 0.8,
    };
  }

  private recognizeLongPressGesture(touches: TrackedTouch[]): GestureResult | null {
    if (touches.length !== 1) return null;
    
    const touch = touches[0];
    const duration = Date.now() - touch.startTime;
    
    if (duration < this.config.longPressDuration) return null;
    
    // Must not have moved much
    const distance = this.calculateDistance(touch.startPoint, touch.currentPoint);
    if (distance > 15) return null;
    
    return {
      type: 'long-press',
      state: 'began',
      touches,
      center: touch.currentPoint,
      confidence: 0.9,
    };
  }

  private recognizeQuickMenuGesture(touches: TrackedTouch[]): GestureResult | null {
    if (!this.config.enableQuickMenu) return null;
    
    // Two finger tap for quick menu
    if (touches.length === 2 && this.config.enableTwoFingerTap) {
      const touch1 = touches[0];
      const touch2 = touches[1];
      
      const duration1 = Date.now() - touch1.startTime;
      const duration2 = Date.now() - touch2.startTime;
      
      // Both taps should be quick and simultaneous
      if (duration1 < this.config.tapDuration && 
          duration2 < this.config.tapDuration &&
          Math.abs(touch1.startTime - touch2.startTime) < 100) {
        
        const center = this.calculateMidpoint(touch1.currentPoint, touch2.currentPoint);
        
        return {
          type: 'quick-menu',
          state: 'began',
          touches,
          center,
          confidence: 0.85,
        };
      }
    }
    
    return null;
  }

  // ===== PALM REJECTION =====

  private shouldRejectTouch(point: Point, pressure: number, radius: number): boolean {
    // Don't reject Apple Pencil input
    if (this.palmRejection.pencilActive) {
      return false;
    }
    
    // Large touch area indicates palm
    if (radius > 20) {
      return true;
    }
    
    // Low pressure with large contact area
    if (pressure < 0.2 && radius > 12) {
      return true;
    }
    
    // Check temporal and spatial proximity to recent touches
    const now = Date.now();
    const recentTouches = this.palmRejection.recentTouches.filter(
      touch => now - touch.startTime < this.palmRejection.timeWindow
    );
    
    for (const recentTouch of recentTouches) {
      if (recentTouch.inputType === 'pencil') {
        const distance = this.calculateDistance(point, recentTouch.currentPoint);
        if (distance < this.palmRejection.spatialThreshold) {
          return true; // Too close to Apple Pencil input
        }
      }
    }
    
    return false;
  }

  private updatePalmRejectionContext(touch: TrackedTouch): void {
    this.palmRejection.recentTouches.push(touch);
    
    // Update pencil active state
    this.palmRejection.pencilActive = touch.inputType === 'pencil';
    
    // Clean old touches
    const now = Date.now();
    this.palmRejection.recentTouches = this.palmRejection.recentTouches.filter(
      t => now - t.startTime < this.palmRejection.timeWindow
    );
  }

  // ===== UTILITY METHODS =====

  private determineInputType(pressure: number, radius: number): 'finger' | 'pencil' | 'unknown' {
    // Apple Pencil typically has higher precision and different pressure characteristics
    if (applePencilManager.isApplePencilConnected()) {
      // Heuristics for Apple Pencil detection
      if (radius < 3 && pressure > 0.1) {
        return 'pencil';
      }
    }
    
    if (radius > 8) {
      return 'finger';
    }
    
    return 'unknown';
  }

  private calculateDistance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private calculateMidpoint(p1: Point, p2: Point): Point {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };
  }

  private calculateAngle(p1: Point, p2: Point): number {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
  }

  private calculateVelocity(touch: TrackedTouch): Point {
    const deltaTime = Date.now() - touch.startTime;
    if (deltaTime === 0) return { x: 0, y: 0 };
    
    const dx = touch.currentPoint.x - touch.lastPoint.x;
    const dy = touch.currentPoint.y - touch.lastPoint.y;
    
    return {
      x: dx / deltaTime,
      y: dy / deltaTime,
    };
  }

  private isDoubleTap(touch: TrackedTouch): boolean {
    if (!this.lastGesture || this.lastGesture.type !== 'tap') {
      return false;
    }
    
    const timeSinceLastTap = touch.startTime - (this.lastGesture.touches[0]?.startTime || 0);
    const distance = this.calculateDistance(
      touch.startPoint,
      this.lastGesture.center
    );
    
    return timeSinceLastTap < this.config.doubleTapDuration && distance < 30;
  }

  private addToHistory(touch: TrackedTouch): void {
    this.touchHistory.push(touch);
    
    // Limit history size
    if (this.touchHistory.length > this.MAX_TOUCH_HISTORY) {
      this.touchHistory.shift();
    }
  }

  private finalizeGesture(): void {
    if (this.currentGesture) {
      this.currentGesture.state = 'ended';
      this.emitGestureEvent(this.currentGesture);
      this.lastGesture = this.currentGesture;
      this.currentGesture = null;
    }
  }

  private emitGestureEvent(gesture: GestureResult): void {
    this.gestureStats.totalGestures++;
    if (gesture.confidence > 0.7) {
      this.gestureStats.recognizedGestures++;
    }
    
    this.eventBus.emit('gesture:recognized', {
      gesture,
      stats: this.gestureStats,
    });
    
    // Emit specific gesture events
    this.eventBus.emit(`gesture:${gesture.type}`, { gesture });
  }

  private setupEventListeners(): void {
    // Listen for Apple Pencil events
    this.eventBus.on('pencil:input', (data: any) => {
      this.palmRejection.pencilActive = true;
    });
    
    this.eventBus.on('pencil:connectionChanged', (data: { connected: boolean }) => {
      if (!data.connected) {
        this.palmRejection.pencilActive = false;
      }
    });
  }

  // ===== PUBLIC API =====

  public updateConfig(newConfig: Partial<GestureConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.eventBus.emit('gesture:configUpdated', { config: this.config });
  }

  public getConfig(): GestureConfig {
    return { ...this.config };
  }

  public getCurrentGesture(): GestureResult | null {
    return this.currentGesture;
  }

  public getStats() {
    return {
      ...this.gestureStats,
      activeTouches: this.activeTouches.size,
      palmRejectionRate: this.gestureStats.rejectedTouches / Math.max(1, this.gestureStats.totalGestures),
    };
  }

  public enableQuickMenu(enabled: boolean): void {
    this.config.enableQuickMenu = enabled;
    this.quickMenuActive = false;
  }

  public isQuickMenuActive(): boolean {
    return this.quickMenuActive;
  }

  public getQuickMenuCenter(): Point {
    return { ...this.quickMenuCenter };
  }

  // ===== CLEANUP =====

  public cleanup(): void {
    this.activeTouches.clear();
    this.touchHistory = [];
    this.palmRejection.recentTouches = [];
    this.currentGesture = null;
    this.lastGesture = null;
    this.quickMenuActive = false;
    
    console.log('🧹 Gesture Recognizer cleaned up');
  }
}

// Export singleton
export const gestureRecognizer = GestureRecognizer.getInstance();