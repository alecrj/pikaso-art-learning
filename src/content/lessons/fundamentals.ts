// src/content/lessons/fundamentals.ts - FIXED WITH COMPLETED PROPERTIES

import { Lesson, LessonType, LessonContent } from '../../types';

/**
 * FIXED LESSON SYSTEM - Compatible with existing types
 * 
 * ✅ FIXED ISSUES:
 * - Added missing 'completed: false' to all LearningObjective interfaces
 * - Enhanced lesson content for Duolingo-level interactivity
 * - Added professional drawing validation rules
 * - Improved XP distribution and progression
 */

export const fundamentalLessons: Lesson[] = [
  // LESSON 1: Theory Quiz
  {
    id: 'lesson-intro-theory',
    title: 'Drawing Fundamentals Quiz',
    description: 'Test your understanding of basic drawing principles',
    type: 'theory' as LessonType,
    skillTree: 'drawing-fundamentals',
    order: 1,
    estimatedTime: 5,
    difficulty: 1,
    prerequisites: [],
    
    // NEW: Content array for modern lesson engine
    content: [
      {
        id: 'shoulder-technique',
        type: 'multiple_choice',
        question: 'Which technique produces the straightest lines?',
        options: [
          'Drawing from the wrist',
          'Drawing from the shoulder',
          'Drawing with fingertips',
          'Drawing very slowly'
        ],
        correctAnswer: 1,
        explanation: 'Professional artists draw from their shoulder for long, controlled lines. The shoulder provides stability and smooth movement.',
        hint: 'Think about which joint gives you the most control.',
        xp: 15,
      },
      {
        id: 'wrist-control',
        type: 'true_false',
        question: 'You should lock your wrist when drawing straight lines.',
        correctAnswer: true,
        explanation: 'Locking your wrist prevents wobbly lines and gives you better control.',
        xp: 10,
      },
      {
        id: 'circle-method',
        type: 'multiple_choice',
        question: 'What\'s the best way to draw a perfect circle?',
        options: [
          'Draw very slowly and carefully',
          'Use your elbow as a pivot point',
          'Start with a square first',
          'Draw many small curves'
        ],
        correctAnswer: 1,
        explanation: 'Using your elbow as a pivot creates natural circular motion.',
        xp: 15,
      }
    ],
    
    // EXISTING: Keep original structure for backward compatibility
    objectives: [
      {
        id: 'theory-1',
        description: 'Understand proper drawing technique',
        completed: false, // FIXED: Added missing property
        required: true,
      }
    ],
    
    theoryContent: {
      segments: [
        {
          id: 'theory-1',
          type: 'text',
          content: 'Every masterpiece starts with a single line. Today, you\'ll learn the secret that separates amateur from professional artists: controlled, confident strokes.',
          duration: 30,
          order: 1,
        }
      ],
      totalDuration: 120,
      objectives: [
        {
          id: 'learn-1',
          description: 'Understand shoulder vs wrist movement',
          type: 'primary',
          completed: false, // FIXED: Added missing property
          required: true,
        },
      ],
    },
    
    practiceContent: {
      instructions: [
        {
          id: 'practice-1',
          text: 'Practice drawing straight lines using proper technique',
          type: 'draw',
          hint: 'Move from your shoulder, not your wrist!',
          expectedResult: 'Straight controlled lines',
          order: 1,
        }
      ],
      hints: [
        {
          id: 'hint-1',
          stepIndex: 0,
          text: 'Remember: shoulder movement for straight lines!',
          content: 'Your lines will be wobbly if you use your wrist',
        },
      ],
      canvas: {
        width: 800,
        height: 600,
        backgroundColor: '#FFFFFF',
      },
      expectedDuration: 5,
    },
    
    rewards: {
      xp: 40,
      achievements: ['theory_master'],
      unlocks: ['lesson-line-practice'],
    },
    
    status: 'available',
    progress: 0,
    attempts: 0,
    timeSpent: 0,
    tags: ['theory', 'fundamentals', 'basics'],
  },

  // LESSON 2: Line Practice
  {
    id: 'lesson-line-practice',
    title: 'Line Control Practice',
    description: 'Master drawing straight lines and basic shapes',
    type: 'practice' as LessonType,
    skillTree: 'drawing-fundamentals',
    order: 2,
    estimatedTime: 8,
    difficulty: 1,
    prerequisites: ['lesson-intro-theory'],
    
    // NEW: Drawing exercises content
    content: [
      {
        id: 'horizontal-lines',
        type: 'drawing_exercise',
        instruction: 'Draw 5 straight horizontal lines',
        hint: 'Use your shoulder, keep your wrist locked',
        validation: {
          type: 'line_count',
          target: 5, // FIXED: Added missing target property
          threshold: 0.8,
        },
        timeLimit: 90,
        xp: 20,
      },
      {
        id: 'vertical-lines',
        type: 'drawing_exercise',
        instruction: 'Draw 5 straight vertical lines',
        hint: 'Keep them parallel and evenly spaced',
        validation: {
          type: 'line_count',
          target: 5, // FIXED: Added missing target property
          threshold: 0.8,
        },
        timeLimit: 90,
        xp: 20,
      },
      {
        id: 'circles',
        type: 'drawing_exercise',
        instruction: 'Draw 3 circles',
        hint: 'Use your elbow as a pivot, don\'t worry about perfection',
        validation: {
          type: 'shape_accuracy',
          target: 'circle', // FIXED: Added missing target property
          tolerance: 0.6, // FIXED: Added missing tolerance property
          threshold: 0.6,
        },
        timeLimit: 120,
        xp: 25,
      }
    ],
    
    // EXISTING: Original structure
    objectives: [
      {
        id: 'lines-1',
        description: 'Draw controlled straight lines',
        completed: false, // FIXED: Added missing property
        required: true,
      },
      {
        id: 'circles-1',
        description: 'Create basic circular shapes',
        completed: false, // FIXED: Added missing property
        required: true,
      }
    ],
    
    practiceContent: {
      instructions: [
        {
          id: 'practice-1',
          text: 'Draw 5 horizontal lines across your canvas. Focus on keeping them straight and parallel.',
          type: 'draw',
          hint: 'Move from your shoulder, not your wrist!',
          expectedResult: '5 straight horizontal lines',
          validation: {
            type: 'stroke-count',
            params: { min: 5, max: 10 },
          },
          order: 1,
        },
      ],
      hints: [],
      canvas: {
        width: 800,
        height: 600,
        backgroundColor: '#FFFFFF',
      },
      expectedDuration: 8,
    },
    
    rewards: {
      xp: 65,
      achievements: ['line_master'],
      unlocks: ['lesson-color-theory'],
    },
    
    status: 'locked',
    progress: 0,
    attempts: 0,
    timeSpent: 0,
    tags: ['practice', 'lines', 'shapes', 'fundamentals'],
  },

  // LESSON 3: Color Theory
  {
    id: 'lesson-color-theory',
    title: 'Color Theory Basics',
    description: 'Learn about primary colors, complements, and harmony',
    type: 'theory' as LessonType,
    skillTree: 'drawing-fundamentals',
    order: 3,
    estimatedTime: 6,
    difficulty: 1,
    prerequisites: ['lesson-line-practice'],
    
    // NEW: Color theory content
    content: [
      {
        id: 'primary-colors',
        type: 'multiple_choice',
        question: 'What are the three primary colors?',
        options: [
          'Red, Green, Blue',
          'Red, Yellow, Blue',
          'Yellow, Orange, Red',
          'Blue, Purple, Green'
        ],
        correctAnswer: 1,
        explanation: 'Red, Yellow, and Blue are the primary colors - they cannot be created by mixing other colors.',
        xp: 15,
      },
      {
        id: 'complementary-red',
        type: 'color_match',
        question: 'Select the complementary color to red:',
        options: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'],
        correctAnswer: 1, // Green
        explanation: 'Green is directly opposite red on the color wheel.',
        xp: 20,
      },
      {
        id: 'warm-colors',
        type: 'multiple_choice',
        question: 'Which colors are considered "warm"?',
        options: [
          'Blues and greens',
          'Reds, oranges, and yellows',
          'Purples and violets',
          'Black and white'
        ],
        correctAnswer: 1,
        explanation: 'Warm colors remind us of fire and sunlight. They tend to advance in compositions.',
        xp: 15,
      }
    ],
    
    // EXISTING: Original structure
    objectives: [
      {
        id: 'color-1',
        description: 'Understand primary and complementary colors',
        completed: false, // FIXED: Added missing property
        required: true,
      }
    ],
    
    theoryContent: {
      segments: [
        {
          id: 'theory-1',
          type: 'text',
          content: 'Color is one of the most powerful tools in an artist\'s toolkit. Understanding color theory will help you create more compelling and harmonious artwork.',
          duration: 30,
          order: 1,
        }
      ],
      totalDuration: 90,
      objectives: [
        {
          id: 'learn-1',
          description: 'Learn color wheel basics',
          type: 'primary',
          completed: false, // FIXED: Added missing property
          required: true,
        },
      ],
    },
    
    rewards: {
      xp: 50,
      achievements: ['color_theorist'],
      unlocks: ['lesson-apple-construction'],
    },
    
    status: 'locked',
    progress: 0,
    attempts: 0,
    timeSpent: 0,
    tags: ['theory', 'color', 'fundamentals'],
  },

  // LESSON 4: Guided Apple Drawing
  {
    id: 'lesson-apple-construction',
    title: 'Draw an Apple',
    description: 'Learn construction drawing by creating a simple apple',
    type: 'practice' as LessonType, // Using 'practice' instead of 'guided'
    skillTree: 'drawing-fundamentals',
    order: 4,
    estimatedTime: 12,
    difficulty: 2,
    prerequisites: ['lesson-color-theory'],
    
    // NEW: Guided step content
    content: [
      {
        id: 'apple-circle',
        type: 'guided_step',
        instruction: 'Start with a circle for the apple body',
        hint: 'Make it slightly wider than tall',
        validation: {
          type: 'shape_accuracy',
          target: 'circle', // FIXED: Added missing target property
          tolerance: 0.7, // FIXED: Added missing tolerance property
          threshold: 0.7,
        },
        xp: 20,
      },
      {
        id: 'apple-indent',
        type: 'guided_step',
        instruction: 'Add a small indent at the top',
        hint: 'Where the stem connects to the apple',
        validation: {
          type: 'curve_detection',
          params: { area: 'top_center' },
          threshold: 0.6,
        },
        xp: 25,
      },
      {
        id: 'apple-stem',
        type: 'guided_step',
        instruction: 'Draw a small stem',
        hint: 'Just a short rectangle at the top',
        validation: {
          type: 'shape_accuracy',
          target: 'rectangle', // FIXED: Added missing target property
          tolerance: 0.5, // FIXED: Added missing tolerance property
          threshold: 0.5,
        },
        xp: 30,
      }
    ],
    
    // EXISTING: Original structure
    objectives: [
      {
        id: 'construction-1',
        description: 'Apply construction drawing principles',
        completed: false, // FIXED: Added missing property
        required: true,
      }
    ],
    
    practiceContent: {
      instructions: [
        {
          id: 'practice-1',
          text: 'Let\'s draw an apple! Start with a circle for the main body.',
          type: 'draw',
          hint: 'Make it slightly wider than tall',
          expectedResult: 'A circular base shape',
          validation: {
            type: 'shape-accuracy',
            params: { targetShape: 'circle', threshold: 0.6 },
          },
          order: 1,
        },
      ],
      hints: [],
      canvas: {
        width: 800,
        height: 600,
        backgroundColor: '#FFFFFF',
      },
      expectedDuration: 12,
    },
    
    rewards: {
      xp: 75,
      achievements: ['constructor', 'apple_artist'],
      unlocks: [], // End of fundamentals
    },
    
    status: 'locked',
    progress: 0,
    attempts: 0,
    timeSpent: 0,
    tags: ['guided', 'construction', 'objects'],
  },

  // LESSON 5: Advanced Theory - Perspective Basics
  {
    id: 'lesson-perspective-basics',
    title: 'Perspective Fundamentals',
    description: 'Master the basics of 1-point perspective',
    type: 'theory' as LessonType,
    skillTree: 'drawing-fundamentals',
    order: 5,
    estimatedTime: 7,
    difficulty: 2,
    prerequisites: ['lesson-apple-construction'],
    
    content: [
      {
        id: 'perspective-definition',
        type: 'multiple_choice',
        question: 'What is perspective in drawing?',
        options: [
          'Making things look realistic',
          'Creating the illusion of depth and distance',
          'Drawing from different angles',
          'Using shadows and highlights'
        ],
        correctAnswer: 1,
        explanation: 'Perspective is the technique of representing 3D objects on a 2D surface to create the illusion of depth and distance.',
        hint: 'Think about how things look farther away.',
        xp: 15,
      },
      {
        id: 'horizon-line',
        type: 'true_false',
        question: 'The horizon line is always at your eye level.',
        correctAnswer: true,
        explanation: 'The horizon line represents your eye level and changes as you look up or down.',
        xp: 12,
      },
      {
        id: 'vanishing-point',
        type: 'multiple_choice',
        question: 'In 1-point perspective, parallel lines appear to converge at:',
        options: [
          'The horizon line',
          'A vanishing point',
          'The center of the drawing',
          'Multiple points'
        ],
        correctAnswer: 1,
        explanation: 'All parallel lines going away from you converge at a single vanishing point in 1-point perspective.',
        xp: 18,
      }
    ],
    
    objectives: [
      {
        id: 'perspective-1',
        description: 'Understand perspective fundamentals',
        completed: false,
        required: true,
      }
    ],
    
    theoryContent: {
      segments: [
        {
          id: 'theory-1',
          type: 'text',
          content: 'Perspective is the magic that makes flat drawings come alive. Master these basics and watch your art gain incredible depth!',
          duration: 45,
          order: 1,
        }
      ],
      totalDuration: 90,
      objectives: [
        {
          id: 'learn-perspective',
          description: 'Learn perspective basics',
          type: 'primary',
          completed: false,
          required: true,
        },
      ],
    },
    
    rewards: {
      xp: 45,
      achievements: ['perspective_master'],
      unlocks: ['lesson-cube-perspective'],
    },
    
    status: 'locked',
    progress: 0,
    attempts: 0,
    timeSpent: 0,
    tags: ['theory', 'perspective', 'advanced'],
  },

  // LESSON 6: Perspective Practice - Drawing a Cube
  {
    id: 'lesson-cube-perspective',
    title: 'Draw a Cube in Perspective',
    description: 'Apply perspective principles to draw a realistic cube',
    type: 'practice' as LessonType,
    skillTree: 'drawing-fundamentals',
    order: 6,
    estimatedTime: 10,
    difficulty: 2,
    prerequisites: ['lesson-perspective-basics'],
    
    content: [
      {
        id: 'horizon-line',
        type: 'guided_step',
        instruction: 'Draw a horizontal line across your canvas (horizon line)',
        hint: 'Keep it straight and level',
        validation: {
          type: 'line_count',
          target: 1,
          threshold: 0.8,
        },
        xp: 15,
      },
      {
        id: 'vanishing-point',
        type: 'guided_step',
        instruction: 'Mark a point on the horizon line (vanishing point)',
        hint: 'This is where all depth lines will meet',
        validation: {
          type: 'point_placement',
          target: 'horizon_line',
          threshold: 0.7,
        },
        xp: 20,
      },
      {
        id: 'front-face',
        type: 'guided_step',
        instruction: 'Draw a square for the front face of the cube',
        hint: 'Make it a perfect square, not a rectangle',
        validation: {
          type: 'shape_accuracy',
          target: 'square',
          tolerance: 0.8,
          threshold: 0.7,
        },
        xp: 25,
      },
      {
        id: 'depth-lines',
        type: 'guided_step',
        instruction: 'Draw lines from the back corners to the vanishing point',
        hint: 'These lines create the illusion of depth',
        validation: {
          type: 'perspective_lines',
          target: 'vanishing_point',
          tolerance: 0.15,
          threshold: 0.6,
        },
        xp: 30,
      }
    ],
    
    objectives: [
      {
        id: 'cube-perspective',
        description: 'Draw a cube in 1-point perspective',
        completed: false,
        required: true,
      }
    ],
    
    practiceContent: {
      instructions: [
        {
          id: 'practice-1',
          text: 'Apply perspective to create a realistic cube that appears three-dimensional.',
          type: 'draw',
          hint: 'Remember: parallel lines meet at the vanishing point',
          expectedResult: 'A cube drawn in proper 1-point perspective',
          order: 1,
        },
      ],
      hints: [],
      canvas: {
        width: 800,
        height: 600,
        backgroundColor: '#FFFFFF',
      },
      expectedDuration: 10,
    },
    
    rewards: {
      xp: 90,
      achievements: ['perspective_artist', 'cube_master'],
      unlocks: [], // More lessons could be added
    },
    
    status: 'locked',
    progress: 0,
    attempts: 0,
    timeSpent: 0,
    tags: ['practice', 'perspective', 'construction', 'advanced'],
  },
];

// =================== HELPER FUNCTIONS ===================

export function getFundamentalLessons(): Lesson[] {
  return fundamentalLessons;
}

export function getLessonById(lessonId: string): Lesson | null {
  return fundamentalLessons.find(lesson => lesson.id === lessonId) || null;
}

export function isLessonAvailable(lessonId: string, completedLessons: string[]): boolean {
  const lesson = getLessonById(lessonId);
  if (!lesson) return false;
  
  if (lesson.prerequisites.length === 0) return true;
  
  return lesson.prerequisites.every(prereq => completedLessons.includes(prereq));
}

// =================== EASY LESSON CREATION HELPERS ===================

export function createTheoryLesson(config: {
  id: string;
  title: string;
  description: string;
  order: number;
  prerequisites: string[];
  questions: any[];
  tags?: string[];
}): Lesson {
  const totalXP = config.questions.reduce((sum, q) => sum + (q.xp || 10), 0);
  
  return {
    ...config,
    type: 'theory' as LessonType,
    skillTree: 'drawing-fundamentals',
    estimatedTime: Math.max(3, Math.min(10, config.questions.length * 1.5)),
    difficulty: 1,
    
    // NEW: Content array
    content: config.questions,
    
    // EXISTING: Original structure
    objectives: [
      {
        id: `${config.id}-obj`,
        description: `Complete ${config.title}`,
        completed: false, // FIXED: Added missing property
        required: true,
      }
    ],
    
    theoryContent: {
      segments: [
        {
          id: `${config.id}-segment`,
          type: 'text',
          content: config.description,
          duration: 30,
          order: 1,
        }
      ],
      totalDuration: 30,
      objectives: [
        {
          id: `${config.id}-learn`,
          description: `Learn ${config.title}`,
          type: 'primary',
          completed: false, // FIXED: Added missing property
          required: true,
        }
      ],
    },
    
    rewards: {
      xp: totalXP,
      achievements: [`${config.id.replace('lesson-', '')}_master`],
      unlocks: [],
    },
    status: 'locked',
    progress: 0,
    attempts: 0,
    timeSpent: 0,
    tags: config.tags || ['theory'],
  };
}

export function createPracticeLesson(config: {
  id: string;
  title: string;
  description: string;
  order: number;
  prerequisites: string[];
  exercises: any[];
  tags?: string[];
}): Lesson {
  const totalXP = config.exercises.reduce((sum, e) => sum + (e.xp || 15), 0);
  
  return {
    ...config,
    type: 'practice' as LessonType,
    skillTree: 'drawing-fundamentals',
    estimatedTime: Math.max(5, Math.min(15, config.exercises.length * 3)),
    difficulty: 1,
    
    // NEW: Content array
    content: config.exercises,
    
    // EXISTING: Original structure
    objectives: [
      {
        id: `${config.id}-obj`,
        description: `Complete ${config.title}`,
        completed: false, // FIXED: Added missing property
        required: true,
      }
    ],
    
    practiceContent: {
      instructions: config.exercises.map((exercise, index) => ({
        id: exercise.id || `instruction-${index}`,
        text: exercise.instruction || exercise.text || 'Practice exercise',
        type: 'draw',
        hint: exercise.hint,
        expectedResult: 'Complete the exercise',
        order: index + 1,
      })),
      hints: [],
      canvas: {
        width: 800,
        height: 600,
        backgroundColor: '#FFFFFF',
      },
      expectedDuration: Math.max(5, config.exercises.length * 2),
    },
    
    rewards: {
      xp: totalXP,
      achievements: [`${config.id.replace('lesson-', '')}_master`],
      unlocks: [],
    },
    status: 'locked',
    progress: 0,
    attempts: 0,
    timeSpent: 0,
    tags: config.tags || ['practice'],
  };
}

// =================== LESSON PROGRESSION LOGIC ===================

export function getNextAvailableLesson(completedLessons: string[]): Lesson | null {
  const availableLessons = fundamentalLessons.filter(lesson => 
    isLessonAvailable(lesson.id, completedLessons) && !completedLessons.includes(lesson.id)
  );
  
  // Return the first available lesson by order
  return availableLessons.sort((a, b) => a.order - b.order)[0] || null;
}

export function calculateSkillTreeProgress(completedLessons: string[]): number {
  const totalLessons = fundamentalLessons.length;
  const completedCount = completedLessons.filter(lessonId => 
    fundamentalLessons.some(lesson => lesson.id === lessonId)
  ).length;
  
  return totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;
}

export function getLessonsByDifficulty(difficulty: number): Lesson[] {
  return fundamentalLessons.filter(lesson => lesson.difficulty === difficulty);
}

export function getLessonsByType(type: LessonType): Lesson[] {
  return fundamentalLessons.filter(lesson => lesson.type === type);
}

// =================== DUOLINGO-STYLE FEATURES ===================

export function generateDailyChallenge(): Lesson | null {
  // Pick a random lesson for daily practice
  const practiceLessons = fundamentalLessons.filter(lesson => lesson.type === 'practice');
  if (practiceLessons.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * practiceLessons.length);
  return practiceLessons[randomIndex];
}

export function getStreakBonus(currentStreak: number): number {
  // XP bonus based on streak
  if (currentStreak >= 30) return 2.0; // 100% bonus
  if (currentStreak >= 14) return 1.5; // 50% bonus
  if (currentStreak >= 7) return 1.25; // 25% bonus
  if (currentStreak >= 3) return 1.1; // 10% bonus
  return 1.0; // No bonus
}

export function getPersonalizedRecommendation(userStats: any): Lesson | null {
  // Simple recommendation based on user weak areas
  if (userStats?.weakAreas?.includes('perspective')) {
    return getLessonById('lesson-perspective-basics');
  }
  if (userStats?.weakAreas?.includes('lines')) {
    return getLessonById('lesson-line-practice');
  }
  
  // Default to next lesson in sequence
  return fundamentalLessons[0];
}