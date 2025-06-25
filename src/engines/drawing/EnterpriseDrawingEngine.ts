// src/engines/drawing/EnterpriseDrawingEngine.ts - MASTER ORCHESTRATION ENGINE
/**
 * Enterprise Drawing Engine - Master Orchestrator
 * Coordinates all drawing subsystems for Procreate-level performance
 * - 120fps ProMotion optimization
 * - Apple Pencil 1 & 2 full feature support
 * - 4K canvas with intelligent tile management
 * - Enterprise-grade error handling and recovery
 * - Real-time performance adaptation
 * - Memory pressure management
 * - Cross-device optimization (iPad Mini 5 → iPad Pro M2)
 */

import { Platform, Dimensions } from 'react-native';
import { CompatSkia, SkSurface, SkCanvas, SkPaint, SkPath } from './SkiaCompatibility';
import { valkyrieEngine } from './ValkyrieEngine';
import { brushEngine } from './BrushEngine';
import { layerManager } from './LayerManager';
import { colorManager } from './ColorManager';
import { tileManager } from './TileManager';
import { applePencilManager } from './ApplePencilManager';
import { deviceCapabilities } from './DeviceCapabilities';
import { metalOptimizer } from './MetalOptimizer';
import { performanceOptimizer } from './PerformanceOptimizer';
import { EventBus } from '../core/EventBus';
import { errorHandler } from '../core/ErrorHandler';
import { 
  Point, 
  Stroke, 
  Layer, 
  Brush, 
  Color, 
  DrawingTool,
  CanvasSettings,
  ApplePencilInput,
  DrawingState
} from '../../types';

// Engine initialization phases
enum InitializationPhase {
  STARTING = 'starting',
  DEVICE_DETECTION = 'device_detection',
  CORE_ENGINES = 'core_engines',
  DRAWING_SYSTEMS = 'drawing_systems',
  PERFORMANCE_OPTIMIZATION = 'performance_optimization',
  READY = 'ready',
  FAILED = 'failed'
}

// Engine state
interface EngineState {
  phase: InitializationPhase;
  isInitialized: boolean;
  isDrawing: boolean;
  currentStroke: Stroke | null;
  performanceMode: 'maximum' | 'balanced' | 'battery' | 'compatibility';
  memoryPressure: number; // 0-1
  thermalState: 'nominal' | 'fair' | 'serious' | 'critical';
  lastError: string | null;
}

// Canvas configuration
interface CanvasConfiguration {
  width: number;
  height: number;
  pixelRatio: number;
  maxSize: number;
  tileSize: number;
  targetFrameRate: number;
  enableGPUAcceleration: boolean;
  enableApplePencil: boolean;
  enablePredictiveStroke: boolean;
  enableMemoryOptimization: boolean;
}

// Performance statistics
interface PerformanceStats {
  frameRate: number;
  inputLatency: number;
  drawingLatency: number;
  memoryUsageMB: number;
  gpuUsagePercent: number;
  batteryImpactScore: number;
  thermalImpactScore: number;
  strokesPerSecond: number;
  efficiency: number; // Overall efficiency score 0-100
}

// Drawing operation context
interface DrawingOperation {
  type: 'stroke_start' | 'stroke_update' | 'stroke_end' | 'clear' | 'undo' | 'redo';
  data: any;
  timestamp: number;
  priority: 'immediate' | 'high' | 'normal' | 'low';
  source: 'apple_pencil' | 'touch' | 'api';
}

/**
 * Enterprise Drawing Engine - Master Orchestrator
 * Provides unified, high-performance drawing capabilities
 */
export class EnterpriseDrawingEngine {
  private static instance: EnterpriseDrawingEngine;
  private eventBus = EventBus.getInstance();
  
  // Engine state
  private state: EngineState = {
    phase: InitializationPhase.STARTING,
    isInitialized: false,
    isDrawing: false,
    currentStroke: null,
    performanceMode: 'balanced',
    memoryPressure: 0,
    thermalState: 'nominal',
    lastError: null,
  };
  
  // Canvas configuration
  private canvasConfig: CanvasConfiguration;
  private mainSurface: SkSurface | null = null;
  private currentLayer: Layer | null = null;
  
  // Performance monitoring
  private stats: PerformanceStats = {
    frameRate: 0,
    inputLatency: 0,
    drawingLatency: 0,
    memoryUsageMB: 0,
    gpuUsagePercent: 0,
    batteryImpactScore: 0,
    thermalImpactScore: 0,
    strokesPerSecond: 0,
    efficiency: 0,
  };
  
  // Operation queuing
  private operationQueue: DrawingOperation[] = [];
  private isProcessingOperations = false;
  private frameRequestId: number | null = null;
  
  // Error recovery
  private consecutiveErrors = 0;
  private lastRecoveryTime = 0;
  private readonly MAX_CONSECUTIVE_ERRORS = 3;
  private readonly RECOVERY_COOLDOWN = 5000; // 5 seconds

  private constructor() {
    this.canvasConfig = this.createDefaultConfiguration();
    this.setupEventListeners();
  }

  public static getInstance(): EnterpriseDrawingEngine {
    if (!EnterpriseDrawingEngine.instance) {
      EnterpriseDrawingEngine.instance = new EnterpriseDrawingEngine();
    }
    return EnterpriseDrawingEngine.instance;
  }

  // ===== INITIALIZATION =====

  public async initialize(): Promise<boolean> {
    console.log('🚀 Initializing Enterprise Drawing Engine...');
    
    try {
      this.state.phase = InitializationPhase.STARTING;
      this.emitStateChange();
      
      // Phase 1: Device Detection & Capabilities
      this.state.phase = InitializationPhase.DEVICE_DETECTION;
      this.emitStateChange();
      
      await this.initializeDeviceCapabilities();
      
      // Phase 2: Core Engines
      this.state.phase = InitializationPhase.CORE_ENGINES;
      this.emitStateChange();
      
      await this.initializeCoreEngines();
      
      // Phase 3: Drawing Systems
      this.state.phase = InitializationPhase.DRAWING_SYSTEMS;
      this.emitStateChange();
      
      await this.initializeDrawingSystems();
      
      // Phase 4: Performance Optimization
      this.state.phase = InitializationPhase.PERFORMANCE_OPTIMIZATION;
      this.emitStateChange();
      
      await this.initializePerformanceOptimization();
      
      // Phase 5: Ready
      this.state.phase = InitializationPhase.READY;
      this.state.isInitialized = true;
      this.emitStateChange();
      
      // Start main render loop
      this.startRenderLoop();
      
      console.log('✅ Enterprise Drawing Engine initialized successfully');
      
      this.eventBus.emit('drawing_engine:initialized', {
        state: this.state,
        config: this.canvasConfig,
        stats: this.stats,
      });
      
      return true;
      
    } catch (error) {
      this.state.phase = InitializationPhase.FAILED;
      this.state.lastError = (error as Error).message;
      this.emitStateChange();
      
      console.error('❌ Enterprise Drawing Engine initialization failed:', error);
      
      // Attempt recovery
      return this.attemptRecovery();
    }
  }

  private async initializeDeviceCapabilities(): Promise<void> {
    const success = await deviceCapabilities.initialize();
    if (!success) {
      throw new Error('Device capabilities initialization failed');
    }
    
    // Configure canvas based on device capabilities
    this.configureForDevice();
  }

  private async initializeCoreEngines(): Promise<void> {
    // Initialize in dependency order
    const engines = [
      { name: 'Skia Compatibility', init: () => CompatSkia.isInitialized() },
      { name: 'Event Bus', init: () => this.eventBus !== null },
      { name: 'Error Handler', init: () => errorHandler !== null },
    ];
    
    for (const engine of engines) {
      try {
        const result = typeof engine.init === 'function' ? engine.init() : await engine.init();
        if (!result) {
          throw new Error(`${engine.name} initialization failed`);
        }
        console.log(`✅ ${engine.name} initialized`);
      } catch (error) {
        console.error(`❌ ${engine.name} failed:`, error);
        throw error;
      }
    }
  }

  private async initializeDrawingSystems(): Promise<void> {
    const systems = [
      { name: 'Valkyrie Engine', init: () => valkyrieEngine.initialize(this.canvasConfig.width, this.canvasConfig.height, this.canvasConfig.pixelRatio) },
      { name: 'Brush Engine', init: () => Promise.resolve(true) }, // Already initialized
      { name: 'Layer Manager', init: () => layerManager.initialize(this.canvasConfig.width, this.canvasConfig.height) },
      { name: 'Color Manager', init: () => Promise.resolve(true) }, // Already initialized
      { name: 'Tile Manager', init: () => tileManager.initialize(this.canvasConfig.width, this.canvasConfig.height, this.canvasConfig.pixelRatio) },
      { name: 'Apple Pencil Manager', init: () => applePencilManager.initialize() },
    ];
    
    for (const system of systems) {
      try {
        await system.init();
        console.log(`✅ ${system.name} initialized`);
      } catch (error) {
        console.error(`❌ ${system.name} failed:`, error);
        throw error;
      }
    }
    
    // Create main drawing surface
    this.createMainSurface();
  }

  private async initializePerformanceOptimization(): Promise<void> {
    const optimizers = [
      { name: 'Metal Optimizer', init: () => metalOptimizer.initialize() },
      { name: 'Performance Optimizer', init: () => Promise.resolve(true) }, // Already initialized
    ];
    
    for (const optimizer of optimizers) {
      try {
        await optimizer.init();
        console.log(`✅ ${optimizer.name} initialized`);
      } catch (error) {
        console.warn(`⚠️ ${optimizer.name} failed (non-critical):`, error);
        // Performance optimizers are non-critical
      }
    }
    
    // Start performance monitoring
    this.startPerformanceMonitoring();
  }

  // ===== CONFIGURATION =====

  private createDefaultConfiguration(): CanvasConfiguration {
    const { width, height } = Dimensions.get('window');
    
    return {
      width: 2048,
      height: 2048,
      pixelRatio: 3,
      maxSize: 4096,
      tileSize: 512,
      targetFrameRate: 60,
      enableGPUAcceleration: Platform.OS === 'ios',
      enableApplePencil: Platform.OS === 'ios',
      enablePredictiveStroke: true,
      enableMemoryOptimization: true,
    };
  }

  private configureForDevice(): void {
    const device = deviceCapabilities.getDetectedModel();
    if (!device) return;
    
    // Update configuration based on device capabilities
    this.canvasConfig.maxSize = device.maxCanvasSize;
    this.canvasConfig.tileSize = deviceCapabilities.getTileSize();
    this.canvasConfig.targetFrameRate = deviceCapabilities.getTargetFrameRate();
    this.canvasConfig.enableGPUAcceleration = deviceCapabilities.shouldUseGPUAcceleration();
    this.canvasConfig.enablePredictiveStroke = deviceCapabilities.shouldUsePredictiveStroke();
    
    console.log('⚙️ Configured for device:', {
      model: device.displayName,
      maxCanvas: this.canvasConfig.maxSize,
      tileSize: this.canvasConfig.tileSize,
      targetFPS: this.canvasConfig.targetFrameRate,
    });
  }

  private createMainSurface(): void {
    this.mainSurface = valkyrieEngine.createLayerSurface(
      'main_canvas',
      this.canvasConfig.width,
      this.canvasConfig.height
    );
    
    if (!this.mainSurface) {
      throw new Error('Failed to create main drawing surface');
    }
    
    console.log(`🎨 Main surface created: ${this.canvasConfig.width}x${this.canvasConfig.height}`);
  }

  // ===== DRAWING API =====

  public async startStroke(point: Point, tool: DrawingTool = 'brush'): Promise<boolean> {
    if (!this.state.isInitialized || this.state.isDrawing) {
      return false;
    }
    
    try {
      const operation: DrawingOperation = {
        type: 'stroke_start',
        data: { point, tool },
        timestamp: performance.now(),
        priority: 'immediate',
        source: 'api',
      };
      
      this.queueOperation(operation);
      return true;
      
    } catch (error) {
      this.handleError('startStroke', error as Error);
      return false;
    }
  }

  public async addStrokePoint(point: Point): Promise<boolean> {
    if (!this.state.isDrawing || !this.state.currentStroke) {
      return false;
    }
    
    try {
      const operation: DrawingOperation = {
        type: 'stroke_update',
        data: { point },
        timestamp: performance.now(),
        priority: 'high',
        source: 'api',
      };
      
      this.queueOperation(operation);
      return true;
      
    } catch (error) {
      this.handleError('addStrokePoint', error as Error);
      return false;
    }
  }

  public async endStroke(): Promise<boolean> {
    if (!this.state.isDrawing) {
      return false;
    }
    
    try {
      const operation: DrawingOperation = {
        type: 'stroke_end',
        data: {},
        timestamp: performance.now(),
        priority: 'immediate',
        source: 'api',
      };
      
      this.queueOperation(operation);
      return true;
      
    } catch (error) {
      this.handleError('endStroke', error as Error);
      return false;
    }
  }

  public async processApplePencilInput(input: ApplePencilInput): Promise<void> {
    if (!this.canvasConfig.enableApplePencil) return;
    
    try {
      // Process Apple Pencil input with full hardware features
      const processedInput = applePencilManager.processInput(input);
      if (!processedInput) return;
      
      // Convert to drawing operation
      let operationType: DrawingOperation['type'];
      if (!this.state.isDrawing) {
        operationType = 'stroke_start';
      } else {
        operationType = 'stroke_update';
      }
      
      const operation: DrawingOperation = {
        type: operationType,
        data: { point: processedInput },
        timestamp: performance.now(),
        priority: 'immediate',
        source: 'apple_pencil',
      };
      
      this.queueOperation(operation);
      
    } catch (error) {
      this.handleError('processApplePencilInput', error as Error);
    }
  }

  public async clearCanvas(): Promise<boolean> {
    try {
      const operation: DrawingOperation = {
        type: 'clear',
        data: {},
        timestamp: performance.now(),
        priority: 'high',
        source: 'api',
      };
      
      this.queueOperation(operation);
      return true;
      
    } catch (error) {
      this.handleError('clearCanvas', error as Error);
      return false;
    }
  }

  // ===== OPERATION PROCESSING =====

  private queueOperation(operation: DrawingOperation): void {
    this.operationQueue.push(operation);
    
    // Process immediately for critical operations
    if (operation.priority === 'immediate' && !this.isProcessingOperations) {
      this.processOperations();
    }
  }

  private async processOperations(): Promise<void> {
    if (this.isProcessingOperations || this.operationQueue.length === 0) {
      return;
    }
    
    this.isProcessingOperations = true;
    
    try {
      // Sort operations by priority and timestamp
      this.operationQueue.sort((a, b) => {
        const priorityOrder = { immediate: 4, high: 3, normal: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp;
      });
      
      // Process operations
      while (this.operationQueue.length > 0) {
        const operation = this.operationQueue.shift()!;
        await this.executeOperation(operation);
      }
      
    } catch (error) {
      this.handleError('processOperations', error as Error);
    } finally {
      this.isProcessingOperations = false;
    }
  }

  private async executeOperation(operation: DrawingOperation): Promise<void> {
    const startTime = performance.now();
    
    try {
      switch (operation.type) {
        case 'stroke_start':
          await this.executeStrokeStart(operation.data);
          break;
        case 'stroke_update':
          await this.executeStrokeUpdate(operation.data);
          break;
        case 'stroke_end':
          await this.executeStrokeEnd(operation.data);
          break;
        case 'clear':
          await this.executeClear(operation.data);
          break;
        default:
          console.warn('Unknown operation type:', operation.type);
      }
      
      // Update performance stats
      const executionTime = performance.now() - startTime;
      this.stats.drawingLatency = executionTime;
      
    } catch (error) {
      this.handleError(`executeOperation(${operation.type})`, error as Error);
    }
  }

  private async executeStrokeStart(data: any): Promise<void> {
    const { point, tool } = data;
    
    // Get current brush and color
    const brush = brushEngine.getCurrentBrush();
    const color = colorManager.getCurrentColor();
    
    if (!brush) {
      throw new Error('No brush selected');
    }
    
    // Create new stroke
    const strokeId = `stroke_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const stroke: Stroke = {
      id: strokeId,
      tool,
      brushId: brush.id,
      color: color.hex,
      points: [point],
      layerId: layerManager.getCurrentLayerId() || '',
      timestamp: Date.now(),
    };
    
    this.state.currentStroke = stroke;
    this.state.isDrawing = true;
    
    // Mark tiles as dirty
    tileManager.markTileDirty(point.x, point.y, brush.settings.general.size, brush.settings.general.size);
    
    this.eventBus.emit('drawing_engine:stroke_started', { stroke });
  }

  private async executeStrokeUpdate(data: any): Promise<void> {
    const { point } = data;
    
    if (!this.state.currentStroke) return;
    
    // Add point to current stroke
    this.state.currentStroke.points.push(point);
    
    // Get current brush for size
    const brush = brushEngine.getCurrentBrush();
    if (brush) {
      tileManager.markTileDirty(point.x, point.y, brush.settings.general.size, brush.settings.general.size);
    }
    
    this.eventBus.emit('drawing_engine:stroke_updated', { 
      stroke: this.state.currentStroke,
      point 
    });
  }

  private async executeStrokeEnd(data: any): Promise<void> {
    if (!this.state.currentStroke) return;
    
    // Finalize stroke and add to layer
    const finalStroke = { ...this.state.currentStroke };
    layerManager.addStroke(finalStroke);
    
    this.state.currentStroke = null;
    this.state.isDrawing = false;
    
    this.eventBus.emit('drawing_engine:stroke_completed', { stroke: finalStroke });
  }

  private async executeClear(data: any): Promise<void> {
    const currentLayerId = layerManager.getCurrentLayerId();
    if (currentLayerId) {
      layerManager.clearLayer(currentLayerId);
    }
    
    this.eventBus.emit('drawing_engine:canvas_cleared');
  }

  // ===== RENDER LOOP =====

  private startRenderLoop(): void {
    const renderFrame = () => {
      if (this.state.isInitialized) {
        this.renderFrame();
      }
      
      this.frameRequestId = requestAnimationFrame(renderFrame);
    };
    
    this.frameRequestId = requestAnimationFrame(renderFrame);
  }

  private async renderFrame(): Promise<void> {
    try {
      // Begin frame
      performanceOptimizer.startFrame();
      
      if (metalOptimizer.isAvailable()) {
        await metalOptimizer.beginFrame();
      }
      
      // Process queued operations
      if (this.operationQueue.length > 0) {
        await this.processOperations();
      }
      
      // Render current stroke if drawing
      if (this.state.isDrawing && this.state.currentStroke) {
        await this.renderCurrentStroke();
      }
      
      // End frame
      if (metalOptimizer.isAvailable()) {
        await metalOptimizer.endFrame();
      }
      
      performanceOptimizer.endFrame();
      
    } catch (error) {
      this.handleError('renderFrame', error as Error);
    }
  }

  private async renderCurrentStroke(): Promise<void> {
    if (!this.state.currentStroke || !this.mainSurface) return;
    
    const brush = brushEngine.getCurrentBrush();
    if (!brush) return;
    
    // Create paint for stroke
    const paint = brushEngine.createBrushPaint(
      brush,
      colorManager.getCurrentColor(),
      this.state.currentStroke.points[this.state.currentStroke.points.length - 1],
      this.state.currentStroke.points[this.state.currentStroke.points.length - 2] || null,
      0 // velocity
    );
    
    // Create path from points
    const path = CompatSkia.Path.Make();
    const points = this.state.currentStroke.points;
    
    if (points.length > 0) {
      path.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        path.lineTo(points[i].x, points[i].y);
      }
    }
    
    // Render stroke
    if (metalOptimizer.isAvailable()) {
      await metalOptimizer.drawPath(path, paint, this.mainSurface);
    } else {
      const canvas = this.mainSurface.getCanvas();
      canvas.drawPath(path, paint);
    }
  }

  // ===== PERFORMANCE MONITORING =====

  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.updatePerformanceStats();
      this.adaptPerformance();
    }, 1000);
  }

  private updatePerformanceStats(): void {
    // Get performance data from various engines
    const optimizerMetrics = performanceOptimizer.getMetrics();
    const metalMetrics = metalOptimizer.isAvailable() ? metalOptimizer.getMetrics() : null;
    
    // Update stats
    this.stats.frameRate = optimizerMetrics.fps;
    this.stats.memoryUsageMB = tileManager.getStats().memoryBudget.activeTilesMB;
    
    if (metalMetrics) {
      this.stats.gpuUsagePercent = Math.min(100, (metalMetrics.textureMemoryMB / 1024) * 100);
    }
    
    // Calculate efficiency score
    this.stats.efficiency = this.calculateEfficiencyScore();
    
    // Emit performance update
    this.eventBus.emit('drawing_engine:performance', { stats: this.stats });
  }

  private calculateEfficiencyScore(): number {
    const targetFPS = this.canvasConfig.targetFrameRate;
    const fpsScore = Math.min(100, (this.stats.frameRate / targetFPS) * 100);
    const latencyScore = Math.max(0, 100 - this.stats.inputLatency);
    const memoryScore = Math.max(0, 100 - (this.stats.memoryUsageMB / 1024) * 100);
    
    return Math.round((fpsScore + latencyScore + memoryScore) / 3);
  }

  private adaptPerformance(): void {
    // Adapt performance based on current metrics
    if (this.stats.frameRate < this.canvasConfig.targetFrameRate * 0.8) {
      this.reduceQuality();
    } else if (this.stats.frameRate > this.canvasConfig.targetFrameRate * 0.95) {
      this.increaseQuality();
    }
    
    // Handle memory pressure
    if (this.stats.memoryUsageMB > 512) {
      this.state.memoryPressure = Math.min(1, this.stats.memoryUsageMB / 1024);
      tileManager.optimizeMemory();
    }
  }

  private reduceQuality(): void {
    if (this.state.performanceMode === 'maximum') {
      this.state.performanceMode = 'balanced';
    } else if (this.state.performanceMode === 'balanced') {
      this.state.performanceMode = 'battery';
    }
    
    this.applyPerformanceMode();
  }

  private increaseQuality(): void {
    if (this.state.performanceMode === 'battery') {
      this.state.performanceMode = 'balanced';
    } else if (this.state.performanceMode === 'balanced') {
      this.state.performanceMode = 'maximum';
    }
    
    this.applyPerformanceMode();
  }

  private applyPerformanceMode(): void {
    switch (this.state.performanceMode) {
      case 'maximum':
        performanceOptimizer.forceOptimizationLevel(0);
        break;
      case 'balanced':
        performanceOptimizer.forceOptimizationLevel(1);
        break;
      case 'battery':
      case 'compatibility':
        performanceOptimizer.forceOptimizationLevel(2);
        break;
    }
    
    console.log(`📊 Performance mode: ${this.state.performanceMode}`);
  }

  // ===== ERROR HANDLING =====

  private handleError(context: string, error: Error): void {
    this.consecutiveErrors++;
    this.state.lastError = `${context}: ${error.message}`;
    
    console.error(`❌ Drawing Engine Error [${context}]:`, error);
    
    errorHandler.handleError(
      errorHandler.createError(
        'DRAWING_ENGINE_ERROR',
        `Error in ${context}: ${error.message}`,
        'high',
        { context, error, consecutiveErrors: this.consecutiveErrors }
      )
    );
    
    // Attempt recovery if too many consecutive errors
    if (this.consecutiveErrors >= this.MAX_CONSECUTIVE_ERRORS) {
      this.attemptRecovery();
    }
    
    this.eventBus.emit('drawing_engine:error', {
      context,
      error: error.message,
      consecutiveErrors: this.consecutiveErrors,
    });
  }

  private async attemptRecovery(): Promise<boolean> {
    const now = Date.now();
    if (now - this.lastRecoveryTime < this.RECOVERY_COOLDOWN) {
      return false; // Recovery attempted too recently
    }
    
    this.lastRecoveryTime = now;
    console.log('🔄 Attempting drawing engine recovery...');
    
    try {
      // Reset state
      this.state.isDrawing = false;
      this.state.currentStroke = null;
      this.operationQueue = [];
      
      // Clear surfaces and restart
      if (this.mainSurface) {
        const canvas = this.mainSurface.getCanvas();
        canvas.clear(CompatSkia.Color('transparent'));
      }
      
      // Reset error counter
      this.consecutiveErrors = 0;
      this.state.lastError = null;
      
      console.log('✅ Drawing engine recovery successful');
      this.eventBus.emit('drawing_engine:recovered');
      
      return true;
      
    } catch (error) {
      console.error('❌ Drawing engine recovery failed:', error);
      this.state.phase = InitializationPhase.FAILED;
      return false;
    }
  }

  // ===== EVENT HANDLING =====

  private setupEventListeners(): void {
    // Listen for Apple Pencil events
    this.eventBus.on('pencil:input', (data: { input: ApplePencilInput }) => {
      this.processApplePencilInput(data.input);
    });
    
    // Listen for device thermal changes
    this.eventBus.on('device:thermalStateChanged', (data: { state: string }) => {
      this.state.thermalState = data.state as any;
      this.adaptToThermalState();
    });
    
    // Listen for memory pressure
    this.eventBus.on('tiles:memoryStats', (data: any) => {
      this.state.memoryPressure = data.budget.pressure;
    });
  }

  private adaptToThermalState(): void {
    switch (this.state.thermalState) {
      case 'serious':
        this.state.performanceMode = 'battery';
        break;
      case 'critical':
        this.state.performanceMode = 'compatibility';
        break;
      case 'nominal':
      case 'fair':
      default:
        // Restore based on device capabilities
        const device = deviceCapabilities.getDetectedModel();
        if (device?.performanceTier === 'ultra') {
          this.state.performanceMode = 'maximum';
        } else {
          this.state.performanceMode = 'balanced';
        }
        break;
    }
    
    this.applyPerformanceMode();
  }

  private emitStateChange(): void {
    this.eventBus.emit('drawing_engine:state_changed', {
      phase: this.state.phase,
      isInitialized: this.state.isInitialized,
      performanceMode: this.state.performanceMode,
    });
  }

  // ===== PUBLIC API =====

  public getState(): EngineState {
    return { ...this.state };
  }

  public getConfiguration(): CanvasConfiguration {
    return { ...this.canvasConfig };
  }

  public getPerformanceStats(): PerformanceStats {
    return { ...this.stats };
  }

  public isReady(): boolean {
    return this.state.isInitialized && this.state.phase === InitializationPhase.READY;
  }

  public getCurrentStroke(): Stroke | null {
    return this.state.currentStroke;
  }

  public setPerformanceMode(mode: EngineState['performanceMode']): void {
    this.state.performanceMode = mode;
    this.applyPerformanceMode();
  }

  public updateCanvasSize(width: number, height: number): void {
    this.canvasConfig.width = width;
    this.canvasConfig.height = height;
    
    // Recreate main surface
    this.createMainSurface();
    
    // Reinitialize tile manager
    tileManager.initialize(width, height, this.canvasConfig.pixelRatio);
  }

  // ===== CLEANUP =====

  public async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Enterprise Drawing Engine...');
    
    // Stop render loop
    if (this.frameRequestId) {
      cancelAnimationFrame(this.frameRequestId);
      this.frameRequestId = null;
    }
    
    // Clear operation queue
    this.operationQueue = [];
    this.isProcessingOperations = false;
    
    // Cleanup engines
    await Promise.allSettled([
      valkyrieEngine.destroy(),
      layerManager.cleanup(),
      tileManager.cleanup(),
      applePencilManager.cleanup(),
      metalOptimizer.cleanup(),
      performanceOptimizer.destroy(),
    ]);
    
    // Reset state
    this.state.isInitialized = false;
    this.state.phase = InitializationPhase.STARTING;
    this.mainSurface = null;
    
    console.log('✅ Enterprise Drawing Engine cleaned up');
  }
}

// Export singleton
export const enterpriseDrawingEngine = EnterpriseDrawingEngine.getInstance();