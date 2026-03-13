import React, { useState } from 'react';
import { Chapter } from '../types';
import { CheckSquare, Square, ArrowRight, Award } from 'lucide-react';

interface RevisionModeProps {
  chapter: Chapter;
}

const RevisionMode: React.FC<RevisionModeProps> = ({ chapter }) => {
  const [checkedConcepts, setCheckedConcepts] = useState<Set<string>>(new Set());
  const [stage, setStage] = useState<'CHECKLIST' | 'SCAN' | 'DONE'>('CHECKLIST');

  const toggleCheck = (id: string) => {
    const next = new Set(checkedConcepts);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCheckedConcepts(next);
  };

  if (stage === 'DONE') {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center max-w-md mx-auto">
             <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-6 text-yellow-600 dark:text-yellow-400 animate-in zoom-in duration-500">
                <Award className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-serif font-bold text-slate-800 dark:text-slate-100 mb-4">Ready for Exam!</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8">
                Based on your revision, your confidence score is high. You've reviewed the critical dependencies and verified your understanding.
            </p>
             <button 
                onClick={() => setStage('CHECKLIST')}
                className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-all"
            >
                Start Over
            </button>
        </div>
      )
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {stage === 'CHECKLIST' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-8">
            <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-slate-100">Concept Checklist</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Be honest. Check only what you can explain to a 5-year-old.</p>
          </div>
          
          <div className="space-y-3 mb-8">
            {chapter.concepts.map(concept => (
              <div 
                key={concept.id}
                onClick={() => toggleCheck(concept.id)}
                className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200
                  ${checkedConcepts.has(concept.id) 
                    ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-800' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
              >
                <div className={`shrink-0 transition-colors ${checkedConcepts.has(concept.id) ? 'text-primary-600 dark:text-primary-400' : 'text-slate-300 dark:text-slate-600'}`}>
                  {checkedConcepts.has(concept.id) ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className={`font-medium ${checkedConcepts.has(concept.id) ? 'text-primary-900 dark:text-primary-100' : 'text-slate-700 dark:text-slate-300'}`}>
                    {concept.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
             <button 
                onClick={() => setStage('SCAN')}
                className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-all"
            >
                Next: Dependency Scan
                <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {stage === 'SCAN' && (
        <div className="animate-in fade-in slide-in-from-right-8 duration-500">
           <div className="mb-8">
            <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-slate-100">Rapid Dependency Scan</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Mentally connect the dots. Do you know WHY the arrow points down?</p>
          </div>

          <div className="border-l-2 border-slate-200 dark:border-slate-700 ml-6 pl-8 py-4 space-y-8 relative">
             {chapter.concepts.map((concept, idx) => (
                 <div key={concept.id} className="relative">
                     <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full bg-white dark:bg-slate-800 border-4 border-slate-300 dark:border-slate-600"></div>
                     <h3 className="font-bold text-slate-800 dark:text-slate-100">{concept.title}</h3>
                     {idx < chapter.concepts.length - 1 && (
                         <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 italic">
                             ↓ {chapter.concepts[idx+1].dependencyNote || "leads to"}
                         </p>
                     )}
                 </div>
             ))}
          </div>

          <div className="flex justify-end mt-12">
             <button 
                onClick={() => setStage('DONE')}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all"
            >
                Finish Revision
                <CheckSquare className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevisionMode;