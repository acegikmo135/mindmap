import React, { useState } from 'react';
import { Chapter } from '../types';
import { BookOpen, ArrowRight, Atom, Calculator, ChevronLeft } from 'lucide-react';

interface SubjectSelectionProps {
  chapters: Chapter[];
  onSelectChapter: (chapter: Chapter) => void;
  onChapterCreated: (chapter: Chapter) => void;
}

const SubjectSelection: React.FC<SubjectSelectionProps> = ({ chapters, onSelectChapter }) => {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const subjects: string[] = Array.from(new Set(chapters.map(c => c.subject)));

  const getSubjectIcon = (subject: string) => {
    switch (subject) {
      case 'Maths': return <Calculator className="w-10 h-10" />;
      case 'Science': return <Atom className="w-10 h-10" />;
      default: return <BookOpen className="w-10 h-10" />;
    }
  };

  const getSubjectColor = (subject: string) => {
    switch (subject) {
        case 'Maths': return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-600';
        case 'Science': return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800 hover:border-emerald-300 dark:hover:border-emerald-600';
        default: return 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 border-purple-100 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-600';
    }
  };

  if (!selectedSubject) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-12 animate-in fade-in duration-500">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 dark:text-white leading-tight">
            Select a <span className="text-primary-600 dark:text-primary-400">Subject</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Choose a subject to view available chapters.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 justify-items-center">
            {subjects.map(subject => {
                const count = chapters.filter(c => c.subject === subject).length;
                const colorClass = getSubjectColor(subject);
                
                return (
                    <button
                        key={subject}
                        onClick={() => setSelectedSubject(subject)}
                        className={`w-full max-w-sm group flex flex-col items-center p-10 rounded-3xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl ${colorClass}`}
                    >
                        <div className="p-6 bg-white dark:bg-slate-900 rounded-full shadow-sm mb-6 group-hover:scale-110 transition-transform duration-300">
                             {getSubjectIcon(subject)}
                        </div>
                        <h2 className="text-3xl font-bold mb-2">{subject}</h2>
                        <div className="flex items-center gap-2 opacity-80 font-medium">
                            <span className="bg-white/50 dark:bg-black/20 px-4 py-1.5 rounded-full text-sm">
                                {count} Chapters
                            </span>
                        </div>
                    </button>
                )
            })}
        </div>
      </div>
    );
  }

  const filteredChapters = chapters.filter(c => c.subject === selectedSubject);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-right-8 duration-500">
      <button 
        onClick={() => setSelectedSubject(null)}
        className="mb-8 flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors group"
      >
        <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
            <ChevronLeft className="w-5 h-5" />
        </div>
        <span className="font-medium">Back to Subjects</span>
      </button>

      <div className="mb-10 text-center md:text-left">
         <div className="inline-flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-serif font-bold text-slate-800 dark:text-white">{selectedSubject}</h1>
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-full text-sm font-bold">
                {filteredChapters.length}
            </span>
         </div>
         <p className="text-slate-500 dark:text-slate-400">Select a chapter to begin your learning journey.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredChapters.map(chapter => (
          <div 
            key={chapter.id}
            onClick={() => onSelectChapter(chapter)}
            className="group bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col h-full transform hover:-translate-y-1"
          >
            <div className="flex items-start justify-between mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
                {chapter.concepts.length} Concepts
              </span>
            </div>
            
            <div className="flex-1">
              <h3 className="text-2xl font-serif font-bold text-slate-800 dark:text-slate-100 mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {chapter.title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {chapter.concepts[0]?.description || "Start your journey in this topic."}
              </p>
            </div>
            
            <div className="flex items-center text-primary-600 dark:text-primary-400 font-bold text-sm mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 group-hover:gap-2 transition-all">
              Start Learning
              <ArrowRight className="w-4 h-4 ml-1 group-hover:ml-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubjectSelection;