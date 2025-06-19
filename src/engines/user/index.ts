// src/engines/user/index.ts
export { ProfileSystem } from './ProfileSystem';
export { ProgressionSystem } from './ProgressionSystem';
export { PortfolioManager } from './PortfolioManager';

import { ProfileSystem } from './ProfileSystem';
import { ProgressionSystem } from './ProgressionSystem';
import { PortfolioManager } from './PortfolioManager';

export const profileSystem = ProfileSystem.getInstance();
export const progressionSystem = ProgressionSystem.getInstance();
export const portfolioManager = PortfolioManager.getInstance();

export async function initializeUserEngine(): Promise<void> {
  try {
    console.log('User engine initialized successfully');
  } catch (error) {
    console.error('Failed to initialize user engine:', error);
    throw error;
  }
}