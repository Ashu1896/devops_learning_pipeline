import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';
import type { Meal, FoodItem } from '../types';

interface MealState {
  meals: Meal[];
  loading: boolean;
  error: string | null;
  fetchMeals: (userId: string) => Promise<void>;
  logMeal: (userId: string, meal: Omit<Meal, 'user_id' | 'created_at'>) => Promise<Meal>;
  deleteMeal: (mealId: string) => Promise<void>;
  syncOfflineQueue: (userId: string) => Promise<void>;
}

// Generate high-quality mock history for charts (last 7 days of logs)
const generateMockMeals = (userId: string): Meal[] => {
  const meals: Meal[] = [];
  const foodTemplates = [
    {
      name: "Masala Dosa with Sambar",
      type: "Breakfast",
      items: [
        {
          food_name: "Masala Dosa",
          confidence: 0.95,
          weight_grams: 180,
          portion_size: "1 dosa",
          cuisine: "South Indian",
          cooking_method: "Griddle Fried",
          ingredients: [
            { name: "Rice Batter", amount: "120g", confidence: 0.98 },
            { name: "Potato Masala Filling", amount: "50g", confidence: 0.95 },
            { name: "Coconut Oil", amount: "10g", confidence: 0.88, type: "oil_estimate" }
          ],
          nutrition: { calories: 387, protein: 7.2, carbs: 59.4, fat: 12.8, fiber: 3.8, sugar: 2.1, sodium: 580, calcium: 32, iron: 1.8, vitamin_c: 2.5 }
        },
        {
          food_name: "Sambar",
          confidence: 0.90,
          weight_grams: 150,
          portion_size: "1 bowl",
          cuisine: "South Indian",
          cooking_method: "Boiled stew",
          ingredients: [
            { name: "Toor Dal", amount: "30g", confidence: 0.95 },
            { name: "Mixed Vegetables", amount: "80g", confidence: 0.90 },
            { name: "Spices & Tamarind", amount: "40g", confidence: 0.95 }
          ],
          nutrition: { calories: 120, protein: 4.8, carbs: 18.2, fat: 2.8, fiber: 4.2, sugar: 3.5, sodium: 450, calcium: 24, iron: 1.2, vitamin_c: 8.2 }
        }
      ]
    },
    {
      name: "Grilled Chicken Salad",
      type: "Lunch",
      items: [
        {
          food_name: "Grilled Chicken Breast",
          confidence: 0.98,
          weight_grams: 150,
          portion_size: "1 piece",
          cuisine: "Continental",
          cooking_method: "Grilled",
          ingredients: [
            { name: "Chicken Breast", amount: "150g", confidence: 0.99 },
            { name: "Olive Oil", amount: "5g", confidence: 0.92, type: "oil_estimate" }
          ],
          nutrition: { calories: 248, protein: 38.5, carbs: 0, fat: 9.8, fiber: 0, sugar: 0, sodium: 380, calcium: 15, iron: 1.4, vitamin_c: 0 }
        },
        {
          food_name: "Mixed Garden Salad",
          confidence: 0.96,
          weight_grams: 200,
          portion_size: "1 large bowl",
          cuisine: "Western",
          cooking_method: "Raw cut",
          ingredients: [
            { name: "Lettuce & Spinach", amount: "100g", confidence: 0.98 },
            { name: "Cucumber & Tomato", amount: "80g", confidence: 0.98 },
            { name: "Olive Oil Dressing", amount: "20g", confidence: 0.85, type: "oil_estimate" }
          ],
          nutrition: { calories: 140, protein: 2.2, carbs: 8.5, fat: 11.2, fiber: 3.5, sugar: 4.2, sodium: 120, calcium: 48, iron: 1.6, vitamin_c: 14.5 }
        }
      ]
    },
    {
      name: "Paneer Tikka Masala & Roti",
      type: "Dinner",
      items: [
        {
          food_name: "Paneer Tikka Masala",
          confidence: 0.94,
          weight_grams: 250,
          portion_size: "1 serving",
          cuisine: "North Indian",
          cooking_method: "Roasted and simmered in gravy",
          ingredients: [
            { name: "Paneer (Cottage Cheese)", amount: "100g", confidence: 0.98 },
            { name: "Tomato Cream Gravy", amount: "130g", confidence: 0.90 },
            { name: "Butter & Butter Oil", amount: "20g", confidence: 0.85, type: "butter_estimate" }
          ],
          nutrition: { calories: 435, protein: 16.5, carbs: 12.8, fat: 35.6, fiber: 2.4, sugar: 6.8, sodium: 720, calcium: 380, iron: 0.8, vitamin_c: 4.8 }
        },
        {
          food_name: "Tandoori Roti",
          confidence: 0.97,
          weight_grams: 80,
          portion_size: "2 pieces",
          cuisine: "North Indian",
          cooking_method: "Baked in Tandoor clay oven",
          ingredients: [
            { name: "Whole Wheat Flour", amount: "75g", confidence: 0.99 },
            { name: "Water & Salt", amount: "25g", confidence: 0.95 }
          ],
          nutrition: { calories: 210, protein: 6.8, carbs: 44.2, fat: 1.2, fiber: 4.5, sugar: 0.8, sodium: 280, calcium: 18, iron: 2.4, vitamin_c: 0 }
        }
      ]
    },
    {
      name: "Mixed Fruit Bowl & Almonds",
      type: "Snacks",
      items: [
        {
          food_name: "Fruit Salad",
          confidence: 0.96,
          weight_grams: 180,
          portion_size: "1 bowl",
          cuisine: "Universal",
          cooking_method: "Fresh sliced",
          ingredients: [
            { name: "Apple & Banana", amount: "100g", confidence: 0.99 },
            { name: "Papaya & Pomegranate", amount: "80g", confidence: 0.98 }
          ],
          nutrition: { calories: 125, protein: 1.5, carbs: 31.2, fat: 0.4, fiber: 4.8, sugar: 22.4, sodium: 10, calcium: 22, iron: 0.6, vitamin_c: 32.0 }
        },
        {
          food_name: "Raw Almonds",
          confidence: 0.99,
          weight_grams: 30,
          portion_size: "15-20 kernels",
          cuisine: "Universal",
          cooking_method: "Raw",
          ingredients: [
            { name: "Almonds", amount: "30g", confidence: 0.99 }
          ],
          nutrition: { calories: 174, protein: 6.2, carbs: 6.1, fat: 14.8, fiber: 3.6, sugar: 1.4, sodium: 2, calcium: 76, iron: 1.1, vitamin_c: 0 }
        }
      ]
    }
  ];


  // Generate for the past 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // Pick 3 random meals for each day to make it look full
    const mealCount = i === 0 ? 2 : 3; // today has 2, others have 3
    const activeTemplates = [...foodTemplates].sort(() => 0.5 - Math.random()).slice(0, mealCount);

    activeTemplates.forEach((template) => {
      // Offset timestamps slightly for breakfast/lunch/dinner
      const mealDate = new Date(date);
      if (template.type === 'Breakfast') mealDate.setHours(8, 30, 0);
      else if (template.type === 'Lunch') mealDate.setHours(13, 15, 0);
      else if (template.type === 'Dinner') mealDate.setHours(20, 0, 0);
      else mealDate.setHours(16, 45, 0);

      // Calculate totals
      let calories = 0, protein = 0, carbs = 0, fat = 0, fiber = 0, sugar = 0, sodium = 0, iron = 0, calcium = 0;
      template.items.forEach(it => {
        calories += it.nutrition.calories;
        protein += it.nutrition.protein;
        carbs += it.nutrition.carbs;
        fat += it.nutrition.fat;
        fiber += it.nutrition.fiber;
        sugar += it.nutrition.sugar;
        sodium += it.nutrition.sodium;
        iron += it.nutrition.iron;
        calcium += it.nutrition.calcium;
      });

      // Health Score configuration
      const scores = {
        Breakfast: { overall: 85, weight_loss: 80, muscle_gain: 70, heart_health: 90, diabetic_friendly: 80, kid_friendly: 90, athlete: 75 },
        Lunch: { overall: 92, weight_loss: 95, muscle_gain: 88, heart_health: 90, diabetic_friendly: 85, kid_friendly: 80, athlete: 92 },
        Dinner: { overall: 70, weight_loss: 60, muscle_gain: 75, heart_health: 65, diabetic_friendly: 50, kid_friendly: 75, athlete: 72 },
        Snacks: { overall: 88, weight_loss: 82, muscle_gain: 80, heart_health: 85, diabetic_friendly: 75, kid_friendly: 95, athlete: 80 }
      };

      const mealObj: Meal = {
        id: `mock-meal-${dateStr}-${template.type}`,
        user_id: userId,
        meal_name: template.name,
        meal_type: template.type as Meal['meal_type'],
        recorded_at: mealDate.toISOString(),
        totals: {
          calories: Math.round(calories),
          protein: Number(protein.toFixed(1)),
          carbs: Number(carbs.toFixed(1)),
          fat: Number(fat.toFixed(1)),
          fiber: Number(fiber.toFixed(1)),
          sugar: Number(sugar.toFixed(1)),
          sodium: Math.round(sodium),
          iron: Number(iron.toFixed(1)),
          calcium: Math.round(calcium)
        },
        health_score: scores[template.type as keyof typeof scores],
        recommendations: [
          template.type === 'Breakfast' ? "Excellent start with complex carbs and fiber." : "",
          template.type === 'Lunch' ? "High protein, great for metabolic rate and satiety." : "",
          template.type === 'Dinner' ? "A bit heavy on fat; consider grilled option next time." : "",
          "Keep drinking water throughout the day."
        ].filter(Boolean),
        food_items: template.items.map((it, itemIdx) => ({
          ...it,
          id: `mock-food-item-${dateStr}-${template.type}-${itemIdx}`,
          meal_id: `mock-meal-${dateStr}-${template.type}`
        }))
      };

      meals.push(mealObj);
    });
  }
  return meals;
};

export const useMealStore = create<MealState>((set, get) => ({
  meals: [],
  loading: false,
  error: null,

  fetchMeals: async (userId) => {
    set({ loading: true, error: null });
    try {
      if (!isSupabaseConfigured) {
        // Load from localStorage or seed mock meals
        const storedMeals = localStorage.getItem(`nutrivision_meals_${userId}`);
        if (storedMeals) {
          set({ meals: JSON.parse(storedMeals), loading: false });
        } else {
          const mockHistory = generateMockMeals(userId);
          localStorage.setItem(`nutrivision_meals_${userId}`, JSON.stringify(mockHistory));
          set({ meals: mockHistory, loading: false });
        }
        return;
      }

      // Fetch from Supabase
      const { data: mealsData, error: mealsError } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: false });

      if (mealsError) throw mealsError;

      const mealsWithItems: Meal[] = [];

      for (const meal of (mealsData || [])) {
        const { data: itemsData, error: itemsError } = await supabase
          .from('food_items')
          .select('*')
          .eq('meal_id', meal.id);

        if (itemsError) throw itemsError;

        mealsWithItems.push({
          ...meal,
          food_items: itemsData as FoodItem[]
        });
      }

      // Merge with any local pending offline meals
      const offlineQueue = localStorage.getItem(`nutrivision_offline_queue_${userId}`);
      let allMeals = mealsWithItems;
      if (offlineQueue) {
        const queuedMeals: Meal[] = JSON.parse(offlineQueue);
        allMeals = [...queuedMeals, ...allMeals];
      }

      set({ meals: allMeals, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  logMeal: async (userId, mealData) => {
    set({ loading: true, error: null });
    try {
      const newMealId = Math.random().toString(36).substr(2, 9);
      const isOnline = navigator.onLine;

      const newMeal: Meal = {
        ...mealData,
        id: isSupabaseConfigured && isOnline ? undefined : `local-${newMealId}`,
        user_id: userId,
        recorded_at: mealData.recorded_at || new Date().toISOString()
      };

      if (!isSupabaseConfigured || !isOnline) {
        // Store locally
        if (!isOnline) {
          newMeal.isOfflinePending = true;
          // Add to offline queue
          const queueKey = `nutrivision_offline_queue_${userId}`;
          const currentQueue = JSON.parse(localStorage.getItem(queueKey) || '[]');
          localStorage.setItem(queueKey, JSON.stringify([newMeal, ...currentQueue]));
        }

        // Add to regular list
        const updatedMeals = [newMeal, ...get().meals];
        localStorage.setItem(`nutrivision_meals_${userId}`, JSON.stringify(updatedMeals));
        set({ meals: updatedMeals, loading: false });
        return newMeal;
      }

      // Log in Supabase
      const { data: dbMeal, error: mealError } = await supabase
        .from('meals')
        .insert([{
          user_id: userId,
          meal_name: newMeal.meal_name,
          image_url: newMeal.image_url,
          recorded_at: newMeal.recorded_at,
          meal_type: newMeal.meal_type,
          totals: newMeal.totals,
          health_score: newMeal.health_score,
          recommendations: newMeal.recommendations
        }])
        .select()
        .single();

      if (mealError) throw mealError;

      const dbFoodItems: FoodItem[] = [];

      if (mealData.food_items && mealData.food_items.length > 0) {
        for (const item of mealData.food_items) {
          const { data: dbItem, error: itemError } = await supabase
            .from('food_items')
            .insert([{
              meal_id: dbMeal.id,
              food_name: item.food_name,
              confidence: item.confidence,
              weight_grams: item.weight_grams,
              portion_size: item.portion_size,
              ingredients: item.ingredients,
              nutrition: item.nutrition,
              cuisine: item.cuisine,
              cooking_method: item.cooking_method
            }])
            .select()
            .single();

          if (itemError) throw itemError;
          dbFoodItems.push(dbItem as FoodItem);
        }
      }

      const completedMeal: Meal = {
        ...dbMeal,
        food_items: dbFoodItems
      };

      set({
        meals: [completedMeal, ...get().meals.filter(m => !m.id?.startsWith('local-'))],
        loading: false
      });

      return completedMeal;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  deleteMeal: async (mealId) => {
    set({ loading: true, error: null });
    try {
      if (mealId.startsWith('local-') || !isSupabaseConfigured) {
        const userId = get().meals[0]?.user_id || 'mock-user-123';
        const updatedMeals = get().meals.filter(m => m.id !== mealId);
        localStorage.setItem(`nutrivision_meals_${userId}`, JSON.stringify(updatedMeals));
        // Also remove from offline queue if present
        const queueKey = `nutrivision_offline_queue_${userId}`;
        const currentQueue = JSON.parse(localStorage.getItem(queueKey) || '[]');
        localStorage.setItem(queueKey, JSON.stringify(currentQueue.filter((m: Meal) => m.id !== mealId)));

        set({ meals: updatedMeals, loading: false });
        return;
      }

      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', mealId);

      if (error) throw error;

      set({
        meals: get().meals.filter(m => m.id !== mealId),
        loading: false
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  syncOfflineQueue: async (userId) => {
    const queueKey = `nutrivision_offline_queue_${userId}`;
    const queueData = localStorage.getItem(queueKey);
    if (!queueData || !isSupabaseConfigured || !navigator.onLine) return;

    const queuedMeals: Meal[] = JSON.parse(queueData);
    if (queuedMeals.length === 0) return;

    set({ loading: true });

    try {
      for (const meal of queuedMeals) {
        // Upload to database
        const { data: dbMeal, error: mealError } = await supabase
          .from('meals')
          .insert([{
            user_id: userId,
            meal_name: meal.meal_name,
            image_url: meal.image_url,
            recorded_at: meal.recorded_at,
            meal_type: meal.meal_type,
            totals: meal.totals,
            health_score: meal.health_score,
            recommendations: meal.recommendations
          }])
          .select()
          .single();

        if (mealError) throw mealError;

        if (meal.food_items && meal.food_items.length > 0) {
          for (const item of meal.food_items) {
            await supabase.from('food_items').insert([{
              meal_id: dbMeal.id,
              food_name: item.food_name,
              confidence: item.confidence,
              weight_grams: item.weight_grams,
              portion_size: item.portion_size,
              ingredients: item.ingredients,
              nutrition: item.nutrition,
              cuisine: item.cuisine,
              cooking_method: item.cooking_method
            }]);
          }
        }
      }

      // Clear the queue
      localStorage.removeItem(queueKey);

      // Re-fetch everything to get server IDs and correct items
      set({ loading: false });
      await get().fetchMeals(userId);
    } catch (err) {
      console.error('Failed to sync offline meals:', err);
      set({ loading: false });
    }
  }
}));
