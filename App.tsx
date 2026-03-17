import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChapterBreakdown from './components/ChapterBreakdown';
import MindMap from './components/MindMap';
import ActiveRecall from './components/ActiveRecall';
import Flashcards from './components/Flashcards';
import DoubtSolver from './components/DoubtSolver';
import RevisionMode from './components/RevisionMode';
import AdminDashboard from './components/AdminDashboard';
import SubjectSelection from './components/SubjectSelection';
import WholeChapter from './components/WholeChapter';
import Auth from './components/Auth';
import Profile from './components/Profile';
import Community from './components/Community';
import ProfilePopup from './components/ProfilePopup';
import { AppMode, Theme, Chapter, Flashcard, UserProfile } from './types';
import { PREFILLED_CHAPTERS } from './constants';
import { Menu, Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { getUserData, saveUserData, getUserProfile, updateUserProfile } from './services/db';
import { initOneSignal, setOneSignalExternalId } from './services/notifications';
import { isSupabaseConfigured } from './lib/supabase';
import { isGeminiConfigured } from './services/geminiService';
import { AlertTriangle } from 'lucide-react';

const ConfigError: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
    <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border border-amber-200 dark:border-amber-900/50 text-center">
      <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
        <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-500" />
      </div>
      <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-white mb-4">Configuration Required</h2>
      <p className="text-slate-600 dark:text-slate-400 mb-6">
        It looks like some environment variables are missing. Please ensure you have set up your <strong>Supabase</strong> and <strong>Gemini API</strong> keys in the settings.
      </p>
      <div className="space-y-3 text-left bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg text-sm">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-slate-700 dark:text-slate-300">Supabase Configuration</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isGeminiConfigured ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-slate-700 dark:text-slate-300">Gemini API Configuration</span>
        </div>
      </div>
      <p className="mt-6 text-xs text-slate-400">
        After adding the keys, you may need to refresh the page.
      </p>
    </div>
  </div>
);

const AuthenticatedApp: React.FC = () => {
  const { user, signOut } = useAuth();
  const [currentMode, setCurrentMode] = useState<AppMode>(AppMode.SUBJECT_SELECTION);
  const [theme, setTheme] = useState<Theme>(Theme.LIGHT);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Data State
  const [chapters, setChapters] = useState<Chapter[]>(PREFILLED_CHAPTERS);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [activeConceptId, setActiveConceptId] = useState<string | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showProfilePopup, setShowProfilePopup] = useState(false);

  // Load initial data
  useEffect(() => {
    if (!user) return;

    // Initialize OneSignal
    initOneSignal();
    setOneSignalExternalId(user.id);

    const loadData = async () => {
      setIsLoadingData(true);
      const data = await getUserData(user.id);
      const userProfile = await getUserProfile(user.id);
      
      if (userProfile) {
        setProfile(userProfile);
        if (!userProfile.full_name || !userProfile.grade) {
          setShowProfilePopup(true);
        }
      } else {
        setShowProfilePopup(true);
      }

      if (data) {
        if (data.chapters && data.chapters.length > 0) {
           setChapters(data.chapters);
        }
        if (data.flashcards) setFlashcards(data.flashcards);
        if (data.settings) {
           if (data.settings.theme) setTheme(data.settings.theme);
        }
      } else {
        await saveUserData(user.id, {
          chapters: PREFILLED_CHAPTERS,
          flashcards: [],
          settings: { theme: Theme.LIGHT }
        });
      }
      setIsLoadingData(false);
    };

    loadData();
  }, [user]);

  // Save data on changes
  useEffect(() => {
    if (!user || isLoadingData) return;
    
    const timeoutId = setTimeout(() => {
      saveUserData(user.id, {
        chapters,
        flashcards,
        settings: { theme }
      });
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [chapters, flashcards, theme, user, isLoadingData]);

  // Auto-save profile
  useEffect(() => {
    if (!user || !profile || showProfilePopup) return;
    const timeoutId = setTimeout(() => {
      updateUserProfile(user.id, profile);
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [profile, user, showProfilePopup]);

  // Apply Theme to HTML body
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('dark', 'reading');
    if (theme === Theme.DARK) html.classList.add('dark');
    if (theme === Theme.READING) html.classList.add('reading');
  }, [theme]);

  // Helpers
  const activeChapter = chapters.find(c => c.id === activeChapterId) || null;
  const activeConcept = activeChapter && activeConceptId 
    ? activeChapter.concepts.find(c => c.id === activeConceptId) 
    : null;

  const handleStartLearning = (conceptId: string) => {
    setActiveConceptId(conceptId);
    setCurrentMode(AppMode.ACTIVE_RECALL);
    setIsSidebarOpen(false);
  };

  const handleRecallComplete = (success: boolean) => {
    if (success) {
      if (activeChapter && activeConcept) {
          setChapters(prev => prev.map(ch => {
              if (ch.id === activeChapter.id) {
                  return {
                      ...ch,
                      concepts: ch.concepts.map(c => {
                          if (c.id === activeConcept.id) {
                              return { ...c, status: 'MASTERED', masteryLevel: 100 };
                          }
                          return c;
                      })
                  };
              }
              return ch;
          }));
      }
      setCurrentMode(AppMode.DASHBOARD);
    } else {
        if (activeConcept && activeChapter) {
             const newCard: Flashcard = {
                 id: Date.now().toString(),
                 front: `Explain ${activeConcept.title}`,
                 back: activeConcept.description,
                 mastery: 'AGAIN',
                 nextReviewDate: new Date(),
                 conceptId: activeConcept.id,
                 chapterId: activeChapter.id
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

  const handleCreateChapter = (chapter: Chapter) => {
      setChapters(prev => [...prev, chapter]);
      setActiveChapterId(chapter.id);
      setCurrentMode(AppMode.DASHBOARD);
  };

  const handleGoHome = () => {
      setActiveChapterId(null);
      setCurrentMode(AppMode.SUBJECT_SELECTION);
      setIsSidebarOpen(false);
  };

  const handleModeChange = (mode: AppMode) => {
    setCurrentMode(mode);
    setIsSidebarOpen(false);
  }

  const handleSaveProfilePopup = async (updatedProfile: Partial<UserProfile>) => {
    if (!user) return;
    await updateUserProfile(user.id, updatedProfile);
    setProfile({ ...profile, ...updatedProfile } as UserProfile);
    setShowProfilePopup(false);
  };

  const renderContent = () => {
    if (isLoadingData) {
      return (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      );
    }

    if (currentMode === AppMode.PROFILE) {
      return <Profile profile={profile} setProfile={setProfile} />;
    }

    if (currentMode === AppMode.COMMUNITY) {
      return <Community profile={profile} />;
    }

    if (currentMode === AppMode.SUBJECT_SELECTION || !activeChapter) {
        return (
            <SubjectSelection 
                chapters={chapters} 
                onSelectChapter={handleSelectChapter} 
                onChapterCreated={handleCreateChapter} 
            />
        );
    }

    switch (currentMode) {
      case AppMode.DASHBOARD:
        return <ChapterBreakdown chapter={activeChapter} onStartLearning={handleStartLearning} />;
      case AppMode.WHOLE_CHAPTER:
        return <WholeChapter chapter={activeChapter} />;
      case AppMode.MIND_MAP:
        return <MindMap chapter={activeChapter} />;
      case AppMode.ACTIVE_RECALL:
        if (!activeConcept) {
             return (
                 <div className="text-center py-20 px-4">
                     <p className="text-slate-500 dark:text-slate-400 mb-4">Select a concept from the breakdown to start learning.</p>
                     <button onClick={() => setCurrentMode(AppMode.DASHBOARD)} className="text-primary-600 font-bold hover:underline">Go to Dashboard</button>
                 </div>
             )
        }
        return <ActiveRecall concept={activeConcept} onComplete={handleRecallComplete} />;
      case AppMode.FLASHCARDS:
        const chapterCards = flashcards.filter(f => f.chapterId === activeChapter.id);
        return <Flashcards cards={chapterCards} />;
      case AppMode.DOUBT_SOLVER:
        return <DoubtSolver chapterId={activeChapter.id} />;
      case AppMode.REVISION:
        return <RevisionMode chapter={activeChapter} />;
      case AppMode.ADMIN:
        return <AdminDashboard />;
      default:
        return <ChapterBreakdown chapter={activeChapter} onStartLearning={handleStartLearning} />;
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300 overflow-x-hidden">
      {showProfilePopup && <ProfilePopup onSave={handleSaveProfilePopup} />}
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-30 flex items-center px-4 justify-between">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>
        <span className="font-serif font-bold text-lg text-slate-800 dark:text-white truncate max-w-[200px]">
           {activeChapter ? activeChapter.title : 'CogniStruct'}
        </span>
        <div className="w-8" />
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar 
        currentMode={currentMode} 
        setMode={handleModeChange} 
        theme={theme}
        setTheme={setTheme}
        onGoHome={handleGoHome}
        activeChapterTitle={activeChapter?.title}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSignOut={signOut}
      />
      
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 min-h-[100dvh]">
        <div className="h-full overflow-y-auto p-4 md:p-8 scroll-smooth">
           <div className="max-w-7xl mx-auto">
               {renderContent()}
           </div>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (!isSupabaseConfigured) {
    return <ConfigError />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return <AuthenticatedApp />;
};

export default App;