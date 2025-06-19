import { User } from '../../types';
import { dataManager } from '../core/DataManager';
import { EventBus } from '../core/EventBus';
import { errorHandler } from '../core/ErrorHandler';

/**
 * Profile System - Google-level user management
 * Handles user accounts, profiles, and authentication
 */
export class ProfileSystem {
  private static instance: ProfileSystem;
  private currentUser: User | null = null;
  private eventBus: EventBus = EventBus.getInstance();
  private isInitialized: boolean = false;

  private constructor() {}

  public static getInstance(): ProfileSystem {
    if (!ProfileSystem.instance) {
      ProfileSystem.instance = new ProfileSystem();
    }
    return ProfileSystem.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // Load saved user profile
      const savedUser = await dataManager.getUserProfile();
      if (savedUser) {
        // Fix date serialization issue
        this.currentUser = this.deserializeUser(savedUser);
        this.eventBus.emit('user:loaded', { user: this.currentUser });
      }
      
      this.isInitialized = true;
      console.log('ProfileSystem initialized', { hasUser: !!this.currentUser });
    } catch (error) {
      errorHandler.handleError(
        errorHandler.createError('PROFILE_INIT_ERROR', 'Failed to initialize profile system', 'medium', error)
      );
    }
  }

  public async createUser(
    email: string,
    username: string,
    displayName: string
  ): Promise<User> {
    try {
      const now = new Date();
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newUser: User = {
        id: userId,
        username: username.toLowerCase().replace(/\s+/g, ''),
        displayName,
        email,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
        bio: 'Aspiring artist learning to draw!',
        following: [],
        followers: [],
        isVerified: false,
        isOnline: true,
        lastSeenAt: Date.now(),
        
        // User progression
        level: 1,
        xp: 0,
        totalXP: 0,
        streakDays: 0,
        lastActiveDate: now,
        createdAt: now,
        updatedAt: now,
        
        // Preferences
        preferences: {
          theme: 'auto',
          notifications: {
            lessons: true,
            achievements: true,
            social: true,
            challenges: true,
          },
          privacy: {
            profile: 'public',
            artwork: 'public',
            progress: 'public',
          },
        },
        
        // Stats
        stats: {
          totalDrawingTime: 0,
          totalLessonsCompleted: 0,
          totalArtworksCreated: 0,
          currentStreak: 0,
          longestStreak: 0,
          artworksCreated: 0,
          artworksShared: 0,
          challengesCompleted: 0,
          skillsUnlocked: 0,
          perfectLessons: 0,
          lessonsCompleted: 0,
        },
        
        // Achievements
        achievements: [],
      };
      
      // Save user
      this.currentUser = newUser;
      await this.saveUser();
      
      this.eventBus.emit('user:created', { user: newUser });
      console.log('User created successfully:', { userId: newUser.id, displayName });
      
      return newUser;
    } catch (error) {
      errorHandler.handleError(
        errorHandler.createError('USER_CREATE_ERROR', 'Failed to create user', 'high', error)
      );
      throw error;
    }
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public async updateUser(updates: Partial<User>): Promise<User | null> {
    if (!this.currentUser) return null;
    
    try {
      this.currentUser = {
        ...this.currentUser,
        ...updates,
        updatedAt: new Date(),
      };
      
      await this.saveUser();
      this.eventBus.emit('user:updated', { user: this.currentUser });
      
      return this.currentUser;
    } catch (error) {
      errorHandler.handleError(
        errorHandler.createError('USER_UPDATE_ERROR', 'Failed to update user', 'medium', error)
      );
      return null;
    }
  }

  public async updateActivity(): Promise<void> {
    if (!this.currentUser) return;
    
    const now = new Date();
    const lastActive = new Date(this.currentUser.lastActiveDate);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastActiveDay = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());
    
    // Check if it's a new day
    if (today.getTime() !== lastActiveDay.getTime()) {
      // Check if streak continues
      const daysSinceActive = Math.floor((today.getTime() - lastActiveDay.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceActive === 1) {
        // Continue streak
        this.currentUser.streakDays++;
        this.currentUser.stats.currentStreak++;
        
        if (this.currentUser.stats.currentStreak > this.currentUser.stats.longestStreak) {
          this.currentUser.stats.longestStreak = this.currentUser.stats.currentStreak;
        }
        
        this.eventBus.emit('user:streakContinued', { 
          streak: this.currentUser.streakDays,
          isNewRecord: this.currentUser.stats.currentStreak === this.currentUser.stats.longestStreak
        });
      } else if (daysSinceActive > 1) {
        // Streak broken
        this.currentUser.streakDays = 1;
        this.currentUser.stats.currentStreak = 1;
        
        this.eventBus.emit('user:streakBroken', { 
          previousStreak: this.currentUser.stats.currentStreak 
        });
      }
    }
    
    this.currentUser.lastActiveDate = now;
    this.currentUser.lastSeenAt = now.getTime();
    this.currentUser.isOnline = true;
    
    await this.saveUser();
  }

  // FIXED: Updated addXP method signature to match expected usage
  public async addXP(amount: number, source: string = 'general'): Promise<void> {
    if (!this.currentUser || amount <= 0) return;
    
    try {
      const previousLevel = this.currentUser.level;
      
      this.currentUser.xp += amount;
      this.currentUser.totalXP += amount;
      
      // Calculate new level (100 XP per level initially, scaling up)
      const newLevel = this.calculateLevel(this.currentUser.totalXP);
      
      if (newLevel > previousLevel) {
        this.currentUser.level = newLevel;
        
        this.eventBus.emit('user:levelUp', {
          previousLevel,
          newLevel,
          totalXP: this.currentUser.totalXP,
        });
      }
      
      await this.saveUser();
      
      this.eventBus.emit('user:xpGained', {
        amount,
        source,
        totalXP: this.currentUser.totalXP,
        level: this.currentUser.level,
      });
    } catch (error) {
      errorHandler.handleError(
        errorHandler.createError('XP_ADD_ERROR', 'Failed to add XP', 'low', error)
      );
    }
  }

  // FIXED: Added missing incrementStat method
  public async incrementStat(statName: keyof User['stats'], amount: number = 1): Promise<void> {
    if (!this.currentUser) return;
    
    try {
      // Type-safe stat incrementation
      const currentValue = this.currentUser.stats[statName] as number;
      (this.currentUser.stats as any)[statName] = currentValue + amount;
      
      await this.saveUser();
      
      this.eventBus.emit('user:statUpdated', {
        statName,
        oldValue: currentValue,
        newValue: currentValue + amount,
      });
    } catch (error) {
      errorHandler.handleError(
        errorHandler.createError('STAT_INCREMENT_ERROR', 'Failed to increment stat', 'low', error)
      );
    }
  }

  // FIXED: Added missing updateStreak method
  public async updateStreak(): Promise<void> {
    if (!this.currentUser) return;
    
    try {
      await this.updateActivity();
      
      // The actual streak logic is handled in updateActivity()
      // This method is a convenience wrapper
      
      this.eventBus.emit('user:streakUpdated', {
        currentStreak: this.currentUser.stats.currentStreak,
        longestStreak: this.currentUser.stats.longestStreak,
      });
    } catch (error) {
      errorHandler.handleError(
        errorHandler.createError('STREAK_UPDATE_ERROR', 'Failed to update streak', 'low', error)
      );
    }
  }

  // FIXED: Added missing getProgressSummary method
  public getProgressSummary(): {
    level: number;
    totalXP: number;
    xpToNextLevel: number;
    streakDays: number;
    achievementsCount: number;
    lessonsCompleted: number;
    artworksCreated: number;
  } | null {
    if (!this.currentUser) return null;
    
    return {
      level: this.currentUser.level,
      totalXP: this.currentUser.totalXP,
      xpToNextLevel: this.getXPToNextLevel(),
      streakDays: this.currentUser.streakDays,
      achievementsCount: this.currentUser.achievements.length,
      lessonsCompleted: this.currentUser.stats.totalLessonsCompleted,
      artworksCreated: this.currentUser.stats.artworksCreated,
    };
  }

  public async recordAchievement(achievementId: string): Promise<void> {
    if (!this.currentUser) return;
    
    // Check if already has achievement
    const hasAchievement = this.currentUser.achievements.some(a => a.id === achievementId);
    if (hasAchievement) return;
    
    // This would normally look up achievement details
    const achievement = {
      id: achievementId,
      name: this.getAchievementName(achievementId),
      description: this.getAchievementDescription(achievementId),
      icon: '🏆',
      category: 'milestone' as const,
      requirements: { type: 'custom', value: 1 },
      rarity: 'common' as const,
      xpReward: 50,
      unlockedAt: Date.now(),
    };
    
    this.currentUser.achievements.push(achievement);
    
    // Add XP reward
    await this.addXP(achievement.xpReward, `achievement:${achievementId}`);
    
    await this.saveUser();
    
    this.eventBus.emit('user:achievementUnlocked', { achievement });
  }

  public async logout(): Promise<void> {
    this.currentUser = null;
    await dataManager.remove('current_user');
    this.eventBus.emit('user:logout');
  }

  // Private methods

  private async saveUser(): Promise<void> {
    if (!this.currentUser) return;
    
    try {
      // Serialize user for storage
      const serializedUser = this.serializeUser(this.currentUser);
      await dataManager.saveUserProfile(serializedUser);
    } catch (error) {
      errorHandler.handleError(
        errorHandler.createError('USER_SAVE_ERROR', 'Failed to save user', 'medium', error)
      );
    }
  }

  private calculateLevel(totalXP: number): number {
    // Progressive level scaling
    // Level 1: 0-100 XP
    // Level 2: 100-300 XP (+200)
    // Level 3: 300-600 XP (+300)
    // And so on...
    
    let level = 1;
    let xpRequired = 100;
    let cumulativeXP = 0;
    
    while (totalXP >= cumulativeXP + xpRequired) {
      cumulativeXP += xpRequired;
      level++;
      xpRequired = level * 100;
    }
    
    return level;
  }

  private serializeUser(user: User): any {
    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      lastActiveDate: user.lastActiveDate.toISOString(),
    };
  }

  private deserializeUser(data: any): User {
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      lastActiveDate: new Date(data.lastActiveDate),
    };
  }

  private getAchievementName(id: string): string {
    const names: Record<string, string> = {
      'first_stroke': 'First Stroke',
      'first_artwork': 'First Masterpiece',
      'week_streak': 'Week Warrior',
      'month_streak': 'Dedicated Artist',
      'first_lesson': 'Student of Art',
      'skill_tree_complete': 'Skill Master',
    };
    return names[id] || 'Achievement';
  }

  private getAchievementDescription(id: string): string {
    const descriptions: Record<string, string> = {
      'first_stroke': 'Made your first mark on the canvas',
      'first_artwork': 'Created your first artwork',
      'week_streak': 'Practiced for 7 days in a row',
      'month_streak': 'Practiced for 30 days in a row',
      'first_lesson': 'Completed your first lesson',
      'skill_tree_complete': 'Completed an entire skill tree',
    };
    return descriptions[id] || 'Achievement unlocked!';
  }

  // Public utility methods

  public getXPToNextLevel(): number {
    if (!this.currentUser) return 100;
    
    const currentLevelXP = this.calculateTotalXPForLevel(this.currentUser.level - 1);
    const nextLevelXP = this.calculateTotalXPForLevel(this.currentUser.level);
    const currentProgressXP = this.currentUser.totalXP - currentLevelXP;
    
    return nextLevelXP - currentLevelXP - currentProgressXP;
  }

  private calculateTotalXPForLevel(level: number): number {
    // Sum of XP required for all levels up to this level
    let total = 0;
    for (let i = 1; i <= level; i++) {
      total += i * 100;
    }
    return total;
  }
}

// Export singleton instance
export const profileSystem = ProfileSystem.getInstance();