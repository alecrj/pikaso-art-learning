// src/types/user.ts - FIXED User interface
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export interface User {
  id: string;
  email?: string;
  displayName: string;
  username?: string;
  avatar?: string;
  bio?: string;
  skillLevel: SkillLevel;
  joinedDate: string;
  lastActiveDate: string;
  learningGoals?: string[];
  preferences: {
    notifications: boolean;
    darkMode: boolean;
    autoSave: boolean;
    hapticFeedback: boolean;
  };
}