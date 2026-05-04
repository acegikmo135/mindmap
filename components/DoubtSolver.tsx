import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Message, Chapter, UserProfile } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  ChatSession,
  getChatSessions,
  createChatSession,
  updateChatSession,
  deleteChatSession,
} from '../services/db';
import { PromptInput, PromptInputTextarea, PromptInputActions, PromptSendButton } from './PromptInput';

interface DoubtSolverProps {
  chapter: Chapter;
  profile: UserProfile | null;
  onStateChange?: (used: number, limit: number, newChatFn: () => void) => void;
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
    method: 'POST', signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question, chapter_id: chapterId, context,
      history: history.slice(-20).map(m => ({ role: m.role, content: m.content })), token,
    }),
  });
  if (!res.ok) throw new Error(`Tutor API error ${res.status}`);
  return res.json() as Promise<{ answer: string; cached: boolean; rate_limited: boolean }>;
}

function makeWelcome(chapter: Chapter, profile: UserProfile | null): ChatMessage {
  const name = profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : '';
  return { id: 'welcome', role: 'model', timestamp: Date.now(),
    content: `Hi${name}! I'm your AI tutor for **${chapter.title}**. Ask me anything and I'll explain it simply.` };
}

function autoTitle(text: string) {
  return text.length > 38 ? text.slice(0, 38).trimEnd() + '…' : text;
}

// ── Typing animation ──────────────────────────────────────────────────────────
const TypingMessage: React.FC<{ content: string; onDone: () => void }> = ({ content, onDone }) => {
  const tokens  = useMemo(() => content.match(/\S+|\s+/g) ?? [], [content]);
  const [idx, setIdx] = useState(0);
  const doneRef = useRef(false);
  useEffect(() => {
    if (doneRef.current) return;
    if (idx >= tokens.length) { doneRef.current = true; onDone(); return; }
    const t = setTimeout(() => setIdx(i => Math.min(i + 3, tokens.length)), 18);
    return () => clearTimeout(t);
  }, [idx, tokens.length, onDone]);
  if (idx >= tokens.length) return <MarkdownRenderer content={content} />;
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

  const [sessions,    setSessions]    = useState<ChatSession[]>([]);
  const [activeId,    setActiveId]    = useState<string | null>(null);
  const [messages,    setMessages]    = useState<ChatMessage[]>([]);
  const [input,       setInput]       = useState('');
  const [isTyping,    setIsTyping]    = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [typingMsgId, setTypingMsgId] = useState<string | null>(null);
  const [tokenUsed,   setTokenUsed]   = useState(0);
  const [tokenLimit,  setTokenLimit]  = useState(5000);

  const scrollRef   = useRef<HTMLDivElement>(null);
  const abortRef    = useRef<AbortController | null>(null);
  const activeIdRef = useRef<string | null>(null);
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

  const refreshUsage = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.rpc('get_user_daily_tokens', { p_user_id: user.id });
    if (typeof data === 'number') setTokenUsed(data);
  }, [user]);

  // ── Load sessions ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    (async () => {
      const [list, settingsRes, usageRes] = await Promise.all([
        getChatSessions(user.id, chapter.id),
        supabase.from('admin_settings').select('value').eq('key', 'app_settings').maybeSingle(),
        supabase.rpc('get_user_daily_tokens', { p_user_id: user.id }),
      ]);
      if (settingsRes.data?.value?.rate_limits?.chatbot_daily_tokens)
        setTokenLimit(settingsRes.data.value.rate_limits.chatbot_daily_tokens);
      if (typeof usageRes.data === 'number') setTokenUsed(usageRes.data);

      if (list.length > 0) {
        setSessions(list);
        setActiveId(list[0].id);
        setMessages(list[0].messages.length > 0 ? list[0].messages : [makeWelcome(chapter, profile)]);
      } else {
        const s = await createChatSession(user.id, chapter.id);
        if (s) { setSessions([s]); setActiveId(s.id); }
        setMessages([makeWelcome(chapter, profile)]);
      }
      setLoading(false);
    })();
  }, [user, chapter.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  // ── New chat ──────────────────────────────────────────────────────────────
  const handleNewChat = useCallback(async () => {
    if (!user) return;
    const s = await createChatSession(user.id, chapter.id);
    if (!s) return;
    setSessions(prev => [s, ...prev]);
    setActiveId(s.id);
    setMessages([makeWelcome(chapter, profile)]);
  }, [user, chapter, profile]);

  // expose to App.tsx (token bar + new chat button in mobile header)
  useEffect(() => {
    onStateChange?.(tokenUsed, tokenLimit, handleNewChat);
  }, [tokenUsed, tokenLimit, handleNewChat]);

  // ── Switch session ────────────────────────────────────────────────────────
  const handleSelect = useCallback((s: ChatSession) => {
    if (s.id === activeIdRef.current) return;
    setActiveId(s.id);
    setMessages(s.messages.length > 0 ? s.messages : [makeWelcome(chapter, profile)]);
    setTypingMsgId(null);
  }, [chapter, profile]);

  // ── Delete session ────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!user) return;
    await deleteChatSession(sessionId);
    setSessions(prev => {
      const next = prev.filter(s => s.id !== sessionId);
      if (sessionId === activeIdRef.current) {
        if (next.length > 0) {
          setActiveId(next[0].id);
          setMessages(next[0].messages.length > 0 ? next[0].messages : [makeWelcome(chapter, profile)]);
        } else {
          createChatSession(user.id, chapter.id).then(s => {
            if (s) { setSessions([s]); setActiveId(s.id); }
          });
          setActiveId(null);
          setMessages([makeWelcome(chapter, profile)]);
        }
      }
      return next;
    });
  }, [user, chapter, profile]);

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    if (!input.trim() || !user || isTyping || !activeIdRef.current) return;
    const sessionId  = activeIdRef.current;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input.trim(), timestamp: Date.now() };
    const withUser   = [...messages, userMsg];
    setMessages(withUser);
    setInput('');
    setIsTyping(true);

    const isFirst  = messages.every(m => m.role !== 'user');
    const newTitle = isFirst ? autoTitle(userMsg.content) : undefined;
    if (newTitle) setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: newTitle } : s));
    updateChatSession(sessionId, { messages: withUser, ...(newTitle ? { title: newTitle } : {}) });
    if (newTitle) {
      setSessions(prev => {
        const idx = prev.findIndex(s => s.id === sessionId);
        if (idx <= 0) return prev;
        const a = [...prev]; const [item] = a.splice(idx, 1);
        return [{ ...item, title: newTitle }, ...a];
      });
    }

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
      updateChatSession(sessionId, { messages: final });
      if (!cached && !rate_limited) setTypingMsgId(botId);
      if (!cached) setTimeout(refreshUsage, 1500);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: 'model', timestamp: Date.now(),
        content: 'Something went wrong. Please try again.',
      }]);
    } finally { abortRef.current = null; setIsTyping(false); }
  }, [input, user, isTyping, messages, chapter, profile, refreshUsage]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <div className="w-10 h-10 rounded-full primary-gradient flex items-center justify-center shadow-glow animate-pulse">
        <span className="material-symbols-outlined text-white text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
      </div>
    </div>
  );

  const activeSession = sessions.find(s => s.id === activeId);

  return (
    <div className="flex flex-1 min-h-0 w-full bg-surface overflow-hidden">

      {/* ── Desktop sidebar (hidden on mobile) ────────────────────────── */}
      <aside className="hidden md:flex flex-col w-52 shrink-0 bg-surface-container-low"
        style={{ borderRight: '1px solid rgba(199,196,216,0.15)' }}>

        {/* New chat */}
        <div className="p-3 shrink-0">
          <button onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl primary-gradient text-white text-xs font-semibold shadow-glow hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined text-[15px]">add</span>
            New Chat
          </button>
        </div>

        <p className="px-4 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-secondary shrink-0">Chats</p>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
          {sessions.map(s => (
            <button key={s.id} onClick={() => handleSelect(s)}
              className={`group w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 transition-all ${
                s.id === activeId
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}>
              <span className="material-symbols-outlined text-[14px] shrink-0"
                style={s.id === activeId ? { fontVariationSettings: "'FILL' 1" } : {}}>chat</span>
              <span className="flex-1 text-xs truncate">{s.title}</span>
              <span onClick={e => handleDelete(e, s.id)}
                className="material-symbols-outlined text-[13px] shrink-0 opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-error transition-all"
                title="Delete">delete</span>
            </button>
          ))}
        </div>
      </aside>

      {/* ── Chat area ─────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 min-h-0">

        {/* Mobile session tabs (horizontal scroll, no header) */}
        <div className="md:hidden flex items-center gap-1.5 px-3 py-2 overflow-x-auto shrink-0 scrollbar-none"
          style={{ borderBottom: '1px solid rgba(199,196,216,0.12)' }}>
          <button onClick={handleNewChat}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full primary-gradient text-white text-[11px] font-semibold shrink-0 shadow-glow">
            <span className="material-symbols-outlined text-[13px]">add</span>
          </button>
          {sessions.map(s => (
            <div key={s.id}
              className={`group flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-medium shrink-0 cursor-pointer transition-all ${
                s.id === activeId
                  ? 'bg-primary/15 text-primary'
                  : 'bg-surface-container text-on-surface-variant'
              }`}
              onClick={() => handleSelect(s)}>
              <span className="max-w-[100px] truncate">{s.title}</span>
              <span onClick={e => handleDelete(e, s.id)}
                className="material-symbols-outlined text-[11px] opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:text-error transition-all"
                >close</span>
            </div>
          ))}
        </div>

        {/* Messages */}
        <div ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-6 scroll-smooth overscroll-contain">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map(msg => (
              <div key={msg.id} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-surface-container-highest border border-outline-variant/20'
                    : 'primary-gradient shadow-glow'
                }`}>
                  <span className="material-symbols-outlined text-[16px] text-white"
                    style={msg.role !== 'user' ? { fontVariationSettings: "'FILL' 1" } : {}}>
                    {msg.role === 'user' ? 'person' : 'psychology'}
                  </span>
                </div>

                <div className={`max-w-[85%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-on-surface">
                      {msg.role === 'user' ? 'You' : 'CogniStruct AI'}
                    </span>
                    {(msg as ChatMessage).cached && !(msg as ChatMessage).rate_limited && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-fixed text-[9px] font-bold text-on-tertiary-fixed-variant tracking-wider uppercase">
                        <span className="material-symbols-outlined text-[10px]">bolt</span>Instant
                      </span>
                    )}
                  </div>

                  {(msg as ChatMessage).rate_limited ? (
                    <div className="p-4 rounded-xl rounded-tl-none text-sm leading-relaxed shadow-card border"
                      style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.3)' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-[18px]"
                          style={{ color: '#d97706', fontVariationSettings: "'FILL' 1" }}>timer_off</span>
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

            {isTyping && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full primary-gradient shadow-glow flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-white text-[16px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
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

        {/* Input */}
        <footer className="shrink-0 px-3 md:px-6 pt-2 pb-3"
          style={{ borderTop: '1px solid rgba(199,196,216,0.15)', background: 'var(--color-surface)' }}>
          <div className="max-w-3xl mx-auto">
            <PromptInput value={input} onValueChange={setInput} isLoading={isTyping} onSubmit={handleSend} maxHeight={180}>
              <PromptInputTextarea placeholder={`Ask anything about ${chapter.title}…`} />
              <PromptInputActions className="justify-end">
                <PromptSendButton onSubmit={handleSend} />
              </PromptInputActions>
            </PromptInput>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DoubtSolver;
