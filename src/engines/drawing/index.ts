// =================== src/engines/drawing/index.ts ===================
// FIXED: Complete drawing engine exports with proper typing

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
export {
  CompatSkia,
  DrawingUtils,
  PerformanceUtils,
  TileMode,
  PathEffect,
} from './SkiaCompatibility';

export type {
  TouchInfo,
  ExtendedTouchInfo,
  TileModeType,
} from './SkiaCompatibility';

// ===== DRAWING TYPES =====
export type {
  Point,
  Color,
  Stroke,
  Layer,
  Brush,
  BrushSettings,
  BrushCategory,
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
} from '../../types/drawing';

export type {
  DrawingTool,
  DrawingMode,
  DrawingStats,
  HistoryEntry,
  DrawingState,
  CanvasSettings,
} from '../../types/index';

// ===== MAIN DRAWING ENGINE =====
// FIXED: Create a unified drawing engine interface
class DrawingEngine {
  private static instance: DrawingEngine;

  private constructor() {}

  public static getInstance(): DrawingEngine {
    if (!DrawingEngine.instance) {
      DrawingEngine.instance = new DrawingEngine();
    }
    return DrawingEngine.instance;
  }

  public async initialize(): Promise<void> {
    try {
      // Initialize all drawing subsystems
      console.log('🎨 Drawing Engine: Initializing subsystems...');
      
      // The individual engines are already initialized as singletons
      // This method provides a centralized initialization point
      
      console.log('🎨 Drawing Engine: All subsystems ready');
    } catch (error) {
      console.error('Failed to initialize drawing engine:', error);
      throw error;
    }
  }

  public isReady(): boolean {
    return !!(valkyrieEngine && brushEngine && layerManager);
  }
}

export const drawingEngine = DrawingEngine.getInstance();

// =================== src/engines/user/index.ts ===================
// FIXED: Complete user engine exports

export { ProfileSystem } from './ProfileSystem';
export { ProgressionSystem } from './ProgressionSystem';
export { PortfolioManager } from './PortfolioManager';

import { ProfileSystem } from './ProfileSystem';
import { ProgressionSystem } from './ProgressionSystem';
import { PortfolioManager } from './PortfolioManager';

export const profileSystem = ProfileSystem.getInstance();
export const progressionSystem = ProgressionSystem.getInstance();
export const portfolioManager = PortfolioManager.getInstance();

// ===== MAIN USER ENGINE =====
class UserEngine {
  private static instance: UserEngine;

  private constructor() {}

  public static getInstance(): UserEngine {
    if (!UserEngine.instance) {
      UserEngine.instance = new UserEngine();
    }
    return UserEngine.instance;
  }

  public async initialize(): Promise<void> {
    try {
      console.log('👤 User Engine: Initializing systems...');
      
      // Initialize all user subsystems
      // The individual systems are already initialized as singletons
      
      console.log('👤 User Engine: All systems ready');
    } catch (error) {
      console.error('Failed to initialize user engine:', error);
      throw error;
    }
  }

  public isReady(): boolean {
    return !!(profileSystem && progressionSystem && portfolioManager);
  }
}

export const userEngine = UserEngine.getInstance();

export async function initializeUserEngine(): Promise<void> {
  return userEngine.initialize();
}

// =================== src/engines/community/index.ts ===================
// FIXED: Complete community engine exports

export { SocialEngine } from './SocialEngine';
export { ChallengeSystem } from './ChallengeSystem';

import { SocialEngine } from './SocialEngine';
import { ChallengeSystem } from './ChallengeSystem';

export const socialEngine = SocialEngine.getInstance();
export const challengeSystem = ChallengeSystem.getInstance();

// ===== MAIN COMMUNITY ENGINE =====
class CommunityEngine {
  private static instance: CommunityEngine;

  private constructor() {}

  public static getInstance(): CommunityEngine {
    if (!CommunityEngine.instance) {
      CommunityEngine.instance = new CommunityEngine();
    }
    return CommunityEngine.instance;
  }

  public async initialize(): Promise<void> {
    try {
      console.log('🌍 Community Engine: Initializing systems...');
      
      // Initialize all community subsystems
      await challengeSystem.loadChallenges();
      
      console.log('🌍 Community Engine: All systems ready');
    } catch (error) {
      console.error('Failed to initialize community engine:', error);
      throw error;
    }
  }

  public isReady(): boolean {
    return !!(socialEngine && challengeSystem);
  }
}

export const communityEngine = CommunityEngine.getInstance();

export async function initializeCommunityEngine(): Promise<void> {
  return communityEngine.initialize();
}