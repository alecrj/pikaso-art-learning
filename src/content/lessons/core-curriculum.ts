// src/content/lessons/core-curriculum.ts
import { Lesson, LessonContent, ValidationRule } from '../../types';

export const coreCurriculum: Lesson[] = [
  // LESSON 1: Your First Line
  {
    id: 'lesson-first-line',
    title: 'Your First Line',
    description: 'Master the foundation of all drawing - the confident line',
    type: 'practice',
    skillTree: 'fundamentals',
    order: 1,
    estimatedTime: 5,
    difficulty: 1,
    prerequisites: [],
    
    content: [
      {
        id: 'intro',
        type: 'guided_step',
        instruction: 'Welcome! Let\'s start with the most important skill - drawing a straight line.',
        hint: 'Don\'t worry about perfection. Focus on confidence!',
        xp: 10,
        validation: {
          type: 'line_straightness',
          threshold: 0.5, // Very forgiving
        }
      },
      {
        id: 'horizontal-lines',
        type: 'drawing_exercise',
        instruction: 'Draw 5 horizontal lines. Try to keep them parallel.',
        hint: 'Move your whole arm, not just your wrist',
        xp: 20,
        validation: {
          type: 'parallel_lines',
          threshold: 0.6,
          params: { count: 5, orientation: 'horizontal' }
        }
      },
      {
        id: 'vertical-lines',
        type: 'drawing_exercise',
        instruction: 'Now draw 5 vertical lines. Space them evenly.',
        hint: 'Look where you want the line to end, not at your pencil',
        xp: 20,
        validation: {
          type: 'parallel_lines',
          threshold: 0.6,
          params: { count: 5, orientation: 'vertical' }
        }
      }
    ],
    
    objectives: [
      {
        id: 'confident-lines',
        description: 'Draw lines with confidence and control',
        completed: false,
        required: true
      }
    ],
    
    rewards: {
      xp: 50,
      unlocks: ['lesson-basic-shapes']
    },
    
    status: 'unlocked',
    progress: 0,
    attempts: 0,
    timeSpent: 0,
    tags: ['fundamentals', 'lines', 'beginner']
  },

  // LESSON 2: Basic Shapes
  {
    id: 'lesson-basic-shapes',
    title: 'Circles, Squares & Triangles',
    description: 'Everything you draw is built from these simple shapes',
    type: 'practice',
    skillTree: 'fundamentals',
    order: 2,
    estimatedTime: 8,
    difficulty: 1,
    prerequisites: ['lesson-first-line'],
    
    content: [
      {
        id: 'circle-intro',
        type: 'guided_step',
        instruction: 'Let\'s draw a circle. Start from the top and go clockwise.',
        demonstration: 'Use your shoulder, keep your wrist locked',
        hint: 'Use your shoulder, keep your wrist locked',
        xp: 15,
        validation: {
          type: 'shape_accuracy',
          target: 'circle',
          threshold: 0.6
        }
      },
      {
        id: 'circle-practice',
        type: 'shape_practice',
        instruction: 'Draw 3 circles of different sizes',
        hint: 'Bigger circles are often easier than tiny ones',
        xp: 25,
        validation: {
          type: 'multiple_shapes',
          params: { shape: 'circle', count: 3, sizeVariation: true }
        }
      },
      {
        id: 'square-intro',
        type: 'guided_step',
        instruction: 'Now a square. Four equal sides, four right angles.',
        hint: 'Start with the top line, then work clockwise',
        xp: 15,
        validation: {
          type: 'shape_accuracy',
          target: 'square',
          threshold: 0.7
        }
      },
      {
        id: 'triangle-challenge',
        type: 'drawing_exercise',
        instruction: 'Draw an equilateral triangle (all sides equal)',
        hint: 'Imagine a pyramid - wide base, point at top',
        xp: 20,
        validation: {
          type: 'shape_accuracy',
          target: 'triangle',
          threshold: 0.65
        }
      }
    ],
    
    objectives: [
      {
        id: 'basic-shapes-mastery',
        description: 'Draw basic geometric shapes with accuracy',
        completed: false,
        required: true
      }
    ],
    
    rewards: {
      xp: 75,
      achievements: ['shape_shifter'],
      unlocks: ['lesson-combining-shapes']
    },
    
    status: 'locked',
    progress: 0,
    attempts: 0,
    timeSpent: 0,
    tags: ['fundamentals', 'shapes', 'geometry']
  },

  // LESSON 3: Combining Shapes
  {
    id: 'lesson-combining-shapes',
    title: 'Building with Shapes',
    description: 'Learn to see complex objects as simple shapes combined',
    type: 'practice',
    skillTree: 'fundamentals',
    order: 3,
    estimatedTime: 10,
    difficulty: 2,
    prerequisites: ['lesson-basic-shapes'],
    
    content: [
      {
        id: 'house-intro',
        type: 'guided_step',
        instruction: 'Let\'s draw a house using shapes. Start with a square for the base.',
        xp: 20,
        validation: {
          type: 'shape_accuracy',
          target: 'square',
          threshold: 0.7
        }
      },
      {
        id: 'house-roof',
        type: 'guided_step',
        instruction: 'Add a triangle on top for the roof',
        hint: 'Make the triangle slightly wider than the square',
        xp: 20,
        validation: {
          type: 'shape_combination',
          params: { shapes: ['square', 'triangle'], arrangement: 'stacked' }
        }
      },
      {
        id: 'house-details',
        type: 'drawing_exercise',
        instruction: 'Add a door (rectangle) and window (square)',
        hint: 'Keep proportions realistic - door taller than window',
        xp: 25,
        validation: {
          type: 'contains_shapes',
          params: { required: ['rectangle', 'small_square'] }
        }
      },
      {
        id: 'tree-challenge',
        type: 'drawing_exercise',
        instruction: 'Draw a tree using a rectangle trunk and circle leaves',
        xp: 30,
        validation: {
          type: 'shape_combination',
          params: { shapes: ['rectangle', 'circle'], arrangement: 'tree' }
        }
      }
    ],
    
    objectives: [
      {
        id: 'shape-combination',
        description: 'Combine simple shapes to create recognizable objects',
        completed: false,
        required: true
      }
    ],
    
    rewards: {
      xp: 95,
      unlocks: ['lesson-shading-basics']
    },
    
    status: 'locked',
    progress: 0,
    attempts: 0,
    timeSpent: 0,
    tags: ['fundamentals', 'construction', 'shapes']
  },

  // Simplified versions of remaining lessons for iPhone compatibility
  {
    id: 'lesson-shading-basics',
    title: 'Light and Shadow',
    description: 'Make your drawings pop with basic shading',
    type: 'practice',
    skillTree: 'fundamentals',
    order: 4,
    estimatedTime: 12,
    difficulty: 2,
    prerequisites: ['lesson-combining-shapes'],
    
    content: [
      {
        id: 'value-scale',
        type: 'guided_step',
        instruction: 'Create a value scale from light to dark in 5 steps',
        hint: 'Apply more pressure for darker values',
        xp: 25,
        validation: {
          type: 'value_gradient',
          params: { steps: 5, smoothness: 0.6 }
        }
      },
      {
        id: 'sphere-shading',
        type: 'guided_step',
        instruction: 'Draw a circle, then shade it to look like a sphere',
        hint: 'Light comes from top-right. Darkest part is opposite.',
        xp: 35,
        validation: {
          type: 'shaded_form',
          params: { shape: 'sphere', lightDirection: 'top-right' }
        }
      }
    ],
    
    objectives: [
      {
        id: 'understand-light',
        description: 'Understand how light creates form through shading',
        completed: false,
        required: true
      }
    ],
    
    rewards: {
      xp: 60,
      achievements: ['shadow_caster'],
      unlocks: ['lesson-texture-intro']
    },
    
    status: 'locked',
    progress: 0,
    attempts: 0,
    timeSpent: 0,
    tags: ['fundamentals', 'shading', 'light']
  }
];

// Helper function to get lesson by ID
export function getLessonById(id: string): Lesson | undefined {
  return coreCurriculum.find(lesson => lesson.id === id);
}

// Helper function to get available lessons
export function getAvailableLessons(completedLessonIds: string[]): Lesson[] {
  return coreCurriculum.filter(lesson => {
    // First lesson is always available
    if (lesson.prerequisites.length === 0) return true;
    
    // Check if all prerequisites are completed
    return lesson.prerequisites.every(prereq => 
      completedLessonIds.includes(prereq)
    );
  });
}

// Helper function to calculate total XP
export function getTotalAvailableXP(): number {
  return coreCurriculum.reduce((total, lesson) => {
    return total + lesson.rewards.xp;
  }, 0);
}

export default coreCurriculum;