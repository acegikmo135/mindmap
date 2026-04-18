import React, { useState, useRef, useEffect } from 'react';
import { Message, Chapter, UserProfile } from '../types';
import { getDoubtResponse } from '../services/geminiService';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import { useAuth } from '../contexts/AuthContext';
import { getChatHistory, saveChatHistory } from '../services/db';

interface DoubtSolverProps {
  chapter: Chapter;
  profile: UserProfile | null;
}

/** Builds a rich, structured context string for the AI */
function buildContext(chapter: Chapter, profile: UserProfile | null): string {
  const studentName = profile?.full_name || 'Student';
  const grade       = profile?.grade        || '8th Grade';

  const mastered    = chapter.concepts.filter(c => c.status === 'MASTERED').map(c => c.title);
  const inProgress  = chapter.concepts.filter(c => c.status === 'IN_PROGRESS').map(c => c.title);
  const notStarted  = chapter.concepts.filter(c => c.status === 'NOT_STARTED' || c.status === 'LOCKED').map(c => c.title);

  return [
    `Student: ${studentName} | Grade: ${grade} | Subject: ${chapter.subject}`,
    `Chapter: ${chapter.title}`,
    mastered.length   ? `Mastered concepts: ${mastered.join(', ')}`        : '',
    inProgress.length ? `Currently learning: ${inProgress.join(', ')}`     : '',
    notStarted.length ? `Not yet started: ${notStarted.join(', ')}`        : '',
  ].filter(Boolean).join('\n');
}

const DoubtSolver: React.FC<DoubtSolverProps> = ({ chapter, profile }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load chat history whenever chapter changes
  useEffect(() => {
    if (!user) return;

    const loadHistory = async () => {
      setIsLoadingHistory(true);
      const history = await getChatHistory(user.id, chapter.id);
      if (history && history.length > 0) {
        setMessages(history);
      } else {
        const name = profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : '';
        setMessages([{
          id: '1',
          role: 'model',
          content: `Hi${name}! I'm your AI tutor for **${chapter.title}**. Ask me anything about this chapter and I'll explain it simply.`,
          timestamp: Date.now(),
        }]);
      }
      setIsLoadingHistory(false);
    };

    loadHistory();
  }, [user, chapter.id]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => { scrollToBottom(); }, [messages, isLoadingHistory]);

  const handleSend = async () => {
    if (!input.trim() || !user) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };
    const newMessages = [...messages, userMsg];

    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    saveChatHistory(user.id, chapter.id, newMessages); // optimistic save

    const context = buildContext(chapter, profile);

    try {
      const responseText = await getDoubtResponse(newMessages, context);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: responseText,
        timestamp: Date.now(),
      };
      const finalMessages = [...newMessages, botMsg];
      setMessages(finalMessages);
      saveChatHistory(user.id, chapter.id, finalMessages);
    } catch {
      // silent fail — user can retry
    } finally {
      setIsTyping(false);
    }
  };

  if (isLoadingHistory) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-white dark:bg-slate-900 transition-colors relative overflow-hidden">
      {/* Desktop header */}
      <div className="hidden md:flex p-4 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 justify-between items-center shrink-0">
        <div>
          <h2 className="font-serif font-bold text-slate-800 dark:text-slate-100">AI Tutor</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {chapter.subject} · {chapter.title}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 md:p-6 space-y-6 scroll-smooth overscroll-contain"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2 md:gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shrink-0
              ${msg.role === 'user'
                ? 'bg-slate-200 dark:bg-slate-700'
                : 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'}`}
            >
              {msg.role === 'user'
                ? <User className="w-3.5 h-3.5 text-slate-500 dark:text-slate-300" />
                : <Bot className="w-4 h-4 md:w-5 md:h-5" />}
            </div>
            <div className={`max-w-[90%] md:max-w-[85%] p-3 md:p-4 rounded-2xl text-sm leading-relaxed
              ${msg.role === 'user'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tr-none'
                : 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 rounded-tl-none'}`}
            >
              <MarkdownRenderer content={msg.content} />
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-start gap-2 md:gap-3">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 md:w-5 md:h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl rounded-tl-none px-4 py-3.5 flex items-center gap-1.5">
              <span className="typing-dot w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full" />
              <span className="typing-dot w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full" />
              <span className="typing-dot w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 md:p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1.5 md:p-2 rounded-xl border border-slate-200 dark:border-slate-700 focus-within:border-primary-300 focus-within:ring-4 focus-within:ring-primary-50 dark:focus-within:ring-primary-900/20 transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`Ask anything about ${chapter.title}...`}
            className="flex-1 bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 px-2 text-sm md:text-base"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="p-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoubtSolver;
