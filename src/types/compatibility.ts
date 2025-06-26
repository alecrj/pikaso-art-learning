// Enterprise Type Compatibility Layer
// Fixes for missing types and interfaces

// Apple Pencil Types (Missing from main types)
export interface ApplePencilInput {
  pressure: number;
  tiltX: number;
  tiltY: number;
  altitude: number;
  azimuth: number;
  timestamp: number;
}

export interface ApplePencilCapabilities {
  supportsPressure: boolean;
  supportsTilt: boolean;
  supportsAzimuth: boolean;
  generation: 1 | 2;
}

// Extended Brush Types
export interface BrushDynamics {
  pressureSize: boolean;
  pressureOpacity: boolean;
  velocitySize: boolean;
  velocityOpacity: boolean;
  tiltAngle: boolean;
  rotation: boolean;
}

// Extended Point Type
export interface ExtendedPoint {
  x: number;
  y: number;
  pressure?: number;
  tiltX?: number;
  tiltY?: number;
  altitude?: number;
  timestamp?: number;
}

// Extended Stroke Type
export interface ExtendedStroke {
  id: string;
  points: ExtendedPoint[];
  color: string;
  strokeWidth: number;
  tool?: string;
  layerId?: string;
  timestamp: number;
}

// Performance Metrics Extension
export interface ExtendedPerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  drawCalls: number;
  inputLatency: number;
  renderTime: number;
  timestamp: number;
  frameRate?: number; // Legacy compatibility
  cpuUsage?: number;
  gpuUsage?: number;
}

// Canvas Performance
export interface CanvasPerformance {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  drawCalls: number;
  now(): number; // Add missing now() method
}

// Error Categories Extension
export type ExtendedErrorCategory = 
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR' 
  | 'PERMISSION_ERROR'
  | 'STORAGE_ERROR'
  | 'DRAWING_ENGINE_ERROR' // Added missing category
  | 'LEARNING_ERROR'
  | 'USER_ERROR'
  | 'COMMUNITY_ERROR'
  | 'UNKNOWN_ERROR';

// Blend Mode Extension
export type ExtendedBlendMode = 
  | 'normal'
  | 'multiply' 
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'colorDodge'
  | 'colorBurn'
  | 'hardLight'
  | 'softLight'
  | 'difference' // Added missing blend mode
  | 'exclusion'
  | 'clear'; // Added missing blend mode

// Brush Category Extension  
export type ExtendedBrushCategory =
  | 'basic'
  | 'artistic'
  | 'texture'
  | 'charcoal' // Added missing categories
  | 'calligraphy'
  | 'oil'
  | 'acrylic'
  | 'spray';

// Global performance override for enterprise compatibility
declare global {
  var performance: {
    now(): number;
    mark(name: string): void;
    measure(name: string, startMark: string, endMark: string): void;
  };
}

// Fallback performance if not available
if (typeof global !== 'undefined' && !global.performance) {
  global.performance = {
    now: () => Date.now(),
    mark: () => {},
    measure: () => {}
  };
}

export {};
