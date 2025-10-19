'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  color: string;
}

interface CategoryTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function CategoryTabs({ tabs, activeTab, onTabChange }: CategoryTabsProps) {
  return (
    <div className="mb-12">
      {/* Desktop Tabs */}
      <div className="hidden md:flex items-center justify-center gap-3 flex-wrap">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`group relative px-6 py-4 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                isActive
                  ? `bg-gradient-to-r ${tab.color} text-white border-transparent shadow-xl`
                  : 'bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 hover:shadow-lg'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg transition-all duration-300 ${
                  isActive 
                    ? 'bg-white/20' 
                    : 'bg-primary/10 group-hover:bg-primary/20'
                }`}>
                  <Icon className={`h-5 w-5 ${
                    isActive ? 'text-white' : 'text-primary'
                  }`} />
                </div>
                <div className="text-left">
                  <div className={`font-bold text-base ${
                    isActive ? 'text-white' : 'text-foreground'
                  }`}>
                    {tab.label}
                  </div>
                  <div className={`text-xs ${
                    isActive ? 'text-white/90' : 'text-muted-foreground'
                  }`}>
                    {tab.description}
                  </div>
                </div>
              </div>
              
              {/* Active indicator line */}
              {isActive && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-white rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Mobile Tabs - Horizontal Scroll */}
      <div className="md:hidden overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 pb-2 px-1 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-300 whitespace-nowrap ${
                  isActive
                    ? `bg-gradient-to-r ${tab.color} text-white border-transparent shadow-lg`
                    : 'bg-card border-border/50 hover:border-primary/30'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-primary'}`} />
                <span className={`text-sm font-semibold ${
                  isActive ? 'text-white' : 'text-foreground'
                }`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
