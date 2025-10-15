"use client";

import { memo } from 'react';

interface ResponseTopicPillsProps {
  topics?: string[];
}

const topicIcon: Record<string, string> = {
  Ristorazione: '🍽️',
  Trasporti: '🚗',
  Itinerario: '📅',
  Alloggi: '🏨',
  Spese: '💰',
  Panoramica: '✨',
};

function ResponseTopicPillsComponent({ topics }: ResponseTopicPillsProps) {
  if (!topics || topics.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {topics.map((topic) => {
        const icon = topicIcon[topic] || '✨';
        return (
          <span
            key={`${topic}-${icon}`}
            className="inline-flex items-center gap-1 rounded-full bg-slate-700/60 px-3 py-1 text-xs font-medium text-slate-200 border border-slate-600/40"
          >
            <span>{icon}</span>
            {topic}
          </span>
        );
      })}
    </div>
  );
}

export const ResponseTopicPills = memo(ResponseTopicPillsComponent);

export default ResponseTopicPills;

