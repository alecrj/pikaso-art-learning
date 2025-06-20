// app/settings.tsx - ENTERPRISE GRADE SETTINGS SCREEN
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme } from '../src/contexts/ThemeContext';
import { useUserProgress } from '../src/contexts/UserProgressContext';
import { dataManager } from '../src/engines/core/DataManager';
import { errorHandler } from '../src/engines/core/ErrorHandler';
import { EventBus } from '../src/engines/core/EventBus';
import { 
  AppSettings, 
  DEFAULT_APP_SETTINGS, 
  SettingsMigrator,
  SettingsValidator,
  deepMergeSettings 
} from '../src/types/settings';

/**
 * ENTERPRISE SETTINGS SCREEN
 * 
 * ✅ FEATURES:
 * - Comprehensive app settings management
 * - Real-time preference updates
 * - Data migration and validation
 * - Professional UI/UX with accessibility
 * - Performance optimized with debouncing
 * - Error handling and recovery
 */

// Setting section configuration
interface SettingSection {
  id: string;
  title: string;
  icon: string;
  items: SettingItem[];
}

interface SettingItem {
  id: string;
  label: string;
  description?: string;
  type: 'switch' | 'slider' | 'select' | 'time' | 'action';
  value?: any;
  options?: { label: string; value: any }[];
  min?: number;
  max?: number;
  step?: number;
  onPress?: () => void;
}

export default function SettingsScreen() {
  const { theme, colors, spacing, toggleTheme, isDark } = useTheme();
  const { user, userProgress, updatePreferences } = useUserProgress();
  const router = useRouter();
  const eventBus = EventBus.getInstance();

  // State
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['appearance']));

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Save settings with debouncing
  const saveTimeoutRef = React.useRef<NodeJS.Timeout>();
  const debouncedSave = useCallback((newSettings: AppSettings) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setHasUnsavedChanges(true);
    saveTimeoutRef.current = setTimeout(() => {
      saveSettings(newSettings);
    }, 500);
  }, []);

  // Load settings from storage
  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const savedSettings = await dataManager.getAppSettings();
      
      // FIXED: Properly merge settings with defaults to ensure all properties exist
      const mergedSettings: AppSettings = deepMergeSettings(DEFAULT_APP_SETTINGS, savedSettings || {});
      
      // Validate and migrate if needed
      const migratedSettings = SettingsMigrator.migrateSettings(mergedSettings);
      const validation = SettingsValidator.validateSettings(migratedSettings);
      
      if (!validation.isValid) {
        console.warn('⚠️ Settings validation warnings:', validation.errors);
      }
      
      setSettings(migratedSettings);
      
      // Apply theme setting
      if (migratedSettings.theme === 'dark' && !isDark) {
        toggleTheme();
      } else if (migratedSettings.theme === 'light' && isDark) {
        toggleTheme();
      }
      
      console.log('✅ Settings loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load settings:', error);
      setSettings({ ...DEFAULT_APP_SETTINGS });
      
      errorHandler.handleError(
        errorHandler.createError('STORAGE_ERROR', 'Failed to load settings', 'medium')
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Save settings to storage
  const saveSettings = async (settingsToSave: AppSettings) => {
    try {
      setIsSaving(true);
      
      // FIXED: Ensure settings match the expected type
      const validatedSettings: AppSettings = {
        ...DEFAULT_APP_SETTINGS,
        ...settingsToSave,
        version: DEFAULT_APP_SETTINGS.version,
        lastUpdated: Date.now(),
      };
      
      await dataManager.saveAppSettings(validatedSettings);
      
      // Update user preferences if needed
      if (user && userProgress) {
        await updatePreferences({
          notifications: validatedSettings.notifications.enabled,
          darkMode: validatedSettings.theme === 'dark',
          autoSave: validatedSettings.drawing.autosave,
          hapticFeedback: validatedSettings.drawing.hapticFeedback,
        });
      }
      
      setHasUnsavedChanges(false);
      eventBus.emit('settings:updated', validatedSettings);
      
      console.log('✅ Settings saved successfully');
    } catch (error) {
      console.error('❌ Failed to save settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Update a specific setting
  const updateSetting = useCallback((path: string, value: any) => {
    if (!settings) return;

    // FIXED: Properly handle nested property updates
    const newSettings = { ...settings };
    const keys = path.split('.');
    let current: any = newSettings;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
    
    setSettings(newSettings);
    debouncedSave(newSettings);
    
    // Provide haptic feedback for switches
    if (Platform.OS === 'ios' && settings.drawing?.hapticFeedback) {
      Vibration.vibrate(10);
    }
  }, [settings, debouncedSave]);

  // Toggle section expansion
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  // Action handlers
  const handleClearCache = useCallback(async () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Your artwork and progress will be preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                '@pikaso_cache_drawings',
                '@pikaso_cache_lessons',
                '@pikaso_cache_thumbnails',
              ]);
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  }, []);

  const handleResetSettings = useCallback(async () => {
    Alert.alert(
      'Reset Settings',
      'This will reset all settings to their default values. Your artwork and progress will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await dataManager.saveAppSettings(DEFAULT_APP_SETTINGS);
              setSettings({ ...DEFAULT_APP_SETTINGS });
              Alert.alert('Success', 'Settings reset to defaults');
              
              // Reload app theme
              if (DEFAULT_APP_SETTINGS.theme === 'auto') {
                // Handle auto theme
              } else if (DEFAULT_APP_SETTINGS.theme === 'dark' && !isDark) {
                toggleTheme();
              } else if (DEFAULT_APP_SETTINGS.theme === 'light' && isDark) {
                toggleTheme();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to reset settings');
            }
          },
        },
      ]
    );
  }, [isDark, toggleTheme]);

  const handleExportData = useCallback(async () => {
    Alert.alert(
      'Export Data',
      'Export all your data including artwork, progress, and settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            try {
              // In production, this would generate a file or share sheet
              Alert.alert('Success', 'Data export feature coming soon!');
            } catch (error) {
              Alert.alert('Error', 'Failed to export data');
            }
          },
        },
      ]
    );
  }, []);

  const handleDeleteAccount = useCallback(async () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            Alert.alert(
              'Are you absolutely sure?',
              'Type DELETE to confirm account deletion.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Confirm',
                  style: 'destructive',
                  onPress: async () => {
                    // In production, this would show a text input for confirmation
                    Alert.alert('Account Deletion', 'This feature requires additional confirmation.');
                  },
                },
              ]
            );
          },
        },
      ]
    );
  }, []);

  // Generate setting sections
  const settingSections = useMemo((): SettingSection[] => {
    if (!settings) return [];

    return [
      {
        id: 'appearance',
        title: 'Appearance',
        icon: 'color-palette-outline',
        items: [
          {
            id: 'theme',
            label: 'Theme',
            type: 'select',
            value: settings.theme,
            options: [
              { label: 'Auto', value: 'auto' },
              { label: 'Light', value: 'light' },
              { label: 'Dark', value: 'dark' },
            ],
          },
          {
            id: 'fontSize',
            label: 'Font Size',
            type: 'select',
            value: settings.accessibility.fontSize,
            options: [
              { label: 'Small', value: 'small' },
              { label: 'Medium', value: 'medium' },
              { label: 'Large', value: 'large' },
              { label: 'Extra Large', value: 'extra-large' },
            ],
          },
        ],
      },
      {
        id: 'drawing',
        title: 'Drawing',
        icon: 'brush-outline',
        items: [
          {
            id: 'pressureSensitivity',
            label: 'Pressure Sensitivity',
            description: 'Adjust Apple Pencil pressure response',
            type: 'slider',
            value: settings.drawing.pressureSensitivity,
            min: 0,
            max: 1,
            step: 0.1,
          },
          {
            id: 'smoothing',
            label: 'Stroke Smoothing',
            description: 'Smooth out shaky lines',
            type: 'slider',
            value: settings.drawing.smoothing,
            min: 0,
            max: 1,
            step: 0.1,
          },
          {
            id: 'autosave',
            label: 'Auto-save',
            description: 'Automatically save your work',
            type: 'switch',
            value: settings.drawing.autosave,
          },
          {
            id: 'hapticFeedback',
            label: 'Haptic Feedback',
            description: 'Vibration feedback while drawing',
            type: 'switch',
            value: settings.drawing.hapticFeedback,
          },
          {
            id: 'palmRejection',
            label: 'Palm Rejection',
            description: 'Ignore palm touches while drawing',
            type: 'switch',
            value: settings.drawing.palmRejection ?? true,
          },
          {
            id: 'leftHanded',
            label: 'Left-Handed Mode',
            description: 'Optimize UI for left-handed use',
            type: 'switch',
            value: settings.drawing.leftHanded ?? false,
          },
        ],
      },
      {
        id: 'learning',
        title: 'Learning',
        icon: 'school-outline',
        items: [
          {
            id: 'dailyGoal',
            label: 'Daily Goal',
            description: 'Lessons per day',
            type: 'slider',
            value: settings.learning.dailyGoal,
            min: 1,
            max: 10,
            step: 1,
          },
          {
            id: 'difficulty',
            label: 'Difficulty',
            type: 'select',
            value: settings.learning.difficulty,
            options: [
              { label: 'Easy', value: 'easy' },
              { label: 'Adaptive', value: 'adaptive' },
              { label: 'Hard', value: 'hard' },
            ],
          },
          {
            id: 'reminderTime',
            label: 'Daily Reminder',
            type: 'time',
            value: settings.learning.reminderTime,
          },
          {
            id: 'autoAdvance',
            label: 'Auto-advance Lessons',
            description: 'Automatically move to next lesson',
            type: 'switch',
            value: settings.learning.autoAdvance ?? false,
          },
        ],
      },
      {
        id: 'notifications',
        title: 'Notifications',
        icon: 'notifications-outline',
        items: [
          {
            id: 'enabled',
            label: 'Enable Notifications',
            type: 'switch',
            value: settings.notifications.enabled,
          },
          {
            id: 'dailyReminder',
            label: 'Daily Reminders',
            type: 'switch',
            value: settings.notifications.dailyReminder,
          },
          {
            id: 'achievementAlerts',
            label: 'Achievement Alerts',
            type: 'switch',
            value: settings.notifications.achievementAlerts,
          },
          {
            id: 'challengeAlerts',
            label: 'Challenge Updates',
            type: 'switch',
            value: settings.notifications.challengeAlerts,
          },
          {
            id: 'social',
            label: 'Social Activity',
            type: 'switch',
            value: settings.notifications.social,
          },
        ],
      },
      {
        id: 'privacy',
        title: 'Privacy',
        icon: 'lock-closed-outline',
        items: [
          {
            id: 'profileVisibility',
            label: 'Profile Visibility',
            type: 'select',
            value: settings.privacy.profileVisibility,
            options: [
              { label: 'Public', value: 'public' },
              { label: 'Friends Only', value: 'friends' },
              { label: 'Private', value: 'private' },
            ],
          },
          {
            id: 'shareArtwork',
            label: 'Share Artwork by Default',
            type: 'switch',
            value: settings.privacy.shareArtwork,
          },
          {
            id: 'shareProgress',
            label: 'Share Learning Progress',
            type: 'switch',
            value: settings.privacy.shareProgress,
          },
          {
            id: 'allowComments',
            label: 'Allow Comments',
            type: 'switch',
            value: settings.privacy.allowComments,
          },
          {
            id: 'analyticsOptIn',
            label: 'Help Improve Pikaso',
            description: 'Share anonymous usage data',
            type: 'switch',
            value: settings.privacy.analyticsOptIn,
          },
        ],
      },
      {
        id: 'accessibility',
        title: 'Accessibility',
        icon: 'accessibility-outline',
        items: [
          {
            id: 'highContrast',
            label: 'High Contrast',
            type: 'switch',
            value: settings.accessibility.highContrast,
          },
          {
            id: 'reducedMotion',
            label: 'Reduce Motion',
            description: 'Minimize animations',
            type: 'switch',
            value: settings.accessibility.reducedMotion,
          },
          {
            id: 'screenReader',
            label: 'Screen Reader Support',
            type: 'switch',
            value: settings.accessibility.screenReader,
          },
          {
            id: 'colorBlindSupport',
            label: 'Color Blind Mode',
            type: 'select',
            value: settings.accessibility.colorBlindSupport,
            options: [
              { label: 'None', value: 'none' },
              { label: 'Deuteranopia', value: 'deuteranopia' },
              { label: 'Protanopia', value: 'protanopia' },
              { label: 'Tritanopia', value: 'tritanopia' },
            ],
          },
        ],
      },
      {
        id: 'advanced',
        title: 'Advanced',
        icon: 'settings-outline',
        items: [
          {
            id: 'clearCache',
            label: 'Clear Cache',
            description: 'Free up storage space',
            type: 'action',
            onPress: handleClearCache,
          },
          {
            id: 'exportData',
            label: 'Export Data',
            description: 'Download all your data',
            type: 'action',
            onPress: handleExportData,
          },
          {
            id: 'resetSettings',
            label: 'Reset Settings',
            description: 'Restore default settings',
            type: 'action',
            onPress: handleResetSettings,
          },
          {
            id: 'deleteAccount',
            label: 'Delete Account',
            description: 'Permanently delete your account',
            type: 'action',
            onPress: handleDeleteAccount,
          },
        ],
      },
    ];
  }, [settings, handleClearCache, handleExportData, handleResetSettings, handleDeleteAccount]);

  // Render setting item
  const renderSettingItem = useCallback((item: SettingItem, sectionId: string) => {
    const itemPath = `${sectionId}.${item.id}`;
    
    switch (item.type) {
      case 'switch':
        return (
          <View style={styles.settingItem} key={item.id}>
            <View style={styles.settingLabelContainer}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {item.label}
              </Text>
              {item.description && (
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  {item.description}
                </Text>
              )}
            </View>
            <Switch
              value={item.value}
              onValueChange={(value) => updateSetting(itemPath, value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={item.value ? colors.primaryDark : '#f4f3f4'}
            />
          </View>
        );

      case 'slider':
        return (
          <View style={styles.sliderItem} key={item.id}>
            <View style={styles.sliderHeader}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {item.label}
              </Text>
              <Text style={[styles.sliderValue, { color: colors.primary }]}>
                {typeof item.value === 'number' 
                  ? item.step && item.step < 1 
                    ? item.value.toFixed(1) 
                    : Math.round(item.value)
                  : item.value}
              </Text>
            </View>
            {item.description && (
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                {item.description}
              </Text>
            )}
            <Slider
              style={styles.slider}
              value={item.value}
              onValueChange={(value) => updateSetting(itemPath, value)}
              minimumValue={item.min || 0}
              maximumValue={item.max || 100}
              step={item.step || 1}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
          </View>
        );

      case 'select':
        return (
          <View style={styles.settingItem} key={item.id}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              {item.label}
            </Text>
            <View style={styles.selectContainer}>
              {item.options?.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.selectOption,
                    { borderColor: colors.border },
                    item.value === option.value && {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => updateSetting(itemPath, option.value)}
                >
                  <Text
                    style={[
                      styles.selectOptionText,
                      { color: item.value === option.value ? '#FFF' : colors.text },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'time':
        return (
          <TouchableOpacity
            style={styles.settingItem}
            key={item.id}
            onPress={() => {
              // In production, this would open a time picker
              Alert.alert('Time Picker', 'Time selection coming soon!');
            }}
          >
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              {item.label}
            </Text>
            <View style={styles.timeContainer}>
              <Text style={[styles.timeValue, { color: colors.primary }]}>
                {item.value}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        );

      case 'action':
        return (
          <TouchableOpacity
            style={[styles.actionItem, { borderColor: colors.border }]}
            key={item.id}
            onPress={item.onPress}
          >
            <View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {item.label}
              </Text>
              {item.description && (
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  {item.description}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        );

      default:
        return null;
    }
  }, [colors, updateSetting]);

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading settings...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        {hasUnsavedChanges && (
          <View style={styles.saveIndicator}>
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            )}
          </View>
        )}
      </View>

      {/* Settings List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info Section */}
        {user && (
          <View style={[styles.userSection, { backgroundColor: colors.surface }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {user.displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.text }]}>
                {user.displayName}
              </Text>
              <Text style={[styles.userStats, { color: colors.textSecondary }]}>
                {userProgress ? `Level ${userProgress.level} • ${userProgress.xp} XP` : 'Level 1 • 0 XP'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.editProfileButton, { borderColor: colors.primary }]}
              onPress={() => router.push('/profile')}
            >
              <Text style={[styles.editProfileText, { color: colors.primary }]}>
                Edit Profile
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Setting Sections */}
        {settingSections.map((section) => (
          <View key={section.id} style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection(section.id)}
              activeOpacity={0.7}
            >
              <View style={styles.sectionTitleContainer}>
                <Ionicons name={section.icon as any} size={24} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {section.title}
                </Text>
              </View>
              <Ionicons
                name={expandedSections.has(section.id) ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {expandedSections.has(section.id) && (
              <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
                {section.items.map((item) => renderSettingItem(item, section.id))}
              </View>
            )}
          </View>
        ))}

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appVersion, { color: colors.textSecondary }]}>
            Pikaso v1.0.0
          </Text>
          <Text style={[styles.appCopyright, { color: colors.textSecondary }]}>
            © 2025 Pikaso. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
  },
  saveIndicator: {
    marginLeft: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
  },
  userStats: {
    fontSize: 14,
    marginTop: 4,
  },
  editProfileButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  sectionContent: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  settingLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  sliderItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  slider: {
    marginTop: 8,
    marginBottom: 4,
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginHorizontal: -4,
  },
  selectOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    margin: 4,
  },
  selectOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 16,
  },
  appVersion: {
    fontSize: 14,
  },
  appCopyright: {
    fontSize: 12,
    marginTop: 4,
  },
});