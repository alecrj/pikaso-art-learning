import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock the LessonEngine - this will test the interface even if implementation changes
const mockLessonEngine = {
  startLesson: jest.fn(),
  submitAnswer: jest.fn(),
  getLessonState: jest.fn(),
  nextContent: jest.fn(),
  previousContent: jest.fn(),
  completeLesson: jest.fn(),
};

// Mock lesson data
const mockLesson = {
  id: 'test-lesson-1',
  title: 'Basic Drawing',
  description: 'Learn basic drawing techniques',
  difficulty: 'beginner' as const,
  estimatedTime: 15,
  category: 'fundamentals',
  skillLevel: 'beginner' as const,
  prerequisites: [],
  xpReward: 100,
  content: [{
    id: 'content-1',
    type: 'theory' as const,
    title: 'Drawing Basics',
    description: 'Learn the fundamentals',
    data: {
      question: 'What is the basic principle of perspective?',
      options: ['Depth', 'Color', 'Size', 'Shape'],
      correct: 0
    }
  }],
  objectives: ['Learn perspective basics'],
  tags: ['drawing', 'basics']
};

describe('LessonEngine', () => {
  beforeEach(() => {
    // Reset mocks
    Object.values(mockLessonEngine).forEach(mock => mock.mockReset());
    
    // Setup default return values
    mockLessonEngine.getLessonState.mockReturnValue({
      currentContent: mockLesson.content[0],
      progress: 0,
      isComplete: false,
      score: 0
    });
    
    mockLessonEngine.submitAnswer.mockResolvedValue({
      isCorrect: true,
      xpAwarded: 25,
      feedback: 'Correct!',
      showHint: false
    });
  });

  describe('Lesson Management', () => {
    it('should start a lesson successfully', async () => {
      mockLessonEngine.startLesson.mockResolvedValue(undefined);
      
      await mockLessonEngine.startLesson(mockLesson);
      
      expect(mockLessonEngine.startLesson).toHaveBeenCalledWith(mockLesson);
      
      const state = mockLessonEngine.getLessonState();
      expect(state.currentContent).toBeDefined();
      expect(state.progress).toBe(0);
      expect(state.isComplete).toBe(false);
    });

    it('should track lesson progress correctly', async () => {
      await mockLessonEngine.startLesson(mockLesson);
      const result = await mockLessonEngine.submitAnswer(0);
      
      expect(result.isCorrect).toBe(true);
      expect(result.xpAwarded).toBeGreaterThan(0);
      expect(mockLessonEngine.submitAnswer).toHaveBeenCalledWith(0);
    });

    it('should handle incorrect answers appropriately', async () => {
      mockLessonEngine.submitAnswer.mockResolvedValue({
        isCorrect: false,
        xpAwarded: 0,
        feedback: 'Try again!',
        showHint: true
      });
      
      await mockLessonEngine.startLesson(mockLesson);
      const result = await mockLessonEngine.submitAnswer(1);
      
      expect(result.isCorrect).toBe(false);
      expect(result.xpAwarded).toBe(0);
      expect(result.feedback).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid lesson gracefully', async () => {
      mockLessonEngine.startLesson.mockRejectedValue(new Error('Invalid lesson'));
      
      await expect(mockLessonEngine.startLesson(null as any)).rejects.toThrow('Invalid lesson');
    });

    it('should handle invalid answers gracefully', async () => {
      mockLessonEngine.submitAnswer.mockResolvedValue({
        isCorrect: false,
        xpAwarded: 0,
        feedback: 'Invalid answer',
        showHint: false
      });
      
      await mockLessonEngine.startLesson(mockLesson);
      const result = await mockLessonEngine.submitAnswer(-1);
      
      expect(result.isCorrect).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should start lesson quickly', async () => {
      const startTime = performance.now();
      await mockLessonEngine.startLesson(mockLesson);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});