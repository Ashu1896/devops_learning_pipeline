import { Handler } from '@netlify/functions';
import OpenAI from 'openai';

// Define expected response structure
const SYSTEM_PROMPT = `You are a Senior Nutrition Scientist, Computer Vision Expert, and AI Dietitian.
Analyze the uploaded food image and perform a detailed multi-stage food analysis.

Your tasks:
1. Identify all visible food items, including cuisine and cooking method.
2. Estimate portions: weight (grams), volume (ml), serving count, plate coverage %. Take into account any reference objects (spoon, hand, coin, fork) if visible or mentioned.
3. Perform Ingredient Analysis: detect major ingredients, hidden ingredients, and estimate grams of oil, sugar, salt, butter, and sauces with confidence scores.
4. Calculate comprehensive nutritional values based on USDA FoodData Central and Indian Food Composition Tables (IFCT) (e.g. for Indian foods like Biryani, Dosa, Paneer, Upma).
5. Generate Health Scores (0-100) for overall health, weight loss, muscle gain, heart health, diabetic-friendly, kid-friendly, and athlete profiles.
6. Provide actionable AI Insights (nutrient deficiencies, excesses, meal/health/fitness recommendations).
7. If the overall confidence in identifying the foods is below 80% (0.80), set "confidence_low_warning" to true and ask for a clearer or closer image in "warning_message".

You must respond ONLY with a valid JSON object matching this schema. Do not output markdown code blocks or any text other than the JSON:
{
  "meal_name": "Name of the overall meal",
  "analysis_date": "YYYY-MM-DD",
  "food_items": [
    {
      "food_name": "Name of specific food item",
      "cuisine": "Cuisine category",
      "cooking_method": "Cooking method",
      "confidence": 0.95,
      "weight_grams": 250,
      "volume_ml": 300,
      "serving_count": 1.0,
      "plate_coverage_pct": 45,
      "portion_size": "portion description",
      "ingredients": [
        { "name": "Ingredient name", "amount": "quantity", "confidence": 0.95 }
      ],
      "ingredient_estimates": {
        "oil_grams": 10.0,
        "sugar_grams": 2.0,
        "salt_grams": 1.2,
        "butter_grams": 5.0,
        "sauce_grams": 0.0,
        "oil_confidence": 0.90,
        "sugar_confidence": 0.95,
        "salt_confidence": 0.85,
        "butter_confidence": 0.90,
        "sauce_confidence": 0.95
      },
      "nutrition": {
        "calories": 350,
        "protein": 12.5,
        "carbs": 45.0,
        "fat": 15.0,
        "fiber": 4.5,
        "sugar": 5.0,
        "cholesterol": 15.0,
        "sodium": 480.0,
        "potassium": 350.0,
        "calcium": 60.0,
        "iron": 2.5,
        "magnesium": 40.0,
        "phosphorus": 120.0,
        "zinc": 1.5,
        "selenium": 10.0,
        "vitamin_a": 120.0,
        "vitamin_b_complex": 1.2,
        "vitamin_c": 15.0,
        "vitamin_d": 0.0,
        "vitamin_e": 2.1,
        "vitamin_k": 8.5,
        "omega_3": 0.2,
        "omega_6": 1.5,
        "water_content_grams": 160.0
      }
    }
  ],
  "meal_totals": {
    "calories": 350,
    "protein": 12.5,
    "carbs": 45.0,
    "fat": 15.0,
    "fiber": 4.5,
    "sugar": 5.0,
    "sodium": 480.0,
    "iron": 2.5,
    "calcium": 60.0
  },
  "health_score": {
    "overall": 78,
    "weight_loss": 75,
    "muscle_gain": 60,
    "heart_health": 80,
    "diabetic_friendly": 70,
    "kid_friendly": 85,
    "athlete": 68
  },
  "ai_insights": {
    "nutrient_deficiencies": ["List of potential deficiencies in this meal"],
    "excess_nutrients": ["List of excessive nutrients in this meal"],
    "meal_recommendations": "Dietary suggestion",
    "health_recommendations": "Health habit suggestion",
    "fitness_recommendations": "Activity / exercise suggestion"
  },
  "recommendations": [
    "General recommendation string 1",
    "General recommendation string 2"
  ],
  "confidence_low_warning": false,
  "warning_message": ""
}`;

export const handler: Handler = async (event) => {
  // CORS Preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({ message: 'Successful preflight' }),
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { image, referenceObject } = JSON.parse(event.body || '{}');

    if (!image) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing image payload' }),
      };
    }

    const apiKey = process.env.OPENAI_API_KEY;

    // Graceful fallback mock if OpenAI key is not provided
    if (!apiKey) {
      console.warn('OPENAI_API_KEY environment variable is missing. Returning simulated analysis.');
      
      // We will parse the image type or base64 structure to respond with a mock food item
      const isPaneer = image.includes('paneer') || Math.random() > 0.5;
      const responseMock = isPaneer ? {
        "meal_name": "Paneer Butter Masala & Garlic Naan",
        "analysis_date": new Date().toISOString().split('T')[0],
        "food_items": [
          {
            "food_name": "Paneer Butter Masala",
            "cuisine": "Indian",
            "cooking_method": "Simmered in cream & tomato gravy",
            "confidence": 0.94,
            "weight_grams": 240,
            "volume_ml": 220,
            "serving_count": 1.0,
            "plate_coverage_pct": 35,
            "portion_size": "1 plate (approx 240g)",
            "ingredients": [
              { "name": "Paneer (Cottage Cheese)", "amount": "90g", "confidence": 0.98 },
              { "name": "Tomato Gravy", "amount": "120g", "confidence": 0.95 },
              { "name": "Butter", "amount": "15g", "confidence": 0.90, "type": "butter_estimate" },
              { "name": "Heavy Cream", "amount": "15ml", "confidence": 0.85 }
            ],
            "ingredient_estimates": {
              "oil_grams": 5.0,
              "sugar_grams": 4.0,
              "salt_grams": 1.4,
              "butter_grams": 15.0,
              "sauce_grams": 0.0,
              "oil_confidence": 0.85,
              "sugar_confidence": 0.90,
              "salt_confidence": 0.80,
              "butter_confidence": 0.95,
              "sauce_confidence": 0.95
            },
            "nutrition": {
              "calories": 420,
              "protein": 14.5,
              "carbs": 12.0,
              "fat": 36.0,
              "fiber": 2.2,
              "sugar": 5.5,
              "cholesterol": 78.0,
              "sodium": 590.0,
              "potassium": 280.0,
              "calcium": 320.0,
              "iron": 0.9,
              "magnesium": 25.0,
              "phosphorus": 180.0,
              "zinc": 1.4,
              "selenium": 8.0,
              "vitamin_a": 420.0,
              "vitamin_b_complex": 1.1,
              "vitamin_c": 3.8,
              "vitamin_d": 0.4,
              "vitamin_e": 1.5,
              "vitamin_k": 3.2,
              "omega_3": 0.3,
              "omega_6": 2.1,
              "water_content_grams": 155.0
            }
          },
          {
            "food_name": "Garlic Naan",
            "cuisine": "Indian",
            "cooking_method": "Tandoor Baked",
            "confidence": 0.96,
            "weight_grams": 90,
            "portion_size": "1 piece",
            "ingredients": [
              { "name": "Maida (Refined Flour)", "amount": "75g", "confidence": 0.98 },
              { "name": "Butter", "amount": "8g", "confidence": 0.92, "type": "butter_estimate" },
              { "name": "Garlic & Cilantro", "amount": "5g", "confidence": 0.99 }
            ],
            "ingredient_estimates": {
              "oil_grams": 0.0,
              "sugar_grams": 1.0,
              "salt_grams": 0.8,
              "butter_grams": 8.0,
              "sauce_grams": 0.0,
              "oil_confidence": 0.95,
              "sugar_confidence": 0.90,
              "salt_confidence": 0.85,
              "butter_confidence": 0.95,
              "sauce_confidence": 0.95
            },
            "nutrition": {
              "calories": 285,
              "protein": 6.8,
              "carbs": 48.0,
              "fat": 7.5,
              "fiber": 2.4,
              "sugar": 1.5,
              "cholesterol": 12.0,
              "sodium": 420.0,
              "potassium": 110.0,
              "calcium": 25.0,
              "iron": 1.8,
              "magnesium": 18.0,
              "phosphorus": 85.0,
              "zinc": 0.9,
              "selenium": 12.0,
              "vitamin_a": 85.0,
              "vitamin_b_complex": 1.8,
              "vitamin_c": 0.5,
              "vitamin_d": 0.0,
              "vitamin_e": 0.4,
              "vitamin_k": 1.8,
              "omega_3": 0.05,
              "omega_6": 0.8,
              "water_content_grams": 25.0
            }
          }
        ],
        "meal_totals": {
          "calories": 705,
          "protein": 21.3,
          "carbs": 60.0,
          "fat": 43.5,
          "fiber": 4.6,
          "sugar": 7.0,
          "sodium": 1010,
          "iron": 2.7,
          "calcium": 345
        },
        "health_score": {
          "overall": 58,
          "weight_loss": 35,
          "muscle_gain": 70,
          "heart_health": 40,
          "diabetic_friendly": 35,
          "kid_friendly": 80,
          "athlete": 55
        },
        "ai_insights": {
          "nutrient_deficiencies": ["Low in Vitamin C", "Low in Dietary Fiber"],
          "excess_nutrients": ["High in Sodium", "High in Saturated Fats"],
          "meal_recommendations": "Add a fiber-rich side salad with cucumber and lemon juice, and ask for unbuttered Naan to reduce saturated fats.",
          "health_recommendations": "Substitute refined-flour Naan with Whole Wheat Tandoori Roti for a lower glycemic load.",
          "fitness_recommendations": "Good caloric load for post-heavy lifting sessions, but control fat intake for cardiovascular health."
        },
        "recommendations": [
          "Swap Garlic Naan for Tandoori Roti to double your fiber.",
          "Add a green salad to balance the heavy fats with antioxidants.",
          "Control portions if managing weight goals."
        ],
        "confidence_low_warning": false,
        "warning_message": ""
      } : {
        "meal_name": "Avocado Sourdough Toast & Egg",
        "analysis_date": new Date().toISOString().split('T')[0],
        "food_items": [
          {
            "food_name": "Avocado Toast",
            "cuisine": "Western",
            "cooking_method": "Toasted and mashed",
            "confidence": 0.97,
            "weight_grams": 160,
            "portion_size": "1 slice",
            "ingredients": [
              { "name": "Sourdough Bread", "amount": "70g", "confidence": 0.99 },
              { "name": "Avocado", "amount": "80g", "confidence": 0.98 },
              { "name": "Olive Oil", "amount": "5ml", "confidence": 0.90, "type": "oil_estimate" }
            ],
            "ingredient_estimates": {
              "oil_grams": 5.0,
              "sugar_grams": 0.5,
              "salt_grams": 0.6,
              "butter_grams": 0.0,
              "sauce_grams": 0.0,
              "oil_confidence": 0.90,
              "sugar_confidence": 0.95,
              "salt_confidence": 0.85,
              "butter_confidence": 0.95,
              "sauce_confidence": 0.95
            },
            "nutrition": {
              "calories": 310,
              "protein": 7.5,
              "carbs": 34.0,
              "fat": 16.5,
              "fiber": 7.8,
              "sugar": 1.2,
              "cholesterol": 0.0,
              "sodium": 290.0,
              "potassium": 420.0,
              "calcium": 28.0,
              "iron": 2.1,
              "magnesium": 45.0,
              "phosphorus": 110.0,
              "zinc": 1.1,
              "selenium": 8.0,
              "vitamin_a": 95.0,
              "vitamin_b_complex": 1.6,
              "vitamin_c": 12.0,
              "vitamin_d": 0.0,
              "vitamin_e": 2.8,
              "vitamin_k": 16.5,
              "omega_3": 0.15,
              "omega_6": 1.9,
              "water_content_grams": 95.0
            }
          },
          {
            "food_name": "Poached Egg",
            "cuisine": "Western",
            "cooking_method": "Poached (water boiled)",
            "confidence": 0.99,
            "weight_grams": 55,
            "portion_size": "1 large egg",
            "ingredients": [
              { "name": "Chicken Egg", "amount": "55g", "confidence": 0.99 }
            ],
            "ingredient_estimates": {
              "oil_grams": 0.0,
              "sugar_grams": 0.0,
              "salt_grams": 0.1,
              "butter_grams": 0.0,
              "sauce_grams": 0.0,
              "oil_confidence": 0.99,
              "sugar_confidence": 0.99,
              "salt_confidence": 0.95,
              "butter_confidence": 0.99,
              "sauce_confidence": 0.99
            },
            "nutrition": {
              "calories": 72,
              "protein": 6.3,
              "carbs": 0.4,
              "fat": 4.8,
              "fiber": 0.0,
              "sugar": 0.2,
              "cholesterol": 186.0,
              "sodium": 70.0,
              "potassium": 69.0,
              "calcium": 25.0,
              "iron": 0.9,
              "magnesium": 6.0,
              "phosphorus": 95.0,
              "zinc": 0.6,
              "selenium": 15.0,
              "vitamin_a": 80.0,
              "vitamin_b_complex": 0.8,
              "vitamin_c": 0.0,
              "vitamin_d": 1.1,
              "vitamin_e": 0.5,
              "vitamin_k": 0.3,
              "omega_3": 0.1,
              "omega_6": 0.6,
              "water_content_grams": 40.0
            }
          }
        ],
        "meal_totals": {
          "calories": 382,
          "protein": 13.8,
          "carbs": 34.4,
          "fat": 21.3,
          "fiber": 7.8,
          "sugar": 1.4,
          "sodium": 360,
          "iron": 3.0,
          "calcium": 53
        },
        "health_score": {
          "overall": 88,
          "weight_loss": 85,
          "muscle_gain": 75,
          "heart_health": 85,
          "diabetic_friendly": 82,
          "kid_friendly": 78,
          "athlete": 84
        },
        "ai_insights": {
          "nutrient_deficiencies": ["Low in Calcium", "Low in Vitamin C"],
          "excess_nutrients": ["None - Balanced macros"],
          "meal_recommendations": "Add a few cherry tomatoes and baby spinach on the side to boost Vitamin C and iron absorption.",
          "health_recommendations": "Excellent source of healthy monounsaturated fats and dietary fiber, keeping insulin levels stable.",
          "fitness_recommendations": "Ideal breakfast for moderate energy release and protein to support lean muscle maintenance."
        },
        "recommendations": [
          "Perfect nutrient density and profile.",
          "Add fresh spinach leaves for folate and iron.",
          "Optionally squeeze a lemon to aid iron absorption."
        ],
        "confidence_low_warning": false,
        "warning_message": ""
      };

      // Add a tiny delay to simulate network latency
      await new Promise(resolve => setTimeout(resolve, 1500));

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(responseMock),
      };
    }

    const openai = new OpenAI({ apiKey });

    // Clean base64 image prefix if exists
    let formattedImage = image;
    if (image.startsWith('data:')) {
      // It's a data URL, we send it directly to OpenAI Vision API
      formattedImage = image;
    } else {
      // It's a normal URL
      formattedImage = image;
    }

    // Call OpenAI Chat API with Vision model
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Please analyze this food image. ${
                referenceObject ? `Note that a ${referenceObject} is present in the image as a reference object for portion size.` : ''
              }`,
            },
            {
              type: 'image_url',
              image_url: {
                url: formattedImage,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: 2000,
    });

    const parsedResponse = JSON.parse(response.choices[0].message.content || '{}');

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(parsedResponse),
    };
  } catch (err: any) {
    console.error('Error in analyze-food function:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message || 'Internal Server Error' }),
    };
  }
};
