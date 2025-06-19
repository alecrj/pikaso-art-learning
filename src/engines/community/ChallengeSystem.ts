// FIXED: src/engines/community/ChallengeSystem.ts

import { Challenge, ChallengeSubmission, User } from '../../types';
import { dataManager } from '../core/DataManager';
import { errorHandler } from '../core/ErrorHandler';
import { EventBus } from '../core/EventBus';

/**
 * COMMERCIAL GRADE CHALLENGE SYSTEM
 * 
 * ✅ FIXED ISSUES:
 * - Safe property access with optional chaining
 * - Default values for undefined properties
 * - Proper null checks throughout
 * - Enhanced error handling
 */
export class ChallengeSystem {
  private static instance: ChallengeSystem;
  private eventBus: EventBus = EventBus.getInstance();
  private challenges: Map<string, Challenge> = new Map();
  private userSubmissions: Map<string, ChallengeSubmission[]> = new Map();

  private constructor() {}

  public static getInstance(): ChallengeSystem {
    if (!ChallengeSystem.instance) {
      ChallengeSystem.instance = new ChallengeSystem();
    }
    return ChallengeSystem.instance;
  }

  // =================== CHALLENGE MANAGEMENT ===================

  public async getActiveChallenges(): Promise<Challenge[]> {
    try {
      const now = Date.now();
      const activeChallenges: Challenge[] = [];

      for (const challenge of this.challenges.values()) {
        if (challenge.startDate <= now && challenge.endDate >= now) {
          // FIXED: Ensure submissions array exists
          if (!challenge.submissions) {
            challenge.submissions = [];
          }
          activeChallenges.push(challenge);
        }
      }

      return activeChallenges.sort((a, b) => a.startDate - b.startDate);
    } catch (error) {
      console.error('Failed to get active challenges:', error);
      return [];
    }
  }

  public async getChallengeById(challengeId: string): Promise<Challenge | null> {
    try {
      const challenge = this.challenges.get(challengeId);
      if (!challenge) return null;

      // FIXED: Ensure all required properties exist
      return {
        ...challenge,
        submissions: challenge.submissions || [],
        theme: challenge.theme || 'General',
        participants: challenge.participants || 0,
        status: challenge.status || 'active',
      };
    } catch (error) {
      console.error('Failed to get challenge:', error);
      return null;
    }
  }

  public async createChallenge(challengeData: Omit<Challenge, 'id' | 'participants' | 'submissions'>): Promise<string> {
    try {
      const challengeId = `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const challenge: Challenge = {
        ...challengeData,
        id: challengeId,
        participants: 0,
        submissions: [], // FIXED: Always initialize submissions array
        theme: challengeData.theme || 'General', // FIXED: Provide default theme
        status: 'active',
      };

      this.challenges.set(challengeId, challenge);
      await this.saveChallenges();

      this.eventBus.emit('challenge:created', { challengeId, challenge });
      return challengeId;
    } catch (error) {
      console.error('Failed to create challenge:', error);
      throw error;
    }
  }

  // =================== SUBMISSION MANAGEMENT ===================

  public async submitToChallenge(challengeId: string, userId: string, artworkId: string): Promise<boolean> {
    try {
      const challenge = this.challenges.get(challengeId);
      if (!challenge) {
        throw new Error('Challenge not found');
      }

      // FIXED: Ensure submissions array exists
      if (!challenge.submissions) {
        challenge.submissions = [];
      }

      // Check if user already submitted
      const userSubmissionsForChallenge = challenge.submissions.filter(
        sub => sub.userId === userId
      );

      if (userSubmissionsForChallenge.length > 0) {
        throw new Error('User has already submitted to this challenge');
      }

      const submission: ChallengeSubmission = {
        id: `submission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        challengeId,
        userId,
        artworkId,
        submittedAt: Date.now(),
        votes: 0,
        featured: false,
      };

      // FIXED: Safe array operations
      challenge.submissions.push(submission);
      challenge.participants = new Set(challenge.submissions.map(s => s.userId)).size;

      await this.saveChallenges();

      this.eventBus.emit('challenge:submission_added', {
        challengeId,
        submissionId: submission.id,
        userId,
      });

      return true;
    } catch (error) {
      console.error('Failed to submit to challenge:', error);
      return false;
    }
  }

  public async voteOnSubmission(submissionId: string, userId: string): Promise<boolean> {
    try {
      for (const challenge of this.challenges.values()) {
        // FIXED: Safe property access
        if (!challenge.submissions) continue;

        const submission = challenge.submissions.find(s => s.id === submissionId);
        if (submission) {
          // Simple voting - in production you'd track who voted
          submission.votes = (submission.votes || 0) + 1;
          
          await this.saveChallenges();
          
          this.eventBus.emit('challenge:vote_added', {
            submissionId,
            userId,
            newVoteCount: submission.votes,
          });
          
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Failed to vote on submission:', error);
      return false;
    }
  }

  // =================== CHALLENGE ANALYTICS ===================

  public async getChallengeStats(challengeId: string): Promise<any> {
    try {
      const challenge = this.challenges.get(challengeId);
      if (!challenge) return null;

      // FIXED: Safe property access with defaults
      const submissions = challenge.submissions || [];
      
      const totalVotes = submissions.reduce((sum, sub) => sum + (sub.votes || 0), 0);
      const avgVotes = submissions.length > 0
        ? totalVotes / submissions.length
        : 0;

      return {
        totalSubmissions: submissions.length,
        totalVotes,
        avgVotes,
        participantCount: challenge.participants || 0,
        featured: submissions.filter(sub => sub.featured).length,
      };
    } catch (error) {
      console.error('Failed to get challenge stats:', error);
      return null;
    }
  }

  public async getPopularChallenges(limit: number = 10): Promise<Challenge[]> {
    try {
      const challenges = Array.from(this.challenges.values())
        .filter(challenge => challenge.submissions && challenge.submissions.length > 0)
        .sort((a, b) => (b.participants || 0) - (a.participants || 0))
        .slice(0, limit);

      return challenges;
    } catch (error) {
      console.error('Failed to get popular challenges:', error);
      return [];
    }
  }

  // =================== THEME ANALYTICS ===================

  public async getChallengesByTheme(): Promise<Record<string, Challenge[]>> {
    try {
      const themeGroups: Record<string, Challenge[]> = {};

      for (const challenge of this.challenges.values()) {
        // FIXED: Safe theme access with default
        const theme = challenge.theme || 'General';
        
        if (!themeGroups[theme]) {
          themeGroups[theme] = [];
        }
        themeGroups[theme].push(challenge);
      }

      return themeGroups;
    } catch (error) {
      console.error('Failed to group challenges by theme:', error);
      return {};
    }
  }

  public async getThemePopularity(): Promise<Array<{ theme: string; count: number }>> {
    try {
      const themeCount = new Map<string, number>();

      for (const challenge of this.challenges.values()) {
        // FIXED: Safe theme access with null check
        const theme = challenge.theme;
        if (theme) {
          const count = themeCount.get(theme) || 0;
          themeCount.set(theme, count + 1);
        }
      }

      return Array.from(themeCount.entries())
        .map(([theme, count]) => ({ theme, count }))
        .sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error('Failed to get theme popularity:', error);
      return [];
    }
  }

  // =================== DATA PERSISTENCE ===================

  private async saveChallenges(): Promise<void> {
    try {
      const challengesData = Array.from(this.challenges.values());
      await dataManager.set('challenges', challengesData);
    } catch (error) {
      console.error('Failed to save challenges:', error);
    }
  }

  public async loadChallenges(): Promise<void> {
    try {
      const challengesData = await dataManager.get<Challenge[]>('challenges') || [];
      
      this.challenges.clear();
      challengesData.forEach(challenge => {
        // FIXED: Ensure all required properties exist when loading
        const safeChallenge: Challenge = {
          ...challenge,
          submissions: challenge.submissions || [],
          theme: challenge.theme || 'General',
          participants: challenge.participants || 0,
          status: challenge.status || 'active',
        };
        this.challenges.set(challenge.id, safeChallenge);
      });

      console.log(`📚 Loaded ${challengesData.length} challenges`);
    } catch (error) {
      console.error('Failed to load challenges:', error);
    }
  }

  // =================== FEATURED CONTENT ===================

  public async featureSubmission(submissionId: string): Promise<boolean> {
    try {
      for (const challenge of this.challenges.values()) {
        // FIXED: Safe property access
        if (!challenge.submissions) continue;

        const submission = challenge.submissions.find(s => s.id === submissionId);
        if (submission) {
          submission.featured = true;
          await this.saveChallenges();
          
          this.eventBus.emit('challenge:submission_featured', {
            submissionId,
            challengeId: challenge.id,
          });
          
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Failed to feature submission:', error);
      return false;
    }
  }

  public async getFeaturedSubmissions(limit: number = 6): Promise<ChallengeSubmission[]> {
    try {
      const featured: ChallengeSubmission[] = [];

      for (const challenge of this.challenges.values()) {
        // FIXED: Safe property access
        const submissions = challenge.submissions || [];
        const challengeFeatured = submissions.filter(sub => sub.featured);
        featured.push(...challengeFeatured);
      }

      return featured
        .sort((a, b) => (b.votes || 0) - (a.votes || 0))
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get featured submissions:', error);
      return [];
    }
  }
}

// =================== FIXED PORTFOLIO MANAGER ===================

import { Artwork, Portfolio, UserProfile } from '../../types';

export class PortfolioManager {
  private static instance: PortfolioManager;
  private portfolios: Map<string, Portfolio> = new Map();

  private constructor() {}

  public static getInstance(): PortfolioManager {
    if (!PortfolioManager.instance) {
      PortfolioManager.instance = new PortfolioManager();
    }
    return PortfolioManager.instance;
  }

  // =================== ARTWORK MANAGEMENT ===================

  public async addArtwork(userId: string, artworkData: Omit<Artwork, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const artworkId = `artwork_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const artwork: Artwork = {
        ...artworkData,
        id: artworkId,
        userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        // FIXED: Ensure stats and metadata exist
        stats: artworkData.stats || {
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0,
        },
        metadata: artworkData.metadata || {
          drawingTime: 0,
          strokeCount: 0,
          layersUsed: 1,
          brushesUsed: [],
          canvasSize: { width: 800, height: 600 },
        },
      };

      const portfolio = await this.getOrCreatePortfolio(userId);
      portfolio.artworks.push(artwork);
      
      // FIXED: Safe stats updates
      portfolio.stats.totalArtworks = portfolio.artworks.length;
      portfolio.stats.totalLikes = portfolio.artworks.reduce((sum, art) => sum + (art.stats?.likes || 0), 0);
      portfolio.stats.totalViews = portfolio.artworks.reduce((sum, art) => sum + (art.stats?.views || 0), 0);

      await this.savePortfolio(portfolio);
      return artworkId;
    } catch (error) {
      console.error('Failed to add artwork:', error);
      throw error;
    }
  }

  public async incrementArtworkViews(artworkId: string): Promise<void> {
    try {
      const artwork = await this.findArtworkById(artworkId);
      if (artwork) {
        // FIXED: Safe property access and increment
        if (!artwork.stats) {
          artwork.stats = { views: 0, likes: 0, comments: 0, shares: 0 };
        }
        artwork.stats.views = (artwork.stats.views || 0) + 1;
        
        await this.updateArtworkInPortfolio(artwork);
      }
    } catch (error) {
      console.error('Failed to increment artwork views:', error);
    }
  }

  public async likeArtwork(artworkId: string): Promise<void> {
    try {
      const artwork = await this.findArtworkById(artworkId);
      if (artwork) {
        // FIXED: Safe property access and increment
        if (!artwork.stats) {
          artwork.stats = { views: 0, likes: 0, comments: 0, shares: 0 };
        }
        artwork.stats.likes = (artwork.stats.likes || 0) + 1;
        
        await this.updateArtworkInPortfolio(artwork);
      }
    } catch (error) {
      console.error('Failed to like artwork:', error);
    }
  }

  public async getUserPortfolio(userId?: string): Promise<Portfolio | null> {
    try {
      // If no userId provided, get current user's portfolio
      if (!userId) {
        const userProfile = await dataManager.getUserProfile();
        if (!userProfile) return null;
        userId = userProfile.id;
      }

      return await dataManager.getPortfolio(userId);
    } catch (error) {
      console.error('Failed to get user portfolio:', error);
      return null;
    }
  }

  // =================== PORTFOLIO ANALYTICS ===================

  public async getPortfolioAnalytics(userId: string): Promise<any> {
    try {
      const portfolio = await dataManager.getPortfolio(userId);
      if (!portfolio) return null;

      const artworks = portfolio.artworks || [];
      const brushUsage = new Map<string, number>();
      let totalDrawingTime = 0;
      let totalStrokes = 0;

      for (const artwork of artworks) {
        // FIXED: Safe metadata access
        const metadata = artwork.metadata;
        if (metadata) {
          if (metadata.brushesUsed) {
            metadata.brushesUsed.forEach(brush => {
              brushUsage.set(brush, (brushUsage.get(brush) || 0) + 1);
            });
          }
          
          totalDrawingTime += metadata.drawingTime || 0;
          totalStrokes += metadata.strokeCount || 0;
        }
      }

      return {
        totalArtworks: artworks.length,
        totalDrawingTime,
        totalStrokes,
        averageTimePerArtwork: artworks.length > 0 ? totalDrawingTime / artworks.length : 0,
        mostUsedBrushes: Array.from(brushUsage.entries())
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5),
        recentActivity: this.getRecentActivity(artworks),
      };
    } catch (error) {
      console.error('Failed to get portfolio analytics:', error);
      return null;
    }
  }

  public async getArtworkInsights(artworks: Artwork[]): Promise<any> {
    try {
      const skillAnalysis = new Map<string, { count: number; avgTimeSpent: number }>();

      for (const artwork of artworks) {
        // FIXED: Safe metadata access
        const metadata = artwork.metadata;
        if (!metadata) continue;

        const skill = artwork.tags?.[0] || 'general';
        const current = skillAnalysis.get(skill) || { count: 0, avgTimeSpent: 0 };
        
        current.count += 1;
        current.avgTimeSpent = (current.avgTimeSpent * (current.count - 1) + (metadata.drawingTime || 0)) / current.count;

        // Calculate complexity score
        const complexity = (metadata.layersUsed || 1) * 2 + (metadata.strokeCount || 0) / 100;
        
        skillAnalysis.set(skill, { ...current, complexity });
      }

      return {
        skillBreakdown: Array.from(skillAnalysis.entries()),
        improvementAreas: this.identifyImprovementAreas(skillAnalysis),
        achievements: this.calculateAchievements(artworks),
      };
    } catch (error) {
      console.error('Failed to get artwork insights:', error);
      return null;
    }
  }

  // =================== HELPER METHODS ===================

  private async getOrCreatePortfolio(userId: string): Promise<Portfolio> {
    let portfolio = await dataManager.getPortfolio(userId);
    
    if (!portfolio) {
      portfolio = {
        id: `portfolio_${userId}`,
        userId,
        artworks: [],
        collections: [],
        stats: {
          totalArtworks: 0,
          totalLikes: 0,
          totalViews: 0,
          followerCount: 0,
        },
        settings: {
          publicProfile: true,
          showProgress: true,
          allowComments: true,
        },
      };
    }

    return portfolio;
  }

  private async findArtworkById(artworkId: string): Promise<Artwork | null> {
    try {
      // Search through all portfolios (in production, you'd have an artwork index)
      const userProfile = await dataManager.getUserProfile();
      if (!userProfile) return null;

      const portfolio = await dataManager.getPortfolio(userProfile.id);
      if (!portfolio) return null;

      return portfolio.artworks.find(art => art.id === artworkId) || null;
    } catch (error) {
      console.error('Failed to find artwork:', error);
      return null;
    }
  }

  private async updateArtworkInPortfolio(artwork: Artwork): Promise<void> {
    try {
      const portfolio = await dataManager.getPortfolio(artwork.userId);
      if (!portfolio) return;

      const index = portfolio.artworks.findIndex(art => art.id === artwork.id);
      if (index >= 0) {
        portfolio.artworks[index] = artwork;
        await dataManager.savePortfolio(portfolio);
      }
    } catch (error) {
      console.error('Failed to update artwork in portfolio:', error);
    }
  }

  private async savePortfolio(portfolio: Portfolio): Promise<void> {
    try {
      await dataManager.savePortfolio(portfolio);
      this.portfolios.set(portfolio.userId, portfolio);
    } catch (error) {
      console.error('Failed to save portfolio:', error);
      throw error;
    }
  }

  private getRecentActivity(artworks: Artwork[]): any[] {
    return artworks
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10)
      .map(artwork => ({
        type: 'artwork_created',
        artworkId: artwork.id,
        title: artwork.title,
        timestamp: artwork.createdAt,
      }));
  }

  private identifyImprovementAreas(skillAnalysis: Map<string, any>): string[] {
    const areas: string[] = [];
    
    for (const [skill, data] of skillAnalysis.entries()) {
      if (data.avgTimeSpent < 300000) { // Less than 5 minutes
        areas.push(`Spend more time on ${skill}`);
      }
      if (data.complexity < 5) {
        areas.push(`Try more complex ${skill} exercises`);
      }
    }
    
    return areas.slice(0, 3);
  }

  private calculateAchievements(artworks: Artwork[]): string[] {
    const achievements: string[] = [];
    
    if (artworks.length >= 10) achievements.push('Prolific Artist');
    if (artworks.length >= 50) achievements.push('Master Creator');
    
    const totalLikes = artworks.reduce((sum, art) => sum + (art.stats?.likes || 0), 0);
    if (totalLikes >= 100) achievements.push('Community Favorite');
    
    return achievements;
  }
}

// Export singleton instances
export const challengeSystem = ChallengeSystem.getInstance();
export const portfolioManager = PortfolioManager.getInstance();