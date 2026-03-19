import React, { useEffect, useState } from 'react';
import { Chapter } from '../types';
import { explainChapter } from '../services/geminiService';
import { Sparkles, Loader2 } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

interface WholeChapterProps {
  chapter: Chapter;
}

const WholeChapter: React.FC<WholeChapterProps> = ({ chapter }) => {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [length, setLength] = useState<'SHORT' | 'STANDARD' | 'LONG'>('STANDARD');
  const [depth, setDepth] = useState<'BASIC' | 'INTERMEDIATE' | 'ADVANCED'>('INTERMEDIATE');

  const fetchExplanation = async () => {
    if (!chapter) return;
    setLoading(true);
    const text = await explainChapter(chapter, length, depth);
    setContent(text);
    setLoading(false);
  };

  useEffect(() => {
    fetchExplanation();
  }, [chapter]);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-in fade-in duration-500">
      <div className="mb-8 border-b border-slate-200 dark:border-slate-700 pb-6">
        <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 mb-2">
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-wider">AI Chapter Explanation</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-800 dark:text-slate-100">{chapter.title}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Comprehensive summary and conceptual overview for 8th Grade.</p>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Explanation Length</label>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              {(['SHORT', 'STANDARD', 'LONG'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLength(l)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                    length === l 
                      ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Explanation Depth</label>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              {(['BASIC', 'INTERMEDIATE', 'ADVANCED'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDepth(d)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                    depth === d 
                      ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button
          onClick={fetchExplanation}
          disabled={loading}
          className="mt-4 w-full md:w-auto px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Regenerate Explanation
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            <p className="text-slate-500 dark:text-slate-400">Generating comprehensive explanation...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
            <MarkdownRenderer content={content || "No explanation available."} className="text-slate-700 dark:text-slate-300" />
        </div>
      )}
    </div>
  );
};

export default WholeChapter;