'use client';

import React from 'react';
import { LucideIcon, ArrowRight, Sparkles } from 'lucide-react';
import { CardSize } from './BentoGrid';

export interface FeatureData {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  category: string;
  badge?: {
    text: string;
    icon?: LucideIcon;
  };
  image?: string;
  imagePlaceholder?: React.ReactNode;
  cardSize: CardSize;
  isNew?: boolean;
  isPro?: boolean;
}

interface EnhancedFeatureCardProps {
  feature: FeatureData;
  onClick: (feature: FeatureData) => void;
  delay?: number;
}

export default function EnhancedFeatureCard({ 
  feature, 
  onClick,
  delay = 0 
}: EnhancedFeatureCardProps) {
  const Icon = feature.icon;
  const BadgeIcon = feature.badge?.icon;

  return (
    <div 
      className={`card-${feature.cardSize} group relative overflow-hidden bg-gradient-to-br from-card/95 via-card/90 to-card/85 backdrop-blur-xl border-2 border-border/50 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer animate-fade-in-up`}
      style={{ animationDelay: `${delay}ms` }}
      onClick={() => onClick(feature)}
    >
      {/* Glowing Background Effect */}
      <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-3xl`}></div>
      
      {/* Top Badges */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        {feature.isNew && (
          <span className="px-3 py-1 bg-emerald-500/90 backdrop-blur-sm rounded-full border border-emerald-300/30 text-xs font-bold text-white">
            NEW
          </span>
        )}
        {feature.isPro && (
          <span className="px-3 py-1 bg-amber-500/90 backdrop-blur-sm rounded-full border border-amber-300/30 text-xs font-bold text-white flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            PRO
          </span>
        )}
      </div>

      {/* Image Preview Area */}
      {(feature.image || feature.imagePlaceholder) && (
        <div className="relative h-40 overflow-hidden">
          {feature.image ? (
            <img 
              src={feature.image} 
              alt={feature.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
              {feature.imagePlaceholder}
            </div>
          )}
          
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 p-6 flex flex-col h-full">
        {/* Icon & Title */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`p-3 bg-gradient-to-br ${feature.color} rounded-xl shadow-lg group-hover:scale-110 transition-all duration-300 flex-shrink-0`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`text-xl font-bold mb-1 bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`}>
              {feature.title}
            </h3>
            {feature.badge && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {BadgeIcon && <BadgeIcon className="h-3 w-3" />}
                <span>{feature.badge.text}</span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-grow">
          {feature.description}
        </p>

        {/* Quick Action Button - Shows on Hover */}
        <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <button className={`w-full flex items-center justify-between px-4 py-2.5 bg-gradient-to-r ${feature.color} text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all duration-300`}>
            <span>Learn More</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-white/10 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none"></div>
    </div>
  );
}
