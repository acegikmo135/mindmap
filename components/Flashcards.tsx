import React, { useState } from 'react';
import { Flashcard } from '../types';
import { ThumbsUp, HelpCircle } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

interface FlashcardsProps {
  cards: Flashcard[];
  onAddCard?: (front: string, back: string) => void;
}

const Flashcards: React.FC<FlashcardsProps> = ({ cards, onAddCard }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFront.trim() && newBack.trim() && onAddCard) {
      onAddCard(newFront, newBack);
      setNewFront('');
      setNewBack('');
      setShowCreate(false);
    }
  };

  if (showCreate) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-xl">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">Create New Flashcard</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Front (Question)</label>
              <textarea
                value={newFront}
                onChange={(e) => setNewFront(e.target.value)}
                className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                rows={3}
                placeholder="Enter the question or term..."
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Back (Answer)</label>
              <textarea
                value={newBack}
                onChange={(e) => setNewBack(e.target.value)}
                className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                rows={3}
                placeholder="Enter the answer or explanation..."
                required
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Create Card
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (!cards || cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-slate-500 dark:text-slate-400">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <HelpCircle className="w-8 h-8 text-slate-300 dark:text-slate-600" />
        </div>
        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">No Cards Due</h3>
        <p className="text-sm">You're all caught up! Check back later.</p>
        <button 
          onClick={() => setShowCreate(true)}
          className="mt-6 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Create Manual Card
        </button>
      </div>
    );
  }

  if (completed) {
     return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-slate-500 dark:text-slate-400 animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4 text-green-600 dark:text-green-400">
          <ThumbsUp className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Session Complete!</h3>
        <p className="text-sm mt-2">You've reviewed {cards.length} cards.</p>
        <div className="flex gap-3 mt-6">
          <button 
            onClick={() => { setCompleted(false); setCurrentIndex(0); }}
            className="px-6 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors"
          >
            Review Again
          </button>
          <button 
            onClick={() => setShowCreate(true)}
            className="px-6 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Add More
          </button>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setCompleted(true);
      }
    }, 200);
  };

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-6 text-sm text-slate-500 dark:text-slate-400 font-medium">
        <span>Card {currentIndex + 1} of {cards.length}</span>
        <button 
          onClick={() => setShowCreate(true)}
          className="text-primary-600 dark:text-primary-400 hover:underline"
        >
          + Add Card
        </button>
      </div>

      <div 
        className="relative h-80 w-full perspective-1000 cursor-pointer group"
        onClick={() => !isFlipped && setIsFlipped(true)}
      >
        <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d shadow-xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* Front */}
          <div className="absolute w-full h-full backface-hidden flex flex-col items-center justify-center p-8 overflow-y-auto">
            <span className="absolute top-6 left-6 text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">Question</span>
            <div className="text-xl font-serif font-medium text-slate-800 dark:text-slate-100 leading-relaxed text-center w-full">
              <MarkdownRenderer content={currentCard.front} />
            </div>
            <p className="absolute bottom-6 text-xs text-slate-400 dark:text-slate-500 animate-pulse">Tap to reveal answer</p>
          </div>

          {/* Back */}
          <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-8 rounded-2xl overflow-y-auto">
             <span className="absolute top-6 left-6 text-xs font-bold text-primary-600 dark:text-primary-400 tracking-wider uppercase">Answer</span>
             <div className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed text-center w-full">
               <MarkdownRenderer content={currentCard.back} />
             </div>
          </div>
        </div>
      </div>

      {isFlipped && (
        <div className="mt-8 grid grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <button 
            onClick={handleNext}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800 transition-all"
          >
            <span className="text-lg font-bold">Hard</span>
            <span className="text-xs opacity-75">Review soon</span>
          </button>
          <button 
             onClick={handleNext}
             className="flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800 transition-all"
          >
            <span className="text-lg font-bold">Good</span>
            <span className="text-xs opacity-75">Review later</span>
          </button>
          <button 
             onClick={handleNext}
             className="flex flex-col items-center gap-2 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-800 transition-all"
          >
            <span className="text-lg font-bold">Easy</span>
            <span className="text-xs opacity-75">Review in 4d</span>
          </button>
        </div>
      )}
      
      {/* Helper styles for 3d flip card */}
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};

export default Flashcards;