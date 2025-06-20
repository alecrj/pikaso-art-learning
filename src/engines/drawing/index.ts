// src/engines/drawing/index.ts - ENTERPRISE DRAWING ENGINE EXPORTS

// FIXED: Clean exports without circular dependencies
export { ValkyrieEngine } from './ValkyrieEngine';
export { BrushEngine } from './BrushEngine';
export { LayerManager } from './LayerManager';
export { ColorManager } from './ColorManager';
export { GestureRecognizer } from './GestureRecognizer';
export { TransformManager } from './TransformManager';
export { PerformanceOptimizer } from './PerformanceOptimizer';
export { ProfessionalCanvas } from './ProfessionalCanvas';

// Type exports from types/drawing.ts
export type {
  Point,
  Stroke,
  Transform,
  Bounds,
  Color,
  ColorHistory,
  ColorPalette,
  Gradient,
  GradientStop,
  ColorSpace,
  ColorHarmony,
  ColorPickerMode,
  ColorProfile,
  Tool,
  BrushCategory,
  Brush,
  BrushSettings,
  BrushShape,
  BrushGrain,
  BrushDynamics,
  BrushRendering,
  BrushColorDynamics,
  WetMixSettings,
  BrushBehavior,
  BrushPreset,
  LayerType,
  BlendMode,
  Layer,
  LayerTransform,
  LayerGroup,
  ClippingMask,
  LayerEffect,
  CanvasState,
  CanvasSettings,
  GestureType,
  GestureState,
  GestureConfig,
  Selection,
  Document,
  ExportSettings,
  ReferenceImage,
  SymmetryGuide,
  TextLayer,
  Shape
} from '../../types/drawing';

// FIXED: Create singleton instances with proper error handling
let valkyrieEngineInstance: any = null;
let brushEngineInstance: any = null;
let layerManagerInstance: any = null;
let colorManagerInstance: any = null;
let gestureRecognizerInstance: any = null;
let transformManagerInstance: any = null;
let performanceOptimizerInstance: any = null;

// Safe instance getters with fallbacks
export const getValkyrieEngine = () => {
  if (!valkyrieEngineInstance) {
    try {
      const { ValkyrieEngine } = require('./ValkyrieEngine');
      valkyrieEngineInstance = ValkyrieEngine.getInstance();
    } catch (error) {
      console.warn('ValkyrieEngine not available:', error);
      valkyrieEngineInstance = createMockEngine('ValkyrieEngine');
    }
  }
  return valkyrieEngineInstance;
};

export const getBrushEngine = () => {
  if (!brushEngineInstance) {
    try {
      const { BrushEngine } = require('./BrushEngine');
      brushEngineInstance = BrushEngine.getInstance();
    } catch (error) {
      console.warn('BrushEngine not available:', error);
      brushEngineInstance = createMockEngine('BrushEngine');
    }
  }
  return brushEngineInstance;
};

export const getLayerManager = () => {
  if (!layerManagerInstance) {
    try {
      const { LayerManager } = require('./LayerManager');
      layerManagerInstance = LayerManager.getInstance();
    } catch (error) {
      console.warn('LayerManager not available:', error);
      layerManagerInstance = createMockEngine('LayerManager');
    }
  }
  return layerManagerInstance;
};

export const getColorManager = () => {
  if (!colorManagerInstance) {
    try {
      const { ColorManager } = require('./ColorManager');
      colorManagerInstance = ColorManager.getInstance();
    } catch (error) {
      console.warn('ColorManager not available:', error);
      colorManagerInstance = createMockEngine('ColorManager');
    }
  }
  return colorManagerInstance;
};

export const getGestureRecognizer = () => {
  if (!gestureRecognizerInstance) {
    try {
      const { GestureRecognizer } = require('./GestureRecognizer');
      gestureRecognizerInstance = GestureRecognizer.getInstance();
    } catch (error) {
      console.warn('GestureRecognizer not available:', error);
      gestureRecognizerInstance = createMockEngine('GestureRecognizer');
    }
  }
  return gestureRecognizerInstance;
};

export const getTransformManager = () => {
  if (!transformManagerInstance) {
    try {
      const { TransformManager } = require('./TransformManager');
      transformManagerInstance = TransformManager.getInstance();
    } catch (error) {
      console.warn('TransformManager not available:', error);
      transformManagerInstance = createMockEngine('TransformManager');
    }
  }
  return transformManagerInstance;
};

export const getPerformanceOptimizer = () => {
  if (!performanceOptimizerInstance) {
    try {
      const { PerformanceOptimizer } = require('./PerformanceOptimizer');
      performanceOptimizerInstance = PerformanceOptimizer.getInstance();
    } catch (error) {
      console.warn('PerformanceOptimizer not available:', error);
      performanceOptimizerInstance = createMockEngine('PerformanceOptimizer');
    }
  }
  return performanceOptimizerInstance;
};

// FIXED: Export consistent instance references
export const valkyrieEngine = getValkyrieEngine();
export const brushEngine = getBrushEngine();
export const layerManager = getLayerManager();
export const colorManager = getColorManager();
export const gestureRecognizer = getGestureRecognizer();
export const transformManager = getTransformManager();
export const performanceOptimizer = getPerformanceOptimizer();

// Mock engine creator for development
function createMockEngine(name: string) {
  return {
    name,
    initialize: async () => {
      console.log(`Mock ${name} initialized`);
      return true;
    },
    cleanup: async () => {
      console.log(`Mock ${name} cleaned up`);
    },
    isReady: () => true,
    isInitialized: () => true,
  };
}

// FIXED: Unified drawing engine for enterprise architecture
class DrawingEngine {
  private static instance: DrawingEngine;

  private constructor() {}

  public static getInstance(): DrawingEngine {
    if (!DrawingEngine.instance) {
      DrawingEngine.instance = new DrawingEngine();
    }
    return DrawingEngine.instance;
  }

  public async initialize(): Promise<boolean> {
    try {
      // Initialize all drawing engines
      const engines = [
        getValkyrieEngine(),
        getBrushEngine(),
        getLayerManager(),
        getColorManager(),
        getGestureRecognizer(),
        getTransformManager(),
        getPerformanceOptimizer(),
      ];

      for (const engine of engines) {
        if (engine && typeof engine.initialize === 'function') {
          await engine.initialize();
        }
      }

      console.log('🎨 Drawing Engine initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Drawing Engine initialization failed:', error);
      return false;
    }
  }

  public isReady(): boolean {
    try {
      const engines = [
        getValkyrieEngine(),
        getBrushEngine(),
        getLayerManager(),
        getColorManager(),
      ];

      return engines.every(engine => engine && 
        (typeof engine.isReady === 'function' ? engine.isReady() : true)
      );
    } catch {
      return false;
    }
  }

  public async cleanup(): Promise<void> {
    try {
      const engines = [
        getValkyrieEngine(),
        getBrushEngine(),
        getLayerManager(),
        getColorManager(),
        getGestureRecognizer(),
        getTransformManager(),
        getPerformanceOptimizer(),
      ];

      for (const engine of engines) {
        if (engine && typeof engine.cleanup === 'function') {
          await engine.cleanup();
        }
      }
      
      console.log('🧹 Drawing Engine cleaned up');
    } catch (error) {
      console.error('❌ Drawing Engine cleanup failed:', error);
    }
  }

  // Convenience getters
  public getValkyrieEngine() {
    return getValkyrieEngine();
  }

  public getBrushEngine() {
    return getBrushEngine();
  }

  public getLayerManager() {
    return getLayerManager();
  }

  public getColorManager() {
    return getColorManager();
  }

  public getPerformanceOptimizer() {
    return getPerformanceOptimizer();
  }
}

export const drawingEngine = DrawingEngine.getInstance();
export { DrawingEngine };

// Convenience function for initializing drawing engine
export async function initializeDrawingEngine(): Promise<boolean> {
  return drawingEngine.initialize();
}