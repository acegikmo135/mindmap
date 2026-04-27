import React from 'react';
import { Chapter } from '../types';

interface ChapterBreakdownProps {
  chapter: Chapter;
  onStartLearning: (conceptId: string) => void;
}

const statusMeta = (status: string) => {
  if (status === 'MASTERED')    return { icon: 'check_circle', cls: 'text-emerald-500', bg: 'bg-emerald-50',         label: 'Mastered',    pill: 'bg-emerald-100 text-emerald-700' };
  if (status === 'IN_PROGRESS') return { icon: 'pending',      cls: 'text-primary',     bg: 'bg-primary-fixed',      label: 'In Progress', pill: 'bg-primary-fixed text-primary'   };
  return                               { icon: 'circle',       cls: 'text-outline',     bg: 'bg-surface-container',  label: 'Not started', pill: 'bg-surface-container text-secondary' };
};

const ChapterBreakdown: React.FC<ChapterBreakdownProps> = ({ chapter, onStartLearning }) => {
  const total    = chapter.concepts.length;
  const mastered = chapter.concepts.filter(c => c.status === 'MASTERED').length;
  const progress = total > 0 ? Math.round((mastered / total) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-400 pb-8">

      {/* ── Header ── */}
      <header className="mb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-primary">{chapter.subject}</span>
        <h1 className="font-headline text-3xl md:text-5xl text-on-surface leading-tight mt-1 mb-3">
          {chapter.title}
        </h1>

        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-secondary bg-surface-container px-2.5 py-1 rounded-full">
            {total} Concepts
          </span>
          <span className="text-xs font-semibold text-secondary bg-surface-container px-2.5 py-1 rounded-full">
            Est. 2–3 hrs
          </span>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            progress > 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-primary-fixed text-primary'
          }`}>
            {progress}% done
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
          <div
            className="primary-gradient h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* ── Concept list ── */}
      <div className="space-y-2.5">
        {chapter.concepts.map((concept, index) => {
          const meta = statusMeta(concept.status);
          return (
            <div
              key={concept.id}
              onClick={() => onStartLearning(concept.id)}
              className="bg-surface-container-lowest rounded-2xl cursor-pointer active:scale-[0.99] hover:-translate-y-0.5 transition-all duration-200 shadow-card overflow-hidden"
            >
              <div className="flex items-stretch">

                {/* Left status stripe */}
                <div className={`w-1 shrink-0 ${meta.bg}`} style={{ minHeight: 64 }} />

                {/* Main content */}
                <div className="flex-1 min-w-0 p-4">
                  {/* Top row: index + title */}
                  <div className="flex items-start gap-2.5 mb-1.5">
                    <span className="text-[11px] font-bold text-secondary shrink-0 mt-0.5">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <h3 className="font-semibold text-on-surface text-sm md:text-base leading-snug flex-1 min-w-0">
                      {concept.title}
                    </h3>
                  </div>

                  {/* Description */}
                  {concept.description && (
                    <p className="text-secondary text-xs md:text-sm leading-relaxed line-clamp-2 mb-2 ml-7">
                      {concept.description}
                    </p>
                  )}

                  {/* Bottom meta row */}
                  <div className="flex items-center gap-2 flex-wrap ml-7">
                    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${meta.pill}`}>
                      {meta.label}
                    </span>
                    {concept.estimatedMinutes && (
                      <span className="text-[10px] text-secondary font-medium">
                        {concept.estimatedMinutes} min
                      </span>
                    )}
                    {(concept.masteryLevel ?? 0) > 0 && (
                      <div className="flex items-center gap-1.5 flex-1 min-w-[80px]">
                        <div className="flex-1 bg-surface-container-low h-1 rounded-full overflow-hidden">
                          <div
                            className="primary-gradient h-full rounded-full"
                            style={{ width: `${concept.masteryLevel ?? 0}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-secondary shrink-0">
                          {concept.masteryLevel ?? 0}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right chevron */}
                <div className="flex items-center pr-3 shrink-0">
                  <span
                    className="material-symbols-outlined text-[18px]"
                    style={{ color: 'var(--cs-out)' }}
                  >
                    chevron_right
                  </span>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* ── Completion banner ── */}
      {progress === 100 && (
        <div
          className="mt-6 bg-primary-container rounded-2xl p-5 md:p-8 text-center animate-in zoom-in-95 duration-500"
          style={{ boxShadow: '0 4px 16px rgba(200,91,50,0.25)' }}
        >
          <span
            className="material-symbols-outlined text-4xl mb-2 block text-on-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            workspace_premium
          </span>
          <h3 className="font-headline text-2xl md:text-3xl text-on-primary mb-1">Chapter Complete!</h3>
          <p className="text-on-primary opacity-80 text-sm">You've mastered all concepts in this chapter.</p>
        </div>
      )}

    </div>
  );
};

export default ChapterBreakdown;
