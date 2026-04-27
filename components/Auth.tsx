import React, { useState, useRef, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { gsap } from 'gsap';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import InstitutionDropdown from './InstitutionDropdown';
import type { Institution } from './InstitutionDropdown';

type Stage = 'form' | 'verify-sent' | 'forgot' | 'reset-sent';

const FEATURES = [
  { icon: 'psychology',    text: 'Adaptive AI concept breakdowns' },
  { icon: 'hub',           text: 'Semantic mind maps, auto-generated' },
  { icon: 'analytics',     text: 'Predictive mastery tracking' },
  { icon: 'quiz',          text: 'Quizzes, flashcards & active recall' },
  { icon: 'groups',        text: 'Study community & peer challenges' },
  { icon: 'emoji_events',  text: 'Earn XP, climb the leaderboard' },
];

const Auth: React.FC = () => {
  const [isLogin, setIsLogin]         = useState(true);
  const [stage, setStage]             = useState<Stage>('form');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [error, setError]             = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);
  const [clientId, setClientId]       = useState('');
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const { signIn, signInWithGoogle }  = useAuth();

  // Fetch institutions for signup dropdown
  useEffect(() => {
    supabase
      .from('clients')
      .select('id, name, logo_url')
      .in('status', ['active', 'trial'])
      .order('name')
      .then(({ data }) => { if (data) setInstitutions(data as Institution[]); });
  }, []);

  const formRef  = useRef<HTMLDivElement>(null);
  const orb1Ref  = useRef<HTMLDivElement>(null);
  const orb2Ref  = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const verifyRef= useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.cs-feat-item', { x: -30, opacity: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out', delay: 0.35 });
      gsap.from('.cs-hero-text',  { y: 24,  opacity: 0, duration: 0.7, ease: 'power3.out', delay: 0.1 });
      gsap.from(formRef.current,  { y: 40,  opacity: 0, duration: 0.7, ease: 'power3.out', delay: 0.1 });
      gsap.to(orb1Ref.current, { x: 50, y: -40, duration: 7,   repeat: -1, yoyo: true, ease: 'sine.inOut' });
      gsap.to(orb2Ref.current, { x: -40, y: 50, duration: 9,   repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 2 });
    });
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (error && errorRef.current)
      gsap.fromTo(errorRef.current, { x: -6 }, { x: 0, duration: 0.4, ease: 'elastic.out(4,0.3)' });
  }, [error]);

  useEffect(() => {
    if (stage === 'verify-sent' && verifyRef.current) {
      gsap.from(verifyRef.current, { scale: 0.88, opacity: 0, duration: 0.4, ease: 'back.out(2)' });
      gsap.from('.cs-vstep',       { x: 20, opacity: 0, duration: 0.35, stagger: 0.09, ease: 'power3.out', delay: 0.2 });
    }
  }, [stage]);

  const switchMode = () => {
    if (!formRef.current) return;
    gsap.timeline()
      .to(formRef.current, { filter: 'blur(8px)', opacity: 0, scale: 0.97, duration: 0.2, ease: 'power2.in' })
      .add(() => { flushSync(() => { setIsLogin(v => !v); setError(null); setClientId(''); }); })
      .to(formRef.current, { filter: 'blur(0px)', opacity: 1, scale: 1, duration: 0.28, ease: 'power2.out' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isLogin) {
        const { error, data } = await signIn(email, password) as any;
        if (error) throw error;
        // If user selected an institution on login and profile has no client_id yet, set it
        if (clientId && data?.user) {
          supabase.from('profiles')
            .select('client_id').eq('id', data.user.id).single()
            .then(({ data: prof }) => {
              if (!prof?.client_id) {
                supabase.from('profiles').update({ client_id: clientId }).eq('id', data.user.id).then(() => {});
              }
            });
        }
        // Ban check handled by AppContent
      } else {
        if (!clientId) { setError('Please select your institution to continue.'); setLoading(false); return; }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { client_id: clientId } }, // stored in user metadata
        });
        if (error) throw error;
        // Also upsert into profiles immediately (handles both new + existing rows)
        if (data.user) {
          // Retry until profile row exists (trigger may be async)
          const tryUpsert = async (retries = 5) => {
            const { error: e } = await supabase
              .from('profiles')
              .upsert({ id: data.user!.id, client_id: clientId }, { onConflict: 'id' });
            if (e && retries > 0) setTimeout(() => tryUpsert(retries - 1), 800);
          };
          setTimeout(() => tryUpsert(), 500);
        }
        setStage('verify-sent');
      }
    } catch (err: any) {
      const msg: string = err?.message ?? '';
      if (isLogin) setError('Invalid email or password. Please try again.');
      else if (msg.toLowerCase().includes('password')) setError('Password must be at least 6 characters.');
      else if (msg.toLowerCase().includes('already')) setError('This email is already registered. Try signing in.');
      else setError('Could not create account. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setStage('reset-sent');
    } catch (err: any) {
      setError(err.message || 'Could not send reset email. Check the address and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-body overflow-hidden bg-surface">

      {/* ── Left panel ───────────────────────────────────────────── */}
      <section className="hidden lg:flex w-[60%] relative flex-col justify-between p-14 overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#060C17 0%,#0F1829 100%)' }}>
        {/* decorative orbs */}
        <div ref={orb1Ref} className="absolute top-1/4 -left-24 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'rgba(75,77,216,0.18)', filter: 'blur(60px)' }} />
        <div ref={orb2Ref} className="absolute bottom-1/3 right-0 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'rgba(99,102,241,0.12)', filter: 'blur(80px)' }} />

        {/* Logo */}
        <div className="relative z-10">
          <h1 className="font-serif italic text-3xl text-primary-fixed leading-tight">CogniStruct</h1>
        </div>

        {/* Hero text + features */}
        <div className="relative z-10 cs-hero-text max-w-lg">
          <h2 className="font-headline text-5xl text-white mb-5 leading-[1.1]">
            Your AI study<br />companion
          </h2>
          <p className="text-secondary-fixed-dim text-lg mb-10 max-w-md leading-relaxed">
            Elevate your learning with hyper-personalised intelligence and curated academic workflows.
          </p>
          <ul className="space-y-5">
            {FEATURES.map(({ icon, text }) => (
              <li key={text} className="cs-feat-item flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
                  <span className="material-symbols-outlined text-primary-fixed text-[20px]">{icon}</span>
                </div>
                <span className="text-slate-300 text-sm">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Badge */}
        <div className="relative z-10">
          <div className="inline-flex items-center px-4 py-2 rounded-full"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}>
            <span className="text-[10px] font-bold tracking-widest text-primary-fixed uppercase">Class 6–10 · NCERT</span>
          </div>
        </div>
      </section>

      {/* ── Right panel ──────────────────────────────────────────── */}
      <section className="w-full lg:w-[40%] flex items-center justify-center p-6 bg-surface">
        <div ref={formRef} className="w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <h1 className="font-serif italic text-2xl text-primary">CogniStruct</h1>
          </div>

          {/* ── Verify screen ── */}
          {stage === 'reset-sent' ? (
            <div ref={verifyRef} className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto primary-gradient rounded-full flex items-center justify-center shadow-glow">
                <span className="material-symbols-outlined text-white text-[36px]">lock_reset</span>
              </div>
              <div>
                <h2 className="text-2xl font-serif text-on-surface mb-2">Check your inbox</h2>
                <p className="text-secondary text-sm leading-relaxed">
                  We sent a password reset link to<br />
                  <span className="font-semibold text-on-surface">{email}</span>
                </p>
              </div>
              <p className="text-xs text-outline">
                Didn't get it?{' '}
                <button onClick={() => setStage('forgot')} className="text-primary font-semibold hover:underline">Try again</button>
              </p>
              <button
                onClick={() => { setStage('form'); setIsLogin(true); }}
                className="w-full py-3.5 primary-gradient text-on-primary font-bold rounded-[10px] shadow-glow hover:shadow-glow-lg transition-all"
              >
                Back to Sign In
              </button>
            </div>

          ) : stage === 'forgot' ? (
            <div>
              <button onClick={() => { setStage('form'); setError(null); }} className="flex items-center gap-1 text-sm text-secondary mb-6 hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back to sign in
              </button>
              <div className="mb-8">
                <h2 className="font-headline text-4xl text-on-surface mb-1.5">Reset password</h2>
                <p className="text-secondary font-medium text-sm">Enter your email and we'll send a reset link.</p>
              </div>
              {error && (
                <div ref={errorRef} className="mb-5 p-3.5 bg-error-container rounded-xl flex items-start gap-3 text-sm text-on-error-container">
                  <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
                  <p>{error}</p>
                </div>
              )}
              <form onSubmit={handleForgot} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-on-surface-variant mb-1.5 ml-1">Email Address</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-outline text-[20px] group-focus-within:text-primary transition-colors">mail</span>
                    </div>
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      required autoComplete="email"
                      className="block w-full pl-12 pr-4 py-3.5 bg-surface-container-lowest rounded-[10px] text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                      style={{ border: '1px solid rgba(199,196,216,0.3)' }}
                      placeholder="name@school.com"
                    />
                  </div>
                </div>
                <button
                  type="submit" disabled={loading}
                  className="w-full py-4 primary-gradient text-on-primary font-bold rounded-[10px] shadow-glow hover:shadow-glow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                    : <>Send Reset Link <span className="material-symbols-outlined text-[18px]">send</span></>
                  }
                </button>
              </form>
            </div>

          ) : stage === 'verify-sent' ? (
            <div ref={verifyRef} className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto primary-gradient rounded-full flex items-center justify-center shadow-glow">
                <span className="material-symbols-outlined text-white text-[36px]">mark_email_read</span>
              </div>
              <div>
                <h2 className="text-2xl font-serif text-on-surface mb-2">Check your inbox</h2>
                <p className="text-secondary text-sm leading-relaxed">
                  We sent a verification link to<br />
                  <span className="font-semibold text-on-surface">{email}</span>
                </p>
              </div>
              <div className="bg-surface-container-low rounded-xl p-4 text-left space-y-3">
                {['Open the email from CogniStruct', 'Click "Verify my email"', 'Come back here and sign in'].map((step, i) => (
                  <div key={step} className="cs-vstep flex items-center gap-3 text-sm text-on-surface-variant">
                    <div className="w-6 h-6 rounded-full primary-gradient text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                      {i + 1}
                    </div>
                    {step}
                  </div>
                ))}
              </div>
              <p className="text-xs text-outline">
                Didn't get it?{' '}
                <button onClick={() => { setStage('form'); setIsLogin(false); }} className="text-primary font-semibold hover:underline">Try again</button>
              </p>
              <button
                onClick={() => { setStage('form'); setIsLogin(true); }}
                className="w-full py-3.5 primary-gradient text-on-primary font-bold rounded-[10px] shadow-glow hover:shadow-glow-lg transition-all"
              >
                Back to Sign In
              </button>
            </div>

          ) : (
          /* ── Auth form ── */
          <>
            <div className="mb-8 text-center lg:text-left">
              <h2 className="font-headline text-4xl text-on-surface mb-1.5">
                {isLogin ? 'Welcome back' : 'Create account'}
              </h2>
              <p className="text-secondary font-medium text-sm">
                {isLogin ? 'Enter your details to sign in.' : 'Join thousands of students learning smarter.'}
              </p>
            </div>

            {error && (
              <div ref={errorRef} className="mb-5 p-3.5 bg-error-container rounded-xl flex items-start gap-3 text-sm text-on-error-container">
                <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-1.5 ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline text-[20px] group-focus-within:text-primary transition-colors">mail</span>
                  </div>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    required autoComplete="email"
                    className="block w-full pl-12 pr-4 py-3.5 bg-surface-container-lowest rounded-[10px] text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                    style={{ border: '1px solid rgba(199,196,216,0.3)' }}
                    placeholder="name@school.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-on-surface-variant ml-1">Password</label>
                  {isLogin && <button type="button" onClick={() => { setError(null); setStage('forgot'); }} className="text-xs font-semibold text-primary hover:underline">Forgot password?</button>}
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline text-[20px] group-focus-within:text-primary transition-colors">lock</span>
                  </div>
                  <input
                    type="password" value={password} onChange={e => setPassword(e.target.value)}
                    required minLength={6} autoComplete={isLogin ? 'current-password' : 'new-password'}
                    className="block w-full pl-12 pr-4 py-3.5 bg-surface-container-lowest rounded-[10px] text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                    style={{ border: '1px solid rgba(199,196,216,0.3)' }}
                    placeholder="••••••••"
                  />
                </div>
                {!isLogin && <p className="mt-1.5 text-xs text-outline ml-1">Minimum 6 characters</p>}
              </div>

              {/* Institution selector — both login and signup */}
              <div>
                <label className="block text-sm font-semibold text-on-surface-variant mb-1.5 ml-1">
                  Institution / School{!isLogin && <span className="text-error"> *</span>}
                </label>
                {institutions.length === 0 ? (
                  <div className="flex items-center gap-2 px-4 py-3.5 rounded-[10px] text-sm"
                    style={{ background: 'var(--color-surface-container-lowest)', border: '1px solid rgba(199,196,216,0.3)', color: '#8b9cb5' }}>
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    Loading institutions…
                  </div>
                ) : (
                  <InstitutionDropdown
                    institutions={institutions}
                    value={clientId}
                    onChange={setClientId}
                    required={!isLogin}
                    placeholder="Select your institution…"
                  />
                )}
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full py-4 primary-gradient text-on-primary font-bold rounded-[10px] shadow-glow hover:shadow-glow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Please wait…</>
                  : <>{isLogin ? 'Sign In' : 'Create Account'} <span className="material-symbols-outlined text-[18px]">arrow_forward</span></>
                }
              </button>
            </form>

            <div className="my-7 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: 'rgba(199,196,216,0.5)' }} />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-4 bg-surface text-secondary font-medium">Or continue with</span>
              </div>
            </div>

            <button
              onClick={handleGoogle} disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-surface-container-lowest font-semibold text-on-surface rounded-[10px] hover:bg-surface-container-low active:scale-[0.98] transition-all disabled:opacity-50 text-sm"
              style={{ border: '1px solid rgba(199,196,216,0.5)' }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <p className="mt-8 text-center text-sm text-on-surface-variant font-medium">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={switchMode} className="text-primary font-bold hover:underline ml-1">
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Auth;
