import React, { useState, useEffect } from 'react';
import { Concept } from '../types';
import { generateRecallQuestion, evaluateAnswer } from '../services/geminiService';
import { BrainCircuit, Check, X, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

interface ActiveRecallProps {
  concept: Concept;
  onComplete: (success: boolean) => void;
}

const ActiveRecall: React.FC<ActiveRecallProps> = ({ concept, onComplete }) => {
  const [question, setQuestion] = useState<string>('');
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; feedback: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadQuestion = async () => {
      setLoading(true);
      const q = await generateRecallQuestion(concept.title, concept.description);
      if (mounted) {
        setQuestion(q);
        setLoading(false);
      }
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
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400 dark:text-slate-500 animate-pulse">
        <BrainCircuit className="w-16 h-16 mb-4 opacity-50" />
        <p className="font-medium">Generating recall prompt...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Concept Header Context */}
      <div className="mb-8 text-center">
        <span className="inline-block px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-bold uppercase tracking-wider mb-2">
          Active Recall
        </span>
        <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-white">{concept.title}</h2>
      </div>

      {/* Question Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 mb-8 relative overflow-hidden transition-colors">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-500"></div>
        <div className="mb-6 text-lg font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
          <MarkdownRenderer content={question} />
        </div>
        
        {!feedback ? (
          <div className="space-y-4">
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type your explanation here. Don't worry about being perfect, focus on understanding."
              className="w-full h-32 p-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-800 focus:border-primary-300 focus:ring-4 focus:ring-primary-50 dark:focus:ring-primary-900/20 transition-all outline-none resize-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
            />
            <div className="flex justify-end">
                <button
                onClick={handleSubmit}
                disabled={evaluating || !userAnswer.trim()}
                className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
                >
                {evaluating ? (
                    <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                    </>
                ) : (
                    <>
                    Submit Answer
                    <ArrowRight className="w-4 h-4" />
                    </>
                )}
                </button>
            </div>
          </div>
        ) : (
          <div className={`mt-6 p-6 rounded-xl border ${feedback.isCorrect ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-full shrink-0 ${feedback.isCorrect ? 'bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-200' : 'bg-amber-100 dark:bg-amber-800 text-amber-600 dark:text-amber-200'}`}>
                {feedback.isCorrect ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
              </div>
              <div className="w-full">
                <h4 className={`font-bold mb-1 ${feedback.isCorrect ? 'text-green-800 dark:text-green-200' : 'text-amber-800 dark:text-amber-200'}`}>
                  {feedback.isCorrect ? "Excellent Conceptual Grasp" : "Needs Refinement"}
                </h4>
                <div className={`text-sm leading-relaxed ${feedback.isCorrect ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'}`}>
                  <MarkdownRenderer content={feedback.feedback} />
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => onComplete(feedback.isCorrect)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium shadow-sm transition-all"
              >
                {feedback.isCorrect ? "Continue Learning" : "Review Concept"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="text-center">
         <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3" />
            AI evaluates conceptual depth, not keywords.
         </p>
      </div>
    </div>
  );
};

export default ActiveRecall;