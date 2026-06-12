import React, { useEffect, useState } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { useProfileStore } from './store/useProfileStore';
import { useMealStore } from './store/useMealStore';
import { Layout } from './components/Layout';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { CameraCapture } from './components/CameraCapture';
import { MealAnalysis } from './components/MealAnalysis';
import { MealTimeline } from './components/MealTimeline';
import { UserProfile } from './components/UserProfile';
import type { Meal } from './types';

export const App: React.FC = () => {
  const { user, loading: authLoading, initialize } = useAuthStore();
  const { fetchProfile } = useProfileStore();
  const { fetchMeals, syncOfflineQueue } = useMealStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentAnalysis, setCurrentAnalysis] = useState<{ meal: Meal; images: string[] } | null>(null);

  // Initialize auth sessions on mount
  useEffect(() => {
    initialize();
  }, []);

  // Fetch profiles and meals when auth completes
  useEffect(() => {
    if (user?.id) {
      fetchProfile(user.id);
      fetchMeals(user.id);

      // Attempt to sync offline queue if online
      if (navigator.onLine) {
        syncOfflineQueue(user.id);
      }
    }
  }, [user?.id]);

  // Sync offline queue when connection is restored
  useEffect(() => {
    const handleOnline = () => {
      if (user?.id) {
        syncOfflineQueue(user.id);
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user?.id]);

  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-base font-bold tracking-tight">NutriVision AI</h2>
          <p className="text-xs text-zinc-550">Initializing secure session...</p>
        </div>
      </div>
    );
  }

  // Enforce authentication
  if (!user) {
    return <Auth />;
  }

  // Handle views selection
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onAddMealClick={() => setActiveTab('capture')} />;
      case 'capture':
        if (currentAnalysis) {
          return (
            <MealAnalysis
              mealData={currentAnalysis.meal}
              images={currentAnalysis.images}
              onSaveComplete={() => {
                setCurrentAnalysis(null);
                setActiveTab('dashboard'); // Redirect to dashboard after log
              }}
              onCancel={() => {
                setCurrentAnalysis(null);
              }}
            />
          );
        }
        return (
          <CameraCapture
            onAnalysisComplete={(mealData, capturedImages) => {
              setCurrentAnalysis({ meal: mealData, images: capturedImages });
            }}
          />
        );
      case 'history':
        return <MealTimeline />;
      case 'profile':
        return <UserProfile />;
      default:
        return <Dashboard onAddMealClick={() => setActiveTab('capture')} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default App;
