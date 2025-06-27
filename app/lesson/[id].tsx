// app/lesson/[id].tsx - FIXED VERSION
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Dimensions,
  SafeAreaView,
  Image,
  ActivityIndicator,
} from 'react-native';
import Animated, { 
  FadeInUp, 
  FadeInDown, 
  useSharedValue, 
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useLearning } from '../../src/contexts/LearningContext';
import { useUserProgress } from '../../src/contexts/UserProgressContext';
import { lessonEngine } from '../../src/engines/learning/LessonEngine';
import { skillTreeManager } from '../../src/engines/learning/SkillTreeManager';
import { musicManager } from '../../src/engines/LessonMusicManager';
import { Lesson, LessonContent } from '../../src/types';
import * as Haptics from 'expo-haptics';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Circle,
  X,
  Lightbulb,
  Star,
  Trophy,
  Clock,
  Target,
  Brush,
  BookOpen,
  Volume2,
  VolumeX,
} from 'lucide-react-native';

// Import the fixed canvas
import { ProfessionalCanvas } from '../../src/engines/drawing/ProfessionalCanvas';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function LessonScreen() {
  // =================== CRITICAL FIX: ALL HOOKS FIRST ===================
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();
  const { addXP } = useUserProgress();
  
  // State hooks - ALL MUST BE HERE, NO CONDITIONS
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [currentContent, setCurrentContent] = useState<LessonContent | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true); // Start true
  const [showHint, setShowHint] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [canvasStrokes, setCanvasStrokes] = useState<any[]>([]);
  
  // Refs - ALL MUST BE HERE
  const canvasRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTime = useRef<number>(Date.now());
  
  // Animations - ALL MUST BE HERE
  const progressAnimation = useSharedValue(0);
  const resultAnimation = useSharedValue(0);
  const celebrationAnimation = useSharedValue(0);
  
  // Memoized values
  const lessonId = useMemo(() => {
    return typeof id === 'string' ? id : null;
  }, [id]);
  
  const styles = useMemo(() => createStyles(theme), [theme]);

  // =================== NOW WE CAN DO CONDITIONAL LOGIC ===================
  
  useEffect(() => {
    if (lessonId) {
      initializeLesson(lessonId);
    } else {
      setIsLoading(false);
      Alert.alert('Error', 'No lesson ID provided');
      router.back();
    }
    
    return () => {
      stopTimer();
      musicManager.stop().catch(console.error);
    };
  }, [lessonId]);

  // =================== INITIALIZATION ===================

  const initializeLesson = async (lessonId: string) => {
    try {
      setIsLoading(true);
      
      // Initialize lesson engine if needed
      if (!lessonEngine.getAllLessons().length) {
        await lessonEngine.initialize();
      }
      
      // Get lesson data
      const lessonData = lessonEngine.getLessonById(lessonId);
      if (!lessonData) {
        throw new Error('Lesson not found');
      }
      
      setLesson(lessonData);
      
      // Start lesson
      await lessonEngine.startLesson(lessonData);
      
      // Get first content
      const firstContent = lessonEngine.getCurrentContent();
      if (firstContent) {
        setCurrentContent(firstContent);
      }
      
      // Start music if enabled
      if (musicEnabled) {
        try {
          const musicType = lessonData.type === 'theory' ? 'theory' : 
                           lessonData.type === 'practice' ? 'practice' : 'drawing';
          await musicManager.startLessonMusic(musicType);
        } catch (error) {
          console.warn('Music failed to start:', error);
        }
      }
      
      // Start timer
      startTimer();
      
      console.log(`🎓 Lesson initialized: ${lessonData.title}`);
      
    } catch (error) {
      console.error('❌ Failed to initialize lesson:', error);
      Alert.alert('Error', 'Failed to load lesson');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  // =================== TIMER MANAGEMENT ===================

  const startTimer = () => {
    startTime.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // =================== PROGRESS TRACKING ===================

  useEffect(() => {
    if (!currentContent) return;
    
    try {
      const progress = lessonEngine.getLessonProgress();
      if (progress) {
        const progressValue = Math.max(0, Math.min(100, progress.contentProgress || 0)) / 100;
        progressAnimation.value = withTiming(progressValue, { duration: 500 });
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  }, [currentContent]);

  // =================== ANSWER HANDLING ===================

  const handleAnswerSelect = useCallback(async (answer: any) => {
    if (!currentContent || showResult || isLoading) return;
    
    try {
      setIsLoading(true);
      setSelectedAnswer(answer);
      
      // Submit answer
      const result = await lessonEngine.submitAnswer(currentContent.id, answer);
      
      setResultData(result);
      setShowResult(true);
      
      // Animate result
      resultAnimation.value = withTiming(1, { duration: 300 });
      
      if (result.isCorrect) {
        celebrationAnimation.value = withSequence(
          withSpring(1.2, { damping: 10 }),
          withSpring(1, { damping: 15 })
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      
    } catch (error) {
      console.error('Failed to submit answer:', error);
      Alert.alert('Error', 'Failed to submit answer');
    } finally {
      setIsLoading(false);
    }
  }, [currentContent, showResult, isLoading]);

  // =================== NAVIGATION ===================

  const handleContinue = useCallback(async () => {
    try {
      setIsLoading(true);
      const hasNext = await lessonEngine.nextContent();
      
      if (hasNext) {
        const nextContent = lessonEngine.getCurrentContent();
        setCurrentContent(nextContent);
        setSelectedAnswer(null);
        setShowResult(false);
        setResultData(null);
        setShowHint(false);
        setCanvasStrokes([]);
        
        resultAnimation.value = 0;
        celebrationAnimation.value = 0;
      } else {
        await handleLessonComplete();
      }
    } catch (error) {
      console.error('Failed to continue:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLessonComplete = useCallback(async () => {
    try {
      stopTimer();
      await musicManager.stop();
      
      const progress = lessonEngine.getLessonProgress();
      if (progress && lesson) {
        addXP(lesson.rewards.xp);
        
        Alert.alert(
          'Lesson Complete! 🎉',
          `Score: ${Math.round(progress.score)}%\nXP Earned: ${lesson.rewards.xp}\nTime: ${Math.floor(timeSpent / 60)}m ${timeSpent % 60}s`,
          [
            {
              text: 'Continue Learning',
              onPress: () => router.push('/(tabs)/learn')
            }
          ]
        );
      }
    } catch (error) {
      console.error('Failed to complete lesson:', error);
    }
  }, [lesson, timeSpent, addXP, router]);

  const handleExit = useCallback(() => {
    Alert.alert(
      'Exit Lesson',
      'Your progress will be saved. Continue learning later?',
      [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Exit',
          onPress: () => {
            lessonEngine.exitLesson();
            musicManager.stop();
            router.back();
          }
        }
      ]
    );
  }, [router]);

  // =================== DRAWING HANDLING ===================

  const handleStrokeAdded = useCallback((stroke: any) => {
    setCanvasStrokes(prev => [...prev, stroke]);
  }, []);

  const handleDrawingSubmit = useCallback(() => {
    if (canvasStrokes.length > 0) {
      handleAnswerSelect({ strokes: canvasStrokes, strokeCount: canvasStrokes.length });
    }
  }, [canvasStrokes, handleAnswerSelect]);

  const handleCanvasClear = useCallback(() => {
    setCanvasStrokes([]);
    if (canvasRef.current?.clear) {
      canvasRef.current.clear();
    }
  }, []);

  const handleCanvasUndo = useCallback(() => {
    if (canvasRef.current?.undo) {
      canvasRef.current.undo();
      setCanvasStrokes(prev => prev.slice(0, -1));
    }
  }, []);

  // =================== CONTENT RENDERERS ===================

  const renderMultipleChoice = (content: LessonContent) => (
    <View style={styles.contentContainer}>
      <Text style={[styles.questionText, { color: theme.colors.text }]}>
        {content.question}
      </Text>
      
      {content.image && (
        <Image source={{ uri: content.image }} style={styles.questionImage} />
      )}
      
      <View style={styles.optionsContainer}>
        {content.options?.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isCorrectOption = index === content.correctAnswer;
          
          let backgroundColor = theme.colors.surface;
          let borderColor = theme.colors.border;
          
          if (showResult) {
            if (isSelected && resultData?.isCorrect) {
              backgroundColor = theme.colors.success + '20';
              borderColor = theme.colors.success;
            } else if (isSelected && !resultData?.isCorrect) {
              backgroundColor = theme.colors.error + '20';
              borderColor = theme.colors.error;
            } else if (isCorrectOption) {
              backgroundColor = theme.colors.success + '20';
              borderColor = theme.colors.success;
            }
          } else if (isSelected) {
            backgroundColor = theme.colors.primary + '20';
            borderColor = theme.colors.primary;
          }
          
          return (
            <Pressable
              key={index}
              style={[
                styles.optionButton,
                { backgroundColor, borderColor, borderWidth: 2 }
              ]}
              onPress={() => handleAnswerSelect(index)}
              disabled={showResult || isLoading}
            >
              <Text style={[styles.optionText, { color: theme.colors.text }]}>
                {String.fromCharCode(65 + index)}. {option}
              </Text>
              
              {showResult && isCorrectOption && (
                <CheckCircle size={24} color={theme.colors.success} />
              )}
              {showResult && isSelected && !resultData?.isCorrect && (
                <X size={24} color={theme.colors.error} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const renderDrawingExercise = (content: LessonContent) => (
    <View style={styles.contentContainer}>
      <Text style={[styles.questionText, { color: theme.colors.text }]}>
        {content.instruction}
      </Text>
      
      {content.hint && (
        <Text style={[styles.instructionHint, { color: theme.colors.textSecondary }]}>
          💡 {content.hint}
        </Text>
      )}
      
      <View style={styles.canvasContainer}>
        <ProfessionalCanvas
          ref={canvasRef}
          width={screenWidth - 40}
          height={300}
          onStrokeAdded={handleStrokeAdded}
          onDrawingStateChange={(isDrawing) => {
            if (!isDrawing && canvasStrokes.length > 0) {
              // Auto-validate after drawing
              setTimeout(handleDrawingSubmit, 500);
            }
          }}
          disabled={showResult}
          currentTool="brush"
          currentColor={{ hex: '#000000' }}
          brushSize={5}
          opacity={1}
          showDebugInfo={false}
          style={styles.canvas}
        />
      </View>
      
      <View style={styles.drawingControls}>
        <Pressable
          style={[styles.controlButton, { backgroundColor: theme.colors.surface }]}
          onPress={handleCanvasUndo}
          disabled={canvasStrokes.length === 0}
        >
          <Text style={[styles.controlButtonText, { color: theme.colors.text }]}>
            Undo
          </Text>
        </Pressable>
        
        <Pressable
          style={[styles.controlButton, { backgroundColor: theme.colors.surface }]}
          onPress={handleCanvasClear}
          disabled={canvasStrokes.length === 0}
        >
          <Text style={[styles.controlButtonText, { color: theme.colors.text }]}>
            Clear
          </Text>
        </Pressable>
        
        <Pressable
          style={[
            styles.controlButton, 
            { 
              backgroundColor: theme.colors.primary,
              flex: 1,
            }
          ]}
          onPress={handleDrawingSubmit}
          disabled={canvasStrokes.length === 0 || showResult}
        >
          <Text style={[styles.controlButtonText, { color: '#FFFFFF' }]}>
            Check Drawing
          </Text>
        </Pressable>
      </View>
    </View>
  );

  const renderTrueFalse = (content: LessonContent) => (
    <View style={styles.contentContainer}>
      <Text style={[styles.questionText, { color: theme.colors.text }]}>
        {content.question}
      </Text>
      
      <View style={styles.trueFalseContainer}>
        {[true, false].map((value) => {
          const label = value ? 'True' : 'False';
          const isSelected = selectedAnswer === value;
          const isCorrect = value === content.correctAnswer;
          
          let backgroundColor = theme.colors.surface;
          let borderColor = theme.colors.border;
          
          if (showResult) {
            if (isSelected && resultData?.isCorrect) {
              backgroundColor = theme.colors.success + '20';
              borderColor = theme.colors.success;
            } else if (isSelected && !resultData?.isCorrect) {
              backgroundColor = theme.colors.error + '20';
              borderColor = theme.colors.error;
            } else if (isCorrect) {
              backgroundColor = theme.colors.success + '20';
              borderColor = theme.colors.success;
            }
          } else if (isSelected) {
            backgroundColor = theme.colors.primary + '20';
            borderColor = theme.colors.primary;
          }
          
          return (
            <Pressable
              key={label}
              style={[
                styles.trueFalseButton,
                { backgroundColor, borderColor, borderWidth: 2 }
              ]}
              onPress={() => handleAnswerSelect(value)}
              disabled={showResult || isLoading}
            >
              <Text style={[styles.trueFalseText, { color: theme.colors.text }]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const renderCurrentContent = () => {
    if (!currentContent) return null;
    
    switch (currentContent.type) {
      case 'multiple_choice':
        return renderMultipleChoice(currentContent);
      case 'true_false':
        return renderTrueFalse(currentContent);
      case 'drawing_exercise':
      case 'guided_step':
      case 'shape_practice':
        return renderDrawingExercise(currentContent);
      default:
        return (
          <View style={styles.contentContainer}>
            <Text style={[styles.questionText, { color: theme.colors.text }]}>
              Content type "{currentContent.type}" coming soon!
            </Text>
          </View>
        );
    }
  };

  // =================== UI COMPONENTS ===================

  const renderHeader = () => {
    const progress = lessonEngine.getLessonProgress();
    const progressPercent = progress ? Math.round(progress.contentProgress || 0) : 0;
    
    return (
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Pressable style={styles.headerButton} onPress={handleExit}>
          <ChevronLeft size={24} color={theme.colors.text} />
        </Pressable>
        
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]} numberOfLines={1}>
            {lesson?.title || 'Loading...'}
          </Text>
          
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
              <Animated.View 
                style={[
                  styles.progressFill, 
                  { backgroundColor: theme.colors.primary },
                  useAnimatedStyle(() => ({
                    width: `${progressAnimation.value * 100}%`,
                  }))
                ]} 
              />
            </View>
            <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
              {progressPercent}%
            </Text>
          </View>
        </View>
        
        <Pressable 
          style={styles.headerButton} 
          onPress={() => setMusicEnabled(!musicEnabled)}
        >
          {musicEnabled ? (
            <Volume2 size={24} color={theme.colors.text} />
          ) : (
            <VolumeX size={24} color={theme.colors.text} />
          )}
        </Pressable>
      </View>
    );
  };

  const renderResultFeedback = () => {
    if (!showResult || !resultData) return null;
    
    return (
      <Animated.View style={[
        styles.resultContainer,
        useAnimatedStyle(() => ({
          opacity: resultAnimation.value,
          transform: [{ translateY: withSpring((1 - resultAnimation.value) * 50) }],
        }))
      ]}>
        <View style={[
          styles.resultCard,
          { 
            backgroundColor: resultData.isCorrect 
              ? theme.colors.success + '20' 
              : theme.colors.error + '20',
            borderColor: resultData.isCorrect ? theme.colors.success : theme.colors.error,
          }
        ]}>
          <Animated.View style={[
            useAnimatedStyle(() => ({
              transform: [{ scale: celebrationAnimation.value }],
            }))
          ]}>
            {resultData.isCorrect ? (
              <CheckCircle size={32} color={theme.colors.success} />
            ) : (
              <X size={32} color={theme.colors.error} />
            )}
          </Animated.View>
          
          <Text style={[
            styles.resultTitle, 
            { color: resultData.isCorrect ? theme.colors.success : theme.colors.error }
          ]}>
            {resultData.feedback}
          </Text>
          
          {resultData.explanation && (
            <Text style={[styles.explanation, { color: theme.colors.text }]}>
              {resultData.explanation}
            </Text>
          )}
          
          {resultData.isCorrect && resultData.xpAwarded > 0 && (
            <View style={styles.xpContainer}>
              <Star size={16} color={theme.colors.warning} />
              <Text style={[styles.xpText, { color: theme.colors.text }]}>
                +{resultData.xpAwarded} XP
              </Text>
            </View>
          )}
        </View>
        
        <Pressable
          style={[styles.continueButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleContinue}
          disabled={isLoading}
        >
          <Text style={[styles.continueButtonText, { color: theme.colors.surface }]}>
            Continue
          </Text>
        </Pressable>
      </Animated.View>
    );
  };

  // =================== LOADING STATE ===================

  if (isLoading && !lesson) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading lesson...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // =================== MAIN RENDER ===================

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {renderHeader()}
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View entering={FadeInUp} style={styles.lessonContainer}>
          {/* Lesson type indicator */}
          <View style={styles.lessonTypeContainer}>
            <View style={[styles.lessonTypeIcon, { backgroundColor: theme.colors.primary + '20' }]}>
              {lesson?.type === 'theory' ? (
                <BookOpen size={20} color={theme.colors.primary} />
              ) : (
                <Brush size={20} color={theme.colors.primary} />
              )}
            </View>
            <Text style={[styles.lessonTypeText, { color: theme.colors.textSecondary }]}>
              {lesson?.type === 'theory' ? 'Theory' : 'Practice'} • {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
            </Text>
          </View>
          
          {/* Main content */}
          {renderCurrentContent()}
          
          {/* Hint display */}
          {showHint && currentContent?.hint && (
            <Animated.View entering={FadeInDown} style={[styles.hintDisplay, { backgroundColor: theme.colors.warning + '20' }]}>
              <Lightbulb size={16} color={theme.colors.warning} />
              <Text style={[styles.hintDisplayText, { color: theme.colors.text }]}>
                {currentContent.hint}
              </Text>
            </Animated.View>
          )}
        </Animated.View>
      </ScrollView>
      
      {/* Result feedback overlay */}
      {renderResultFeedback()}
    </SafeAreaView>
  );
}

// =================== STYLES ===================

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  lessonContainer: {
    padding: 20,
  },
  lessonTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  lessonTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  lessonTypeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  contentContainer: {
    marginBottom: 20,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    textAlign: 'center',
    marginBottom: 20,
  },
  questionImage: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    marginBottom: 20,
    borderRadius: 8,
  },
  instructionHint: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  trueFalseContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  trueFalseButton: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
  },
  trueFalseText: {
    fontSize: 18,
    fontWeight: '600',
  },
  canvasContainer: {
    alignItems: 'center',
    marginVertical: 20,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  canvas: {
    borderRadius: 12,
  },
  drawingControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
  },
  controlButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  hintDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  hintDisplayText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  resultContainer: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    paddingBottom: 20,
  },
  resultCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 12,
  },
  explanation: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  xpText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  continueButton: {
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});