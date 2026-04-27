import React, { useState } from 'react';
import { Chapter } from '../types';

interface SubjectSelectionProps {
  chapters: Chapter[];
  onSelectChapter: (chapter: Chapter) => void;
}

const SUBJECT_META: Record<string, { icon: string; color: string; accent: string; bg: string }> = {
  'Maths':          { icon: 'functions',   color: '#c85b32', accent: '#fde8de', bg: 'bg-primary-fixed'   },
  'Science':        { icon: 'science',     color: '#7e3000', accent: '#ffdbcc', bg: 'bg-tertiary-fixed'  },
  'Social Science': { icon: 'public',      color: '#2a7a5c', accent: '#d4f5e8', bg: 'bg-green-50'        },
  default:          { icon: 'menu_book',   color: '#c85b32', accent: '#fde8de', bg: 'bg-primary-fixed'   },
};

const getMeta = (subject: string) => SUBJECT_META[subject] ?? SUBJECT_META.default;

const SubjectSelection: React.FC<SubjectSelectionProps> = ({ chapters, onSelectChapter }) => {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const subjects: string[] = Array.from(new Set(chapters.map(c => c.subject)));

  /* ── Subject list view ───────────────────────────────────────── */
  if (!selectedSubject) {
    return (
      <div className="max-w-2xl mx-auto animate-in fade-in duration-500 pb-8">

        {/* Header */}
        <header className="mb-8 md:mb-10">
          <h1 className="font-headline text-4xl md:text-6xl text-on-surface mb-1 leading-tight">
            Good morning 👋
          </h1>
          <p className="text-secondary text-base md:text-lg font-medium">
            Which subject are you studying today?
          </p>
        </header>

        {/* Subject cards — full-width on mobile, 2-col on sm+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {subjects.map(subject => {
            const meta    = getMeta(subject);
            const count   = chapters.filter(c => c.subject === subject).length;
            const mastered = chapters
              .filter(c => c.subject === subject)
              .reduce((s, ch) => s + ch.concepts.filter(c => c.status === 'MASTERED').length, 0);
            const total   = chapters
              .filter(c => c.subject === subject)
              .reduce((s, ch) => s + ch.concepts.length, 0);
            const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;

            return (
              <div
                key={subject}
                onClick={() => setSelectedSubject(subject)}
                className="bg-surface-container-lowest rounded-2xl cursor-pointer active:scale-[0.98] hover:-translate-y-1 transition-all duration-250 shadow-card overflow-hidden"
              >
                {/* Accent top strip */}
                <div className="h-1.5 w-full" style={{ background: meta.color }} />

                <div className="p-5 md:p-6">
                  {/* Icon + count row */}
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ background: meta.accent }}
                    >
                      <span
                        className="material-symbols-outlined text-[26px] md:text-[30px]"
                        style={{ color: meta.color, fontVariationSettings: "'FILL' 1" }}
                      >
                        {meta.icon}
                      </span>
                    </div>
                    <span
                      className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full"
                      style={{ background: meta.accent, color: meta.color }}
                    >
                      {count} chaps
                    </span>
                  </div>

                  {/* Subject name — big and bold */}
                  <h3 className="font-headline text-5xl md:text-6xl font-bold text-on-surface leading-none mb-4 tracking-tight">
                    {subject}
                  </h3>

                  {/* Mastery bar */}
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold mb-1.5 uppercase tracking-wide text-secondary">
                      <span>Mastery</span>
                      <span style={{ color: meta.color }}>{pct}%</span>
                    </div>
                    <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: meta.color }}
                      />
                    </div>
                  </div>

                  {/* Footer stat */}
                  <p className="text-xs font-medium text-secondary mt-3">{total} total concepts</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ── Chapter list view ───────────────────────────────────────── */
  const filteredChapters = chapters.filter(c => c.subject === selectedSubject);
  const meta = getMeta(selectedSubject);

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-right-8 duration-400 pb-8">

      {/* Header */}
      <header className="mb-6 md:mb-8">
        <button
          onClick={() => setSelectedSubject(null)}
          className="flex items-center gap-1.5 text-xs font-semibold text-secondary hover:text-primary transition-colors mb-3 -ml-1"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Back to Subjects
        </button>

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: meta.color }}>
              Subject
            </p>
            <h1 className="font-headline text-5xl md:text-6xl font-bold text-on-surface leading-none">
              {selectedSubject}
            </h1>
          </div>
          <span
            className="shrink-0 text-sm font-bold px-4 py-2 rounded-full"
            style={{ background: meta.accent, color: meta.color }}
          >
            {filteredChapters.length} Chapters
          </span>
        </div>

        <p className="text-secondary text-sm mt-3">Select a chapter to begin your learning journey.</p>
      </header>

      {/* Chapter cards */}
      <div className="space-y-3">
        {filteredChapters.map((chapter, idx) => {
          const total    = chapter.concepts.length;
          const mastered = chapter.concepts.filter(c => c.status === 'MASTERED').length;
          const pct      = total > 0 ? Math.round((mastered / total) * 100) : 0;

          return (
            <div
              key={chapter.id}
              onClick={() => onSelectChapter(chapter)}
              className="bg-surface-container-lowest rounded-2xl cursor-pointer active:scale-[0.98] hover:-translate-y-0.5 transition-all duration-200 shadow-card"
            >
              <div className="flex items-center gap-4 p-4 md:p-5">
                {/* Number badge */}
                <div
                  className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-base md:text-lg"
                  style={{ background: meta.accent, color: meta.color }}
                >
                  {idx + 1}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base md:text-lg text-on-surface leading-snug line-clamp-2">
                    {chapter.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex-1 bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: meta.color }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-secondary shrink-0">{pct}%</span>
                  </div>
                  <p className="text-xs text-secondary mt-1">{total} concepts</p>
                </div>

                {/* Arrow */}
                <span
                  className="material-symbols-outlined text-[20px] shrink-0 text-outline"
                  style={{ color: 'var(--cs-out)' }}
                >
                  chevron_right
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubjectSelection;
