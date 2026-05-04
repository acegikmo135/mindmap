import React, { useState } from 'react';
import { Flashcard, Chapter } from '../types';
import { Loader2 } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import { getFlashcardsFromCache } from '../services/db';
import { scheduleFlashcardReminder } from '../services/notifications';

interface FlashcardsProps {
  cards: Flashcard[];
  chapter: Chapter;
  onAddCard?: (front: string, back: string) => void;
  userId?: string;
}

const Flashcards: React.FC<FlashcardsProps> = ({ cards, chapter, onAddCard, userId }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateAI = async () => {
    if (!onAddCard) return;
    setIsGenerating(true);
    try {
      const generated = await getFlashcardsFromCache(chapter.id, 5);
      for (const card of generated) onAddCard(card.front, card.back);
    } catch (e) {
      console.error('Flashcard gen error:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFront.trim() && newBack.trim() && onAddCard) {
      onAddCard(newFront.trim(), newBack.trim());
      setNewFront(''); setNewBack(''); setShowCreate(false);
    }
  };

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      if (currentIndex < cards.length - 1) setCurrentIndex(i => i + 1);
      else setCompleted(true);
    }, 200);
  };

  const newCount      = cards.filter(c => !(c as any).lastReviewed).length;
  const learningCount = Math.min(Math.floor(cards.length * 0.12), cards.length);
  const reviewCount   = cards.length - newCount - learningCount;

  /* ── Create card modal ── */
  if (showCreate) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 animate-in fade-in duration-300 pb-8">
        <button onClick={() => setShowCreate(false)} className="flex items-center gap-2 text-xs font-semibold text-secondary hover:text-primary mb-6 transition-colors">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Back to Cards
        </button>
        <div className="bg-surface-container-lowest rounded-2xl p-8" style={{ boxShadow: '0 4px 16px rgba(15,23,42,0.08)' }}>
          <h3 className="font-headline text-2xl text-on-surface mb-6">Create New Flashcard</h3>
          <form onSubmit={handleCreate} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-2">Front (Question)</label>
              <textarea
                value={newFront} onChange={e => setNewFront(e.target.value)}
                className="w-full p-4 rounded-xl bg-surface-container text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm resize-none"
                style={{ border: '1px solid rgba(199,196,216,0.3)' }}
                rows={3} placeholder="Enter the question or term…" required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-2">Back (Answer)</label>
              <textarea
                value={newBack} onChange={e => setNewBack(e.target.value)}
                className="w-full p-4 rounded-xl bg-surface-container text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm resize-none"
                style={{ border: '1px solid rgba(199,196,216,0.3)' }}
                rows={3} placeholder="Enter the answer or explanation…" required
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowCreate(false)}
                className="flex-1 py-3 bg-surface-container text-secondary font-semibold rounded-xl text-sm transition-colors hover:bg-surface-container-high">
                Cancel
              </button>
              <button type="submit"
                className="flex-1 py-3 primary-gradient text-on-primary font-bold rounded-xl text-sm shadow-glow transition-all hover:shadow-glow-lg">
                Create Card
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  /* ── Empty state ── */
  if (!cards || cards.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 flex flex-col items-center text-center animate-in fade-in duration-400 pb-8">
        <div className="w-20 h-20 rounded-full bg-primary-fixed flex items-center justify-center mb-5">
          <span className="material-symbols-outlined text-primary text-[36px]">style</span>
        </div>
        <h3 className="font-headline text-3xl text-on-surface mb-2">No Cards Yet</h3>
        <p className="text-secondary text-sm mb-8 max-w-sm">Generate AI flashcards from your chapter or create your own to start studying.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-6 py-3 bg-surface-container-highest text-primary font-semibold rounded-full text-sm hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Add Card
          </button>
          <button onClick={handleGenerateAI} disabled={isGenerating}
            className="flex items-center gap-2 px-6 py-3 primary-gradient text-on-primary font-bold rounded-full text-sm shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-60">
            {isGenerating
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
              : <><span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span> AI Generate</>
            }
          </button>
        </div>
      </div>
    );
  }

  /* ── Completed state ── */
  if (completed) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 flex flex-col items-center text-center animate-in zoom-in-95 duration-400 pb-8">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-5">
          <span className="material-symbols-outlined text-emerald-600 text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
        </div>
        <h3 className="font-headline text-3xl text-on-surface mb-2">Session Complete!</h3>
        <p className="text-secondary text-sm mb-8">You reviewed {cards.length} cards. Keep it up!</p>
        <div className="flex flex-wrap justify-center gap-3">
          <button onClick={() => { setCompleted(false); setCurrentIndex(0); setIsFlipped(false); }}
            className="px-6 py-3 primary-gradient text-on-primary font-bold rounded-full text-sm shadow-glow transition-all">
            Review Again
          </button>
          <button onClick={() => setShowCreate(true)}
            className="px-6 py-3 bg-surface-container-highest text-primary font-semibold rounded-full text-sm hover:bg-surface-container-high transition-colors">
            Add More
          </button>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-400 pb-8 px-4">

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-headline text-4xl text-on-surface mb-1">{chapter.title}</h1>
          <p className="text-secondary text-sm">Reviewing {cards.length} active cards in this deck.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-highest text-primary font-semibold rounded-[10px] text-sm hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            <span className="hidden sm:inline">Add Card</span>
          </button>
          <button onClick={handleGenerateAI} disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2.5 primary-gradient text-on-primary font-bold rounded-[10px] text-sm shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-60">
            {isGenerating
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
            }
            <span className="hidden sm:inline">{isGenerating ? 'Generating…' : 'AI Generate'}</span>
          </button>
        </div>
      </header>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'New',      value: newCount,      color: 'text-primary' },
          { label: 'Learning', value: learningCount, color: 'text-tertiary' },
          { label: 'Review',   value: reviewCount,   color: 'text-on-secondary-fixed-variant' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-surface-container-lowest p-4 rounded-xl flex flex-col items-center"
            style={{ boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>
            <span className="text-[10px] font-bold text-secondary uppercase tracking-tighter mb-1">{label}</span>
            <span className={`text-xl font-semibold ${color}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-between text-xs font-semibold text-secondary mb-4">
        <span>Card {currentIndex + 1} of {cards.length}</span>
        <div className="flex-1 mx-4 bg-surface-container-low h-1 rounded-full overflow-hidden">
          <div className="primary-gradient h-full rounded-full transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }} />
        </div>
        <span>{Math.round(((currentIndex + 1) / cards.length) * 100)}%</span>
      </div>

      {/* 3D Flip Card */}
      <div className="w-full h-[240px] perspective-1000 cursor-pointer" onClick={() => setIsFlipped(f => !f)}>
        <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d rounded-3xl shadow-glow ${isFlipped ? 'rotate-y-180' : ''}`}>

          {/* Front */}
          <div className="absolute inset-0 backface-hidden primary-gradient rounded-3xl flex flex-col items-center justify-center p-8 text-center"
            style={{ border: '4px solid rgba(255,255,255,0.2)' }}>
            <div className="absolute top-4 left-4 opacity-50">
              <span className="material-symbols-outlined text-white text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
            </div>
            <div className="font-headline text-2xl md:text-3xl text-on-primary leading-snug">
              <MarkdownRenderer content={currentCard.front} />
            </div>
            <div className="mt-6 flex items-center gap-2 text-on-primary/60 text-[10px] font-bold uppercase tracking-widest">
              <span className="material-symbols-outlined text-[14px]">touch_app</span>
              Tap to Flip
            </div>
          </div>

          {/* Back */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-surface-container-lowest rounded-3xl flex flex-col items-center justify-center p-8 text-center"
            style={{ boxShadow: '0 8px 32px rgba(49,48,192,0.15)' }}>
            <span className="absolute top-4 left-4 text-[10px] font-bold text-primary uppercase tracking-widest">Answer</span>
            <div className="text-on-surface text-base leading-relaxed">
              <MarkdownRenderer content={currentCard.back} />
            </div>
          </div>
        </div>
      </div>

      {/* Rating buttons */}
      <div className={`mt-10 flex flex-wrap justify-center gap-3 transition-all duration-300 ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 pointer-events-none translate-y-4'}`}>
        {[
          { label: 'Again', interval: '<1m', hover: 'hover:bg-error-container/30 hover:text-error',     delayDays: 0 },
          { label: 'Hard',  interval: '2d',  hover: 'hover:bg-orange-50 hover:text-tertiary',           delayDays: 2 },
          { label: 'Good',  interval: '4d',  hover: 'hover:bg-indigo-50 hover:text-primary',            delayDays: 4 },
          { label: 'Easy',  interval: '7d',  hover: 'hover:bg-emerald-50 hover:text-emerald-700',       delayDays: 7 },
        ].map(({ label, interval, hover, delayDays }) => (
          <button key={label} onClick={() => {
            if (userId && delayDays > 0) {
              scheduleFlashcardReminder(userId, chapter.title, delayDays);
            }
            handleNext();
          }}
            className={`flex-1 min-w-[80px] py-4 px-2 bg-surface-container-lowest rounded-full group transition-all ${hover}`}
            style={{ border: '1px solid rgba(199,196,216,0.2)', boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold uppercase tracking-widest text-secondary group-hover:opacity-80">{label}</span>
              <span className="text-[10px] font-mono mt-1 text-outline">{interval}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Insight cards */}
      <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface-container-low p-6 rounded-2xl" style={{ border: '1px solid rgba(199,196,216,0.1)' }}>
          <h3 className="font-semibold text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">analytics</span>
            Performance Insight
          </h3>
          <p className="text-sm text-secondary leading-relaxed">
            Keep up the regular reviews. Spaced repetition is most effective when you rate cards honestly — tap <strong>Again</strong> if you weren't sure.
          </p>
        </div>
        <div className="bg-surface-container-low p-6 rounded-2xl" style={{ border: '1px solid rgba(199,196,216,0.1)' }}>
          <h3 className="font-semibold text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">lightbulb</span>
            Study Tip
          </h3>
          <p className="text-sm text-secondary leading-relaxed">
            Try the Feynman Technique: explain the concept in your own words after flipping the card to reinforce deep understanding.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Flashcards;
