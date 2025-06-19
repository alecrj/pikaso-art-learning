// src/types/index.ts - ENTERPRISE UNIFIED TYPE SYSTEM

import { SkPath, SkImage } from '@shopify/react-native-skia';
import { ReactNode } from 'react';

// ========================== CORE TYPES ==========================

export interface Point {
  x: number;
  y: number;
  pressure?: number;
  tiltX?: number;
  tiltY?: number;
  timestamp: number;
}

export interface Color {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsb: { h: number; s: number; b: number };
  alpha: number;
}

// ========================== INITIALIZATION TYPES ==========================

export interface InitializationResult {
  success: boolean;
  initializedSystems: string[];
  failedSystems: string[];
  warnings: string[];
  errors: string[];  // FIXED: Added missing errors property
  duration: number;
  healthStatus: 'healthy' | 'degraded' | 'unhealthy';
}

// ========================== ERROR TYPES ==========================

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// FIXED: Comprehensive error categories for enterprise scale
export type ErrorCategory = 
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'PERMISSION_ERROR'
  | 'STORAGE_ERROR'
  | 'INITIALIZATION_ERROR'
  | 'DRAWING_ERROR'
  | 'LEARNING_ERROR'
  | 'USER_ERROR'
  | 'COMMUNITY_ERROR'
  | 'UNKNOWN_ERROR'
  // Additional categories for complete coverage
  | 'STORAGE_SAVE_ERROR'
  | 'USER_INIT_ERROR'
  | 'CHALLENGE_FETCH_ERROR'
  | 'CHALLENGE_CREATE_ERROR'
  | 'USER_STATS_ERROR'
  | 'SUBMISSION_ERROR'
  | 'VOTING_ERROR'
  | 'STATS_ERROR'
  | 'SAVE_ERROR'
  | 'LOAD_ERROR'
  | 'PROGRESS_LOAD_ERROR'
  | 'LESSON_COMPLETE_ERROR'
  | 'PROGRESS_SAVE_ERROR'
  | 'ARTWORK_LIKE_ERROR'
  | 'ARTWORK_VIEW_ERROR'
  | 'PORTFOLIO_LOAD_ERROR'
  | 'PORTFOLIO_SAVE_ERROR';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
  errorId?: string;
}

// ========================== APP SETTINGS TYPES ==========================

// UNIFIED APP SETTINGS - Enterprise Grade
export interface AppSettings {
  [key: string]: any;
  
  // Metadata
  version: number;
  lastUpdated: number;
  
  // Appearance
  theme: 'auto' | 'light' | 'dark';
  
  // UNIFIED NOTIFICATIONS STRUCTURE
  notifications: {
    enabled: boolean;
    dailyReminder: boolean;
    achievementAlerts: boolean;
    challengeAlerts: boolean;
    reminderTime: string;
    // Extended enterprise notifications
    lessons: boolean;
    achievements: boolean;
    social: boolean;
    challenges: boolean;
    lessonCompletions: boolean;
    achievementUnlocks: boolean;
    socialActivity: boolean;
  };
  
  // Drawing Settings
  drawing: {
    pressureSensitivity: number;
    smoothing: number;
    autosave: boolean;
    hapticFeedback: boolean;
    maxUndoHistory?: number;
    canvasResolution?: 'standard' | 'high' | 'ultra';
    antiAliasing?: boolean;
  };
  
  // Learning Settings
  learning: {
    dailyGoal: number;
    reminderTime: string;
    difficulty: 'easy' | 'adaptive' | 'hard';
    skipIntroVideos?: boolean;
    autoAdvance?: boolean;
    practiceMode?: 'guided' | 'free' | 'mixed';
  };
  
  // UNIFIED PRIVACY SETTINGS
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
  
  // UNIFIED ACCESSIBILITY SETTINGS
  accessibility: {
    fontSize: 'small' | 'medium' | 'large' | 'extra-large';
    highContrast: boolean;
    reducedMotion: boolean;
    screenReader: boolean;
    colorBlindSupport: 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';
  };
  
  // Performance Settings
  performance?: {
    enableGPUAcceleration: boolean;
    frameRateLimit: 30 | 60 | 120;
    memoryOptimization: 'low' | 'balanced' | 'high';
    backgroundProcessing: boolean;
  };
  
  // Experimental Features
  experimental?: {
    betaFeatures: boolean;
    aiAssistance: boolean;
    cloudSync: boolean;
    collaborativeDrawing: boolean;
  };
}

// ========================== DRAWING TYPES ==========================

export type DrawingTool = 'brush' | 'eraser' | 'move' | 'select' | 'zoom';
export type DrawingMode = 'normal' | 'reference' | 'guided' | 'timelapse';
export type BlendMode = 
  | 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light' | 'hard-light' 
  | 'color-dodge' | 'color-burn' | 'darken' | 'lighten';

export type BrushCategory = 
  | 'pencil' | 'ink' | 'paint' | 'watercolor' | 'airbrush' | 'marker' | 'texture' | 'eraser';

export interface BrushSettings {
  size: number;
  minSize: number;
  maxSize: number;
  opacity: number;
  flow: number;
  hardness: number;
  spacing: number;
  smoothing: number;
  pressureSensitivity?: number;
  tiltSensitivity?: number;
  velocitySensitivity?: number;
  jitter?: number;
  scatter?: number;
  textureScale?: number;
  textureDepth?: number;
  wetness?: number;
  mixing?: number;
  falloff?: number;
  rotation?: number;
  graininess?: number;
}

export interface Brush {
  id: string;
  name: string;
  category: BrushCategory;
  icon: string;
  settings: BrushSettings;
  pressureCurve: number[];
  tiltSupport: boolean;
  velocitySupport: boolean;
  blendMode?: BlendMode;
  customizable: boolean;
  textureId?: string;
  isEraser?: boolean;
  size?: number;
  opacity?: number;
  hardness?: number;
  texture?: string;
  pressureSensitive?: boolean;
}

export interface Stroke {
  id: string;
  points: Point[];
  color: string;
  brushId: string;
  size: number;
  opacity: number;
  blendMode: BlendMode;
  smoothing: number;
  path?: SkPath;
}

export interface Layer {
  id: string;
  name: string;
  type: 'raster' | 'vector' | 'group' | 'text';
  strokes: Stroke[];
  opacity: number;
  blendMode: BlendMode | string;
  visible: boolean;
  locked: boolean;
  data: any;
  order: number;
}

export interface DrawingStats {
  totalStrokes: number;
  totalTime: number;
  layersUsed: number;
  colorsUsed: number;
  brushesUsed: number;
  undoCount: number;
  redoCount: number;
}

export interface CanvasSettings {
  pressureSensitivity: boolean | number;
  tiltSensitivity: boolean | number;
  velocitySensitivity: boolean | number;
  palmRejection: boolean;
  quickMenuEnabled?: boolean;
  autoSave?: boolean;
  autoSaveInterval?: number;
  smoothing?: number;
  predictiveStroke?: boolean;
  snapToShapes?: boolean;
  gridEnabled?: boolean;
  gridSize?: number;
  symmetryEnabled?: boolean;
  symmetryType?: string;
  referenceEnabled?: boolean;
  streamlineAmount?: number;
  quickShapeEnabled?: boolean;
}

export interface HistoryEntry {
  id: string;
  action: string;
  timestamp: number;
  data: any;
}

export interface DrawingState {
  currentTool: DrawingTool;
  currentColor: Color;
  currentBrush: Brush | null;
  brushSize: number;
  opacity: number;
  layers: Layer[];
  activeLayerId: string;
  strokes: Stroke[];
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  pan: { x: number; y: number };
  rotation: number;
  gridVisible: boolean;
  gridSize: number;
  referenceImage: string | null;
  referenceOpacity: number;
  drawingMode: DrawingMode;
  history: HistoryEntry[];
  historyIndex: number;
  stats: DrawingStats;
  settings: CanvasSettings;
  recentColors: string[];
  customBrushes: Brush[];
  savedPalettes: Color[][];
}

// ========================== LEARNING TYPES ==========================

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'professional';
export type LessonType = 'theory' | 'practice' | 'challenge' | 'guided' | 'assessment' | 'video';
export type LessonStatus = 'locked' | 'available' | 'in_progress' | 'completed' | 'mastered' | 'in-progress';

export interface ValidationRule {
  type: string;
  params?: Record<string, any>;
  threshold?: number;
  criteria?: any;
  target?: any;
  tolerance?: number;
  targets?: string[];
}

export interface LearningObjective {
  id: string;
  description: string;
  completed: boolean;
  required: boolean;
  type?: 'primary' | 'secondary' | 'bonus';
}

export interface LessonObjective {
  id: string;
  description: string;
  completed: boolean;
  required: boolean;
}

export interface LessonContent {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'color_match' | 'visual_selection' 
      | 'drawing_exercise' | 'guided_step' | 'shape_practice' | 'video_lesson' 
      | 'assessment' | 'portfolio_project';
  question?: string;
  instruction?: string;
  explanation?: string;
  hint?: string;
  xp: number;
  timeLimit?: number;
  options?: string[];
  correctAnswer?: any;
  validation?: ValidationRule;
  overlay?: {
    type: string;
    position: { x: number; y: number };
    size: number;
    opacity: number;
  };
  image?: string;
  video?: string;
  demonstration?: string;
}

export interface TheorySegment {
  id: string;
  type: 'text' | 'image' | 'video' | 'interactive';
  content: string | {
    text?: string;
    demo?: string;
    title?: string;
    instructions?: string;
    url?: string;
  };
  duration: number;
  order: number;
  interactive?: boolean;
}

export interface PracticeInstruction {
  id: string;
  text: string;
  type: 'draw' | 'observe' | 'compare' | 'trace' | 'select' | 'analyze';
  hint?: string;
  expectedResult?: string;
  validation?: ValidationRule;
  order: number;
  highlightArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface AssessmentCriteria {
  id: string;
  name: string;
  description: string;
  weight: number;
  passingScore: number;
  evaluationType?: 'automatic' | 'manual';
}

export interface Assessment {
  criteria: AssessmentCriteria[];
  passingScore: number;
  maxAttempts?: number;
  bonusObjectives?: {
    id: string;
    description: string;
    xpBonus: number;
  }[];
}

export interface TheoryContent {
  segments: TheorySegment[];
  totalDuration: number;
  objectives: LearningObjective[];
}

export interface PracticeContent {
  instructions: PracticeInstruction[];
  hints: {
    id: string;
    stepIndex: number;
    text: string;
    content?: string;
    triggerCondition?: string;
  }[];
  referenceImage?: string;
  canvas: {
    width: number;
    height: number;
    backgroundColor: string;
  };
  expectedDuration: number;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  type: LessonType;
  skillTree: string;
  order: number;
  estimatedTime: number;
  difficulty: number;
  prerequisites: string[];
  content: LessonContent[];
  objectives: LearningObjective[];
  theoryContent?: TheoryContent;
  practiceContent?: PracticeContent;
  assessment?: Assessment;
  rewards: {
    xp: number;
    achievements?: string[];
    unlocks?: string[];
  };
  status: LessonStatus;
  progress: number;
  attempts: number;
  timeSpent: number;
  tags: string[];
  xpReward?: number;
  completedAt?: number;
  bestScore?: number;
  duration?: number;
  skillTreeId?: string;
  unlockRequirements?: string[];
}

export interface LessonProgress {
  lessonId: string;
  contentProgress: number;
  currentContentIndex: number;
  totalContent: number;
  score: number;
  timeSpent: number;
  completed: boolean;
  startedAt: string;
  completedAt?: string;
}

export interface ValidationResult {
  isCorrect: boolean;
  feedback: string;
  explanation?: string;
  xpAwarded: number;
  showHint?: boolean;
  hint?: string;
}

export interface SkillTree {
  id: string;
  name: string;
  description: string;
  category: string;
  order: number;
  lessons: Lesson[];
  prerequisites: string[];
  totalXP: number;
  estimatedDuration: number;
  difficultyLevel: SkillLevel;
  progress: number;
  unlockedAt?: number;
  completedAt?: number;
  iconUrl?: string;
  completionPercentage?: number;
}

export interface SkillTreeProgress {
  skillTreeId: string;
  completedLessons: string[];
  totalXpEarned: number;
  lastAccessedAt?: Date;
  lastActivityDate?: string;
  completionPercentage: number;
}

export interface LearningProgress {
  userId: string;
  currentLevel: number;
  totalXP: number;
  completedLessons: string[];
  skillTrees: SkillTreeProgress[];
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  achievements: string[];
  preferences: {
    dailyGoal: number;
    reminderTime?: string;
    difficulty: 'adaptive' | 'challenging' | 'comfortable';
  };
  dailyProgress: number;
  dailyGoal: number;
}

export interface LessonState {
  lessonId: string;
  startedAt: Date;
  pausedAt?: Date;
  theoryProgress: {
    currentSegment: number;
    completedSegments: number[];
    timeSpent: number;
  };
  practiceProgress: {
    currentStep: number;
    completedSteps: number[];
    attempts: Record<string, number>;
    hints: string[];
    timeSpent: number;
  };
  overallProgress: number;
  isPaused: boolean;
}

export interface LessonCompletionResult {
  lessonId: string;
  score: number;
  xpEarned: number;
  completed: boolean;
  perfectScore: boolean;
  timeSpent: number;
  achievements: string[];
}

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  skillTrees: string[];
  targetSkillLevel: SkillLevel;
  estimatedWeeks: number;
  prerequisites: SkillLevel[];
}

export interface LearningState {
  currentLesson: Lesson | null;
  currentSkillTree: SkillTree | null;
  availableLessons: Lesson[];
  completedLessons: string[];
  learningPaths: LearningPath[];
  skillTrees: SkillTree[];
  dailyGoal: {
    target: number;
    completed: number;
    streak: number;
  };
  weeklyProgress: {
    lessonsCompleted: number;
    timeSpent: number;
    xpGained: number;
  };
  preferences: {
    reminderTime?: string;
    difficultyPreference: 'adaptive' | 'challenging' | 'comfortable';
    learningStyle: 'visual' | 'kinesthetic' | 'mixed';
  };
}

// ========================== UNIFIED USER TYPES ==========================

// ENTERPRISE USER PROFILE - Single Source of Truth
export interface UserProfile {
  // Core Identity
  id: string;
  username: string;
  displayName: string;
  email?: string;
  avatar?: string;
  bio?: string;
  
  // User Level & Experience
  skillLevel: SkillLevel;
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
  
  // Learning Goals & Progress
  learningGoals: string[];
  
  // Statistics
  stats: {
    totalDrawingTime: number;
    totalLessonsCompleted: number;
    totalArtworksCreated: number;
    currentStreak: number;
    longestStreak: number;
    totalArtworks: number;
    totalLessons: number;
    totalAchievements: number;
  };
  
  // Achievements
  featuredAchievements: string[];
  
  // Preferences
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    emailNotifications: boolean;
    pushNotifications: boolean;
    notifications: boolean;
    privacy: 'public' | 'friends' | 'private';
  };
}

// Legacy User interface for backwards compatibility
export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatar?: string;
  bio?: string;
  following: string[];
  followers: string[];
  isVerified?: boolean;
  isOnline?: boolean;
  lastSeenAt?: number;
  level: number;
  xp: number;
  totalXP: number;
  streakDays: number;
  lastActiveDate: Date;
  createdAt: Date;
  updatedAt: Date;
  preferences: UserPreferences;
  stats: UserStats;
  achievements: Achievement[];
}

export interface UserProgress {
  userId: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  skillPoints: {
    drawing: number;
    theory: number;
    creativity: number;
    technique: number;
  };
  achievements: Achievement[];
  streakDays: number;
  lastActivityDate: string;
  learningStats: {
    lessonsCompleted: number;
    skillTreesCompleted: number;
    totalStudyTime: number;
    averageSessionTime: number;
    strongestSkills: string[];
    improvementAreas: string[];
  };
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'skill' | 'social' | 'milestone' | 'streak' | 'creativity';
  requirements: {
    type: string;
    value: number;
    condition?: string;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
  unlockedAt?: number;
  progress?: number;
  maxProgress?: number;
  title?: string;
  iconUrl?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language?: string;
  notifications: {
    lessons: boolean;
    achievements: boolean;
    social: boolean;
    challenges: boolean;
    lessonCompletions?: boolean;
    achievementUnlocks?: boolean;
    challengeAlerts?: boolean;
    socialActivity?: boolean;
  };
  privacy: {
    profile: 'public' | 'friends' | 'private';
    artwork: 'public' | 'friends' | 'private';
    progress: 'public' | 'friends' | 'private';
    showProgress?: boolean;
    allowMessages?: boolean;
    portfolioVisibility?: 'public' | 'friends' | 'private';
  };
  learning?: {
    dailyGoal: number;
    reminderTime?: string;
    difficulty: 'adaptive' | 'challenging' | 'comfortable';
  };
  drawingPreferences?: {
    defaultBrush: string;
    pressureSensitivity: number;
    smoothing: number;
    gridEnabled: boolean;
    autosaveInterval: number;
  };
}

export interface UserStats {
  totalDrawingTime: number;
  totalLessonsCompleted: number;
  totalArtworksCreated: number;
  currentStreak: number;
  longestStreak: number;
  averageSessionTime?: number;
  favoriteTools?: string[];
  skillDistribution?: Record<string, number>;
  artworksCreated: number;
  artworksShared: number;
  challengesCompleted: number;
  skillsUnlocked: number;
  perfectLessons: number;
  lessonsCompleted: number;
}

// ========================== PORTFOLIO TYPES ==========================

export interface Portfolio {
  id: string;
  userId: string;
  artworks: Artwork[];
  collections: Collection[];
  stats: {
    totalArtworks: number;
    totalLikes: number;
    totalViews: number;
    followerCount: number;
    publicArtworks?: number;
    averageTimeSpent?: number;
  };
  settings: {
    publicProfile: boolean;
    showProgress: boolean;
    allowComments: boolean;
  };
}

export interface Artwork {
  id: string;
  userId: string;
  title: string;
  description?: string;
  tags: string[];
  lessonId?: string;
  skillTree?: string;
  drawingData?: DrawingState;
  thumbnail?: string;
  imageUrl: string;
  createdAt: number;
  updatedAt: number;
  stats?: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
  metadata?: {
    drawingTime: number;
    strokeCount: number;
    layersUsed: number;
    brushesUsed: string[];
    canvasSize: { width: number; height: number };
  };
  visibility?: 'public' | 'unlisted' | 'private';
  featured?: boolean;
  isPublic?: boolean;
  likes?: number;
  views?: number;
  comments?: Comment[];
  duration?: number;
  tools?: string[];
  layers?: Layer[];
  dimensions?: { width: number; height: number };
  challengeId?: string;
  thumbnailUrl?: string;
  fullImageUrl?: string;
}

export interface Collection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  artworkIds: string[];
  coverImageId?: string;
  createdAt: number;
  updatedAt: number;
  visibility: 'public' | 'unlisted' | 'private';
}

// ========================== COMMUNITY TYPES ==========================

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special';
  theme?: string;
  prompt?: string;
  rules?: string[];
  startDate: number;
  endDate: number;
  difficulty: SkillLevel;
  rewards: {
    xp: number;
    achievements: string[];
    badges?: string[];
  };
  participants: number;
  submissions?: ChallengeSubmission[];
  featured?: boolean;
  tags?: string[];
  prizes?: Prize[];
  winners?: string[];
  status?: 'upcoming' | 'active' | 'completed';
  requirements?: string[];
}

export interface Prize {
  id: string;
  name: string;
  description: string;
  type: 'xp' | 'achievement' | 'badge' | 'feature';
  value: any;
  place: number;
}

export interface ChallengeSubmission {
  id: string;
  challengeId: string;
  userId: string;
  artworkId: string;
  submittedAt: number;
  votes: number;
  rank?: number;
  featured?: boolean;
  likes?: number;
  comments?: Comment[];
  views?: number;
}

export interface SocialFeed {
  posts: FeedPost[];
  hasMore: boolean;
  lastUpdated: number;
}

export interface FeedPost {
  id: string;
  userId: string;
  type: 'artwork' | 'achievement' | 'lesson-complete' | 'challenge' | 'milestone';
  content: {
    artworkId?: string;
    achievementId?: string;
    lessonId?: string;
    challengeId?: string;
    text?: string;
  };
  createdAt: number;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    isLiked: boolean;
  };
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  createdAt: number;
  likes: number;
  replies: Comment[];
  isLiked?: boolean;
  artworkId?: string;
}

// ========================== PERFORMANCE TYPES ==========================

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  drawCalls: number;
  inputLatency: number;
  renderTime: number;
  timestamp: number;  // FIXED: Added missing timestamp property
}

export interface AppError {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: any;
  timestamp: Date;
  stack?: string;
  userId?: string;
}

export interface ErrorInfo {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: any;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  deviceInfo?: {
    platform: string;
    version: string;
    model: string;
  };
}

// ========================== THEME TYPES ==========================

export interface Theme {
  name: 'light' | 'dark';
  colors: {
    primary: string;
    primaryDark: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    warning: string;
    success: string;
    info: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  typography: {
    h1: { fontSize: number; fontWeight: string; lineHeight: number };
    h2: { fontSize: number; fontWeight: string; lineHeight: number };
    h3: { fontSize: number; fontWeight: string; lineHeight: number };
    h4: { fontSize: number; fontWeight: string; lineHeight: number };
    body: { fontSize: number; fontWeight: string; lineHeight: number };
    caption: { fontSize: number; fontWeight: string; lineHeight: number };
  };
}

// ========================== CONTEXT TYPES ==========================

export interface ThemeContextValue {
  theme: Theme;
  colors: Theme['colors'];
  spacing: Theme['spacing'];
  borderRadius: Theme['borderRadius'];
  toggleTheme: () => void;
  isDark: boolean;
}

export interface UserProgressContextValue {
  user: UserProfile | null;
  progress: UserProgress | null;
  portfolio: Portfolio | null;
  isLoading: boolean;
  error: string | null;
  createUser: (profile: Partial<UserProfile>) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  deleteAccount: () => Promise<void>;
  addXP: (amount: number, source?: string) => void;
  addAchievement: (achievementId: string) => void;
  updateStreak: () => void;
  checkDailyStreak: () => void;
  updateLearningStats: (category: string, stats: Record<string, number>) => void;
  saveArtwork: (artwork: Omit<Artwork, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateArtwork: (artworkId: string, updates: Partial<Artwork>) => Promise<void>;
  deleteArtwork: (artworkId: string) => Promise<void>;
  createCollection: (collection: Omit<Collection, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  getDailyGoalProgress: () => number;
  getWeeklyStats: () => any;
  getLearningInsights: () => any;
}

export interface LearningContextType {
  currentLesson: Lesson | null;
  lessonState: LessonState | null;
  isLoadingLesson: boolean;
  skillTrees: SkillTree[];
  availableLessons: Lesson[];
  unlockedLessons: string[];
  learningProgress: LearningProgress | null;
  completedLessons: string[];
  currentStreak: number;
  recommendedLesson: Lesson | null;
  recommendedLessons: Lesson[];
  insights: Array<{
    id: string;
    type: 'improvement' | 'achievement' | 'suggestion';
    title: string;
    description: string;
    actionable: boolean;
  }>;
  currentSkillTree: SkillTree | null;
  setCurrentSkillTree: (skillTree: SkillTree | null) => void;
  startLesson: (lesson: Lesson) => Promise<void>;
  pauseLesson: () => Promise<void>;
  resumeLesson: () => Promise<void>;
  completeLesson: (score?: number) => Promise<void>;
  exitLesson: () => Promise<void>;
  updateProgress: (stepIndex: number, completed: boolean) => Promise<void>;
  addHint: (hint: string) => void;
  validateStep: (stepIndex: number, userInput: any) => Promise<boolean>;
  getLesson: (lessonId: string) => Lesson | null;
  getLessonProgress: (lessonId: string) => number;
  getNextLesson: () => Lesson | null;
  checkUnlockRequirements: (lessonId: string) => boolean;
}

export interface LearningContextValue {
  state: LearningState;
  startLesson: (lessonId: string) => Promise<void>;
  completeLesson: (lessonId: string, score?: number) => Promise<void>;
  updateLessonProgress: (lessonId: string, progress: number) => void;
  getAvailableLessons: (skillTreeId?: string) => Lesson[];
  getRecommendedLessons: () => Lesson[];
  unlockLesson: (lessonId: string) => void;
  getLearningProgress: () => any;
  getSkillTreeProgress: (skillTreeId: string) => number;
  updateDailyGoal: (target: number) => void;
  startLearningPath: (pathId: string) => void;
  getPersonalizedPath: () => LearningPath;
}

// ========================== API TYPES ==========================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// ========================== EVENT TYPES ==========================

export interface AppEvent {
  type: string;
  payload: any;
  timestamp: number;
  userId?: string;
}

export interface DrawingEvent extends AppEvent {
  type: 'stroke:start' | 'stroke:add' | 'stroke:end' | 'layer:add' | 'layer:delete' | 'canvas:clear';
  payload: {
    strokeId?: string;
    layerId?: string;
    point?: Point;
    stroke?: Stroke;
  };
}

export interface LearningEvent extends AppEvent {
  type: 'lesson:start' | 'lesson:complete' | 'skill:unlock' | 'achievement:earn';
  payload: {
    lessonId?: string;
    skillId?: string;
    achievementId?: string;
    score?: number;
    timeSpent?: number;
  };
}

export interface UserEvent extends AppEvent {
  type: 'user:register' | 'user:login' | 'user:logout' | 'artwork:save' | 'artwork:share';
  payload: {
    userId?: string;
    artworkId?: string;
    platform?: string;
  };
}

// ========================== UTILITY TYPES ==========================

export interface Dimensions {
  width: number;
  height: number;
}

export type AchievementType = 'skill' | 'social' | 'milestone' | 'streak' | 'creativity';

export interface LessonCompletionData {
  lessonId: string;
  score: number;
  xpEarned: number;
  timeSpent: number;
  attempts: Record<string, number>;
  completedAt: string;
}

export interface LessonStateCallback {
  (state: {
    currentContent: LessonContent | null;
    progress: number;
    score: number;
    timeSpent: number;
    isCompleted: boolean;
  }): void;
}