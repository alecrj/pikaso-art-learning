// src/engines/user/PortfolioManager.ts - ENTERPRISE GRADE FIXED VERSION
import { Artwork, Layer, Collection } from '../../types';
import { EventBus } from '../core/EventBus';
import { errorHandler } from '../core/ErrorHandler';
import { dataManager } from '../core/DataManager';

interface Portfolio {
  id: string;
  userId: string;
  artworks: Artwork[];
  collections: Collection[];
  stats: {
    totalArtworks: number;
    publicArtworks: number;
    totalLikes: number;
    totalViews: number;
    averageTimeSpent: number;
    followerCount: number;
  };
  settings: {
    publicProfile: boolean;
    showProgress: boolean;
    allowComments: boolean;
  };
}

/**
 * ENTERPRISE PORTFOLIO MANAGER
 * 
 * ✅ FIXED ISSUES:
 * - Smart user context detection with explicit override capability
 * - Proper null/undefined handling with type safety
 * - Guest user support for non-authenticated scenarios
 * - Enterprise-level error handling and recovery
 * - Comprehensive analytics and performance tracking
 */
export class PortfolioManager {
  private static instance: PortfolioManager;
  private eventBus: EventBus = EventBus.getInstance();
  
  // Portfolio storage
  private portfolios: Map<string, Portfolio> = new Map();
  private artworks: Map<string, Artwork> = new Map();
  
  // User context management
  private currentUserId: string | null = null;
  private guestUserCounter: number = 0;
  
  // Analytics
  private artworkAnalytics: Map<string, {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    averageViewTime: number;
  }> = new Map();
  
  // Like tracking with comprehensive user mapping
  private userLikes: Map<string, Set<string>> = new Map(); // userId -> Set of liked artworkIds
  
  private constructor() {
    this.loadPortfolios();
    this.initializeGuestUser();
  }

  public static getInstance(): PortfolioManager {
    if (!PortfolioManager.instance) {
      PortfolioManager.instance = new PortfolioManager();
    }
    return PortfolioManager.instance;
  }

  // =================== USER CONTEXT MANAGEMENT ===================

  /**
   * Set the current authenticated user
   * Enterprise pattern: Supports both authenticated and guest users
   */
  public setCurrentUser(userId: string): void {
    this.currentUserId = userId;
    console.log(`📝 Portfolio Manager: Current user set to ${userId}`);
  }

  /**
   * Get current user ID with smart fallback to guest user
   * Enterprise pattern: Never fails, always returns a valid user ID
   */
  private getCurrentUserId(): string {
    if (this.currentUserId) {
      return this.currentUserId;
    }
    
    // Create guest user if none exists
    if (!this.currentUserId) {
      this.currentUserId = `guest_${Date.now()}_${this.guestUserCounter++}`;
      console.log(`👤 Created guest user: ${this.currentUserId}`);
    }
    
    return this.currentUserId;
  }

  /**
   * Initialize guest user for non-authenticated scenarios
   */
  private initializeGuestUser(): void {
    // Check if we have a stored guest user
    const storedGuestId = localStorage?.getItem('pikaso_guest_user_id');
    if (storedGuestId) {
      this.currentUserId = storedGuestId;
    } else {
      this.currentUserId = `guest_${Date.now()}_${this.guestUserCounter++}`;
      localStorage?.setItem('pikaso_guest_user_id', this.currentUserId);
    }
  }

  // =================== PORTFOLIO MANAGEMENT ===================

  public createPortfolio(userId?: string): Portfolio {
    const targetUserId = userId || this.getCurrentUserId();
    
    const portfolio: Portfolio = {
      id: `portfolio_${targetUserId}`,
      userId: targetUserId,
      artworks: [],
      collections: [],
      stats: {
        totalArtworks: 0,
        publicArtworks: 0,
        totalLikes: 0,
        totalViews: 0,
        averageTimeSpent: 0,
        followerCount: 0,
      },
      settings: {
        publicProfile: true,
        showProgress: true,
        allowComments: true,
      },
    };
    
    this.portfolios.set(targetUserId, portfolio);
    this.savePortfolios();
    
    this.eventBus.emit('portfolio:created', { portfolio });
    return portfolio;
  }

  /**
   * FIXED: Returns Portfolio | null (not undefined) for type safety
   * Enterprise pattern: Consistent return types across all methods
   */
  public getUserPortfolio(userId?: string): Portfolio | null {
    const targetUserId = userId || this.getCurrentUserId();
    let portfolio = this.portfolios.get(targetUserId);
    
    // Auto-create portfolio if doesn't exist
    if (!portfolio) {
      portfolio = this.createPortfolio(targetUserId);
    }
    
    return portfolio; // Always returns Portfolio | null, never undefined
  }

  public addArtwork(artworkData: Omit<Artwork, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, userId?: string): Artwork {
    const targetUserId = userId || this.getCurrentUserId();
    const portfolio = this.getUserPortfolio(targetUserId);
    
    if (!portfolio) {
      throw new Error(`Portfolio not found for user: ${targetUserId}`);
    }

    const artwork: Artwork = {
      ...artworkData,
      id: `artwork_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: targetUserId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      stats: {
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
      },
      metadata: {
        drawingTime: artworkData.metadata?.drawingTime || 0,
        strokeCount: artworkData.metadata?.strokeCount || 0,
        layersUsed: artworkData.metadata?.layersUsed || 1,
        brushesUsed: artworkData.metadata?.brushesUsed || [],
        canvasSize: artworkData.metadata?.canvasSize || { width: 1024, height: 768 },
      },
    };

    // Generate thumbnail and image URLs
    artwork.thumbnail = artwork.thumbnail || `thumbnail_${artwork.id}`;
    artwork.imageUrl = artwork.imageUrl || `full_${artwork.id}`;

    // Store artwork
    this.artworks.set(artwork.id, artwork);
    portfolio.artworks.push(artwork);
    
    // Update portfolio stats
    portfolio.stats.totalArtworks++;
    if (artwork.visibility === 'public') {
      portfolio.stats.publicArtworks++;
    }

    // Initialize analytics
    this.artworkAnalytics.set(artwork.id, {
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      averageViewTime: 0,
    });

    this.savePortfolios();
    this.eventBus.emit('artwork:created', { artwork, userId: targetUserId });

    return artwork;
  }

  // =================== ENGAGEMENT METHODS ===================

  /**
   * FIXED: Smart like system with automatic user detection
   * Enterprise pattern: Primary method uses context, explicit override available
   */
  public async likeArtwork(artworkId: string, userId?: string): Promise<boolean> {
    try {
      const targetUserId = userId || this.getCurrentUserId();
      const artwork = this.artworks.get(artworkId);
      
      if (!artwork) {
        console.warn(`Artwork not found: ${artworkId}`);
        return false;
      }

      // Initialize user likes set if doesn't exist
      if (!this.userLikes.has(targetUserId)) {
        this.userLikes.set(targetUserId, new Set());
      }

      const userLikesSet = this.userLikes.get(targetUserId)!;
      
      // Check if already liked
      if (userLikesSet.has(artworkId)) {
        // Unlike
        userLikesSet.delete(artworkId);
        
        // Safe stats decrement
        if (artwork.stats) {
          artwork.stats.likes = Math.max(0, artwork.stats.likes - 1);
        }
        
        // Update analytics
        const analytics = this.artworkAnalytics.get(artworkId);
        if (analytics) {
          analytics.likes = Math.max(0, analytics.likes - 1);
        }
        
        // Update portfolio stats
        const portfolio = this.portfolios.get(artwork.userId);
        if (portfolio) {
          portfolio.stats.totalLikes = Math.max(0, portfolio.stats.totalLikes - 1);
        }
        
        await this.savePortfolios();
        this.eventBus.emit('artwork:unliked', { artworkId, userId: targetUserId });
        return false;
        
      } else {
        // Like
        userLikesSet.add(artworkId);
        
        // Safe stats increment
        if (!artwork.stats) {
          artwork.stats = { views: 0, likes: 0, comments: 0, shares: 0 };
        }
        artwork.stats.likes++;
        
        // Update analytics
        const analytics = this.artworkAnalytics.get(artworkId);
        if (analytics) {
          analytics.likes++;
        }
        
        // Update portfolio stats
        const portfolio = this.portfolios.get(artwork.userId);
        if (portfolio) {
          portfolio.stats.totalLikes++;
        }
        
        await this.savePortfolios();
        this.eventBus.emit('artwork:liked', { artworkId, userId: targetUserId });
        return true;
      }
    } catch (error) {
      console.error('Failed to like/unlike artwork:', error);
      errorHandler.handleError(errorHandler.createError(
        'ARTWORK_LIKE_ERROR',
        `Failed to like artwork ${artworkId}`,
        'medium',
        { artworkId, userId, error }
      ));
      return false;
    }
  }

  /**
   * FIXED: Smart view tracking with automatic user detection
   */
  public async incrementArtworkViews(artworkId: string, viewerId?: string): Promise<void> {
    try {
      const targetViewerId = viewerId || this.getCurrentUserId();
      const artwork = this.artworks.get(artworkId);
      
      if (!artwork) {
        console.warn(`Artwork not found for view increment: ${artworkId}`);
        return;
      }

      // Don't count views from the artwork owner
      if (targetViewerId === artwork.userId) {
        return;
      }

      // Update artwork stats with null safety
      if (!artwork.stats) {
        artwork.stats = { views: 0, likes: 0, comments: 0, shares: 0 };
      }
      artwork.stats.views++;

      // Update analytics
      const analytics = this.artworkAnalytics.get(artworkId);
      if (analytics) {
        analytics.views++;
      }

      // Update portfolio stats
      const portfolio = this.portfolios.get(artwork.userId);
      if (portfolio) {
        portfolio.stats.totalViews++;
      }

      await this.savePortfolios();
      this.eventBus.emit('artwork:viewed', { 
        artworkId, 
        userId: targetViewerId,
        timestamp: Date.now() 
      });
    } catch (error) {
      console.error('Failed to increment artwork views:', error);
      errorHandler.handleError(errorHandler.createError(
        'ARTWORK_VIEW_ERROR',
        `Failed to increment views for artwork ${artworkId}`,
        'low',
        { artworkId, viewerId, error }
      ));
    }
  }

  /**
   * Check if user has liked an artwork
   */
  public hasUserLikedArtwork(artworkId: string, userId?: string): boolean {
    const targetUserId = userId || this.getCurrentUserId();
    const userLikesSet = this.userLikes.get(targetUserId);
    return userLikesSet ? userLikesSet.has(artworkId) : false;
  }

  // =================== ARTWORK RETRIEVAL ===================

  public getArtwork(artworkId: string): Artwork | null {
    return this.artworks.get(artworkId) || null;
  }

  public getUserArtworks(userId?: string): Artwork[] {
    const targetUserId = userId || this.getCurrentUserId();
    const portfolio = this.getUserPortfolio(targetUserId);
    return portfolio ? portfolio.artworks : [];
  }

  public getRecentArtworks(userId?: string, limit: number = 10): Artwork[] {
    const artworks = this.getUserArtworks(userId);
    return artworks
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  public getPublicArtworks(userId?: string): Artwork[] {
    const artworks = this.getUserArtworks(userId);
    return artworks
      .filter(artwork => artwork.visibility === 'public')
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  // =================== DATA PERSISTENCE ===================

  private async loadPortfolios(): Promise<void> {
    try {
      const savedPortfolios = await dataManager.get<Record<string, Portfolio>>('portfolios');
      if (savedPortfolios) {
        Object.entries(savedPortfolios).forEach(([userId, portfolio]) => {
          this.portfolios.set(userId, portfolio);
          
          // Rebuild artwork map
          portfolio.artworks.forEach(artwork => {
            this.artworks.set(artwork.id, artwork);
          });
        });
      }

      const savedAnalytics = await dataManager.get<any>('artwork_analytics');
      if (savedAnalytics) {
        Object.entries(savedAnalytics).forEach(([artworkId, analytics]) => {
          this.artworkAnalytics.set(artworkId, analytics as any);
        });
      }

      // Load user likes
      const savedLikes = await dataManager.get<Record<string, string[]>>('user_likes');
      if (savedLikes) {
        Object.entries(savedLikes).forEach(([userId, likes]) => {
          this.userLikes.set(userId, new Set(likes));
        });
      }

      console.log(`📚 Loaded ${this.portfolios.size} portfolios with ${this.artworks.size} artworks`);
    } catch (error) {
      console.error('Failed to load portfolios:', error);
      errorHandler.handleError(errorHandler.createError(
        'PORTFOLIO_LOAD_ERROR',
        'Failed to load portfolio data',
        'high',
        { error }
      ));
    }
  }

  private async savePortfolios(): Promise<void> {
    try {
      const portfoliosObj: Record<string, Portfolio> = {};
      this.portfolios.forEach((portfolio, userId) => {
        portfoliosObj[userId] = portfolio;
      });
      await dataManager.set('portfolios', portfoliosObj);

      const analyticsObj: Record<string, any> = {};
      this.artworkAnalytics.forEach((analytics, artworkId) => {
        analyticsObj[artworkId] = analytics;
      });
      await dataManager.set('artwork_analytics', analyticsObj);

      // Save user likes
      const likesObj: Record<string, string[]> = {};
      this.userLikes.forEach((likes, userId) => {
        likesObj[userId] = Array.from(likes);
      });
      await dataManager.set('user_likes', likesObj);
    } catch (error) {
      console.error('Failed to save portfolios:', error);
      errorHandler.handleError(errorHandler.createError(
        'PORTFOLIO_SAVE_ERROR',
        'Failed to save portfolio data',
        'high',
        { error }
      ));
    }
  }

  // =================== BACKWARDS COMPATIBILITY ===================

  /**
   * Legacy method support for existing code
   */
  public recordArtworkView(artworkId: string, userId?: string): void {
    this.incrementArtworkViews(artworkId, userId);
  }

  public recordArtworkLike(artworkId: string, userId?: string): void {
    this.likeArtwork(artworkId, userId);
  }
}

// Export singleton instance
export const portfolioManager = PortfolioManager.getInstance();