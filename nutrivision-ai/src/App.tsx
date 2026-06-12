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
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setDebugLogs(prev => [...prev, `Error: ${event.message} at ${event.filename}:${event.lineno}`]);
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      setDebugLogs(prev => [...prev, `Promise Rejected: ${event.reason}`]);
    };
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

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
      {debugLogs.length > 0 && (
        <div className="fixed bottom-20 right-4 z-[9999] max-w-xs bg-slate-900/95 dark:bg-black/95 text-red-500 dark:text-red-400 p-4 rounded-2xl text-[10px] border border-red-500/30 max-h-48 overflow-y-auto font-mono shadow-2xl">
          <div className="flex justify-between font-bold border-b border-red-500/20 pb-1 mb-1 text-slate-100">
            <span>Debug Exceptions Console</span>
            <button onClick={() => setDebugLogs([])} className="text-[9px] text-slate-400 hover:text-white uppercase font-bold">Clear</button>
          </div>
          {debugLogs.map((log, i) => <div key={i} className="mb-1 leading-tight break-words">{log}</div>)}
        </div>
      )}
    </Layout>
  );
};

export default App;
