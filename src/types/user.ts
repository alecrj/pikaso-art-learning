// src/types/user.ts - FIXED User interface
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export interface User {
  id: string;
  email?: string;
  displayName: string;
  avatar?: string;
  skillLevel: SkillLevel;
  joinedDate: string;
  lastActiveDate: string;
  learningGoals?: string[]; // FIXED: Added missing property
  preferences: {
    notifications: boolean;
    darkMode: boolean;
    autoSave: boolean;
    hapticFeedback: boolean;
  };
}