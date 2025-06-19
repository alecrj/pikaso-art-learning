// app/(tabs)/draw.tsx - SIMPLIFIED VERSION TO PREVENT CRASHES
import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Conditionally import canvas components with error boundaries
let ProfessionalCanvas: any = null;
let DrawingTools: any = null;

try {
  // Try to import the canvas components
  const CanvasModule = require('../../src/engines/drawing/ProfessionalCanvas');
  ProfessionalCanvas = CanvasModule.ProfessionalCanvas || CanvasModule.default;
  
  const ToolsModule = require('../../src/components/Canvas/DrawingTools');
  DrawingTools = ToolsModule.DrawingTools || ToolsModule.default;
} catch (error) {
  console.warn('⚠️ Canvas components not available:', error);
}

// Simple fallback canvas for when Skia isn't available
const FallbackCanvas: React.FC<any> = ({ onReady }) => {
  useEffect(() => {
    // Simulate canvas ready after a delay
    setTimeout(() => {
      onReady?.();
    }, 500);
  }, [onReady]);

  return (
    <View style={styles.fallbackCanvas}>
      <Text style={styles.fallbackText}>🎨</Text>
      <Text style={styles.fallbackTitle}>Drawing Canvas</Text>
      <Text style={styles.fallbackSubtitle}>Professional drawing coming soon!</Text>
      <Text style={styles.fallbackInstruction}>
        The full Skia-powered drawing engine is being optimized for better performance.
      </Text>
    </View>
  );
};

// Simple fallback tools
const FallbackTools: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState('brush');
  const [brushSize, setBrushSize] = useState(10);
  const [color, setColor] = useState('#000000');

  const tools = [
    { id: 'brush', name: 'Brush', icon: '🖌️' },
    { id: 'eraser', name: 'Eraser', icon: '🧹' },
    { id: 'pan', name: 'Pan', icon: '✋' },
  ];

  const colors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00'];
  const sizes = [2, 5, 10, 20, 40];

  return (
    <View style={styles.fallbackTools}>
      {/* Tools */}
      <View style={styles.toolsSection}>
        <Text style={styles.sectionTitle}>Tools</Text>
        {tools.map(tool => (
          <TouchableOpacity
            key={tool.id}
            style={[
              styles.toolButton,
              selectedTool === tool.id && styles.toolButtonActive
            ]}
            onPress={() => setSelectedTool(tool.id)}
          >
            <Text style={styles.toolIcon}>{tool.icon}</Text>
            <Text style={styles.toolName}>{tool.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Colors */}
      <View style={styles.toolsSection}>
        <Text style={styles.sectionTitle}>Colors</Text>
        <View style={styles.colorGrid}>
          {colors.map(c => (
            <TouchableOpacity
              key={c}
              style={[
                styles.colorButton,
                { backgroundColor: c },
                color === c && styles.colorButtonActive
              ]}
              onPress={() => setColor(c)}
            />
          ))}
        </View>
      </View>

      {/* Sizes */}
      <View style={styles.toolsSection}>
        <Text style={styles.sectionTitle}>Size: {brushSize}</Text>
        <View style={styles.sizeGrid}>
          {sizes.map(size => (
            <TouchableOpacity
              key={size}
              style={[
                styles.sizeButton,
                brushSize === size && styles.sizeButtonActive
              ]}
              onPress={() => setBrushSize(size)}
            >
              <View style={[styles.sizePreview, { width: size, height: size }]} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

export default function DrawScreen() {
  const canvasRef = useRef(null);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [useSkia, setUseSkia] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if we can use the Skia canvas
    const checkSkiaAvailability = () => {
      try {
        if (ProfessionalCanvas && DrawingTools) {
          console.log('✅ Skia canvas components available');
          setUseSkia(true);
        } else {
          console.log('⚠️ Using fallback canvas');
          setUseSkia(false);
        }
      } catch (err) {
        console.error('❌ Error checking Skia availability:', err);
        setError('Canvas initialization failed');
        setUseSkia(false);
      }
    };

    checkSkiaAvailability();
  }, []);

  const handleCanvasReady = () => {
    setIsCanvasReady(true);
    console.log('✅ Canvas ready for drawing');
  };

  const handleError = (error: any) => {
    console.error('❌ Canvas error:', error);
    setError('Drawing canvas encountered an error');
    setUseSkia(false);
  };

  const retrySkiaCanvas = () => {
    setError(null);
    setUseSkia(true);
    setIsCanvasReady(false);
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Drawing Engine Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={retrySkiaCanvas}>
            <Text style={styles.retryButtonText}>Try Skia Canvas</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.retryButton, styles.fallbackButton]} 
            onPress={() => {
              setError(null);
              setUseSkia(false);
            }}
          >
            <Text style={styles.retryButtonText}>Use Simple Canvas</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.canvasContainer}>
        {useSkia && ProfessionalCanvas ? (
          <ErrorBoundary onError={handleError}>
            <ProfessionalCanvas
              ref={canvasRef}
              onReady={handleCanvasReady}
              settings={{
                pressureSensitivity: 1.0,
                tiltSensitivity: 1.0,
                smoothing: 0.5,
                predictiveStroke: true,
                palmRejection: true,
              }}
            />
          </ErrorBoundary>
        ) : (
          <FallbackCanvas onReady={handleCanvasReady} />
        )}
      </View>
      
      {isCanvasReady && (
        <View style={styles.toolsContainer}>
          {useSkia && DrawingTools ? (
            <ErrorBoundary onError={() => console.warn('Tools error, using fallback')}>
              <DrawingTools />
            </ErrorBoundary>
          ) : (
            <FallbackTools />
          )}
        </View>
      )}
      
      {/* Canvas Type Indicator */}
      <View style={styles.canvasTypeIndicator}>
        <Text style={styles.canvasTypeText}>
          {useSkia ? '🚀 Skia Canvas' : '🎨 Simple Canvas'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

// Simple Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: any) => void },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('🚨 Error Boundary caught an error:', error, errorInfo);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorBoundary}>
          <Text style={styles.errorBoundaryText}>Component crashed</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  canvasContainer: {
    flex: 1,
  },
  toolsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  
  // Fallback Canvas Styles
  fallbackCanvas: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 40,
  },
  fallbackText: {
    fontSize: 64,
    marginBottom: 20,
  },
  fallbackTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  fallbackSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  fallbackInstruction: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Fallback Tools Styles
  fallbackTools: {
    position: 'absolute',
    left: 20,
    top: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  toolsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  toolButtonActive: {
    backgroundColor: '#007AFF20',
  },
  toolIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  toolName: {
    fontSize: 12,
    color: '#333',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    margin: 2,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  colorButtonActive: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  sizeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  sizeButton: {
    padding: 4,
    margin: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeButtonActive: {
    backgroundColor: '#007AFF20',
  },
  sizePreview: {
    backgroundColor: '#333',
    borderRadius: 10,
  },
  
  // Error Styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f5f5f5',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  fallbackButton: {
    backgroundColor: '#666',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorBoundary: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffebee',
  },
  errorBoundaryText: {
    color: '#c62828',
    fontSize: 16,
  },
  
  // Canvas Type Indicator
  canvasTypeIndicator: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  canvasTypeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});