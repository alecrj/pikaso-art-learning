// src/engines/drawing/index.ts - PRODUCTION GRADE FINAL FIXED VERSION
/**
 * Drawing Engine Public API
 * FIXED: All duplicate exports and type conflicts resolved
 */

// ===== CORE ENGINES =====
export { valkyrieEngine, ValkyrieEngine } from './ValkyrieEngine';
export { brushEngine, BrushEngine } from './BrushEngine';
export { layerManager, LayerManager } from './LayerManager';
export { colorManager, ColorManager } from './ColorManager';
export { gestureRecognizer, GestureRecognizer } from './GestureRecognizer';
export { transformManager, TransformManager } from './TransformManager';
export { performanceOptimizer, PerformanceOptimizer } from './PerformanceOptimizer';

// ===== MAIN CANVAS COMPONENT =====
export { ProfessionalCanvas } from './ProfessionalCanvas';

// ===== PROFESSIONAL CANVAS PROPS TYPE =====
export interface ProfessionalCanvasProps {
  width?: number;
  height?: number;
  onReady?: () => void;
  onStrokeStart?: (stroke: any) => void;
  onStrokeUpdate?: (stroke: any) => void;
  onStrokeEnd?: (stroke: any) => void;
  settings?: any;
}

// ===== COMPATIBILITY LAYER =====
// FIXED: Re-export specific items from SkiaCompatibility to avoid conflicts
export {
  CompatSkia,
  DrawingUtils,
  PerformanceUtils,
  TileMode,
  PathEffect,
} from './SkiaCompatibility';

// Re-export specific Skia compatibility types
export type {
  TouchInfo,
  ExtendedTouchInfo,
  TileModeType,
} from './SkiaCompatibility';

// ===== DRAWING TYPES - SELECTIVE EXPORT =====
// FIXED: Only export types that actually exist in drawing.ts
export type {
  Point,
  Color,
  Stroke,
  Layer,
  Brush,
  BrushSettings,
  BrushCategory,
  // FIXED: Remove types that don't exist in drawing.ts - use from index.ts instead
  // DrawingTool, DrawingMode, DrawingStats, HistoryEntry, DrawingState - these are in types/index.ts
  Transform,
  GestureType,
  CanvasState,
  Tool,
  ColorHistory,
  ColorPalette,
  ColorProfile,
  GradientStop,
  Gradient,
  BrushDynamics,
  LayerType,
  LayerTransform,
  LayerEffect,
  // Note: BlendMode excluded to prevent conflicts with Skia's BlendMode
  // Use the BlendMode from drawing types by importing directly from types/drawing
} from '../../types/drawing';

// FIXED: Export types from index.ts that are used by canvas
export type {
  DrawingTool,
  DrawingMode,
  DrawingStats,
  HistoryEntry,
  DrawingState,
  CanvasSettings,
} from '../../types/index';