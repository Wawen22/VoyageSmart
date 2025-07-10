'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  LinkIcon,
  ClipboardDocumentIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(text);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const components = {
    // Custom code block with syntax highlighting
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const codeString = String(children).replace(/\n$/, '');
      
      if (!inline && match) {
        return (
          <div className="relative group">
            <div className="flex items-center justify-between bg-muted/50 px-4 py-2 rounded-t-lg border border-b-0 border-border">
              <span className="text-xs font-medium text-muted-foreground uppercase">
                {match[1]}
              </span>
              <button
                onClick={() => copyToClipboard(codeString)}
                className="flex items-center space-x-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground bg-background/50 hover:bg-background rounded transition-all duration-200"
              >
                {copiedCode === codeString ? (
                  <>
                    <CheckIcon className="h-3 w-3" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <ClipboardDocumentIcon className="h-3 w-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <SyntaxHighlighter
              style={oneDark}
              language={match[1]}
              PreTag="div"
              className="!mt-0 !rounded-t-none border border-t-0 border-border"
              {...props}
            >
              {codeString}
            </SyntaxHighlighter>
          </div>
        );
      }

      return (
        <code 
          className="px-1.5 py-0.5 bg-muted text-muted-foreground rounded text-sm font-mono" 
          {...props}
        >
          {children}
        </code>
      );
    },

    // Custom headings with anchor links
    h1({ children, ...props }: any) {
      const id = String(children).toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return (
        <h1 
          id={id} 
          className="group flex items-center text-3xl font-bold text-foreground mt-8 mb-4 first:mt-0"
          {...props}
        >
          {children}
          <button
            onClick={() => copyToClipboard(`${window.location.origin}${window.location.pathname}#${id}`)}
            className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <LinkIcon className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          </button>
        </h1>
      );
    },

    h2({ children, ...props }: any) {
      const id = String(children).toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return (
        <h2 
          id={id} 
          className="group flex items-center text-2xl font-semibold text-foreground mt-6 mb-3"
          {...props}
        >
          {children}
          <button
            onClick={() => copyToClipboard(`${window.location.origin}${window.location.pathname}#${id}`)}
            className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <LinkIcon className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        </h2>
      );
    },

    h3({ children, ...props }: any) {
      const id = String(children).toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return (
        <h3 
          id={id} 
          className="group flex items-center text-xl font-semibold text-foreground mt-5 mb-2"
          {...props}
        >
          {children}
          <button
            onClick={() => copyToClipboard(`${window.location.origin}${window.location.pathname}#${id}`)}
            className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <LinkIcon className="h-3 w-3 text-muted-foreground hover:text-foreground" />
          </button>
        </h3>
      );
    },

    // Custom paragraph styling
    p({ children, ...props }: any) {
      return (
        <p className="text-foreground leading-7 mb-4" {...props}>
          {children}
        </p>
      );
    },

    // Custom link styling
    a({ href, children, ...props }: any) {
      const isExternal = href?.startsWith('http');
      return (
        <a
          href={href}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className="text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
          {...props}
        >
          {children}
        </a>
      );
    },

    // Custom list styling
    ul({ children, ...props }: any) {
      return (
        <ul className="list-disc list-inside space-y-2 mb-4 text-foreground" {...props}>
          {children}
        </ul>
      );
    },

    ol({ children, ...props }: any) {
      return (
        <ol className="list-decimal list-inside space-y-2 mb-4 text-foreground" {...props}>
          {children}
        </ol>
      );
    },

    // Custom blockquote styling
    blockquote({ children, ...props }: any) {
      return (
        <blockquote 
          className="border-l-4 border-primary/30 pl-4 py-2 my-4 bg-muted/30 rounded-r-lg italic text-muted-foreground"
          {...props}
        >
          {children}
        </blockquote>
      );
    },

    // Custom table styling
    table({ children, ...props }: any) {
      return (
        <div className="overflow-x-auto my-4">
          <table className="min-w-full border border-border rounded-lg" {...props}>
            {children}
          </table>
        </div>
      );
    },

    thead({ children, ...props }: any) {
      return (
        <thead className="bg-muted/50" {...props}>
          {children}
        </thead>
      );
    },

    th({ children, ...props }: any) {
      return (
        <th className="px-4 py-2 text-left font-semibold text-foreground border-b border-border" {...props}>
          {children}
        </th>
      );
    },

    td({ children, ...props }: any) {
      return (
        <td className="px-4 py-2 text-foreground border-b border-border" {...props}>
          {children}
        </td>
      );
    },

    // Custom horizontal rule
    hr({ ...props }: any) {
      return (
        <hr className="my-8 border-border" {...props} />
      );
    },
  };

  return (
    <div className={`prose prose-slate dark:prose-invert max-w-none animate-fade-in ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
