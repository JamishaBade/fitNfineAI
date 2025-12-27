import { useState, useEffect, useCallback } from 'react';
import { profileStorage } from '../lib/profileStorage';
import { UserProfile, MeasurementRecord, Achievement, WorkoutStat } from '../types/profile';
import { Alert } from 'react-native';

export const useProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [measurements, setMeasurements] = useState<MeasurementRecord[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [workoutStats, setWorkoutStats] = useState<WorkoutStat[]>([]);
  const [settings, setSettings] = useState({ notifications: true, darkMode: false });
  const [loading, setLoading] = useState(true);

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        profileData,
        measurementsData,
        achievementsData,
        workoutStatsData,
        settingsData,
      ] = await Promise.all([
        profileStorage.getProfile(),
        profileStorage.getMeasurements(),
        profileStorage.getAchievements(),
        profileStorage.getWorkoutStats(),
        profileStorage.getSettings(),
      ]);

      setProfile(profileData);
      setMeasurements(measurementsData);
      setAchievements(achievementsData);
      setWorkoutStats(workoutStatsData);
      setSettings(settingsData);
    } catch (error) {
      console.error('Error loading profile data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate stats from workout data
  const calculateStats = useCallback(() => {
    if (!profile) return null;

    const totalWorkouts = workoutStats.length;
    const totalMinutes = workoutStats.reduce((sum, stat) => sum + stat.duration, 0);
    const totalCalories = workoutStats.reduce((sum, stat) => sum + stat.calories, 0);
    
    // This week's workouts
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeekWorkouts = workoutStats.filter(stat => 
      new Date(stat.date) >= oneWeekAgo
    );

    // Calculate streak
    const workoutDates = workoutStats.map(stat => new Date(stat.date).toDateString());
    const uniqueDates = [...new Set(workoutDates)].sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );

    let streak = 0;
    if (uniqueDates.length > 0) {
      const today = new Date().toDateString();
      let currentStreak = uniqueDates[0] === today ? 1 : 0;
      
      for (let i = 1; i < uniqueDates.length; i++) {
        const currentDate = new Date(uniqueDates[i - 1]);
        const previousDate = new Date(uniqueDates[i]);
        const diffDays = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
      
      streak = currentStreak;
    }

    // Calculate BMI
    const heightInMeters = profile.height / 100;
    const bmi = profile.weight / (heightInMeters * heightInMeters);
    
    let bmiCategory = '';
    if (bmi < 18.5) bmiCategory = 'Underweight';
    else if (bmi < 25) bmiCategory = 'Normal';
    else if (bmi < 30) bmiCategory = 'Overweight';
    else bmiCategory = 'Obese';

    return {
      totalWorkouts,
      totalHours: Math.round(totalMinutes / 60),
      totalCalories,
      thisWeekWorkouts: thisWeekWorkouts.length,
      weeklyGoalProgress: Math.min(Math.round((thisWeekWorkouts.length / profile.weeklyGoal) * 100), 100),
      streak,
      bmi: bmi.toFixed(1),
      bmiCategory,
      unlockedAchievements: achievements.filter(a => a.unlocked).length,
      totalAchievements: achievements.length,
    };
  }, [profile, workoutStats, achievements]);

  // Profile actions
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!profile) return;
    
    try {
      const updatedProfile = await profileStorage.updateProfile(updates);
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
      throw error;
    }
  }, [profile]);

  const addGoal = useCallback(async (goal: string) => {
    if (!profile || !goal.trim()) return;
    
    try {
      const updatedGoals = [...profile.goals, goal.trim()];
      await updateProfile({ goals: updatedGoals });
      Alert.alert('Success', 'Goal added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add goal');
    }
  }, [profile, updateProfile]);

  const removeGoal = useCallback(async (goalIndex: number) => {
    if (!profile) return;
    
    try {
      const updatedGoals = profile.goals.filter((_, index) => index !== goalIndex);
      await updateProfile({ goals: updatedGoals });
    } catch (error) {
      Alert.alert('Error', 'Failed to remove goal');
    }
  }, [profile, updateProfile]);

  const completeGoal = useCallback(async (goalIndex: number) => {
    if (!profile) return;
    
    try {
      const completedGoal = profile.goals[goalIndex];
      await removeGoal(goalIndex);
      
      // Update achievement progress
      const goalAchievement = achievements.find(a => a.id === '6'); // Goal Crusher
      if (goalAchievement && !goalAchievement.unlocked) {
        const newProgress = goalAchievement.progress + 1;
        await profileStorage.updateAchievement('6', { progress: newProgress });
        
        if (newProgress >= goalAchievement.totalRequired) {
          await profileStorage.unlockAchievement('6');
        }
        
        // Refresh achievements
        const updatedAchievements = await profileStorage.getAchievements();
        setAchievements(updatedAchievements);
      }
      
      Alert.alert('Goal Completed!', `Congratulations on completing: ${completedGoal}`);
      return completedGoal;
    } catch (error) {
      console.error('Error completing goal:', error);
      Alert.alert('Error', 'Failed to complete goal');
    }
  }, [profile, achievements, removeGoal]);

  const addMeasurement = useCallback(async (measurement: Omit<MeasurementRecord, 'id' | 'date'>) => {
    try {
      const newMeasurement: Omit<MeasurementRecord, 'id'> = {
        ...measurement,
        date: new Date().toISOString(),
      };
      
      await profileStorage.addMeasurement(newMeasurement);
      
      // Refresh measurements
      const updatedMeasurements = await profileStorage.getMeasurements();
      setMeasurements(updatedMeasurements);
      
      Alert.alert('Success', 'Measurement recorded successfully!');
    } catch (error) {
      console.error('Error adding measurement:', error);
      Alert.alert('Error', 'Failed to record measurement');
    }
  }, []);

  const updateSettings = useCallback(async (newSettings: { notifications: boolean; darkMode: boolean }) => {
    try {
      await profileStorage.saveSettings(newSettings);
      setSettings(newSettings);
      
      // Update profile if needed
      if (profile) {
        await updateProfile({
          notifications: newSettings.notifications,
          darkMode: newSettings.darkMode,
        });
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      Alert.alert('Error', 'Failed to update settings');
    }
  }, [profile, updateProfile]);

  const logout = useCallback(async () => {
    try {
      await profileStorage.clearAllData();
      setProfile(null);
      setMeasurements([]);
      setAchievements([]);
      setWorkoutStats([]);
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to logout');
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return {
    profile,
    measurements,
    achievements,
    stats: calculateStats(),
    settings,
    loading,
    updateProfile,
    addGoal,
    removeGoal,
    completeGoal,
    addMeasurement,
    updateSettings,
    logout,
    refreshData: loadAllData,
  };
};