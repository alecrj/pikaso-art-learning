// src/utils/responsive.ts - FAANG Grade Responsive System

import { Dimensions, Platform } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Device detection
export const DeviceInfo = {
  isIPhone: screenWidth < 768,
  isIPad: screenWidth >= 768,
  isSmallPhone: screenWidth < 375,
  isProMax: screenWidth >= 428,
  
  // Specific models
  isIPhoneSE: screenWidth === 375 && screenHeight === 667,
  isIPhone12Mini: screenWidth === 375 && screenHeight === 812,
  isIPadPro12: screenWidth >= 1024,
  
  // Feature detection
  hasNotch: screenHeight >= 812 && Platform.OS === 'ios',
  
  // Orientation
  isLandscape: screenWidth > screenHeight,
  isPortrait: screenHeight > screenWidth,
};

// Responsive sizing
export const responsive = {
  // Font sizes
  fontSize: {
    tiny: DeviceInfo.isIPhone ? 10 : 12,
    small: DeviceInfo.isIPhone ? 12 : 14,
    regular: DeviceInfo.isIPhone ? 14 : 16,
    medium: DeviceInfo.isIPhone ? 16 : 18,
    large: DeviceInfo.isIPhone ? 20 : 24,
    xlarge: DeviceInfo.isIPhone ? 24 : 32,
    huge: DeviceInfo.isIPhone ? 32 : 48,
  },
  
  // Spacing
  spacing: {
    xs: DeviceInfo.isIPhone ? 4 : 8,
    sm: DeviceInfo.isIPhone ? 8 : 12,
    md: DeviceInfo.isIPhone ? 12 : 16,
    lg: DeviceInfo.isIPhone ? 16 : 24,
    xl: DeviceInfo.isIPhone ? 24 : 32,
    xxl: DeviceInfo.isIPhone ? 32 : 48,
  },
  
  // Canvas sizes
  canvas: {
    width: DeviceInfo.isIPhone ? screenWidth - 32 : Math.min(screenWidth - 48, 800),
    height: DeviceInfo.isIPhone ? 250 : 400,
    
    // Lesson canvas
    lessonHeight: DeviceInfo.isIPhone ? 200 : 300,
    
    // Free draw canvas
    freeDrawHeight: DeviceInfo.isIPhone 
      ? screenHeight - 200 // Leave room for tools
      : screenHeight - 250,
  },
  
  // Button sizes
  button: {
    height: DeviceInfo.isIPhone ? 44 : 56,
    minWidth: DeviceInfo.isIPhone ? 64 : 80,
    padding: DeviceInfo.isIPhone ? 12 : 16,
  },
  
  // Grid layouts
  grid: {
    columns: DeviceInfo.isIPhone ? 2 : 3,
    gap: DeviceInfo.isIPhone ? 8 : 16,
  },
};

// Scaling functions
export const scale = (size: number): number => {
  const baseWidth = DeviceInfo.isIPhone ? 375 : 768; // iPhone 11 / iPad base
  const factor = screenWidth / baseWidth;
  return Math.round(size * factor);
};

export const moderateScale = (size: number, factor = 0.5): number => {
  return size + (scale(size) - size) * factor;
};

// Layout helpers
export const getCanvasSize = () => ({
  width: DeviceInfo.isIPhone ? screenWidth - 32 : Math.min(screenWidth - 64, 800),
  height: DeviceInfo.isIPhone ? 250 : 400,
});

export const getHeaderHeight = () => {
  if (DeviceInfo.hasNotch) return 88;
  if (DeviceInfo.isIPad) return 64;
  return 44;
};

export const getTabBarHeight = () => {
  if (DeviceInfo.hasNotch) return 83;
  if (DeviceInfo.isIPad) return 65;
  return 49;
};

// Style helpers
export const adaptiveStyles = {
  container: {
    padding: responsive.spacing.md,
    paddingTop: DeviceInfo.hasNotch ? responsive.spacing.xl : responsive.spacing.md,
  },
  
  title: {
    fontSize: responsive.fontSize.xlarge,
    fontWeight: DeviceInfo.isIPad ? '700' : '600',
  },
  
  button: {
    height: responsive.button.height,
    paddingHorizontal: responsive.button.padding,
    minWidth: responsive.button.minWidth,
  },
  
  card: {
    padding: responsive.spacing.md,
    borderRadius: DeviceInfo.isIPhone ? 12 : 16,
    marginBottom: responsive.spacing.sm,
  },
};

// Export all utilities
export default {
  DeviceInfo,
  responsive,
  scale,
  moderateScale,
  getCanvasSize,
  getHeaderHeight,
  getTabBarHeight,
  adaptiveStyles,
};