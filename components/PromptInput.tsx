/**
 * Prompt Input — single-line layout (ChatGPT style).
 * Textarea grows vertically; send button stays right-aligned on the same row.
 */
import React, { createContext, useContext, useEffect, useRef } from 'react';
import { ArrowUp } from 'lucide-react';

// ── Context ───────────────────────────────────────────────────────────────────
type CtxType = {
  isLoading: boolean;
  value: string;
  setValue: (v: string) => void;
  maxHeight: number;
  onSubmit?: () => void;
};

const Ctx = createContext<CtxType>({
  isLoading: false, value: '', setValue: () => {}, maxHeight: 200,
});

const useCtx = () => useContext(Ctx);

// ── Root — flex row, items aligned to bottom ──────────────────────────────────
interface RootProps {
  isLoading?: boolean;
  value: string;
  onValueChange: (v: string) => void;
  onSubmit?: () => void;
  maxHeight?: number;
  className?: string;
  children: React.ReactNode;
}

export const PromptInput: React.FC<RootProps> = ({
  isLoading = false,
  value,
  onValueChange,
  onSubmit,
  maxHeight = 200,
  className = '',
  children,
}) => (
  <Ctx.Provider value={{ isLoading, value, setValue: onValueChange, maxHeight, onSubmit }}>
    <div
      className={`flex items-end gap-2 rounded-3xl bg-surface-container-lowest shadow-sm transition-shadow focus-within:shadow-md ${className}`}
      style={{ border: '1.5px solid rgba(199,196,216,0.35)', padding: '10px 10px 10px 16px' }}
    >
      {children}
    </div>
  </Ctx.Provider>
);

// ── Textarea — flex-1, grows vertically ───────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const PromptInputTextarea: React.FC<TextareaProps> = ({
  className = '', onKeyDown, placeholder, ...rest
}) => {
  const { value, setValue, maxHeight, onSubmit } = useCtx();
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, maxHeight) + 'px';
  }, [value, maxHeight]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit?.(); }
    onKeyDown?.(e);
  };

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={e => setValue(e.target.value)}
      onKeyDown={handleKey}
      placeholder={placeholder}
      rows={1}
      style={{ height: 24, maxHeight, lineHeight: '24px' }}
      className={`flex-1 min-w-0 resize-none bg-transparent text-sm text-on-surface
        placeholder:text-outline outline-none border-none focus:ring-0 py-1 leading-6 ${className}`}
      {...rest}
    />
  );
};

// ── Actions — shrink-0, aligns to bottom of the row ──────────────────────────
interface ActionsProps { children: React.ReactNode; className?: string; }

export const PromptInputActions: React.FC<ActionsProps> = ({ children, className = '' }) => (
  <div className={`flex items-center gap-2 shrink-0 ${className}`}>{children}</div>
);

// ── Send / Stop button ────────────────────────────────────────────────────────
interface SendButtonProps {
  onSubmit: () => void;
  onStop:   () => void;
}

export const PromptSendButton: React.FC<SendButtonProps> = ({ onSubmit }) => {
  const { isLoading, value } = useCtx();
  const canSend = !isLoading && !!value.trim();

  return (
    <>
      <style>{`
        @keyframes rainbow-spin {
          0%   { box-shadow: 0 0 0 3px #ff595e, 0 0 12px 4px #ff595e44; }
          16%  { box-shadow: 0 0 0 3px #ff924c, 0 0 12px 4px #ff924c44; }
          33%  { box-shadow: 0 0 0 3px #ffca3a, 0 0 12px 4px #ffca3a44; }
          50%  { box-shadow: 0 0 0 3px #6a4c93, 0 0 12px 4px #6a4c9344; }
          66%  { box-shadow: 0 0 0 3px #1982c4, 0 0 12px 4px #1982c444; }
          83%  { box-shadow: 0 0 0 3px #8ac926, 0 0 12px 4px #8ac92644; }
          100% { box-shadow: 0 0 0 3px #ff595e, 0 0 12px 4px #ff595e44; }
        }
      `}</style>
      <button
        type="button"
        onClick={canSend ? onSubmit : undefined}
        title={isLoading ? 'Generating…' : 'Send message'}
        disabled={!canSend}
        className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
        style={{
          background: 'linear-gradient(135deg,#c85b32,#d4693a)',
          color: '#fff',
          boxShadow: isLoading
            ? undefined
            : canSend ? '0 4px 14px rgba(200,91,50,0.35)' : 'none',
          animation: isLoading ? 'rainbow-spin 1.4s linear infinite' : 'none',
          pointerEvents: isLoading ? 'none' : undefined,
        }}
      >
        <ArrowUp size={18} strokeWidth={2.5} />
      </button>
    </>
  );
};
