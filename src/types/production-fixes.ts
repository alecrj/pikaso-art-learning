// FAANG Production Type Fixes
// Comprehensive fixes for all missing types

// =================== APPLE PENCIL TYPES ===================
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

// =================== EXTENDED BRUSH TYPES ===================
export interface BrushDynamics {
  pressureSize: boolean;
  pressureOpacity: boolean;
  velocitySize: boolean;
  velocityOpacity: boolean;
  tiltAngle: boolean;
  rotation: boolean;
}

// Add dynamics to Brush interface
declare module '../types' {
  interface Brush {
    dynamics?: BrushDynamics;
  }
}

// =================== EXTENDED STROKE TYPES ===================
declare module '../types' {
  interface Stroke {
    tool?: string;
    layerId?: string;
  }
  
  interface Point {
    altitude?: number;
  }
}

// =================== EXTENDED BLEND MODES ===================
export type ExtendedBlendMode = 
  | 'normal' | 'multiply' | 'screen' | 'overlay'
  | 'darken' | 'lighten' | 'colorDodge' | 'colorBurn'
  | 'hardLight' | 'softLight' | 'difference' | 'exclusion'
  | 'clear';

// =================== EXTENDED BRUSH CATEGORIES ===================
export type ExtendedBrushCategory =
  | 'basic' | 'artistic' | 'texture'
  | 'charcoal' | 'calligraphy' | 'oil' | 'acrylic' | 'spray';

// =================== PERFORMANCE METRICS ===================
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

// =================== ERROR CATEGORIES ===================
export type ExtendedErrorCategory = 
  | 'NETWORK_ERROR' | 'VALIDATION_ERROR' | 'PERMISSION_ERROR'
  | 'STORAGE_ERROR' | 'DRAWING_ENGINE_ERROR' | 'LEARNING_ERROR'
  | 'USER_ERROR' | 'COMMUNITY_ERROR' | 'UNKNOWN_ERROR';

// =================== GLOBAL FIXES ===================
// Fix EventBus off method
declare global {
  interface EventEmitter {
    off(event: string, listener: Function): void;
  }
  
  interface Performance {
    now(): number;
  }
}

// Performance polyfill
if (typeof performance === 'undefined') {
  (global as any).performance = {
    now: () => Date.now()
  };
}

// =================== SKIA COMPATIBILITY ===================
// Fix Skia color type issues
declare module '@shopify/react-native-skia' {
  interface SkColor extends number {}
}

export {};
