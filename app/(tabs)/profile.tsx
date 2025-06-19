import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useUserProgress, useProgress } from '../../src/contexts/UserProgressContext';
import { useLearning } from '../../src/contexts/LearningContext';
import { challengeSystem } from '../../src/engines/community/ChallengeSystem';
import { portfolioManager } from '../../src/engines/user/PortfolioManager';
import {
  User,
  Trophy,
  Star,
  Target,
  TrendingUp,
  Calendar,
  Clock,
  Palette,
  Brush,
  Layers,
  Heart,
  Eye,
  Share2,
  Award,
  Zap,
  Book,
  Settings,
  ChevronRight,
  BarChart3,
  Activity,
  Image as ImageIcon,
  Grid3x3,
  Flame,
} from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, portfolio } = useUserProgress();
  const { level, xp, xpToNextLevel, xpProgress, streakDays, achievements, learningStats } = useProgress();
  const { currentStreak, skillTrees, completedLessons } = useLearning();
  
  // State
  const [refreshing, setRefreshing] = useState(false);
  const [portfolioStats, setPortfolioStats] = useState<any>(null);
  const [recentArtworks, setRecentArtworks] = useState<any[]>([]);
  const [challengeStats, setChallengeStats] = useState<any>(null);
  const [skillProgress, setSkillProgress] = useState<any[]>([]);
  
  const styles = createStyles(theme);

  // Load profile data
  useEffect(() => {
    loadProfileData();
  }, [user]);

  const loadProfileData = useCallback(async () => {
    if (!user) return;

    try {
      // Load portfolio stats
      const stats = portfolioManager.getPortfolioStats(user.id);
      setPortfolioStats(stats);

      // Load recent artworks
      const recent = portfolioManager.getRecentArtworks(user.id, 6);
      setRecentArtworks(recent);

      // Load challenge stats
      const userChallengeStats = challengeSystem.getUserChallengeStats(user.id);
      setChallengeStats(userChallengeStats);

      // Calculate skill progress
      const progress = skillTrees.map(tree => ({
        name: tree.name,
        progress: (tree.lessons.filter(lesson => 
          completedLessons.includes(lesson.id)
        ).length / tree.lessons.length) * 100,
        icon: tree.iconUrl,
      }));
      setSkillProgress(progress);

    } catch (error) {
      console.error('Failed to load profile data:', error);
    }
  }, [user, skillTrees, completedLessons]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  }, [loadProfileData]);

  const renderHeader = () => (
    <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
      <View style={styles.headerBackground}>
        <View style={[styles.avatarContainer, { backgroundColor: theme.colors.primary }]}>
          <User size={32} color={theme.colors.surface} />
        </View>
        
        <Text style={[styles.displayName, { color: theme.colors.text }]}>
          {user?.displayName || 'Artist'}
        </Text>
        
        <Text style={[styles.userLevel, { color: theme.colors.textSecondary }]}>
          Level {level} Artist
        </Text>
        
        <View style={styles.streakContainer}>
          <Flame size={16} color={theme.colors.warning} />
          <Text style={[styles.streakText, { color: theme.colors.warning }]}>
            {streakDays} day streak
          </Text>
        </View>
      </View>
      
      <Pressable
        style={styles.settingsButton}
        onPress={() => router.push('/settings')}
      >
        <Settings size={24} color={theme.colors.text} />
      </Pressable>
    </Animated.View>
  );

  const renderXPProgress = () => (
    <Animated.View entering={FadeInUp.delay(200)} style={styles.xpSection}>
      <View style={[styles.xpCard, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.xpHeader}>
          <Text style={[styles.xpTitle, { color: theme.colors.text }]}>
            Experience Points
          </Text>
          <Text style={[styles.xpAmount, { color: theme.colors.primary }]}>
            {xp.toLocaleString()} XP
          </Text>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarBg, { backgroundColor: theme.colors.border }]}>
            <Animated.View
              style={[
                styles.progressBarFill,
                { backgroundColor: theme.colors.primary, width: `${xpProgress * 100}%` },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
            {xpToNextLevel} XP to Level {level + 1}
          </Text>
        </View>
      </View>
    </Animated.View>
  );

  const renderStats = () => (
    <Animated.View entering={FadeInUp.delay(300)} style={styles.statsSection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Your Progress
      </Text>
      
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <Book size={24} color={theme.colors.primary} />
          <Text style={[styles.statNumber, { color: theme.colors.text }]}>
            {learningStats.lessonsCompleted}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Lessons
          </Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <ImageIcon size={24} color={theme.colors.success} />
          <Text style={[styles.statNumber, { color: theme.colors.text }]}>
            {portfolioStats?.totalArtworks || 0}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Artworks
          </Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <Trophy size={24} color={theme.colors.warning} />
          <Text style={[styles.statNumber, { color: theme.colors.text }]}>
            {challengeStats?.totalWins || 0}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Wins
          </Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
          <Clock size={24} color={theme.colors.info} />
          <Text style={[styles.statNumber, { color: theme.colors.text }]}>
            {Math.round(learningStats.totalStudyTime / 60)}h
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Study Time
          </Text>
        </View>
      </View>
    </Animated.View>
  );

  const renderAchievements = () => {
    const recentAchievements = achievements.slice(0, 6);
    
    return (
      <Animated.View entering={FadeInUp.delay(400)} style={styles.achievementsSection}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Recent Achievements
          </Text>
          <Pressable style={styles.seeAllButton}>
            <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>
              See All
            </Text>
            <ChevronRight size={16} color={theme.colors.primary} />
          </Pressable>
        </View>
        
        {recentAchievements.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.colors.surface }]}>
            <Award size={32} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              Complete lessons to earn achievements
            </Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recentAchievements.map((achievement: any, index: number) => (
              <View
                key={achievement.id}
                style={[styles.achievementCard, { backgroundColor: theme.colors.surface }]}
              >
                <View style={styles.achievementIcon}>
                  <Text style={styles.achievementEmoji}>{achievement.icon}</Text>
                </View>
                <Text style={[styles.achievementName, { color: theme.colors.text }]}>
                  {achievement.name}
                </Text>
                <Text style={[styles.achievementDescription, { color: theme.colors.textSecondary }]}>
                  {achievement.description}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}
      </Animated.View>
    );
  };

  const renderSkillProgress = () => (
    <Animated.View entering={FadeInUp.delay(500)} style={styles.skillSection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Skill Trees
      </Text>
      
      {skillProgress.map((skill, index) => (
        <View
          key={skill.name}
          style={[styles.skillCard, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.skillHeader}>
            <Text style={styles.skillIcon}>{skill.icon}</Text>
            <View style={styles.skillInfo}>
              <Text style={[styles.skillName, { color: theme.colors.text }]}>
                {skill.name}
              </Text>
              <Text style={[styles.skillProgress, { color: theme.colors.textSecondary }]}>
                {Math.round(skill.progress)}% Complete
              </Text>
            </View>
          </View>
          
          <View style={styles.skillProgressBar}>
            <View style={[styles.progressBarBg, { backgroundColor: theme.colors.border }]}>
              <View
                style={[
                  styles.progressBarFill,
                  { backgroundColor: theme.colors.primary, width: `${skill.progress}%` },
                ]}
              />
            </View>
          </View>
        </View>
      ))}
    </Animated.View>
  );

  const renderRecentArtwork = () => (
    <Animated.View entering={FadeInUp.delay(600)} style={styles.artworkSection}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Recent Artwork
        </Text>
        <Pressable 
          style={styles.seeAllButton}
          onPress={() => router.push('/(tabs)/gallery')}
        >
          <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>
            View Gallery
          </Text>
          <ChevronRight size={16} color={theme.colors.primary} />
        </Pressable>
      </View>
      
      {recentArtworks.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: theme.colors.surface }]}>
          <Palette size={32} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            Start drawing to build your portfolio
          </Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {recentArtworks.map((artwork) => (
            <Pressable
              key={artwork.id}
              style={[styles.artworkCard, { backgroundColor: theme.colors.surface }]}
            >
              <View style={[styles.artworkThumbnail, { backgroundColor: theme.colors.background }]}>
                <ImageIcon size={24} color={theme.colors.textSecondary} />
              </View>
              
              <Text style={[styles.artworkTitle, { color: theme.colors.text }]} numberOfLines={1}>
                {artwork.title}
              </Text>
              
              <View style={styles.artworkStats}>
                <View style={styles.artworkStat}>
                  <Heart size={12} color={theme.colors.textSecondary} />
                  <Text style={[styles.artworkStatText, { color: theme.colors.textSecondary }]}>
                    {artwork.stats.likes}
                  </Text>
                </View>
                
                <View style={styles.artworkStat}>
                  <Eye size={12} color={theme.colors.textSecondary} />
                  <Text style={[styles.artworkStatText, { color: theme.colors.textSecondary }]}>
                    {artwork.stats.views}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </Animated.View>
  );

  const renderInsights = () => (
    <Animated.View entering={FadeInUp.delay(700)} style={styles.insightsSection}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Learning Insights
      </Text>
      
      <View style={[styles.insightCard, { backgroundColor: theme.colors.surface }]}>
        <TrendingUp size={20} color={theme.colors.success} />
        <View style={styles.insightContent}>
          <Text style={[styles.insightTitle, { color: theme.colors.text }]}>
            Great Progress!
          </Text>
          <Text style={[styles.insightDescription, { color: theme.colors.textSecondary }]}>
            You've completed {learningStats.lessonsCompleted} lessons this month. Keep up the momentum!
          </Text>
        </View>
      </View>
      
      {learningStats.strongestSkills.length > 0 && (
        <View style={[styles.insightCard, { backgroundColor: theme.colors.surface }]}>
          <Star size={20} color={theme.colors.warning} />
          <View style={styles.insightContent}>
            <Text style={[styles.insightTitle, { color: theme.colors.text }]}>
              Strongest Skills
            </Text>
            <Text style={[styles.insightDescription, { color: theme.colors.textSecondary }]}>
              {learningStats.strongestSkills.join(', ')}
            </Text>
          </View>
        </View>
      )}
      
      {learningStats.improvementAreas.length > 0 && (
        <View style={[styles.insightCard, { backgroundColor: theme.colors.surface }]}>
          <Target size={20} color={theme.colors.primary} />
          <View style={styles.insightContent}>
            <Text style={[styles.insightTitle, { color: theme.colors.text }]}>
              Focus Areas
            </Text>
            <Text style={[styles.insightDescription, { color: theme.colors.textSecondary }]}>
              Consider practicing: {learningStats.improvementAreas.join(', ')}
            </Text>
          </View>
        </View>
      )}
    </Animated.View>
  );

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.emptyState}>
          <User size={64} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            Sign in to view your profile
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        {renderXPProgress()}
        {renderStats()}
        {renderAchievements()}
        {renderSkillProgress()}
        {renderRecentArtwork()}
        {renderInsights()}
        
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    position: 'relative',
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerBackground: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  userLevel: {
    fontSize: 16,
    marginBottom: 8,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  settingsButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    padding: 8,
  },
  xpSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  xpCard: {
    padding: 20,
    borderRadius: 16,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  xpTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  xpAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  progressBarContainer: {
    alignItems: 'center',
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  achievementsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  achievementCard: {
    width: 140,
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  achievementEmoji: {
    fontSize: 20,
  },
  achievementName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
  skillSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  skillCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  skillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  skillIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  skillInfo: {
    flex: 1,
  },
  skillName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  skillProgress: {
    fontSize: 14,
  },
  skillProgressBar: {
    marginTop: 8,
  },
  artworkSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  artworkCard: {
    width: 120,
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
  },
  artworkThumbnail: {
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  artworkTitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
  },
  artworkStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  artworkStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  artworkStatText: {
    fontSize: 10,
    marginLeft: 2,
  },
  insightsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  insightCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  insightContent: {
    flex: 1,
    marginLeft: 12,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    borderRadius: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 40,
  },
});