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
          p: ({node, ...props}) => <p className="mb-3 leading-relaxed last:mb-0" {...props} />,
          h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-4 mt-6" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-xl font-bold mb-3 mt-5 text-primary-700 dark:text-primary-300" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-lg font-bold mb-2 mt-4" {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc list-outside ml-6 mb-4 space-y-1" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-6 mb-4 space-y-1" {...props} />,
          li: ({node, ...props}) => <li className="pl-1" {...props} />,
          strong: ({node, ...props}) => <strong className="font-bold text-primary-700 dark:text-primary-300" {...props} />,
          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary-200 pl-4 italic my-4 text-slate-600 dark:text-slate-400" {...props} />,
          code: ({node, ...props}) => <code className="bg-slate-100 dark:bg-slate-800 rounded px-1 py-0.5 text-sm font-mono text-pink-600 dark:text-pink-400" {...props} />,
          a: ({node, ...props}) => <a className="text-blue-500 hover:underline" {...props} />,
          // Table styles
          table: ({node, ...props}) => <div className="overflow-x-auto my-6 rounded-lg border border-slate-200 dark:border-slate-700"><table className="w-full text-sm text-left border-collapse" {...props} /></div>,
          thead: ({node, ...props}) => <thead className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 uppercase tracking-wider font-semibold" {...props} />,
          tbody: ({node, ...props}) => <tbody className="divide-y divide-slate-100 dark:divide-slate-800" {...props} />,
          tr: ({node, ...props}) => <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" {...props} />,
          th: ({node, ...props}) => <th className="px-4 py-3 font-semibold border-b border-slate-200 dark:border-slate-700 text-black dark:text-white" {...props} />,
          td: ({node, ...props}) => <td className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 text-black dark:text-slate-200" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;