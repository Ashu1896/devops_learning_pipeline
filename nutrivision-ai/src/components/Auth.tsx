import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Mail, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';

export const Auth: React.FC = () => {
  const { signIn, signUp, signInWithGoogle, signInWithApple, error: authError, loading } = useAuthStore();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!email || !password) {
      setValidationError('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters.');
      return;
    }
    if (isSignUp && !name) {
      setValidationError('Please enter your name.');
      return;
    }

    try {
      if (isSignUp) {
        await signUp(email, password, name);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      // Handled by store, but we catch to prevent unhandled rejection
    }
  };

  const handleAppleMock = async () => {
    await signInWithApple();
  };

  const handleGoogleMock = async () => {
    await signInWithGoogle();
  };

  const displayError = validationError || authError;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 px-4 relative overflow-hidden">
      {/* Background blobs for premium depth */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none animate-pulse-subtle"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-zinc-950/80 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-8 shadow-2xl flex flex-col gap-6 animate-scale-in">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-emerald-500/20">
            N
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mt-2">
            Welcome to NutriVision AI
          </h2>
          <p className="text-sm text-zinc-400">
            {isSignUp ? 'Create your profile to start tracking food.' : 'Sign in to access your personal nutrition dashboard.'}
          </p>
        </div>

        {/* Error alert */}
        {displayError && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold px-4 py-3 rounded-2xl animate-shake">
            {displayError}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isSignUp && (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 pl-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 focus:border-emerald-500/50 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none transition-all duration-200"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 pl-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 focus:border-emerald-500/50 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none transition-all duration-200"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center px-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Password</label>
              {!isSignUp && (
                <button type="button" className="text-[10px] font-semibold text-emerald-400 hover:text-emerald-300">
                  Forgot?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 focus:border-emerald-500/50 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none transition-all duration-200"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-2xl py-3.5 text-sm font-bold shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-75 disabled:pointer-events-none"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                {isSignUp ? 'Create Account' : 'Sign In'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-zinc-800/80"></div>
          <span className="flex-shrink mx-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">or continue with</span>
          <div className="flex-grow border-t border-zinc-800/80"></div>
        </div>

        {/* Social Buttons */}
        <div className="grid grid-cols-2 gap-3.5">
          <button
            onClick={handleGoogleMock}
            className="flex items-center justify-center gap-2 py-3 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-200 rounded-2xl transition-all duration-200 active:scale-95"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
            Google
          </button>
          <button
            onClick={handleAppleMock}
            className="flex items-center justify-center gap-2 py-3 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-200 rounded-2xl transition-all duration-200 active:scale-95"
          >
            <span className="text-sm font-bold"></span>
            Apple
          </button>
        </div>

        {/* Toggle Mode */}
        <div className="text-center mt-2">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(prev => !prev);
              setValidationError(null);
            }}
            className="text-xs font-bold text-zinc-400 hover:text-white transition-colors duration-200"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>

        {/* Secure policy tag */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-500 font-medium border-t border-zinc-800/50 pt-4 mt-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          End-to-End Encrypted & HIPAA Compliant Data
        </div>
      </div>
    </div>
  );
};
