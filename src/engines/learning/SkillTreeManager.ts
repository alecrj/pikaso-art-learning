import { SkillTree, Lesson, LearningProgress, SkillTreeProgress } from '../../types';
import { dataManager } from '../core/DataManager';
import { errorHandler } from '../core/ErrorHandler';
import { EventBus } from '../core/EventBus';
import { getFundamentalLessons } from '../../content/lessons/fundamentals';

/**
 * Skill Tree Manager - Manages learning paths and progression
 * FIXED: Added initialize method and proper async initialization
 */
export class SkillTreeManager {
  private static instance: SkillTreeManager;
  private eventBus: EventBus = EventBus.getInstance();
  
  private skillTrees: Map<string, SkillTree> = new Map();
  private lessons: Map<string, Lesson> = new Map();
  private learningProgress: LearningProgress | null = null;
  private progressSubscribers: ((progress: LearningProgress) => void)[] = [];
  private isInitialized: boolean = false;
  
  private constructor() {
    // Don't initialize content in constructor - use initialize() method
  }

  public static getInstance(): SkillTreeManager {
    if (!SkillTreeManager.instance) {
      SkillTreeManager.instance = new SkillTreeManager();
    }
    return SkillTreeManager.instance;
  }

  // FIXED: Added missing initialize method
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('SkillTreeManager already initialized');
      return;
    }

    try {
      console.log('🎓 Initializing SkillTreeManager...');
      
      // Initialize content first
      await this.initializeContent();
      
      // Load saved progress
      await this.loadProgress();
      
      this.isInitialized = true;
      console.log(`✅ SkillTreeManager initialized with ${this.skillTrees.size} skill trees and ${this.lessons.size} lessons`);
      
      // Emit initialization complete event
      this.eventBus.emit('skillTree:initialized', {
        skillTreeCount: this.skillTrees.size,
        lessonCount: this.lessons.size
      });
      
    } catch (error) {
      console.error('❌ Failed to initialize SkillTreeManager:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  private async initializeContent(): Promise<void> {
    try {
      // Initialize Drawing Fundamentals skill tree with real lessons
      const fundamentalLessons = getFundamentalLessons();
      
      const drawingFundamentals: SkillTree = {
        id: 'drawing-fundamentals',
        name: 'Drawing Fundamentals',
        description: 'Master the essential skills every artist needs',
        category: 'Foundation',
        order: 1,
        lessons: fundamentalLessons,
        prerequisites: [],
        totalXP: fundamentalLessons.reduce((sum, lesson) => sum + (lesson.rewards?.xp || 0), 0),
        estimatedDuration: fundamentalLessons.reduce((sum, lesson) => sum + lesson.estimatedTime, 0),
        difficultyLevel: 'beginner',
        progress: 0,
        iconUrl: '🎨',
      };
      
      this.skillTrees.set(drawingFundamentals.id, drawingFundamentals);
      
      // Index all lessons for quick lookup
      fundamentalLessons.forEach(lesson => {
        this.lessons.set(lesson.id, lesson);
      });
      
      // Add more skill trees as content expands
      this.addPlannedSkillTrees();
      
    } catch (error) {
      console.error('Failed to initialize content:', error);
      throw error;
    }
  }

  private addPlannedSkillTrees(): void {
    // Placeholder for future skill trees
    const plannedTrees = [
      {
        id: 'human-anatomy',
        name: 'Human Anatomy',
        description: 'Learn to draw the human figure with correct proportions',
        category: 'Advanced',
        order: 2,
        lessons: [],
        prerequisites: ['drawing-fundamentals'],
        totalXP: 0,
        estimatedDuration: 0,
        difficultyLevel: 'intermediate' as const,
        progress: 0,
        iconUrl: '🧍',
      },
      {
        id: 'digital-techniques',
        name: 'Digital Techniques',
        description: 'Master digital drawing tools and workflows',
        category: 'Digital',
        order: 3,
        lessons: [],
        prerequisites: ['drawing-fundamentals'],
        totalXP: 0,
        estimatedDuration: 0,
        difficultyLevel: 'intermediate' as const,
        progress: 0,
        iconUrl: '💻',
      },
    ];
    
    // Add planned trees (empty for now)
    plannedTrees.forEach(tree => {
      this.skillTrees.set(tree.id, tree);
    });
  }

  private async loadProgress(): Promise<void> {
    try {
      const savedProgress = await dataManager.get<LearningProgress>('learning_progress');
      
      if (savedProgress) {
        this.learningProgress = savedProgress;
        console.log('✅ Loaded existing learning progress');
      } else {
        // Initialize new progress
        this.learningProgress = {
          userId: 'current-user',
          currentLevel: 1,
          totalXP: 0,
          completedLessons: [],
          skillTrees: [],
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: new Date().toISOString(),
          achievements: [],
          preferences: {
            dailyGoal: 1,
            difficulty: 'adaptive',
          },
          dailyProgress: 0,
          dailyGoal: 1,
        };
        
        console.log('✅ Created new learning progress');
        await this.saveProgress();
      }
      
      this.notifyProgressSubscribers();
    } catch (error) {
      console.error('Failed to load learning progress:', error);
      errorHandler.handleError(
        errorHandler.createError('PROGRESS_LOAD_ERROR', 'Failed to load learning progress', 'medium', error)
      );
    }
  }

  // Public API - FIXED: Added safety checks for initialization

  public getAllSkillTrees(): SkillTree[] {
    if (!this.isInitialized) {
      console.warn('SkillTreeManager not initialized yet');
      return [];
    }
    return Array.from(this.skillTrees.values());
  }

  public getAvailableSkillTrees(): SkillTree[] {
    if (!this.learningProgress || !this.isInitialized) return [];
    
    return this.getAllSkillTrees().filter(tree => {
      // First tree is always available
      if (tree.prerequisites.length === 0) return true;
      
      // Check if prerequisites are met
      return tree.prerequisites.every(prereq => {
        const prereqTree = this.skillTrees.get(prereq);
        if (!prereqTree) return false;
        
        const progress = this.getSkillTreeProgress(prereq);
        return progress.completionPercentage >= 80; // 80% completion unlocks next tree
      });
    });
  }

  public getSkillTree(skillTreeId: string): SkillTree | null {
    return this.skillTrees.get(skillTreeId) || null;
  }

  public getAllLessons(): Lesson[] {
    if (!this.isInitialized) return [];
    return Array.from(this.lessons.values());
  }

  public getLesson(lessonId: string): Lesson | null {
    return this.lessons.get(lessonId) || null;
  }

  public getAvailableLessons(skillTreeId?: string): Lesson[] {
    if (!this.learningProgress || !this.isInitialized) return [];
    
    let lessons: Lesson[] = [];
    
    if (skillTreeId) {
      const tree = this.skillTrees.get(skillTreeId);
      lessons = tree?.lessons || [];
    } else {
      lessons = this.getAllLessons();
    }
    
    return lessons.filter(lesson => {
      // Check if prerequisites are completed
      return this.checkUnlockRequirements(lesson.id);
    });
  }

  public getUnlockedLessons(): Lesson[] {
    return this.getAvailableLessons();
  }

  public checkUnlockRequirements(lessonId: string): boolean {
    const lesson = this.lessons.get(lessonId);
    if (!lesson || !this.learningProgress) return false;
    
    // First lesson in a tree is always available if tree is available
    if (lesson.prerequisites.length === 0) {
      const tree = this.skillTrees.get(lesson.skillTree);
      if (!tree) return false;
      return this.getAvailableSkillTrees().includes(tree);
    }
    
    // Check if all prerequisites are completed
    return lesson.prerequisites.every(prereq => 
      this.learningProgress!.completedLessons.includes(prereq)
    );
  }

  public async completeLesson(lessonId: string, score: number = 100): Promise<void> {
    if (!this.learningProgress) return;
    
    try {
      const lesson = this.lessons.get(lessonId);
      if (!lesson) return;
      
      // Add to completed lessons if not already there
      if (!this.learningProgress.completedLessons.includes(lessonId)) {
        this.learningProgress.completedLessons.push(lessonId);
        this.learningProgress.totalXP += lesson.rewards?.xp || 0;
        
        // Update skill tree progress
        const treeProgress = this.getOrCreateSkillTreeProgress(lesson.skillTree);
        treeProgress.completedLessons.push(lessonId);
        treeProgress.totalXpEarned += lesson.rewards?.xp || 0;
        treeProgress.lastActivityDate = new Date().toISOString();
        
        // Calculate completion percentage
        const tree = this.skillTrees.get(lesson.skillTree);
        if (tree) {
          treeProgress.completionPercentage = (treeProgress.completedLessons.length / tree.lessons.length) * 100;
        }
        
        // Update daily progress
        this.learningProgress.dailyProgress++;
        this.learningProgress.lastActivityDate = new Date().toISOString();
        
        // Save progress
        await this.saveProgress();
        
        // Emit events
        this.eventBus.emit('lesson:completed', { lessonId, score });
        
        // Check for achievements
        this.checkAchievements();
        
        // Notify subscribers
        this.notifyProgressSubscribers();
      }
    } catch (error) {
      errorHandler.handleError(
        errorHandler.createError('LESSON_COMPLETE_ERROR', 'Failed to complete lesson', 'medium', error)
      );
    }
  }

  public getSkillTreeProgress(skillTreeId: string): SkillTreeProgress {
    if (!this.learningProgress) {
      return {
        skillTreeId,
        completedLessons: [],
        totalXpEarned: 0,
        completionPercentage: 0,
        lastActivityDate: new Date().toISOString(),
      };
    }
    
    let progress = this.learningProgress.skillTrees.find(st => st.skillTreeId === skillTreeId);
    
    if (!progress) {
      progress = {
        skillTreeId,
        completedLessons: [],
        totalXpEarned: 0,
        completionPercentage: 0,
        lastActivityDate: new Date().toISOString(),
      };
      this.learningProgress.skillTrees.push(progress);
    }
    
    return progress;
  }

  private getOrCreateSkillTreeProgress(skillTreeId: string): SkillTreeProgress {
    return this.getSkillTreeProgress(skillTreeId);
  }

  public getRecommendedNextLesson(): Lesson | null {
    const availableLessons = this.getAvailableLessons();
    
    // Find the first uncompleted lesson
    const nextLesson = availableLessons.find(lesson => 
      !this.learningProgress?.completedLessons.includes(lesson.id)
    );
    
    return nextLesson || null;
  }

  public getRecommendedLessons(count: number = 3): string[] {
    const availableLessons = this.getAvailableLessons();
    const uncompleted = availableLessons.filter(lesson => 
      !this.learningProgress?.completedLessons.includes(lesson.id)
    );
    
    return uncompleted.slice(0, count).map(lesson => lesson.id);
  }

  public getOverallProgress(): {
    totalLessonsCompleted: number;
    totalLessonsAvailable: number;
    totalXpEarned: number;
    completionPercentage: number;
    currentStreak: number;
  } {
    if (!this.learningProgress) {
      return {
        totalLessonsCompleted: 0,
        totalLessonsAvailable: this.lessons.size,
        totalXpEarned: 0,
        completionPercentage: 0,
        currentStreak: 0,
      };
    }
    
    return {
      totalLessonsCompleted: this.learningProgress.completedLessons.length,
      totalLessonsAvailable: this.lessons.size,
      totalXpEarned: this.learningProgress.totalXP,
      completionPercentage: (this.learningProgress.completedLessons.length / this.lessons.size) * 100,
      currentStreak: this.learningProgress.currentStreak,
    };
  }

  public subscribeToProgress(callback: (progress: LearningProgress) => void): () => void {
    this.progressSubscribers.push(callback);
    
    // Immediately notify with current progress
    if (this.learningProgress) {
      callback(this.learningProgress);
    }
    
    // Return unsubscribe function
    return () => {
      const index = this.progressSubscribers.indexOf(callback);
      if (index > -1) {
        this.progressSubscribers.splice(index, 1);
      }
    };
  }

  // FIXED: Added missing methods for compatibility
  public getLessonProgress(lessonId: string): number {
    if (!this.learningProgress) return 0;
    return this.learningProgress.completedLessons.includes(lessonId) ? 100 : 0;
  }

  public isInitializedReady(): boolean {
    return this.isInitialized;
  }

  private notifyProgressSubscribers(): void {
    if (!this.learningProgress) return;
    
    this.progressSubscribers.forEach(callback => {
      callback(this.learningProgress!);
    });
  }

  private async saveProgress(): Promise<void> {
    if (!this.learningProgress) return;
    
    try {
      await dataManager.set('learning_progress', this.learningProgress);
    } catch (error) {
      errorHandler.handleError(
        errorHandler.createError('PROGRESS_SAVE_ERROR', 'Failed to save learning progress', 'medium', error)
      );
    }
  }

  private checkAchievements(): void {
    if (!this.learningProgress) return;
    
    // First lesson achievement
    if (this.learningProgress.completedLessons.length === 1) {
      this.eventBus.emit('achievement:unlocked', { 
        achievementId: 'first_lesson',
        title: 'First Steps',
        description: 'Completed your first lesson!',
      });
    }
    
    // Skill tree completion
    this.skillTrees.forEach(tree => {
      const progress = this.getSkillTreeProgress(tree.id);
      if (progress.completionPercentage === 100) {
        this.eventBus.emit('achievement:unlocked', { 
          achievementId: `complete_${tree.id}`,
          title: `${tree.name} Master`,
          description: `Completed all lessons in ${tree.name}!`,
        });
      }
    });
  }

  // Helper methods for learning statistics
  public getLearningStats(): {
    totalStudyTime: number;
    averageScore: number;
    strongestSkills: string[];
    improvementAreas: string[];
  } {
    // This would analyze performance data
    return {
      totalStudyTime: 0, // Would track from lesson timestamps
      averageScore: 85, // Would calculate from assessment scores
      strongestSkills: ['Line Control', 'Basic Shapes'],
      improvementAreas: ['Perspective', 'Shading'],
    };
  }
}

// Export singleton instance
export const skillTreeManager = SkillTreeManager.getInstance();