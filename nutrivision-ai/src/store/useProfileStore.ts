import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';
import type { UserProfile } from '../types';

interface ProfileState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  fetchProfile: (userId: string) => Promise<void>;
  updateProfile: (profileUpdates: Partial<UserProfile>) => Promise<void>;
  calculateTargets: (age: number, gender: string, height: number, weight: number, goal: UserProfile['goal']) => {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  loading: false,
  error: null,

  calculateTargets: (age, gender, height, weight, goal) => {
    // Mifflin-St Jeor Equation for BMR
    let bmr = 0;
    if (gender === 'Male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Assume moderate activity factor (1.55)
    let tdee = Math.round(bmr * 1.55);

    let calories = tdee;
    let protein = 0; // grams
    let fat = 0; // grams
    let carbs = 0; // grams

    switch (goal) {
      case 'Weight Loss':
        calories = Math.max(1200, tdee - 500); // safety floor of 1200 kcal
        protein = Math.round(weight * 1.8); // 1.8g per kg
        fat = Math.round((calories * 0.25) / 9); // 25% fat
        carbs = Math.round((calories - (protein * 4 + fat * 9)) / 4);
        break;
      case 'Weight Gain':
        calories = tdee + 500;
        protein = Math.round(weight * 1.8);
        fat = Math.round((calories * 0.28) / 9);
        carbs = Math.round((calories - (protein * 4 + fat * 9)) / 4);
        break;
      case 'Muscle Building':
        calories = tdee + 250;
        protein = Math.round(weight * 2.0); // High protein
        fat = Math.round((calories * 0.25) / 9);
        carbs = Math.round((calories - (protein * 4 + fat * 9)) / 4);
        break;
      case 'Diabetic':
        calories = Math.max(1400, tdee - 200);
        protein = Math.round(weight * 1.5);
        fat = Math.round((calories * 0.30) / 9); // Moderate fat
        carbs = Math.round((calories * 0.40) / 4); // Limit carbs to 40%
        // Adjust fat for balance
        fat = Math.round((calories - (protein * 4 + carbs * 4)) / 9);
        break;
      case 'Heart Health':
        calories = tdee;
        protein = Math.round(weight * 1.4);
        fat = Math.round((calories * 0.20) / 9); // Low fat (20%)
        carbs = Math.round((calories - (protein * 4 + fat * 9)) / 4);
        break;
      case 'Maintenance':
      default:
        calories = tdee;
        protein = Math.round(weight * 1.5);
        fat = Math.round((calories * 0.27) / 9);
        carbs = Math.round((calories - (protein * 4 + fat * 9)) / 4);
        break;
    }

    return { calories, protein, carbs, fat };
  },

  fetchProfile: async (userId) => {
    set({ loading: true, error: null });
    try {
      if (!isSupabaseConfigured) {
        // Load mock profile from localStorage
        const storedProfile = localStorage.getItem(`nutrivision_profile_${userId}`);
        if (storedProfile) {
          set({ profile: JSON.parse(storedProfile), loading: false });
        } else {
          // Initialize mock profile
          const defaultProfile: UserProfile = {
            id: userId,
            name: 'Alex Health',
            age: 28,
            gender: 'Male',
            height: 178,
            weight: 72,
            goal: 'Maintenance',
            target_calories: 2200,
            target_protein: 108,
            target_carbs: 278,
            target_fat: 66,
          };
          localStorage.setItem(`nutrivision_profile_${userId}`, JSON.stringify(defaultProfile));
          set({ profile: defaultProfile, loading: false });
        }
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If profile not found, it might be that the trigger hasn't run or is not fully synced
        if (error.code === 'PGRST116') {
          // Create a default one
          const defaultProfile: Partial<UserProfile> = {
            id: userId,
            name: 'User',
            age: 30,
            gender: 'Male',
            height: 175,
            weight: 70,
            goal: 'Maintenance',
            target_calories: 2000,
            target_protein: 60,
            target_carbs: 250,
            target_fat: 70,
          };
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert([defaultProfile])
            .select()
            .single();

          if (insertError) throw insertError;
          set({ profile: newProfile as UserProfile, loading: false });
        } else {
          throw error;
        }
      } else {
        set({ profile: data as UserProfile, loading: false });
      }
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  updateProfile: async (profileUpdates) => {
    const currentProfile = get().profile;
    if (!currentProfile) return;

    set({ loading: true, error: null });
    try {
      // Re-calculate targets if metabolic parameters change
      let targets = {
        calories: profileUpdates.target_calories ?? currentProfile.target_calories,
        protein: profileUpdates.target_protein ?? currentProfile.target_protein,
        carbs: profileUpdates.target_carbs ?? currentProfile.target_carbs,
        fat: profileUpdates.target_fat ?? currentProfile.target_fat,
      };

      const hasMetabolicChanges =
        profileUpdates.age !== undefined ||
        profileUpdates.gender !== undefined ||
        profileUpdates.height !== undefined ||
        profileUpdates.weight !== undefined ||
        profileUpdates.goal !== undefined;

      if (hasMetabolicChanges) {
        const age = profileUpdates.age ?? currentProfile.age;
        const gender = profileUpdates.gender ?? currentProfile.gender;
        const height = profileUpdates.height ?? currentProfile.height;
        const weight = profileUpdates.weight ?? currentProfile.weight;
        const goal = profileUpdates.goal ?? currentProfile.goal;

        const newTargets = get().calculateTargets(age, gender, height, weight, goal);
        targets = {
          calories: newTargets.calories,
          protein: newTargets.protein,
          carbs: newTargets.carbs,
          fat: newTargets.fat,
        };
      }

      const mergedProfile = {
        ...currentProfile,
        ...profileUpdates,
        target_calories: targets.calories,
        target_protein: targets.protein,
        target_carbs: targets.carbs,
        target_fat: targets.fat,
      };

      if (!isSupabaseConfigured) {
        localStorage.setItem(`nutrivision_profile_${currentProfile.id}`, JSON.stringify(mergedProfile));
        set({ profile: mergedProfile, loading: false });
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          ...profileUpdates,
          target_calories: targets.calories,
          target_protein: targets.protein,
          target_carbs: targets.carbs,
          target_fat: targets.fat,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentProfile.id);

      if (error) throw error;
      set({ profile: mergedProfile, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },
}));
