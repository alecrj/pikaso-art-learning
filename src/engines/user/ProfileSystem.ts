// src/engines/user/ProfileSystem.ts - ENTERPRISE GRADE PROFILE SYSTEM

import { EventBus } from '../core/EventBus';
import { dataManager } from '../core/DataManager';
import { errorHandler } from '../core/ErrorHandler';

/**
 * PROFESSIONAL PROFILE MANAGEMENT SYSTEM
 * 
 * Enterprise features:
 * - User profile CRUD operations
 * - Avatar management
 * - Privacy settings
 * - Social connections
 * - Achievement showcase
 * - Portfolio integration
 */

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  avatar?: string;
  bio?: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  joinedAt: number;
  lastActiveAt: number;
  
  // Social
  followers: number;
  following: number;
  isFollowing?: boolean;
  
  // Privacy
  isPrivate: boolean;
  showProgress: boolean;
  showArtwork: boolean;
  
  // Stats
  totalArtworks: number;
  totalLessons: number;
  currentStreak: number;
  longestStreak: number;
  
  // Achievements
  featuredAchievements: string[];
  totalAchievements: number;
  
  // Settings
  preferences: {
    language: string;
    timezone: string;
    emailNotifications: boolean;
    pushNotifications: boolean;
  };
}

export interface ProfileUpdate {
  displayName?: string;
  bio?: string;
  avatar?: string;
  skillLevel?: UserProfile['skillLevel'];
  isPrivate?: boolean;
  showProgress?: boolean;
  showArtwork?: boolean;
  preferences?: Partial<UserProfile['preferences']>;
}

class ProfileSystem {
  private static instance: ProfileSystem;
  private eventBus: EventBus;
  private currentProfile: UserProfile | null = null;
  private profileCache: Map<string, UserProfile> = new Map();
  
  private constructor() {
    this.eventBus = EventBus.getInstance();
  }
  
  public static getInstance(): ProfileSystem {
    if (!ProfileSystem.instance) {
      ProfileSystem.instance = new ProfileSystem();
    }
    return ProfileSystem.instance;
  }
  
  // =================== PROFILE MANAGEMENT ===================
  
  public async loadCurrentProfile(): Promise<UserProfile | null> {
    try {
      const profile = await dataManager.getUserProfile();
      if (profile) {
        this.currentProfile = profile;
        this.profileCache.set(profile.id, profile);
        this.eventBus.emit('profile:loaded', profile);
      }
      return profile;
    } catch (error) {
      errorHandler.handleError(errorHandler.createError(
        'USER_ERROR',
        'Failed to load user profile',
        'medium',
        { error }
      ));
      return null;
    }
  }
  
  public async createProfile(data: {
    username: string;
    displayName: string;
    email?: string;
    skillLevel: UserProfile['skillLevel'];
  }): Promise<UserProfile> {
    try {
      const profile: UserProfile = {
        id: this.generateUserId(),
        username: data.username.toLowerCase(),
        displayName: data.displayName,
        email: data.email,
        skillLevel: data.skillLevel,
        joinedAt: Date.now(),
        lastActiveAt: Date.now(),
        
        followers: 0,
        following: 0,
        
        isPrivate: false,
        showProgress: true,
        showArtwork: true,
        
        totalArtworks: 0,
        totalLessons: 0,
        currentStreak: 0,
        longestStreak: 0,
        
        featuredAchievements: [],
        totalAchievements: 0,
        
        preferences: {
          language: 'en',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          emailNotifications: true,
          pushNotifications: true,
        },
      };
      
      await dataManager.saveUserProfile(profile);
      this.currentProfile = profile;
      this.profileCache.set(profile.id, profile);
      
      this.eventBus.emit('profile:created', profile);
      return profile;
      
    } catch (error) {
      errorHandler.handleError(errorHandler.createError(
        'USER_ERROR',
        'Failed to create user profile',
        'high',
        { error, data }
      ));
      throw error;
    }
  }
  
  public async updateProfile(updates: ProfileUpdate): Promise<UserProfile> {
    if (!this.currentProfile) {
      throw new Error('No profile loaded');
    }
    
    try {
      const updatedProfile: UserProfile = {
        ...this.currentProfile,
        ...updates,
        lastActiveAt: Date.now(),
        preferences: {
          ...this.currentProfile.preferences,
          ...updates.preferences,
        },
      };
      
      await dataManager.saveUserProfile(updatedProfile);
      this.currentProfile = updatedProfile;
      this.profileCache.set(updatedProfile.id, updatedProfile);
      
      this.eventBus.emit('profile:updated', {
        profile: updatedProfile,
        changes: updates,
      });
      
      return updatedProfile;
      
    } catch (error) {
      errorHandler.handleError(errorHandler.createError(
        'USER_ERROR',
        'Failed to update user profile',
        'medium',
        { error, updates }
      ));
      throw error;
    }
  }
  
  public async getProfile(userId: string): Promise<UserProfile | null> {
    // Check cache first
    if (this.profileCache.has(userId)) {
      return this.profileCache.get(userId)!;
    }
    
    try {
      // In production, this would fetch from API
      const profile = await dataManager.get<UserProfile>(`profile_${userId}`);
      if (profile) {
        this.profileCache.set(userId, profile);
      }
      return profile;
      
    } catch (error) {
      errorHandler.handleError(errorHandler.createError(
        'USER_ERROR',
        'Failed to fetch user profile',
        'low',
        { error, userId }
      ));
      return null;
    }
  }
  
  // =================== AVATAR MANAGEMENT ===================
  
  public async updateAvatar(imageUri: string): Promise<string> {
    if (!this.currentProfile) {
      throw new Error('No profile loaded');
    }
    
    try {
      // In production, this would upload to CDN
      const avatarUrl = await this.uploadAvatar(imageUri);
      
      await this.updateProfile({ avatar: avatarUrl });
      
      this.eventBus.emit('profile:avatar_updated', {
        userId: this.currentProfile.id,
        avatarUrl,
      });
      
      return avatarUrl;
      
    } catch (error) {
      errorHandler.handleError(errorHandler.createError(
        'USER_ERROR',
        'Failed to update avatar',
        'medium',
        { error }
      ));
      throw error;
    }
  }
  
  private async uploadAvatar(imageUri: string): Promise<string> {
    // Mock upload - in production, use CDN
    return `https://api.pikaso.app/avatars/${Date.now()}.jpg`;
  }
  
  // =================== SOCIAL FEATURES ===================
  
  public async followUser(userId: string): Promise<void> {
    if (!this.currentProfile) {
      throw new Error('No profile loaded');
    }
    
    try {
      // Update following count
      const updatedProfile = {
        ...this.currentProfile,
        following: this.currentProfile.following + 1,
      };
      
      await dataManager.saveUserProfile(updatedProfile);
      this.currentProfile = updatedProfile;
      
      // In production, update backend
      this.eventBus.emit('social:followed', {
        followerId: this.currentProfile.id,
        followedId: userId,
      });
      
    } catch (error) {
      errorHandler.handleError(errorHandler.createError(
        'COMMUNITY_ERROR',
        'Failed to follow user',
        'medium',
        { error, userId }
      ));
      throw error;
    }
  }
  
  public async unfollowUser(userId: string): Promise<void> {
    if (!this.currentProfile) {
      throw new Error('No profile loaded');
    }
    
    try {
      // Update following count
      const updatedProfile = {
        ...this.currentProfile,
        following: Math.max(0, this.currentProfile.following - 1),
      };
      
      await dataManager.saveUserProfile(updatedProfile);
      this.currentProfile = updatedProfile;
      
      // In production, update backend
      this.eventBus.emit('social:unfollowed', {
        followerId: this.currentProfile.id,
        unfollowedId: userId,
      });
      
    } catch (error) {
      errorHandler.handleError(errorHandler.createError(
        'COMMUNITY_ERROR',
        'Failed to unfollow user',
        'medium',
        { error, userId }
      ));
      throw error;
    }
  }
  
  // =================== STATS MANAGEMENT ===================
  
  public async updateStats(stats: Partial<{
    totalArtworks: number;
    totalLessons: number;
    currentStreak: number;
    longestStreak: number;
    totalAchievements: number;
  }>): Promise<void> {
    if (!this.currentProfile) {
      throw new Error('No profile loaded');
    }
    
    try {
      const updatedProfile = {
        ...this.currentProfile,
        ...stats,
        longestStreak: Math.max(
          this.currentProfile.longestStreak,
          stats.currentStreak || this.currentProfile.currentStreak
        ),
      };
      
      await dataManager.saveUserProfile(updatedProfile);
      this.currentProfile = updatedProfile;
      
      this.eventBus.emit('profile:stats_updated', {
        userId: this.currentProfile.id,
        stats,
      });
      
    } catch (error) {
      errorHandler.handleError(errorHandler.createError(
        'USER_ERROR',
        'Failed to update profile stats',
        'low',
        { error, stats }
      ));
    }
  }
  
  // =================== UTILITIES ===================
  
  public getCurrentProfile(): UserProfile | null {
    return this.currentProfile;
  }
  
  public isLoggedIn(): boolean {
    return !!this.currentProfile;
  }
  
  public async logout(): Promise<void> {
    this.currentProfile = null;
    this.profileCache.clear();
    
    await dataManager.remove('current_user_id');
    
    this.eventBus.emit('profile:logged_out');
  }
  
  private generateUserId(): string {
    return `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  public async deleteProfile(): Promise<void> {
    if (!this.currentProfile) {
      throw new Error('No profile loaded');
    }
    
    try {
      await dataManager.remove(`profile_${this.currentProfile.id}`);
      await dataManager.remove('current_user_id');
      
      const profileId = this.currentProfile.id;
      this.currentProfile = null;
      this.profileCache.clear();
      
      this.eventBus.emit('profile:deleted', { profileId });
      
    } catch (error) {
      errorHandler.handleError(errorHandler.createError(
        'USER_ERROR',
        'Failed to delete profile',
        'high',
        { error }
      ));
      throw error;
    }
  }
}

export const profileSystem = ProfileSystem.getInstance();
export default profileSystem;