import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  Dimensions,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../src/contexts/ThemeContext';
import { useUserProgress } from '../src/contexts/UserProgressContext';
import { dataManager } from '../src/engines/core/DataManager';
import {
  ArrowLeft,
  Bell,
  Palette,
  Brush,
  BookOpen,
  Globe,
  Shield,
  Info,
  Sun,
  Moon,
  Volume2,
  Vibrate,
  Target,
  Clock,
  Download,
  Upload,
  Trash2,
  RefreshCw,
} from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');

interface AppSettings {
  theme: 'auto' | 'light' | 'dark';
  notifications: {
    lessons: boolean;
    achievements: boolean;
    social: boolean;
    challenges: boolean;
  };
  drawing: {
    pressureSensitivity: number;
    smoothing: number;
    autosave: boolean;
    hapticFeedback: boolean;
  };
  learning: {
    dailyGoal: number;
    reminderTime: string;
    difficulty: 'easy' | 'adaptive' | 'hard';
  };
}

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, progress } = useUserProgress();

  const [settings, setSettings] = useState<AppSettings>({
    theme: 'auto',
    notifications: {
      lessons: true,
      achievements: true,
      social: true,
      challenges: true,
    },
    drawing: {
      pressureSensitivity: 0.8,
      smoothing: 0.5,
      autosave: true,
      hapticFeedback: true,
    },
    learning: {
      dailyGoal: 1,
      reminderTime: '19:00',
      difficulty: 'adaptive',
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  const styles = createStyles(theme);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await dataManager.getAppSettings();
      if (savedSettings) {
        setSettings(savedSettings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async (newSettings: AppSettings) => {
    try {
      await dataManager.saveAppSettings(newSettings);
      setSettings(newSettings);
      console.log('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const updateSetting = useCallback((path: string, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current: any = newSettings;

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;

      // Save to storage
      saveSettings(newSettings);

      return newSettings;
    });
  }, []);

  // DARK MODE PATCH HERE:
  const handleThemeChange = (newTheme: 'auto' | 'light' | 'dark') => {
    updateSetting('theme', newTheme);

    // Fix: Update theme context directly
    if (newTheme === 'auto') {
      theme.setThemeMode('system');
    } else {
      theme.setThemeMode(newTheme);
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const exportData = async () => {
    try {
      setIsLoading(true);
      const data = await dataManager.exportAllData();
      Alert.alert(
        'Export Complete',
        'Your data has been prepared for export. In a full implementation, this would save to your device or cloud storage.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Export Failed', 'Unable to export data');
    } finally {
      setIsLoading(false);
    }
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your progress, artworks, and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await dataManager.clear();
              Alert.alert('Data Cleared', 'All data has been deleted');
              router.replace('/onboarding');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const renderSettingsSection = (title: string, items: React.ReactNode) => (
    <Animated.View entering={FadeInUp} style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        {title}
      </Text>
      <View style={[styles.sectionContent, { backgroundColor: theme.colors.surface }]}>
        {items}
      </View>
    </Animated.View>
  );

  const renderToggleItem = (
    icon: React.ReactNode,
    title: string,
    subtitle: string,
    value: boolean,
    onToggle: (value: boolean) => void
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>{icon}</View>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
          {title}
        </Text>
        <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
          {subtitle}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{
          false: theme.colors.border,
          true: theme.colors.primary + '60',
        }}
        thumbColor={value ? theme.colors.primary : theme.colors.textSecondary}
      />
    </View>
  );

  const renderSliderItem = (
    icon: React.ReactNode,
    title: string,
    subtitle: string,
    value: number,
    min: number,
    max: number,
    step: number,
    onValueChange: (value: number) => void,
    formatValue?: (value: number) => string
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>{icon}</View>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
          {title}
        </Text>
        <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
          {subtitle}
        </Text>
        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            minimumValue={min}
            maximumValue={max}
            value={value}
            step={step}
            onValueChange={onValueChange}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.border}
            thumbTintColor={theme.colors.primary}
          />
          <Text style={[styles.sliderValue, { color: theme.colors.text }]}>
            {formatValue ? formatValue(value) : value.toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderPressableItem = (
    icon: React.ReactNode,
    title: string,
    subtitle: string,
    onPress: () => void,
    destructive?: boolean
  ) => (
    <Pressable style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingIcon}>{icon}</View>
      <View style={styles.settingInfo}>
        <Text style={[
          styles.settingTitle, 
          { 
            color: destructive ? theme.colors.error : theme.colors.text 
          }
        ]}>
          {title}
        </Text>
        <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );

  const themeOptions = [
    {
      value: 'light' as const,
      title: 'Light',
      icon: <Sun size={24} color={theme.colors.primary} />,
    },
    {
      value: 'dark' as const,
      title: 'Dark',
      icon: <Moon size={24} color={theme.colors.primary} />,
    },
    {
      value: 'auto' as const,
      title: 'Auto',
      icon: <Palette size={24} color={theme.colors.primary} />,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Settings
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Appearance */}
        {renderSettingsSection(
          'Appearance',
          <>
            <View style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Palette size={24} color={theme.colors.primary} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                  Theme
                </Text>
                <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                  Choose your preferred color scheme
                </Text>
                <View style={styles.themeOptions}>
                  {themeOptions.map((option) => (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.themeOption,
                        {
                          backgroundColor: settings.theme === option.value
                            ? theme.colors.primary + '20'
                            : 'transparent',
                          borderColor: settings.theme === option.value
                            ? theme.colors.primary
                            : theme.colors.border,
                        },
                      ]}
                      onPress={() => handleThemeChange(option.value)}
                    >
                      {option.icon}
                      <Text style={[
                        styles.themeOptionText,
                        {
                          color: settings.theme === option.value
                            ? theme.colors.primary
                            : theme.colors.text,
                        },
                      ]}>
                        {option.title}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          </>
        )}

        {/* Notifications */}
        {renderSettingsSection(
          'Notifications',
          <>
            {renderToggleItem(
              <Bell size={24} color={theme.colors.primary} />,
              'Lesson Reminders',
              'Get notified about daily practice sessions',
              settings.notifications.lessons,
              (value) => updateSetting('notifications.lessons', value)
            )}
            {renderToggleItem(
              <Target size={24} color={theme.colors.primary} />,
              'Achievement Alerts',
              'Celebrate your milestones and progress',
              settings.notifications.achievements,
              (value) => updateSetting('notifications.achievements', value)
            )}
            {renderToggleItem(
              <Globe size={24} color={theme.colors.primary} />,
              'Social Updates',
              'Updates from artists you follow',
              settings.notifications.social,
              (value) => updateSetting('notifications.social', value)
            )}
            {renderToggleItem(
              <RefreshCw size={24} color={theme.colors.primary} />,
              'Challenge Notifications',
              'New challenges and competition updates',
              settings.notifications.challenges,
              (value) => updateSetting('notifications.challenges', value)
            )}
          </>
        )}

        {/* Drawing Settings */}
        {renderSettingsSection(
          'Drawing',
          <>
            {renderSliderItem(
              <Brush size={24} color={theme.colors.primary} />,
              'Pressure Sensitivity',
              'How responsive the brush is to pressure',
              settings.drawing.pressureSensitivity,
              0,
              1,
              0.1,
              (value) => updateSetting('drawing.pressureSensitivity', value),
              (value) => `${Math.round(value * 100)}%`
            )}
            {renderSliderItem(
              <Volume2 size={24} color={theme.colors.primary} />,
              'Stroke Smoothing',
              'Automatically smooth out brush strokes',
              settings.drawing.smoothing,
              0,
              1,
              0.1,
              (value) => updateSetting('drawing.smoothing', value),
              (value) => `${Math.round(value * 100)}%`
            )}
            {renderToggleItem(
              <Download size={24} color={theme.colors.primary} />,
              'Auto-save',
              'Automatically save your artwork while drawing',
              settings.drawing.autosave,
              (value) => updateSetting('drawing.autosave', value)
            )}
            {renderToggleItem(
              <Vibrate size={24} color={theme.colors.primary} />,
              'Haptic Feedback',
              'Feel vibrations when using drawing tools',
              settings.drawing.hapticFeedback,
              (value) => updateSetting('drawing.hapticFeedback', value)
            )}
          </>
        )}

        {/* Learning Settings */}
        {renderSettingsSection(
          'Learning',
          <>
            {renderSliderItem(
              <Target size={24} color={theme.colors.primary} />,
              'Daily Goal',
              'Number of lessons to complete each day',
              settings.learning.dailyGoal,
              1,
              5,
              1,
              (value) => updateSetting('learning.dailyGoal', value),
              (value) => `${value} ${value === 1 ? 'lesson' : 'lessons'}`
            )}
            {renderPressableItem(
              <Clock size={24} color={theme.colors.primary} />,
              'Reminder Time',
              `Currently set to ${settings.learning.reminderTime}`,
              () => {
                Alert.alert('Reminder Time', 'Time picker would open here');
              }
            )}
          </>
        )}

        {/* Data Management */}
        {renderSettingsSection(
          'Data & Privacy',
          <>
            {renderPressableItem(
              <Upload size={24} color={theme.colors.primary} />,
              'Export Data',
              'Download all your artworks and progress',
              exportData
            )}
            {renderPressableItem(
              <Info size={24} color={theme.colors.primary} />,
              'Privacy Policy',
              'Learn how we protect your data',
              () => {
                Alert.alert('Privacy Policy', 'Privacy policy would open here');
              }
            )}
            {renderPressableItem(
              <Trash2 size={24} color={theme.colors.error} />,
              'Clear All Data',
              'Permanently delete all your data',
              clearAllData,
              true
            )}
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  sectionContent: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingIcon: {
    marginRight: 16,
    marginTop: 2,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  themeOptions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sliderContainer: {
    marginTop: 12,
  },
  slider: {
    height: 40,
    marginBottom: 8,
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
  },
  bottomPadding: {
    height: 40,
  },
});
