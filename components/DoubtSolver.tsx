import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { getDoubtResponse } from '../services/geminiService';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import { useAuth } from '../contexts/AuthContext';
import { getChatHistory, saveChatHistory } from '../services/db';

interface DoubtSolverProps {
  chapterId: string;
}

const DoubtSolver: React.FC<DoubtSolverProps> = ({ chapterId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history
  useEffect(() => {
    if (!user) return;

    const loadHistory = async () => {
      setIsLoadingHistory(true);
      const history = await getChatHistory(user.id, chapterId);
      if (history && history.length > 0) {
        setMessages(history);
      } else {
        // Initial welcome message if no history
        setMessages([
          { id: '1', role: 'model', content: "Hello! I'm your AI tutor. I can help clarify any concept from this chapter. What's confusing you?", timestamp: Date.now() }
        ]);
      }
      setIsLoadingHistory(false);
    };

    loadHistory();
  }, [user, chapterId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isLoadingHistory]);

  const handleSend = async () => {
    if (!input.trim() || !user) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input, timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);
    
    // Optimistic save
    saveChatHistory(user.id, chapterId, newMessages);

    // Simulate context awareness
    const context = "Current Chapter Context"; 
    
    try {
      // Get AI response
      const responseText = await getDoubtResponse(newMessages, context);
      
      const botMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', content: responseText, timestamp: Date.now() };
      const finalMessages = [...newMessages, botMsg];
      
      setMessages(finalMessages);
      saveChatHistory(user.id, chapterId, finalMessages);
    } catch (error) {
      console.error("Failed to get response", error);
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
    <div className="flex flex-col h-full w-full bg-white dark:bg-slate-900 transition-colors relative">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center">
        <div>
          <h2 className="font-serif font-bold text-slate-800 dark:text-slate-100">Doubt Solver</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Context aware • LaTeX Supported</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-start gap-2 md:gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-200 dark:bg-slate-700' : 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'}`}>
              {msg.role === 'user' ? <User className="w-3.5 h-3.5 text-slate-500 dark:text-slate-300" /> : <Bot className="w-4 h-4 md:w-5 md:h-5" />}
            </div>
            <div 
              className={`max-w-[90%] md:max-w-[85%] p-3 md:p-4 rounded-2xl text-sm leading-relaxed
              ${msg.role === 'user' 
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tr-none' 
                : 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 rounded-tl-none'}`}
            >
              <MarkdownRenderer content={msg.content} />
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-center gap-2 text-slate-400 text-xs ml-10 md:ml-12">
            <Loader2 className="w-3 h-3 animate-spin" />
            Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 md:p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky bottom-0">
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1.5 md:p-2 rounded-xl border border-slate-200 dark:border-slate-700 focus-within:border-primary-300 focus-within:ring-4 focus-within:ring-primary-50 dark:focus-within:ring-primary-900/20 transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question..."
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