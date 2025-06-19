// src/engines/drawing/GestureRecognizer.ts
import { 
    TouchInfo, 
    ExtendedTouchInfo 
  } from './SkiaCompatibility';
  import { 
    GestureType, 
    GestureConfig,
    GestureState,
    Point,
  } from '../../types/drawing';
  import { EventBus } from '../core/EventBus';
  
  /**
   * Gesture Recognizer - Procreate-style multi-touch gesture detection
   * Supports drawing, pan, pinch, rotate, and special gestures
   */
  export class GestureRecognizer {
    private static instance: GestureRecognizer;
    private eventBus = EventBus.getInstance();
    
    // Gesture configuration
    private config: GestureConfig = {
      // Thresholds
      panThreshold: 10,
      pinchThreshold: 0.1,
      rotationThreshold: 5,
      tapDuration: 300,
      doubleTapDuration: 300,
      longPressDuration: 500,
      
      // Gesture priorities
      priorityOrder: ['tap', 'draw', 'pan', 'pinch', 'rotate'],
      
      // Feature toggles
      enableQuickMenu: true,
      enableTwoFingerTap: true,
      enableThreeFingerSwipe: true,
      enableFourFingerTap: true,
    };
    
    // Gesture state tracking
    private currentGesture: GestureType = 'none';
    private gestureState: GestureState = 'possible';
    private touchStartTime: number = 0;
    private touchStartPositions: Map<number, Point> = new Map();
    private lastTapTime: number = 0;
    private lastTapPosition: Point | null = null;
    
    // Gesture-specific state
    private initialDistance: number = 0;
    private initialAngle: number = 0;
    private accumulatedTranslation: Point = { x: 0, y: 0 };
    private accumulatedScale: number = 1;
    private accumulatedRotation: number = 0;
    
    // Special gesture detection
    private twoFingerTapTimer: NodeJS.Timeout | null = null;
    private threeFingerSwipeStartX: number = 0;
    private quickMenuTimer: NodeJS.Timeout | null = null;
  
    private constructor() {}
  
    public static getInstance(): GestureRecognizer {
      if (!GestureRecognizer.instance) {
        GestureRecognizer.instance = new GestureRecognizer();
      }
      return GestureRecognizer.instance;
    }
  
    // ===== PUBLIC API =====
  
    public initialize(config?: Partial<GestureConfig>): void {
      if (config) {
        this.config = { ...this.config, ...config };
      }
      
      console.log('👆 Gesture Recognizer initialized');
    }
  
    public detectGesture(touches: ExtendedTouchInfo[], previousGesture: GestureType): GestureType {
      const touchCount = touches.length;
      
      // Handle touch start
      if (this.gestureState === 'possible' || previousGesture === 'none') {
        this.handleTouchStart(touches);
      }
      
      // No touches - reset
      if (touchCount === 0) {
        return this.handleNoTouches(previousGesture);
      }
      
      // Special gestures first
      const specialGesture = this.detectSpecialGestures(touches, previousGesture);
      if (specialGesture !== 'none') {
        return specialGesture;
      }
      
      // Single touch gestures
      if (touchCount === 1) {
        return this.detectSingleTouchGesture(touches[0], previousGesture);
      }
      
      // Multi-touch gestures
      if (touchCount === 2) {
        return this.detectTwoTouchGesture(touches, previousGesture);
      }
      
      // Three+ finger gestures
      if (touchCount >= 3) {
        return this.detectMultiTouchGesture(touches, previousGesture);
      }
      
      return previousGesture;
    }
  
    public getGestureState(): GestureState {
      return this.gestureState;
    }
  
    public getGestureData(): {
      translation: Point;
      scale: number;
      rotation: number;
      velocity: Point;
    } {
      return {
        translation: this.accumulatedTranslation,
        scale: this.accumulatedScale,
        rotation: this.accumulatedRotation,
        velocity: this.calculateVelocity(),
      };
    }
  
    public reset(): void {
      this.currentGesture = 'none';
      this.gestureState = 'possible';
      this.touchStartPositions.clear();
      this.accumulatedTranslation = { x: 0, y: 0 };
      this.accumulatedScale = 1;
      this.accumulatedRotation = 0;
      
      this.clearTimers();
    }
  
    // ===== PRIVATE METHODS =====
  
    private handleTouchStart(touches: ExtendedTouchInfo[]): void {
      this.touchStartTime = Date.now();
      this.gestureState = 'began';
      
      // Store initial positions
      this.touchStartPositions.clear();
      touches.forEach(touch => {
        this.touchStartPositions.set(touch.id, {
          x: touch.x,
          y: touch.y,
          timestamp: touch.timestamp || Date.now(),
        });
      });
      
      // Initialize multi-touch values
      if (touches.length === 2) {
        this.initialDistance = this.calculateDistance(touches[0], touches[1]);
        this.initialAngle = this.calculateAngle(touches[0], touches[1]);
      }
    }
  
    private handleNoTouches(previousGesture: GestureType): GestureType {
      if (previousGesture !== 'none') {
        this.gestureState = 'ended';
        this.eventBus.emit('gesture:ended', { 
          type: previousGesture,
          data: this.getGestureData(),
        });
      }
      
      this.reset();
      return 'none';
    }
  
    private detectSingleTouchGesture(
      touch: ExtendedTouchInfo,
      previousGesture: GestureType
    ): GestureType {
      const startPos = this.touchStartPositions.get(touch.id);
      if (!startPos) return previousGesture;
      
      const deltaX = touch.x - startPos.x;
      const deltaY = touch.y - startPos.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const duration = Date.now() - this.touchStartTime;
      
      // Continue existing gesture
      if (previousGesture === 'draw' || previousGesture === 'pan') {
        this.updateGestureData(touch);
        return previousGesture;
      }
      
      // Detect tap
      if (duration < this.config.tapDuration && distance < this.config.panThreshold) {
        // Check for double tap
        if (this.isDoubleTap(touch)) {
          this.handleDoubleTap(touch);
          return 'tap';
        }
        
        // Single tap - wait to see if it's a double tap
        this.lastTapTime = Date.now();
        this.lastTapPosition = { x: touch.x, y: touch.y, timestamp: touch.timestamp || Date.now() };
        
        return 'tap';
      }
      
      // Detect long press
      if (duration > this.config.longPressDuration && distance < this.config.panThreshold) {
        this.handleLongPress(touch);
        return 'long-press';
      }
      
      // Detect draw vs pan based on context
      if (distance > this.config.panThreshold) {
        // In Procreate, single finger usually draws
        // Pan requires two fingers, but we support single finger pan with modifier
        if (this.shouldPanWithSingleFinger()) {
          this.gestureState = 'changed';
          return 'pan';
        }
        
        this.gestureState = 'changed';
        return 'draw';
      }
      
      return 'none';
    }
  
    private detectTwoTouchGesture(
      touches: ExtendedTouchInfo[],
      previousGesture: GestureType
    ): GestureType {
      const touch0 = touches[0];
      const touch1 = touches[1];
      
      // Calculate current values
      const currentDistance = this.calculateDistance(touch0, touch1);
      const currentAngle = this.calculateAngle(touch0, touch1);
      
      // Calculate deltas
      const scaleChange = Math.abs(currentDistance / this.initialDistance - 1);
      const rotationChange = Math.abs(this.normalizeAngle(currentAngle - this.initialAngle));
      
      // Two finger tap detection
      if (this.config.enableTwoFingerTap && this.isTwoFingerTap(touches)) {
        this.handleTwoFingerTap();
        return 'tap';
      }
      
      // Continue existing gesture
      if (previousGesture === 'pan' || previousGesture === 'pinch' || previousGesture === 'rotate') {
        this.updateMultiTouchGesture(touches, previousGesture);
        return previousGesture;
      }
      
      // Detect new gesture based on thresholds
      if (scaleChange > this.config.pinchThreshold && 
          scaleChange > rotationChange / 45) { // Prioritize pinch over rotation
        this.gestureState = 'changed';
        this.currentGesture = 'pinch';
        return 'pinch';
      }
      
      if (rotationChange > this.config.rotationThreshold) {
        this.gestureState = 'changed';
        this.currentGesture = 'rotate';
        return 'rotate';
      }
      
      // Default to pan for two fingers
      const avgDeltaX = (touch0.x - this.touchStartPositions.get(touch0.id)!.x + 
                        touch1.x - this.touchStartPositions.get(touch1.id)!.x) / 2;
      const avgDeltaY = (touch0.y - this.touchStartPositions.get(touch0.id)!.y + 
                        touch1.y - this.touchStartPositions.get(touch1.id)!.y) / 2;
      
      if (Math.sqrt(avgDeltaX * avgDeltaX + avgDeltaY * avgDeltaY) > this.config.panThreshold) {
        this.gestureState = 'changed';
        this.currentGesture = 'pan';
        return 'pan';
      }
      
      return 'none';
    }
  
    private detectMultiTouchGesture(
      touches: ExtendedTouchInfo[],
      previousGesture: GestureType
    ): GestureType {
      const touchCount = touches.length;
      
      // Three finger swipe (undo/redo in Procreate)
      if (touchCount === 3 && this.config.enableThreeFingerSwipe) {
        const swipeDirection = this.detectThreeFingerSwipe(touches);
        if (swipeDirection !== 'none') {
          this.handleThreeFingerSwipe(swipeDirection);
          return 'swipe';
        }
      }
      
      // Four finger tap (hide UI in Procreate)
      if (touchCount === 4 && this.config.enableFourFingerTap) {
        if (this.isFourFingerTap(touches)) {
          this.handleFourFingerTap();
          return 'tap';
        }
      }
      
      // Default to pan for 3+ fingers
      return 'pan';
    }
  
    private detectSpecialGestures(
      touches: ExtendedTouchInfo[],
      previousGesture: GestureType
    ): GestureType {
      // Quick menu gesture (touch and hold with second finger)
      if (this.config.enableQuickMenu && 
          touches.length === 2 && 
          previousGesture === 'draw') {
        const duration = Date.now() - this.touchStartTime;
        if (duration > 200) { // Quick menu threshold
          this.handleQuickMenu(touches);
          return 'quick-menu';
        }
      }
      
      return 'none';
    }
  
    // Gesture update methods
    private updateGestureData(touch: ExtendedTouchInfo): void {
      const startPos = this.touchStartPositions.get(touch.id);
      if (!startPos) return;
      
      this.accumulatedTranslation = {
        x: touch.x - startPos.x,
        y: touch.y - startPos.y,
      };
    }
  
    private updateMultiTouchGesture(touches: ExtendedTouchInfo[], gestureType: GestureType): void {
      if (touches.length < 2) return;
      
      const touch0 = touches[0];
      const touch1 = touches[1];
      
      // Calculate center point
      const centerX = (touch0.x + touch1.x) / 2;
      const centerY = (touch0.y + touch1.y) / 2;
      
      const startPos0 = this.touchStartPositions.get(touch0.id);
      const startPos1 = this.touchStartPositions.get(touch1.id);
      if (!startPos0 || !startPos1) return;
      
      const startCenterX = (startPos0.x + startPos1.x) / 2;
      const startCenterY = (startPos0.y + startPos1.y) / 2;
      
      // Update translation
      this.accumulatedTranslation = {
        x: centerX - startCenterX,
        y: centerY - startCenterY,
      };
      
      // Update scale
      if (gestureType === 'pinch') {
        const currentDistance = this.calculateDistance(touch0, touch1);
        this.accumulatedScale = currentDistance / this.initialDistance;
      }
      
      // Update rotation
      if (gestureType === 'rotate') {
        const currentAngle = this.calculateAngle(touch0, touch1);
        this.accumulatedRotation = this.normalizeAngle(currentAngle - this.initialAngle);
      }
    }
  
    // Special gesture handlers
    private handleDoubleTap(touch: ExtendedTouchInfo): void {
      this.eventBus.emit('gesture:doubleTap', { 
        position: { x: touch.x, y: touch.y },
      });
    }
  
    private handleLongPress(touch: ExtendedTouchInfo): void {
      this.eventBus.emit('gesture:longPress', { 
        position: { x: touch.x, y: touch.y },
      });
    }
  
    private handleTwoFingerTap(): void {
      // In Procreate, two finger tap = undo
      this.eventBus.emit('gesture:twoFingerTap');
      this.eventBus.emit('undo:requested');
    }
  
    private handleThreeFingerSwipe(direction: 'left' | 'right'): void {
      // In Procreate, three finger swipe left = undo, right = redo
      this.eventBus.emit('gesture:threeFingerSwipe', { direction });
      
      if (direction === 'left') {
        this.eventBus.emit('undo:requested');
      } else {
        this.eventBus.emit('redo:requested');
      }
    }
  
    private handleFourFingerTap(): void {
      // In Procreate, four finger tap = toggle UI
      this.eventBus.emit('gesture:fourFingerTap');
      this.eventBus.emit('ui:toggleVisibility');
    }
  
    private handleQuickMenu(touches: ExtendedTouchInfo[]): void {
      const position = {
        x: (touches[0].x + touches[1].x) / 2,
        y: (touches[0].y + touches[1].y) / 2,
      };
      
      this.eventBus.emit('gesture:quickMenu', { position });
      this.eventBus.emit('quickMenu:show', { position });
    }
  
    // Detection helpers
    private isDoubleTap(touch: ExtendedTouchInfo): boolean {
      if (!this.lastTapPosition) return false;
      
      const timeDiff = Date.now() - this.lastTapTime;
      const distance = Math.sqrt(
        Math.pow(touch.x - this.lastTapPosition.x, 2) +
        Math.pow(touch.y - this.lastTapPosition.y, 2)
      );
      
      return timeDiff < this.config.doubleTapDuration && distance < 30;
    }
  
    private isTwoFingerTap(touches: ExtendedTouchInfo[]): boolean {
      if (touches.length !== 2) return false;
      
      const duration = Date.now() - this.touchStartTime;
      if (duration > this.config.tapDuration) return false;
      
      // Check if fingers moved significantly
      for (const touch of touches) {
        const startPos = this.touchStartPositions.get(touch.id);
        if (!startPos) return false;
        
        const distance = Math.sqrt(
          Math.pow(touch.x - startPos.x, 2) +
          Math.pow(touch.y - startPos.y, 2)
        );
        
        if (distance > this.config.panThreshold) return false;
      }
      
      return true;
    }
  
    private detectThreeFingerSwipe(touches: ExtendedTouchInfo[]): 'left' | 'right' | 'none' {
      if (touches.length !== 3) return 'none';
      
      let totalDeltaX = 0;
      let validTouches = 0;
      
      for (const touch of touches) {
        const startPos = this.touchStartPositions.get(touch.id);
        if (!startPos) continue;
        
        const deltaX = touch.x - startPos.x;
        const deltaY = touch.y - startPos.y;
        
        // Check if movement is primarily horizontal
        if (Math.abs(deltaX) > Math.abs(deltaY) * 2 && Math.abs(deltaX) > 50) {
          totalDeltaX += deltaX;
          validTouches++;
        }
      }
      
      if (validTouches === 3) {
        const avgDeltaX = totalDeltaX / 3;
        if (avgDeltaX < -50) return 'left';
        if (avgDeltaX > 50) return 'right';
      }
      
      return 'none';
    }
  
    private isFourFingerTap(touches: ExtendedTouchInfo[]): boolean {
      if (touches.length !== 4) return false;
      
      const duration = Date.now() - this.touchStartTime;
      if (duration > this.config.tapDuration) return false;
      
      // Check if all fingers stayed relatively still
      for (const touch of touches) {
        const startPos = this.touchStartPositions.get(touch.id);
        if (!startPos) return false;
        
        const distance = Math.sqrt(
          Math.pow(touch.x - startPos.x, 2) +
          Math.pow(touch.y - startPos.y, 2)
        );
        
        if (distance > this.config.panThreshold) return false;
      }
      
      return true;
    }
  
    private shouldPanWithSingleFinger(): boolean {
      // Could check for modifier keys or tool mode
      // For now, return false to prioritize drawing
      return false;
    }
  
    // Utility methods
    private calculateDistance(p1: TouchInfo, p2: TouchInfo): number {
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      return Math.sqrt(dx * dx + dy * dy);
    }
  
    private calculateAngle(p1: TouchInfo, p2: TouchInfo): number {
      return Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
    }
  
    private normalizeAngle(angle: number): number {
      while (angle > 180) angle -= 360;
      while (angle < -180) angle += 360;
      return angle;
    }
  
    private calculateVelocity(): Point {
      // Simple velocity calculation based on accumulated translation and time
      const duration = (Date.now() - this.touchStartTime) / 1000; // in seconds
      
      if (duration === 0) return { x: 0, y: 0 };
      
      return {
        x: this.accumulatedTranslation.x / duration,
        y: this.accumulatedTranslation.y / duration,
      };
    }
  
    private clearTimers(): void {
      if (this.twoFingerTapTimer) {
        clearTimeout(this.twoFingerTapTimer);
        this.twoFingerTapTimer = null;
      }
      
      if (this.quickMenuTimer) {
        clearTimeout(this.quickMenuTimer);
        this.quickMenuTimer = null;
      }
    }
  }
  
  // Export singleton
  export const gestureRecognizer = GestureRecognizer.getInstance();