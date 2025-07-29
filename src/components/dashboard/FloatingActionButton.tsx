'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PlusIcon,
  MapIcon,
  CalendarIcon,
  CameraIcon,
  XIcon,
  SparklesIcon,
  RocketIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      icon: RocketIcon,
      label: 'New Trip',
      href: '/trips/new',
      gradient: 'from-blue-500 to-cyan-500',
      enabled: true
    },
    {
      icon: CalendarIcon,
      label: 'Quick Itinerary',
      href: '#',
      gradient: 'from-emerald-500 to-teal-500',
      enabled: false
    },
    {
      icon: CameraIcon,
      label: 'Travel Journal',
      href: '#',
      gradient: 'from-purple-500 to-pink-500',
      enabled: false
    }
  ];

  return (
    <div className="fixed bottom-6 inset-x-0 text-center sm:inset-x-auto sm:right-4 sm:text-center z-50">
      {/* Action buttons */}
      <div className={cn(
        "flex flex-col gap-3 mb-4 transition-all duration-300",
        isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}>
        {actions.map((action) => {
          const Icon = action.icon;
          const isDisabled = !action.enabled;

          if (isDisabled) {
            return (
              <div
                key={action.label}
                className={cn(
                  "flex items-center gap-3 bg-muted/50 rounded-xl shadow-sm border border-border opacity-50 cursor-not-allowed"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-md opacity-60",
                  action.gradient
                )}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="pr-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      {action.label}
                    </span>
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                      Coming Soon
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <Link
              key={action.label}
              href={action.href}
              className={cn(
                "group flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 border border-slate-200 dark:border-slate-700"
              )}
              onClick={() => setIsOpen(false)}
            >
              <div className={cn(
                "w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-md transition-all duration-200",
                action.gradient
              )}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="pr-4 py-3">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {action.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main FAB */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group",
          "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        )}
      >
        {/* Icon */}
        <div className="relative z-10 flex items-center justify-center">
          <div className="relative">
            <PlusIcon
              className={cn(
                "h-6 w-6 text-white transition-all duration-300",
                isOpen ? "rotate-45 opacity-0 scale-0" : "rotate-0 opacity-100 scale-100"
              )}
            />
            <XIcon
              className={cn(
                "h-6 w-6 text-white transition-all duration-300 absolute inset-0",
                isOpen ? "rotate-0 opacity-100 scale-100" : "rotate-45 opacity-0 scale-0"
              )}
            />
          </div>
        </div>
      </Button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10 transition-all duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
