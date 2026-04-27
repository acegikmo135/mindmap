import React, { useState } from 'react';
import { Chapter } from '../types';
import { getExplanationFromCache } from '../services/db';
import { Loader2 } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

interface WholeChapterProps {
  chapter: Chapter;
}

const WholeChapter: React.FC<WholeChapterProps> = ({ chapter }) => {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [length, setLength] = useState<'SHORT' | 'STANDARD' | 'LONG'>('STANDARD');
  const [depth,  setDepth]  = useState<'BASIC' | 'INTERMEDIATE' | 'ADVANCED'>('INTERMEDIATE');

  const fetchExplanation = async () => {
    setLoading(true);
    const text = await getExplanationFromCache(chapter.id, length, depth);
    setContent(text ?? 'Explanation not available for this combination yet.');
    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-400 pb-8">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs font-semibold text-secondary mb-6">
        <span className="hover:text-primary cursor-pointer transition-colors">{chapter.subject}</span>
        <span className="material-symbols-outlined text-[12px] text-outline">chevron_right</span>
        <span className="text-primary-container">Understand Chapter</span>
      </nav>

      {/* Header + config bar */}
      <div className="mb-8">
        <h1 className="font-headline text-4xl md:text-5xl text-on-surface mb-5">{chapter.title}</h1>

        <div className="bg-surface-container-low/50 p-2 rounded-2xl flex flex-wrap gap-2 items-center"
          style={{ border: '1px solid rgba(199,196,216,0.15)' }}>
          {/* Length */}
          <div className="flex items-center gap-3 px-3 py-2">
            <span className="text-[10px] font-bold uppercase text-secondary tracking-widest whitespace-nowrap">Length</span>
            <div className="flex bg-surface-container-highest rounded-lg p-0.5">
              {(['SHORT', 'STANDARD', 'LONG'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setLength(l)}
                  className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all capitalize ${
                    length === l ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-secondary hover:text-primary'
                  }`}
                >
                  {l.charAt(0) + l.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="h-6 w-px bg-outline-variant/30 hidden sm:block" />

          {/* Depth */}
          <div className="flex items-center gap-3 px-3 py-2">
            <span className="text-[10px] font-bold uppercase text-secondary tracking-widest whitespace-nowrap">Depth</span>
            <div className="flex bg-surface-container-highest rounded-lg p-0.5">
              {(['BASIC', 'INTERMEDIATE', 'ADVANCED'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setDepth(d)}
                  className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all capitalize ${
                    depth === d ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-secondary hover:text-primary'
                  }`}
                >
                  {d === 'INTERMEDIATE' ? 'Inter.' : d.charAt(0) + d.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="h-6 w-px bg-outline-variant/30 hidden sm:block" />

          <button
            onClick={fetchExplanation}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 primary-gradient text-white rounded-full font-semibold text-sm shadow-glow active:scale-95 transition-all disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            {content ? 'Regenerate' : 'Generate'}
          </button>
        </div>
      </div>

      {/* Content area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 rounded-full primary-gradient flex items-center justify-center shadow-glow animate-pulse">
            <span className="material-symbols-outlined text-white text-[22px]">auto_awesome</span>
          </div>
          <p className="text-secondary font-medium">Generating explanation…</p>
        </div>

      ) : content ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main article */}
          <article className="lg:col-span-8 bg-surface-container-lowest rounded-2xl p-8 cs-prose"
            style={{ boxShadow: '0 4px 16px rgba(15,23,42,0.06)' }}>
            <MarkdownRenderer content={content} className="text-on-surface-variant leading-relaxed" />
          </article>

          {/* Sidebar metadata */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-surface-container-low p-6 rounded-2xl"
              style={{ border: '1px solid rgba(199,196,216,0.15)' }}>
              <h4 className="font-headline text-lg text-primary mb-3">Key Terms</h4>
              <div className="flex flex-wrap gap-2">
                {chapter.concepts.slice(0, 6).map(c => (
                  <span key={c.id} className="px-3 py-1 bg-primary-fixed text-[10px] font-bold text-primary rounded-full shadow-sm">
                    {c.title}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-2xl"
              style={{ boxShadow: '0 4px 16px rgba(15,23,42,0.06)' }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-primary-container text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
                <h4 className="font-headline text-base text-on-surface">Tutor Insight</h4>
              </div>
              <p className="text-sm text-secondary leading-relaxed">
                Adjust the length and depth settings to match your current study goal — brief for quick review, advanced for deep preparation.
              </p>
              <button
                onClick={fetchExplanation}
                className="w-full mt-4 py-2.5 primary-gradient text-white rounded-xl text-sm font-bold shadow-glow hover:shadow-glow-lg transition-all"
              >
                Regenerate
              </button>
            </div>

            <div className="p-5 rounded-2xl border-2 border-dashed border-outline-variant">
              <h4 className="font-headline text-base text-on-surface mb-1">Progress</h4>
              <p className="text-xs text-secondary mb-3">
                {chapter.concepts.filter(c => c.status === 'MASTERED').length}/{chapter.concepts.length} concepts mastered
              </p>
              <div className="w-full bg-surface-container-low h-1.5 rounded-full overflow-hidden">
                <div
                  className="primary-gradient h-full rounded-full"
                  style={{ width: `${chapter.concepts.length > 0 ? Math.round(chapter.concepts.filter(c => c.status === 'MASTERED').length / chapter.concepts.length * 100) : 0}%` }}
                />
              </div>
            </div>
          </aside>
        </div>

      ) : (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-[28px]">auto_awesome</span>
          </div>
          <div>
            <h3 className="font-headline text-2xl text-on-surface mb-2">Ready to explain</h3>
            <p className="text-secondary text-sm max-w-sm">
              Choose your length and depth settings above, then click <strong>Generate</strong>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WholeChapter;
