import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { 
  valkyrieEngine, 
  brushEngine, 
  layerManager, 
  colorManager,
  Tool,
  Brush,
  Color,
  Layer,
  Transform,
} from '../engines/drawing';
import { EventBus } from '../engines/core/EventBus';

interface DrawingContextValue {
  // Tools
  currentTool: Tool;
  setCurrentTool: (tool: Tool) => void;
  
  // Brushes
  currentBrush: Brush | null;
  setCurrentBrush: (brushId: string) => void;
  
  // Colors
  currentColor: Color;
  setCurrentColor: (color: Color) => void;
  
  // Layers
  layers: Layer[];
  currentLayer: Layer | null;
  createLayer: (name?: string) => Layer;
  deleteLayer: (layerId: string) => void;
  setCurrentLayer: (layerId: string) => void;
  
  // Transform
  canvasTransform: Transform;
  
  // Actions
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const DrawingContext = createContext<DrawingContextValue | undefined>(undefined);

export const DrawingProvider = ({ children }: { children: ReactNode }) => {
  const eventBus = EventBus.getInstance();
  
  const [currentTool, setCurrentTool] = useState<Tool>('brush');
  const [currentBrush, setCurrentBrush] = useState<Brush | null>(null);
  const [currentColor, setCurrentColor] = useState<Color>(colorManager.getCurrentColor());
  const [layers, setLayers] = useState<Layer[]>([]);
  const [currentLayer, setCurrentLayerState] = useState<Layer | null>(null);
  const [canvasTransform, setCanvasTransform] = useState<Transform>({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
  });
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    // Initialize brush
    brushEngine.setCurrentBrush('procreate-pencil');
    setCurrentBrush(brushEngine.getCurrentBrush());
    
    // Subscribe to events
    const unsubscribers = [
      eventBus.on('brush:selected', ({ brush }) => setCurrentBrush(brush)),
      eventBus.on('color:changed', ({ color }) => setCurrentColor(color)),
      eventBus.on('layers:changed', () => {
        setLayers(layerManager.getAllLayers());
        setCurrentLayerState(layerManager.getCurrentLayer());
      }),
      eventBus.on('layer:created', () => {
        setLayers(layerManager.getAllLayers());
      }),
      eventBus.on('layer:deleted', () => {
        setLayers(layerManager.getAllLayers());
      }),
      eventBus.on('layer:selected', () => {
        setCurrentLayerState(layerManager.getCurrentLayer());
      }),
      eventBus.on('transform:changed', ({ transform }) => {
        setCanvasTransform(transform);
      }),
      eventBus.on('history:undo', () => {
        setCanUndo(layerManager.canUndo());
        setCanRedo(layerManager.canRedo());
      }),
      eventBus.on('history:redo', () => {
        setCanUndo(layerManager.canUndo());
        setCanRedo(layerManager.canRedo());
      }),
    ];
    
    // Initial layer setup
    setLayers(layerManager.getAllLayers());
    setCurrentLayerState(layerManager.getCurrentLayer());
    
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  // FIXED: Memoize all callback functions to prevent new references
  const handleSetCurrentTool = useCallback((tool: Tool) => {
    setCurrentTool(tool);
    eventBus.emit('tool:changed', { tool });
  }, []);

  const handleSetCurrentBrush = useCallback((brushId: string) => {
    brushEngine.setCurrentBrush(brushId);
  }, []);

  const handleSetCurrentColor = useCallback((color: Color) => {
    colorManager.setColor(color);
  }, []);

  const handleCreateLayer = useCallback((name?: string) => {
    const layer = layerManager.createLayer(name);
    return layer;
  }, []);

  const handleDeleteLayer = useCallback((layerId: string) => {
    layerManager.deleteLayer(layerId);
  }, []);

  const handleSetCurrentLayer = useCallback((layerId: string) => {
    layerManager.setCurrentLayer(layerId);
  }, []);

  const handleUndo = useCallback(() => {
    layerManager.undo();
  }, []);

  const handleRedo = useCallback(() => {
    layerManager.redo();
  }, []);

  // FIXED: Memoize the entire context value to prevent infinite re-renders
  const value = useMemo<DrawingContextValue>(() => ({
    currentTool,
    setCurrentTool: handleSetCurrentTool,
    currentBrush,
    setCurrentBrush: handleSetCurrentBrush,
    currentColor,
    setCurrentColor: handleSetCurrentColor,
    layers,
    currentLayer,
    createLayer: handleCreateLayer,
    deleteLayer: handleDeleteLayer,
    setCurrentLayer: handleSetCurrentLayer,
    canvasTransform,
    undo: handleUndo,
    redo: handleRedo,
    canUndo,
    canRedo,
  }), [
    currentTool,
    handleSetCurrentTool,
    currentBrush,
    handleSetCurrentBrush,
    currentColor,
    handleSetCurrentColor,
    layers,
    currentLayer,
    handleCreateLayer,
    handleDeleteLayer,
    handleSetCurrentLayer,
    canvasTransform,
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
  ]);

  return <DrawingContext.Provider value={value}>{children}</DrawingContext.Provider>;
};

export const useDrawing = () => {
  const context = useContext(DrawingContext);
  if (!context) {
    throw new Error('useDrawing must be used within a DrawingProvider');
  }
  return context;
};