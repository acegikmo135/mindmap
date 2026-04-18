import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Chapter, QuizQuestion, QuizType } from '../types';
import { generateQuiz } from '../services/geminiService';
import { saveQuizResult, getQuizHistory, QuizResult } from '../services/db';
import { useAuth } from '../contexts/AuthContext';
import {
  Sparkles, Loader2, CheckCircle2, XCircle, ChevronRight,
  Trophy, Star, RotateCcw, ListChecks, Pen, Shuffle, AlignLeft,
  Clock, Minus, Plus,
} from 'lucide-react';

const PTS_CORRECT = 10;
const PTS_BONUS   = 25;

// ── Find the index of the correct option (used for display + checking) ────────
// Handles: exact normalised match, letter keys "A"–"D", substring fallback
function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function findCorrectIdx(options: string[], answer: string): number {
  if (!answer || !answer.trim()) return -1;

  // Strip common prefixes like "A)" "A." "1)" "1."
  const stripped = answer.replace(/^[A-Da-d1-4][.)]\s*/, '').trim();

  // 1. Normalised full-text match (try original first, then stripped)
  for (const candidate of [answer, stripped]) {
    const nc = norm(candidate);
    const idx = options.findIndex(o => norm(o) === nc);
    if (idx !== -1) return idx;
  }

  // 2. Answer is exactly a letter "A"–"D"
  const letter = answer.trim().toUpperCase();
  if (/^[A-D]$/.test(letter)) return letter.charCodeAt(0) - 65;

  // 3. Substring fallback (stripped answer vs options)
  const ns = norm(stripped);
  const bySub = options.findIndex(o => norm(o).includes(ns) || ns.includes(norm(o)));
  return bySub;
}

// Alias kept so call-sites don't need changing; debug logs removed from production.
const findCorrectIdxDebug = findCorrectIdx;

function checkFIB(userAns: string, answer: string): boolean {
  return norm(userAns) === norm(answer);
}

function checkMatchPair(userRight: string, correctRight: string): boolean {
  return norm(userRight) === norm(correctRight);
}

// Fisher-Yates shuffle — unbiased unlike .sort(Math.random - 0.5)
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Feedback banner ────────────────────────────────────────────────────────────
const FeedbackBox: React.FC<{ correct: boolean; message?: string }> = ({ correct, message }) => (
  <div className={`mt-5 p-4 rounded-2xl flex items-start gap-3 border
    ${correct
      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      : 'bg-red-50   dark:bg-red-900/20   border-red-200   dark:border-red-800'
    }`}>
    {correct
      ? <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
      : <XCircle      className="w-5 h-5 text-red-500   dark:text-red-400   shrink-0 mt-0.5" />
    }
    <div className="min-w-0">
      <p className={`font-bold text-sm ${correct ? 'text-green-700 dark:text-green-300' : 'text-red-600 dark:text-red-400'}`}>
        {correct ? `Correct! +${PTS_CORRECT} pts` : 'Wrong'}
      </p>
      {message && (
        <p className={`text-sm mt-0.5 leading-relaxed ${correct ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
          {message}
        </p>
      )}
    </div>
  </div>
);

// ── MCQ — uses INDEX for selection, never text comparison ─────────────────────
const MCQQuestion: React.FC<{
  q: QuizQuestion;
  selected: number | null;   // index of selected option
  submitted: boolean;
  onSelect: (i: number) => void;
}> = ({ q, selected, submitted, onSelect }) => {
  const opts       = q.options ?? [];
  const correctIdx = useMemo(() => findCorrectIdxDebug(opts, q.answer ?? ''), [opts, q.answer]);

  return (
    <div className="space-y-3">
      {opts.map((opt, i) => {
        const isCorrect  = i === correctIdx;
        const isSelected = i === selected;

        let cls = 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary-400';
        if (submitted) {
          if (isCorrect)                cls = 'border-green-500 bg-green-50 dark:bg-green-900/20';
          else if (isSelected)          cls = 'border-red-400   bg-red-50   dark:bg-red-900/20';
          else                          cls = 'border-slate-200 dark:border-slate-700 opacity-50';
        } else if (isSelected) {
          cls = 'border-primary-500 bg-primary-50 dark:bg-primary-900/20';
        }

        return (
          <button
            key={i}
            disabled={submitted}
            onClick={() => onSelect(i)}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${cls}`}
          >
            <span className="w-6 h-6 shrink-0 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold">
              {String.fromCharCode(65 + i)}
            </span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex-1">{opt}</span>
            {submitted && isCorrect   && <CheckCircle2 className="ml-auto w-5 h-5 text-green-500 shrink-0" />}
            {submitted && isSelected && !isCorrect && <XCircle className="ml-auto w-5 h-5 text-red-500 shrink-0" />}
          </button>
        );
      })}
    </div>
  );
};

// ── FIB ───────────────────────────────────────────────────────────────────────
const FIBQuestion: React.FC<{
  q: QuizQuestion;
  value: string;
  submitted: boolean;
  correct: boolean | null;
  onChange: (v: string) => void;
}> = ({ q, value, submitted, correct, onChange }) => {
  const parts = q.question.split('___');
  return (
    <div>
      <p className="text-slate-700 dark:text-slate-200 text-base mb-4 leading-relaxed">
        {parts[0]}
        <span className={`inline-block mx-1 px-2 py-0.5 rounded border-b-2 font-mono text-sm min-w-[80px] text-center
          ${submitted
            ? correct
              ? 'border-green-500 bg-green-50   dark:bg-green-900/20 text-green-700 dark:text-green-300'
              : 'border-red-400   bg-red-50     dark:bg-red-900/20   text-red-700   dark:text-red-300'
            : 'border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
          }`}>
          {submitted && !correct && q.answer ? q.answer : (value || '?')}
        </span>
        {parts[1]}
      </p>
      <input
        type="text"
        value={value}
        disabled={submitted}
        onChange={e => onChange(e.target.value)}
        placeholder="Type your answer…"
        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800
          focus:border-primary-400 focus:ring-4 focus:ring-primary-50 dark:focus:ring-primary-900/20
          outline-none transition-all text-slate-800 dark:text-slate-100 disabled:opacity-70"
      />
    </div>
  );
};

// ── MATCH ─────────────────────────────────────────────────────────────────────
const MatchQuestion: React.FC<{
  q: QuizQuestion;
  pairs: Record<string, string>;
  submitted: boolean;
  onPair:   (left: string, right: string) => void;
  onUnpair: (left: string) => void;
}> = ({ q, pairs, submitted, onPair, onUnpair }) => {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

  const correctMap = useMemo(
    () => Object.fromEntries((q.pairs ?? []).map(p => [p.left, p.right])),
    [q.pairs]
  );
  const rightItems  = useMemo(() => shuffle(q.pairs?.map(p => p.right) ?? []), [q.pairs]);
  const usedRight   = new Set(Object.values(pairs));

  const handleLeft = (item: string) => {
    if (submitted) return;
    if (pairs[item]) { onUnpair(item); setSelectedLeft(null); return; }
    setSelectedLeft(prev => prev === item ? null : item);
  };

  const handleRight = (item: string) => {
    if (submitted || !selectedLeft || usedRight.has(item)) return;
    onPair(selectedLeft, item);
    setSelectedLeft(null);
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Terms</p>
          {q.pairs?.map(p => {
            const matched   = pairs[p.left];
            const isSel     = selectedLeft === p.left;
            const pairOk    = submitted && matched && checkMatchPair(matched, correctMap[p.left]);
            const pairWrong = submitted && matched && !checkMatchPair(matched, correctMap[p.left]);
            const unpaired  = submitted && !matched;
            return (
              <button key={p.left} onClick={() => handleLeft(p.left)} disabled={submitted}
                className={`w-full px-3 py-2.5 rounded-xl border-2 text-left text-sm font-medium transition-all
                  ${pairOk    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                  : pairWrong ? 'border-red-400   bg-red-50   dark:bg-red-900/20   text-red-700   dark:text-red-300'
                  : unpaired  ? 'border-slate-300 bg-slate-50 dark:bg-slate-800 text-slate-400 opacity-60'
                  : isSel     ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : matched   ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-primary-300'
                  }`}>
                {p.left}
                {matched && <span className="block text-[10px] opacity-70 mt-0.5">→ {matched}</span>}
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Meanings</p>
          {rightItems.map(item => {
            const isUsed      = usedRight.has(item);
            const matchedLeft = Object.keys(pairs).find(k => norm(pairs[k]) === norm(item));
            const pairOk      = submitted && matchedLeft && checkMatchPair(pairs[matchedLeft], correctMap[matchedLeft]);
            const pairWrong   = submitted && matchedLeft && !checkMatchPair(pairs[matchedLeft], correctMap[matchedLeft]);
            const canClick    = !submitted && !!selectedLeft && !isUsed;
            return (
              <button key={item} onClick={() => handleRight(item)}
                disabled={submitted || (isUsed && !selectedLeft)}
                className={`w-full px-3 py-2.5 rounded-xl border-2 text-left text-sm transition-all
                  ${pairOk    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                  : pairWrong ? 'border-red-400   bg-red-50   dark:bg-red-900/20   text-red-700   dark:text-red-300'
                  : isUsed    ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 opacity-60'
                  : canClick  ? 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-primary-400 hover:bg-primary-50/40'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 opacity-70'
                  }`}>
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {submitted && (
        <div className="mt-4 space-y-1.5">
          {q.pairs?.map(p => {
            const userRight = pairs[p.left] ?? '(not matched)';
            const ok        = checkMatchPair(userRight, p.right);
            return (
              <div key={p.left} className={`flex items-start gap-2 text-xs px-3 py-2 rounded-lg
                ${ok ? 'bg-green-50 dark:bg-green-900/10' : 'bg-red-50 dark:bg-red-900/10'}`}>
                {ok
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                  : <XCircle      className="w-3.5 h-3.5 text-red-400   shrink-0 mt-0.5" />}
                <span className={ok ? 'text-green-700 dark:text-green-300' : 'text-red-600 dark:text-red-400'}>
                  <strong>{p.left}</strong>
                  {ok ? ` → ${p.right}`
                    : <> → <span className="line-through opacity-60">{userRight}</span>
                        <span className="font-bold"> Correct: {p.right}</span></>}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Main Quiz component ───────────────────────────────────────────────────────
const Quiz: React.FC<{ chapter: Chapter; onPointsEarned?: (pts: number) => void }> = ({ chapter, onPointsEarned }) => {
  const { user } = useAuth();

  const [quizType,      setQuizType]      = useState<QuizType>('MCQ');
  const [questionCount, setQuestionCount] = useState(5);
  const [phase,         setPhase]         = useState<'config' | 'loading' | 'playing' | 'results'>('config');
  const [questions,     setQuestions]     = useState<QuizQuestion[]>([]);
  const [currentIdx,    setCurrentIdx]    = useState(0);
  const [submitted,     setSubmitted]     = useState(false);
  const [scores,        setScores]        = useState<boolean[]>([]);
  // BUG-001 fix: ref always reflects latest scores so handleNext never reads stale closure.
  const scoresRef = useRef<boolean[]>([]);
  const [totalPoints,   setTotalPoints]   = useState(0);
  const [history,       setHistory]       = useState<QuizResult[]>([]);

  // Per-question answer state
  // mcqSelected stores the OPTION INDEX — avoids all text comparison issues
  const [mcqSelected, setMcqSelected] = useState<number | null>(null);
  const [fibValue,    setFibValue]    = useState('');
  const [matchPairs,  setMatchPairs]  = useState<Record<string, string>>({});
  const [lastCorrect, setLastCorrect] = useState(false);

  // Fetch quiz history when results phase starts
  useEffect(() => {
    if (phase === 'results' && user) {
      getQuizHistory(user.id, chapter.id).then(setHistory);
    }
  }, [phase, user, chapter.id]);

  const resetAnswers = () => {
    setMcqSelected(null);
    setFibValue('');
    setMatchPairs({});
    setSubmitted(false);
    setLastCorrect(false);
  };

  // ── Generate ─────────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    setPhase('loading');
    const qs = await generateQuiz(chapter.title, chapter.concepts.map(c => c.title), quizType, questionCount);
    if (!qs || qs.length === 0) { setPhase('config'); return; }
    setQuestions(qs);
    setCurrentIdx(0);
    setScores([]);
    setTotalPoints(0);
    resetAnswers();
    setPhase('playing');
  };

  // ── Submit answer ─────────────────────────────────────────────────────────────
  const handleSubmitAnswer = useCallback(() => {
    const q = questions[currentIdx];
    let correct = false;

    if (q.type === 'MCQ') {
      // Pure index comparison — no text involved
      const correctIdx = findCorrectIdxDebug(q.options ?? [], q.answer ?? '');
      console.log('[MCQ submit] mcqSelected:', mcqSelected, '| correctIdx:', correctIdx, '| match:', mcqSelected === correctIdx);
      correct = mcqSelected !== null && correctIdx !== -1 && mcqSelected === correctIdx;
    } else if (q.type === 'FIB') {
      correct = checkFIB(fibValue, q.answer ?? '');
    } else if (q.type === 'MATCH') {
      correct = (q.pairs ?? []).every(p => checkMatchPair(matchPairs[p.left] ?? '', p.right));
    }

    setLastCorrect(correct);
    setSubmitted(true);
    setScores(prev => {
      const next = [...prev, correct];
      scoresRef.current = next; // keep ref in sync for handleNext
      return next;
    });
  }, [questions, currentIdx, mcqSelected, fibValue, matchPairs]);

  // ── Next / finish ─────────────────────────────────────────────────────────────
  const handleNext = useCallback(async () => {
    const isLast = currentIdx === questions.length - 1;
    if (isLast) {
      // Use ref — guaranteed to have the latest score including the just-submitted answer,
      // even if the React state update from handleSubmitAnswer hasn't re-rendered yet.
      const allScores = scoresRef.current;
      const correctCount  = allScores.filter(Boolean).length;
      const pts           = correctCount * PTS_CORRECT + (correctCount === questions.length ? PTS_BONUS : 0);
      setTotalPoints(pts);
      setPhase('results');
      if (user) {
        await saveQuizResult(user.id, chapter.id, chapter.title, quizType, correctCount, questions.length, pts);
        onPointsEarned?.(pts);
      }
    } else {
      setCurrentIdx(i => i + 1);
      resetAnswers();
    }
  }, [currentIdx, questions, scores, user, chapter, quizType, onPointsEarned]);

  // ── Can submit ────────────────────────────────────────────────────────────────
  const canSubmit = (() => {
    const q = questions[currentIdx];
    if (!q) return false;
    if (q.type === 'MCQ')   return mcqSelected !== null;
    if (q.type === 'FIB')   return fibValue.trim().length > 0;
    if (q.type === 'MATCH') return Object.keys(matchPairs).length === (q.pairs?.length ?? 3);
    return false;
  })();

  // ── Feedback message ──────────────────────────────────────────────────────────
  const feedbackMessage = (): string | undefined => {
    if (!submitted || lastCorrect) return undefined;
    const q = questions[currentIdx];
    if (!q) return undefined;
    if (q.type === 'MCQ') {
      const opts       = q.options ?? [];
      const idx        = findCorrectIdx(opts, q.answer ?? '');
      const correctTxt = idx !== -1 ? opts[idx] : q.answer;
      return correctTxt ? `Correct answer: "${correctTxt}"` : 'See the highlighted option above.';
    }
    if (q.type === 'FIB') {
      return q.answer ? `The answer is: "${q.answer}"` : undefined;
    }
    if (q.type === 'MATCH') return 'Correct pairings are shown below.';
    return undefined;
  };

  const TOTAL = questions.length || questionCount;

  // ════════════════════════════════════════════════════════════════════════════
  // CONFIG
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === 'config') {
    const types: { type: QuizType; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
      { type: 'MCQ',   label: 'Multiple Choice',    desc: '4-option questions',    icon: <ListChecks className="w-5 h-5" />, color: 'blue'   },
      { type: 'FIB',   label: 'Fill in the Blank',  desc: 'Complete the sentence', icon: <Pen        className="w-5 h-5" />, color: 'purple' },
      { type: 'MATCH', label: 'Match the Following', desc: 'Connect the pairs',    icon: <AlignLeft  className="w-5 h-5" />, color: 'teal'   },
      { type: 'MIXED', label: 'Mixed',               desc: 'All types together',   icon: <Shuffle    className="w-5 h-5" />, color: 'orange' },
    ];
    const colorMap: Record<string, string> = {
      blue:   'border-blue-500   bg-blue-50   dark:bg-blue-900/20   text-blue-600   dark:text-blue-400',
      purple: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
      teal:   'border-teal-500   bg-teal-50   dark:bg-teal-900/20   text-teal-600   dark:text-teal-400',
      orange: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    };

    return (
      <div className="max-w-2xl mx-auto py-8 px-4 animate-in fade-in duration-500">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-800 dark:text-white mb-2">Quiz Time!</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{PTS_CORRECT} pts per correct · +{PTS_BONUS} bonus for perfect score</p>
        </div>

        {/* Question type */}
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Question Type</p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {types.map(t => (
            <button key={t.type} onClick={() => setQuizType(t.type)}
              className={`flex flex-col items-start p-4 rounded-2xl border-2 text-left transition-all
                ${quizType === t.type ? colorMap[t.color] : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'}`}>
              <div className={`mb-3 ${quizType === t.type ? '' : 'text-slate-400'}`}>{t.icon}</div>
              <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{t.label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.desc}</p>
            </button>
          ))}
        </div>

        {/* Question count */}
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Number of Questions</p>
        <div className="flex items-center gap-4 mb-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
          <button
            onClick={() => setQuestionCount(n => Math.max(1, n - 1))}
            className="w-9 h-9 rounded-xl border-2 border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all disabled:opacity-40"
            disabled={questionCount <= 1}
          >
            <Minus className="w-4 h-4" />
          </button>
          <div className="flex-1 text-center">
            <span className="text-3xl font-bold text-slate-800 dark:text-white">{questionCount}</span>
            <p className="text-xs text-slate-400 mt-0.5">question{questionCount !== 1 ? 's' : ''} · max 5</p>
          </div>
          <button
            onClick={() => setQuestionCount(n => Math.min(5, n + 1))}
            className="w-9 h-9 rounded-xl border-2 border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all disabled:opacity-40"
            disabled={questionCount >= 5}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <button onClick={handleGenerate}
          className="w-full flex items-center justify-center gap-2 py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl shadow-lg transition-all text-lg">
          <Sparkles className="w-5 h-5" />Generate Quiz
        </button>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // LOADING
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === 'loading') {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-6 px-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center gen-pulse">
            <Trophy className="w-10 h-10 text-yellow-500" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="font-bold text-slate-700 dark:text-slate-200 text-lg">Crafting your quiz…</p>
          <p className="text-sm text-slate-400 dark:text-slate-500">Thinking of the best {questionCount} question{questionCount !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          {Array.from({ length: questionCount }).map((_, i) => (
            <div
              key={i}
              className="w-8 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden"
            >
              <div
                className="h-full bg-primary-400 rounded-full"
                style={{
                  animation: `gen-pulse 1.8s ease-in-out infinite`,
                  animationDelay: `${i * 180}ms`,
                  width: '100%',
                }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // RESULTS
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === 'results') {
    const correctCount = scores.filter(Boolean).length;
    const pct          = Math.round((correctCount / TOTAL) * 100);
    const perfect      = correctCount === TOTAL;

    return (
      <div className="max-w-lg mx-auto py-10 px-4 animate-in fade-in zoom-in-95 duration-500">
        <div className={`rounded-3xl p-8 text-center mb-6 border
          ${pct >= 80 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : pct >= 50 ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
          :             'bg-red-50   dark:bg-red-900/20   border-red-200   dark:border-red-800'}`}>
          <div className="text-6xl mb-4">{pct === 100 ? '🏆' : pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪'}</div>
          <h2 className="text-3xl font-serif font-bold text-slate-800 dark:text-white mb-1">{correctCount}/{TOTAL} Correct</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">{pct}% accuracy</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-4 py-2 rounded-full font-bold text-lg">
              <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />+{totalPoints} pts
            </div>
            {perfect && (
              <div className="flex items-center gap-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-2 rounded-full text-sm font-bold">
                <Trophy className="w-4 h-4" />Perfect Bonus!
              </div>
            )}
          </div>
        </div>

        {/* Per-question breakdown */}
        <div className="space-y-2 mb-6">
          {questions.map((q, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border
              ${scores[i]
                ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'
                : 'border-red-200   dark:border-red-800   bg-red-50/50   dark:bg-red-900/10'}`}>
              {scores[i]
                ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                : <XCircle      className="w-5 h-5 text-red-400   shrink-0" />}
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold">{q.type}</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{q.question.replace('___', '_____')}</p>
                {!scores[i] && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">
                    {q.type === 'MATCH'
                      ? q.pairs?.map(p => `${p.left} → ${p.right}`).join(' | ')
                      : q.answer
                        ? <>Answer: <strong>{q.answer}</strong></>
                        : null
                    }
                  </p>
                )}
              </div>
              <span className={`text-xs font-bold shrink-0 ${scores[i] ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
                {scores[i] ? `+${PTS_CORRECT}` : '0'}
              </span>
            </div>
          ))}
        </div>

        {/* Quiz history */}
        {history.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />Recent attempts
            </p>
            <div className="space-y-1.5">
              {history.map((h, i) => {
                const hPct = Math.round((h.score / h.total) * 100);
                return (
                  <div key={h.id} className="flex items-center gap-3 px-3 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                    <span className={`text-xs font-bold w-5 ${i === 0 ? 'text-primary-500' : 'text-slate-400'}`}>#{i + 1}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-medium">{h.quiz_type}</span>
                    <span className="text-xs text-slate-600 dark:text-slate-300 flex-1">{h.score}/{h.total} correct</span>
                    <span className={`text-xs font-bold ${hPct >= 80 ? 'text-green-500' : hPct >= 50 ? 'text-yellow-500' : 'text-red-400'}`}>{hPct}%</span>
                    <span className="text-xs text-yellow-600 dark:text-yellow-400 font-bold">+{h.points_earned}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => { setPhase('config'); setScores([]); setQuestions([]); }}
            className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
            <RotateCcw className="w-4 h-4" />New Quiz
          </button>
          <button onClick={handleGenerate}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl transition-all">
            <Sparkles className="w-4 h-4" />Try Again
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PLAYING
  // ════════════════════════════════════════════════════════════════════════════
  const q = questions[currentIdx];
  if (!q) return null;

  const fibCorrect = submitted ? checkFIB(fibValue, q.answer ?? '') : null;

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 animate-in fade-in duration-300">

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Question {currentIdx + 1} of {TOTAL}</span>
          <span className="text-xs font-bold text-slate-400">{scores.filter(Boolean).length} correct so far</span>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-primary-500 rounded-full transition-all duration-500"
            style={{ width: `${(currentIdx / TOTAL) * 100}%` }} />
        </div>
      </div>

      {/* Question card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-6">
        <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-4
          ${q.type === 'MCQ'   ? 'bg-blue-100   dark:bg-blue-900/30   text-blue-700   dark:text-blue-300'
          : q.type === 'FIB'   ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
          :                      'bg-teal-100   dark:bg-teal-900/30   text-teal-700   dark:text-teal-300'}`}>
          {q.type === 'MCQ' ? 'Multiple Choice' : q.type === 'FIB' ? 'Fill in the Blank' : 'Match the Following'}
        </span>

        {q.type !== 'FIB' && (
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-5 leading-snug">{q.question}</h3>
        )}

        {q.type === 'MCQ' && (
          <MCQQuestion q={q} selected={mcqSelected} submitted={submitted} onSelect={setMcqSelected} />
        )}
        {q.type === 'FIB' && (
          <FIBQuestion q={q} value={fibValue} submitted={submitted} correct={fibCorrect} onChange={setFibValue} />
        )}
        {q.type === 'MATCH' && (
          <MatchQuestion q={q} pairs={matchPairs} submitted={submitted}
            onPair={(l, r) => setMatchPairs(prev => ({ ...prev, [l]: r }))}
            onUnpair={l   => setMatchPairs(prev => { const n = { ...prev }; delete n[l]; return n; })}
          />
        )}

        {submitted && q.type !== 'MATCH' && (
          <FeedbackBox correct={lastCorrect} message={feedbackMessage()} />
        )}
        {submitted && q.type === 'MATCH' && (
          <div className={`mt-4 flex items-center gap-2 text-sm font-bold
            ${lastCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
            {lastCorrect
              ? <><CheckCircle2 className="w-4 h-4" />All pairs correct! +{PTS_CORRECT} pts</>
              : <><XCircle      className="w-4 h-4" />Correct pairings shown above</>}
          </div>
        )}
      </div>

      {/* Action buttons */}
      {!submitted ? (
        <button onClick={handleSubmitAnswer} disabled={!canSubmit}
          className="w-full py-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white font-bold rounded-2xl transition-all">
          Submit Answer
        </button>
      ) : (
        <button onClick={handleNext}
          className="w-full flex items-center justify-center gap-2 py-4 bg-slate-800 dark:bg-slate-100 hover:bg-slate-700 dark:hover:bg-white text-white dark:text-slate-900 font-bold rounded-2xl transition-all">
          {currentIdx === TOTAL - 1
            ? <><Trophy className="w-4 h-4" />See Results</>
            : <><ChevronRight className="w-4 h-4" />Next Question</>}
        </button>
      )}
    </div>
  );
};

export default Quiz;
