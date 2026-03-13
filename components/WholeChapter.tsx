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

  useEffect(() => {
    let mounted = true;
    const fetchExplanation = async () => {
      if (!chapter) return;
      setLoading(true);
      const text = await explainChapter(chapter);
      if (mounted) {
        setContent(text);
        setLoading(false);
      }
    };

    fetchExplanation();
    return () => { mounted = false; };
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