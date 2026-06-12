import React, { useState, useEffect } from 'react';
import { useProfileStore } from '../store/useProfileStore';
import { useAuthStore } from '../store/useAuthStore';
import { User, Scale, Ruler, Calendar, Target, Award, Check } from 'lucide-react';

export const UserProfile: React.FC = () => {
  const { user } = useAuthStore();
  const { profile, loading, error, updateProfile, fetchProfile } = useProfileStore();

  const [name, setName] = useState('');
  const [age, setAge] = useState(30);
  const [gender, setGender] = useState('Male');
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(70);
  const [goal, setGoal] = useState<any>('Maintenance');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchProfile(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setAge(profile.age || 30);
      setGender(profile.gender || 'Male');
      setHeight(profile.height || 175);
      setWeight(profile.weight || 70);
      setGoal(profile.goal || 'Maintenance');
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuccess(false);

    try {
      await updateProfile({
        name,
        age: Number(age),
        gender,
        height: Number(height),
        weight: Number(weight),
        goal,
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const goals = [
    { value: 'Weight Loss', label: 'Weight Loss', desc: 'Caloric deficit to shed fat safely' },
    { value: 'Weight Gain', label: 'Weight Gain', desc: 'Caloric surplus to put on size' },
    { value: 'Muscle Building', label: 'Muscle Building', desc: 'High-protein surplus to build muscle' },
    { value: 'Maintenance', label: 'Maintenance', desc: 'Keep weight stable & healthy' },
    { value: 'Diabetic', label: 'Diabetic Friendly', desc: 'Controlled carb loading, balanced fat' },
    { value: 'Heart Health', label: 'Heart Health', desc: 'Low saturated fat, high cardiovascular health' }
  ];

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 dark:text-zinc-500">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6 animate-slide-up">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Profile & Goals</h2>
        <p className="text-sm text-slate-500 dark:text-zinc-500">
          Customize your metrics and fitness objectives. Our AI adapts your targets using metabolic equations.
        </p>
      </div>

      {showSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 text-xs font-semibold px-4 py-3 rounded-2xl flex items-center gap-2 animate-scale-in">
          <Check className="w-4 h-4" />
          Profile updated and nutritional macro targets recalculated!
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-xs font-semibold px-4 py-3 rounded-2xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <form onSubmit={handleSave} className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-500" />
            Biometric Data
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/50 dark:bg-zinc-950/60 dark:hover:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-emerald-500/50 rounded-2xl py-3 px-4 text-sm focus:outline-none transition-all duration-200"
                placeholder="Alex"
              />
            </div>

            {/* Age */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">Age (years)</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 dark:text-zinc-500" />
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  min="1"
                  max="120"
                  className="w-full bg-slate-50 hover:bg-slate-100/50 dark:bg-zinc-950/60 dark:hover:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-emerald-500/50 rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none transition-all duration-200"
                />
              </div>
            </div>

            {/* Height */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">Height (cm)</label>
              <div className="relative">
                <Ruler className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 dark:text-zinc-500" />
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  min="50"
                  max="250"
                  className="w-full bg-slate-50 hover:bg-slate-100/50 dark:bg-zinc-950/60 dark:hover:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-emerald-500/50 rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none transition-all duration-200"
                />
              </div>
            </div>

            {/* Weight */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">Weight (kg)</label>
              <div className="relative">
                <Scale className="absolute left-4 top-3.5 w-4 h-4 text-slate-400 dark:text-zinc-500" />
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  min="20"
                  max="300"
                  className="w-full bg-slate-50 hover:bg-slate-100/50 dark:bg-zinc-950/60 dark:hover:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-emerald-500/50 rounded-2xl py-3 pl-11 pr-4 text-sm focus:outline-none transition-all duration-200"
                />
              </div>
            </div>

            {/* Gender */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">Biological Sex</label>
              <div className="grid grid-cols-2 gap-2">
                {['Male', 'Female'].map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`py-3 rounded-2xl border text-sm font-semibold transition-all duration-200 ${
                      gender === g
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500'
                        : 'bg-slate-50 dark:bg-zinc-950/60 border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Goals Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">Active Health Goal</label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 focus:border-emerald-500/50 rounded-2xl py-3 px-4 text-sm focus:outline-none transition-all duration-200 text-slate-700 dark:text-zinc-300"
              >
                {goals.map(g => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Goal card explanation */}
          <div className="bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/60 dark:border-zinc-850 p-4 rounded-2xl flex gap-3 items-start">
            <Target className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold">{goal}</p>
              <p className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5">
                {goals.find(g => g.value === goal)?.desc}
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-2xl py-3.5 text-sm font-bold shadow-md shadow-emerald-500/10 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              'Save Profile Changes'
            )}
          </button>
        </form>

        {/* Targets Summary */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-500" />
            Computed Targets
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-500 -mt-2">
            Metabolic energy goals designed for your biometrics.
          </p>

          <div className="flex flex-col gap-4">
            {/* Calories Card */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-4 flex flex-col gap-1 shadow-sm">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Calories</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900 dark:text-white">{profile.target_calories}</span>
                <span className="text-xs font-bold text-slate-500 dark:text-zinc-500">kcal/day</span>
              </div>
            </div>

            {/* Protein Card */}
            <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col gap-1 bg-slate-50/50 dark:bg-zinc-950/40">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Protein Target</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900 dark:text-white">{profile.target_protein}</span>
                <span className="text-xs font-bold text-slate-500 dark:text-zinc-500">grams</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>

            {/* Carbs Card */}
            <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col gap-1 bg-slate-50/50 dark:bg-zinc-950/40">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Carbohydrates Target</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900 dark:text-white">{profile.target_carbs}</span>
                <span className="text-xs font-bold text-slate-500 dark:text-zinc-500">grams</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>

            {/* Fat Card */}
            <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col gap-1 bg-slate-50/50 dark:bg-zinc-950/40">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">Fats Target</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900 dark:text-white">{profile.target_fat}</span>
                <span className="text-xs font-bold text-slate-500 dark:text-zinc-500">grams</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '35%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
