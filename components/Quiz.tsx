import React, { useState, useCallback, useMemo, useEffect, useRef, useLayoutEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { Chapter, QuizQuestion, QuizType } from '../types';
import { saveQuizResult, getQuizHistory, getQuizFromCache, QuizResult } from '../services/db';
import { useAuth } from '../contexts/AuthContext';
import MarkdownRenderer from './MarkdownRenderer';
import {
  Sparkles, Loader2, CheckCircle2, XCircle, ChevronRight,
  Trophy, Star, RotateCcw, ListChecks, Pen, Shuffle, AlignLeft,
  Clock, Minus, Plus,
} from 'lucide-react';

const PTS_CORRECT = 10;
const PTS_BONUS   = 25;

// Gemini double-escapes LaTeX backslashes in JSON (\\times → \times for KaTeX)
const fixLatex = (text: string) => text.replace(/\\\\([a-zA-Z{])/g, '\\$1');

// Inline KaTeX renderer — no paragraph wrapper, safe inside buttons/spans
const QText: React.FC<{ text: string }> = ({ text }) => (
  <ReactMarkdown
    remarkPlugins={[remarkMath, remarkGfm]}
    rehypePlugins={[rehypeKatex]}
    components={{ p: ({ children }) => <>{children}</> }}
  >
    {fixLatex(text)}
  </ReactMarkdown>
);

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function findCorrectIdx(options: string[], answer: string): number {
  if (!answer || !answer.trim()) return -1;
  const stripped = answer.replace(/^[A-Da-d1-4][.)]\s*/, '').trim();
  for (const candidate of [answer, stripped]) {
    const nc = norm(candidate);
    const idx = options.findIndex(o => norm(o) === nc);
    if (idx !== -1) return idx;
  }
  const letter = answer.trim().toUpperCase();
  if (/^[A-D]$/.test(letter)) return letter.charCodeAt(0) - 65;
  const ns = norm(stripped);
  return options.findIndex(o => norm(o).includes(ns) || ns.includes(norm(o)));
}

const findCorrectIdxDebug = findCorrectIdx;

function checkFIB(userAns: string, answer: string): boolean {
  return norm(userAns) === norm(answer);
}

function checkMatchPair(userRight: string, correctRight: string): boolean {
  return norm(userRight) === norm(correctRight);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Feedback banner ────────────────────────────────────────────────────────────
const FeedbackBox: React.FC<{ correct: boolean; message?: React.ReactNode }> = ({ correct, message }) => (
  <div className={`mt-5 p-4 rounded-2xl flex items-start gap-3
    ${correct ? 'bg-green-50' : 'bg-error-container/30'}`}>
    {correct
      ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
      : <XCircle      className="w-5 h-5 text-error       shrink-0 mt-0.5" />
    }
    <div className="min-w-0">
      <p className={`font-bold text-sm ${correct ? 'text-emerald-700' : 'text-error'}`}>
        {correct ? `Correct! +${PTS_CORRECT} pts` : 'Wrong'}
      </p>
      {message && (
        <div className={`text-sm mt-0.5 leading-relaxed ${correct ? 'text-emerald-600' : 'text-on-error-container'}`}>
          {message}
        </div>
      )}
    </div>
  </div>
);

// ── MCQ ────────────────────────────────────────────────────────────────────────
const MCQQuestion: React.FC<{
  q: QuizQuestion;
  selected: number | null;
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

        let cls = 'border-outline-variant bg-surface-container-lowest hover:border-primary hover:bg-surface-container-low';
        if (submitted) {
          if (isCorrect)       cls = 'border-green-500 bg-green-50/50';
          else if (isSelected) cls = 'border-error     bg-error-container/30';
          else                 cls = 'border-outline-variant opacity-50';
        } else if (isSelected) {
          cls = 'border-primary bg-indigo-50/30';
        }

        return (
          <button
            key={i}
            disabled={submitted}
            onClick={() => onSelect(i)}
            className={`w-full flex items-center gap-3 p-5 rounded-xl border-2 text-left transition-all ${cls}`}
          >
            <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center shrink-0 bg-white">
              <span className="text-xs font-bold">{String.fromCharCode(65 + i)}</span>
            </div>
            <span className="text-sm font-medium text-on-surface flex-1">
              <QText text={opt} />
            </span>
            {submitted && isCorrect && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-green-100 rounded-full ml-auto">
                <span className="text-[10px] font-bold text-green-700 uppercase">Correct</span>
              </span>
            )}
            {submitted && isSelected && !isCorrect && (
              <span className="text-[10px] font-bold text-error uppercase ml-auto">Your Choice</span>
            )}
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
      <p className="text-on-surface text-base mb-4 leading-relaxed">
        <QText text={parts[0]} />
        <span className={`inline-block mx-1 px-2 py-0.5 rounded border-b-2 font-mono text-sm min-w-[80px] text-center
          ${submitted
            ? correct
              ? 'border-green-500 bg-green-50  text-emerald-700'
              : 'border-error    bg-error-container/30 text-error'
            : 'border-primary   bg-primary-fixed text-primary'
          }`}>
          {submitted && !correct && q.answer ? <QText text={q.answer} /> : (value || '?')}
        </span>
        {parts[1] && <QText text={parts[1]} />}
      </p>
      <input
        type="text"
        value={value}
        disabled={submitted}
        onChange={e => onChange(e.target.value)}
        placeholder="Type your answer…"
        className="w-full px-4 py-3 rounded-xl bg-surface-container text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-70"
        style={{ border: '1px solid rgba(199,196,216,0.3)' }}
      />
    </div>
  );
};

// ── MATCH — SVG connecting lines ───────────────────────────────────────────────
interface LineCoord { key: string; x1: number; y1: number; x2: number; y2: number; stroke: string }

const MatchQuestion: React.FC<{
  q: QuizQuestion;
  pairs: Record<string, string>;
  submitted: boolean;
  onPair:   (left: string, right: string) => void;
  onUnpair: (left: string) => void;
}> = ({ q, pairs, submitted, onPair, onUnpair }) => {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const leftRefs  = useRef<Map<string, HTMLButtonElement>>(new Map());
  const rightRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [lineCoords, setLineCoords] = useState<LineCoord[]>([]);

  const correctMap = useMemo(
    () => Object.fromEntries((q.pairs ?? []).map(p => [p.left, p.right])),
    [q.pairs]
  );
  const rightItems = useMemo(() => shuffle(q.pairs?.map(p => p.right) ?? []), [q.pairs]);
  const usedRight  = new Set(Object.values(pairs));

  // Measure DOM positions and compute SVG line coords after every relevant render
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const cr = containerRef.current.getBoundingClientRect();
    const newLines: LineCoord[] = Object.entries(pairs).map(([left, right]) => {
      const leftEl  = leftRefs.current.get(left);
      const rightEl = rightRefs.current.get(right);
      if (!leftEl || !rightEl) return null!;
      const lr = leftEl.getBoundingClientRect();
      const rr = rightEl.getBoundingClientRect();
      const stroke = !submitted
        ? '#818cf8'
        : checkMatchPair(right, correctMap[left] ?? '') ? '#22c55e' : '#ef4444';
      return {
        key: left,
        x1: lr.right  - cr.left, y1: lr.top + lr.height / 2 - cr.top,
        x2: rr.left   - cr.left, y2: rr.top + rr.height / 2 - cr.top,
        stroke,
      };
    }).filter(Boolean);
    setLineCoords(newLines);
  }, [pairs, submitted, correctMap]);

  const handleLeft = (item: string) => {
    if (submitted) return;
    if (pairs[item]) { onUnpair(item); return; }
    setSelectedLeft(prev => prev === item ? null : item);
  };

  const handleRight = (item: string) => {
    if (submitted || !selectedLeft || usedRight.has(item)) return;
    onPair(selectedLeft, item);
    setSelectedLeft(null);
  };

  return (
    <div>
      {/* Instruction hint */}
      {!submitted && (
        <p className="text-xs text-secondary mb-3 text-center">
          {selectedLeft
            ? <span className="text-primary font-medium">Now tap a meaning to connect →</span>
            : 'Tap a term on the left, then tap its meaning on the right'}
        </p>
      )}

      <div ref={containerRef} className="relative">
        {/* SVG bezier connecting lines */}
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ width: '100%', height: '100%', overflow: 'visible', zIndex: 5 }}
        >
          {lineCoords.map(line => {
            const mx = (line.x1 + line.x2) / 2;
            return (
              <g key={line.key}>
                <path
                  d={`M ${line.x1} ${line.y1} C ${mx} ${line.y1}, ${mx} ${line.y2}, ${line.x2} ${line.y2}`}
                  stroke={line.stroke}
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                />
                {/* Endpoint dots */}
                <circle cx={line.x1} cy={line.y1} r="4" fill={line.stroke} />
                <circle cx={line.x2} cy={line.y2} r="4" fill={line.stroke} />
              </g>
            );
          })}
        </svg>

        <div className="grid grid-cols-2 gap-8">
          {/* Left column — Terms */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-1">Terms</p>
            {q.pairs?.map(p => {
              const isMatched = !!pairs[p.left];
              const isSel     = selectedLeft === p.left;
              const pairOk    = submitted && isMatched && checkMatchPair(pairs[p.left], correctMap[p.left]);
              const pairWrong = submitted && isMatched && !checkMatchPair(pairs[p.left], correctMap[p.left]);
              const unpaired  = submitted && !isMatched;
              return (
                <button
                  key={p.left}
                  ref={el => { if (el) leftRefs.current.set(p.left, el); else leftRefs.current.delete(p.left); }}
                  onClick={() => handleLeft(p.left)}
                  disabled={submitted}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all
                    ${pairOk    ? 'border-green-500 bg-green-50  text-emerald-700'
                    : pairWrong ? 'border-error bg-error-container/30 text-error'
                    : unpaired  ? 'border-outline-variant bg-surface-container text-secondary opacity-60'
                    : isMatched ? 'border-primary/60 bg-indigo-50 text-primary'
                    : isSel     ? 'border-primary bg-primary-fixed text-primary shadow-glow ring-2 ring-primary/20'
                    :             'border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary/40 hover:bg-indigo-50/30'
                    }`}
                >
                  <QText text={p.left} />
                </button>
              );
            })}
          </div>

          {/* Right column — Meanings */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-1">Meanings</p>
            {rightItems.map(item => {
              const isUsed      = usedRight.has(item);
              const matchedLeft = Object.keys(pairs).find(k => norm(pairs[k]) === norm(item));
              const pairOk      = submitted && matchedLeft != null && checkMatchPair(pairs[matchedLeft], correctMap[matchedLeft] ?? '');
              const pairWrong   = submitted && matchedLeft != null && !checkMatchPair(pairs[matchedLeft], correctMap[matchedLeft] ?? '');
              const canClick    = !submitted && !!selectedLeft && !isUsed;
              return (
                <button
                  key={item}
                  ref={el => { if (el) rightRefs.current.set(item, el); else rightRefs.current.delete(item); }}
                  onClick={() => handleRight(item)}
                  disabled={submitted || (isUsed && !selectedLeft)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border-2 text-sm transition-all
                    ${pairOk    ? 'border-green-500 bg-green-50  text-emerald-700'
                    : pairWrong ? 'border-error bg-error-container/30 text-error'
                    : isUsed    ? 'border-primary/40 bg-indigo-50/50 text-primary opacity-70'
                    : canClick  ? 'border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary/50 hover:bg-indigo-50/30'
                    :             'border-outline-variant bg-surface-container-lowest text-secondary opacity-70'
                    }`}
                >
                  <QText text={item} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Post-submit answer key */}
      {submitted && (
        <div className="mt-4 space-y-1.5">
          {q.pairs?.map(p => {
            const userRight = pairs[p.left] ?? '(not matched)';
            const ok        = checkMatchPair(userRight, p.right);
            return (
              <div key={p.left} className={`flex items-start gap-2 text-xs px-3 py-2 rounded-lg
                ${ok ? 'bg-green-50' : 'bg-error-container/20'}`}>
                {ok
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  : <XCircle      className="w-3.5 h-3.5 text-error       shrink-0 mt-0.5" />}
                <span className={ok ? 'text-emerald-700' : 'text-error'}>
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
  const scoresRef = useRef<boolean[]>([]);
  const [totalPoints,   setTotalPoints]   = useState(0);
  const [history,       setHistory]       = useState<QuizResult[]>([]);

  const [mcqSelected, setMcqSelected] = useState<number | null>(null);
  const [fibValue,    setFibValue]    = useState('');
  const [matchPairs,  setMatchPairs]  = useState<Record<string, string>>({});
  const [lastCorrect, setLastCorrect] = useState(false);

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

  // ── Generate (from cache) ─────────────────────────────────────────────────────
  const handleGenerate = async () => {
    setPhase('loading');
    const qs = await getQuizFromCache(chapter.id, quizType, questionCount);
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
      const correctIdx = findCorrectIdxDebug(q.options ?? [], q.answer ?? '');
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
      scoresRef.current = next;
      return next;
    });
  }, [questions, currentIdx, mcqSelected, fibValue, matchPairs]);

  // ── Next / finish ─────────────────────────────────────────────────────────────
  const handleNext = useCallback(async () => {
    const isLast = currentIdx === questions.length - 1;
    if (isLast) {
      const allScores    = scoresRef.current;
      const correctCount = allScores.filter(Boolean).length;
      const pts          = correctCount * PTS_CORRECT + (correctCount === questions.length ? PTS_BONUS : 0);
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
  }, [currentIdx, questions, user, chapter, quizType, onPointsEarned]);

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
  const feedbackMessage = (): React.ReactNode | undefined => {
    if (!submitted || lastCorrect) return undefined;
    const q = questions[currentIdx];
    if (!q) return undefined;
    if (q.type === 'MCQ') {
      const opts       = q.options ?? [];
      const idx        = findCorrectIdx(opts, q.answer ?? '');
      const correctTxt = idx !== -1 ? opts[idx] : q.answer;
      return correctTxt
        ? <span>Correct answer: <QText text={fixLatex(correctTxt)} /></span>
        : 'See the highlighted option above.';
    }
    if (q.type === 'FIB') {
      return q.answer
        ? <span>The answer is: <QText text={fixLatex(q.answer)} /></span>
        : undefined;
    }
    if (q.type === 'MATCH') return 'Correct pairings are shown below.';
    return undefined;
  };

  const TOTAL = questions.length || questionCount;

  // ════════════════════════════════════════════════════════════════════════════
  // CONFIG
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === 'config') {
    const types: { type: QuizType; label: string; desc: string; msIcon: string }[] = [
      { type: 'MCQ',   label: 'Multiple Choice',     desc: '4-option questions',    msIcon: 'quiz'         },
      { type: 'FIB',   label: 'Fill in the Blank',   desc: 'Complete the sentence', msIcon: 'edit_note'    },
      { type: 'MATCH', label: 'Match the Following', desc: 'Connect the pairs',     msIcon: 'compare_arrows' },
      { type: 'MIXED', label: 'Mixed',               desc: 'All types together',    msIcon: 'shuffle'      },
    ];

    return (
      <div className="max-w-2xl mx-auto py-8 px-4 animate-in fade-in duration-500 pb-8">
        <div className="text-center mb-10">
          <div className="w-16 h-16 primary-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
            <span className="material-symbols-outlined text-white text-[30px]" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
          </div>
          <h2 className="font-headline text-4xl text-on-surface mb-2">Quiz Time!</h2>
          <p className="text-secondary text-sm">{PTS_CORRECT} pts per correct · +{PTS_BONUS} bonus for perfect score</p>
        </div>

        <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-3">Question Type</p>
        <div className="grid grid-cols-2 gap-3 mb-8">
          {types.map(t => (
            <button key={t.type} onClick={() => setQuizType(t.type)}
              className={`flex flex-col items-start p-5 rounded-2xl border-2 text-left transition-all ${
                quizType === t.type
                  ? 'border-primary bg-indigo-50/40 text-primary'
                  : 'border-outline-variant bg-surface-container-lowest text-secondary hover:border-primary/40'
              }`}>
              <span className={`material-symbols-outlined text-[22px] mb-3 ${quizType === t.type ? '' : 'text-outline'}`}
                style={quizType === t.type ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {t.msIcon}
              </span>
              <p className="font-bold text-on-surface text-sm">{t.label}</p>
              <p className="text-xs text-secondary mt-0.5">{t.desc}</p>
            </button>
          ))}
        </div>

        <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-3">Number of Questions</p>
        <div className="flex items-center gap-4 mb-8 bg-surface-container-lowest p-4 rounded-2xl"
          style={{ boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>
          <button onClick={() => setQuestionCount(n => Math.max(1, n - 1))} disabled={questionCount <= 1}
            className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-secondary hover:bg-surface-container-high transition-all disabled:opacity-40">
            <Minus className="w-4 h-4" />
          </button>
          <div className="flex-1 text-center">
            <span className="text-3xl font-bold text-on-surface">{questionCount}</span>
            <p className="text-xs text-secondary mt-0.5">question{questionCount !== 1 ? 's' : ''} · max 5</p>
          </div>
          <button onClick={() => setQuestionCount(n => Math.min(5, n + 1))} disabled={questionCount >= 5}
            className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-secondary hover:bg-surface-container-high transition-all disabled:opacity-40">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <button onClick={handleGenerate}
          className="w-full flex items-center justify-center gap-2 py-4 primary-gradient text-on-primary font-bold rounded-[10px] shadow-glow hover:shadow-glow-lg transition-all text-base">
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
          Generate Quiz
        </button>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // LOADING
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === 'loading') {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-6 px-4 py-16">
        <div className="w-20 h-20 rounded-3xl primary-gradient flex items-center justify-center shadow-glow animate-pulse">
          <span className="material-symbols-outlined text-white text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
        </div>
        <div className="text-center space-y-2">
          <p className="font-semibold text-on-surface text-lg">Crafting your quiz…</p>
          <p className="text-sm text-secondary">Picking the best {questionCount} question{questionCount !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          {Array.from({ length: questionCount }).map((_, i) => (
            <div key={i} className="w-8 h-1.5 rounded-full bg-surface-container-high overflow-hidden">
              <div className="h-full primary-gradient rounded-full"
                style={{ animation: `pulse 1.8s ease-in-out infinite`, animationDelay: `${i * 180}ms`, width: '100%' }} />
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
      <div className="max-w-lg mx-auto py-8 px-4 animate-in fade-in zoom-in-95 duration-500 pb-8">
        <div className={`rounded-3xl p-8 text-center mb-6 ${
          pct >= 80 ? 'bg-emerald-50' : pct >= 50 ? 'bg-amber-50' : 'bg-error-container/30'}`}>
          <div className="text-5xl mb-4">{pct === 100 ? '🏆' : pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪'}</div>
          <h2 className="font-headline text-4xl text-on-surface mb-1">{correctCount}/{TOTAL} Correct</h2>
          <p className="text-secondary mb-6">{pct}% accuracy</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 bg-amber-100 text-amber-700 px-4 py-2 rounded-full font-bold text-base">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />+{totalPoints} pts
            </div>
            {perfect && (
              <div className="flex items-center gap-1.5 bg-primary-fixed text-primary px-3 py-2 rounded-full text-sm font-bold">
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                Perfect Bonus!
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2 mb-6">
          {questions.map((q, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${
              scores[i] ? 'bg-emerald-50' : 'bg-error-container/20'}`}>
              {scores[i]
                ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                : <XCircle      className="w-4 h-4 text-error       shrink-0" />}
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-secondary uppercase font-bold">{q.type}</p>
                <p className="text-sm text-on-surface truncate">{q.question.replace('___', '_____')}</p>
                {!scores[i] && (
                  <p className="text-xs text-error mt-0.5">
                    {q.type === 'MATCH'
                      ? q.pairs?.map(p => `${p.left} → ${p.right}`).join(' | ')
                      : q.answer
                        ? <span>Answer: <strong><QText text={fixLatex(q.answer)} /></strong></span>
                        : null}
                  </p>
                )}
              </div>
              <span className={`text-xs font-bold shrink-0 ${scores[i] ? 'text-emerald-600' : 'text-secondary'}`}>
                {scores[i] ? `+${PTS_CORRECT}` : '0'}
              </span>
            </div>
          ))}
        </div>

        {history.length > 0 && (
          <div className="mb-6">
            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-3 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />Recent attempts
            </p>
            <div className="space-y-1.5">
              {history.map((h, i) => {
                const hPct = Math.round((h.score / h.total) * 100);
                return (
                  <div key={h.id} className="flex items-center gap-3 px-3 py-2 bg-surface-container-lowest rounded-xl"
                    style={{ boxShadow: '0 1px 4px rgba(15,23,42,0.06)' }}>
                    <span className={`text-xs font-bold w-5 ${i === 0 ? 'text-primary' : 'text-secondary'}`}>#{i + 1}</span>
                    <span className="text-xs text-secondary uppercase font-medium">{h.quiz_type}</span>
                    <span className="text-xs text-on-surface flex-1">{h.score}/{h.total} correct</span>
                    <span className={`text-xs font-bold ${hPct >= 80 ? 'text-emerald-600' : hPct >= 50 ? 'text-amber-600' : 'text-error'}`}>{hPct}%</span>
                    <span className="text-xs text-amber-600 font-bold">+{h.points_earned}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => { setPhase('config'); setScores([]); setQuestions([]); }}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-surface-container-highest text-secondary font-bold rounded-[10px] hover:bg-surface-container-high transition-all">
            <RotateCcw className="w-4 h-4" />New Quiz
          </button>
          <button onClick={handleGenerate}
            className="flex-1 flex items-center justify-center gap-2 py-3 primary-gradient text-on-primary font-bold rounded-[10px] shadow-glow transition-all">
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
    <div className="max-w-2xl mx-auto py-6 px-4 animate-in fade-in duration-300 pb-8">

      {/* Progress + timer */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex-1 mr-6">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">
              Question {currentIdx + 1} of {TOTAL}
            </span>
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
              {Math.round((currentIdx / TOTAL) * 100)}% Complete
            </span>
          </div>
          <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
            <div className="h-full primary-gradient rounded-full transition-all duration-500"
              style={{ width: `${(currentIdx / TOTAL) * 100}%` }} />
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest rounded-full"
          style={{ boxShadow: '0 2px 8px rgba(15,23,42,0.06)' }}>
          <span className="material-symbols-outlined text-primary text-[20px]">timer</span>
          <span className="font-mono text-sm font-bold text-on-surface">{scores.filter(Boolean).length}/{TOTAL}</span>
        </div>
      </div>

      {/* Question card */}
      <div className="bg-surface-container-lowest rounded-[1.5rem] p-8 mb-8"
        style={{ boxShadow: '0 4px 16px rgba(15,23,42,0.08)' }}>
        <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-5 ${
          q.type === 'MCQ'   ? 'bg-primary-fixed text-primary'
          : q.type === 'FIB' ? 'bg-secondary-fixed text-on-secondary-fixed-variant'
          :                    'bg-tertiary-fixed text-on-tertiary-fixed-variant'}`}>
          {q.type === 'MCQ' ? 'Multiple Choice' : q.type === 'FIB' ? 'Fill in the Blank' : 'Match the Following'}
        </span>

        {q.type !== 'FIB' && (
          <div className="mb-8 text-xl font-semibold text-on-surface leading-relaxed">
            <MarkdownRenderer content={fixLatex(q.question)} />
          </div>
        )}

        {q.type === 'MCQ' && (
          <MCQQuestion q={q} selected={mcqSelected} submitted={submitted} onSelect={setMcqSelected} />
        )}
        {q.type === 'FIB' && (
          <FIBQuestion q={q} value={fibValue} submitted={submitted} correct={fibCorrect} onChange={setFibValue} />
        )}
        {q.type === 'MATCH' && (
          <MatchQuestion q={q} pairs={matchPairs} submitted={submitted}
            onPair={(l, r)  => setMatchPairs(prev => ({ ...prev, [l]: r }))}
            onUnpair={l     => setMatchPairs(prev => { const n = { ...prev }; delete n[l]; return n; })}
          />
        )}

        {submitted && q.type !== 'MATCH' && (
          <FeedbackBox correct={lastCorrect} message={feedbackMessage()} />
        )}
        {submitted && q.type === 'MATCH' && (
          <div className={`mt-4 flex items-center gap-2 text-sm font-bold
            ${lastCorrect ? 'text-emerald-600' : 'text-error'}`}>
            {lastCorrect
              ? <><CheckCircle2 className="w-4 h-4" />All pairs correct! +{PTS_CORRECT} pts</>
              : <><XCircle      className="w-4 h-4" />Correct pairings shown above</>}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex justify-between items-center">
        {currentIdx > 0 && !submitted && (
          <button className="flex items-center gap-2 px-5 py-3 text-secondary font-semibold hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back
          </button>
        )}
        <div className={`flex gap-3 ${currentIdx > 0 && !submitted ? '' : 'w-full'}`}>
          {!submitted ? (
            <button onClick={handleSubmitAnswer} disabled={!canSubmit}
              className="flex-1 py-3 px-8 primary-gradient text-on-primary font-bold rounded-[10px] shadow-glow hover:shadow-glow-lg transition-all disabled:opacity-40">
              Submit Answer
            </button>
          ) : (
            <>
              <button className="px-6 py-3 bg-surface-container-highest text-secondary font-bold rounded-[10px] hover:bg-surface-container-high transition-colors text-sm">
                Explain Logic
              </button>
              <button onClick={handleNext}
                className="flex items-center justify-center gap-2 px-8 py-3 primary-gradient text-on-primary font-bold rounded-[10px] shadow-glow hover:shadow-glow-lg transition-all">
                {currentIdx === TOTAL - 1
                  ? <><span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>See Results</>
                  : <>Continue <span className="material-symbols-outlined text-[18px]">arrow_forward</span></>}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quiz;
