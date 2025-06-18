'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  MapPin, 
  Calendar, 
  Hotel, 
  Car, 
  Plane, 
  Train, 
  Info, 
  Star, 
  Clock, 
  DollarSign,
  Users,
  Camera,
  Utensils,
  ShoppingBag,
  Mountain,
  Waves,
  Building,
  TreePine,
  Sun,
  Moon
} from 'lucide-react';

interface FormattedAIResponseProps {
  content: string;
  className?: string;
}

// Mappa delle emoji agli icon components di Lucide
const emojiToIcon: Record<string, React.ComponentType<any>> = {
  '🏨': Hotel,
  '🏠': Building,
  '🚗': Car,
  '✈️': Plane,
  '🚂': Train,
  '📅': Calendar,
  '📍': MapPin,
  '⭐': Star,
  '🕐': Clock,
  '💰': DollarSign,
  '👥': Users,
  '📸': Camera,
  '🍽️': Utensils,
  '🛍️': ShoppingBag,
  '🏔️': Mountain,
  '🌊': Waves,
  '🌲': TreePine,
  '☀️': Sun,
  '🌙': Moon,
  'ℹ️': Info,
};

// Componente personalizzato per il rendering degli elementi
const components = {
  // Personalizza i titoli
  h1: ({ children, ...props }: any) => (
    <h1 className="text-xl font-bold text-foreground mb-3 mt-4 first:mt-0 border-b border-border pb-2" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: any) => (
    <h2 className="text-lg font-semibold text-foreground mb-2 mt-3 first:mt-0" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: any) => (
    <h3 className="text-base font-medium text-foreground mb-2 mt-3 first:mt-0" {...props}>
      {children}
    </h3>
  ),
  
  // Personalizza i paragrafi
  p: ({ children, ...props }: any) => {
    // Se il paragrafo contiene emoji specifiche, aggiungi icone
    const content = typeof children === 'string' ? children : '';
    const hasSpecialEmoji = Object.keys(emojiToIcon).some(emoji => content.includes(emoji));
    
    if (hasSpecialEmoji) {
      return (
        <div className="mb-3 p-3 bg-muted/30 rounded-lg border-l-4 border-primary/30" {...props}>
          <p className="text-sm leading-relaxed text-foreground flex items-start gap-2">
            {processContentWithIcons(children)}
          </p>
        </div>
      );
    }
    
    return (
      <p className="text-sm leading-relaxed text-foreground mb-3" {...props}>
        {children}
      </p>
    );
  },
  
  // Personalizza le liste
  ul: ({ children, ...props }: any) => (
    <ul className="space-y-2 mb-4 pl-4" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol className="space-y-2 mb-4 pl-4" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: any) => (
    <li className="text-sm text-foreground flex items-start gap-2" {...props}>
      <span className="text-primary mt-1.5 text-xs">•</span>
      <span className="flex-1">{children}</span>
    </li>
  ),
  
  // Personalizza il testo in grassetto
  strong: ({ children, ...props }: any) => (
    <strong className="font-semibold text-foreground" {...props}>
      {children}
    </strong>
  ),
  
  // Personalizza i link
  a: ({ children, href, ...props }: any) => (
    <a 
      href={href} 
      className="text-primary hover:text-primary/80 underline font-medium transition-colors" 
      target="_blank" 
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
  
  // Personalizza le citazioni
  blockquote: ({ children, ...props }: any) => (
    <blockquote className="border-l-4 border-primary/50 pl-4 py-2 my-4 bg-muted/20 rounded-r-lg italic text-muted-foreground" {...props}>
      {children}
    </blockquote>
  ),
  
  // Personalizza il codice inline
  code: ({ children, ...props }: any) => (
    <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground" {...props}>
      {children}
    </code>
  ),
  
  // Personalizza i blocchi di codice
  pre: ({ children, ...props }: any) => (
    <pre className="bg-muted p-3 rounded-lg overflow-x-auto text-xs font-mono mb-4 border" {...props}>
      {children}
    </pre>
  ),
};

// Funzione per processare il contenuto e sostituire le emoji con icone
const processContentWithIcons = (content: any): React.ReactNode => {
  if (typeof content !== 'string') {
    return content;
  }

  // Cerca la prima emoji nel testo e sostituiscila con un'icona
  for (const [emoji, IconComponent] of Object.entries(emojiToIcon)) {
    const index = content.indexOf(emoji);
    if (index !== -1) {
      const beforeEmoji = content.slice(0, index);
      const afterEmoji = content.slice(index + emoji.length);

      return (
        <>
          <IconComponent
            size={16}
            className="text-primary flex-shrink-0 mt-0.5"
          />
          <span className="flex-1">
            {beforeEmoji}
            {afterEmoji}
          </span>
        </>
      );
    }
  }

  return content;
};

export default function FormattedAIResponse({ content, className = '' }: FormattedAIResponseProps) {
  return (
    <div className={`formatted-ai-response prose prose-sm dark:prose-invert max-w-full ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
