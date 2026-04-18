import React, { useEffect, useState } from 'react';
import { Chapter } from '../types';
import { explainChapter } from '../services/geminiService';
import { saveExplanation, getExplanations, ChapterExplanation } from '../services/db';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, Loader2, History, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

interface WholeChapterProps {
  chapter: Chapter;
}

const WholeChapter: React.FC<WholeChapterProps> = ({ chapter }) => {
  const { user } = useAuth();
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [length, setLength] = useState<'SHORT' | 'STANDARD' | 'LONG'>('STANDARD');
  const [depth, setDepth] = useState<'BASIC' | 'INTERMEDIATE' | 'ADVANCED'>('INTERMEDIATE');
  const [explanations, setExplanations] = useState<ChapterExplanation[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load saved explanations on mount
  useEffect(() => {
    if (!user) { setLoadingHistory(false); return; }

    const load = async () => {
      setLoadingHistory(true);
      const saved = await getExplanations(user.id, chapter.id);
      setExplanations(saved);
      // Auto-load most recent explanation
      if (saved.length > 0) {
        setContent(saved[0].content);
        setLength(saved[0].length as 'SHORT' | 'STANDARD' | 'LONG');
        setDepth(saved[0].depth as 'BASIC' | 'INTERMEDIATE' | 'ADVANCED');
      }
      setLoadingHistory(false);
    };
    load();
  }, [user, chapter.id]);

  const fetchExplanation = async () => {
    if (!chapter) return;
    setLoading(true);
    const text = await explainChapter(chapter, length, depth);
    setContent(text);

    // Save to Supabase if valid response
    if (user && text && !text.startsWith('An error') && !text.startsWith('AI Service')) {
      await saveExplanation(user.id, chapter.id, chapter.title, text, length, depth);
      const saved = await getExplanations(user.id, chapter.id);
      setExplanations(saved);
    }
    setLoading(false);
  };

  const loadFromHistory = (item: ChapterExplanation) => {
    setContent(item.content);
    setLength(item.length as 'SHORT' | 'STANDARD' | 'LONG');
    setDepth(item.depth as 'BASIC' | 'INTERMEDIATE' | 'ADVANCED');
    setShowHistory(false);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString()} · ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-8 border-b border-slate-200 dark:border-slate-700 pb-6">
        <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 mb-2">
          <Sparkles className="w-5 h-5" />
          <span className="text-sm font-bold uppercase tracking-wider">AI Chapter Explanation</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-800 dark:text-slate-100">
          {chapter.title}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Comprehensive summary and conceptual overview.
        </p>

        {/* Controls */}
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

        <div className="mt-4 flex flex-wrap gap-3 items-center">
          <button
            onClick={fetchExplanation}
            disabled={loading}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {content ? 'Regenerate Explanation' : 'Generate Explanation'}
          </button>

          {/* History toggle */}
          {explanations.length > 0 && (
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <History className="w-4 h-4" />
              History ({explanations.length}/5)
              {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>

        {/* History panel */}
        {showHistory && (
          <div className="mt-4 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2 border-b border-slate-200 dark:border-slate-700">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Saved Explanations (last 5)</p>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {explanations.map((item) => (
                <button
                  key={item.id}
                  onClick={() => loadFromHistory(item)}
                  className="w-full text-left flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {formatDate(item.created_at)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {item.length} · {item.depth}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">Load</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content area */}
      {loadingHistory ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          <p className="text-slate-400">Loading saved explanations...</p>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
          <p className="text-slate-500 dark:text-slate-400">Generating comprehensive explanation...</p>
        </div>
      ) : content ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
          <MarkdownRenderer content={content} className="text-slate-700 dark:text-slate-300" />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
          <Sparkles className="w-10 h-10 text-slate-300 dark:text-slate-600" />
          <p className="text-slate-500 dark:text-slate-400">
            Select your preferences above and click <strong>Generate Explanation</strong> to get started.
          </p>
        </div>
      )}
    </div>
  );
};

export default WholeChapter;
