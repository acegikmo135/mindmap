import React, { useState, useEffect } from 'react';
import { AppMode, Theme } from '../types';

const TUTOR_API = (import.meta as any).env?.VITE_TUTOR_API_URL ?? 'http://localhost:8000';

function useBackendStatus() {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  useEffect(() => {
    let dead = false;
    const check = async () => {
      try {
        const r = await fetch(`${TUTOR_API}/health`, { signal: AbortSignal.timeout(4000) });
        if (!dead) setStatus(r.ok ? 'online' : 'offline');
      } catch {
        if (!dead) setStatus('offline');
      }
    };
    check();
    const id = setInterval(check, 30_000);
    return () => { dead = true; clearInterval(id); };
  }, []);
  return status;
}

interface SidebarProps {
  currentMode: AppMode;
  setMode: (mode: AppMode) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  onGoHome: () => void;
  activeChapterTitle?: string;
  activeChapterSubject?: string;
  isOpen: boolean;
  onClose: () => void;
  onSignOut?: () => void;
  totalPoints?: number;
  isAdmin?: boolean;
  notifGranted?: boolean;
  onEnableNotifications?: () => void;
}

const NAV_ITEMS = [
  { mode: AppMode.SUBJECT_SELECTION, icon: 'library_books',     label: 'Subjects',        global: true },
  { mode: AppMode.LEADERBOARD,       icon: 'emoji_events',       label: 'Leaderboard',     global: true },
  { mode: AppMode.COMMUNITY,         icon: 'groups',             label: 'Community',       global: true },
  { mode: AppMode.PROFILE,           icon: 'person',             label: 'Profile',         global: true },
  { mode: AppMode.CONTACT,           icon: 'support_agent',      label: 'Support',         global: true },
];

const CHAPTER_ITEMS = [
  { mode: AppMode.DASHBOARD,     icon: 'analytics',       label: 'Breakdown'         },
  { mode: AppMode.WHOLE_CHAPTER, icon: 'psychology',      label: 'Understand'        },
  { mode: AppMode.MIND_MAP,      icon: 'hub',             label: 'Mind Map'          },
  { mode: AppMode.ACTIVE_RECALL, icon: 'bolt',            label: 'Active Recall'     },
  { mode: AppMode.FLASHCARDS,    icon: 'style',           label: 'Flashcards'        },
  { mode: AppMode.DOUBT_SOLVER,  icon: 'forum',           label: 'Doubt Solver'      },
  { mode: AppMode.REVISION,      icon: 'replay',          label: 'Revision'          },
  { mode: AppMode.QUIZ,          icon: 'quiz',            label: 'Quiz'              },
];

const NavItem: React.FC<{
  icon: string; label: string; active: boolean; onClick: () => void;
}> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 mx-0 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
      active
        ? 'bg-primary-fixed text-primary'
        : 'text-secondary hover:bg-surface-container hover:text-on-surface'
    }`}
  >
    <span
      className="material-symbols-outlined text-[20px]"
      style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
    >
      {icon}
    </span>
    <span className="tracking-tight">{label}</span>
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({
  currentMode, setMode, theme, setTheme,
  onGoHome, activeChapterTitle, activeChapterSubject, isOpen, onClose,
  onSignOut, totalPoints, isAdmin, notifGranted, onEnableNotifications,
}) => {
  const backendStatus = useBackendStatus();
  const isSS = activeChapterSubject === 'Social Science';
  const pts = totalPoints ?? 0;
  const xpPct = Math.min(100, (pts % 1000) / 10);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-[240px] flex flex-col
          bg-surface
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
        style={{ boxShadow: 'none', borderRight: '1px solid rgba(199,196,216,0.18)' }}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 pt-7 pb-5">
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => { onGoHome(); onClose(); }}
          >
            <div className="w-9 h-9 rounded-xl primary-gradient flex items-center justify-center shrink-0 shadow-glow">
              <span className="material-symbols-outlined text-white text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
            </div>
            <div>
              <h1 className="font-serif italic text-lg text-primary leading-none">CogniStruct</h1>
              <p className="text-[9px] font-bold uppercase tracking-widest text-secondary mt-0.5">Academic Luminary</p>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden text-secondary hover:text-on-surface p-1">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Active chapter label */}
        {activeChapterTitle && (
          <div className="px-5 pb-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-primary-fixed rounded-xl">
              <span className="material-symbols-outlined text-primary text-[14px]">menu_book</span>
              <p className="text-xs font-semibold text-primary truncate">{activeChapterTitle}</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
          {/* Chapter tools */}
          {activeChapterTitle && (
            <>
              <p className="px-4 pt-2 pb-1.5 text-[10px] font-bold text-secondary uppercase tracking-widest">Chapter Tools</p>
              {CHAPTER_ITEMS.map(item => (
                <NavItem
                  key={item.mode}
                  icon={item.icon}
                  label={item.label}
                  active={currentMode === item.mode}
                  onClick={() => { setMode(item.mode); onClose(); }}
                />
              ))}
              {/* Timeline — exclusive to Social Science chapters */}
              {isSS && (
                <NavItem
                  icon="timeline"
                  label="Timeline"
                  active={currentMode === AppMode.TIMELINE}
                  onClick={() => { setMode(AppMode.TIMELINE); onClose(); }}
                />
              )}
              {isSS && (
                <NavItem
                  icon="map"
                  label="India Map"
                  active={currentMode === AppMode.INDIA_MAP}
                  onClick={() => { setMode(AppMode.INDIA_MAP); onClose(); }}
                />
              )}
              {isAdmin && (
                <NavItem
                  icon="admin_panel_settings"
                  label="Admin Dashboard"
                  active={currentMode === AppMode.ADMIN}
                  onClick={() => { setMode(AppMode.ADMIN); onClose(); }}
                />
              )}
              <div className="my-2 mx-4 border-t border-outline-variant/20" />
            </>
          )}

          {/* Global nav */}
          <p className="px-4 pt-1 pb-1.5 text-[10px] font-bold text-secondary uppercase tracking-widest">Navigation</p>
          {NAV_ITEMS.map(item => (
            <NavItem
              key={item.mode}
              icon={item.icon}
              label={item.label}
              active={currentMode === item.mode || (item.mode === AppMode.SUBJECT_SELECTION && !activeChapterTitle && currentMode === AppMode.SUBJECT_SELECTION)}
              onClick={() => {
                if (item.mode === AppMode.SUBJECT_SELECTION) onGoHome();
                else setMode(item.mode);
                onClose();
              }}
            />
          ))}
        </nav>

        {/* Bottom section */}
        <div className="px-4 pb-5 space-y-3">
          {/* XP glassmorphic card */}
          {pts > 0 && (
            <div className="glass-panel p-3.5 rounded-xl border border-outline-variant/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-primary font-bold text-xs">
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                  {pts.toLocaleString()} XP
                </div>
                <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                  Lv {Math.floor(pts / 1000) + 1}
                </span>
              </div>
              <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                <div
                  className="primary-gradient h-full rounded-full transition-all duration-700"
                  style={{ width: `${xpPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Theme switcher */}
          <div className="flex p-1 bg-surface-container-low rounded-xl">
            {[
              { t: Theme.LIGHT,   icon: 'light_mode',   title: 'Light' },
              { t: Theme.DARK,    icon: 'dark_mode',    title: 'Dark'  },
              { t: Theme.READING, icon: 'auto_stories', title: 'Sepia' },
            ].map(({ t, icon, title }) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                title={title}
                className={`flex-1 p-1.5 rounded-lg flex justify-center transition-all ${
                  theme === t
                    ? t === Theme.DARK
                      ? 'bg-surface-container-high text-on-surface shadow-sm'
                      : t === Theme.READING
                      ? 'bg-[#f0e6d2] text-[#5c4b37] shadow-sm'
                      : 'bg-surface-container-lowest text-on-surface shadow-sm'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{icon}</span>
              </button>
            ))}
          </div>


          {/* Show only when not subscribed */}
          {!notifGranted && onEnableNotifications && (
            <button
              onClick={onEnableNotifications}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-full text-sm font-semibold text-primary hover:bg-primary-fixed transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">notifications</span>
              Enable Notifications
            </button>
          )}

          {/* Backend status indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5">
            <span className={`w-2 h-2 rounded-full shrink-0 ${
              backendStatus === 'online'   ? 'bg-emerald-500' :
              backendStatus === 'offline'  ? 'bg-red-400' : 'bg-yellow-400 animate-pulse'
            }`} />
            <span className="text-[11px] text-secondary">
              AI Tutor: {backendStatus === 'online' ? 'Connected' : backendStatus === 'offline' ? 'Offline' : 'Connecting…'}
            </span>
          </div>

          {/* Sign out */}
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-full text-sm font-semibold text-secondary hover:text-error hover:bg-error-container/30 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
