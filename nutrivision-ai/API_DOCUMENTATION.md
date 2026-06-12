# NutriVision AI - API & Database Documentation

This document describes the serverless functions, database tables, and cloud storage structures used in the NutriVision AI application.

---

## 1. Serverless API Endpoint: Food Analysis

### `POST /api/analyze-food`

Analyzes food images, identifies items, calibrates portions, estimates ingredients, and calculates nutritional values.

#### Request Headers
```http
Content-Type: application/json
```

#### Request Payload
- **`image`** (string, Required): Base64 Data URL representation of the captured food image (JPEG, PNG, WEBP).
- **`referenceObject`** (string, Optional): Name of a known calibration object in the frame (`spoon`, `fork`, `hand`, `coin`) to assist size calculation.

```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZ...",
  "referenceObject": "spoon"
}
```

#### Response Payload (200 OK)
Returns a minified JSON containing food analyses and nutrition indexes.

```json
{
  "meal_name": "Chicken Biryani Meal",
  "analysis_date": "2026-06-13",
  "food_items": [
    {
      "food_name": "Chicken Biryani",
      "cuisine": "Indian",
      "cooking_method": "Dum layered steam cooking",
      "confidence": 0.95,
      "weight_grams": 350,
      "volume_ml": 400,
      "serving_count": 1.2,
      "plate_coverage_pct": 60,
      "portion_size": "1 plate (350g)",
      "ingredients": [
        { "name": "Basmati Rice", "amount": "150g", "confidence": 0.98 },
        { "name": "Chicken", "amount": "100g", "confidence": 0.95 }
      ],
      "ingredient_estimates": {
        "oil_grams": 12.0,
        "sugar_grams": 0.0,
        "salt_grams": 1.5,
        "butter_grams": 0.0,
        "sauce_grams": 0.0,
        "oil_confidence": 0.85,
        "sugar_confidence": 0.95,
        "salt_confidence": 0.80,
        "butter_confidence": 0.95,
        "sauce_confidence": 0.95
      },
      "nutrition": {
        "calories": 548,
        "protein": 28.5,
        "carbs": 62.4,
        "fat": 19.8,
        "fiber": 3.2,
        "sugar": 1.5,
        "sodium": 680,
        "calcium": 45,
        "iron": 2.8,
        "vitamin_c": 5
      }
    }
  ],
  "meal_totals": {
    "calories": 548,
    "protein": 28.5,
    "carbs": 62.4,
    "fat": 19.8,
    "fiber": 3.2,
    "sugar": 1.5,
    "sodium": 680,
    "iron": 2.8,
    "calcium": 45
  },
  "health_score": {
    "overall": 72,
    "weight_loss": 60,
    "muscle_gain": 80,
    "heart_health": 65,
    "diabetic_friendly": 55,
    "kid_friendly": 75,
    "athlete": 78
  },
  "ai_insights": {
    "nutrient_deficiencies": ["Low in Fiber", "Low in Vitamin C"],
    "excess_nutrients": ["High in Sodium"],
    "meal_recommendations": "Add raita or a fresh cucumber salad.",
    "health_recommendations": "Control sodium values.",
    "fitness_recommendations": "Excellent recovery meal post-workout."
  },
  "recommendations": [
    "Swap for brown rice option if available.",
    "Limit portion size slightly if in weight loss."
  ],
  "confidence_low_warning": false,
  "warning_message": ""
}
```

#### Error Response (400 Bad Request)
Returned when request parameters are invalid or missing.
```json
{
  "error": "Missing image payload"
}
```

---

## 2. Database Schema (Supabase)

The tables are configured in the `public` schema. Row Level Security (RLS) restricts access to owners.

### 2.1 Profiles Table (`public.profiles`)
Tracks user biometric metrics and dynamic targets.
- `id` (uuid, PRIMARY KEY): References `auth.users.id`
- `name` (text): Display name
- `age` (integer): Age in years
- `gender` (text): Biological sex
- `height` (numeric): Height in centimeters
- `weight` (numeric): Weight in kilograms
- `goal` (text): Target goal (Weight Loss, Weight Gain, Muscle Building, Maintenance, Diabetic, Heart Health)
- `target_calories` (integer): Calorie budget per day (defaults to 2000)
- `target_protein` (integer): Protein target in grams
- `target_carbs` (integer): Carbohydrates target in grams
- `target_fat` (integer): Fat target in grams

### 2.2 Meals Table (`public.meals`)
Tracks food diaries.
- `id` (uuid, PRIMARY KEY): Unique identifier
- `user_id` (uuid): References `auth.users.id`
- `meal_name` (text): Summary name of the meal
- `image_url` (text): Public Supabase Storage URL
- `recorded_at` (timestamp): Log date
- `meal_type` (text): Meal category (Breakfast, Lunch, Dinner, Snacks)
- `totals` (jsonb): Calories, macro-nutrients, and micro-nutrients
- `health_score` (jsonb): Health scores (0-100)
- `recommendations` (jsonb): Array of dietary suggestions

### 2.3 Food Items Table (`public.food_items`)
Stores individual items parsed from food scans.
- `id` (uuid, PRIMARY KEY): Unique identifier
- `meal_id` (uuid): References `meals.id`
- `food_name` (text): Name of the item
- `confidence` (numeric): Vision confidence score (0.0 to 1.0)
- `weight_grams` (numeric): Portion mass
- `portion_size` (text): Description
- `ingredients` (jsonb): Ingredients list with estimates
- `nutrition` (jsonb): Micronutrients, vitamins, water contents
- `cuisine` (text): Cuisine category
- `cooking_method` (text): Preparation method

---

## 3. Storage Bucket: Food Images

Images are stored in a Supabase Storage bucket.

- **Bucket Name**: `food-images`
- **Security Policies**:
  - `Authenticated users` can upload files to folder matching `auth.uid()`.
  - `Authenticated users` can select files matching their user folder.
  - Public read access is permitted to allow Netlify functions to retrieve file buffers.
