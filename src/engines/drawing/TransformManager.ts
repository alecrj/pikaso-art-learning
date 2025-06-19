// src/engines/drawing/TransformManager.ts
import { Transform, Point, Bounds } from '../../types/drawing';
import { EventBus } from '../core/EventBus';

/**
 * Transform Manager - Handles canvas transformations
 * Supports pan, zoom, rotate with limits and smoothing
 */
export class TransformManager {
  private static instance: TransformManager;
  private eventBus = EventBus.getInstance();
  
  // Canvas properties
  private canvasWidth = 0;
  private canvasHeight = 0;
  
  // Current transform
  private transform: Transform = {
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
  };
  
  // Transform limits
  private readonly MIN_SCALE = 0.1;
  private readonly MAX_SCALE = 50; // Procreate supports up to 6400% zoom
  private readonly SNAP_ROTATION_THRESHOLD = 5; // degrees
  private readonly SNAP_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
  
  // Smoothing
  private targetTransform: Transform = { ...this.transform };
  private isAnimating = false;
  private animationFrame: number | null = null;
  private readonly SMOOTHING_FACTOR = 0.2;
  
  // Fit modes
  private fitMode: 'fit' | 'fill' | 'actual' | 'custom' = 'fit';
  
  // Transform history for reset
  private defaultTransform: Transform = { ...this.transform };

  private constructor() {}

  public static getInstance(): TransformManager {
    if (!TransformManager.instance) {
      TransformManager.instance = new TransformManager();
    }
    return TransformManager.instance;
  }

  // ===== PUBLIC API =====

  public initialize(canvasWidth: number, canvasHeight: number): void {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    
    // Set default transform to center canvas
    this.resetTransform();
    
    console.log('📐 Transform Manager initialized');
  }

  public getTransform(): Transform {
    return { ...this.transform };
  }

  public setTransform(transform: Partial<Transform>, animate: boolean = false): void {
    const newTransform = { ...this.transform, ...transform };
    
    // Apply constraints
    newTransform.scale = this.constrainScale(newTransform.scale);
    newTransform.rotation = this.normalizeRotation(newTransform.rotation);
    
    // Apply position constraints based on scale
    const bounds = this.getTransformedBounds(newTransform);
    newTransform.x = this.constrainX(newTransform.x, bounds);
    newTransform.y = this.constrainY(newTransform.y, bounds);
    
    if (animate) {
      this.animateToTransform(newTransform);
    } else {
      this.transform = newTransform;
      this.emitTransformChange();
    }
  }

  public resetTransform(animate: boolean = true): void {
    const resetTransform = { ...this.defaultTransform };
    this.setTransform(resetTransform, animate);
  }

  public fitToScreen(animate: boolean = true): void {
    const scale = Math.min(
      this.canvasWidth / this.canvasWidth,
      this.canvasHeight / this.canvasHeight
    );
    
    const transform: Transform = {
      x: 0,
      y: 0,
      scale: scale,
      rotation: 0,
    };
    
    this.setTransform(transform, animate);
    this.fitMode = 'fit';
  }

  public setZoom(scale: number, center?: Point, animate: boolean = false): void {
    const constrainedScale = this.constrainScale(scale);
    
    if (center) {
      // Zoom to specific point
      const dx = center.x - this.canvasWidth / 2;
      const dy = center.y - this.canvasHeight / 2;
      
      const scaleDiff = constrainedScale / this.transform.scale;
      
      const newTransform: Transform = {
        ...this.transform,
        scale: constrainedScale,
        x: this.transform.x - dx * (scaleDiff - 1),
        y: this.transform.y - dy * (scaleDiff - 1),
      };
      
      this.setTransform(newTransform, animate);
    } else {
      // Zoom to center
      this.setTransform({ scale: constrainedScale }, animate);
    }
  }

  public zoomIn(animate: boolean = true): void {
    const newScale = this.transform.scale * 1.2;
    this.setZoom(newScale, undefined, animate);
  }

  public zoomOut(animate: boolean = true): void {
    const newScale = this.transform.scale / 1.2;
    this.setZoom(newScale, undefined, animate);
  }

  public pan(deltaX: number, deltaY: number, animate: boolean = false): void {
    const newTransform: Transform = {
      ...this.transform,
      x: this.transform.x + deltaX,
      y: this.transform.y + deltaY,
    };
    
    this.setTransform(newTransform, animate);
  }

  public rotate(deltaRotation: number, center?: Point, animate: boolean = false): void {
    let newRotation = this.transform.rotation + deltaRotation;
    
    // Snap to angles if close
    for (const snapAngle of this.SNAP_ANGLES) {
      if (Math.abs(newRotation - snapAngle) < this.SNAP_ROTATION_THRESHOLD) {
        newRotation = snapAngle;
        break;
      }
    }
    
    if (center) {
      // Rotate around specific point
      const cos = Math.cos(deltaRotation * Math.PI / 180);
      const sin = Math.sin(deltaRotation * Math.PI / 180);
      
      const cx = center.x - this.canvasWidth / 2;
      const cy = center.y - this.canvasHeight / 2;
      
      const newX = this.transform.x + (cx - cx * cos + cy * sin);
      const newY = this.transform.y + (cy - cx * sin - cy * cos);
      
      this.setTransform({
        x: newX,
        y: newY,
        rotation: newRotation,
      }, animate);
    } else {
      this.setTransform({ rotation: newRotation }, animate);
    }
  }

  public flipHorizontal(animate: boolean = true): void {
    // Flip is achieved by negative scale
    const newTransform: Transform = {
      ...this.transform,
      scale: -Math.abs(this.transform.scale),
    };
    
    this.setTransform(newTransform, animate);
  }

  public flipVertical(animate: boolean = true): void {
    // Vertical flip through rotation
    const newRotation = this.normalizeRotation(this.transform.rotation + 180);
    this.setTransform({ rotation: newRotation }, animate);
  }

  // Gesture support
  public applyPinch(
    baseTransform: Transform,
    scale: number,
    center: Point
  ): Transform {
    const newScale = this.constrainScale(baseTransform.scale * scale);
    const scaleDiff = newScale / baseTransform.scale;
    
    // Calculate new position to keep center point fixed
    const dx = center.x - this.canvasWidth / 2;
    const dy = center.y - this.canvasHeight / 2;
    
    return {
      ...baseTransform,
      scale: newScale,
      x: baseTransform.x - dx * (scaleDiff - 1),
      y: baseTransform.y - dy * (scaleDiff - 1),
    };
  }

  public applyRotation(
    baseTransform: Transform,
    rotation: number,
    center: Point
  ): Transform {
    const newRotation = this.normalizeRotation(baseTransform.rotation + rotation);
    
    // Calculate new position to keep center point fixed
    const cos = Math.cos(rotation * Math.PI / 180);
    const sin = Math.sin(rotation * Math.PI / 180);
    
    const cx = center.x - this.canvasWidth / 2;
    const cy = center.y - this.canvasHeight / 2;
    
    return {
      ...baseTransform,
      scale: baseTransform.scale,
      rotation: newRotation,
      x: baseTransform.x + (cx - cx * cos + cy * sin),
      y: baseTransform.y + (cy - cx * sin - cy * cos),
    };
  }

  // Coordinate conversion
  public screenToCanvas(point: Point, transform?: Transform): Point {
    const t = transform || this.transform;
    const cos = Math.cos(-t.rotation * Math.PI / 180);
    const sin = Math.sin(-t.rotation * Math.PI / 180);
    
    // Translate to origin
    let x = point.x - this.canvasWidth / 2 - t.x;
    let y = point.y - this.canvasHeight / 2 - t.y;
    
    // Scale
    x /= t.scale;
    y /= t.scale;
    
    // Rotate
    const rotatedX = x * cos - y * sin;
    const rotatedY = x * sin + y * cos;
    
    // Translate back
    return {
      x: rotatedX + this.canvasWidth / 2,
      y: rotatedY + this.canvasHeight / 2,
      pressure: point.pressure,
      timestamp: point.timestamp,
    };
  }

  public canvasToScreen(point: Point, transform?: Transform): Point {
    const t = transform || this.transform;
    const cos = Math.cos(t.rotation * Math.PI / 180);
    const sin = Math.sin(t.rotation * Math.PI / 180);
    
    // Translate to origin
    let x = point.x - this.canvasWidth / 2;
    let y = point.y - this.canvasHeight / 2;
    
    // Rotate
    const rotatedX = x * cos - y * sin;
    const rotatedY = x * sin + y * cos;
    
    // Scale
    x = rotatedX * t.scale;
    y = rotatedY * t.scale;
    
    // Translate back
    return {
      x: x + this.canvasWidth / 2 + t.x,
      y: y + this.canvasHeight / 2 + t.y,
      pressure: point.pressure,
      timestamp: point.timestamp,
    };
  }

  // Get visible bounds in canvas coordinates
  public getVisibleBounds(): Bounds {
    const topLeft = this.screenToCanvas({ x: 0, y: 0 });
    const topRight = this.screenToCanvas({ x: this.canvasWidth, y: 0 });
    const bottomLeft = this.screenToCanvas({ x: 0, y: this.canvasHeight });
    const bottomRight = this.screenToCanvas({ x: this.canvasWidth, y: this.canvasHeight });
    
    const points = [topLeft, topRight, bottomLeft, bottomRight];
    
    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxY = Math.max(...points.map(p => p.y));
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  // Check if a point is visible
  public isPointVisible(point: Point): boolean {
    const screenPoint = this.canvasToScreen(point);
    return (
      screenPoint.x >= 0 &&
      screenPoint.x <= this.canvasWidth &&
      screenPoint.y >= 0 &&
      screenPoint.y <= this.canvasHeight
    );
  }

  // Get transform matrix for rendering
  public getTransformMatrix(): number[] {
    const { x, y, scale, rotation } = this.transform;
    const rad = rotation * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    
    // Create 3x3 transformation matrix
    return [
      scale * cos, scale * sin, x,
      -scale * sin, scale * cos, y,
      0, 0, 1,
    ];
  }

  // ===== PRIVATE METHODS =====

  private constrainScale(scale: number): number {
    return Math.max(this.MIN_SCALE, Math.min(this.MAX_SCALE, scale));
  }

  private constrainX(x: number, bounds: Bounds): number {
    // Allow some overscroll
    const overscroll = this.canvasWidth * 0.1;
    const minX = -bounds.width - overscroll;
    const maxX = this.canvasWidth + overscroll;
    
    return Math.max(minX, Math.min(maxX, x));
  }

  private constrainY(y: number, bounds: Bounds): number {
    // Allow some overscroll
    const overscroll = this.canvasHeight * 0.1;
    const minY = -bounds.height - overscroll;
    const maxY = this.canvasHeight + overscroll;
    
    return Math.max(minY, Math.min(maxY, y));
  }

  private normalizeRotation(rotation: number): number {
    // Normalize to 0-360 range
    while (rotation < 0) rotation += 360;
    while (rotation >= 360) rotation -= 360;
    return rotation;
  }

  private getTransformedBounds(transform: Transform): Bounds {
    const corners = [
      { x: 0, y: 0 },
      { x: this.canvasWidth, y: 0 },
      { x: 0, y: this.canvasHeight },
      { x: this.canvasWidth, y: this.canvasHeight },
    ];
    
    // Transform corners
    const rad = transform.rotation * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    
    const transformedCorners = corners.map(corner => {
      const x = corner.x - this.canvasWidth / 2;
      const y = corner.y - this.canvasHeight / 2;
      
      return {
        x: (x * cos - y * sin) * transform.scale + this.canvasWidth / 2,
        y: (x * sin + y * cos) * transform.scale + this.canvasHeight / 2,
      };
    });
    
    // Find bounds
    const xs = transformedCorners.map(c => c.x);
    const ys = transformedCorners.map(c => c.y);
    
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  private animateToTransform(target: Transform): void {
    this.targetTransform = target;
    
    if (!this.isAnimating) {
      this.isAnimating = true;
      this.animate();
    }
  }

  private animate(): void {
    if (!this.isAnimating) return;
    
    // Smooth interpolation
    const dx = this.targetTransform.x - this.transform.x;
    const dy = this.targetTransform.y - this.transform.y;
    const dScale = this.targetTransform.scale - this.transform.scale;
    const dRotation = this.getShortestRotationPath(
      this.transform.rotation,
      this.targetTransform.rotation
    );
    
    // Check if close enough
    const threshold = 0.01;
    if (Math.abs(dx) < threshold && 
        Math.abs(dy) < threshold && 
        Math.abs(dScale) < threshold && 
        Math.abs(dRotation) < threshold) {
      this.transform = { ...this.targetTransform };
      this.isAnimating = false;
      this.emitTransformChange();
      return;
    }
    
    // Apply smoothing
    this.transform.x += dx * this.SMOOTHING_FACTOR;
    this.transform.y += dy * this.SMOOTHING_FACTOR;
    this.transform.scale += dScale * this.SMOOTHING_FACTOR;
    this.transform.rotation = this.normalizeRotation(
      this.transform.rotation + dRotation * this.SMOOTHING_FACTOR
    );
    
    this.emitTransformChange();
    
    // Continue animation
    this.animationFrame = requestAnimationFrame(() => this.animate());
  }

  private getShortestRotationPath(from: number, to: number): number {
    let delta = to - from;
    
    // Normalize to -180 to 180
    while (delta > 180) delta -= 360;
    while (delta < -180) delta += 360;
    
    return delta;
  }

  private emitTransformChange(): void {
    this.eventBus.emit('transform:changed', { 
      transform: this.getTransform() 
    });
  }

  public cleanup(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    
    this.isAnimating = false;
    console.log('🛑 Transform Manager cleaned up');
  }
}

// Export singleton
export const transformManager = TransformManager.getInstance();