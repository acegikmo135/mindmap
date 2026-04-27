import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Message, Chapter, UserProfile } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import { useAuth } from '../contexts/AuthContext';
import { getChatHistory, saveChatHistory, clearChatHistory } from '../services/db';
import { supabase } from '../lib/supabase';
import { PromptInput, PromptInputTextarea, PromptInputActions, PromptSendButton } from './PromptInput';

interface DoubtSolverProps {
  chapter: Chapter;
  profile: UserProfile | null;
  onStateChange?: (used: number, limit: number, clearFn: () => void) => void;
}

interface ChatMessage extends Message { cached?: boolean; rate_limited?: boolean; }

const TUTOR_API = (import.meta as any).env?.VITE_TUTOR_API_URL ?? 'http://localhost:8000';

function buildContext(chapter: Chapter, profile: UserProfile | null): string {
  const mastered   = chapter.concepts.filter(c => c.status === 'MASTERED').map(c => c.title);
  const inProgress = chapter.concepts.filter(c => c.status === 'IN_PROGRESS').map(c => c.title);
  const notStarted = chapter.concepts.filter(c => c.status === 'NOT_STARTED' || c.status === 'LOCKED').map(c => c.title);
  return [
    `Student: ${profile?.full_name || 'Student'} | Grade: ${profile?.grade || '8th'} | Subject: ${chapter.subject}`,
    `Chapter: ${chapter.title}`,
    mastered.length   ? `Mastered: ${mastered.join(', ')}`      : '',
    inProgress.length ? `Learning: ${inProgress.join(', ')}`    : '',
    notStarted.length ? `Not started: ${notStarted.join(', ')}` : '',
  ].filter(Boolean).join('\n');
}

async function askTutor(question: string, chapterId: string, context: string, history: Message[], token: string, signal?: AbortSignal) {
  const res = await fetch(`${TUTOR_API}/ask`, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question, chapter_id: chapterId, context,
      history: history.slice(-20).map(m => ({ role: m.role, content: m.content })), token,
    }),
  });
  if (!res.ok) throw new Error(`Tutor API error ${res.status}`);
  return res.json() as Promise<{ answer: string; cached: boolean; rate_limited: boolean }>;
}

// ── Circular progress bar ─────────────────────────────────────────────────────
const CircularProgress: React.FC<{ used: number; limit: number }> = ({ used, limit }) => {
  const pct   = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const r     = 14;
  const circ  = 2 * Math.PI * r;
  const dash  = (pct / 100) * circ;
  const color = pct >= 90 ? '#ef4444' : pct >= 65 ? '#f59e0b' : '#c85b32';
  const label = pct >= 100 ? '!' : `${Math.round(pct)}%`;

  return (
    <div title={`${used.toLocaleString()} / ${limit.toLocaleString()} tokens used today`}
      className="relative flex items-center justify-center shrink-0" style={{ width: 36, height: 36 }}>
      <svg width="36" height="36" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
        <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(199,196,216,0.3)" strokeWidth="2.5" />
        <circle cx="18" cy="18" r={r} fill="none" stroke={color} strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.6s ease, stroke 0.3s ease' }} />
      </svg>
      <span style={{ fontSize: 9, fontWeight: 800, color, lineHeight: 1 }}>{label}</span>
    </div>
  );
};

// ── Fast typing animation ─────────────────────────────────────────────────────
const TypingMessage: React.FC<{ content: string; onDone: () => void }> = ({ content, onDone }) => {
  // Split into tokens (words + spaces) for natural chunking
  const tokens = useMemo(() => content.match(/\S+|\s+/g) ?? [], [content]);
  const [idx, setIdx]   = useState(0);
  const doneRef         = useRef(false);

  useEffect(() => {
    if (doneRef.current) return;
    if (idx >= tokens.length) {
      doneRef.current = true;
      onDone();
      return;
    }
    // Add 3 tokens every 18 ms → smooth but fast
    const t = setTimeout(() => setIdx(i => Math.min(i + 3, tokens.length)), 18);
    return () => clearTimeout(t);
  }, [idx, tokens.length, onDone]);

  const isDone = idx >= tokens.length;

  if (isDone) return <MarkdownRenderer content={content} />;

  return (
    <span className="text-sm leading-relaxed whitespace-pre-wrap">
      {tokens.slice(0, idx).join('')}
      <span className="inline-block align-middle ml-px animate-pulse"
        style={{ width: 2, height: '1em', background: 'currentColor', borderRadius: 1 }} />
    </span>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────
const DoubtSolver: React.FC<DoubtSolverProps> = ({ chapter, profile, onStateChange }) => {
  const { user } = useAuth();
  const [messages,        setMessages]        = useState<ChatMessage[]>([]);
  const [input,           setInput]           = useState('');
  const [isTyping,        setIsTyping]        = useState(false);
  const [isLoadingHistory,setIsLoadingHistory]= useState(true);
  const [typingMsgId,     setTypingMsgId]     = useState<string | null>(null);
  const [tokenUsed,       setTokenUsed]       = useState(0);
  const [tokenLimit,      setTokenLimit]      = useState(5000);
  const scrollRef  = useRef<HTMLDivElement>(null);
  const abortRef   = useRef<AbortController | null>(null);

  // Load chat history + token data
  useEffect(() => {
    if (!user) return;
    (async () => {
      setIsLoadingHistory(true);
      const [history, settingsRes, usageRes] = await Promise.all([
        getChatHistory(user.id, chapter.id),
        supabase.from('admin_settings').select('value').eq('key', 'app_settings').maybeSingle(),
        supabase.rpc('get_user_daily_tokens', { p_user_id: user.id }),
      ]);

      if (settingsRes.data?.value?.rate_limits?.chatbot_daily_tokens) {
        setTokenLimit(settingsRes.data.value.rate_limits.chatbot_daily_tokens);
      }
      if (typeof usageRes.data === 'number') setTokenUsed(usageRes.data);

      if (history?.length > 0) {
        setMessages(history);
      } else {
        const name = profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : '';
        setMessages([{
          id: '1', role: 'model', timestamp: Date.now(),
          content: `Hi${name}! I'm your AI tutor for **${chapter.title}**. Ask me anything and I'll explain it simply.`,
        }]);
      }
      setIsLoadingHistory(false);
    })();
  }, [user, chapter.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  // Notify parent (App.tsx) whenever token state changes so top bar can update
  useEffect(() => {
    onStateChange?.(tokenUsed, tokenLimit, handleClearChat);
  }, [tokenUsed, tokenLimit]);

  const refreshUsage = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.rpc('get_user_daily_tokens', { p_user_id: user.id });
    if (typeof data === 'number') setTokenUsed(data);
  }, [user]);

  const handleClearChat = async () => {
    if (!user) return;
    const initial: ChatMessage = {
      id: Date.now().toString(), role: 'model', timestamp: Date.now(),
      content: `Chat cleared! Ask me anything about **${chapter.title}**.`,
    };
    setMessages([initial]);
    setTypingMsgId(null);
    await clearChatHistory(user.id, chapter.id);
  };

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsTyping(false);
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !user || isTyping) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input.trim(), timestamp: Date.now() };
    const withUser = [...messages, userMsg];
    setMessages(withUser);
    setInput('');
    setIsTyping(true);
    saveChatHistory(user.id, chapter.id, withUser);

    abortRef.current = new AbortController();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { answer, cached, rate_limited } = await askTutor(
        userMsg.content, chapter.id, buildContext(chapter, profile), messages,
        session?.access_token ?? '', abortRef.current.signal,
      );
      const botId  = (Date.now() + 1).toString();
      const botMsg: ChatMessage = { id: botId, role: 'model', content: answer, timestamp: Date.now(), cached, rate_limited };
      const final  = [...withUser, botMsg];
      setMessages(final);
      saveChatHistory(user.id, chapter.id, final);
      if (!cached && !rate_limited) setTypingMsgId(botId);
      if (!cached) setTimeout(refreshUsage, 1500);
    } catch (err: any) {
      // Ignore abort errors — user clicked stop intentionally
      if (err?.name === 'AbortError') return;
      const errMsg: ChatMessage = {
        id: (Date.now() + 1).toString(), role: 'model', timestamp: Date.now(),
        content: 'Something went wrong. Please try again.',
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      abortRef.current = null;
      setIsTyping(false);
    }
  }, [input, user, isTyping, messages, chapter, profile, refreshUsage]);

  if (isLoadingHistory) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-10 h-10 rounded-full primary-gradient flex items-center justify-center shadow-glow animate-pulse">
          <span className="material-symbols-outlined text-white text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-surface transition-colors relative overflow-hidden">

      {/* Desktop-only top bar (mobile equivalent is in App.tsx header) */}
      <div className="hidden md:flex items-center gap-3 px-6 py-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(199,196,216,0.15)' }}>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-on-surface leading-tight truncate">AI Tutor</p>
          <p className="text-[11px] text-secondary truncate">{chapter.subject} · {chapter.title}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <CircularProgress used={tokenUsed} limit={tokenLimit} />
          <button
            onClick={handleClearChat}
            title="Clear chat"
            className="p-1.5 text-secondary hover:bg-surface-container-high rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">delete_sweep</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-6 scroll-smooth overscroll-contain">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-surface-container-highest border border-outline-variant/20' : 'primary-gradient shadow-glow'
              }`}>
                <span className="material-symbols-outlined text-[16px] text-white"
                  style={msg.role !== 'user' ? { fontVariationSettings: "'FILL' 1" } : {}}>
                  {msg.role === 'user' ? 'person' : 'psychology'}
                </span>
              </div>

              {/* Bubble */}
              <div className={`max-w-[85%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-on-surface">
                    {msg.role === 'user' ? 'You' : 'CogniStruct AI'}
                  </span>
                  {msg.cached && !msg.rate_limited && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-fixed text-[9px] font-bold text-on-tertiary-fixed-variant tracking-wider uppercase">
                      <span className="material-symbols-outlined text-[10px]">bolt</span>
                      Instant
                    </span>
                  )}
                </div>

                {msg.rate_limited ? (
                  <div className="p-4 rounded-xl rounded-tl-none text-sm leading-relaxed shadow-card border"
                    style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.3)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-[18px]" style={{ color: '#d97706', fontVariationSettings: "'FILL' 1" }}>timer_off</span>
                      <span className="font-bold text-sm" style={{ color: '#b45309' }}>Daily Limit Reached</span>
                    </div>
                    <MarkdownRenderer content={msg.content} />
                  </div>
                ) : (
                  <div className={`p-4 rounded-xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'primary-gradient text-on-primary rounded-tr-none shadow-glow'
                      : 'bg-surface-container-lowest text-on-surface-variant rounded-tl-none shadow-card'
                  }`}>
                    {msg.role === 'model' && msg.id === typingMsgId ? (
                      <TypingMessage content={msg.content} onDone={() => setTypingMsgId(null)} />
                    ) : (
                      <MarkdownRenderer content={msg.content} />
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Generating — three-dot typing indicator */}
          {isTyping && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full primary-gradient shadow-glow flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-white text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
              </div>
              <div className="bg-surface-container-lowest rounded-xl rounded-tl-none px-5 py-3.5 shadow-card">
                <div className="flex items-center gap-1.5">
                  <span className="typing-dot w-2 h-2 rounded-full bg-secondary inline-block" />
                  <span className="typing-dot w-2 h-2 rounded-full bg-secondary inline-block" />
                  <span className="typing-dot w-2 h-2 rounded-full bg-secondary inline-block" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Prompt input */}
      <footer className="shrink-0 px-3 md:px-6 pt-2 pb-3"
        style={{ borderTop: '1px solid rgba(199,196,216,0.15)', background: 'var(--color-surface)' }}>
        <div className="max-w-3xl mx-auto">
          <PromptInput
            value={input}
            onValueChange={setInput}
            isLoading={isTyping}
            onSubmit={handleSend}
            maxHeight={180}
          >
            <PromptInputTextarea
              placeholder={`Ask anything about ${chapter.title}…`}
            />
            <PromptInputActions className="justify-end">
              <PromptSendButton onSubmit={handleSend} />
            </PromptInputActions>
          </PromptInput>
        </div>
      </footer>
    </div>
  );
};

export default DoubtSolver;
