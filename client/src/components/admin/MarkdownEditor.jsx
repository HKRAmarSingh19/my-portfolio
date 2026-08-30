import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Eye, Edit3, Sparkles } from 'lucide-react';

export const MarkdownEditor = ({ value, onChange, placeholder = 'Write your markdown content here...' }) => {
  const [tab, setTab] = useState('write');

  return (
    <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900">
      <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-950 border-b border-neutral-800 text-xs font-mono">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTab('write')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              tab === 'write' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Write</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              tab === 'preview' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('split')}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              tab === 'split' ? 'bg-neutral-800 text-white font-medium' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Side-by-Side</span>
          </button>
        </div>
        <span className="text-neutral-500 text-[11px]">Markdown & GFM supported</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2">
        {(tab === 'write' || tab === 'split') && (
          <div className={`${tab === 'split' ? 'border-r border-neutral-800' : 'col-span-full'}`}>
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              rows={16}
              className="w-full h-full p-4 bg-transparent font-mono text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none resize-y min-h-[320px]"
            />
          </div>
        )}

        {(tab === 'preview' || tab === 'split') && (
          <div className={`p-4 overflow-y-auto max-h-[500px] bg-neutral-900/50 ${tab === 'preview' ? 'col-span-full min-h-[320px]' : ''}`}>
            {value ? (
              <div className="prose-editorial prose-invert max-w-none text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                  {value}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="text-neutral-600 italic text-sm p-4 text-center">
                Markdown preview will render here...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default MarkdownEditor;
