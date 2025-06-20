// src/engines/user/index.ts - ENTERPRISE USER ENGINE EXPORTS

// FIXED: Export both classes and instances properly
export { ProfileSystem } from './ProfileSystem';
export { ProgressionSystem } from './ProgressionSystem';
export { PortfolioManager } from './PortfolioManager';

// FIXED: Type exports - use types from main types folder
export type { 
  UserProfile, 
  Achievement, 
  Portfolio, 
  PortfolioItem, 
  PortfolioStats,
  Artwork,
  Collection,
  ProgressData,
  SkillProgress,
  Milestone,
  XPGain
} from '../../types';

// Profile system types
export interface ProfileUpdate {
  displayName?: string;
  bio?: string;
  avatar?: string;
  skillLevel?: 'beginner' | 'intermediate' | 'advanced';
  isPrivate?: boolean;
  showProgress?: boolean;
  showArtwork?: boolean;
  preferences?: Record<string, any>;
}

export interface UserStatUpdate {
  totalArtworks?: number;
  totalLessons?: number;
  currentStreak?: number;
  longestStreak?: number;
  totalAchievements?: number;
  totalDrawingTime?: number;
}

// Create safe singleton getters
let profileSystemInstance: any = null;
let progressionSystemInstance: any = null;
let portfolioManagerInstance: any = null;

export const getProfileSystem = () => {
  if (!profileSystemInstance) {
    try {
      const { ProfileSystem } = require('./ProfileSystem');
      profileSystemInstance = ProfileSystem.getInstance();
    } catch (error) {
      console.warn('ProfileSystem not available:', error);
      profileSystemInstance = createMockSystem('ProfileSystem');
    }
  }
  return profileSystemInstance;
};

export const getProgressionSystem = () => {
  if (!progressionSystemInstance) {
    try {
      const { ProgressionSystem } = require('./ProgressionSystem');
      progressionSystemInstance = ProgressionSystem.getInstance();
    } catch (error) {
      console.warn('ProgressionSystem not available:', error);
      progressionSystemInstance = createMockSystem('ProgressionSystem');
    }
  }
  return progressionSystemInstance;
};

export const getPortfolioManager = () => {
  if (!portfolioManagerInstance) {
    try {
      const { PortfolioManager } = require('./PortfolioManager');
      portfolioManagerInstance = PortfolioManager.getInstance();
    } catch (error) {
      console.warn('PortfolioManager not available:', error);
      portfolioManagerInstance = createMockSystem('PortfolioManager');
    }
  }
  return portfolioManagerInstance;
};

// Export consistent instance references
export const profileSystem = getProfileSystem();
export const progressionSystem = getProgressionSystem();
export const portfolioManager = getPortfolioManager();

// Mock system creator for development
function createMockSystem(name: string) {
  return {
    name,
    getInstance: () => createMockSystem(name),
    initialize: async () => {
      console.log(`Mock ${name} initialized`);
      return true;
    },
    cleanup: async () => {
      console.log(`Mock ${name} cleaned up`);
    },
    isReady: () => true,
    isInitialized: () => true,
    getCurrentUser: () => null,
    getProfile: async () => null,
    loadProgressForUser: async () => null,
    updateSkillProgress: async () => {},
    setCurrentUser: () => {},
    getCurrentUserPortfolio: () => null,
    addXP: async () => {},
    saveArtwork: async () => 'mock_artwork_id',
  };
}

// FIXED: Unified user engine for enterprise architecture
class UserEngine {
  private static instance: UserEngine;

  private constructor() {}

  public static getInstance(): UserEngine {
    if (!UserEngine.instance) {
      UserEngine.instance = new UserEngine();
    }
    return UserEngine.instance;
  }

  public async initialize(): Promise<boolean> {
    try {
      // All user systems are singletons and initialize themselves
      console.log('👤 User Engine systems ready');
      return true;
    } catch (error) {
      console.error('❌ User Engine initialization failed:', error);
      return false;
    }
  }

  public async loadUserData(userId: string): Promise<{
    profile: any;
    progress: any;
    portfolio: any;
  }> {
    try {
      const [profile, progress] = await Promise.all([
        getProfileSystem().getProfile(userId),
        getProgressionSystem().loadProgressForUser(userId),
      ]);

      // Set current user for portfolio
      getPortfolioManager().setCurrentUser(userId);
      const portfolio = getPortfolioManager().getCurrentUserPortfolio();

      return { profile, progress, portfolio };
    } catch (error) {
      console.error('❌ Failed to load user data:', error);
      throw error;
    }
  }

  public isReady(): boolean {
    return !!(
      getProfileSystem() && 
      getProgressionSystem() && 
      getPortfolioManager()
    );
  }

  public getCurrentUser() {
    return getProfileSystem().getCurrentUser();
  }

  public async addXP(amount: number, source?: string): Promise<void> {
    await getProfileSystem().addXP(amount, source);
  }

  public async updateProgress(
    skillName: keyof ProgressData['skills'],
    xp: number,
    lessonCompleted: boolean = false
  ): Promise<void> {
    await getProgressionSystem().updateSkillProgress(skillName, xp, lessonCompleted);
  }

  public async saveArtwork(artworkData: any): Promise<string> {
    return getPortfolioManager().saveArtwork(artworkData);
  }
}

export const userEngine = UserEngine.getInstance();
export { UserEngine };

// Convenience function for initializing user engine
export async function initializeUserEngine(): Promise<boolean> {
  return userEngine.initialize();
}