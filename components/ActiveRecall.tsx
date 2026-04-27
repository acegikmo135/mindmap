import React, { useState, useEffect } from 'react';
import { Concept } from '../types';
import { generateRecallQuestion, evaluateAnswer } from '../services/geminiService';
import { Loader2 } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

interface ActiveRecallProps {
  concept: Concept;
  onComplete: (success: boolean) => void;
}

const ActiveRecall: React.FC<ActiveRecallProps> = ({ concept, onComplete }) => {
  const [question, setQuestion]     = useState<string>('');
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [loading, setLoading]       = useState<boolean>(true);
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [feedback, setFeedback]     = useState<{ isCorrect: boolean; feedback: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadQuestion = async () => {
      setLoading(true);
      const q = await generateRecallQuestion(concept.title, concept.description);
      if (mounted) { setQuestion(q); setLoading(false); }
    };
    loadQuestion();
    return () => { mounted = false; };
  }, [concept]);

  const handleSubmit = async () => {
    if (!userAnswer.trim()) return;
    setEvaluating(true);
    const result = await evaluateAnswer(question, userAnswer, concept.title);
    setFeedback(result);
    setEvaluating(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] animate-pulse">
        <div className="w-20 h-20 primary-gradient rounded-full flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-white text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
        </div>
        <p className="text-secondary font-medium">Generating recall prompt…</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 pb-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-primary text-xs font-bold uppercase tracking-wider mb-3">
          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
          Active Recall
        </span>
        <h2 className="font-headline text-4xl text-on-surface">{concept.title}</h2>
      </div>

      {/* Question Card */}
      <div className="bg-surface-container-lowest rounded-2xl p-8 mb-6 relative overflow-hidden"
        style={{ boxShadow: '0 4px 24px rgba(15,23,42,0.06)', outline: '1px solid rgba(199,196,216,0.15)' }}>
        <div className="absolute top-0 left-0 w-1.5 h-full primary-gradient rounded-l-2xl"></div>
        <div className="mb-6 text-base font-medium text-on-surface leading-relaxed">
          <MarkdownRenderer content={question} />
        </div>

        {!feedback ? (
          <div className="space-y-4">
            <textarea
              value={userAnswer}
              onChange={e => setUserAnswer(e.target.value)}
              placeholder="Type your explanation here. Don't worry about being perfect, focus on understanding."
              className="w-full h-32 p-4 rounded-xl bg-surface-container text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none text-sm"
              style={{ border: 'none' }}
            />
            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={evaluating || !userAnswer.trim()}
                className="flex items-center gap-2 px-6 py-3 primary-gradient text-on-primary rounded-xl font-semibold shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {evaluating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</>
                ) : (
                  <><span>Submit Answer</span><span className="material-symbols-outlined text-[18px]">arrow_forward</span></>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className={`mt-6 p-6 rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 ${
            feedback.isCorrect ? 'bg-green-50' : 'bg-amber-50'
          }`}>
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                feedback.isCorrect ? 'bg-green-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
              }`}>
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {feedback.isCorrect ? 'check_circle' : 'pending'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`font-bold mb-1 ${feedback.isCorrect ? 'text-emerald-800' : 'text-amber-800'}`}>
                  {feedback.isCorrect ? 'Excellent Conceptual Grasp' : 'Needs Refinement'}
                </h4>
                <div className={`text-sm leading-relaxed ${feedback.isCorrect ? 'text-emerald-700' : 'text-amber-700'}`}>
                  <MarkdownRenderer content={feedback.feedback} />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => onComplete(feedback.isCorrect)}
                className="flex items-center gap-2 px-5 py-2.5 bg-surface-container-lowest rounded-xl text-sm font-semibold text-on-surface transition-all hover:bg-surface-container"
                style={{ outline: '1px solid rgba(199,196,216,0.4)' }}
              >
                {feedback.isCorrect ? 'Continue Learning' : 'Review Concept'}
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="text-center">
        <p className="text-xs text-secondary flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
          AI evaluates conceptual depth, not keywords.
        </p>
      </div>
    </div>
  );
};

export default ActiveRecall;
