import React from 'react';
import { Chapter } from '../types';
import { Play, CheckCircle2, Circle } from 'lucide-react';

interface ChapterBreakdownProps {
  chapter: Chapter;
  onStartLearning: (conceptId: string) => void;
}

const ChapterBreakdown: React.FC<ChapterBreakdownProps> = ({ chapter, onStartLearning }) => {
  const totalConcepts = chapter.concepts.length;
  const masteredConcepts = chapter.concepts.filter(c => c.status === 'MASTERED').length;
  const progress = totalConcepts > 0 ? Math.round((masteredConcepts / totalConcepts) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      <header className="space-y-4 mb-6 md:mb-10">
        <div className="flex items-center gap-2 text-sm font-medium text-primary-600 dark:text-primary-400 uppercase tracking-wider">
          {chapter.subject}
        </div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-academic-heading dark:text-white break-words">{chapter.title}</h1>
        
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-500 dark:text-slate-400 text-sm">
          <span className="whitespace-nowrap">{totalConcepts} Concepts</span>
          <span className="hidden sm:inline">•</span>
          <span className="whitespace-nowrap">Est. 2-3 Hours</span>
          <span className="hidden sm:inline">•</span>
          <span className={`whitespace-nowrap font-medium ${progress > 75 ? 'text-green-600 dark:text-green-400' : 'text-primary-600 dark:text-primary-400'}`}>{progress}% Complete</span>
        </div>
        
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-4">
          <div 
            className="bg-primary-500 h-full rounded-full transition-all duration-1000 ease-out" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <div className="grid gap-4">
        {chapter.concepts.map((concept, index) => (
          <div 
            key={concept.id}
            onClick={() => onStartLearning(concept.id)}
            className="group relative p-4 md:p-6 rounded-xl border transition-all duration-200 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-700 hover:shadow-md cursor-pointer"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="mt-1 shrink-0">
                  {concept.status === 'MASTERED' ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : (
                    <Circle className={`w-6 h-6 ${concept.status === 'IN_PROGRESS' ? 'text-primary-500 fill-primary-50 dark:fill-primary-900/20' : 'text-slate-300 dark:text-slate-600'}`} />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {index + 1}. {concept.title}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 leading-relaxed max-w-2xl break-words">
                    {concept.description}
                  </p>
                  {concept.dependencyNote && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                      {concept.dependencyNote}
                    </div>
                  )}
                </div>
              </div>

              <button
                className="mt-2 sm:mt-0 shrink-0 w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-lg text-sm font-medium transition-colors group-hover:bg-primary-600 group-hover:text-white"
              >
                <Play className="w-4 h-4" />
                Start
              </button>
            </div>
            
            {/* Connector Line Logic (Visual only for list items) - hidden on mobile to reduce clutter or needs alignment adjustment. Keeping hidden on very small screens if needed, but styling seems safe. */}
             {index < chapter.concepts.length - 1 && (
               <div className="hidden md:block absolute left-[35px] bottom-0 top-[60px] w-px bg-slate-100 dark:bg-slate-800 -z-10 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors" />
             )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChapterBreakdown;