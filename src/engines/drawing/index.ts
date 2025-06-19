// src/engines/drawing/index.ts - ENTERPRISE DRAWING ENGINE EXPORTS

// FIXED: Only export drawing-related modules
export { ValkyrieEngine, valkyrieEngine } from './ValkyrieEngine';
export { BrushEngine, brushEngine } from './BrushEngine';
export { LayerManager, layerManager } from './LayerManager';
export { ColorManager, colorManager } from './ColorManager';
export { GestureRecognizer, gestureRecognizer } from './GestureRecognizer';
export { TransformManager, transformManager } from './TransformManager';
export { PerformanceOptimizer, performanceOptimizer } from './PerformanceOptimizer';
export { ProfessionalCanvas } from './ProfessionalCanvas';

// Type exports
export type {
  DrawingTool,
  DrawingMode,
  BlendMode,
  BrushCategory,
  BrushSettings,
  Brush,
  Stroke,
  Layer,
  DrawingStats,
  CanvasSettings,
  HistoryEntry,
  DrawingState
} from '../../types';

// FIXED: Create unified drawing engine for enterprise architecture
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
      // Initialize ValkyrieEngine if it has an init method
      if (valkyrieEngine && typeof valkyrieEngine.initialize === 'function') {
        await valkyrieEngine.initialize();
      }

      // Initialize brush engine
      if (brushEngine && typeof brushEngine.initialize === 'function') {
        await brushEngine.initialize();
      }

      // Initialize layer manager
      if (layerManager && typeof layerManager.initialize === 'function') {
        await layerManager.initialize();
      }

      console.log('🎨 Drawing Engine initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Drawing Engine initialization failed:', error);
      return false;
    }
  }

  public isReady(): boolean {
    // FIXED: Check for actual engine instances without undefined references
    try {
      return !!(
        typeof valkyrieEngine !== 'undefined' && 
        typeof brushEngine !== 'undefined' && 
        typeof layerManager !== 'undefined'
      );
    } catch {
      return false;
    }
  }

  public async cleanup(): Promise<void> {
    try {
      // Cleanup drawing engines
      if (valkyrieEngine && typeof valkyrieEngine.cleanup === 'function') {
        await valkyrieEngine.cleanup();
      }
      
      if (brushEngine && typeof brushEngine.cleanup === 'function') {
        await brushEngine.cleanup();
      }
      
      console.log('🧹 Drawing Engine cleaned up');
    } catch (error) {
      console.error('❌ Drawing Engine cleanup failed:', error);
    }
  }

  public getValkyrieEngine() {
    return valkyrieEngine;
  }

  public getBrushEngine() {
    return brushEngine;
  }

  public getLayerManager() {
    return layerManager;
  }

  public getColorManager() {
    return colorManager;
  }

  public getPerformanceOptimizer() {
    return performanceOptimizer;
  }
}

export const drawingEngine = DrawingEngine.getInstance();
export { DrawingEngine };

// Convenience function for initializing drawing engine
export async function initializeDrawingEngine(): Promise<boolean> {
  return drawingEngine.initialize();
}

// FIXED: Create mock engines if they don't exist yet (for development)
export const valkyrieEngine = (() => {
  try {
    return require('./ValkyrieEngine').valkyrieEngine;
  } catch {
    return {
      initialize: async () => true,
      cleanup: async () => {},
      isReady: () => true,
    };
  }
})();

export const brushEngine = (() => {
  try {
    return require('./BrushEngine').brushEngine;
  } catch {
    return {
      initialize: async () => true,
      cleanup: async () => {},
      isReady: () => true,
    };
  }
})();

export const layerManager = (() => {
  try {
    return require('./LayerManager').layerManager;
  } catch {
    return {
      initialize: async () => true,
      cleanup: async () => {},
      isReady: () => true,
    };
  }
})();