'use client';

import React, { useState } from 'react';
import FeatureModal from './FeatureModal';

interface Feature {
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
}

interface FeatureCategory {
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  features: Feature[];
}

interface FeatureGridProps {
  categories: FeatureCategory[];
}

export default function FeatureGrid({ categories }: FeatureGridProps) {
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleFeatureClick = (feature: Feature) => {
    setSelectedFeature(feature);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedFeature(null), 300);
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30 hover:border-purple-500/60 hover:shadow-purple-500/20',
      indigo: 'from-indigo-500/20 to-indigo-500/5 border-indigo-500/30 hover:border-indigo-500/60 hover:shadow-indigo-500/20',
      blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30 hover:border-blue-500/60 hover:shadow-blue-500/20',
      emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/60 hover:shadow-emerald-500/20',
      teal: 'from-teal-500/20 to-teal-500/5 border-teal-500/30 hover:border-teal-500/60 hover:shadow-teal-500/20',
      cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 hover:border-cyan-500/60 hover:shadow-cyan-500/20',
      pink: 'from-pink-500/20 to-pink-500/5 border-pink-500/30 hover:border-pink-500/60 hover:shadow-pink-500/20',
      green: 'from-green-500/20 to-green-500/5 border-green-500/30 hover:border-green-500/60 hover:shadow-green-500/20',
      amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30 hover:border-amber-500/60 hover:shadow-amber-500/20',
      rose: 'from-rose-500/20 to-rose-500/5 border-rose-500/30 hover:border-rose-500/60 hover:shadow-rose-500/20',
      sky: 'from-sky-500/20 to-sky-500/5 border-sky-500/30 hover:border-sky-500/60 hover:shadow-sky-500/20',
      primary: 'from-primary/20 to-primary/5 border-primary/30 hover:border-primary/60 hover:shadow-primary/20',
    };
    return colorMap[color] || colorMap.primary;
  };

  const getCategoryHeaderColor = (color: string) => {
    const colorMap: Record<string, string> = {
      purple: 'from-purple-600 via-purple-500 to-indigo-600',
      indigo: 'from-indigo-600 via-indigo-500 to-blue-600',
      blue: 'from-blue-600 via-blue-500 to-cyan-600',
      emerald: 'from-emerald-600 via-emerald-500 to-teal-600',
      teal: 'from-teal-600 via-teal-500 to-cyan-600',
      cyan: 'from-cyan-600 via-cyan-500 to-blue-600',
      pink: 'from-pink-600 via-pink-500 to-rose-600',
      green: 'from-green-600 via-green-500 to-emerald-600',
      amber: 'from-amber-600 via-amber-500 to-orange-600',
      rose: 'from-rose-600 via-rose-500 to-pink-600',
      primary: 'from-primary via-primary/90 to-primary/80',
    };
    return colorMap[color] || colorMap.primary;
  };

  return (
    <>
      <div className="space-y-16">
        {categories.map((category, categoryIndex) => (
          <div 
            key={category.name}
            className="stagger-content-item"
            style={{ animationDelay: `${categoryIndex * 100}ms` }}
          >
            {/* Category Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${getColorClasses(category.color)} border-2 shadow-lg`}>
                {category.icon}
              </div>
              <div className="flex-1">
                <h3 className={`text-2xl md:text-3xl font-bold bg-gradient-to-r ${getCategoryHeaderColor(category.color)} bg-clip-text text-transparent`}>
                  {category.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {category.description}
                </p>
              </div>
            </div>

            {/* Feature Cards Grid - FIX: Changed from lg:grid-cols-4 to lg:grid-cols-3 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
              {category.features.map((feature, featureIndex) => (
                <button
                  key={feature.id}
                  onClick={() => handleFeatureClick(feature)}
                  className={`group relative flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-br border-2 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${getColorClasses(
                    feature.color
                  )} stagger-item`}
                  style={{ animationDelay: `${(categoryIndex * 300) + (featureIndex * 50)}ms` }}
                  aria-label={`Learn more about ${feature.title}`}
                >
                  {/* Badge */}
                  {feature.badge && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-background/90 backdrop-blur-sm border border-border text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {feature.badge.text}
                    </div>
                  )}

                  {/* Icon */}
                  <div className="mb-3 transform group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>

                  {/* Title */}
                  <h4 className="text-sm font-bold text-center text-foreground group-hover:text-foreground transition-colors duration-200 line-clamp-2">
                    {feature.title}
                  </h4>

                  {/* Hover Indicator */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  
                  {/* Click Ripple Effect */}
                  <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-white/20 transform scale-0 group-active:scale-100 transition-transform duration-300 origin-center rounded-full"></div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Feature Modal */}
      <FeatureModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        feature={selectedFeature}
      />
    </>
  );
}
