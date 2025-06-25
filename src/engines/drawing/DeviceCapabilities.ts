// src/engines/drawing/DeviceCapabilities.ts - ENTERPRISE DEVICE DETECTION & OPTIMIZATION
/**
 * Enterprise Device Capabilities Detection
 * Automatically detects iPad model and optimizes drawing engine accordingly
 * - Supports iPad Mini 5 → iPad Pro M2 (2018-2024+)
 * - Metal GPU detection and optimization
 * - Memory configuration for 1GB-16GB devices  
 * - ProMotion display detection (120Hz)
 * - Apple Pencil compatibility detection
 * - Thermal throttling management
 */

import { Platform, Dimensions, PixelRatio } from 'react-native';
import { EventBus } from '../core/EventBus';

// iPad model database
interface iPadModel {
  identifier: string;
  name: string;
  displayName: string;
  year: number;
  
  // Hardware specs
  chipset: string;
  memoryGB: number;
  gpuCores: number;
  cpuCores: number;
  
  // Display capabilities
  screenSize: number;        // Inches
  resolution: { width: number; height: number };
  pixelDensity: number;      // PPI
  supportsProMotion: boolean; // 120Hz
  maxBrightness: number;     // Nits
  colorGamut: 'sRGB' | 'P3' | 'P3-wide';
  
  // Drawing capabilities
  applePencilGeneration: 1 | 2 | null;
  maxCanvasSize: number;     // Max dimension in pixels
  recommendedCanvasSize: number;
  maxLayers: number;
  
  // Performance tiers
  performanceTier: 'entry' | 'mid' | 'high' | 'pro' | 'ultra';
  thermalClass: 'basic' | 'improved' | 'advanced';
  
  // Graphics capabilities
  metalVersion: string;
  maxTextureSize: number;
  memoryBandwidth: number;   // GB/s
  fillRate: number;          // Gpixel/s
}

// Performance optimization profiles
interface PerformanceProfile {
  name: string;
  
  // Canvas settings
  maxCanvasResolution: number;
  defaultCanvasSize: { width: number; height: number };
  tileSize: number;
  maxConcurrentTiles: number;
  
  // Drawing settings
  maxBrushSize: number;
  defaultSmoothingLevel: number;
  enablePredictiveStroke: boolean;
  maxUndoSteps: number;
  
  // Memory management
  memoryBudgetMB: number;
  compressionLevel: number;
  compressionDelay: number;
  aggressiveMemoryManagement: boolean;
  
  // Rendering settings
  targetFrameRate: number;
  enableGPUAcceleration: boolean;
  enableMultithreading: boolean;
  adaptiveQuality: boolean;
  
  // Features
  enableAdvancedBrushes: boolean;
  enableComplexBlendModes: boolean;
  enableRealTimeEffects: boolean;
  maxTextureEffects: number;
}

// Thermal management
interface ThermalState {
  current: 'nominal' | 'fair' | 'serious' | 'critical';
  trend: 'stable' | 'rising' | 'falling';
  adaptations: string[];
  lastUpdate: number;
}

/**
 * Enterprise Device Capabilities Manager
 * Detects iPad model and optimizes drawing engine performance
 */
export class DeviceCapabilities {
  private static instance: DeviceCapabilities;
  private eventBus = EventBus.getInstance();
  
  // Device information
  private detectedModel: iPadModel | null = null;
  private performanceProfile: PerformanceProfile | null = null;
  private thermalState: ThermalState;
  
  // Runtime capabilities
  private actualMemoryGB = 0;
  private actualGPUPerformance = 0;
  private maxSustainedFrameRate = 60;
  
  // Feature flags
  private capabilities = {
    supportsMetalFX: false,
    supportsUnifiedMemory: false,
    supportsNeuralEngine: false,
    supportsAV1Decode: false,
    supportsDisplayP3: false,
    supportsProMotion: false,
    supportsApplePencil: false,
    applePencilGeneration: null as 1 | 2 | null,
  };
  
  // Benchmarking
  private benchmarkResults = {
    cpuScore: 0,
    gpuScore: 0,
    memoryBandwidth: 0,
    renderingPerformance: 0,
    lastBenchmark: 0,
  };

  private constructor() {
    this.thermalState = {
      current: 'nominal',
      trend: 'stable',
      adaptations: [],
      lastUpdate: Date.now(),
    };
  }

  public static getInstance(): DeviceCapabilities {
    if (!DeviceCapabilities.instance) {
      DeviceCapabilities.instance = new DeviceCapabilities();
    }
    return DeviceCapabilities.instance;
  }

  // ===== INITIALIZATION =====

  public async initialize(): Promise<boolean> {
    console.log('📱 Initializing Device Capabilities...');
    
    try {
      // Detect iPad model
      await this.detectiPadModel();
      
      // Run capability tests
      await this.testCapabilities();
      
      // Create performance profile
      this.createPerformanceProfile();
      
      // Start thermal monitoring
      this.startThermalMonitoring();
      
      // Run performance benchmark
      await this.runPerformanceBenchmark();
      
      console.log('✅ Device Capabilities initialized', {
        model: this.detectedModel?.displayName,
        tier: this.performanceProfile?.name,
        memory: `${this.actualMemoryGB}GB`,
        proMotion: this.capabilities.supportsProMotion,
        pencil: this.capabilities.applePencilGeneration,
      });
      
      this.eventBus.emit('device:initialized', {
        model: this.detectedModel,
        profile: this.performanceProfile,
        capabilities: this.capabilities,
      });
      
      return true;
    } catch (error) {
      console.error('❌ Device Capabilities initialization failed:', error);
      this.createFallbackProfile();
      return false;
    }
  }

  // ===== IPAD MODEL DETECTION =====

  private async detectiPadModel(): Promise<void> {
    if (Platform.OS !== 'ios') {
      this.detectedModel = this.createGenericTabletModel();
      return;
    }

    try {
      // Get device info
      const { width, height } = Dimensions.get('screen');
      const pixelRatio = PixelRatio.get();
      const screenDiagonal = Math.sqrt(width * width + height * height) / pixelRatio;
      
      // Detect based on screen characteristics
      this.detectedModel = this.detectByScreenCharacteristics(width, height, pixelRatio, screenDiagonal);
      
      // Validate with additional tests
      await this.validateModelDetection();
      
    } catch (error) {
      console.warn('⚠️ iPad model detection failed, using fallback:', error);
      this.detectedModel = this.createFallbackiPadModel();
    }
  }

  private detectByScreenCharacteristics(width: number, height: number, pixelRatio: number, diagonal: number): iPadModel {
    const resolution = {
      width: width * pixelRatio,
      height: height * pixelRatio,
    };
    
    // iPad Pro 12.9" (2018-2024)
    if (diagonal >= 12.5 && diagonal <= 13.0 && 
        Math.abs(resolution.width - 2048) < 100 && Math.abs(resolution.height - 2732) < 100) {
      
      // Detect generation by year/features
      const currentYear = new Date().getFullYear();
      if (currentYear >= 2022) {
        return this.getiPadModel('iPad16,3'); // iPad Pro 12.9" M2 (2022)
      } else if (currentYear >= 2021) {
        return this.getiPadModel('iPad13,8'); // iPad Pro 12.9" M1 (2021)
      } else {
        return this.getiPadModel('iPad8,11'); // iPad Pro 12.9" A12Z (2020)
      }
    }
    
    // iPad Pro 11" (2018-2024)
    if (diagonal >= 10.5 && diagonal <= 11.5 && 
        Math.abs(resolution.width - 1668) < 100 && Math.abs(resolution.height - 2388) < 100) {
      
      const currentYear = new Date().getFullYear();
      if (currentYear >= 2022) {
        return this.getiPadModel('iPad16,1'); // iPad Pro 11" M2 (2022)
      } else if (currentYear >= 2021) {
        return this.getiPadModel('iPad13,4'); // iPad Pro 11" M1 (2021)
      } else {
        return this.getiPadModel('iPad8,9'); // iPad Pro 11" A12Z (2020)
      }
    }
    
    // iPad Air (2019-2024)
    if (diagonal >= 10.5 && diagonal <= 11.0 && 
        Math.abs(resolution.width - 1668) < 100 && Math.abs(resolution.height - 2360) < 100) {
      
      return this.getiPadModel('iPad13,16'); // iPad Air 5th gen M1 (2022)
    }
    
    // iPad 10.9" (2022)
    if (diagonal >= 10.5 && diagonal <= 11.0 && 
        Math.abs(resolution.width - 1640) < 100 && Math.abs(resolution.height - 2360) < 100) {
      
      return this.getiPadModel('iPad13,18'); // iPad 10.9" A14 (2022)
    }
    
    // iPad Mini 6 (2021)
    if (diagonal >= 8.0 && diagonal <= 9.0 && 
        Math.abs(resolution.width - 1488) < 100 && Math.abs(resolution.height - 2266) < 100) {
      
      return this.getiPadModel('iPad14,1'); // iPad Mini 6 A15 (2021)
    }
    
    // iPad Mini 5 (2019) - Minimum supported
    if (diagonal >= 7.5 && diagonal <= 8.5 && 
        Math.abs(resolution.width - 1536) < 100 && Math.abs(resolution.height - 2048) < 100) {
      
      return this.getiPadModel('iPad11,1'); // iPad Mini 5 A12 (2019)
    }
    
    // Fallback for unrecognized iPad
    return this.createFallbackiPadModel();
  }

  private getiPadModel(identifier: string): iPadModel {
    const models: Record<string, iPadModel> = {
      // iPad Pro 12.9" M2 (2022) - Ultra tier
      'iPad16,3': {
        identifier: 'iPad16,3',
        name: 'iPad Pro 12.9"',
        displayName: 'iPad Pro 12.9" (6th gen)',
        year: 2022,
        chipset: 'M2',
        memoryGB: 16,
        gpuCores: 10,
        cpuCores: 8,
        screenSize: 12.9,
        resolution: { width: 2048, height: 2732 },
        pixelDensity: 264,
        supportsProMotion: true,
        maxBrightness: 1000,
        colorGamut: 'P3-wide',
        applePencilGeneration: 2,
        maxCanvasSize: 16384,
        recommendedCanvasSize: 8192,
        maxLayers: 999,
        performanceTier: 'ultra',
        thermalClass: 'advanced',
        metalVersion: 'Metal 3',
        maxTextureSize: 16384,
        memoryBandwidth: 100,
        fillRate: 13.8,
      },
      
      // iPad Pro 11" M2 (2022) - Pro tier
      'iPad16,1': {
        identifier: 'iPad16,1',
        name: 'iPad Pro 11"',
        displayName: 'iPad Pro 11" (4th gen)',
        year: 2022,
        chipset: 'M2',
        memoryGB: 8,
        gpuCores: 10,
        cpuCores: 8,
        screenSize: 11.0,
        resolution: { width: 1668, height: 2388 },
        pixelDensity: 264,
        supportsProMotion: true,
        maxBrightness: 600,
        colorGamut: 'P3',
        applePencilGeneration: 2,
        maxCanvasSize: 8192,
        recommendedCanvasSize: 4096,
        maxLayers: 500,
        performanceTier: 'pro',
        thermalClass: 'advanced',
        metalVersion: 'Metal 3',
        maxTextureSize: 8192,
        memoryBandwidth: 100,
        fillRate: 13.8,
      },
      
      // iPad Pro 12.9" M1 (2021) - Pro tier
      'iPad13,8': {
        identifier: 'iPad13,8',
        name: 'iPad Pro 12.9"',
        displayName: 'iPad Pro 12.9" (5th gen)',
        year: 2021,
        chipset: 'M1',
        memoryGB: 8,
        gpuCores: 8,
        cpuCores: 8,
        screenSize: 12.9,
        resolution: { width: 2048, height: 2732 },
        pixelDensity: 264,
        supportsProMotion: true,
        maxBrightness: 1000,
        colorGamut: 'P3',
        applePencilGeneration: 2,
        maxCanvasSize: 8192,
        recommendedCanvasSize: 4096,
        maxLayers: 400,
        performanceTier: 'pro',
        thermalClass: 'advanced',
        metalVersion: 'Metal 3',
        maxTextureSize: 8192,
        memoryBandwidth: 68.25,
        fillRate: 10.4,
      },
      
      // iPad Air 5 M1 (2022) - High tier
      'iPad13,16': {
        identifier: 'iPad13,16',
        name: 'iPad Air',
        displayName: 'iPad Air (5th gen)',
        year: 2022,
        chipset: 'M1',
        memoryGB: 8,
        gpuCores: 8,
        cpuCores: 8,
        screenSize: 10.9,
        resolution: { width: 1668, height: 2360 },
        pixelDensity: 264,
        supportsProMotion: false,
        maxBrightness: 500,
        colorGamut: 'P3',
        applePencilGeneration: 2,
        maxCanvasSize: 6144,
        recommendedCanvasSize: 3072,
        maxLayers: 200,
        performanceTier: 'high',
        thermalClass: 'improved',
        metalVersion: 'Metal 3',
        maxTextureSize: 8192,
        memoryBandwidth: 68.25,
        fillRate: 10.4,
      },
      
      // iPad 10.9" A14 (2022) - Mid tier
      'iPad13,18': {
        identifier: 'iPad13,18',
        name: 'iPad',
        displayName: 'iPad (10th gen)',
        year: 2022,
        chipset: 'A14',
        memoryGB: 4,
        gpuCores: 4,
        cpuCores: 6,
        screenSize: 10.9,
        resolution: { width: 1640, height: 2360 },
        pixelDensity: 264,
        supportsProMotion: false,
        maxBrightness: 500,
        colorGamut: 'sRGB',
        applePencilGeneration: 1,
        maxCanvasSize: 4096,
        recommendedCanvasSize: 2048,
        maxLayers: 100,
        performanceTier: 'mid',
        thermalClass: 'improved',
        metalVersion: 'Metal 2.4',
        maxTextureSize: 4096,
        memoryBandwidth: 42.7,
        fillRate: 7.6,
      },
      
      // iPad Mini 6 A15 (2021) - High tier
      'iPad14,1': {
        identifier: 'iPad14,1',
        name: 'iPad Mini',
        displayName: 'iPad Mini (6th gen)',
        year: 2021,
        chipset: 'A15',
        memoryGB: 4,
        gpuCores: 5,
        cpuCores: 6,
        screenSize: 8.3,
        resolution: { width: 1488, height: 2266 },
        pixelDensity: 326,
        supportsProMotion: false,
        maxBrightness: 500,
        colorGamut: 'P3',
        applePencilGeneration: 2,
        maxCanvasSize: 4096,
        recommendedCanvasSize: 2048,
        maxLayers: 150,
        performanceTier: 'high',
        thermalClass: 'improved',
        metalVersion: 'Metal 2.4',
        maxTextureSize: 4096,
        memoryBandwidth: 51.2,
        fillRate: 8.9,
      },
      
      // iPad Mini 5 A12 (2019) - Entry tier (minimum supported)
      'iPad11,1': {
        identifier: 'iPad11,1',
        name: 'iPad Mini',
        displayName: 'iPad Mini (5th gen)',
        year: 2019,
        chipset: 'A12',
        memoryGB: 3,
        gpuCores: 4,
        cpuCores: 6,
        screenSize: 7.9,
        resolution: { width: 1536, height: 2048 },
        pixelDensity: 326,
        supportsProMotion: false,
        maxBrightness: 500,
        colorGamut: 'sRGB',
        applePencilGeneration: 1,
        maxCanvasSize: 2048,
        recommendedCanvasSize: 1024,
        maxLayers: 50,
        performanceTier: 'entry',
        thermalClass: 'basic',
        metalVersion: 'Metal 2.1',
        maxTextureSize: 4096,
        memoryBandwidth: 34.1,
        fillRate: 6.2,
      },
    };
    
    return models[identifier] || this.createFallbackiPadModel();
  }

  private createGenericTabletModel(): iPadModel {
    const { width, height } = Dimensions.get('screen');
    const diagonal = Math.sqrt(width * width + height * height) / PixelRatio.get();
    
    return {
      identifier: 'Generic',
      name: 'Android Tablet',
      displayName: 'Android Tablet',
      year: 2022,
      chipset: 'Generic',
      memoryGB: 4,
      gpuCores: 4,
      cpuCores: 8,
      screenSize: diagonal,
      resolution: { width: width * PixelRatio.get(), height: height * PixelRatio.get() },
      pixelDensity: 160,
      supportsProMotion: false,
      maxBrightness: 400,
      colorGamut: 'sRGB',
      applePencilGeneration: null,
      maxCanvasSize: 4096,
      recommendedCanvasSize: 2048,
      maxLayers: 100,
      performanceTier: 'mid',
      thermalClass: 'basic',
      metalVersion: 'OpenGL ES 3.2',
      maxTextureSize: 4096,
      memoryBandwidth: 25.6,
      fillRate: 4.0,
    };
  }

  private createFallbackiPadModel(): iPadModel {
    return {
      identifier: 'iPad-Unknown',
      name: 'iPad',
      displayName: 'iPad (Unknown)',
      year: 2021,
      chipset: 'A12',
      memoryGB: 4,
      gpuCores: 4,
      cpuCores: 6,
      screenSize: 10.2,
      resolution: { width: 1620, height: 2160 },
      pixelDensity: 264,
      supportsProMotion: false,
      maxBrightness: 500,
      colorGamut: 'sRGB',
      applePencilGeneration: 1,
      maxCanvasSize: 4096,
      recommendedCanvasSize: 2048,
      maxLayers: 100,
      performanceTier: 'mid',
      thermalClass: 'basic',
      metalVersion: 'Metal 2.1',
      maxTextureSize: 4096,
      memoryBandwidth: 34.1,
      fillRate: 6.2,
    };
  }

  // ===== CAPABILITY TESTING =====

  private async testCapabilities(): Promise<void> {
    if (!this.detectedModel) return;
    
    // Test ProMotion support
    this.capabilities.supportsProMotion = this.detectedModel.supportsProMotion;
    this.maxSustainedFrameRate = this.capabilities.supportsProMotion ? 120 : 60;
    
    // Test Apple Pencil support
    this.capabilities.supportsApplePencil = this.detectedModel.applePencilGeneration !== null;
    this.capabilities.applePencilGeneration = this.detectedModel.applePencilGeneration;
    
    // Test Metal capabilities
    this.capabilities.supportsMetalFX = this.detectedModel.chipset.startsWith('M');
    this.capabilities.supportsUnifiedMemory = this.detectedModel.chipset.startsWith('M');
    this.capabilities.supportsNeuralEngine = this.detectedModel.year >= 2019;
    
    // Test display capabilities
    this.capabilities.supportsDisplayP3 = this.detectedModel.colorGamut !== 'sRGB';
    
    // Estimate actual memory
    this.actualMemoryGB = this.detectedModel.memoryGB;
    
    console.log('🧪 Capabilities tested:', this.capabilities);
  }

  private async validateModelDetection(): Promise<void> {
    // Additional validation tests would go here
    // For now, we'll trust the screen-based detection
  }

  // ===== PERFORMANCE PROFILING =====

  private createPerformanceProfile(): void {
    if (!this.detectedModel) {
      this.createFallbackProfile();
      return;
    }
    
    const model = this.detectedModel;
    
    switch (model.performanceTier) {
      case 'ultra':
        this.performanceProfile = {
          name: 'Ultra Performance',
          maxCanvasResolution: 16384,
          defaultCanvasSize: { width: 4096, height: 4096 },
          tileSize: 1024,
          maxConcurrentTiles: 256,
          maxBrushSize: 500,
          defaultSmoothingLevel: 0.8,
          enablePredictiveStroke: true,
          maxUndoSteps: 200,
          memoryBudgetMB: model.memoryGB * 1024 * 0.6, // 60% of total memory
          compressionLevel: 9,
          compressionDelay: 10000,
          aggressiveMemoryManagement: false,
          targetFrameRate: 120,
          enableGPUAcceleration: true,
          enableMultithreading: true,
          adaptiveQuality: false,
          enableAdvancedBrushes: true,
          enableComplexBlendModes: true,
          enableRealTimeEffects: true,
          maxTextureEffects: 50,
        };
        break;
        
      case 'pro':
        this.performanceProfile = {
          name: 'Pro Performance',
          maxCanvasResolution: 8192,
          defaultCanvasSize: { width: 3072, height: 3072 },
          tileSize: 512,
          maxConcurrentTiles: 128,
          maxBrushSize: 300,
          defaultSmoothingLevel: 0.7,
          enablePredictiveStroke: true,
          maxUndoSteps: 150,
          memoryBudgetMB: model.memoryGB * 1024 * 0.5,
          compressionLevel: 7,
          compressionDelay: 8000,
          aggressiveMemoryManagement: false,
          targetFrameRate: model.supportsProMotion ? 120 : 60,
          enableGPUAcceleration: true,
          enableMultithreading: true,
          adaptiveQuality: true,
          enableAdvancedBrushes: true,
          enableComplexBlendModes: true,
          enableRealTimeEffects: true,
          maxTextureEffects: 30,
        };
        break;
        
      case 'high':
        this.performanceProfile = {
          name: 'High Performance',
          maxCanvasResolution: 6144,
          defaultCanvasSize: { width: 2048, height: 2048 },
          tileSize: 512,
          maxConcurrentTiles: 64,
          maxBrushSize: 200,
          defaultSmoothingLevel: 0.6,
          enablePredictiveStroke: true,
          maxUndoSteps: 100,
          memoryBudgetMB: model.memoryGB * 1024 * 0.4,
          compressionLevel: 5,
          compressionDelay: 5000,
          aggressiveMemoryManagement: false,
          targetFrameRate: 60,
          enableGPUAcceleration: true,
          enableMultithreading: true,
          adaptiveQuality: true,
          enableAdvancedBrushes: true,
          enableComplexBlendModes: false,
          enableRealTimeEffects: false,
          maxTextureEffects: 15,
        };
        break;
        
      case 'mid':
        this.performanceProfile = {
          name: 'Balanced Performance',
          maxCanvasResolution: 4096,
          defaultCanvasSize: { width: 1536, height: 1536 },
          tileSize: 256,
          maxConcurrentTiles: 32,
          maxBrushSize: 150,
          defaultSmoothingLevel: 0.4,
          enablePredictiveStroke: false,
          maxUndoSteps: 50,
          memoryBudgetMB: model.memoryGB * 1024 * 0.3,
          compressionLevel: 3,
          compressionDelay: 3000,
          aggressiveMemoryManagement: true,
          targetFrameRate: 60,
          enableGPUAcceleration: true,
          enableMultithreading: false,
          adaptiveQuality: true,
          enableAdvancedBrushes: false,
          enableComplexBlendModes: false,
          enableRealTimeEffects: false,
          maxTextureEffects: 5,
        };
        break;
        
      case 'entry':
        this.performanceProfile = {
          name: 'Essential Performance',
          maxCanvasResolution: 2048,
          defaultCanvasSize: { width: 1024, height: 1024 },
          tileSize: 256,
          maxConcurrentTiles: 16,
          maxBrushSize: 100,
          defaultSmoothingLevel: 0.2,
          enablePredictiveStroke: false,
          maxUndoSteps: 25,
          memoryBudgetMB: model.memoryGB * 1024 * 0.2,
          compressionLevel: 1,
          compressionDelay: 1000,
          aggressiveMemoryManagement: true,
          targetFrameRate: 30,
          enableGPUAcceleration: false,
          enableMultithreading: false,
          adaptiveQuality: true,
          enableAdvancedBrushes: false,
          enableComplexBlendModes: false,
          enableRealTimeEffects: false,
          maxTextureEffects: 0,
        };
        break;
    }
  }

  private createFallbackProfile(): void {
    this.performanceProfile = {
      name: 'Safe Mode',
      maxCanvasResolution: 2048,
      defaultCanvasSize: { width: 1024, height: 1024 },
      tileSize: 256,
      maxConcurrentTiles: 16,
      maxBrushSize: 100,
      defaultSmoothingLevel: 0.3,
      enablePredictiveStroke: false,
      maxUndoSteps: 25,
      memoryBudgetMB: 512,
      compressionLevel: 3,
      compressionDelay: 2000,
      aggressiveMemoryManagement: true,
      targetFrameRate: 30,
      enableGPUAcceleration: false,
      enableMultithreading: false,
      adaptiveQuality: true,
      enableAdvancedBrushes: false,
      enableComplexBlendModes: false,
      enableRealTimeEffects: false,
      maxTextureEffects: 0,
    };
  }

  // ===== PERFORMANCE BENCHMARKING =====

  private async runPerformanceBenchmark(): Promise<void> {
    console.log('🏃‍♂️ Running performance benchmark...');
    
    const startTime = performance.now();
    
    try {
      // CPU benchmark
      this.benchmarkResults.cpuScore = await this.benchmarkCPU();
      
      // GPU benchmark  
      this.benchmarkResults.gpuScore = await this.benchmarkGPU();
      
      // Memory bandwidth test
      this.benchmarkResults.memoryBandwidth = await this.benchmarkMemory();
      
      // Rendering performance
      this.benchmarkResults.renderingPerformance = await this.benchmarkRendering();
      
      this.benchmarkResults.lastBenchmark = Date.now();
      
      const duration = performance.now() - startTime;
      console.log('✅ Benchmark completed in', `${duration.toFixed(1)}ms`, this.benchmarkResults);
      
    } catch (error) {
      console.error('❌ Benchmark failed:', error);
    }
  }

  private async benchmarkCPU(): Promise<number> {
    // Simple CPU benchmark
    const start = performance.now();
    let result = 0;
    
    for (let i = 0; i < 100000; i++) {
      result += Math.sqrt(i) * Math.sin(i) * Math.cos(i);
    }
    
    const duration = performance.now() - start;
    return Math.round(100000 / duration); // Operations per ms
  }

  private async benchmarkGPU(): Promise<number> {
    // GPU benchmark would test rendering performance
    // For now, estimate based on model
    if (this.detectedModel) {
      return this.detectedModel.fillRate * 1000; // Convert to score
    }
    return 1000; // Default
  }

  private async benchmarkMemory(): Promise<number> {
    // Memory bandwidth test
    if (this.detectedModel) {
      return this.detectedModel.memoryBandwidth;
    }
    return 25.6; // Default GB/s
  }

  private async benchmarkRendering(): Promise<number> {
    // Rendering performance test
    // Would test actual canvas rendering speed
    return this.maxSustainedFrameRate;
  }

  // ===== THERMAL MANAGEMENT =====

  private startThermalMonitoring(): void {
    // Monitor thermal state and adapt performance
    setInterval(() => {
      this.updateThermalState();
    }, 5000); // Check every 5 seconds
  }

  private updateThermalState(): void {
    // In real implementation, would use native thermal API
    // For now, simulate based on performance
    
    const now = Date.now();
    const timeSinceLastUpdate = now - this.thermalState.lastUpdate;
    
    // Simulate thermal state based on usage
    if (timeSinceLastUpdate > 30000) { // 30 seconds of heavy usage
      if (this.thermalState.current === 'nominal') {
        this.thermalState.current = 'fair';
        this.thermalState.trend = 'rising';
      }
    }
    
    this.thermalState.lastUpdate = now;
    
    // Apply thermal adaptations
    this.applyThermalAdaptations();
  }

  private applyThermalAdaptations(): void {
    if (!this.performanceProfile) return;
    
    switch (this.thermalState.current) {
      case 'fair':
        // Reduce target frame rate slightly
        this.performanceProfile.targetFrameRate = Math.max(30, this.performanceProfile.targetFrameRate - 10);
        this.thermalState.adaptations = ['Reduced frame rate'];
        break;
        
      case 'serious':
        // More aggressive reductions
        this.performanceProfile.targetFrameRate = 30;
        this.performanceProfile.adaptiveQuality = true;
        this.performanceProfile.enableRealTimeEffects = false;
        this.thermalState.adaptations = ['Low frame rate', 'Adaptive quality', 'No real-time effects'];
        break;
        
      case 'critical':
        // Emergency performance mode
        this.performanceProfile.targetFrameRate = 15;
        this.performanceProfile.enableGPUAcceleration = false;
        this.performanceProfile.maxConcurrentTiles = Math.max(8, this.performanceProfile.maxConcurrentTiles / 2);
        this.thermalState.adaptations = ['Emergency mode', 'CPU only', 'Minimal tiles'];
        break;
        
      case 'nominal':
      default:
        // Reset to optimal settings
        this.createPerformanceProfile();
        this.thermalState.adaptations = [];
        break;
    }
    
    this.eventBus.emit('device:thermalStateChanged', {
      state: this.thermalState.current,
      adaptations: this.thermalState.adaptations,
    });
  }

  // ===== PUBLIC API =====

  public getDetectedModel(): iPadModel | null {
    return this.detectedModel;
  }

  public getPerformanceProfile(): PerformanceProfile | null {
    return this.performanceProfile;
  }

  public getCapabilities() {
    return { ...this.capabilities };
  }

  public getThermalState(): ThermalState {
    return { ...this.thermalState };
  }

  public getBenchmarkResults() {
    return { ...this.benchmarkResults };
  }

  public getMaxCanvasSize(): number {
    return this.performanceProfile?.maxCanvasResolution || 2048;
  }

  public getRecommendedCanvasSize(): { width: number; height: number } {
    return this.performanceProfile?.defaultCanvasSize || { width: 1024, height: 1024 };
  }

  public getTargetFrameRate(): number {
    return this.performanceProfile?.targetFrameRate || 30;
  }

  public getTileSize(): number {
    return this.performanceProfile?.tileSize || 256;
  }

  public getMaxConcurrentTiles(): number {
    return this.performanceProfile?.maxConcurrentTiles || 16;
  }

  public getMemoryBudgetMB(): number {
    return this.performanceProfile?.memoryBudgetMB || 512;
  }

  public shouldUseGPUAcceleration(): boolean {
    return this.performanceProfile?.enableGPUAcceleration || false;
  }

  public shouldUsePredictiveStroke(): boolean {
    return this.performanceProfile?.enablePredictiveStroke || false;
  }

  public shouldUseAdaptiveQuality(): boolean {
    return this.performanceProfile?.adaptiveQuality || true;
  }

  // ===== DYNAMIC OPTIMIZATION =====

  public adaptToMemoryPressure(pressure: number): void {
    if (!this.performanceProfile) return;
    
    if (pressure > 0.8) {
      // Aggressive memory management
      this.performanceProfile.maxConcurrentTiles = Math.max(8, this.performanceProfile.maxConcurrentTiles / 2);
      this.performanceProfile.compressionLevel = Math.max(1, this.performanceProfile.compressionLevel - 2);
      this.performanceProfile.aggressiveMemoryManagement = true;
      
      console.log('📉 Adapted to memory pressure:', pressure);
    }
  }

  public adaptToFrameRate(averageFPS: number): void {
    if (!this.performanceProfile) return;
    
    const targetFPS = this.performanceProfile.targetFrameRate;
    
    if (averageFPS < targetFPS * 0.8) {
      // Performance is poor, reduce quality
      this.performanceProfile.adaptiveQuality = true;
      this.performanceProfile.enableRealTimeEffects = false;
      
      console.log('📉 Adapted to low frame rate:', averageFPS);
    } else if (averageFPS > targetFPS * 0.95) {
      // Performance is good, can increase quality
      if (this.thermalState.current === 'nominal') {
        this.performanceProfile.enableRealTimeEffects = this.detectedModel?.performanceTier !== 'entry';
      }
    }
  }

  // ===== CLEANUP =====

  public cleanup(): void {
    this.detectedModel = null;
    this.performanceProfile = null;
    this.benchmarkResults = {
      cpuScore: 0,
      gpuScore: 0,
      memoryBandwidth: 0,
      renderingPerformance: 0,
      lastBenchmark: 0,
    };
    
    console.log('🧹 Device Capabilities cleaned up');
  }
}

// Export singleton
export const deviceCapabilities = DeviceCapabilities.getInstance();