import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import Sidebar from './components/Sidebar';
import Auth from './components/Auth';
import ProfilePopup from './components/ProfilePopup';
import PWAInstallBanner from './components/PWAInstallBanner';

const ChapterBreakdown = lazy(() => import('./components/ChapterBreakdown'));
const MindMap          = lazy(() => import('./components/MindMap'));
const ActiveRecall     = lazy(() => import('./components/ActiveRecall'));
const Flashcards       = lazy(() => import('./components/Flashcards'));
const DoubtSolver      = lazy(() => import('./components/DoubtSolver'));
const RevisionMode     = lazy(() => import('./components/RevisionMode'));
const AdminDashboard   = lazy(() => import('./components/AdminDashboard'));
const SubjectSelection = lazy(() => import('./components/SubjectSelection'));
const WholeChapter     = lazy(() => import('./components/WholeChapter'));
const Profile          = lazy(() => import('./components/Profile'));
const Community        = lazy(() => import('./components/Community'));
const Quiz             = lazy(() => import('./components/Quiz'));
const Leaderboard      = lazy(() => import('./components/Leaderboard'));
const ContactSupport   = lazy(() => import('./components/ContactSupport'));
const Timeline         = lazy(() => import('./components/Timeline'));
const IndiaMap         = lazy(() => import('./components/IndiaMap'));

import { AppMode, Theme, Chapter, Flashcard, UserProfile, FeatureFlags, RateLimits } from './types';
import { PREFILLED_CHAPTERS } from './constants';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { getUserData, saveUserData, getUserProfile, updateUserProfile, adminGetSettings, checkAndLogFeatureCall } from './services/db';
import { initOneSignal, loginOneSignal, logoutOneSignal, requestOneSignalPermission, autoPromptIfNeeded, onSubscriptionChange, isNotificationGranted } from './services/onesignal';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { AlertTriangle } from 'lucide-react';

const DEFAULT_FLAGS: FeatureFlags = {
  doubt_solver: true, mind_map: true, flashcards: true, quiz: true,
  active_recall: true, revision: true, community: true, leaderboard: true, whole_chapter: true,
};

// ── Bottom nav items (mobile) ────────────────────────────────────────────────
const BOTTOM_NAV = [
  { mode: AppMode.WHOLE_CHAPTER,     icon: 'psychology',   label: 'Tutor'   },
  { mode: AppMode.MIND_MAP,          icon: 'hub',          label: 'Maps'    },
  { mode: AppMode.QUIZ,              icon: 'quiz',         label: 'Quiz'    },
  { mode: AppMode.FLASHCARDS,        icon: 'style',        label: 'Cards'   },
  { mode: AppMode.COMMUNITY,         icon: 'groups',       label: 'Social'  },
];

const ConfigError: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-surface p-4">
    <div className="max-w-md w-full bg-white rounded-2xl shadow-card p-8 text-center">
      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <AlertTriangle className="w-8 h-8 text-amber-600" />
      </div>
      <h2 className="text-2xl font-serif text-on-surface mb-3">Configuration Required</h2>
      <p className="text-secondary text-sm mb-5 leading-relaxed">
        Supabase environment variables are missing. Set{' '}
        <code className="bg-surface-container-low px-1.5 py-0.5 rounded text-xs">VITE_SUPABASE_URL</code>
        {' '}and{' '}
        <code className="bg-surface-container-low px-1.5 py-0.5 rounded text-xs">VITE_SUPABASE_ANON_KEY</code>
        {' '}in your Vercel project settings.
      </p>
      <div className="text-xs text-secondary">After adding the keys, redeploy or refresh the page.</div>
    </div>
  </div>
);

const AuthenticatedApp: React.FC = () => {
  const { user, signOut } = useAuth();
  const [currentMode, setCurrentMode] = useState<AppMode>(AppMode.SUBJECT_SELECTION);
  const [theme, setTheme] = useState<Theme>(Theme.LIGHT);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [chapters, setChapters] = useState<Chapter[]>(PREFILLED_CHAPTERS);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [activeConceptId, setActiveConceptId] = useState<string | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [featureFlags, setFeatureFlags]         = useState<FeatureFlags>(DEFAULT_FLAGS);
  const [maintenanceMode, setMaintenanceMode]   = useState(false);
  const [maintenanceMsg,  setMaintenanceMsg]    = useState('');
  // DoubtSolver top-bar controls (lifted state)
  const [dsTokenUsed,  setDsTokenUsed]  = useState(0);
  const [dsTokenLimit, setDsTokenLimit] = useState(5000);
  const [dsClearFn,    setDsClearFn]    = useState<(() => void) | null>(null);
  const [rateLimits, setRateLimits]             = useState<RateLimits>({
    chatbot_daily_tokens: 5000, mindmap_calls_per_hour: 5,
    quiz_calls_per_hour: 10, flashcard_calls_per_hour: 10, explanation_calls_per_hour: 5,
  });
  const [notifGranted, setNotifGranted] = useState(isNotificationGranted);

  // Init SDK on mount — no permission needed
  useEffect(() => {
    initOneSignal();
    // Keep bell state in sync with actual OneSignal subscription
    onSubscriptionChange(setNotifGranted);
  }, []);

  // Login then auto-prompt if needed — login must happen before subscribe
  // so the subscription is created WITH the external_id from the start.
  useEffect(() => {
    if (!user) return;
    loginOneSignal(user.id).then(() => autoPromptIfNeeded());
  }, [user?.id]);

  const handleEnableNotifications = async () => {
    const granted = await requestOneSignalPermission();
    if (granted) setNotifGranted(true);  // direct update, don't wait for SDK event
  };

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      setIsLoadingData(true);
      const [data, userProfile, adminSettings] = await Promise.all([
        getUserData(user.id),
        getUserProfile(user.id),
        adminGetSettings(),
      ]);
      setFeatureFlags(adminSettings.feature_flags);
      setMaintenanceMode(adminSettings.maintenance_mode);
      setMaintenanceMsg(adminSettings.maintenance_message);
      if (adminSettings.rate_limits) setRateLimits(adminSettings.rate_limits);
      if (userProfile) {
        setProfile(userProfile);
        if (!userProfile.full_name || !userProfile.grade || !userProfile.client_id) setShowProfilePopup(true);
      } else {
        setShowProfilePopup(true);
      }
      if (data) {
        if (data.chapters && data.chapters.length > 0) {
          // Merge: keep saved chapter progress, add any new PREFILLED chapters not yet in user data
          const savedIds = new Set((data.chapters as Chapter[]).map(c => c.id));
          const newChapters = PREFILLED_CHAPTERS.filter(c => !savedIds.has(c.id));
          setChapters([...(data.chapters as Chapter[]), ...newChapters]);
        } else {
          setChapters(PREFILLED_CHAPTERS);
        }
        if (data.flashcards) setFlashcards(data.flashcards);
        if (data.settings?.theme) setTheme(data.settings.theme);
      } else {
        await saveUserData(user.id, { chapters: PREFILLED_CHAPTERS, flashcards: [], settings: { theme: Theme.LIGHT } });
      }
      setIsLoadingData(false);
    };
    loadData();
  }, [user]);

  useEffect(() => {
    if (!user || isLoadingData) return;
    const id = setTimeout(() => saveUserData(user.id, { chapters, flashcards, settings: { theme } }), 1000);
    return () => clearTimeout(id);
  }, [chapters, flashcards, theme, user, isLoadingData]);

  useEffect(() => {
    if (!user || !profile || showProfilePopup) return;
    const id = setTimeout(() => updateUserProfile(user.id, profile), 1000);
    return () => clearTimeout(id);
  }, [profile, user, showProfilePopup]);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('dark', 'reading');
    if (theme === Theme.DARK) html.classList.add('dark');
    if (theme === Theme.READING) html.classList.add('reading');
  }, [theme]);

  // Live-sync admin settings via Supabase Realtime
  useEffect(() => {
    const channel = supabase
      .channel('admin-settings-watch')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'admin_settings', filter: 'key=eq.app_settings' },
        (payload: any) => {
          const val = payload.new?.value;
          if (!val) return;
          if (val.feature_flags)    setFeatureFlags(val.feature_flags);
          if (val.maintenance_mode  !== undefined) setMaintenanceMode(val.maintenance_mode);
          if (val.maintenance_message !== undefined) setMaintenanceMsg(val.maintenance_message);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const activeChapter = chapters.find(c => c.id === activeChapterId) || null;
  const activeConcept = activeChapter && activeConceptId
    ? activeChapter.concepts.find(c => c.id === activeConceptId)
    : null;

  const handleStartLearning = (conceptId: string) => {
    setActiveConceptId(conceptId);
    setCurrentMode(AppMode.ACTIVE_RECALL);
    setIsSidebarOpen(false);
  };

  const handleAddFlashcard = (front: string, back: string) => {
    if (!activeChapter) return;
    const newCard: Flashcard = {
      id: `fc_${Date.now()}`, chapterId: activeChapter.id,
      front, back, mastery: 'GOOD', nextReviewDate: new Date(),
      conceptId: activeConceptId || 'manual',
    };
    setFlashcards(prev => [...prev, newCard]);
  };

  const handleRecallComplete = (success: boolean) => {
    if (success) {
      if (activeChapter && activeConcept) {
        setChapters(prev => prev.map(ch =>
          ch.id === activeChapter.id
            ? { ...ch, concepts: ch.concepts.map(c => c.id === activeConcept.id ? { ...c, status: 'MASTERED', masteryLevel: 100 } : c) }
            : ch
        ));
      }
      setCurrentMode(AppMode.DASHBOARD);
    } else {
      if (activeConcept && activeChapter) {
        const newCard: Flashcard = {
          id: Date.now().toString(), front: `Explain ${activeConcept.title}`,
          back: activeConcept.description, mastery: 'AGAIN',
          nextReviewDate: new Date(), conceptId: activeConcept.id, chapterId: activeChapter.id,
        };
        setFlashcards(prev => [...prev, newCard]);
      }
      setCurrentMode(AppMode.FLASHCARDS);
    }
  };

  const handleSelectChapter = (chapter: Chapter) => {
    setActiveChapterId(chapter.id);
    setCurrentMode(AppMode.DASHBOARD);
    setIsSidebarOpen(false);
  };

  const handleGoHome = () => {
    setActiveChapterId(null);
    setCurrentMode(AppMode.SUBJECT_SELECTION);
    setIsSidebarOpen(false);
  };

  const handleModeChange = (mode: AppMode) => {
    setCurrentMode(mode);
    setIsSidebarOpen(false);
  };

  const handleSaveProfilePopup = async (updatedProfile: Partial<UserProfile>) => {
    if (!user) return;
    await updateUserProfile(user.id, updatedProfile);
    setProfile({ ...profile, ...updatedProfile } as UserProfile);
    setShowProfilePopup(false);
  };

  const ContentSkeleton = () => (
    <div className="p-6 md:p-10 space-y-5 max-w-3xl mx-auto w-full">
      <div className="w-48 h-8 skeleton rounded-xl" />
      <div className="w-full h-4 skeleton" />
      <div className="w-3/4 h-4 skeleton" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 skeleton rounded-2xl" style={{ opacity: 1 - i * 0.12 }} />
        ))}
      </div>
    </div>
  );

  const FeatureRateLimited: React.FC<{ name: string; resetsIn?: string }> = ({ name }) => (
    <div className="flex flex-col items-center justify-center h-full py-24 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: 'rgba(245,158,11,0.12)' }}>
        <span className="material-symbols-outlined text-3xl" style={{ color: '#d97706', fontVariationSettings: "'FILL' 1" }}>timer_off</span>
      </div>
      <h3 className="font-headline text-2xl text-on-surface mb-2">Hourly Limit Reached</h3>
      <p className="text-secondary text-sm max-w-xs leading-relaxed">
        You've used your <strong>{name}</strong> limit for this hour. Come back in a little while!
      </p>
      <p className="text-xs text-outline mt-3">Limit resets every hour · Set by admin</p>
    </div>
  );

  const RateLimitGate: React.FC<{
    feature: string; limit: number; name: string; enabled: boolean; children: React.ReactNode;
  }> = ({ feature, limit, name, enabled, children }) => {
    const [status, setStatus] = React.useState<'allowed' | 'blocked'>('allowed');
    const checked = React.useRef(false);
    React.useEffect(() => {
      if (!enabled || limit <= 0 || checked.current || !user) { setStatus('allowed'); return; }
      checked.current = true;
      checkAndLogFeatureCall(user.id, feature, limit).then(ok => { if (!ok) setStatus('blocked'); });
    }, []);
    if (status === 'blocked') return <FeatureRateLimited name={name} />;
    return <>{children}</>;
  };

  const FeatureDisabled: React.FC<{ name: string }> = ({ name }) => (
    <div className="flex flex-col items-center justify-center h-full py-24 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center mb-5">
        <span className="material-symbols-outlined text-3xl text-outline">block</span>
      </div>
      <h3 className="font-headline text-2xl text-on-surface mb-2">{name} Disabled</h3>
      <p className="text-secondary text-sm max-w-xs">This feature has been temporarily disabled by an administrator.</p>
    </div>
  );

  // Mini circular progress for top bar
  const CircularProgressMini = ({ used, limit }: { used: number; limit: number }) => {
    const pct   = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
    const r     = 12;
    const circ  = 2 * Math.PI * r;
    const dash  = (pct / 100) * circ;
    const color = pct >= 90 ? '#ef4444' : pct >= 65 ? '#f59e0b' : '#3130c0';
    return (
      <div title={`${used.toLocaleString()} / ${limit.toLocaleString()} tokens today`}
        className="relative flex items-center justify-center shrink-0" style={{ width: 30, height: 30 }}>
        <svg width="30" height="30" viewBox="0 0 30 30" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
          <circle cx="15" cy="15" r={r} fill="none" stroke="rgba(199,196,216,0.4)" strokeWidth="2.5" />
          <circle cx="15" cy="15" r={r} fill="none" stroke={color} strokeWidth="2.5"
            strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
            style={{ transition: 'stroke-dasharray 0.5s ease' }} />
        </svg>
        <span style={{ fontSize: 8, fontWeight: 800, color, lineHeight: 1 }}>
          {pct >= 100 ? '!' : `${Math.round(pct)}%`}
        </span>
      </div>
    );
  };

  const renderContent = () => {
    if (isLoadingData) return <ContentSkeleton />;

    if (currentMode === AppMode.PROFILE)    return <Profile profile={profile} setProfile={setProfile} />;
    if (currentMode === AppMode.CONTACT)    return <ContactSupport profile={profile} />;
    if (currentMode === AppMode.COMMUNITY)  return featureFlags.community  ? <Community profile={profile} /> : <FeatureDisabled name="Community" />;
    if (currentMode === AppMode.LEADERBOARD) return featureFlags.leaderboard ? <Leaderboard /> : <FeatureDisabled name="Leaderboard" />;

    if (currentMode === AppMode.SUBJECT_SELECTION || !activeChapter) {
      return (
        <SubjectSelection
          chapters={chapters}
          onSelectChapter={handleSelectChapter}
        />
      );
    }

    switch (currentMode) {
      case AppMode.DASHBOARD:
        return <ChapterBreakdown chapter={activeChapter} onStartLearning={handleStartLearning} />;
      case AppMode.WHOLE_CHAPTER:
        if (!featureFlags.whole_chapter) return <FeatureDisabled name="AI Tutor" />;
        return (
          <RateLimitGate feature="whole_chapter" limit={rateLimits.explanation_calls_per_hour} name="Chapter AI" enabled>
            <WholeChapter chapter={activeChapter} />
          </RateLimitGate>
        );
      case AppMode.MIND_MAP:
        if (!featureFlags.mind_map) return <FeatureDisabled name="Mind Map" />;
        return (
          <RateLimitGate feature="mind_map" limit={rateLimits.mindmap_calls_per_hour} name="Mind Map" enabled>
            <MindMap chapter={activeChapter} />
          </RateLimitGate>
        );
      case AppMode.ACTIVE_RECALL:
        if (!featureFlags.active_recall) return <FeatureDisabled name="Active Recall" />;
        if (!activeConcept) return (
          <div className="flex flex-col items-center justify-center h-full py-20 px-6 text-center">
            <span className="material-symbols-outlined text-4xl text-outline mb-4">bolt</span>
            <p className="text-secondary mb-4">Select a concept from the breakdown to start.</p>
            <button onClick={() => setCurrentMode(AppMode.DASHBOARD)} className="text-primary font-semibold text-sm hover:underline">
              Go to Dashboard
            </button>
          </div>
        );
        return <ActiveRecall concept={activeConcept} onComplete={handleRecallComplete} />;
      case AppMode.FLASHCARDS: {
        if (!featureFlags.flashcards) return <FeatureDisabled name="Flashcards" />;
        const chapterCards = flashcards.filter(f => f.chapterId === activeChapter.id);
        return (
          <RateLimitGate feature="flashcards" limit={rateLimits.flashcard_calls_per_hour} name="Flashcards" enabled>
            <Flashcards cards={chapterCards} chapter={activeChapter} onAddCard={handleAddFlashcard} userId={user?.id} />
          </RateLimitGate>
        );
      }
      case AppMode.DOUBT_SOLVER:
        if (!featureFlags.doubt_solver) return <FeatureDisabled name="Doubt Solver" />;
        return (
          <DoubtSolver chapter={activeChapter} profile={profile}
            onStateChange={(used, limit, clearFn) => {
              setDsTokenUsed(used);
              setDsTokenLimit(limit);
              setDsClearFn(() => clearFn);
            }} />
        );
      case AppMode.REVISION:
        return featureFlags.revision ? <RevisionMode chapter={activeChapter} userId={user?.id} /> : <FeatureDisabled name="Revision Mode" />;
      case AppMode.QUIZ:
        if (!featureFlags.quiz) return <FeatureDisabled name="Quiz" />;
        return (
          <RateLimitGate feature="quiz" limit={rateLimits.quiz_calls_per_hour} name="Quiz" enabled>
            <Quiz chapter={activeChapter} onPointsEarned={(pts) => setProfile(p => p ? { ...p, total_points: (p.total_points ?? 0) + pts } : p)} />
          </RateLimitGate>
        );
      case AppMode.TIMELINE:
        return activeChapter.subject === 'Social Science'
          ? <Timeline chapter={activeChapter} />
          : <ChapterBreakdown chapter={activeChapter} onStartLearning={handleStartLearning} />;
      case AppMode.INDIA_MAP:
        return activeChapter.subject === 'Social Science'
          ? <IndiaMap chapter={activeChapter} />
          : <ChapterBreakdown chapter={activeChapter} onStartLearning={handleStartLearning} />;
      case AppMode.ADMIN:
        if (!profile?.is_admin) return <ChapterBreakdown chapter={activeChapter} onStartLearning={handleStartLearning} />;
        return <AdminDashboard />;
      default:
        return <ChapterBreakdown chapter={activeChapter} onStartLearning={handleStartLearning} />;
    }
  };

  const fullscreenModes = [AppMode.DOUBT_SOLVER, AppMode.MIND_MAP];
  const isFullscreen = fullscreenModes.includes(currentMode);

  // Show maintenance screen for non-admins
  if (maintenanceMode && !profile?.is_admin) {
    return (
      <div className="fixed inset-0 bg-surface flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-surface-container-high flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-[40px] text-outline" style={{ fontVariationSettings: "'FILL' 1" }}>construction</span>
        </div>
        <h1 className="font-headline text-3xl text-on-surface mb-3">Under Maintenance</h1>
        <p className="text-secondary text-sm max-w-xs leading-relaxed">
          {maintenanceMsg || 'CogniStruct is undergoing maintenance. Please check back shortly!'}
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-surface flex font-body text-on-surface transition-colors duration-300 overflow-hidden">
      {showProfilePopup && <ProfilePopup onSave={handleSaveProfilePopup} profile={profile} />}

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <PWAInstallBanner />


      <Sidebar
        currentMode={currentMode}
        setMode={handleModeChange}
        theme={theme}
        setTheme={setTheme}
        onGoHome={handleGoHome}
        activeChapterTitle={activeChapter?.title}
        activeChapterSubject={activeChapter?.subject}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSignOut={() => { logoutOneSignal(); signOut(); }}
        totalPoints={profile?.total_points ?? 0}
        isAdmin={profile?.is_admin === true}
        notifGranted={notifGranted}
        onEnableNotifications={handleEnableNotifications}
      />

      {/* Main content */}
      <main className="flex-1 md:ml-[240px] flex flex-col overflow-hidden relative">
        {/* Mobile top bar */}
        <header className="md:hidden fixed top-0 left-0 right-0 h-14 glass-white border-b border-outline-variant/20 z-30 flex items-center px-4 gap-3">
          <button onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-1 text-secondary hover:bg-surface-container-low rounded-full transition-colors shrink-0">
            <span className="material-symbols-outlined text-[22px]">menu</span>
          </button>

          {currentMode === AppMode.DOUBT_SOLVER ? (
            <>
              {/* DoubtSolver mode: show chapter info + progress + new chat */}
              <div className="flex-1 min-w-0">
                <p className="font-serif text-sm font-semibold text-on-surface leading-tight truncate">AI Tutor</p>
                <p className="text-[10px] text-secondary truncate">{activeChapter?.subject} · {activeChapter?.title}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <CircularProgressMini used={dsTokenUsed} limit={dsTokenLimit} />
                <button onClick={() => dsClearFn?.()}
                  title="New chat"
                  className="p-1.5 text-secondary hover:bg-surface-container-high rounded-full transition-colors">
                  <span className="material-symbols-outlined text-[20px]">add_comment</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <span className="flex-1 text-center font-serif italic text-primary text-lg">CogniStruct</span>
              {(profile?.total_points ?? 0) > 0 ? (
                <button onClick={() => handleModeChange(AppMode.LEADERBOARD)}
                  className="flex items-center gap-1 bg-primary-fixed text-primary px-2.5 py-1 rounded-full text-xs font-bold shrink-0">
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                  {(profile?.total_points ?? 0).toLocaleString()}
                </button>
              ) : (
                <div className="w-8 shrink-0" />
              )}
            </>
          )}
        </header>

        {/* Spacer for mobile header */}
        <div className="md:hidden h-14 shrink-0" />

        {/* Content area */}
        <div className={`flex-1 min-h-0 flex flex-col ${
          isFullscreen ? 'overflow-hidden' : 'overflow-y-auto'
        }`}>
          <div className={
            isFullscreen
              ? 'flex-1 min-h-0 flex flex-col'
              : 'p-4 md:p-8 max-w-7xl mx-auto w-full'
          }>
            <Suspense fallback={<ContentSkeleton />}>
              {renderContent()}
            </Suspense>
          </div>
        </div>


      </main>
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

const ResetPasswordForm: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 6)  { setError('Password must be at least 6 characters.'); return; }
    setLoading(true); setError('');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setError(error.message); setLoading(false); return; }
    await supabase.auth.signOut();
    setDone(true); setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 primary-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
            <span className="material-symbols-outlined text-white text-[28px]">lock_reset</span>
          </div>
          <h2 className="font-headline text-3xl text-on-surface mb-1">{done ? 'Password updated!' : 'Set new password'}</h2>
          <p className="text-secondary text-sm">{done ? 'You can now sign in with your new password.' : 'Choose a strong password for your account.'}</p>
        </div>
        {done ? (
          <button
            onClick={() => window.location.replace('/')}
            className="w-full py-4 primary-gradient text-on-primary font-bold rounded-[10px] shadow-glow"
          >
            Go to Sign In
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 bg-error-container rounded-xl flex items-start gap-3 text-sm text-on-error-container">
                <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
                <p>{error}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-1.5 ml-1">New Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline text-[20px] group-focus-within:text-primary transition-colors">lock</span>
                </div>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  required minLength={6} placeholder="Min. 6 characters"
                  className="block w-full pl-12 pr-4 py-3.5 bg-surface-container-lowest rounded-[10px] text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  style={{ border: '1px solid rgba(199,196,216,0.3)' }}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-on-surface-variant mb-1.5 ml-1">Confirm Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline text-[20px] group-focus-within:text-primary transition-colors">lock_check</span>
                </div>
                <input
                  type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  required minLength={6} placeholder="Repeat password"
                  className="block w-full pl-12 pr-4 py-3.5 bg-surface-container-lowest rounded-[10px] text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  style={{ border: '1px solid rgba(199,196,216,0.3)' }}
                />
              </div>
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full py-4 primary-gradient text-on-primary font-bold rounded-[10px] shadow-glow hover:shadow-glow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading
                ? <><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span> Updating…</>
                : <>Update Password <span className="material-symbols-outlined text-[18px]">arrow_forward</span></>
              }
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMsg,  setMaintenanceMsg]  = useState('');
  const [isBanned,        setIsBanned]        = useState(false);
  const [banReason,       setBanReason]        = useState('');
  const [isRecovery,      setIsRecovery]       = useState(false);

  // Detect PASSWORD_RECOVERY event from reset email link
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setIsRecovery(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load admin settings + poll every 30s (fallback if Realtime not enabled)
  useEffect(() => {
    const load = () =>
      adminGetSettings().then(s => {
        setMaintenanceMode(s.maintenance_mode);
        setMaintenanceMsg(s.maintenance_message);
      }).catch(() => {});
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Realtime updates
  useEffect(() => {
    const ch = supabase
      .channel('app-content-settings')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'admin_settings', filter: 'key=eq.app_settings' },
        (payload: any) => {
          const v = payload.new?.value;
          if (!v) return;
          if (v.maintenance_mode  !== undefined) setMaintenanceMode(v.maintenance_mode);
          if (v.maintenance_message !== undefined) setMaintenanceMsg(v.maintenance_message);
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Check banned status on login + poll every 30s
  // Note: we do NOT clear isBanned when user logs out — the banned screen
  // must stay visible until the user explicitly dismisses it.
  useEffect(() => {
    if (!user) return;
    const check = async () => {
      try {
        const { data } = await supabase.from('profiles').select('is_banned, ban_reason').eq('id', user.id).maybeSingle();
        if (data?.is_banned) {
          setIsBanned(true);
          setBanReason(data.ban_reason || '');
          supabase.auth.signOut();
        }
      } catch { /* ignore */ }
    };
    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, [user]);

  if (!isSupabaseConfigured) return <ConfigError />;

  if (isRecovery) return <ResetPasswordForm />;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-surface p-6">
        <div className="w-16 h-16 skeleton rounded-2xl" />
        <div className="space-y-2 w-48">
          <div className="h-4 skeleton w-full" />
          <div className="h-3 skeleton w-3/4 mx-auto" />
        </div>
      </div>
    );
  }

  // Maintenance mode — block everyone except admins
  // We check here so it blocks even the login page
  if (maintenanceMode) {
    // If logged in we'll let AuthenticatedApp handle the admin bypass
    if (!user) return (
      <div className="fixed inset-0 bg-surface flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-surface-container-high flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-[40px] text-outline" style={{ fontVariationSettings: "'FILL' 1" }}>construction</span>
        </div>
        <h1 className="font-headline text-3xl text-on-surface mb-3">Under Maintenance</h1>
        <p className="text-secondary text-sm max-w-xs leading-relaxed">
          {maintenanceMsg || 'CogniStruct is undergoing maintenance. Please check back shortly!'}
        </p>
      </div>
    );
  }

  // Banned user — stays visible even after signOut completes
  if (isBanned) return (
    <div className="fixed inset-0 bg-surface flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-error-container/40 flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-[40px] text-error" style={{ fontVariationSettings: "'FILL' 1" }}>block</span>
      </div>
      <h1 className="font-headline text-3xl text-on-surface mb-3">Account Banned</h1>
      <p className="text-secondary text-sm max-w-xs leading-relaxed mb-6">
        {banReason ? `Reason: ${banReason}` : 'Your account has been suspended. Contact support.'}
      </p>
      <button
        onClick={() => { setIsBanned(false); setBanReason(''); }}
        className="px-6 py-2.5 bg-surface-container rounded-xl text-sm font-semibold text-secondary hover:bg-surface-container-high transition-colors"
      >
        Back to Sign In
      </button>
    </div>
  );

  if (!user) return <Auth />;
  return <AuthenticatedApp />;
};

export default App;
