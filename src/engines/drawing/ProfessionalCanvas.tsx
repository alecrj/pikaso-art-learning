// src/engines/drawing/ProfessionalCanvas.tsx
// FIXED VERSION - Correct imports for Skia

import React, { useRef, useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import {
  Canvas,
  useCanvasRef,
  Path,
  Paint,
  TouchInfo,
  useTouchHandler,
  Skia,
  useValue,
  useComputedValue,
  Group,
} from '@shopify/react-native-skia';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

interface ProfessionalCanvasProps {
  width?: number;
  height?: number;
  onStrokeAdded?: (stroke: any) => void;
  onDrawingStateChange?: (isDrawing: boolean) => void;
  disabled?: boolean;
  currentTool?: 'brush' | 'eraser';
  currentColor?: { hex: string };
  brushSize?: number;
  opacity?: number;
  showDebugInfo?: boolean;
  style?: any;
}

export const ProfessionalCanvas: React.FC<ProfessionalCanvasProps> = ({
  width: propWidth,
  height: propHeight,
  onStrokeAdded,
  onDrawingStateChange,
  disabled = false,
  currentTool = 'brush',
  currentColor = { hex: '#000000' },
  brushSize = 10,
  opacity = 1,
  showDebugInfo = false,
  style,
}) => {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const width = propWidth || screenWidth;
  const height = propHeight || screenHeight - 200;

  // Canvas state
  const [paths, setPaths] = useState<any[]>([]);
  const [currentPath, setCurrentPath] = useState<any[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Refs
  const canvasRef = useCanvasRef();
  const pathRef = useRef<any[]>([]);

  // Create paint
  const paint = useCallback(() => {
    const p = Skia.Paint();
    p.setColor(Skia.Color(currentColor.hex));
    p.setStyle(currentTool === 'eraser' ? 0 : 1); // 0 = Fill, 1 = Stroke
    p.setStrokeWidth(brushSize);
    p.setAlphaf(opacity);
    p.setAntiAlias(true);
    p.setStrokeCap(1); // Round
    p.setStrokeJoin(1); // Round
    return p;
  }, [currentColor, currentTool, brushSize, opacity]);

  // Touch handler
  const touchHandler = useTouchHandler({
    onStart: (touch: TouchInfo) => {
      if (disabled) return;
      
      runOnJS(() => {
        const newPath = [{ x: touch.x, y: touch.y }];
        pathRef.current = newPath;
        setCurrentPath(newPath);
        setIsDrawing(true);
        onDrawingStateChange?.(true);
      })();
    },
    
    onActive: (touch: TouchInfo) => {
      if (disabled || !isDrawing) return;
      
      runOnJS(() => {
        const updatedPath = [...pathRef.current, { x: touch.x, y: touch.y }];
        pathRef.current = updatedPath;
        setCurrentPath(updatedPath);
      })();
    },
    
    onEnd: () => {
      if (disabled || !isDrawing) return;
      
      runOnJS(() => {
        if (pathRef.current.length > 1) {
          const stroke = {
            path: pathRef.current,
            color: currentColor.hex,
            size: brushSize,
            tool: currentTool,
            opacity,
          };
          setPaths(prev => [...prev, stroke]);
          onStrokeAdded?.(stroke);
        }
        pathRef.current = [];
        setCurrentPath([]);
        setIsDrawing(false);
        onDrawingStateChange?.(false);
      })();
    },
  });

  // Create path from points
  const createPath = useCallback((points: any[]) => {
    if (points.length < 2) return null;
    
    const path = Skia.Path.Make();
    path.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const midX = (prev.x + curr.x) / 2;
      const midY = (prev.y + curr.y) / 2;
      path.quadTo(prev.x, prev.y, midX, midY);
    }
    
    return path;
  }, []);

  // Clear canvas
  const clear = useCallback(() => {
    setPaths([]);
    setCurrentPath([]);
  }, []);

  // Undo last stroke
  const undo = useCallback(() => {
    setPaths(prev => prev.slice(0, -1));
  }, []);

  // Expose methods
  useEffect(() => {
    if (canvasRef.current) {
      (canvasRef.current as any).clear = clear;
      (canvasRef.current as any).undo = undo;
    }
  }, [clear, undo]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[{ width, height, backgroundColor: '#FFFFFF' }, style]}>
        <Canvas
          ref={canvasRef}
          style={{ flex: 1 }}
          onTouch={touchHandler}
        >
          {/* Render completed strokes */}
          {paths.map((stroke, index) => {
            const path = createPath(stroke.path);
            if (!path) return null;
            
            const strokePaint = Skia.Paint();
            strokePaint.setColor(Skia.Color(stroke.color));
            strokePaint.setStrokeWidth(stroke.size);
            strokePaint.setAlphaf(stroke.opacity);
            strokePaint.setAntiAlias(true);
            strokePaint.setStyle(1); // Stroke
            strokePaint.setStrokeCap(1); // Round
            
            return (
              <Path
                key={index}
                path={path}
                paint={strokePaint}
              />
            );
          })}
          
          {/* Render current stroke */}
          {currentPath.length > 1 && (
            <Path
              path={createPath(currentPath)!}
              paint={paint()}
            />
          )}
        </Canvas>
        
        {/* Debug info */}
        {showDebugInfo && (
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>
              Strokes: {paths.length} | Drawing: {isDrawing ? 'Yes' : 'No'}
            </Text>
          </View>
        )}
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  debugInfo: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 8,
    borderRadius: 4,
  },
  debugText: {
    color: '#4CAF50',
    fontSize: 12,
  },
});

export default ProfessionalCanvas;