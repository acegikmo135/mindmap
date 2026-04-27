import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p:          ({node, ...props}) => <p className="mb-3 leading-relaxed last:mb-0" {...props} />,
          h1:         ({node, ...props}) => <h1 className="font-headline text-2xl text-on-surface mb-4 mt-6" {...props} />,
          h2:         ({node, ...props}) => <h2 className="font-headline text-xl text-primary mb-3 mt-5" {...props} />,
          h3:         ({node, ...props}) => <h3 className="font-semibold text-lg text-on-surface mb-2 mt-4" {...props} />,
          ul:         ({node, ...props}) => <ul className="list-disc list-outside ml-6 mb-4 space-y-1" {...props} />,
          ol:         ({node, ...props}) => <ol className="list-decimal list-outside ml-6 mb-4 space-y-1" {...props} />,
          li:         ({node, ...props}) => <li className="pl-1" {...props} />,
          strong:     ({node, ...props}) => <strong className="font-bold text-primary" {...props} />,
          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary/30 pl-4 italic my-4 text-secondary" {...props} />,
          code:       ({node, ...props}) => <code className="bg-surface-container rounded px-1 py-0.5 text-sm font-mono text-primary" {...props} />,
          a:          ({node, ...props}) => <a className="text-primary hover:underline" {...props} />,
          table:      ({node, ...props}) => <div className="overflow-x-auto my-6 rounded-xl" style={{ outline: '1px solid rgba(199,196,216,0.25)' }}><table className="w-full text-sm text-left border-collapse" {...props} /></div>,
          thead:      ({node, ...props}) => <thead className="bg-surface-container text-on-surface uppercase tracking-wider font-semibold" {...props} />,
          tbody:      ({node, ...props}) => <tbody className="divide-y" style={{ borderColor: 'rgba(199,196,216,0.15)' }} {...props} />,
          tr:         ({node, ...props}) => <tr className="hover:bg-surface-container-low transition-colors" {...props} />,
          th:         ({node, ...props}) => <th className="px-4 py-3 font-semibold text-on-surface" style={{ borderBottom: '1px solid rgba(199,196,216,0.2)' }} {...props} />,
          td:         ({node, ...props}) => <td className="px-4 py-3 text-on-surface-variant" style={{ borderBottom: '1px solid rgba(199,196,216,0.1)' }} {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
