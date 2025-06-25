// src/engines/drawing/TileManager.ts - ENTERPRISE 4K CANVAS TILE SYSTEM
/**
 * Enterprise Tile Manager for 4K Canvas Support
 * Handles massive canvases (up to 16K) with intelligent memory management
 * - Tile-based rendering (256x256, 512x512, 1024x1024)
 * - Dynamic tile loading/unloading
 * - Memory pressure adaptation
 * - Device capability scaling (iPad Mini 5 → iPad Pro M2)
 * - Compression for inactive tiles
 * - Viewport-based optimization
 */

import { Platform, Dimensions } from 'react-native';
import { CompatSkia, SkSurface, SkImage, SkCanvas, SkPaint } from './SkiaCompatibility';
import { EventBus } from '../core/EventBus';
import { performanceOptimizer } from './PerformanceOptimizer';

// Device capability detection
interface DeviceCapabilities {
  modelName: string;
  totalMemoryGB: number;
  gpuTier: 'low' | 'medium' | 'high' | 'ultra';
  maxTextureSize: number;
  supportsMetal: boolean;
  supportsMemoryMapping: boolean;
  recommendedTileSize: number;
  maxConcurrentTiles: number;
  compressionLevel: number;
}

// Tile configuration
export interface TileConfig {
  tileSize: number;           // 256, 512, or 1024
  compressionQuality: number; // 0.1-1.0
  maxConcurrentTiles: number; // Memory budget
  preloadRadius: number;      // Tiles to preload around viewport
  compressionDelay: number;   // MS before compressing inactive tiles
  gcInterval: number;         // Garbage collection interval
}

// Tile data structure
export interface Tile {
  // Identification
  id: string;
  x: number;              // Tile coordinate (not pixel)
  y: number;              // Tile coordinate (not pixel)
  layer: string;          // Layer ID
  
  // State
  isLoaded: boolean;
  isDirty: boolean;
  isEmpty: boolean;
  isCompressed: boolean;
  isVisible: boolean;
  
  // Content
  surface: SkSurface | null;
  compressedData: Uint8Array | null;
  lastAccessed: number;
  loadPriority: number;
  
  // Metadata
  bounds: { x: number; y: number; width: number; height: number };
  version: number;
  checksum?: string;
}

// Viewport for visibility culling
export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  rotation?: number;
}

// Memory budget management
interface MemoryBudget {
  totalMB: number;
  activeTilesMB: number;
  compressedTilesMB: number;
  bufferMB: number;
  availableMB: number;
  pressure: number; // 0-1
}

// Tile compression
interface TileCompressor {
  compress(surface: SkSurface, quality: number): Promise<Uint8Array>;
  decompress(data: Uint8Array): Promise<SkSurface | null>;
  getCompressionRatio(original: number, compressed: number): number;
}

/**
 * Enterprise Tile Manager - Handles massive canvas with intelligent memory management
 */
export class TileManager {
  private static instance: TileManager;
  private eventBus = EventBus.getInstance();
  
  // Device capabilities
  private deviceCapabilities: DeviceCapabilities;
  private config: TileConfig;
  
  // Canvas properties
  private canvasWidth = 0;
  private canvasHeight = 0;
  private pixelRatio = 3;
  private tilesPerRow = 0;
  private tilesPerCol = 0;
  
  // Tile storage
  private tiles: Map<string, Tile> = new Map();
  private activeTiles: Set<string> = new Set();
  private loadingTiles: Set<string> = new Set();
  private dirtyTiles: Set<string> = new Set();
  
  // Memory management
  private memoryBudget: MemoryBudget;
  private compressor: TileCompressor;
  private gcTimer: NodeJS.Timeout | null = null;
  
  // Viewport tracking
  private currentViewport: Viewport = { x: 0, y: 0, width: 0, height: 0, scale: 1 };
  private visibleTileIds: Set<string> = new Set();
  
  // Performance tracking
  private stats = {
    totalTiles: 0,
    loadedTiles: 0,
    compressedTiles: 0,
    memoryUsageMB: 0,
    hitRate: 0,
    avgLoadTime: 0,
    compressionRatio: 0,
  };
  
  // LRU cache for tile eviction
  private accessOrder: string[] = [];
  private readonly MAX_ACCESS_HISTORY = 1000;

  private constructor() {
    this.deviceCapabilities = this.detectDeviceCapabilities();
    this.config = this.createOptimalConfig();
    this.memoryBudget = this.calculateMemoryBudget();
    this.compressor = new PNGTileCompressor();
    
    console.log('🔲 TileManager initialized', {
      device: this.deviceCapabilities.modelName,
      tileSize: this.config.tileSize,
      maxTiles: this.config.maxConcurrentTiles,
      memoryBudget: `${this.memoryBudget.totalMB}MB`,
    });
  }

  public static getInstance(): TileManager {
    if (!TileManager.instance) {
      TileManager.instance = new TileManager();
    }
    return TileManager.instance;
  }

  // ===== INITIALIZATION =====

  public async initialize(width: number, height: number, pixelRatio: number = 3): Promise<void> {
    console.log(`🚀 Initializing TileManager for ${width}x${height} canvas at ${pixelRatio}x`);
    
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.pixelRatio = pixelRatio;
    
    // Calculate tile grid
    this.tilesPerRow = Math.ceil(width / this.config.tileSize);
    this.tilesPerCol = Math.ceil(height / this.config.tileSize);
    this.stats.totalTiles = this.tilesPerRow * this.tilesPerCol;
    
    console.log(`📐 Canvas grid: ${this.tilesPerRow}x${this.tilesPerCol} tiles (${this.stats.totalTiles} total)`);
    
    // Validate canvas size
    if (this.stats.totalTiles > 10000) {
      console.warn(`⚠️ Large canvas detected: ${this.stats.totalTiles} tiles`);
      
      // Suggest smaller tile size for massive canvases
      if (this.stats.totalTiles > 50000) {
        throw new Error(`Canvas too large: ${width}x${height} would require ${this.stats.totalTiles} tiles`);
      }
    }
    
    // Start garbage collection
    this.startGarbageCollection();
    
    // Setup memory pressure monitoring
    this.startMemoryMonitoring();
    
    this.eventBus.emit('tiles:initialized', {
      canvasSize: { width, height },
      tileGrid: { rows: this.tilesPerRow, cols: this.tilesPerCol },
      totalTiles: this.stats.totalTiles,
    });
  }

  // ===== TILE MANAGEMENT =====

  public async getTile(x: number, y: number, layerId: string = 'default'): Promise<Tile | null> {
    const tileId = this.getTileId(x, y, layerId);
    
    // Check if tile exists
    let tile = this.tiles.get(tileId);
    
    if (!tile) {
      // Create new tile
      tile = await this.createTile(x, y, layerId);
      this.tiles.set(tileId, tile);
    }
    
    // Mark as accessed
    this.markTileAccessed(tileId);
    
    // Ensure tile is loaded
    if (!tile.isLoaded) {
      await this.loadTile(tile);
    }
    
    return tile;
  }

  public async getTileByPixel(pixelX: number, pixelY: number, layerId: string = 'default'): Promise<Tile | null> {
    const tileX = Math.floor(pixelX / this.config.tileSize);
    const tileY = Math.floor(pixelY / this.config.tileSize);
    
    return this.getTile(tileX, tileY, layerId);
  }

  public async getVisibleTiles(viewport: Viewport, layerId: string = 'default'): Promise<Tile[]> {
    const tiles: Tile[] = [];
    
    // Calculate tile bounds for viewport
    const startTileX = Math.floor(viewport.x / this.config.tileSize);
    const endTileX = Math.ceil((viewport.x + viewport.width) / this.config.tileSize);
    const startTileY = Math.floor(viewport.y / this.config.tileSize);
    const endTileY = Math.ceil((viewport.y + viewport.height) / this.config.tileSize);
    
    // Clamp to canvas bounds
    const minX = Math.max(0, startTileX);
    const maxX = Math.min(this.tilesPerRow - 1, endTileX);
    const minY = Math.max(0, startTileY);
    const maxY = Math.min(this.tilesPerCol - 1, endTileY);
    
    // Get tiles in viewport
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const tile = await this.getTile(x, y, layerId);
        if (tile) {
          tiles.push(tile);
        }
      }
    }
    
    return tiles;
  }

  public markTileDirty(pixelX: number, pixelY: number, width: number, height: number, layerId: string = 'default'): void {
    // Find all tiles that intersect with the dirty region
    const startTileX = Math.floor(pixelX / this.config.tileSize);
    const endTileX = Math.floor((pixelX + width - 1) / this.config.tileSize);
    const startTileY = Math.floor(pixelY / this.config.tileSize);
    const endTileY = Math.floor((pixelY + height - 1) / this.config.tileSize);
    
    for (let y = startTileY; y <= endTileY; y++) {
      for (let x = startTileX; x <= endTileX; x++) {
        const tileId = this.getTileId(x, y, layerId);
        const tile = this.tiles.get(tileId);
        
        if (tile) {
          tile.isDirty = true;
          tile.version++;
          this.dirtyTiles.add(tileId);
        }
      }
    }
    
    this.eventBus.emit('tiles:dirty', {
      region: { x: pixelX, y: pixelY, width, height },
      affectedTiles: (endTileX - startTileX + 1) * (endTileY - startTileY + 1),
    });
  }

  // ===== VIEWPORT MANAGEMENT =====

  public updateViewport(viewport: Viewport): void {
    this.currentViewport = viewport;
    
    // Update visible tiles
    this.updateVisibleTiles();
    
    // Preload tiles around viewport
    this.preloadNearbyTiles();
    
    // Compress tiles far from viewport
    this.compressDistantTiles();
  }

  private updateVisibleTiles(): void {
    const newVisibleTiles = new Set<string>();
    
    // Calculate visible tile range
    const startTileX = Math.floor(this.currentViewport.x / this.config.tileSize);
    const endTileX = Math.ceil((this.currentViewport.x + this.currentViewport.width) / this.config.tileSize);
    const startTileY = Math.floor(this.currentViewport.y / this.config.tileSize);
    const endTileY = Math.ceil((this.currentViewport.y + this.currentViewport.height) / this.config.tileSize);
    
    for (let y = startTileY; y <= endTileY; y++) {
      for (let x = startTileX; x <= endTileX; x++) {
        if (x >= 0 && x < this.tilesPerRow && y >= 0 && y < this.tilesPerCol) {
          const tileId = this.getTileId(x, y, 'default'); // TODO: Handle multiple layers
          newVisibleTiles.add(tileId);
          
          // Mark tile as visible
          const tile = this.tiles.get(tileId);
          if (tile) {
            tile.isVisible = true;
          }
        }
      }
    }
    
    // Mark previously visible tiles as not visible
    for (const tileId of this.visibleTileIds) {
      if (!newVisibleTiles.has(tileId)) {
        const tile = this.tiles.get(tileId);
        if (tile) {
          tile.isVisible = false;
        }
      }
    }
    
    this.visibleTileIds = newVisibleTiles;
  }

  private preloadNearbyTiles(): void {
    if (this.memoryBudget.pressure > 0.8) {
      return; // Skip preloading under memory pressure
    }
    
    const preloadRadius = this.config.preloadRadius;
    const centerTileX = Math.floor((this.currentViewport.x + this.currentViewport.width / 2) / this.config.tileSize);
    const centerTileY = Math.floor((this.currentViewport.y + this.currentViewport.height / 2) / this.config.tileSize);
    
    // Preload tiles in spiral pattern around center
    const preloadPromises: Promise<void>[] = [];
    
    for (let radius = 1; radius <= preloadRadius; radius++) {
      for (let angle = 0; angle < 360; angle += 45) {
        const x = centerTileX + Math.round(radius * Math.cos(angle * Math.PI / 180));
        const y = centerTileY + Math.round(radius * Math.sin(angle * Math.PI / 180));
        
        if (x >= 0 && x < this.tilesPerRow && y >= 0 && y < this.tilesPerCol) {
          const tileId = this.getTileId(x, y, 'default');
          
          if (!this.tiles.has(tileId) && !this.loadingTiles.has(tileId)) {
            preloadPromises.push(this.preloadTile(x, y, 'default'));
          }
        }
      }
    }
    
    // Limit concurrent preloads
    if (preloadPromises.length > 0) {
      Promise.allSettled(preloadPromises.slice(0, 4)); // Max 4 concurrent preloads
    }
  }

  // ===== TILE CREATION AND LOADING =====

  private async createTile(x: number, y: number, layerId: string): Promise<Tile> {
    const tileId = this.getTileId(x, y, layerId);
    
    const tile: Tile = {
      id: tileId,
      x,
      y,
      layer: layerId,
      isLoaded: false,
      isDirty: false,
      isEmpty: true,
      isCompressed: false,
      isVisible: false,
      surface: null,
      compressedData: null,
      lastAccessed: Date.now(),
      loadPriority: 0,
      bounds: {
        x: x * this.config.tileSize,
        y: y * this.config.tileSize,
        width: this.config.tileSize,
        height: this.config.tileSize,
      },
      version: 1,
    };
    
    return tile;
  }

  private async loadTile(tile: Tile): Promise<void> {
    if (tile.isLoaded || this.loadingTiles.has(tile.id)) {
      return;
    }
    
    this.loadingTiles.add(tile.id);
    
    try {
      // Check if we have compressed data
      if (tile.compressedData) {
        tile.surface = await this.compressor.decompress(tile.compressedData);
        tile.compressedData = null;
        tile.isCompressed = false;
      } else {
        // Create new surface
        tile.surface = CompatSkia.Surface.Make(this.config.tileSize, this.config.tileSize);
        
        if (tile.surface) {
          // Clear to transparent
          const canvas = tile.surface.getCanvas();
          canvas.clear(CompatSkia.Color('transparent'));
        }
      }
      
      if (tile.surface) {
        tile.isLoaded = true;
        this.activeTiles.add(tile.id);
        this.stats.loadedTiles++;
        
        // Update memory usage
        this.updateMemoryUsage();
        
        // Check memory pressure
        if (this.memoryBudget.pressure > 0.9) {
          await this.evictLeastRecentlyUsedTiles();
        }
      }
    } catch (error) {
      console.error(`❌ Failed to load tile ${tile.id}:`, error);
    } finally {
      this.loadingTiles.delete(tile.id);
    }
  }

  private async preloadTile(x: number, y: number, layerId: string): Promise<void> {
    const tile = await this.createTile(x, y, layerId);
    this.tiles.set(tile.id, tile);
    
    // Set low priority for preloaded tiles
    tile.loadPriority = -1;
    
    await this.loadTile(tile);
  }

  // ===== MEMORY MANAGEMENT =====

  private updateMemoryUsage(): void {
    let activeMB = 0;
    let compressedMB = 0;
    
    for (const tile of this.tiles.values()) {
      if (tile.isLoaded && tile.surface) {
        // Calculate surface memory usage
        const bytesPerPixel = 4; // RGBA
        const tileBytes = this.config.tileSize * this.config.tileSize * bytesPerPixel;
        activeMB += tileBytes / (1024 * 1024);
      }
      
      if (tile.compressedData) {
        compressedMB += tile.compressedData.length / (1024 * 1024);
      }
    }
    
    this.memoryBudget.activeTilesMB = activeMB;
    this.memoryBudget.compressedTilesMB = compressedMB;
    this.memoryBudget.availableMB = this.memoryBudget.totalMB - activeMB - compressedMB - this.memoryBudget.bufferMB;
    this.memoryBudget.pressure = Math.max(0, 1 - (this.memoryBudget.availableMB / this.memoryBudget.totalMB));
    
    this.stats.memoryUsageMB = activeMB + compressedMB;
  }

  private async evictLeastRecentlyUsedTiles(): Promise<void> {
    const evictionCandidates: Tile[] = [];
    
    // Find tiles that can be evicted (not visible, not dirty)
    for (const tile of this.tiles.values()) {
      if (tile.isLoaded && !tile.isVisible && !tile.isDirty) {
        evictionCandidates.push(tile);
      }
    }
    
    // Sort by last accessed time (LRU)
    evictionCandidates.sort((a, b) => a.lastAccessed - b.lastAccessed);
    
    // Evict oldest tiles until memory pressure is reduced
    let evicted = 0;
    for (const tile of evictionCandidates) {
      if (this.memoryBudget.pressure < 0.7) break;
      
      await this.evictTile(tile);
      evicted++;
      
      if (evicted >= 10) break; // Limit evictions per cycle
    }
    
    if (evicted > 0) {
      console.log(`🗑️ Evicted ${evicted} tiles due to memory pressure`);
      this.eventBus.emit('tiles:evicted', { count: evicted, memoryPressure: this.memoryBudget.pressure });
    }
  }

  private async evictTile(tile: Tile): Promise<void> {
    if (!tile.isLoaded || !tile.surface) return;
    
    // Compress tile data before eviction
    if (!tile.isEmpty) {
      try {
        tile.compressedData = await this.compressor.compress(tile.surface, this.config.compressionQuality);
        tile.isCompressed = true;
        this.stats.compressedTiles++;
      } catch (error) {
        console.warn(`⚠️ Failed to compress tile ${tile.id}:`, error);
      }
    }
    
    // Release surface
    tile.surface = null;
    tile.isLoaded = false;
    this.activeTiles.delete(tile.id);
    this.stats.loadedTiles--;
    
    this.updateMemoryUsage();
  }

  // ===== COMPRESSION =====

  private compressDistantTiles(): void {
    if (this.memoryBudget.pressure < 0.5) {
      return; // Only compress under memory pressure
    }
    
    const compressionDelay = this.config.compressionDelay;
    const now = Date.now();
    
    for (const tile of this.tiles.values()) {
      if (tile.isLoaded && 
          !tile.isVisible && 
          !tile.isDirty && 
          now - tile.lastAccessed > compressionDelay) {
        // Queue for compression
        setTimeout(() => this.evictTile(tile), 100);
      }
    }
  }

  // ===== GARBAGE COLLECTION =====

  private startGarbageCollection(): void {
    this.gcTimer = setInterval(() => {
      this.performGarbageCollection();
    }, this.config.gcInterval);
  }

  private performGarbageCollection(): void {
    const before = this.tiles.size;
    let removed = 0;
    
    // Remove completely empty tiles that haven't been accessed recently
    const cutoffTime = Date.now() - 300000; // 5 minutes
    
    for (const [tileId, tile] of this.tiles.entries()) {
      if (tile.isEmpty && 
          !tile.isLoaded && 
          !tile.compressedData && 
          tile.lastAccessed < cutoffTime &&
          !this.visibleTileIds.has(tileId)) {
        this.tiles.delete(tileId);
        removed++;
      }
    }
    
    // Cleanup access order
    if (this.accessOrder.length > this.MAX_ACCESS_HISTORY) {
      this.accessOrder = this.accessOrder.slice(-this.MAX_ACCESS_HISTORY / 2);
    }
    
    if (removed > 0) {
      console.log(`🗑️ GC removed ${removed} empty tiles (${before} → ${this.tiles.size})`);
    }
    
    this.updateMemoryUsage();
  }

  // ===== PERFORMANCE MONITORING =====

  private startMemoryMonitoring(): void {
    setInterval(() => {
      this.updateMemoryUsage();
      
      // Emit memory stats
      this.eventBus.emit('tiles:memoryStats', {
        budget: this.memoryBudget,
        stats: this.stats,
      });
      
      // Adaptive configuration based on memory pressure
      this.adaptConfiguration();
    }, 5000); // Every 5 seconds
  }

  private adaptConfiguration(): void {
    const pressure = this.memoryBudget.pressure;
    
    if (pressure > 0.8) {
      // Aggressive mode - reduce quality and preloading
      this.config.compressionQuality = Math.max(0.3, this.config.compressionQuality - 0.1);
      this.config.preloadRadius = Math.max(0, this.config.preloadRadius - 1);
      this.config.compressionDelay = Math.max(1000, this.config.compressionDelay - 1000);
    } else if (pressure < 0.3) {
      // Relaxed mode - increase quality and preloading
      this.config.compressionQuality = Math.min(0.9, this.config.compressionQuality + 0.05);
      this.config.preloadRadius = Math.min(3, this.config.preloadRadius + 1);
      this.config.compressionDelay = Math.min(10000, this.config.compressionDelay + 1000);
    }
  }

  // ===== DEVICE DETECTION =====

  private detectDeviceCapabilities(): DeviceCapabilities {
    const { width, height } = Dimensions.get('window');
    const screenDiagonal = Math.sqrt(width * width + height * height);
    
    // Detect device tier based on screen size and platform
    let gpuTier: 'low' | 'medium' | 'high' | 'ultra' = 'medium';
    let totalMemoryGB = 4; // Default assumption
    let maxTextureSize = 4096;
    let recommendedTileSize = 512;
    let maxConcurrentTiles = 64;
    let compressionLevel = 5;
    
    if (Platform.OS === 'ios') {
      // iPad detection based on screen diagonal
      if (screenDiagonal > 1400) {
        // iPad Pro 12.9"
        gpuTier = 'ultra';
        totalMemoryGB = 16;
        maxTextureSize = 16384;
        recommendedTileSize = 1024;
        maxConcurrentTiles = 256;
        compressionLevel = 9;
      } else if (screenDiagonal > 1100) {
        // iPad Pro 11", iPad Air
        gpuTier = 'high';
        totalMemoryGB = 8;
        maxTextureSize = 8192;
        recommendedTileSize = 512;
        maxConcurrentTiles = 128;
        compressionLevel = 7;
      } else if (screenDiagonal > 900) {
        // iPad 10.9", iPad Mini 6
        gpuTier = 'medium';
        totalMemoryGB = 4;
        maxTextureSize = 4096;
        recommendedTileSize = 512;
        maxConcurrentTiles = 64;
        compressionLevel = 5;
      } else {
        // iPad Mini 5, older iPads
        gpuTier = 'low';
        totalMemoryGB = 3;
        maxTextureSize = 2048;
        recommendedTileSize = 256;
        maxConcurrentTiles = 32;
        compressionLevel = 3;
      }
    }
    
    return {
      modelName: Platform.OS === 'ios' ? 'iPad' : 'Android Tablet',
      totalMemoryGB,
      gpuTier,
      maxTextureSize,
      supportsMetal: Platform.OS === 'ios',
      supportsMemoryMapping: Platform.OS === 'ios',
      recommendedTileSize,
      maxConcurrentTiles,
      compressionLevel,
    };
  }

  private createOptimalConfig(): TileConfig {
    const caps = this.deviceCapabilities;
    
    return {
      tileSize: caps.recommendedTileSize,
      compressionQuality: 0.8,
      maxConcurrentTiles: caps.maxConcurrentTiles,
      preloadRadius: caps.gpuTier === 'ultra' ? 3 : caps.gpuTier === 'high' ? 2 : 1,
      compressionDelay: caps.gpuTier === 'low' ? 2000 : 5000,
      gcInterval: caps.gpuTier === 'low' ? 10000 : 30000,
    };
  }

  private calculateMemoryBudget(): MemoryBudget {
    const totalMB = this.deviceCapabilities.totalMemoryGB * 1024;
    const reservedMB = totalMB * 0.3; // Reserve 30% for system/app
    const availableMB = totalMB - reservedMB;
    const bufferMB = availableMB * 0.2; // 20% buffer
    
    return {
      totalMB: availableMB,
      activeTilesMB: 0,
      compressedTilesMB: 0,
      bufferMB,
      availableMB: availableMB - bufferMB,
      pressure: 0,
    };
  }

  // ===== UTILITIES =====

  private getTileId(x: number, y: number, layerId: string): string {
    return `${layerId}_${x}_${y}`;
  }

  private markTileAccessed(tileId: string): void {
    const tile = this.tiles.get(tileId);
    if (tile) {
      tile.lastAccessed = Date.now();
      
      // Update access order for LRU
      const index = this.accessOrder.indexOf(tileId);
      if (index !== -1) {
        this.accessOrder.splice(index, 1);
      }
      this.accessOrder.push(tileId);
    }
  }

  // ===== PUBLIC API =====

  public getStats() {
    return {
      ...this.stats,
      memoryBudget: { ...this.memoryBudget },
      deviceCapabilities: { ...this.deviceCapabilities },
      config: { ...this.config },
    };
  }

  public getConfig(): TileConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<TileConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.eventBus.emit('tiles:configChanged', { config: this.config });
  }

  public getCurrentViewport(): Viewport {
    return { ...this.currentViewport };
  }

  public getTileCount(): { total: number; loaded: number; compressed: number } {
    return {
      total: this.tiles.size,
      loaded: this.stats.loadedTiles,
      compressed: this.stats.compressedTiles,
    };
  }

  // ===== CLEANUP =====

  public cleanup(): void {
    if (this.gcTimer) {
      clearInterval(this.gcTimer);
      this.gcTimer = null;
    }
    
    // Clear all tiles
    for (const tile of this.tiles.values()) {
      tile.surface = null;
      tile.compressedData = null;
    }
    
    this.tiles.clear();
    this.activeTiles.clear();
    this.loadingTiles.clear();
    this.dirtyTiles.clear();
    this.visibleTileIds.clear();
    this.accessOrder = [];
    
    console.log('🧹 TileManager cleaned up');
  }
}

// ===== TILE COMPRESSOR IMPLEMENTATION =====

class PNGTileCompressor implements TileCompressor {
  async compress(surface: SkSurface, quality: number): Promise<Uint8Array> {
    const image = surface.makeImageSnapshot();
    const data = image.encodeToBytes();
    
    if (!data) {
      throw new Error('Failed to encode tile image');
    }
    
    return new Uint8Array(data);
  }

  async decompress(data: Uint8Array): Promise<SkSurface | null> {
    try {
      const skData = CompatSkia.Data.fromBase64(
        btoa(String.fromCharCode(...data))
      );
      
      const image = CompatSkia.Image.MakeFromEncoded(skData);
      if (!image) return null;
      
      const surface = CompatSkia.Surface.Make(image.width(), image.height());
      if (!surface) return null;
      
      const canvas = surface.getCanvas();
      const paint = CompatSkia.Paint();
      canvas.drawImage(image, 0, 0, paint);
      
      return surface;
    } catch (error) {
      console.error('❌ Tile decompression failed:', error);
      return null;
    }
  }

  getCompressionRatio(original: number, compressed: number): number {
    return compressed / original;
  }
}

// Export singleton
export const tileManager = TileManager.getInstance();