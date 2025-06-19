// src/engines/core/DataManager.ts - COMPLETE COMMERCIAL GRADE VERSION

import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, LearningProgress, Portfolio, LessonCompletionData } from '../../types';

interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    enabled: boolean;
    dailyReminder: boolean;
    achievementAlerts: boolean;
    challengeAlerts: boolean;
    reminderTime: string; // HH:MM format
  };
  drawing: {
    defaultBrush: string;
    pressureSensitivity: number;
    smoothingLevel: number;
    palmRejection: boolean;
    leftHanded: boolean;
  };
  learning: {
    dailyGoalMinutes: number;
    autoplayVideos: boolean;
    showHints: boolean;
    practiceMode: 'guided' | 'freeform';
  };
  privacy: {
    publicProfile: boolean;
    showProgress: boolean;
    allowMessages: boolean;
    shareAnalytics: boolean;
  };
  accessibility: {
    fontSize: 'small' | 'medium' | 'large';
    highContrast: boolean;
    reducedMotion: boolean;
    voiceoverOptimized: boolean;
  };
}

/**
 * Enhanced Data Manager with all required methods for contexts and engines
 * FIXED: Added missing methods and improved type safety
 */
class DataManager {
  private static instance: DataManager;
  private cache: Map<string, any> = new Map();
  private writeQueue: Map<string, Promise<void>> = new Map();

  private constructor() {}

  public static getInstance(): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager();
    }
    return DataManager.instance;
  }

  // ---- GENERIC STORAGE METHODS ----

  public async get<T = any>(key: string): Promise<T | null> {
    try {
      // Check cache first
      if (this.cache.has(key)) {
        return this.cache.get(key);
      }

      const value = await AsyncStorage.getItem(key);
      if (value === null) return null;

      const parsed = JSON.parse(value);

      // Cache the result
      this.cache.set(key, parsed);

      return parsed;
    } catch (error) {
      console.error(`Failed to get data for key ${key}:`, error);
      return null;
    }
  }

  public async set<T = any>(key: string, value: T): Promise<void> {
    try {
      // Wait for any pending write for this key
      if (this.writeQueue.has(key)) {
        await this.writeQueue.get(key);
      }

      // Create write promise
      const writePromise = this.performWrite(key, value);
      this.writeQueue.set(key, writePromise);

      await writePromise;

      // Update cache
      this.cache.set(key, value);

      // Clear from queue
      this.writeQueue.delete(key);
    } catch (error) {
      console.error(`Failed to set data for key ${key}:`, error);
      this.writeQueue.delete(key);
      throw error;
    }
  }

  // FIXED: Added save method as alias for set (for backward compatibility)
  public async save<T = any>(key: string, value: T): Promise<void> {
    return this.set(key, value);
  }

  private async performWrite<T>(key: string, value: T): Promise<void> {
    const serialized = JSON.stringify(value);
    await AsyncStorage.setItem(key, serialized);
  }

  public async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
      this.cache.delete(key);
    } catch (error) {
      console.error(`Failed to remove data for key ${key}:`, error);
      throw error;
    }
  }

  public async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
      this.cache.clear();
      this.writeQueue.clear();
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw error;
    }
  }

  // ---- APP SETTINGS METHODS (FIXED: Added missing methods) ----

  public async getAppSettings(): Promise<AppSettings> {
    const saved = await this.get<AppSettings>('app_settings');
    return saved || this.getDefaultAppSettings();
  }

  public async saveAppSettings(settings: AppSettings): Promise<void> {
    await this.set('app_settings', settings);
    
    // Emit settings changed event for real-time updates
    if (typeof window !== 'undefined' && (window as any).eventBus) {
      (window as any).eventBus.emit('settings:changed', settings);
    }
  }

  public async updateAppSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getAppSettings();
    const updated = this.deepMerge(current, updates) as AppSettings;
    await this.saveAppSettings(updated);
    return updated;
  }

  private getDefaultAppSettings(): AppSettings {
    return {
      theme: 'auto',
      notifications: {
        enabled: true,
        dailyReminder: true,
        achievementAlerts: true,
        challengeAlerts: true,
        reminderTime: '19:00',
      },
      drawing: {
        defaultBrush: 'pencil',
        pressureSensitivity: 0.8,
        smoothingLevel: 0.5,
        palmRejection: true,
        leftHanded: false,
      },
      learning: {
        dailyGoalMinutes: 15,
        autoplayVideos: true,
        showHints: true,
        practiceMode: 'guided',
      },
      privacy: {
        publicProfile: true,
        showProgress: true,
        allowMessages: true,
        shareAnalytics: true,
      },
      accessibility: {
        fontSize: 'medium',
        highContrast: false,
        reducedMotion: false,
        voiceoverOptimized: false,
      },
    };
  }

  // ---- DATA EXPORT METHODS (FIXED: Added missing method) ----

  public async exportAllData(): Promise<{
    exportDate: number;
    version: string;
    data: {
      profile: UserProfile | null;
      settings: AppSettings;
      progress: LearningProgress | null;
      portfolio: any;
      achievements: string[];
      completedLessons: string[];
      challenges: any;
      analytics: any[];
    };
  }> {
    try {
      console.log('📦 Starting complete data export...');

      const [
        profile,
        settings,
        progress,
        portfolios,
        achievements,
        completedLessons,
        challenges,
        analytics,
      ] = await Promise.all([
        this.getUserProfile(),
        this.getAppSettings(),
        this.getLearningProgress(),
        this.get<any>('portfolios'),
        this.getUnlockedAchievements(),
        this.getCompletedLessons(),
        this.getChallengeData(),
        this.getAnalyticsEvents(100), // Last 100 events
      ]);

      const exportData = {
        exportDate: Date.now(),
        version: '1.0.0',
        data: {
          profile,
          settings,
          progress,
          portfolio: portfolios || {},
          achievements,
          completedLessons,
          challenges,
          analytics,
        },
      };

      console.log('✅ Data export complete');
      return exportData;
    } catch (error) {
      console.error('❌ Data export failed:', error);
      throw error;
    }
  }

  public async importData(importData: any): Promise<void> {
    try {
      console.log('📥 Starting data import...');

      if (!importData || !importData.data) {
        throw new Error('Invalid import data format');
      }

      const { data } = importData;

      // Import in order of dependency
      if (data.profile) {
        await this.saveUserProfile(data.profile);
      }

      if (data.settings) {
        await this.saveAppSettings(data.settings);
      }

      if (data.progress) {
        await this.saveLearningProgress(data.progress);
      }

      if (data.portfolio) {
        await this.set('portfolios', data.portfolio);
      }

      if (data.achievements && Array.isArray(data.achievements)) {
        await this.set('unlocked_achievements', data.achievements);
      }

      if (data.completedLessons && Array.isArray(data.completedLessons)) {
        await this.set('completed_lessons', data.completedLessons);
      }

      if (data.challenges) {
        await this.saveChallengeData(data.challenges);
      }

      console.log('✅ Data import complete');
    } catch (error) {
      console.error('❌ Data import failed:', error);
      throw error;
    }
  }

  // ---- USER PROFILE METHODS ----

  public async getUserProfile(): Promise<UserProfile | null> {
    return this.get<UserProfile>('user_profile');
  }

  public async saveUserProfile(profile: UserProfile): Promise<void> {
    return this.set('user_profile', profile);
  }

  public async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      const currentProfile = await this.getUserProfile();
      if (!currentProfile) return null;

      const updatedProfile = { ...currentProfile, ...updates };
      await this.saveUserProfile(updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error('Failed to update user profile:', error);
      return null;
    }
  }

  // ---- LEARNING PROGRESS METHODS ----

  public async getLearningProgress(): Promise<LearningProgress | null> {
    return this.get<LearningProgress>('learning_progress');
  }

  public async saveLearningProgress(progress: LearningProgress): Promise<void> {
    return this.set('learning_progress', progress);
  }

  public async updateLearningProgress(updates: Partial<LearningProgress>): Promise<LearningProgress | null> {
    try {
      const currentProgress = await this.getLearningProgress();
      if (!currentProgress) return null;

      const updatedProgress = { ...currentProgress, ...updates };
      await this.saveLearningProgress(updatedProgress);
      return updatedProgress;
    } catch (error) {
      console.error('Failed to update learning progress:', error);
      return null;
    }
  }

  // ---- LESSON COMPLETION METHODS ----

  public async getCompletedLessons(): Promise<string[]> {
    const lessons = await this.get<string[]>('completed_lessons');
    return lessons || [];
  }

  public async addCompletedLesson(lessonId: string): Promise<void> {
    try {
      const completed = await this.getCompletedLessons();
      if (!completed.includes(lessonId)) {
        completed.push(lessonId);
        await this.set('completed_lessons', completed);
      }
    } catch (error) {
      console.error('Failed to add completed lesson:', error);
      throw error;
    }
  }

  public async saveLessonCompletion(completionData: LessonCompletionData): Promise<void> {
    try {
      console.log('💾 Saving lesson completion:', completionData);
      
      // Save to lesson completions array
      const completions = await this.get<LessonCompletionData[]>('lesson_completions') || [];
      
      // Remove any existing completion for this lesson
      const filteredCompletions = completions.filter(c => c.lessonId !== completionData.lessonId);
      filteredCompletions.push(completionData);
      
      await this.set('lesson_completions', filteredCompletions);
      
      // Also add to completed lessons list
      await this.addCompletedLesson(completionData.lessonId);
      
      // Update lesson progress to 100%
      await this.setLessonProgress(completionData.lessonId, 100);
      
      console.log('✅ Lesson completion saved successfully');
      
    } catch (error) {
      console.error('❌ Failed to save lesson completion:', error);
      throw error;
    }
  }

  public async getLessonProgress(lessonId: string): Promise<number> {
    try {
      const progress = await this.get<Record<string, number>>('lesson_progress') || {};
      return progress[lessonId] || 0;
    } catch (error) {
      console.error('Failed to get lesson progress:', error);
      return 0;
    }
  }

  public async setLessonProgress(lessonId: string, progress: number): Promise<void> {
    try {
      const allProgress = await this.get<Record<string, number>>('lesson_progress') || {};
      allProgress[lessonId] = progress;
      await this.set('lesson_progress', allProgress);
    } catch (error) {
      console.error('Failed to set lesson progress:', error);
      throw error;
    }
  }

  public async saveLessonProgress(lessonProgress: { lessonId: string; contentProgress: number }): Promise<void> {
    return this.setLessonProgress(lessonProgress.lessonId, lessonProgress.contentProgress);
  }

  // FIXED: Type safety for lesson completions
  public async getLessonCompletions(): Promise<LessonCompletionData[]> {
    const completions = await this.get<LessonCompletionData[]>('lesson_completions');
    return completions || [];
  }

  public async getLessonCompletion(lessonId: string): Promise<LessonCompletionData | null> {
    try {
      const completions = await this.getLessonCompletions();
      return completions.find(c => c.lessonId === lessonId) || null;
    } catch (error) {
      console.error('Failed to get lesson completion:', error);
      return null;
    }
  }

  // ---- PORTFOLIO METHODS ----

  public async getPortfolio(userId: string): Promise<Portfolio | null> {
    return this.get<Portfolio>(`portfolio_${userId}`);
  }

  public async savePortfolio(portfolio: Portfolio): Promise<void> {
    return this.set(`portfolio_${portfolio.userId}`, portfolio);
  }

  public async updatePortfolio(userId: string, updates: Partial<Portfolio>): Promise<Portfolio | null> {
    try {
      const currentPortfolio = await this.getPortfolio(userId);
      if (!currentPortfolio) return null;

      const updatedPortfolio = { ...currentPortfolio, ...updates };
      await this.savePortfolio(updatedPortfolio);
      return updatedPortfolio;
    } catch (error) {
      console.error('Failed to update portfolio:', error);
      return null;
    }
  }

  public async addArtworkToPortfolio(userId: string, artwork: any): Promise<void> {
    try {
      const portfolio = await this.getPortfolio(userId);
      if (portfolio) {
        portfolio.artworks.push(artwork);
        await this.savePortfolio(portfolio);
      }
    } catch (error) {
      console.error('Failed to add artwork to portfolio:', error);
      throw error;
    }
  }

  // ---- DRAWING METHODS ----

  public async saveDrawing(drawingData: any): Promise<string> {
    try {
      const drawingId = `drawing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await this.set(`drawing_${drawingId}`, drawingData);
      
      // Add to saved drawings list
      await this.addSavedDrawing(drawingId);
      
      return drawingId;
    } catch (error) {
      console.error('Failed to save drawing:', error);
      throw error;
    }
  }

  public async getDrawing(drawingId: string): Promise<any> {
    return this.get(`drawing_${drawingId}`);
  }

  public async getSavedDrawings(): Promise<string[]> {
    const drawings = await this.get<string[]>('saved_drawings');
    return drawings || [];
  }

  public async addSavedDrawing(drawingId: string): Promise<void> {
    try {
      const drawings = await this.getSavedDrawings();
      if (!drawings.includes(drawingId)) {
        drawings.push(drawingId);
        await this.set('saved_drawings', drawings);
      }
    } catch (error) {
      console.error('Failed to add saved drawing:', error);
      throw error;
    }
  }

  // ---- ACHIEVEMENT METHODS ----

  public async getUnlockedAchievements(): Promise<string[]> {
    const achievements = await this.get<string[]>('unlocked_achievements');
    return achievements || [];
  }

  public async unlockAchievement(achievementId: string): Promise<void> {
    try {
      const achievements = await this.getUnlockedAchievements();
      if (!achievements.includes(achievementId)) {
        achievements.push(achievementId);
        await this.set('unlocked_achievements', achievements);
      }
    } catch (error) {
      console.error('Failed to unlock achievement:', error);
      throw error;
    }
  }

  // ---- CHALLENGE METHODS ----

  public async getChallengeData(): Promise<any> {
    return this.get('challenge_data') || {
      submissions: [],
      votes: [],
      participation: [],
    };
  }

  public async saveChallengeData(data: any): Promise<void> {
    return this.set('challenge_data', data);
  }

  // ---- ANALYTICS METHODS ----

  public async recordEvent(eventType: string, eventData: any): Promise<void> {
    try {
      const events = await this.get<any[]>('analytics_events') || [];
      events.push({
        type: eventType,
        data: eventData,
        timestamp: Date.now(),
      });

      // Keep only last 1000 events
      if (events.length > 1000) {
        events.splice(0, events.length - 1000);
      }

      await this.set('analytics_events', events);
    } catch (error) {
      console.error('Failed to record event:', error);
    }
  }

  public async getAnalyticsEvents(limit?: number): Promise<any[]> {
    try {
      const events = await this.get<any[]>('analytics_events') || [];
      return limit ? events.slice(-limit) : events;
    } catch (error) {
      console.error('Failed to get analytics events:', error);
      return [];
    }
  }

  // ---- XP AND STREAK METHODS ----

  public async getUserXP(): Promise<number> {
    const profile = await this.getUserProfile();
    return profile?.stats?.totalDrawingTime || 0; // Placeholder
  }

  public async addUserXP(amount: number): Promise<void> {
    try {
      const profile = await this.getUserProfile();
      if (profile) {
        // In a real implementation, you'd have proper XP tracking
        profile.stats.totalDrawingTime += amount; // Placeholder
        await this.saveUserProfile(profile);
      }
    } catch (error) {
      console.error('Failed to add user XP:', error);
      throw error;
    }
  }

  public async updateStreak(): Promise<number> {
    try {
      const today = new Date().toDateString();
      const lastActivity = await this.get<string>('last_activity_date');
      let streak = await this.get<number>('current_streak') || 0;

      if (lastActivity !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastActivity === yesterday.toDateString()) {
          // Consecutive day
          streak += 1;
        } else {
          // Streak broken
          streak = 1;
        }
        
        await this.set('current_streak', streak);
        await this.set('last_activity_date', today);
      }

      return streak;
    } catch (error) {
      console.error('Failed to update streak:', error);
      return 0;
    }
  }

  // FIXED: Type safety for getCurrentStreak
  public async getCurrentStreak(): Promise<number> {
    const streak = await this.get<number>('current_streak');
    return streak || 0;
  }

  // ---- PREFERENCES METHODS ----

  public async getUserPreferences(): Promise<any> {
    return this.get('user_preferences') || {
      theme: 'light',
      notifications: true,
      dailyGoal: 15, // minutes
    };
  }

  public async saveUserPreferences(preferences: any): Promise<void> {
    return this.set('user_preferences', preferences);
  }

  // ---- CACHE MANAGEMENT ----

  public clearCache(): void {
    this.cache.clear();
  }

  public getCacheSize(): number {
    return this.cache.size;
  }

  public getCacheKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  // ---- BATCH OPERATIONS ----

  public async batchSet(operations: Array<{ key: string; value: any }>): Promise<void> {
    const promises = operations.map(op => this.set(op.key, op.value));
    await Promise.all(promises);
  }

  public async batchGet(keys: string[]): Promise<Record<string, any>> {
    const promises = keys.map(async key => ({ key, value: await this.get(key) }));
    const results = await Promise.all(promises);
    
    return results.reduce((acc, { key, value }) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, any>);
  }

  // ---- DEBUG METHODS ----

  public async debugGetAllKeys(): Promise<readonly string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Failed to get all keys:', error);
      return [];
    }
  }

  public async debugGetStorageSize(): Promise<number> {
    try {
      const keys = await this.debugGetAllKeys();
      const sizes = await Promise.all(
        keys.map(async key => {
          const value = await AsyncStorage.getItem(key);
          return value ? value.length : 0;
        })
      );
      return sizes.reduce((total, size) => total + size, 0);
    } catch (error) {
      console.error('Failed to calculate storage size:', error);
      return 0;
    }
  }

  // ---- UTILITY METHODS ----

  private deepMerge(target: any, source: any): any {
    if (!source) return target;
    
    const output = { ...target };
    
    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (key in target) {
          output[key] = this.deepMerge(target[key], source[key]);
        } else {
          output[key] = source[key];
        }
      } else {
        output[key] = source[key];
      }
    });
    
    return output;
  }
}

// Export singleton instance
export const dataManager = DataManager.getInstance();