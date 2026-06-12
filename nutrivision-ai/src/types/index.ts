export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  height: number; // in cm
  weight: number; // in kg
  goal: 'Weight Loss' | 'Weight Gain' | 'Muscle Building' | 'Maintenance' | 'Diabetic' | 'Heart Health';
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  updated_at?: string;
}

export interface NutritionValues {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  cholesterol?: number;
  sodium: number;
  potassium?: number;
  calcium: number;
  iron: number;
  magnesium?: number;
  phosphorus?: number;
  zinc?: number;
  selenium?: number;
  vitamin_a?: number;
  vitamin_b_complex?: number;
  vitamin_c: number;
  vitamin_d?: number;
  vitamin_e?: number;
  vitamin_k?: number;
  omega_3?: number;
  omega_6?: number;
  water_content_grams?: number;
}

export interface IngredientEstimate {
  name: string;
  amount: string;
  confidence: number;
  type?: string;
}

export interface HiddenIngredientsEstimate {
  oil_grams: number;
  sugar_grams: number;
  salt_grams: number;
  butter_grams: number;
  sauce_grams: number;
  oil_confidence: number;
  sugar_confidence: number;
  salt_confidence: number;
  butter_confidence: number;
  sauce_confidence: number;
}

export interface FoodItem {
  id?: string;
  meal_id?: string;
  food_name: string;
  confidence: number;
  weight_grams: number;
  volume_ml?: number;
  serving_count?: number;
  plate_coverage_pct?: number;
  portion_size: string;
  ingredients: IngredientEstimate[];
  ingredient_estimates?: HiddenIngredientsEstimate;
  nutrition: NutritionValues;
  cuisine?: string;
  cooking_method?: string;
}

export interface HealthScore {
  overall: number;
  weight_loss: number;
  muscle_gain: number;
  heart_health: number;
  diabetic_friendly: number;
  kid_friendly: number;
  athlete: number;
}

export interface AIInsights {
  nutrient_deficiencies: string[];
  excess_nutrients: string[];
  meal_recommendations: string;
  health_recommendations: string;
  fitness_recommendations: string;
}

export interface MealTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  iron: number;
  calcium: number;
}

export interface Meal {
  id?: string;
  user_id?: string;
  meal_name: string;
  image_url?: string;
  recorded_at: string; // ISO string
  meal_type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
  totals: MealTotals;
  health_score: HealthScore;
  ai_insights?: AIInsights;
  recommendations: string[];
  food_items?: FoodItem[];
  created_at?: string;
  // Offline sync helper
  isOfflinePending?: boolean;
  confidence_low_warning?: boolean;
  warning_message?: string;
}
