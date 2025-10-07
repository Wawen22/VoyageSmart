'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface ArticleContentProps {
  content: string;
}

export default function ArticleContent({ content }: ArticleContentProps) {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ node, ...props }) => (
            <h1 className="text-4xl font-bold mt-8 mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-3xl font-bold mt-8 mb-4 text-foreground" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-2xl font-bold mt-6 mb-3 text-foreground" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-xl font-bold mt-4 mb-2 text-foreground" {...props} />
          ),

          // Paragraphs
          p: ({ node, ...props }) => (
            <p className="text-foreground/90 leading-relaxed mb-6" {...props} />
          ),

          // Links
          a: ({ node, ...props }) => (
            <a
              className="text-primary hover:text-primary/80 underline underline-offset-4 transition-colors font-medium"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),

          // Lists
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside space-y-2 mb-6 text-foreground/90" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside space-y-2 mb-6 text-foreground/90" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="ml-4" {...props} />
          ),

          // Blockquotes
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-primary pl-6 py-2 my-6 italic bg-primary/5 rounded-r-lg"
              {...props}
            />
          ),

          // Code blocks
          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <div className="my-6 rounded-xl overflow-hidden shadow-lg">
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code
                className="bg-muted px-2 py-1 rounded text-sm font-mono text-primary"
                {...props}
              >
                {children}
              </code>
            );
          },

          // Images
          img: ({ node, ...props }) => (
            <div className="my-8 rounded-xl overflow-hidden shadow-xl">
              <img
                className="w-full h-auto"
                loading="lazy"
                {...props}
              />
            </div>
          ),

          // Tables
          table: ({ node, ...props }) => (
            <div className="my-6 overflow-x-auto rounded-xl border border-border shadow-lg">
              <table className="w-full" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-muted" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="px-4 py-3 text-left font-semibold text-foreground border-b border-border" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-4 py-3 text-foreground/90 border-b border-border/50" {...props} />
          ),

          // Horizontal Rule
          hr: ({ node, ...props }) => (
            <hr className="my-8 border-t-2 border-border/50" {...props} />
          ),

          // Strong/Bold
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-foreground" {...props} />
          ),

          // Emphasis/Italic
          em: ({ node, ...props }) => (
            <em className="italic text-foreground/90" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

