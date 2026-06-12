import React, { useMemo } from 'react';
import { useMealStore } from '../store/useMealStore';
import { useProfileStore } from '../store/useProfileStore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Sparkles, TrendingUp, Info } from 'lucide-react';

interface DashboardProps {
  onAddMealClick: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onAddMealClick }) => {
  const { meals } = useMealStore();
  const { profile } = useProfileStore();

  // 1. Get today's meals
  const todayMeals = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return meals.filter(m => m.recorded_at.startsWith(todayStr));
  }, [meals]);

  // 2. Aggregate today's macros
  const todayTotals = useMemo(() => {
    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    todayMeals.forEach(meal => {
      totals.calories += meal.totals.calories;
      totals.protein += meal.totals.protein;
      totals.carbs += meal.totals.carbs;
      totals.fat += meal.totals.fat;
      totals.fiber += meal.totals.fiber;
    });
    return {
      calories: Math.round(totals.calories),
      protein: Number(totals.protein.toFixed(1)),
      carbs: Number(totals.carbs.toFixed(1)),
      fat: Number(totals.fat.toFixed(1)),
      fiber: Number(totals.fiber.toFixed(1))
    };
  }, [todayMeals]);

  // 3. Targets (defaults to profile or fallback)
  const targets = useMemo(() => {
    return {
      calories: profile?.target_calories || 2000,
      protein: profile?.target_protein || 60,
      carbs: profile?.target_carbs || 250,
      fat: profile?.target_fat || 70,
      fiber: 25 // standard recommendation
    };
  }, [profile]);

  // 4. Remaining math
  const remaining = useMemo(() => {
    return {
      calories: Math.max(0, targets.calories - todayTotals.calories),
      protein: Math.max(0, targets.protein - todayTotals.protein),
      carbs: Math.max(0, targets.carbs - todayTotals.carbs),
      fat: Math.max(0, targets.fat - todayTotals.fat)
    };
  }, [todayTotals, targets]);

  // 5. Weekly trend data for Recharts
  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return last7Days.map(dateStr => {
      const dayMeals = meals.filter(m => m.recorded_at.startsWith(dateStr));
      const totalCal = dayMeals.reduce((acc, m) => acc + m.totals.calories, 0);
      const totalProt = dayMeals.reduce((acc, m) => acc + m.totals.protein, 0);
      
      const formattedDate = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
      return {
        name: formattedDate,
        Calories: Math.round(totalCal),
        Protein: Math.round(totalProt * 4), // Express protein as equivalent kcal for visual stack
        Limit: targets.calories
      };
    });
  }, [meals, targets.calories]);

  // 6. Meal blocks categorization
  const mealBlocks = useMemo(() => {
    const blocks = {
      Breakfast: { name: 'Breakfast', icon: '🍳', calories: 0, protein: 0 },
      Lunch: { name: 'Lunch', icon: '🥗', calories: 0, protein: 0 },
      Dinner: { name: 'Dinner', icon: '🍲', calories: 0, protein: 0 },
      Snacks: { name: 'Snacks', icon: '🍪', calories: 0, protein: 0 }
    };

    todayMeals.forEach(m => {
      const block = blocks[m.meal_type as keyof typeof blocks];
      if (block) {
        block.calories += m.totals.calories;
        block.protein += m.totals.protein;
      }
    });

    return Object.values(blocks);
  }, [todayMeals]);

  // 7. Get latest AI insights
  const latestInsight = useMemo(() => {
    const scoredMeals = meals.filter(m => m.ai_insights !== undefined);
    if (scoredMeals.length === 0) return null;
    // Sort to find latest recorded
    return scoredMeals[0].ai_insights;
  }, [meals]);

  // Calories Progress Circle Maths
  const caloriesPercent = Math.min(100, (todayTotals.calories / targets.calories) * 100);
  const radius = 70;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (caloriesPercent / 100) * circumference;

  return (
    <div className="flex flex-col gap-6 animate-slide-up pb-10">
      {/* Welcome & Goal Banner */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Today's Intake</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-500 mt-0.5">
            Active Target: <span className="font-bold text-emerald-500">{profile?.goal || 'Maintenance'}</span>
          </p>
        </div>
        <button
          onClick={onAddMealClick}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-2xl py-3 px-5 text-sm font-bold shadow-md shadow-emerald-500/10 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Scan New Meal
        </button>
      </div>

      {/* Grid: Primary progress circles & stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Calories Ring Card */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-850 p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row items-center justify-around gap-6">
          <div className="relative w-40 h-40 flex items-center justify-center flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r={radius}
                strokeWidth={stroke}
                className="stroke-slate-100 dark:stroke-zinc-800"
                fill="transparent"
              />
              <circle
                cx="80"
                cy="80"
                r={radius}
                strokeWidth={stroke}
                className="stroke-emerald-500"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-black tracking-tight">{remaining.calories}</span>
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">kcal left</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Goal Budget</span>
              <p className="text-base font-black text-slate-800 dark:text-zinc-200">{targets.calories} kcal</p>
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Consumed</span>
              <p className="text-base font-black text-emerald-500">{todayTotals.calories} kcal</p>
            </div>
          </div>
        </div>

        {/* Macros Bar Tracker Card */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-850 p-6 rounded-3xl shadow-sm flex flex-col gap-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-500">Macronutrient Splits</span>
          
          <div className="flex flex-col gap-3.5">
            {/* Protein */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-zinc-300">Protein</span>
                <span className="text-slate-500 dark:text-zinc-500">
                  {todayTotals.protein} / <span className="text-slate-400">{targets.protein}g</span>
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (todayTotals.protein / targets.protein) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Carbs */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-zinc-300">Carbs</span>
                <span className="text-slate-500 dark:text-zinc-500">
                  {todayTotals.carbs} / <span className="text-slate-400">{targets.carbs}g</span>
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (todayTotals.carbs / targets.carbs) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Fat */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-zinc-300">Fats</span>
                <span className="text-slate-500 dark:text-zinc-500">
                  {todayTotals.fat} / <span className="text-slate-400">{targets.fat}g</span>
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (todayTotals.fat / targets.fat) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Insight Widget */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/[0.02] to-transparent border border-emerald-500/20 p-6 rounded-3xl shadow-sm flex flex-col gap-3 relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl animate-pulse"></div>
          
          <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-500 animate-spin-slow" />
            AI Dietitian Snapshot
          </h3>
          
          {latestInsight ? (
            <div className="flex flex-col gap-2.5">
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed line-clamp-4">
                {latestInsight.meal_recommendations}
              </p>
              
              {latestInsight.nutrient_deficiencies.length > 0 && (
                <div className="flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg w-max">
                  <Info className="w-3 h-3" />
                  Insight: {latestInsight.nutrient_deficiencies[0]}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col justify-center h-full text-center py-4 gap-1.5">
              <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">No Insights Yet</p>
              <p className="text-[11px] text-slate-500 dark:text-zinc-500">
                Log your first meal to receive customized metabolic evaluations and deficiency notices.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Meal blocks & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Meal blocks logger (2 columns equivalent on desktop) */}
        <div className="lg:col-span-2 flex flex-col gap-4 bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-850 p-6 rounded-3xl shadow-sm">
          <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-zinc-500">Meal Categories</span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mealBlocks.map(block => (
              <div
                key={block.name}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/50 dark:border-zinc-850 rounded-2xl shadow-sm hover:translate-y-[-2px] transition-transform duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white dark:bg-zinc-900 shadow-sm border border-slate-200/20 flex items-center justify-center text-xl">
                    {block.icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">{block.name}</h4>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">{block.protein}g protein</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-800 dark:text-zinc-200">{block.calories}</span>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 block">kcal</span>
                  </div>

                  <button
                    onClick={onAddMealClick}
                    className="p-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-xl border border-emerald-500/10 transition-all duration-200"
                    aria-label={`Add ${block.name}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Trend Chart (1 column) */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-850 p-6 rounded-3xl shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-zinc-500">Weekly intake</span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              Trend Cal
            </span>
          </div>

          <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-100 dark:stroke-zinc-800" />
                <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1c1c1e',
                    border: '1px solid #2c2c2e',
                    borderRadius: '12px',
                    color: '#f2f2f7',
                    fontSize: '11px'
                  }}
                />
                <Area type="monotone" dataKey="Calories" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCalories)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};
