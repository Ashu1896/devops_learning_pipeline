import React, { useState, useMemo, useEffect } from 'react';
import { useMealStore } from '../store/useMealStore';
import { useAuthStore } from '../store/useAuthStore';
import type { Meal } from '../types';
import { Trash2, Search, Calendar, ChevronRight, X, Clock, Sparkles } from 'lucide-react';

export const MealTimeline: React.FC = () => {
  const { user } = useAuthStore();
  const { meals, deleteMeal, fetchMeals, loading } = useMealStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchMeals(user.id);
    }
  }, [user?.id]);

  // Filters & search processing
  const filteredMeals = useMemo(() => {
    return meals.filter(meal => {
      const matchesSearch = meal.meal_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = activeFilter === 'All' || meal.meal_type === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [meals, searchTerm, activeFilter]);

  const handleDelete = async (e: React.MouseEvent, mealId: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this meal record?")) {
      try {
        await deleteMeal(mealId);
        if (selectedMeal?.id === mealId) {
          setSelectedMeal(null);
        }
      } catch (err) {
        alert("Failed to delete the record.");
      }
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filters = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks'];

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6 animate-slide-up pb-10">
      
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Food Diary</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-500">
            View history logs, nutrient breakdowns, and offline sync aggregates.
          </p>
        </div>
      </div>

      {/* Search & Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search logged meals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 focus:border-emerald-500/50 rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none transition-all duration-200"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {filters.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4.5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 border ${
                activeFilter === filter
                  ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-black border-slate-900 dark:border-zinc-100 shadow-sm'
                  : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-850 hover:bg-slate-50 dark:hover:bg-zinc-850'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Main List */}
      {loading && meals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-slate-500">Fetching diary records...</span>
        </div>
      ) : filteredMeals.length === 0 ? (
        <div className="border border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl p-12 text-center bg-white dark:bg-zinc-900 shadow-sm">
          <Calendar className="w-10 h-10 text-slate-400 dark:text-zinc-500 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700 dark:text-zinc-300">No Meals Found</p>
          <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1 max-w-xs mx-auto">
            Try adjusting your search criteria or scan a new meal to log your first entry.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredMeals.map(meal => (
            <div
              key={meal.id}
              onClick={() => setSelectedMeal(meal)}
              className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-850 p-4 rounded-3xl shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 flex items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Thumbnail */}
                <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-100 dark:border-zinc-800 flex-shrink-0">
                  {meal.image_url ? (
                    <img src={meal.image_url} alt={meal.meal_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-100 dark:bg-zinc-850 flex items-center justify-center text-xs">🥘</div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 truncate">{meal.meal_name}</h3>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800/80 text-slate-500 dark:text-zinc-400">
                      {meal.meal_type}
                    </span>
                    {meal.isOfflinePending && (
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-0.5 animate-pulse">
                        <Clock className="w-2.5 h-2.5" />
                        Offline queue
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-350 dark:text-zinc-650" />
                    {formatDate(meal.recorded_at)}
                  </p>
                </div>
              </div>

              {/* Nutrition summary & buttons */}
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-5">
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-800 dark:text-zinc-200">{meal.totals.calories}</span>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 block">kcal</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-emerald-500">{meal.totals.protein}g</span>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 block">Protein</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleDelete(e, meal.id!)}
                    className="p-2.5 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all duration-200"
                    aria-label="Delete log entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform duration-200" />
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Expanded Modal details view */}
      {selectedMeal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto no-scrollbar animate-scale-in">
            {/* Modal header */}
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  {selectedMeal.meal_type} log
                </span>
                <h3 className="text-lg font-black mt-1.5">{selectedMeal.meal_name}</h3>
                <p className="text-[10px] text-slate-500 dark:text-zinc-500 mt-0.5">{formatDate(selectedMeal.recorded_at)}</p>
              </div>
              <button
                onClick={() => setSelectedMeal(null)}
                className="p-1.5 border border-slate-200 dark:border-zinc-800 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body contents */}
            <div className="flex flex-col gap-5">
              {/* Photo & Health gauge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="aspect-video sm:aspect-square rounded-2xl overflow-hidden border border-slate-100 dark:border-zinc-800 shadow-sm">
                  {selectedMeal.image_url ? (
                    <img src={selectedMeal.image_url} alt="meal photo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-100 dark:bg-zinc-850 flex items-center justify-center text-xs">No image logged</div>
                  )}
                </div>

                <div className="bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/50 dark:border-zinc-850 p-4 rounded-2xl flex flex-col items-center justify-center gap-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Health Index</span>
                  <div className="w-24 h-24 rounded-full border-[6px] border-emerald-500/10 border-t-emerald-500 flex items-center justify-center relative">
                    <span className="text-2xl font-black">{selectedMeal.health_score.overall}</span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-zinc-500 text-center font-semibold">
                    Calculated health efficiency score
                  </span>
                </div>
              </div>

              {/* Nutrition Summary grid */}
              <div className="bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-850 p-4 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Intake stats</span>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 dark:text-zinc-550 font-bold uppercase">Calories</span>
                    <span className="text-base font-black text-slate-800 dark:text-zinc-200">{selectedMeal.totals.calories} kcal</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 dark:text-zinc-550 font-bold uppercase">Protein</span>
                    <span className="text-base font-black text-emerald-500">{selectedMeal.totals.protein}g</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 dark:text-zinc-550 font-bold uppercase">Carbs</span>
                    <span className="text-base font-black text-amber-500">{selectedMeal.totals.carbs}g</span>
                  </div>
                  <div className="flex flex-col mt-2">
                    <span className="text-[10px] text-slate-400 dark:text-zinc-550 font-bold uppercase">Fats</span>
                    <span className="text-base font-black text-indigo-500">{selectedMeal.totals.fat}g</span>
                  </div>
                  <div className="flex flex-col mt-2">
                    <span className="text-[10px] text-slate-400 dark:text-zinc-550 font-bold uppercase">Fiber</span>
                    <span className="text-base font-black text-teal-500">{selectedMeal.totals.fiber}g</span>
                  </div>
                  <div className="flex flex-col mt-2">
                    <span className="text-[10px] text-slate-400 dark:text-zinc-550 font-bold uppercase">Sodium</span>
                    <span className="text-base font-black text-slate-700 dark:text-zinc-350">{selectedMeal.totals.sodium}mg</span>
                  </div>
                </div>
              </div>

              {/* Food Items lists */}
              <div className="flex flex-col gap-2.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Detected Ingredients & Portions</span>
                <div className="flex flex-col gap-2.5">
                  {selectedMeal.food_items?.map((item, idx) => (
                    <div key={idx} className="border border-slate-200/50 dark:border-zinc-800 p-4 rounded-2xl flex flex-col gap-2 bg-slate-50/20 dark:bg-zinc-950/20">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold">{item.food_name}</span>
                        <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">{item.weight_grams}g ({item.portion_size})</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {item.ingredients.map((ing, ingIdx) => (
                          <span key={ingIdx} className="text-[10px] bg-slate-50 dark:bg-zinc-950/80 px-2 py-0.5 rounded border border-slate-200/40 dark:border-zinc-850">
                            {ing.name} ({ing.amount})
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI recommendation strings */}
              {selectedMeal.recommendations && selectedMeal.recommendations.length > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    Meal Improvements
                  </span>
                  <ul className="text-xs text-slate-700 dark:text-zinc-400 list-disc list-inside space-y-1">
                    {selectedMeal.recommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
