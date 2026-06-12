import React, { useState } from 'react';
import { useMealStore } from '../store/useMealStore';
import { useAuthStore } from '../store/useAuthStore';
import type { Meal } from '../types';
import { Heart, Activity, User, Check, ShieldAlert, Sparkles } from 'lucide-react';

interface MealAnalysisProps {
  mealData: Meal;
  images: string[];
  onSaveComplete: () => void;
  onCancel: () => void;
}

export const MealAnalysis: React.FC<MealAnalysisProps> = ({ mealData, images, onSaveComplete, onCancel }) => {
  const { user } = useAuthStore();
  const { logMeal, loading } = useMealStore();
  const [mealType, setMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks'>('Breakfast');
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!user) return;
    setSaveError(null);
    try {
      // Log the meal
      await logMeal(user.id, {
        meal_name: mealData.meal_name,
        image_url: images[0], // Store primary image
        recorded_at: new Date().toISOString(),
        meal_type: mealType,
        totals: mealData.totals,
        health_score: mealData.health_score,
        ai_insights: mealData.ai_insights,
        recommendations: mealData.recommendations,
        food_items: mealData.food_items
      });
      onSaveComplete();
    } catch (err: any) {
      console.error(err);
      setSaveError("Failed to log this meal in your diary. Please try again.");
    }
  };


  const scoreMap = [
    { label: 'Weight Loss', value: mealData.health_score.weight_loss, icon: Activity },
    { label: 'Muscle Gain', value: mealData.health_score.muscle_gain, icon: User },
    { label: 'Heart Health', value: mealData.health_score.heart_health, icon: Heart },
    { label: 'Diabetic Friendly', value: mealData.health_score.diabetic_friendly, icon: Activity },
    { label: 'Kid Friendly', value: mealData.health_score.kid_friendly, icon: User },
    { label: 'Athlete Profile', value: mealData.health_score.athlete, icon: Sparkles }
  ];

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 animate-slide-up pb-10">
      {/* Header Controls */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Scan Complete</span>
          <h2 className="text-2xl font-black tracking-tight">{mealData.meal_name}</h2>
        </div>
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* Low Confidence warning */}
      {mealData.confidence_low_warning && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 p-4 rounded-3xl flex gap-3 items-start animate-scale-in">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold">Low Confidence Food Recognition</h4>
            <p className="text-xs mt-0.5 leading-relaxed">
              {mealData.warning_message || "The scanning confidence is below 80%. Results are estimates. For higher accuracy, please upload a clearer or closer shot."}
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Visuals, Scores, Macros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Visual Preview & Log Card */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-850 p-5 rounded-3xl shadow-sm flex flex-col gap-4">
          <div className="aspect-video sm:aspect-square rounded-2xl overflow-hidden border border-slate-100 dark:border-zinc-800 shadow-sm relative">
            <img src={images[0]} alt="food scan" className="w-full h-full object-cover" />
            <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-bold text-white uppercase tracking-wider">
              Scan Source
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-500 pl-1">Assign Meal Type</label>
            <div className="grid grid-cols-2 gap-2">
              {['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map(type => (
                <button
                  key={type}
                  onClick={() => setMealType(type as any)}
                  className={`py-2.5 rounded-xl border text-xs font-bold transition-all duration-200 ${
                    mealType === type
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500'
                      : 'bg-slate-50 dark:bg-zinc-950/60 border-slate-200 dark:border-zinc-850 hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {saveError && (
            <span className="text-[11px] font-bold text-rose-500 text-center">{saveError}</span>
          )}

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-2xl py-3.5 text-sm font-bold shadow-md shadow-emerald-500/10 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-75 disabled:pointer-events-none"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                Log to Food Diary
                <Check className="w-4.5 h-4.5" />
              </>
            )}
          </button>
        </div>

        {/* Overall Health Score Circular Gauge & Breakdown */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-850 p-6 rounded-3xl shadow-sm flex flex-col items-center justify-center gap-6">
          <div className="flex flex-col items-center text-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-500 mb-1">Health Score</span>
            <div className="relative w-36 h-36 flex items-center justify-center">
              {/* Ring Background */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  strokeWidth="8"
                  className="stroke-slate-100 dark:stroke-zinc-800"
                  fill="transparent"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="60"
                  strokeWidth="8"
                  className="stroke-emerald-500"
                  strokeDasharray={2 * Math.PI * 60}
                  strokeDashoffset={2 * Math.PI * 60 * (1 - mealData.health_score.overall / 100)}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-black tracking-tight">{mealData.health_score.overall}</span>
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">Optimum</span>
              </div>
            </div>
          </div>

          <div className="w-full grid grid-cols-2 gap-2 border-t border-slate-100 dark:border-zinc-800/80 pt-4">
            {scoreMap.map(scoreItem => {
              const Icon = scoreItem.icon;
              return (
                <div key={scoreItem.label} className="flex flex-col p-2 bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/40 dark:border-zinc-850 rounded-xl gap-0.5">
                  <div className="flex items-center gap-1">
                    <Icon className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wide">{scoreItem.label}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-slate-800 dark:text-zinc-200">{scoreItem.value}</span>
                    <div className={`w-1.5 h-1.5 rounded-full ${scoreItem.value >= 75 ? 'bg-emerald-500' : scoreItem.value >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Nutritional totals column */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-850 p-6 rounded-3xl shadow-sm flex flex-col gap-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-500">Nutrition Summary</span>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Calories */}
            <div className="col-span-2 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-4 flex justify-between items-center shadow-inner">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Calories</span>
              <div className="flex items-baseline gap-0.5">
                <span className="text-2xl font-black text-slate-900 dark:text-white">{mealData.totals.calories}</span>
                <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-500">kcal</span>
              </div>
            </div>

            {/* Protein */}
            <div className="border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-3 bg-slate-50/50 dark:bg-zinc-950/40 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase">Protein</span>
                <span className="text-lg font-black text-slate-800 dark:text-zinc-200">{mealData.totals.protein}g</span>
              </div>
              <div className="w-1.5 h-6 rounded-full bg-emerald-500"></div>
            </div>

            {/* Carbs */}
            <div className="border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-3 bg-slate-50/50 dark:bg-zinc-950/40 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase">Carbs</span>
                <span className="text-lg font-black text-slate-800 dark:text-zinc-200">{mealData.totals.carbs}g</span>
              </div>
              <div className="w-1.5 h-6 rounded-full bg-amber-500"></div>
            </div>

            {/* Fat */}
            <div className="border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-3 bg-slate-50/50 dark:bg-zinc-950/40 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase">Fats</span>
                <span className="text-lg font-black text-slate-800 dark:text-zinc-200">{mealData.totals.fat}g</span>
              </div>
              <div className="w-1.5 h-6 rounded-full bg-indigo-500"></div>
            </div>

            {/* Fiber */}
            <div className="border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-3 bg-slate-50/50 dark:bg-zinc-950/40 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase">Fiber</span>
                <span className="text-lg font-black text-slate-800 dark:text-zinc-200">{mealData.totals.fiber}g</span>
              </div>
              <div className="w-1.5 h-6 rounded-full bg-teal-500"></div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights and recommendations */}
      {mealData.ai_insights && (
        <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/[0.03] to-transparent border border-emerald-500/20 p-6 rounded-3xl shadow-sm flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl"></div>
          <h3 className="text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            AI Insights & Recommendations
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold text-slate-800 dark:text-zinc-300">Nutritional Diagnosis:</p>
              <ul className="text-xs text-slate-600 dark:text-zinc-400 list-disc list-inside space-y-1">
                {mealData.ai_insights.nutrient_deficiencies.map((d, idx) => (
                  <li key={idx} className="marker:text-amber-500"><span className="text-amber-600 dark:text-amber-400">Deficiency Alert:</span> {d}</li>
                ))}
                {mealData.ai_insights.excess_nutrients.map((e, idx) => (
                  <li key={idx} className="marker:text-rose-500"><span className="text-rose-500">Excess Alert:</span> {e}</li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-2 border-l border-slate-200 dark:border-zinc-800/80 pl-0 md:pl-4">
              <p className="text-xs font-bold text-slate-800 dark:text-zinc-300">Dietary Improvement Action:</p>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                {mealData.ai_insights.meal_recommendations}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80 text-xs">
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-slate-700 dark:text-zinc-300">Health Recommendation:</span>
              <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">{mealData.ai_insights.health_recommendations}</p>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-slate-700 dark:text-zinc-300">Fitness Strategy:</span>
              <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">{mealData.ai_insights.fitness_recommendations}</p>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Detected Food Items List */}
      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-black tracking-tight">Detected Food Items ({mealData.food_items?.length || 0})</h3>
        
        <div className="flex flex-col gap-4">
          {mealData.food_items?.map((item, idx) => (
            <div key={idx} className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-850 p-6 rounded-3xl shadow-sm flex flex-col gap-4">
              
              {/* Item Info Header */}
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-slate-800 dark:text-zinc-100">{item.food_name}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      {(item.confidence * 100).toFixed(0)}% Match
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5">
                    {item.cuisine && `${item.cuisine} Cuisine`} • {item.cooking_method && `Prepared via ${item.cooking_method}`}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-sm font-black text-slate-850 dark:text-zinc-200">{item.portion_size}</span>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">Portion Scale</p>
                </div>
              </div>

              {/* Item Portion Weights and Volumes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-850 rounded-2xl p-3 flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase">Estimated Weight</span>
                  <span className="text-sm font-bold">{item.weight_grams}g</span>
                </div>

                {item.volume_ml && item.volume_ml > 0 && (
                  <div className="bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-850 rounded-2xl p-3 flex flex-col gap-0.5">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase">Estimated Volume</span>
                    <span className="text-sm font-bold">{item.volume_ml}ml</span>
                  </div>
                )}

                <div className="bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-850 rounded-2xl p-3 flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase">Serving Count</span>
                  <span className="text-sm font-bold">{item.serving_count || 1} serving</span>
                </div>

                {item.plate_coverage_pct && item.plate_coverage_pct > 0 && (
                  <div className="bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-850 rounded-2xl p-3 flex flex-col gap-0.5">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase">Plate Coverage</span>
                    <span className="text-sm font-bold">{item.plate_coverage_pct}%</span>
                  </div>
                )}
              </div>

              {/* Ingredients and hidden estimates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-slate-100 dark:border-zinc-850">
                {/* Ingredients list */}
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">Major Ingredients</span>
                  <div className="flex flex-wrap gap-1.5">
                    {item.ingredients.map((ing, ingIdx) => (
                      <span key={ingIdx} className="text-[11px] bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950/60 dark:hover:bg-zinc-950 border border-slate-200/50 dark:border-zinc-850 px-2.5 py-1 rounded-lg text-slate-700 dark:text-zinc-300 font-medium">
                        {ing.name} ({ing.amount})
                      </span>
                    ))}
                  </div>
                </div>

                {/* Hidden components */}
                {item.ingredient_estimates && (
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">Hidden Ingredients Calibrator</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {item.ingredient_estimates.oil_grams > 0 && (
                        <div className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-zinc-950/50 border border-slate-100 dark:border-zinc-850">
                          <span className="text-slate-500 dark:text-zinc-500 font-semibold">Cooking Oil:</span>
                          <span className="font-bold">{item.ingredient_estimates.oil_grams}g</span>
                        </div>
                      )}
                      {item.ingredient_estimates.sugar_grams > 0 && (
                        <div className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-zinc-950/50 border border-slate-100 dark:border-zinc-850">
                          <span className="text-slate-500 dark:text-zinc-500 font-semibold">Added Sugar:</span>
                          <span className="font-bold text-amber-600">{item.ingredient_estimates.sugar_grams}g</span>
                        </div>
                      )}
                      {item.ingredient_estimates.salt_grams > 0 && (
                        <div className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-zinc-950/50 border border-slate-100 dark:border-zinc-850">
                          <span className="text-slate-500 dark:text-zinc-500 font-semibold">Sodium/Salt:</span>
                          <span className="font-bold text-rose-500">{item.ingredient_estimates.salt_grams}g</span>
                        </div>
                      )}
                      {item.ingredient_estimates.butter_grams > 0 && (
                        <div className="flex justify-between p-2 rounded-xl bg-slate-50 dark:bg-zinc-950/50 border border-slate-100 dark:border-zinc-850">
                          <span className="text-slate-500 dark:text-zinc-500 font-semibold">Butter/Ghee:</span>
                          <span className="font-bold text-amber-500">{item.ingredient_estimates.butter_grams}g</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Extended micronutrients breakdown */}
              <div className="pt-3 border-t border-slate-100 dark:border-zinc-850">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500 mb-2 block">Micro-nutrient Details</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 border border-slate-200/40 dark:border-zinc-850 rounded-xl flex justify-between bg-slate-50/20 dark:bg-zinc-950/10">
                    <span className="text-slate-500">Sodium:</span>
                    <span className="font-bold">{item.nutrition.sodium}mg</span>
                  </div>
                  <div className="p-2 border border-slate-200/40 dark:border-zinc-850 rounded-xl flex justify-between bg-slate-50/20 dark:bg-zinc-950/10">
                    <span className="text-slate-500">Calcium:</span>
                    <span className="font-bold">{item.nutrition.calcium}mg</span>
                  </div>
                  <div className="p-2 border border-slate-200/40 dark:border-zinc-850 rounded-xl flex justify-between bg-slate-50/20 dark:bg-zinc-950/10">
                    <span className="text-slate-500">Iron:</span>
                    <span className="font-bold">{item.nutrition.iron}mg</span>
                  </div>
                  <div className="p-2 border border-slate-200/40 dark:border-zinc-850 rounded-xl flex justify-between bg-slate-50/20 dark:bg-zinc-950/10">
                    <span className="text-slate-500">Vitamin C:</span>
                    <span className="font-bold">{item.nutrition.vitamin_c}mg</span>
                  </div>
                  {item.nutrition.potassium && (
                    <div className="p-2 border border-slate-200/40 dark:border-zinc-850 rounded-xl flex justify-between bg-slate-50/20 dark:bg-zinc-950/10">
                      <span className="text-slate-500">Potassium:</span>
                      <span className="font-bold">{item.nutrition.potassium}mg</span>
                    </div>
                  )}
                  {item.nutrition.vitamin_a && (
                    <div className="p-2 border border-slate-200/40 dark:border-zinc-850 rounded-xl flex justify-between bg-slate-50/20 dark:bg-zinc-950/10">
                      <span className="text-slate-500">Vit A:</span>
                      <span className="font-bold">{item.nutrition.vitamin_a}µg</span>
                    </div>
                  )}
                  {item.nutrition.water_content_grams && (
                    <div className="p-2 border border-slate-200/40 dark:border-zinc-850 rounded-xl flex justify-between bg-slate-50/20 dark:bg-zinc-950/10">
                      <span className="text-slate-500">Water content:</span>
                      <span className="font-bold">{item.nutrition.water_content_grams}g</span>
                    </div>
                  )}
                  {item.nutrition.cholesterol && (
                    <div className="p-2 border border-slate-200/40 dark:border-zinc-850 rounded-xl flex justify-between bg-slate-50/20 dark:bg-zinc-950/10">
                      <span className="text-slate-500">Cholesterol:</span>
                      <span className="font-bold text-rose-500">{item.nutrition.cholesterol}mg</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
