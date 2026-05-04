import React, { useState } from 'react';
import { Chapter } from '../types';
import { scheduleFlashcardReminder } from '../services/notifications';

interface RevisionModeProps {
  chapter: Chapter;
  userId?: string;
}

const RevisionMode: React.FC<RevisionModeProps> = ({ chapter, userId }) => {
  const [checkedConcepts, setCheckedConcepts] = useState<Set<string>>(new Set());
  const [stage, setStage] = useState<'CHECKLIST' | 'SCAN' | 'DONE'>('CHECKLIST');
  const [reminderSet, setReminderSet] = useState(false);

  const toggleCheck = (id: string) => {
    const next = new Set(checkedConcepts);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCheckedConcepts(next);
  };

  const handleSetReminder = async (days: number) => {
    if (!userId) return;
    await scheduleFlashcardReminder(userId, chapter.title, days);
    setReminderSet(true);
  };

  if (stage === 'DONE') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center max-w-md mx-auto px-4">
        <div className="w-20 h-20 bg-tertiary-fixed rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500">
          <span className="material-symbols-outlined text-tertiary text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
        </div>
        <h2 className="font-headline text-4xl text-on-surface mb-4">Ready for Exam!</h2>
        <p className="text-secondary mb-6">
          Based on your revision, your confidence score is high. You've reviewed the critical dependencies and verified your understanding.
        </p>

        {userId && (
          <div className="w-full mb-6 p-4 bg-surface-container-lowest rounded-2xl" style={{ border: '1px solid rgba(199,196,216,0.2)' }}>
            <p className="text-sm font-semibold text-on-surface mb-3">
              <span className="material-symbols-outlined text-[16px] align-middle mr-1">notifications</span>
              Set a Revision Reminder
            </p>
            {reminderSet ? (
              <div className="flex items-center justify-center gap-2 text-emerald-600 text-sm font-semibold py-2">
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                Reminder scheduled!
              </div>
            ) : (
              <div className="flex gap-2 justify-center">
                {[{ label: 'Tomorrow', days: 1 }, { label: '3 Days', days: 3 }, { label: '1 Week', days: 7 }].map(({ label, days }) => (
                  <button key={days} onClick={() => handleSetReminder(days)}
                    className="flex-1 py-2 px-3 bg-surface-container text-secondary font-semibold rounded-xl text-xs hover:bg-primary hover:text-on-primary transition-all">
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => { setStage('CHECKLIST'); setCheckedConcepts(new Set()); setReminderSet(false); }}
          className="px-8 py-3 primary-gradient text-on-primary rounded-xl font-semibold shadow-glow transition-all"
        >
          Start Over
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 pb-8">
      {stage === 'CHECKLIST' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-8">
            <h2 className="font-headline text-4xl text-on-surface">Concept Checklist</h2>
            <p className="text-secondary mt-2">Be honest. Check only what you can explain to a 5-year-old.</p>
          </div>

          <div className="space-y-3 mb-8">
            {chapter.concepts.map(concept => (
              <div
                key={concept.id}
                onClick={() => toggleCheck(concept.id)}
                className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                  checkedConcepts.has(concept.id)
                    ? 'bg-indigo-50/40 outline outline-1 outline-primary'
                    : 'bg-surface-container-lowest outline outline-1 outline-outline-variant hover:outline-primary/40'
                }`}
              >
                <div className={`shrink-0 transition-colors ${checkedConcepts.has(concept.id) ? 'text-primary' : 'text-outline'}`}>
                  <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: checkedConcepts.has(concept.id) ? "'FILL' 1" : "'FILL' 0" }}>
                    check_box
                  </span>
                </div>
                <h3 className={`font-medium ${checkedConcepts.has(concept.id) ? 'text-primary' : 'text-on-surface'}`}>
                  {concept.title}
                </h3>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setStage('SCAN')}
              className="flex items-center gap-2 px-6 py-3 primary-gradient text-on-primary rounded-xl font-semibold shadow-glow transition-all"
            >
              Next: Dependency Scan
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {stage === 'SCAN' && (
        <div className="animate-in fade-in slide-in-from-right-8 duration-500">
          <div className="mb-8">
            <h2 className="font-headline text-4xl text-on-surface">Rapid Dependency Scan</h2>
            <p className="text-secondary mt-2">Mentally connect the dots. Do you know WHY the arrow points down?</p>
          </div>

          <div className="border-l-2 border-outline-variant ml-6 pl-8 py-4 space-y-8 relative">
            {chapter.concepts.map((concept, idx) => (
              <div key={concept.id} className="relative">
                <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full bg-surface border-4 border-primary/30" style={{ background: 'var(--md-sys-color-surface, #fdfcff)' }}></div>
                <h3 className="font-semibold text-on-surface">{concept.title}</h3>
                {idx < chapter.concepts.length - 1 && (
                  <p className="text-xs text-secondary mt-1 italic">
                    ↓ {chapter.concepts[idx + 1].dependencyNote || 'leads to'}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-12">
            <button
              onClick={() => setStage('DONE')}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all"
            >
              Finish Revision
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevisionMode;
