'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Settings2, Compass, Heart, Plane, Sparkles, Repeat, RefreshCw, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import {
  ACCOMMODATION_STYLE_OPTIONS,
  AI_PERSONALITY_OPTIONS,
  BUDGET_LEVEL_OPTIONS,
  DEFAULT_USER_TRAVEL_PREFERENCES,
  DIETARY_RESTRICTION_OPTIONS,
  INTEREST_OPTIONS,
  MOBILITY_LEVEL_OPTIONS,
  PREFERRED_CLIMATE_OPTIONS,
  TRANSPORTATION_MODE_OPTIONS,
  TRAVEL_STYLE_OPTIONS,
  type AccommodationStyle,
  type AiPersonality,
  type BudgetLevel,
  type DietaryRestriction,
  type InterestTag,
  type MobilityLevel,
  type PreferredClimate,
  type TransportationMode,
  type TravelStyle,
  type UserTravelPreferences
} from '@/lib/preferences';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import BackButton from '@/components/ui/BackButton';
import { createClientSupabase } from '@/lib/supabase-client';

type FormState = UserTravelPreferences;

const travelStyleDescriptions: Record<TravelStyle, string> = {
  balanced: 'A mix of discovery and relaxation with room for spontaneity.',
  relaxed: 'Slower pace itineraries with downtime and wellness moments.',
  adventure: 'Active plans packed with outdoor and adrenaline experiences.',
  culture: 'Museums, arts, local culture and hidden gems take priority.',
  luxury: 'High-end stays, premium services and concierge-level planning.',
  budget: 'Optimised plans that stretch savings without missing highlights.'
};

const climateLabels: Record<PreferredClimate, string> = {
  temperate: 'Mild',
  warm: 'Warm & sunny',
  cold: 'Cold & snowy',
  any: 'Surprise me'
};

const mobilityLabels: Record<MobilityLevel, string> = {
  low: 'Prefer minimal walking',
  average: 'Comfortable with moderate walking',
  high: 'Ready for intensive days'
};

const aiToneDescriptions: Record<AiPersonality, string> = {
  balanced: 'Balanced: concise suggestions with relevant details.',
  minimal: 'Minimal: short prompts without extra flourishes.',
  proactive: 'Proactive: anticipates needs with timely reminders.',
  concierge: 'Concierge: premium tone with curated recommendations.'
};

function titleCase(value: string) {
  return value
    .split('-')
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
}

function toggleValue<T extends string>(collection: T[], value: T): T[] {
  return collection.includes(value) ? collection.filter((item) => item !== value) : [...collection, value];
}

export default function PreferenceCenterPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ ...DEFAULT_USER_TRAVEL_PREFERENCES });
  const supabase = useMemo(() => createClientSupabase(), []);

  useEffect(() => {
    if (!user) {
      // Redirect unauthenticated visitors to login
      router.replace('/login');
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    async function loadPreferences() {
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error('Missing session token');
        }

        setAuthToken(session.access_token);

        const response = await fetch('/api/preferences', {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load preferences');
        }

        const payload = await response.json();
        if (isMounted && payload?.preferences) {
          setForm({
            ...DEFAULT_USER_TRAVEL_PREFERENCES,
            ...payload.preferences
          });
        }
      } catch (error: any) {
        if (error.name === 'AbortError') return;
        console.error('Error loading preferences', error);
        toast.error('Unable to load preferences. Please try again later.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadPreferences();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [router, supabase, user]);

  const lastUpdated = useMemo(() => {
    if (!form.updatedAt) return 'Not saved yet';
    try {
      return `Updated ${formatDistanceToNow(new Date(form.updatedAt), { addSuffix: true })}`;
    } catch {
      return 'Recently updated';
    }
  }, [form.updatedAt]);

  const handleTravelStyleChange = (value: string) => {
    if (loading || saving) return;
    setForm((previous) => ({
      ...previous,
      travelStyle: (value as TravelStyle) ?? previous.travelStyle
    }));
  };

  const handleBudgetChange = (value: string) => {
    if (loading || saving) return;
    setForm((previous) => ({
      ...previous,
      budgetLevel: (value as BudgetLevel) ?? previous.budgetLevel
    }));
  };

  const handleAccommodationChange = (value: string) => {
    if (loading || saving) return;
    setForm((previous) => ({
      ...previous,
      accommodationStyle: (value as AccommodationStyle) ?? previous.accommodationStyle
    }));
  };

  const handleClimateChange = (value: PreferredClimate) => {
    if (loading || saving) return;
    setForm((previous) => ({
      ...previous,
      preferredClimate: value
    }));
  };

  const handleMobilityChange = (value: MobilityLevel) => {
    if (loading || saving) return;
    setForm((previous) => ({
      ...previous,
      mobilityLevel: value
    }));
  };

  const handleAiToneChange = (value: string) => {
    if (loading || saving) return;
    setForm((previous) => ({
      ...previous,
      aiPersonality: (value as AiPersonality) ?? previous.aiPersonality
    }));
  };

  const handleInterestToggle = (value: InterestTag) => {
    if (loading || saving) return;
    setForm((previous) => ({
      ...previous,
      interests: toggleValue(previous.interests, value)
    }));
  };

  const handleDietaryToggle = (value: DietaryRestriction) => {
    if (loading || saving) return;
    setForm((previous) => ({
      ...previous,
      dietaryRestrictions: toggleValue(previous.dietaryRestrictions, value)
    }));
  };

  const handleTransportationToggle = (value: TransportationMode) => {
    if (loading || saving) return;
    setForm((previous) => ({
      ...previous,
      transportationModes: toggleValue(previous.transportationModes, value)
    }));
  };

  const handleNotesChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setForm((previous) => ({
      ...previous,
      notes: value.length > 0 ? value : null
    }));
  };

  const handleReset = () => {
    setForm({ ...DEFAULT_USER_TRAVEL_PREFERENCES });
    toast.message('Preferences reset', {
      description: 'Reverted to the default preference profile.'
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    try {
      setSaving(true);

      let token = authToken;
      if (!token) {
        const {
          data: { session }
        } = await supabase.auth.getSession();
        token = session?.access_token ?? null;
        setAuthToken(token);
      }

      if (!token) {
        throw new Error('Not authenticated');
      }

      const { createdAt, updatedAt, ...payload } = form;
      const response = await fetch('/api/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.error ?? 'Failed to save preferences');
      }

      const data = await response.json();
      setForm({
        ...DEFAULT_USER_TRAVEL_PREFERENCES,
        ...data.preferences
      });

      toast.success('Preferences saved', {
        description: 'Your AI assistant will now use these preferences for suggestions.'
      });
    } catch (error: any) {
      console.error('Failed to save preferences', error);
      toast.error('Unable to save preferences', {
        description: error?.message ?? 'Something went wrong. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-primary/10 via-background/95 to-primary/10">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl animate-pulse glass-orb-float"></div>
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-primary/20 rounded-full blur-2xl animate-pulse glass-orb-float" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <BackButton href="/profile" label="Back to Profile" />
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>{lastUpdated}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <div className="inline-flex items-center px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-sm text-primary w-fit">
              <Settings2 className="mr-2 h-4 w-4" />
              Advanced Preference Center
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold text-foreground">
              Tailor VoyageSmart to your travel style
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Your selections guide the AI assistant across itineraries, proactive suggestions, and curated tips.
              Update these at any time to reflect your evolving travel vibe.
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <form onSubmit={handleSubmit} className="space-y-10">
          <Card className="shadow-lg border-border/60 bg-card/95 backdrop-blur">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Compass className="h-6 w-6 text-primary" />
                    Travel Identity
                  </CardTitle>
                  <CardDescription>
                    Shape how VoyageSmart curates itineraries, pacing, and storytelling for you.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={saving || loading}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reset defaults
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-3">Preferred travel style</h2>
                <RadioGroup
                  value={form.travelStyle}
                  onValueChange={handleTravelStyleChange}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {TRAVEL_STYLE_OPTIONS.map((style) => (
                    <Label
                      key={style}
                      className={`relative block border rounded-xl p-4 cursor-pointer transition-all ${
                        form.travelStyle === style
                          ? 'border-primary bg-primary/10 shadow-md'
                          : 'border-border hover:border-primary/50'
                      }`}
                      htmlFor={`travel-style-${style}`}
                    >
                      <RadioGroupItem
                        value={style}
                        id={`travel-style-${style}`}
                        className="absolute right-4 top-4"
                      />
                      <div className="pr-8">
                        <p className="text-sm font-semibold text-foreground capitalize">{titleCase(style)}</p>
                        <p className="mt-2 text-sm text-muted-foreground">{travelStyleDescriptions[style]}</p>
                      </div>
                    </Label>
                  ))}
                </RadioGroup>
              </section>

              <Separator />

              <section>
                <h2 className="text-lg font-semibold text-foreground mb-3">What energises your trips?</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose up to 12 themes and passions. VoyageSmart will bias AI output toward these.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {INTEREST_OPTIONS.map((interest) => {
                    const checked = form.interests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        className={`flex items-center justify-center rounded-full border px-4 py-2 text-sm transition ${
                          checked ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border hover:border-primary/50'
                        }`}
                        aria-pressed={checked}
                        onClick={() => handleInterestToggle(interest)}
                        disabled={loading || saving}
                      >
                        {titleCase(interest)}
                      </button>
                    );
                  })}
                </div>
              </section>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-border/60 bg-card/95 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Heart className="h-6 w-6 text-rose-500" />
                Lifestyle & wellbeing
              </CardTitle>
              <CardDescription>
                Fine-tune mealtime, comfort, and pace so the assistant respects your boundaries.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <section>
                <h3 className="text-sm font-semibold text-foreground mb-2">Dietary requirements</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {DIETARY_RESTRICTION_OPTIONS.map((option) => {
                    const checked = form.dietaryRestrictions.includes(option);
                    return (
                      <Label
                        key={option}
                        className="flex items-center space-x-3 border rounded-lg px-3 py-2 hover:border-primary/50 transition"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => handleDietaryToggle(option)}
                          disabled={loading || saving}
                        />
                        <span className="text-sm">{titleCase(option)}</span>
                      </Label>
                    );
                  })}
                </div>
              </section>

              <Separator />

              <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Preferred climate</h3>
                  <RadioGroup
                    value={form.preferredClimate}
                    onValueChange={(value) => handleClimateChange(value as PreferredClimate)}
                    className="space-y-3"
                  >
                    {PREFERRED_CLIMATE_OPTIONS.map((option) => (
                      <Label
                        key={option}
                        htmlFor={`climate-${option}`}
                        className={`flex items-center justify-between border rounded-lg px-3 py-2 transition ${
                          form.preferredClimate === option ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <span className="text-sm">{climateLabels[option]}</span>
                        <RadioGroupItem value={option} id={`climate-${option}`} />
                      </Label>
                    ))}
                  </RadioGroup>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Mobility comfort</h3>
                  <RadioGroup
                    value={form.mobilityLevel}
                    onValueChange={(value) => handleMobilityChange(value as MobilityLevel)}
                    className="space-y-3"
                  >
                    {MOBILITY_LEVEL_OPTIONS.map((option) => (
                      <Label
                        key={option}
                        htmlFor={`mobility-${option}`}
                        className={`flex items-center justify-between border rounded-lg px-3 py-2 transition ${
                          form.mobilityLevel === option ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <span className="text-sm">{mobilityLabels[option]}</span>
                        <RadioGroupItem value={option} id={`mobility-${option}`} />
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
              </section>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-border/60 bg-card/95 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Plane className="h-6 w-6 text-sky-500" />
                Logistics & tone
              </CardTitle>
              <CardDescription>
                Help VoyageSmart match accommodations, transport, and the assistant&apos;s personality to your vibe.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label className="text-sm font-semibold text-foreground">Budget level</Label>
                <RadioGroup
                  value={form.budgetLevel}
                  onValueChange={handleBudgetChange}
                  className="mt-3 space-y-2"
                  >
                    {BUDGET_LEVEL_OPTIONS.map((option) => (
                      <Label
                        key={option}
                        htmlFor={`budget-${option}`}
                        className={`flex items-center justify-between border rounded-lg px-3 py-2 transition ${
                          form.budgetLevel === option ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <span className="text-sm capitalize">{titleCase(option)}</span>
                        <RadioGroupItem value={option} id={`budget-${option}`} />
                      </Label>
                    ))}
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-foreground">Accommodation style</Label>
                <RadioGroup
                  value={form.accommodationStyle}
                  onValueChange={handleAccommodationChange}
                  className="mt-3 space-y-2"
                  >
                    {ACCOMMODATION_STYLE_OPTIONS.map((option) => (
                      <Label
                        key={option}
                        htmlFor={`accommodation-${option}`}
                        className={`flex items-center justify-between border rounded-lg px-3 py-2 transition ${
                          form.accommodationStyle === option ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <span className="text-sm capitalize">{titleCase(option)}</span>
                        <RadioGroupItem value={option} id={`accommodation-${option}`} />
                      </Label>
                    ))}
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-foreground">AI tone</Label>
                <RadioGroup
                  value={form.aiPersonality}
                  onValueChange={handleAiToneChange}
                  className="mt-3 space-y-2"
                  >
                    {AI_PERSONALITY_OPTIONS.map((option) => (
                      <Label
                        key={option}
                        htmlFor={`ai-tone-${option}`}
                        className={`flex items-start justify-between gap-2 border rounded-lg px-3 py-2 transition ${
                          form.aiPersonality === option ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div>
                          <span className="text-sm font-medium capitalize block">{titleCase(option)}</span>
                          <span className="text-xs text-muted-foreground">{aiToneDescriptions[option]}</span>
                        </div>
                        <RadioGroupItem value={option} id={`ai-tone-${option}`} />
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
              </section>

              <Separator />

              <section>
                <h3 className="text-sm font-semibold text-foreground mb-2">Preferred transportation modes</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {TRANSPORTATION_MODE_OPTIONS.map((option) => {
                    const checked = form.transportationModes.includes(option);
                    return (
                      <Label
                        key={option}
                        className="flex items-center space-x-3 border rounded-lg px-3 py-2 hover:border-primary/50 transition"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => handleTransportationToggle(option)}
                          disabled={loading || saving}
                        />
                        <span className="text-sm capitalize">{titleCase(option)}</span>
                      </Label>
                    );
                  })}
                </div>
              </section>

              <section>
                <Label htmlFor="preference-notes" className="text-sm font-semibold text-foreground">
                  Anything else we should keep in mind?
                </Label>
                <Textarea
                  id="preference-notes"
                  placeholder="Share recurring needs or delightful extras your trips rely on."
                  value={form.notes ?? ''}
                  onChange={handleNotesChange}
                  disabled={loading || saving}
                  className="mt-2 h-32 resize-none"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  These notes stay private and are shared only with your AI assistant for personalisation.
                </p>
              </section>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Repeat className="h-4 w-4" />
              <span>Preferences sync across AI chat, proactive suggestions, and future planning tools.</span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to dashboard
              </Button>
              <Button
                type="submit"
                disabled={saving || loading}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save preferences'}
              </Button>
            </div>
          </div>
        </form>

        {loading && (
          <div className="mt-6 text-sm text-muted-foreground">
            Loading your personalisation profile...
          </div>
        )}
      </main>
    </div>
  );
}
