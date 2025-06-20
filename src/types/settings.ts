// src/types/settings.ts - ENTERPRISE GRADE APP SETTINGS

/**
 * UNIFIED APP SETTINGS INTERFACE
 * 
 * ✅ FEATURES:
 * - Single, extensible settings schema
 * - Version migration support
 * - Comprehensive type safety
 * - Backwards compatibility
 * - Enterprise-level configuration management
 */

// Enable index signature for dynamic property access
export interface AppSettings {
    // Index signature for dynamic access
    [key: string]: any;
  
    // ===== METADATA =====
    version: number;
    lastUpdated: number;
    
    // ===== APPEARANCE =====
    theme: 'auto' | 'light' | 'dark';
    
    // ===== NOTIFICATIONS =====
    notifications: {
      enabled: boolean;
      dailyReminder: boolean;
      achievementAlerts: boolean;
      challengeAlerts: boolean;
      reminderTime: string;
      lessons: boolean;
      achievements: boolean;
      social: boolean;
      challenges: boolean;
      lessonCompletions?: boolean;
      achievementUnlocks?: boolean;
      socialActivity?: boolean;
    };
    
    // ===== DRAWING SETTINGS =====
    drawing: {
      pressureSensitivity: number;
      smoothing: number;
      autosave: boolean;
      hapticFeedback: boolean;
      defaultBrush?: string;
      palmRejection?: boolean;
      leftHanded?: boolean;
      smoothingLevel?: number;
      maxUndoHistory?: number;
      canvasResolution?: 'standard' | 'high' | 'ultra';
      antiAliasing?: boolean;
    };
    
    // ===== LEARNING SETTINGS =====
    learning: {
      dailyGoal: number;
      reminderTime: string;
      difficulty: 'easy' | 'adaptive' | 'hard';
      skipIntroVideos?: boolean;
      autoAdvance?: boolean;
      practiceMode?: 'guided' | 'free' | 'mixed';
    };
    
    // ===== PRIVACY SETTINGS =====
    privacy: {
      profileVisibility: 'public' | 'friends' | 'private';
      shareArtwork: boolean;
      shareProgress: boolean;
      allowComments: boolean;
      analyticsOptIn: boolean;
      showProgress?: boolean;
      allowMessages?: boolean;
      portfolioVisibility?: 'public' | 'friends' | 'private';
    };
    
    // ===== ACCESSIBILITY =====
    accessibility: {
      fontSize: 'small' | 'medium' | 'large' | 'extra-large';
      highContrast: boolean;
      reducedMotion: boolean;
      screenReader: boolean;
      colorBlindSupport: 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';
    };
    
    // ===== PERFORMANCE =====
    performance?: {
      enableGPUAcceleration: boolean;
      frameRateLimit: 30 | 60 | 120;
      memoryOptimization: 'low' | 'balanced' | 'high';
      backgroundProcessing: boolean;
    };
    
    // ===== EXPERIMENTAL =====
    experimental?: {
      betaFeatures: boolean;
      aiAssistance: boolean;
      cloudSync: boolean;
      collaborativeDrawing: boolean;
    };
  }
  
  /**
   * DEFAULT SETTINGS CONFIGURATION
   * Enterprise pattern: Comprehensive defaults with sensible values
   */
  export const DEFAULT_APP_SETTINGS: AppSettings = {
    version: 1,
    lastUpdated: Date.now(),
    
    theme: 'auto',
    
    notifications: {
      enabled: true,
      dailyReminder: true,
      achievementAlerts: true,
      challengeAlerts: true,
      reminderTime: '19:00',
      lessons: true,
      achievements: true,
      social: true,
      challenges: true,
      lessonCompletions: true,
      achievementUnlocks: true,
      socialActivity: true,
    },
    
    drawing: {
      pressureSensitivity: 0.8,
      smoothing: 0.5,
      autosave: true,
      hapticFeedback: true,
      defaultBrush: 'round',
      palmRejection: true,
      leftHanded: false,
      smoothingLevel: 0.5,
      maxUndoHistory: 50,
      canvasResolution: 'high',
      antiAliasing: true,
    },
    
    learning: {
      dailyGoal: 1,
      reminderTime: '19:00',
      difficulty: 'adaptive',
      skipIntroVideos: false,
      autoAdvance: false,
      practiceMode: 'guided',
    },
    
    privacy: {
      profileVisibility: 'public',
      shareArtwork: true,
      shareProgress: true,
      allowComments: true,
      analyticsOptIn: true,
      showProgress: true,
      allowMessages: true,
      portfolioVisibility: 'public',
    },
    
    accessibility: {
      fontSize: 'medium',
      highContrast: false,
      reducedMotion: false,
      screenReader: false,
      colorBlindSupport: 'none',
    },
    
    performance: {
      enableGPUAcceleration: true,
      frameRateLimit: 60,
      memoryOptimization: 'balanced',
      backgroundProcessing: true,
    },
    
    experimental: {
      betaFeatures: false,
      aiAssistance: false,
      cloudSync: false,
      collaborativeDrawing: false,
    },
  };
  
  /**
   * Type-safe deep merge utility for settings
   */
  export function deepMergeSettings(target: any, source: any): AppSettings {
    const result = { ...target };
    
    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMergeSettings(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    });
    
    return result;
  }
  
  /**
   * SETTINGS MIGRATION SYSTEM
   * Enterprise pattern: Handle settings evolution over time
   */
  export class SettingsMigrator {
    public static migrateSettings(settings: any): AppSettings {
      if (!settings) {
        return { ...DEFAULT_APP_SETTINGS };
      }
  
      const version = settings.version || 0;
      let migratedSettings = { ...settings };
  
      // Migration from version 0 to 1
      if (version < 1) {
        migratedSettings = this.migrateV0ToV1(migratedSettings);
      }
  
      // Future migrations would go here
      // if (version < 2) { migratedSettings = this.migrateV1ToV2(migratedSettings); }
  
      // Ensure all required fields exist
      migratedSettings = this.ensureRequiredFields(migratedSettings);
  
      return migratedSettings;
    }
  
    private static migrateV0ToV1(oldSettings: any): AppSettings {
      const newSettings: AppSettings = { ...DEFAULT_APP_SETTINGS };
  
      // Migrate theme settings
      if (oldSettings.theme) {
        newSettings.theme = oldSettings.theme;
      }
  
      // Migrate notification settings
      if (oldSettings.notifications) {
        newSettings.notifications = {
          ...newSettings.notifications,
          ...oldSettings.notifications,
        };
      }
  
      // Migrate drawing settings
      if (oldSettings.drawing) {
        newSettings.drawing = {
          ...newSettings.drawing,
          ...oldSettings.drawing,
        };
      }
  
      // Migrate learning settings
      if (oldSettings.learning) {
        newSettings.learning = {
          ...newSettings.learning,
          ...oldSettings.learning,
        };
      }
  
      // Migrate privacy settings
      if (oldSettings.privacy) {
        newSettings.privacy = {
          ...newSettings.privacy,
          ...oldSettings.privacy,
        };
      }
  
      // Migrate accessibility settings
      if (oldSettings.accessibility) {
        newSettings.accessibility = {
          ...newSettings.accessibility,
          ...oldSettings.accessibility,
        };
      }
  
      newSettings.version = 1;
      newSettings.lastUpdated = Date.now();
  
      return newSettings;
    }
  
    private static ensureRequiredFields(settings: any): AppSettings {
      return deepMergeSettings(DEFAULT_APP_SETTINGS, settings);
    }
  }
  
  /**
   * SETTINGS VALIDATION
   * Enterprise pattern: Validate settings to prevent runtime errors
   */
  export class SettingsValidator {
    public static validateSettings(settings: AppSettings): {
      isValid: boolean;
      errors: string[];
      warnings: string[];
    } {
      const errors: string[] = [];
      const warnings: string[] = [];
  
      // Validate theme
      if (!['auto', 'light', 'dark'].includes(settings.theme)) {
        errors.push(`Invalid theme: ${settings.theme}`);
      }
  
      // Validate drawing settings
      if (settings.drawing.pressureSensitivity < 0 || settings.drawing.pressureSensitivity > 1) {
        errors.push('Pressure sensitivity must be between 0 and 1');
      }
  
      if (settings.drawing.smoothing < 0 || settings.drawing.smoothing > 1) {
        errors.push('Smoothing must be between 0 and 1');
      }
  
      // Validate learning settings
      if (settings.learning.dailyGoal < 1 || settings.learning.dailyGoal > 10) {
        errors.push('Daily goal must be between 1 and 10');
      }
  
      // Validate reminder time format
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(settings.learning.reminderTime)) {
        errors.push('Reminder time must be in HH:MM format');
      }
  
      // Performance warnings
      if (settings.performance?.frameRateLimit === 120 && settings.performance?.enableGPUAcceleration === false) {
        warnings.push('High frame rate without GPU acceleration may impact performance');
      }
  
      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    }
  }
  
  // Type exports
  export type ThemeMode = AppSettings['theme'];
  export type DifficultyLevel = AppSettings['learning']['difficulty'];
  export type CanvasResolution = NonNullable<AppSettings['drawing']['canvasResolution']>;
  export type FontSize = AppSettings['accessibility']['fontSize'];
  export type ColorBlindSupport = AppSettings['accessibility']['colorBlindSupport'];