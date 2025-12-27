import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, MeasurementRecord, Achievement, WorkoutStat } from '../types/profile';

const STORAGE_KEYS = {
  USER_PROFILE: 'user_profile',
  MEASUREMENTS: 'user_measurements',
  ACHIEVEMENTS: 'user_achievements',
  WORKOUT_STATS: 'workout_stats',
  SETTINGS: 'user_settings',
};

// Default Profile
const DEFAULT_PROFILE: UserProfile = {
  id: '1',
  name: 'Fitness Enthusiast',
  email: 'user@example.com',
  age: 25,
  height: 175,
  weight: 70,
  gender: 'other',
  fitnessLevel: 'intermediate',
  goals: ['Lose 5kg', 'Run 5km', 'Complete 30 workouts'],
  notifications: true,
  darkMode: false,
  weeklyGoal: 5,
  measurementSystem: 'metric',
  measurements: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Default Achievements
const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: '1',
    title: 'First Workout',
    description: 'Complete your first workout',
    icon: 'footsteps',
    unlocked: false,
    progress: 0,
    totalRequired: 1,
    category: 'milestone',
  },
  {
    id: '2',
    title: '5 Day Streak',
    description: 'Workout for 5 consecutive days',
    icon: 'flame',
    unlocked: false,
    progress: 0,
    totalRequired: 5,
    category: 'streak',
  },
  {
    id: '3',
    title: 'Calorie Burner',
    description: 'Burn 1000 calories in a week',
    icon: 'flame',
    unlocked: false,
    progress: 0,
    totalRequired: 1000,
    category: 'workout',
  },
  {
    id: '4',
    title: 'Marathon',
    description: 'Complete 10 hours of workouts',
    icon: 'trophy',
    unlocked: false,
    progress: 0,
    totalRequired: 600,
    category: 'workout',
  },
  {
    id: '5',
    title: 'Strength Master',
    description: 'Complete 50 strength workouts',
    icon: 'barbell',
    unlocked: false,
    progress: 0,
    totalRequired: 50,
    category: 'workout',
  },
  {
    id: '6',
    title: 'Goal Crusher',
    description: 'Complete 10 fitness goals',
    icon: 'flag',
    unlocked: false,
    progress: 0,
    totalRequired: 10,
    category: 'goal',
  },
  {
    id: '7',
    title: 'Early Bird',
    description: 'Workout before 8 AM for 7 days',
    icon: 'sunny',
    unlocked: false,
    progress: 0,
    totalRequired: 7,
    category: 'workout',
  },
  {
    id: '8',
    title: 'Weekend Warrior',
    description: 'Workout both weekend days',
    icon: 'calendar',
    unlocked: false,
    progress: 0,
    totalRequired: 1,
    category: 'workout',
  },
];

class ProfileStorage {
  // User Profile Methods
  async getProfile(): Promise<UserProfile> {
    try {
      const profile = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (profile) {
        return JSON.parse(profile);
      }
      
      // Create default profile if none exists
      await this.saveProfile(DEFAULT_PROFILE);
      return DEFAULT_PROFILE;
    } catch (error) {
      console.error('Error getting profile:', error);
      return DEFAULT_PROFILE;
    }
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    try {
      const updatedProfile = {
        ...profile,
        updatedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updatedProfile));
    } catch (error) {
      console.error('Error saving profile:', error);
      throw error;
    }
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const profile = await this.getProfile();
      const updatedProfile = { ...profile, ...updates };
      await this.saveProfile(updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  // Measurements Methods
  async getMeasurements(): Promise<MeasurementRecord[]> {
    try {
      const measurements = await AsyncStorage.getItem(STORAGE_KEYS.MEASUREMENTS);
      return measurements ? JSON.parse(measurements) : [];
    } catch (error) {
      console.error('Error getting measurements:', error);
      return [];
    }
  }

  async addMeasurement(measurement: Omit<MeasurementRecord, 'id'>): Promise<void> {
    try {
      const measurements = await this.getMeasurements();
      const newMeasurement: MeasurementRecord = {
        ...measurement,
        id: Date.now().toString(),
      };
      measurements.unshift(newMeasurement);
      
      // Keep only last 30 measurements
      const trimmedMeasurements = measurements.slice(0, 30);
      await AsyncStorage.setItem(STORAGE_KEYS.MEASUREMENTS, JSON.stringify(trimmedMeasurements));
      
      // Update profile weight if provided
      if (measurement.weight) {
        await this.updateProfile({ weight: measurement.weight });
      }
    } catch (error) {
      console.error('Error adding measurement:', error);
      throw error;
    }
  }

  // Achievements Methods
  async getAchievements(): Promise<Achievement[]> {
    try {
      const achievements = await AsyncStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
      if (achievements) {
        return JSON.parse(achievements);
      }
      
      // Create default achievements
      await AsyncStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(DEFAULT_ACHIEVEMENTS));
      return DEFAULT_ACHIEVEMENTS;
    } catch (error) {
      console.error('Error getting achievements:', error);
      return DEFAULT_ACHIEVEMENTS;
    }
  }

  async updateAchievement(achievementId: string, updates: Partial<Achievement>): Promise<void> {
    try {
      const achievements = await this.getAchievements();
      const updatedAchievements = achievements.map(achievement => 
        achievement.id === achievementId 
          ? { ...achievement, ...updates }
          : achievement
      );
      await AsyncStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(updatedAchievements));
    } catch (error) {
      console.error('Error updating achievement:', error);
      throw error;
    }
  }

  async unlockAchievement(achievementId: string): Promise<void> {
    await this.updateAchievement(achievementId, {
      unlocked: true,
      unlockedAt: new Date().toISOString(),
    });
  }

  // Workout Stats Methods
  async getWorkoutStats(): Promise<WorkoutStat[]> {
    try {
      const stats = await AsyncStorage.getItem(STORAGE_KEYS.WORKOUT_STATS);
      return stats ? JSON.parse(stats) : [];
    } catch (error) {
      console.error('Error getting workout stats:', error);
      return [];
    }
  }

  async addWorkoutStat(stat: WorkoutStat): Promise<void> {
    try {
      const stats = await this.getWorkoutStats();
      stats.unshift(stat);
      
      // Keep only last 100 stats
      const trimmedStats = stats.slice(0, 100);
      await AsyncStorage.setItem(STORAGE_KEYS.WORKOUT_STATS, JSON.stringify(trimmedStats));
    } catch (error) {
      console.error('Error adding workout stat:', error);
      throw error;
    }
  }

  // Settings Methods
  async getSettings(): Promise<{ notifications: boolean; darkMode: boolean }> {
    try {
      const settings = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return settings ? JSON.parse(settings) : { notifications: true, darkMode: false };
    } catch (error) {
      console.error('Error getting settings:', error);
      return { notifications: true, darkMode: false };
    }
  }

  async saveSettings(settings: { notifications: boolean; darkMode: boolean }): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  // Clear all data (for logout)
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER_PROFILE,
        STORAGE_KEYS.MEASUREMENTS,
        STORAGE_KEYS.ACHIEVEMENTS,
        STORAGE_KEYS.WORKOUT_STATS,
        STORAGE_KEYS.SETTINGS,
      ]);
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }
}

export const profileStorage = new ProfileStorage();