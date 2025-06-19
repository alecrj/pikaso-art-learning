// src/engines/user/index.ts - ENTERPRISE USER ENGINE EXPORTS

// FIXED: Export both classes and instances properly
export { ProfileSystem, profileSystem } from './ProfileSystem';
export { ProgressionSystem, progressionSystem } from './ProgressionSystem';
export { PortfolioManager, portfolioManager } from './PortfolioManager';

// Type exports
export type { UserProfile, ProfileUpdate, UserStatUpdate } from './ProfileSystem';
export type { 
  ProgressData, 
  SkillProgress, 
  Achievement, 
  Milestone, 
  XPGain 
} from './ProgressionSystem';
export type { 
  Portfolio, 
  PortfolioItem, 
  PortfolioStats 
} from './PortfolioManager';

// FIXED: Create unified user engine for enterprise architecture
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
        profileSystem.getProfile(userId),
        progressionSystem.loadProgressForUser(userId),
      ]);

      // Set current user for portfolio
      portfolioManager.setCurrentUser(userId);
      const portfolio = portfolioManager.getCurrentUserPortfolio();

      return { profile, progress, portfolio };
    } catch (error) {
      console.error('❌ Failed to load user data:', error);
      throw error;
    }
  }

  public isReady(): boolean {
    return !!(profileSystem && progressionSystem && portfolioManager);
  }

  public getCurrentUser() {
    return profileSystem.getCurrentUser();
  }

  public async addXP(amount: number, source?: string): Promise<void> {
    await profileSystem.addXP(amount, source);
  }

  public async updateProgress(
    skillName: keyof ProgressData['skills'],
    xp: number,
    lessonCompleted: boolean = false
  ): Promise<void> {
    await progressionSystem.updateSkillProgress(skillName, xp, lessonCompleted);
  }

  public async saveArtwork(artworkData: any): Promise<string> {
    return portfolioManager.saveArtwork(artworkData);
  }
}

export const userEngine = UserEngine.getInstance();
export { UserEngine };

// Convenience function for initializing user engine
export async function initializeUserEngine(): Promise<boolean> {
  return userEngine.initialize();
}