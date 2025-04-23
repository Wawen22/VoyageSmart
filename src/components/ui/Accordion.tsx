'use client';

import React, { useState } from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}

export function AccordionItem({
  title,
  children,
  isOpen = false,
  onToggle,
  className = '',
}: AccordionItemProps) {
  return (
    <div className={cn('border border-border rounded-lg overflow-hidden mb-3', className)}>
      <button
        className="w-full flex justify-between items-center p-4 text-left bg-card hover:bg-muted/50 transition-colors"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="font-medium">{title}</span>
        <ChevronDownIcon
          className={cn(
            'h-5 w-5 text-muted-foreground transition-transform duration-200',
            isOpen ? 'transform rotate-180' : ''
          )}
        />
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-in-out',
          isOpen ? 'max-h-96' : 'max-h-0'
        )}
      >
        <div className="p-4 bg-card/50">{children}</div>
      </div>
    </div>
  );
}

interface AccordionProps {
  items: {
    title: string;
    content: React.ReactNode;
  }[];
  className?: string;
  allowMultiple?: boolean;
}

export default function Accordion({
  items,
  className = '',
  allowMultiple = false,
}: AccordionProps) {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const handleToggle = (index: number) => {
    if (allowMultiple) {
      setOpenItems((prev) =>
        prev.includes(index)
          ? prev.filter((i) => i !== index)
          : [...prev, index]
      );
    } else {
      setOpenItems((prev) => (prev.includes(index) ? [] : [index]));
    }
  };

  return (
    <div className={className}>
      {items.map((item, index) => (
        <AccordionItem
          key={index}
          title={item.title}
          isOpen={openItems.includes(index)}
          onToggle={() => handleToggle(index)}
        >
          {item.content}
        </AccordionItem>
      ))}
    </div>
  );
}
