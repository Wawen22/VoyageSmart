'use client';

import { useState, useEffect } from 'react';
import { X, Cookie, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { updateConsentSettings } from '@/lib/services/gdprService';
import Link from 'next/link';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    analytics: false,
    marketing: false,
    aiProcessing: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const hasConsent = localStorage.getItem('cookie-consent-given');
    if (!hasConsent) {
      // Show banner after a short delay for better UX
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  const handleAcceptAll = () => {
    const allConsents = {
      necessary: true,
      analytics: true,
      marketing: true,
      aiProcessing: true,
      thirdPartySharing: true,
    };
    
    updateConsentSettings(allConsents);
    localStorage.setItem('cookie-consent-given', 'true');
    setShowBanner(false);
  };

  const handleRejectNonEssential = () => {
    const essentialOnly = {
      necessary: true,
      analytics: false,
      marketing: false,
      aiProcessing: false,
      thirdPartySharing: false,
    };
    
    updateConsentSettings(essentialOnly);
    localStorage.setItem('cookie-consent-given', 'true');
    setShowBanner(false);
  };

  const handleSavePreferences = () => {
    updateConsentSettings({
      necessary: true,
      analytics: preferences.analytics,
      marketing: preferences.marketing,
      aiProcessing: preferences.aiProcessing,
      thirdPartySharing: preferences.analytics || preferences.marketing,
    });
    localStorage.setItem('cookie-consent-given', 'true');
    setShowBanner(false);
    setShowSettings(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto" />
      
      {/* Banner */}
      <div className="relative w-full max-w-4xl mx-4 mb-4 pointer-events-auto">
        <div className="glass-card border-2 border-border/50 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 p-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Cookie className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Cookie & Privacy Settings</h3>
                  <p className="text-sm text-muted-foreground">We value your privacy</p>
                </div>
              </div>
              <button
                onClick={handleRejectNonEssential}
                className="p-2 hover:bg-background/50 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {!showSettings ? (
              // Simple view
              <div className="space-y-4">
                <p className="text-foreground leading-relaxed">
                  We use cookies and similar technologies to enhance your experience, provide personalized 
                  recommendations, and analyze our traffic. By clicking "Accept All", you consent to our use 
                  of cookies.
                </p>
                
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <Link href="/privacy-policy" className="underline hover:text-primary transition-colors">
                    Privacy Policy
                  </Link>
                  <span>•</span>
                  <Link href="/cookie-policy" className="underline hover:text-primary transition-colors">
                    Cookie Policy
                  </Link>
                  <span>•</span>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="underline hover:text-primary transition-colors"
                  >
                    Customize Settings
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    onClick={handleAcceptAll}
                    className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold"
                  >
                    Accept All
                  </Button>
                  <Button
                    onClick={handleRejectNonEssential}
                    variant="outline"
                    className="flex-1"
                  >
                    Reject Non-Essential
                  </Button>
                </div>
              </div>
            ) : (
              // Detailed settings view
              <div className="space-y-6">
                <div className="space-y-4">
                  {/* Necessary Cookies */}
                  <div className="flex items-start justify-between p-4 bg-background/50 rounded-lg border border-border/50">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-1">Necessary Cookies</h4>
                      <p className="text-sm text-muted-foreground">
                        Essential for the website to function. Cannot be disabled.
                      </p>
                    </div>
                    <div className="ml-4">
                      <div className="px-3 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-sm font-medium">
                        Always Active
                      </div>
                    </div>
                  </div>

                  {/* Analytics Cookies */}
                  <div className="flex items-start justify-between p-4 bg-background/50 rounded-lg border border-border/50">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-1">Analytics Cookies</h4>
                      <p className="text-sm text-muted-foreground">
                        Help us understand how visitors interact with our website.
                      </p>
                    </div>
                    <div className="ml-4">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.analytics}
                          onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  </div>

                  {/* Marketing Cookies */}
                  <div className="flex items-start justify-between p-4 bg-background/50 rounded-lg border border-border/50">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-1">Marketing Cookies</h4>
                      <p className="text-sm text-muted-foreground">
                        Used to deliver personalized advertisements and track campaign performance.
                      </p>
                    </div>
                    <div className="ml-4">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.marketing}
                          onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  </div>

                  {/* AI Processing */}
                  <div className="flex items-start justify-between p-4 bg-background/50 rounded-lg border border-border/50">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-1">AI Processing</h4>
                      <p className="text-sm text-muted-foreground">
                        Allow AI-powered features like itinerary generation and smart recommendations.
                      </p>
                    </div>
                    <div className="ml-4">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.aiProcessing}
                          onChange={(e) => setPreferences({ ...preferences, aiProcessing: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    onClick={handleSavePreferences}
                    className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold"
                  >
                    Save Preferences
                  </Button>
                  <Button
                    onClick={() => setShowSettings(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Back
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

