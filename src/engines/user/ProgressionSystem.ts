import { Achievement, AchievementType, UserProgress } from '../../types';
import { profileSystem } from './ProfileSystem';
import { dataManager } from '../core/DataManager';
import { errorHandler } from '../core/ErrorHandler';
import * as Haptics from 'expo-haptics';

/**
 * Progression System - Handles XP, levels, achievements, and rewards
 * Implements psychological engagement through gamification with enterprise reliability
 */
export class ProgressionSystem {
  private static instance: ProgressionSystem;
  private achievementDefinitions: Map<string, AchievementDefinition> = new Map();
  private progressListeners: Set<(event: ProgressionEvent) => void> = new Set();
  
  private constructor() {
    this.initializeAchievements();
  }

  public static getInstance(): ProgressionSystem {
    if (!ProgressionSystem.instance) {
      ProgressionSystem.instance = new ProgressionSystem();
    }
    return ProgressionSystem.instance;
  }

  private initializeAchievements(): void {
    // Lesson completion achievements
    this.registerAchievement({
      id: 'first_lesson',
      type: 'skill',
      title: 'First Steps',
      description: 'Complete your first lesson',
      iconUrl: 'achievement_first_lesson',
      maxProgress: 1,
      xpReward: 50,
      rarity: 'common',
    });

    this.registerAchievement({
      id: 'lesson_master_10',
      type: 'skill',
      title: 'Dedicated Learner',
      description: 'Complete 10 lessons',
      iconUrl: 'achievement_lessons_10',
      maxProgress: 10,
      xpReward: 200,
      rarity: 'rare',
    });

    this.registerAchievement({
      id: 'lesson_master_50',
      type: 'skill',
      title: 'Knowledge Seeker',
      description: 'Complete 50 lessons',
      iconUrl: 'achievement_lessons_50',
      maxProgress: 50,
      xpReward: 500,
      rarity: 'epic',
    });

    this.registerAchievement({
      id: 'lesson_master_100',
      type: 'milestone',
      title: 'Master Scholar',
      description: 'Complete 100 lessons',
      iconUrl: 'achievement_lessons_100',
      maxProgress: 100,
      xpReward: 1000,
      rarity: 'legendary',
    });

    // Streak achievements
    this.registerAchievement({
      id: 'streak_7',
      type: 'streak',
      title: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      iconUrl: 'achievement_streak_7',
      maxProgress: 7,
      xpReward: 100,
      rarity: 'common',
    });

    this.registerAchievement({
      id: 'streak_30',
      type: 'streak',
      title: 'Dedicated Artist',
      description: 'Maintain a 30-day streak',
      iconUrl: 'achievement_streak_30',
      maxProgress: 30,
      xpReward: 300,
      rarity: 'rare',
    });

    this.registerAchievement({
      id: 'streak_100',
      type: 'streak',
      title: 'Centurion',
      description: 'Maintain a 100-day streak',
      iconUrl: 'achievement_streak_100',
      maxProgress: 100,
      xpReward: 1000,
      rarity: 'legendary',
    });

    // Artwork achievements
    this.registerAchievement({
      id: 'first_artwork',
      type: 'creativity',
      title: 'Creative Debut',
      description: 'Create your first artwork',
      iconUrl: 'achievement_first_artwork',
      maxProgress: 1,
      xpReward: 50,
      rarity: 'common',
    });

    this.registerAchievement({
      id: 'artwork_10',
      type: 'creativity',
      title: 'Prolific Creator',
      description: 'Create 10 artworks',
      iconUrl: 'achievement_artwork_10',
      maxProgress: 10,
      xpReward: 150,
      rarity: 'rare',
    });

    this.registerAchievement({
      id: 'artwork_shared',
      type: 'social',
      title: 'Sharing is Caring',
      description: 'Share your first artwork',
      iconUrl: 'achievement_share',
      maxProgress: 1,
      xpReward: 75,
      rarity: 'common',
    });

    // Skill mastery achievements
    this.registerAchievement({
      id: 'perfect_lesson',
      type: 'skill',
      title: 'Perfectionist',
      description: 'Complete a lesson with perfect score',
      iconUrl: 'achievement_perfect',
      maxProgress: 1,
      xpReward: 100,
      rarity: 'common',
    });

    this.registerAchievement({
      id: 'skill_tree_complete',
      type: 'milestone',
      title: 'Tree Climber',
      description: 'Complete an entire skill tree',
      iconUrl: 'achievement_tree',
      maxProgress: 1,
      xpReward: 500,
      rarity: 'epic',
    });

    // Challenge achievements
    this.registerAchievement({
      id: 'challenge_participant',
      type: 'social',
      title: 'Challenger',
      description: 'Participate in your first challenge',
      iconUrl: 'achievement_challenge',
      maxProgress: 1,
      xpReward: 50,
      rarity: 'common',
    });

    this.registerAchievement({
      id: 'challenge_winner',
      type: 'social',
      title: 'Champion',
      description: 'Win a daily challenge',
      iconUrl: 'achievement_winner',
      maxProgress: 1,
      xpReward: 300,
      rarity: 'epic',
    });
  }

  private registerAchievement(definition: AchievementDefinition): void {
    this.achievementDefinitions.set(definition.id, definition);
  }

  public async getUserProgress(userId: string): Promise<UserProgress | null> {
    try {
      const user = profileSystem.getCurrentUser();
      if (!user || user.id !== userId) {
        return null;
      }

      // Convert User data to UserProgress format
      const userProgress: UserProgress = {
        userId: user.id,
        level: user.level,
        xp: user.xp,
        xpToNextLevel: this.calculateXPToNextLevel(user.level, user.xp),
        skillPoints: {
          drawing: user.stats.totalDrawingTime / 3600, // Convert to hours
          theory: user.stats.totalLessonsCompleted * 10,
          creativity: user.stats.artworksCreated * 25,
          technique: user.stats.perfectLessons * 50,
        },
        achievements: user.achievements,
        streakDays: user.streakDays,
        lastActivityDate: user.lastActiveDate.toISOString(),
        learningStats: {
          lessonsCompleted: user.stats.totalLessonsCompleted,
          skillTreesCompleted: 0, // Would need to calculate from completed lessons
          totalStudyTime: user.stats.totalDrawingTime,
          averageSessionTime: user.stats.averageSessionTime || 0,
          strongestSkills: this.calculateStrongestSkills(user),
          improvementAreas: this.calculateImprovementAreas(user),
        },
      };

      return userProgress;
    } catch (error) {
      errorHandler.handleError(
        errorHandler.createError('PROGRESS_LOAD_ERROR', 'Failed to load user progress', 'medium', error)
      );
      return null;
    }
  }

  public async createUserProgress(userId: string): Promise<UserProgress> {
    try {
      const initialProgress: UserProgress = {
        userId,
        level: 1,
        xp: 0,
        xpToNextLevel: 1000,
        skillPoints: {
          drawing: 0,
          theory: 0,
          creativity: 0,
          technique: 0,
        },
        achievements: [],
        streakDays: 0,
        lastActivityDate: new Date().toISOString(),
        learningStats: {
          lessonsCompleted: 0,
          skillTreesCompleted: 0,
          totalStudyTime: 0,
          averageSessionTime: 0,
          strongestSkills: [],
          improvementAreas: [],
        },
      };

      // Save initial progress
      await dataManager.save(`user_progress_${userId}`, initialProgress);
      return initialProgress;
    } catch (error) {
      errorHandler.handleError(
        errorHandler.createError('PROGRESS_CREATE_ERROR', 'Failed to create user progress', 'high', error)
      );
      throw error;
    }
  }

  private calculateXPToNextLevel(level: number, currentXP: number): number {
    const xpForNextLevel = level * 1000;
    return Math.max(0, xpForNextLevel - currentXP);
  }

  private calculateStrongestSkills(user: any): string[] {
    const skills = [];
    if (user.stats.perfectLessons > 5) skills.push('Precision');
    if (user.stats.artworksCreated > 10) skills.push('Creativity');
    if (user.streakDays > 14) skills.push('Consistency');
    return skills;
  }

  private calculateImprovementAreas(user: any): string[] {
    const areas = [];
    if (user.stats.averageSessionTime < 600) areas.push('Session Length');
    if (user.stats.perfectLessons / Math.max(1, user.stats.totalLessonsCompleted) < 0.3) {
      areas.push('Lesson Mastery');
    }
    return areas;
  }

  public async checkAchievements(type: AchievementType, progress: number = 1): Promise<Achievement[]> {
    const user = profileSystem.getCurrentUser();
    if (!user) return [];

    const unlockedAchievements: Achievement[] = [];
    
    // Check all achievements of this type
    for (const [id, definition] of this.achievementDefinitions) {
      if (definition.type !== type) continue;

      const existingAchievement = user.achievements.find(a => a.id === id);
      
      if (existingAchievement && existingAchievement.unlockedAt) {
        // Already unlocked
        continue;
      }

      const currentProgress = existingAchievement?.progress || 0;
      const newProgress = Math.min(currentProgress + progress, definition.maxProgress);

      if (newProgress >= definition.maxProgress) {
        // Achievement unlocked!
        const achievement: Achievement = {
          id: definition.id,
          name: definition.title,
          title: definition.title,
          description: definition.description,
          icon: definition.iconUrl,
          iconUrl: definition.iconUrl,
          category: definition.type,
          requirements: { type: 'progress', value: definition.maxProgress },
          rarity: definition.rarity,
          xpReward: definition.xpReward,
          unlockedAt: Date.now(),
          progress: definition.maxProgress,
          maxProgress: definition.maxProgress,
        };

        unlockedAchievements.push(achievement);
        await this.unlockAchievement(achievement);
      } else if (newProgress > currentProgress) {
        // Update progress
        await this.updateAchievementProgress(id, newProgress);
      }
    }

    return unlockedAchievements;
  }

  public async unlockAchievement(achievement: Achievement): Promise<void> {
    const user = profileSystem.getCurrentUser();
    if (!user) return;

    try {
      const existingIndex = user.achievements.findIndex(a => a.id === achievement.id);
      if (existingIndex >= 0) {
        user.achievements[existingIndex] = achievement;
      } else {
        user.achievements.push(achievement);
      }

      // Award XP
      // FIXED: Added source parameter to addXP call
      await profileSystem.addXP(achievement.xpReward, `achievement:${achievement.id}`);

      // Save updated user
      await profileSystem.updateUser(user);

      // Trigger celebration
      this.celebrateAchievement(achievement);

      // Notify listeners
      this.notifyProgress({
        type: 'achievement_unlocked',
        achievement,
        xpAwarded: achievement.xpReward,
      });
    } catch (error) {
      errorHandler.handleError(
        errorHandler.createError('ACHIEVEMENT_UNLOCK_ERROR', 'Failed to unlock achievement', 'medium', error)
      );
    }
  }

  public getAchievement(achievementId: string): Achievement | null {
    const user = profileSystem.getCurrentUser();
    if (!user) return null;

    return user.achievements.find(a => a.id === achievementId) || null;
  }

  public getAchievementDefinition(achievementId: string): AchievementDefinition | null {
    return this.achievementDefinitions.get(achievementId) || null;
  }

  private async updateAchievementProgress(achievementId: string, progress: number): Promise<void> {
    const user = profileSystem.getCurrentUser();
    if (!user) return;

    const definition = this.achievementDefinitions.get(achievementId);
    if (!definition) return;

    try {
      const existingIndex = user.achievements.findIndex(a => a.id === achievementId);
      const achievement: Achievement = {
        id: achievementId,
        name: definition.title,
        title: definition.title,
        description: definition.description,
        icon: definition.iconUrl,
        iconUrl: definition.iconUrl,
        category: definition.type,
        requirements: { type: 'progress', value: definition.maxProgress },
        rarity: definition.rarity,
        xpReward: definition.xpReward,
        progress,
        maxProgress: definition.maxProgress,
      };

      if (existingIndex >= 0) {
        user.achievements[existingIndex] = achievement;
      } else {
        user.achievements.push(achievement);
      }

      await profileSystem.updateUser(user);

      // Notify progress update
      this.notifyProgress({
        type: 'achievement_progress',
        achievement,
        progress,
      });
    } catch (error) {
      errorHandler.handleError(
        errorHandler.createError('ACHIEVEMENT_PROGRESS_ERROR', 'Failed to update achievement progress', 'low', error)
      );
    }
  }

  private celebrateAchievement(achievement: Achievement): void {
    // Haptic feedback based on rarity
    switch (achievement.rarity) {
      case 'legendary':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'epic':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'rare':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      default:
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  public async recordLessonCompletion(lessonId: string, score: number): Promise<void> {
    const user = profileSystem.getCurrentUser();
    if (!user) return;

    try {
      // FIXED: Use the correct incrementStat method with proper parameters
      await profileSystem.incrementStat('totalLessonsCompleted');
      
      if (score >= 0.95) { // 95% or higher is perfect
        await profileSystem.incrementStat('perfectLessons');
        await this.checkAchievements('skill', 1);
      }

      // Check lesson achievements
      await this.checkAchievements('skill', 1);

      // Update daily streak
      await profileSystem.updateStreak();
      
      // Check streak achievements
      const progressSummary = profileSystem.getProgressSummary();
      if (progressSummary) {
        await this.checkStreakAchievements(progressSummary.streakDays);
      }
    } catch (error) {
      errorHandler.handleError(
        errorHandler.createError('LESSON_COMPLETION_ERROR', 'Failed to record lesson completion', 'medium', error)
      );
    }
  }

  private async checkStreakAchievements(currentStreak: number): Promise<void> {
    const streakMilestones = [7, 30, 100];
    
    for (const milestone of streakMilestones) {
      if (currentStreak >= milestone) {
        const achievementId = `streak_${milestone}`;
        const achievement = this.achievementDefinitions.get(achievementId);
        if (achievement) {
          const user = profileSystem.getCurrentUser();
          const existing = user?.achievements.find(a => a.id === achievementId);
          if (!existing?.unlockedAt) {
            await this.checkAchievements('streak', milestone);
          }
        }
      }
    }
  }

  public async recordArtworkCreation(artworkId: string): Promise<void> {
    try {
      // FIXED: Use the correct incrementStat method
      await profileSystem.incrementStat('artworksCreated');
      await this.checkAchievements('creativity', 1);
    } catch (error) {
      errorHandler.handleError(
        errorHandler.createError('ARTWORK_CREATION_ERROR', 'Failed to record artwork creation', 'low', error)
      );
    }
  }

  public async recordArtworkShared(artworkId: string): Promise<void> {
    try {
      // FIXED: Use the correct incrementStat method
      await profileSystem.incrementStat('artworksShared');
      await this.checkAchievements('social', 1);
    } catch (error) {
      errorHandler.handleError(
        errorHandler.createError('ARTWORK_SHARE_ERROR', 'Failed to record artwork share', 'low', error)
      );
    }
  }

  public async recordChallengeParticipation(challengeId: string, won: boolean): Promise<void> {
    try {
      // FIXED: Use the correct incrementStat method
      await profileSystem.incrementStat('challengesCompleted');
      await this.checkAchievements('social', 1);
    } catch (error) {
      errorHandler.handleError(
        errorHandler.createError('CHALLENGE_PARTICIPATION_ERROR', 'Failed to record challenge participation', 'low', error)
      );
    }
  }

  public subscribeToProgress(callback: (event: ProgressionEvent) => void): () => void {
    this.progressListeners.add(callback);
    return () => this.progressListeners.delete(callback);
  }

  private notifyProgress(event: ProgressionEvent): void {
    this.progressListeners.forEach(callback => callback(event));
  }

  public getAchievementProgress(): {
    total: number;
    unlocked: number;
    inProgress: Achievement[];
    locked: AchievementDefinition[];
  } {
    const user = profileSystem.getCurrentUser();
    if (!user) {
      return {
        total: this.achievementDefinitions.size,
        unlocked: 0,
        inProgress: [],
        locked: Array.from(this.achievementDefinitions.values()),
      };
    }

    const unlocked = user.achievements.filter(a => a.unlockedAt).length;
    const inProgress = user.achievements.filter(a => !a.unlockedAt && (a.progress || 0) > 0);
    
    const unlockedIds = new Set(user.achievements.map(a => a.id));
    const locked = Array.from(this.achievementDefinitions.values())
      .filter(def => !unlockedIds.has(def.id));

    return {
      total: this.achievementDefinitions.size,
      unlocked,
      inProgress,
      locked,
    };
  }

  public calculateDailyXPGoal(): number {
    const user = profileSystem.getCurrentUser();
    if (!user) return 50; // Default goal

    // Adaptive goal based on user's average performance
    const avgXPPerDay = user.totalXP / Math.max(1, 
      Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Set goal slightly above average to encourage growth
    return Math.max(50, Math.min(500, Math.floor(avgXPPerDay * 1.2)));
  }
}

interface AchievementDefinition {
  id: string;
  type: AchievementType;
  title: string;
  description: string;
  iconUrl: string;
  maxProgress: number;
  xpReward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface ProgressionEvent {
  type: 'achievement_unlocked' | 'achievement_progress' | 'level_up' | 'xp_gained';
  achievement?: Achievement;
  xpAwarded?: number;
  newLevel?: number;
  progress?: number;
}

// Export singleton instance
export const progressionSystem = ProgressionSystem.getInstance();