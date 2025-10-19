'use client';

import React, { useEffect, useCallback } from 'react';
import { X, ExternalLink, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    category: string;
    categoryColor: string;
    highlights: string[];
    badge?: {
      text: string;
      icon?: React.ReactNode;
    };
    image?: string;
    imagePlaceholder?: React.ReactNode;
    cta?: {
      text: string;
      action: () => void;
    };
  } | null;
}

export default function FeatureModal({ isOpen, onClose, feature }: FeatureModalProps) {
  // Handle ESC key
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen || !feature) return null;

  const colorClasses = {
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/20 text-purple-600 dark:text-purple-400',
    indigo: 'from-indigo-500/20 to-indigo-500/5 border-indigo-500/20 text-indigo-600 dark:text-indigo-400',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/20 text-blue-600 dark:text-blue-400',
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    teal: 'from-teal-500/20 to-teal-500/5 border-teal-500/20 text-teal-600 dark:text-teal-400',
    cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/20 text-cyan-600 dark:text-cyan-400',
    pink: 'from-pink-500/20 to-pink-500/5 border-pink-500/20 text-pink-600 dark:text-pink-400',
    green: 'from-green-500/20 to-green-500/5 border-green-500/20 text-green-600 dark:text-green-400',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400',
    rose: 'from-rose-500/20 to-rose-500/5 border-rose-500/20 text-rose-600 dark:text-rose-400',
    primary: 'from-primary/20 to-primary/5 border-primary/20 text-primary',
  };

  const iconBgClass = colorClasses[feature.color as keyof typeof colorClasses] || colorClasses.primary;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-background border-2 border-border rounded-3xl shadow-2xl pointer-events-auto animate-scale-in"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-background/80 backdrop-blur-sm border border-border rounded-full hover:bg-accent transition-all duration-200 hover:scale-110"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Content */}
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Visual */}
              <div className="space-y-6">
                {/* Category Badge */}
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r border ${iconBgClass}`}>
                  {feature.badge?.icon}
                  {feature.category}
                </div>

                {/* Icon & Title */}
                <div className="space-y-4">
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br border-2 shadow-lg ${iconBgClass}`}>
                    <div className="scale-150">
                      {feature.icon}
                    </div>
                  </div>
                  
                  <div>
                    <h2 id="modal-title" className="text-3xl md:text-4xl font-bold mb-2">
                      {feature.title}
                    </h2>
                    <p className="text-lg text-muted-foreground">
                      {feature.subtitle}
                    </p>
                  </div>
                </div>

                {/* Media Preview */}
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-muted/50 to-muted/20 border-2 border-border">
                  {feature.image ? (
                    <img 
                      src={feature.image} 
                      alt={feature.title}
                      className="w-full h-full object-cover"
                    />
                  ) : feature.imagePlaceholder ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      {feature.imagePlaceholder}
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center p-6">
                        <div className="scale-150 mb-4 opacity-20">
                          {feature.icon}
                        </div>
                        <p className="text-sm text-muted-foreground">Feature Preview</p>
                      </div>
                    </div>
                  )}
                  
                  {feature.badge && (
                    <div className="absolute top-3 right-3 px-3 py-1 bg-background/90 backdrop-blur-sm rounded-full border border-border">
                      <span className="text-xs font-semibold flex items-center gap-1">
                        {feature.badge.icon}
                        {feature.badge.text}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Details */}
              <div className="space-y-6">
                {/* Description */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    About This Feature
                  </h3>
                  <p className="text-base text-foreground/90 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Highlights */}
                {feature.highlights && feature.highlights.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Key Benefits
                    </h3>
                    <ul className="space-y-3">
                      {feature.highlights.map((highlight, index) => (
                        <li 
                          key={index} 
                          className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors duration-200"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className={`mt-0.5 w-1.5 h-1.5 rounded-full bg-gradient-to-r ${iconBgClass} flex-shrink-0`}></div>
                          <span className="text-sm text-foreground/80">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    size="lg"
                    className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={feature.cta?.action || (() => window.location.href = '/register')}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {feature.cta?.text || 'Try This Feature'}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="flex-1"
                    onClick={onClose}
                  >
                    Close
                  </Button>
                </div>

                {/* Additional Info */}
                <div className="pt-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground text-center">
                    Available in {feature.category === 'AI-Powered Intelligence' ? 'AI Assistant Plan' : 'Premium & AI Plans'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
