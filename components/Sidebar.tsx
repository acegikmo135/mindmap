import React from 'react';
import { AppMode, Theme } from '../types';
import { 
  LayoutDashboard, Network, BrainCircuit, Library, MessageCircleQuestion, 
  RotateCcw, BarChart3, Sun, Moon, Book, ChevronLeft, BookOpenText, X, LogOut, User, Users
} from 'lucide-react';

interface SidebarProps {
  currentMode: AppMode;
  setMode: (mode: AppMode) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  onGoHome: () => void;
  activeChapterTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  onSignOut?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentMode, setMode, theme, setTheme, onGoHome, activeChapterTitle, isOpen, onClose, onSignOut 
}) => {
  const menuItems = [
    { mode: AppMode.DASHBOARD, icon: LayoutDashboard, label: 'Breakdown' },
    { mode: AppMode.WHOLE_CHAPTER, icon: BookOpenText, label: 'Understand Chapter' },
    { mode: AppMode.MIND_MAP, icon: Network, label: 'Mind Map' },
    { mode: AppMode.ACTIVE_RECALL, icon: BrainCircuit, label: 'Active Recall' },
    { mode: AppMode.FLASHCARDS, icon: Library, label: 'Flashcards' },
    { mode: AppMode.DOUBT_SOLVER, icon: MessageCircleQuestion, label: 'Doubt Solver' },
    { mode: AppMode.REVISION, icon: RotateCcw, label: 'Revision Mode' },
  ];

  return (
    <>
    <aside 
      className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 
        flex flex-col transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0
      `}
    >
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onGoHome}>
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-serif font-bold text-lg">C</span>
          </div>
          <span className="font-serif font-bold text-slate-800 dark:text-white text-lg tracking-tight">CogniStruct</span>
        </div>
        <button onClick={onClose} className="md:hidden text-slate-500 hover:text-slate-800 dark:hover:text-white">
          <X className="w-6 h-6" />
        </button>
      </div>

      {(activeChapterTitle || currentMode === AppMode.PROFILE || currentMode === AppMode.COMMUNITY) && (
        <div className="px-6 pt-4 pb-0">
           <button 
             onClick={onGoHome}
             className="w-full flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800"
           >
             <ChevronLeft className="w-3 h-3" />
             Back to Subjects
           </button>
        </div>
      )}

      <div className="px-6 py-4">
         <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button 
              onClick={() => setTheme(Theme.LIGHT)}
              className={`flex-1 p-1.5 rounded flex justify-center ${theme === Theme.LIGHT ? 'bg-white shadow text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
              title="Light Mode"
            >
               <Sun className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setTheme(Theme.DARK)}
              className={`flex-1 p-1.5 rounded flex justify-center ${theme === Theme.DARK ? 'bg-slate-700 shadow text-white' : 'text-slate-400 hover:text-slate-600'}`}
               title="Dark Mode"
            >
               <Moon className="w-4 h-4" />
            </button>
             <button 
              onClick={() => setTheme(Theme.READING)}
              className={`flex-1 p-1.5 rounded flex justify-center ${theme === Theme.READING ? 'bg-[#f0e6d2] shadow text-[#5c4b37]' : 'text-slate-400 hover:text-slate-600'}`}
               title="Reading Mode"
            >
               <Book className="w-4 h-4" />
            </button>
         </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 space-y-1 px-4 flex flex-col">
        {activeChapterTitle ? (
            <>
                <div className="px-3 mb-2">
                     <p className="text-xs font-bold text-primary-600 dark:text-primary-400 truncate">{activeChapterTitle}</p>
                </div>
                {menuItems.map((item) => (
                <button
                    key={item.mode}
                    onClick={() => setMode(item.mode)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group
                    ${currentMode === item.mode
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-900 dark:text-primary-100 shadow-sm ring-1 ring-primary-100 dark:ring-primary-800'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                    <item.icon className={`w-5 h-5 ${currentMode === item.mode ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                    <span className="font-medium text-sm">{item.label}</span>
                </button>
                ))}

                <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                <button
                    onClick={() => setMode(AppMode.ADMIN)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group
                    ${currentMode === AppMode.ADMIN
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                        : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                    <BarChart3 className="w-5 h-5" />
                    <span className="font-medium text-sm">Teacher View</span>
                </button>
                </div>
            </>
        ) : (
             <div className="px-4 text-center text-slate-400 dark:text-slate-500 mt-10">
                <Book className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Select a subject</p>
             </div>
        )}
        
        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <button
            onClick={onGoHome}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group
            ${currentMode === AppMode.SUBJECT_SELECTION
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpenText className="w-5 h-5" />
            <span className="font-medium text-sm">Select Subject</span>
          </button>

          <button
            onClick={() => setMode(AppMode.COMMUNITY)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group
            ${currentMode === AppMode.COMMUNITY
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="font-medium text-sm">Classmates</span>
          </button>

          <button
            onClick={() => setMode(AppMode.PROFILE)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group
            ${currentMode === AppMode.PROFILE
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="font-medium text-sm">Profile</span>
          </button>
          
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        </div>
      </nav>
    </aside>
    </>
  );
};

export default Sidebar;