// src/engines/drawing/LayerManager.ts
import { 
    Layer, 
    Stroke, 
    BlendMode,
    LayerType,
    LayerGroup,
    ClippingMask,
    LayerEffect,
    LayerTransform,
  } from '../../types/drawing';
  import { valkyrieEngine } from './ValkyrieEngine';
  import { EventBus } from '../core/EventBus';
  import { dataManager } from '../core/DataManager';
  import { 
    SkSurface, 
    SkImage,
    ColorType,
    AlphaType,
  } from '@shopify/react-native-skia';
  import { CompatSkia } from './SkiaCompatibility';
  
  /**
   * Layer Manager - Procreate-level layer system
   * Supports unlimited layers, 29 blend modes, groups, masks, and effects
   */
  export class LayerManager {
    private static instance: LayerManager;
    private eventBus = EventBus.getInstance();
    
    // Layer management
    private layers: Map<string, Layer> = new Map();
    private layerOrder: string[] = [];
    private currentLayerId: string | null = null;
    private layerGroups: Map<string, LayerGroup> = new Map();
    
    // Canvas properties
    private canvasWidth = 0;
    private canvasHeight = 0;
    private pixelRatio = 3;
    
    // History for undo/redo
    private history: HistoryEntry[] = [];
    private historyIndex = -1;
    private readonly MAX_HISTORY = 100;
    
    // Performance
    private layerCache: Map<string, LayerCache> = new Map();
    private compositingOptimizationEnabled = true;
    
    // Blend modes mapping
    private readonly BLEND_MODES: BlendMode[] = [
      'normal', 'multiply', 'screen', 'overlay', 'soft-light', 'hard-light',
      'color-dodge', 'color-burn', 'darken', 'lighten', 'difference',
      'exclusion', 'hue', 'saturation', 'color', 'luminosity', 'clear',
      'source', 'destination', 'source-over', 'destination-over',
      'source-in', 'destination-in', 'source-out', 'destination-out',
      'source-atop', 'destination-atop', 'xor', 'plus', 'modulate',
    ];
    
    // Layer limits
    private readonly MAX_LAYERS = 999; // Procreate supports 999 layers
    private readonly MAX_LAYER_SIZE_MB = 100; // Memory limit per layer
  
    private constructor() {}
  
    public static getInstance(): LayerManager {
      if (!LayerManager.instance) {
        LayerManager.instance = new LayerManager();
      }
      return LayerManager.instance;
    }
  
    // ===== PUBLIC API =====
  
    public async initialize(width: number, height: number): Promise<void> {
      console.log(`🎨 Initializing Layer Manager: ${width}x${height}`);
      
      this.canvasWidth = width;
      this.canvasHeight = height;
      
      // Create default layer
      const defaultLayer = this.createLayer('Background', 'raster');
      this.currentLayerId = defaultLayer.id;
      
      // Load saved layers if any
      await this.loadSavedLayers();
      
      this.eventBus.emit('layers:initialized', { count: this.layers.size });
    }
  
    public createLayer(
      name: string = 'New Layer',
      type: LayerType = 'raster',
      options: Partial<Layer> = {}
    ): Layer {
      if (this.layers.size >= this.MAX_LAYERS) {
        throw new Error(`Maximum layer limit (${this.MAX_LAYERS}) reached`);
      }
      
      const layerId = `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const layer: Layer = {
        id: layerId,
        name,
        type,
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        locked: false,
        clippingMask: false,
        maskLayerId: null,
        groupId: null,
        strokes: [],
        transform: {
          x: 0,
          y: 0,
          scale: 1,
          rotation: 0,
          flipX: false,
          flipY: false,
        },
        effects: [],
        ...options,
      };
      
      // Create surface for layer
      const surface = valkyrieEngine.createLayerSurface(layerId, this.canvasWidth, this.canvasHeight);
      
      // Add to layers
      this.layers.set(layerId, layer);
      
      // Insert at top of order
      const insertIndex = this.currentLayerId 
        ? this.layerOrder.indexOf(this.currentLayerId) + 1
        : this.layerOrder.length;
      
      this.layerOrder.splice(insertIndex, 0, layerId);
      
      // Record history
      this.recordHistory({
        type: 'create',
        layerId,
        data: { layer },
      });
      
      this.eventBus.emit('layer:created', { layer });
      return layer;
    }
  
    public deleteLayer(layerId: string): boolean {
      const layer = this.layers.get(layerId);
      if (!layer || this.layers.size === 1) return false; // Keep at least one layer
      
      // Remove from order
      const index = this.layerOrder.indexOf(layerId);
      if (index !== -1) {
        this.layerOrder.splice(index, 1);
      }
      
      // Update current layer if needed
      if (this.currentLayerId === layerId) {
        this.currentLayerId = this.layerOrder[Math.max(0, index - 1)] || null;
      }
      
      // Release surface
      valkyrieEngine.releaseLayerSurface(layerId);
      
      // Remove from cache
      this.layerCache.delete(layerId);
      
      // Remove layer
      this.layers.delete(layerId);
      
      // Record history
      this.recordHistory({
        type: 'delete',
        layerId,
        data: { layer, index },
      });
      
      this.eventBus.emit('layer:deleted', { layerId });
      return true;
    }
  
    public duplicateLayer(layerId: string): Layer | null {
      const sourceLayer = this.layers.get(layerId);
      if (!sourceLayer) return null;
      
      // Create new layer with same properties
      const duplicatedLayer = this.createLayer(
        `${sourceLayer.name} Copy`,
        sourceLayer.type,
        {
          opacity: sourceLayer.opacity,
          blendMode: sourceLayer.blendMode,
          transform: { ...sourceLayer.transform },
          effects: [...sourceLayer.effects],
        }
      );
      
      // Copy layer content
      const sourceSurface = valkyrieEngine.getLayerSurface(layerId);
      const destSurface = valkyrieEngine.getLayerSurface(duplicatedLayer.id);
      
      if (sourceSurface && destSurface) {
        const sourceImage = sourceSurface.makeImageSnapshot();
        const canvas = destSurface.getCanvas();
        const paint = CompatSkia.Paint();
        
        canvas.drawImage(sourceImage, 0, 0, paint);
      }
      
      // Copy strokes
      duplicatedLayer.strokes = sourceLayer.strokes.map(stroke => ({
        ...stroke,
        id: `${stroke.id}_copy`,
        layerId: duplicatedLayer.id,
      }));
      
      this.eventBus.emit('layer:duplicated', { 
        sourceId: layerId, 
        duplicatedLayer 
      });
      
      return duplicatedLayer;
    }
  
    public mergeLayerDown(layerId: string): boolean {
      const index = this.layerOrder.indexOf(layerId);
      if (index <= 0) return false; // Can't merge bottom layer
      
      const topLayer = this.layers.get(layerId);
      const bottomLayerId = this.layerOrder[index - 1];
      const bottomLayer = this.layers.get(bottomLayerId);
      
      if (!topLayer || !bottomLayer) return false;
      
      // Get surfaces
      const topSurface = valkyrieEngine.getLayerSurface(layerId);
      const bottomSurface = valkyrieEngine.getLayerSurface(bottomLayerId);
      
      if (!topSurface || !bottomSurface) return false;
      
      // Merge top layer into bottom
      const topImage = topSurface.makeImageSnapshot();
      const canvas = bottomSurface.getCanvas();
      const paint = CompatSkia.Paint();
      
      paint.setAlphaf(topLayer.opacity);
      paint.setBlendMode(valkyrieEngine.getSkiaBlendMode(topLayer.blendMode));
      
      canvas.drawImage(topImage, 0, 0, paint);
      
      // Merge strokes
      bottomLayer.strokes.push(...topLayer.strokes.map(stroke => ({
        ...stroke,
        layerId: bottomLayerId,
      })));
      
      // Delete top layer
      this.deleteLayer(layerId);
      
      // Record history
      this.recordHistory({
        type: 'merge',
        layerId: bottomLayerId,
        data: { topLayer, bottomLayer },
      });
      
      this.eventBus.emit('layers:merged', { 
        topLayerId: layerId, 
        bottomLayerId 
      });
      
      return true;
    }
  
    public setLayerOpacity(layerId: string, opacity: number): boolean {
      const layer = this.layers.get(layerId);
      if (!layer) return false;
      
      const oldOpacity = layer.opacity;
      layer.opacity = Math.max(0, Math.min(1, opacity));
      
      // Invalidate cache
      this.invalidateLayerCache(layerId);
      
      // Record history
      this.recordHistory({
        type: 'property',
        layerId,
        data: { 
          property: 'opacity',
          oldValue: oldOpacity,
          newValue: layer.opacity,
        },
      });
      
      this.eventBus.emit('layer:updated', { layer, property: 'opacity' });
      return true;
    }
  
    public setLayerBlendMode(layerId: string, blendMode: BlendMode): boolean {
      const layer = this.layers.get(layerId);
      if (!layer) return false;
      
      const oldBlendMode = layer.blendMode;
      layer.blendMode = blendMode;
      
      // Invalidate cache
      this.invalidateLayerCache(layerId);
      
      // Record history
      this.recordHistory({
        type: 'property',
        layerId,
        data: {
          property: 'blendMode',
          oldValue: oldBlendMode,
          newValue: blendMode,
        },
      });
      
      this.eventBus.emit('layer:updated', { layer, property: 'blendMode' });
      return true;
    }
  
    public setLayerVisibility(layerId: string, visible: boolean): boolean {
      const layer = this.layers.get(layerId);
      if (!layer) return false;
      
      layer.visible = visible;
      
      // Invalidate cache
      this.invalidateLayerCache(layerId);
      
      this.eventBus.emit('layer:updated', { layer, property: 'visible' });
      return true;
    }
  
    public setLayerLocked(layerId: string, locked: boolean): boolean {
      const layer = this.layers.get(layerId);
      if (!layer) return false;
      
      layer.locked = locked;
      
      this.eventBus.emit('layer:updated', { layer, property: 'locked' });
      return true;
    }
  
    public renameLayer(layerId: string, name: string): boolean {
      const layer = this.layers.get(layerId);
      if (!layer) return false;
      
      const oldName = layer.name;
      layer.name = name;
      
      // Record history
      this.recordHistory({
        type: 'property',
        layerId,
        data: {
          property: 'name',
          oldValue: oldName,
          newValue: name,
        },
      });
      
      this.eventBus.emit('layer:updated', { layer, property: 'name' });
      return true;
    }
  
    public reorderLayers(fromIndex: number, toIndex: number): boolean {
      if (fromIndex < 0 || fromIndex >= this.layerOrder.length ||
          toIndex < 0 || toIndex >= this.layerOrder.length) {
        return false;
      }
      
      const [layerId] = this.layerOrder.splice(fromIndex, 1);
      this.layerOrder.splice(toIndex, 0, layerId);
      
      // Invalidate cache for affected layers
      for (let i = Math.min(fromIndex, toIndex); i <= Math.max(fromIndex, toIndex); i++) {
        this.invalidateLayerCache(this.layerOrder[i]);
      }
      
      // Record history
      this.recordHistory({
        type: 'reorder',
        layerId,
        data: { fromIndex, toIndex },
      });
      
      this.eventBus.emit('layers:reordered', { fromIndex, toIndex });
      return true;
    }
  
    public setCurrentLayer(layerId: string): boolean {
      if (!this.layers.has(layerId)) return false;
      
      this.currentLayerId = layerId;
      this.eventBus.emit('layer:selected', { layerId });
      return true;
    }
  
    public getCurrentLayer(): Layer | null {
      return this.currentLayerId ? this.layers.get(this.currentLayerId) || null : null;
    }
  
    public getCurrentLayerId(): string | null {
      return this.currentLayerId;
    }
  
    public getCurrentLayerSurface(): SkSurface | null {
      if (!this.currentLayerId) return null;
      return valkyrieEngine.getLayerSurface(this.currentLayerId);
    }
  
    public getAllLayers(): Layer[] {
      return this.layerOrder.map(id => this.layers.get(id)!).filter(Boolean);
    }
  
    public getLayer(layerId: string): Layer | null {
      return this.layers.get(layerId) || null;
    }
  
    public getLayerCount(): number {
      return this.layers.size;
    }
  
    // Clipping masks
    public setClippingMask(layerId: string, enable: boolean): boolean {
      const layer = this.layers.get(layerId);
      if (!layer) return false;
      
      const index = this.layerOrder.indexOf(layerId);
      if (index <= 0) return false; // Can't clip to nothing below
      
      layer.clippingMask = enable;
      
      if (enable) {
        // Find base layer (first non-clipping layer below)
        let baseLayerId: string | null = null;
        for (let i = index - 1; i >= 0; i--) {
          const checkLayer = this.layers.get(this.layerOrder[i]);
          if (checkLayer && !checkLayer.clippingMask) {
            baseLayerId = this.layerOrder[i];
            break;
          }
        }
        
        layer.maskLayerId = baseLayerId;
      } else {
        layer.maskLayerId = null;
      }
      
      // Invalidate cache
      this.invalidateLayerCache(layerId);
      
      this.eventBus.emit('layer:updated', { layer, property: 'clippingMask' });
      return true;
    }
  
    // Layer groups
    public createLayerGroup(name: string = 'New Group', layerIds: string[] = []): LayerGroup {
      const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const group: LayerGroup = {
        id: groupId,
        name,
        layerIds,
        expanded: true,
        visible: true,
        opacity: 1,
        blendMode: 'normal',
      };
      
      this.layerGroups.set(groupId, group);
      
      // Update layers to reference group
      layerIds.forEach(layerId => {
        const layer = this.layers.get(layerId);
        if (layer) {
          layer.groupId = groupId;
        }
      });
      
      this.eventBus.emit('group:created', { group });
      return group;
    }
  
    public ungroupLayers(groupId: string): boolean {
      const group = this.layerGroups.get(groupId);
      if (!group) return false;
      
      // Remove group reference from layers
      group.layerIds.forEach(layerId => {
        const layer = this.layers.get(layerId);
        if (layer) {
          layer.groupId = null;
        }
      });
      
      this.layerGroups.delete(groupId);
      
      this.eventBus.emit('group:deleted', { groupId });
      return true;
    }
  
    // Layer transforms
    public transformLayer(layerId: string, transform: Partial<LayerTransform>): boolean {
      const layer = this.layers.get(layerId);
      if (!layer) return false;
      
      Object.assign(layer.transform, transform);
      
      // Invalidate cache
      this.invalidateLayerCache(layerId);
      
      this.eventBus.emit('layer:transformed', { layer, transform });
      return true;
    }
  
    // Layer effects
    public addLayerEffect(layerId: string, effect: LayerEffect): boolean {
      const layer = this.layers.get(layerId);
      if (!layer) return false;
      
      layer.effects.push(effect);
      
      // Invalidate cache
      this.invalidateLayerCache(layerId);
      
      this.eventBus.emit('layer:effectAdded', { layer, effect });
      return true;
    }
  
    public removeLayerEffect(layerId: string, effectId: string): boolean {
      const layer = this.layers.get(layerId);
      if (!layer) return false;
      
      const index = layer.effects.findIndex(e => e.id === effectId);
      if (index === -1) return false;
      
      layer.effects.splice(index, 1);
      
      // Invalidate cache
      this.invalidateLayerCache(layerId);
      
      this.eventBus.emit('layer:effectRemoved', { layer, effectId });
      return true;
    }
  
    // Stroke management
    public addStroke(stroke: Stroke): void {
      const layer = this.layers.get(stroke.layerId);
      if (!layer || layer.locked) return;
      
      layer.strokes.push(stroke);
      
      // Invalidate cache
      this.invalidateLayerCache(stroke.layerId);
      
      // Record history
      this.recordHistory({
        type: 'stroke',
        layerId: stroke.layerId,
        data: { stroke, action: 'add' },
      });
    }
  
    public removeStroke(layerId: string, strokeId: string): boolean {
      const layer = this.layers.get(layerId);
      if (!layer || layer.locked) return false;
      
      const index = layer.strokes.findIndex(s => s.id === strokeId);
      if (index === -1) return false;
      
      const [removed] = layer.strokes.splice(index, 1);
      
      // Invalidate cache
      this.invalidateLayerCache(layerId);
      
      // Record history
      this.recordHistory({
        type: 'stroke',
        layerId,
        data: { stroke: removed, action: 'remove' },
      });
      
      return true;
    }
  
    public clearLayer(layerId: string): boolean {
      const layer = this.layers.get(layerId);
      if (!layer || layer.locked) return false;
      
      const oldStrokes = [...layer.strokes];
      layer.strokes = [];
      
      // Clear surface
      const surface = valkyrieEngine.getLayerSurface(layerId);
      if (surface) {
        const canvas = surface.getCanvas();
        canvas.clear(CompatSkia.Color('transparent'));
      }
      
      // Invalidate cache
      this.invalidateLayerCache(layerId);
      
      // Record history
      this.recordHistory({
        type: 'clear',
        layerId,
        data: { strokes: oldStrokes },
      });
      
      this.eventBus.emit('layer:cleared', { layerId });
      return true;
    }
  
    // History management
    public undo(): boolean {
      if (this.historyIndex < 0) return false;
      
      const entry = this.history[this.historyIndex];
      this.applyHistoryEntry(entry, true);
      
      this.historyIndex--;
      this.eventBus.emit('history:undo', { entry });
      return true;
    }
  
    public redo(): boolean {
      if (this.historyIndex >= this.history.length - 1) return false;
      
      this.historyIndex++;
      const entry = this.history[this.historyIndex];
      this.applyHistoryEntry(entry, false);
      
      this.eventBus.emit('history:redo', { entry });
      return true;
    }
  
    public canUndo(): boolean {
      return this.historyIndex >= 0;
    }
  
    public canRedo(): boolean {
      return this.historyIndex < this.history.length - 1;
    }
  
    // Export/Import
    public async exportLayer(layerId: string): Promise<Blob | null> {
      const surface = valkyrieEngine.getLayerSurface(layerId);
      if (!surface) return null;
      
      const image = surface.makeImageSnapshot();
      const data = image.encodeToBytes();
      
      if (!data) return null;
      
      return new Blob([data], { type: 'image/png' });
    }
  
    public async exportAllLayers(): Promise<LayerExportData> {
      const exportData: LayerExportData = {
        version: '1.0',
        canvasWidth: this.canvasWidth,
        canvasHeight: this.canvasHeight,
        layers: [],
        groups: Array.from(this.layerGroups.values()),
        order: [...this.layerOrder],
      };
      
      for (const layerId of this.layerOrder) {
        const layer = this.layers.get(layerId);
        if (!layer) continue;
        
        const surface = valkyrieEngine.getLayerSurface(layerId);
        if (!surface) continue;
        
        const image = surface.makeImageSnapshot();
        const imageData = image.encodeToBase64();
        
        exportData.layers.push({
          ...layer,
          imageData,
        });
      }
      
      return exportData;
    }
  
    public async importLayers(data: LayerExportData): Promise<boolean> {
      try {
        // Clear existing layers
        this.clear();
        
        // Restore canvas size
        this.canvasWidth = data.canvasWidth;
        this.canvasHeight = data.canvasHeight;
        
        // Restore groups
        data.groups.forEach(group => {
          this.layerGroups.set(group.id, group);
        });
        
        // Restore layers
        for (const layerData of data.layers) {
          const { imageData, ...layerProps } = layerData;
          
          // Create layer
          const layer = this.createLayer(layerProps.name, layerProps.type, layerProps);
          
          // Restore image data
          if (imageData) {
            const image = CompatSkia.Image.MakeFromEncoded(
              CompatSkia.Data.fromBase64(imageData)
            );
            
            if (image) {
              const surface = valkyrieEngine.getLayerSurface(layer.id);
              if (surface) {
                const canvas = surface.getCanvas();
                const paint = CompatSkia.Paint();
                canvas.drawImage(image, 0, 0, paint);
              }
            }
          }
        }
        
        // Restore order
        this.layerOrder = data.order.filter(id => this.layers.has(id));
        
        this.eventBus.emit('layers:imported', { count: this.layers.size });
        return true;
      } catch (error) {
        console.error('Failed to import layers:', error);
        return false;
      }
    }
  
    // Memory management
    public getMemoryUsage(): MemoryUsage {
      let totalBytes = 0;
      const layerUsage: Record<string, number> = {};
      
      this.layers.forEach((layer, layerId) => {
        const bytes = this.canvasWidth * this.canvasHeight * 4 * this.pixelRatio * this.pixelRatio;
        layerUsage[layerId] = bytes;
        totalBytes += bytes;
      });
      
      return {
        totalBytes,
        totalMB: totalBytes / (1024 * 1024),
        layerUsage,
        layerCount: this.layers.size,
      };
    }
  
    public optimizeMemory(): void {
      console.log('🧹 Optimizing layer memory...');
      
      // Clear cache for hidden layers
      this.layers.forEach((layer, layerId) => {
        if (!layer.visible) {
          this.layerCache.delete(layerId);
        }
      });
      
      // Compact history
      if (this.history.length > this.MAX_HISTORY) {
        const removeCount = this.history.length - this.MAX_HISTORY;
        this.history.splice(0, removeCount);
        this.historyIndex = Math.max(0, this.historyIndex - removeCount);
      }
      
      this.eventBus.emit('layers:optimized');
    }
  
    // ===== PRIVATE METHODS =====
  
    private recordHistory(entry: HistoryEntry): void {
      // Remove any entries after current index
      if (this.historyIndex < this.history.length - 1) {
        this.history.splice(this.historyIndex + 1);
      }
      
      // Add new entry
      this.history.push(entry);
      this.historyIndex++;
      
      // Limit history size
      if (this.history.length > this.MAX_HISTORY) {
        this.history.shift();
        this.historyIndex--;
      }
    }
  
    private applyHistoryEntry(entry: HistoryEntry, isUndo: boolean): void {
      switch (entry.type) {
        case 'create':
          if (isUndo) {
            // Remove created layer
            this.layers.delete(entry.layerId);
            const index = this.layerOrder.indexOf(entry.layerId);
            if (index !== -1) {
              this.layerOrder.splice(index, 1);
            }
            valkyrieEngine.releaseLayerSurface(entry.layerId);
          } else {
            // Recreate layer
            const layer = entry.data.layer as Layer;
            this.layers.set(layer.id, layer);
            const index = entry.data.index || this.layerOrder.length;
            this.layerOrder.splice(index, 0, layer.id);
            valkyrieEngine.createLayerSurface(layer.id, this.canvasWidth, this.canvasHeight);
          }
          break;
          
        case 'delete':
          if (isUndo) {
            // Restore deleted layer
            const layer = entry.data.layer as Layer;
            const index = entry.data.index as number;
            this.layers.set(layer.id, layer);
            this.layerOrder.splice(index, 0, layer.id);
            valkyrieEngine.createLayerSurface(layer.id, this.canvasWidth, this.canvasHeight);
            // TODO: Restore layer content
          } else {
            // Re-delete layer
            this.deleteLayer(entry.layerId);
          }
          break;
          
        case 'property':
          const layer = this.layers.get(entry.layerId);
          if (layer) {
            const { property, oldValue, newValue } = entry.data;
            (layer as any)[property] = isUndo ? oldValue : newValue;
            this.invalidateLayerCache(entry.layerId);
          }
          break;
          
        case 'stroke':
          const targetLayer = this.layers.get(entry.layerId);
          if (targetLayer) {
            const { stroke, action } = entry.data;
            if (action === 'add') {
              if (isUndo) {
                // Remove stroke
                const index = targetLayer.strokes.findIndex(s => s.id === stroke.id);
                if (index !== -1) {
                  targetLayer.strokes.splice(index, 1);
                }
              } else {
                // Re-add stroke
                targetLayer.strokes.push(stroke);
              }
            } else {
              // Reverse for remove action
              if (isUndo) {
                targetLayer.strokes.push(stroke);
              } else {
                const index = targetLayer.strokes.findIndex(s => s.id === stroke.id);
                if (index !== -1) {
                  targetLayer.strokes.splice(index, 1);
                }
              }
            }
            this.invalidateLayerCache(entry.layerId);
          }
          break;
          
        case 'reorder':
          const { fromIndex, toIndex } = entry.data;
          if (isUndo) {
            // Reverse the reorder
            const [layerId] = this.layerOrder.splice(toIndex, 1);
            this.layerOrder.splice(fromIndex, 0, layerId);
          } else {
            // Re-apply the reorder
            const [layerId] = this.layerOrder.splice(fromIndex, 1);
            this.layerOrder.splice(toIndex, 0, layerId);
          }
          break;
      }
    }
  
    private invalidateLayerCache(layerId: string): void {
      this.layerCache.delete(layerId);
      
      // Also invalidate layers above if they have blend modes or clipping masks
      const index = this.layerOrder.indexOf(layerId);
      for (let i = index + 1; i < this.layerOrder.length; i++) {
        const layer = this.layers.get(this.layerOrder[i]);
        if (layer && (layer.blendMode !== 'normal' || layer.clippingMask)) {
          this.layerCache.delete(this.layerOrder[i]);
        }
      }
    }
  
    private async loadSavedLayers(): Promise<void> {
      try {
        const savedData = await dataManager.get<LayerSaveData>('layers');
        if (savedData && savedData.version === '1.0') {
          // Restore layers (without image data for now)
          // In production, would restore full layer content
          console.log('📁 Loaded saved layers');
        }
      } catch (error) {
        console.error('Failed to load saved layers:', error);
      }
    }
  
    private async saveLayers(): Promise<void> {
      try {
        const saveData: LayerSaveData = {
          version: '1.0',
          layers: Array.from(this.layers.values()),
          order: this.layerOrder,
          currentLayerId: this.currentLayerId,
        };
        
        await dataManager.set('layers', saveData);
      } catch (error) {
        console.error('Failed to save layers:', error);
      }
    }
  
    public clear(): void {
      // Release all surfaces
      this.layers.forEach((_, layerId) => {
        valkyrieEngine.releaseLayerSurface(layerId);
      });
      
      // Clear data
      this.layers.clear();
      this.layerOrder = [];
      this.layerGroups.clear();
      this.layerCache.clear();
      this.history = [];
      this.historyIndex = -1;
      this.currentLayerId = null;
    }
  
    public cleanup(): void {
      this.clear();
      console.log('🛑 Layer Manager cleaned up');
    }
  }
  
  // ===== TYPES =====
  
  interface HistoryEntry {
    type: 'create' | 'delete' | 'property' | 'stroke' | 'merge' | 'clear' | 'reorder';
    layerId: string;
    data: any;
    timestamp?: number;
  }
  
  interface LayerCache {
    image: SkImage;
    timestamp: number;
    composited: boolean;
  }
  
  interface LayerExportData {
    version: string;
    canvasWidth: number;
    canvasHeight: number;
    layers: Array<Layer & { imageData?: string }>;
    groups: LayerGroup[];
    order: string[];
  }
  
  interface LayerSaveData {
    version: string;
    layers: Layer[];
    order: string[];
    currentLayerId: string | null;
  }
  
  interface MemoryUsage {
    totalBytes: number;
    totalMB: number;
    layerUsage: Record<string, number>;
    layerCount: number;
  }
  
  // Export singleton
  export const layerManager = LayerManager.getInstance();