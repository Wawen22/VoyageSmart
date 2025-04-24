'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useSubscription } from '@/lib/subscription';
import { Button } from '@/components/ui/button';
import RippleButton from '@/components/ui/RippleButton';
import AnimatedList from '@/components/ui/AnimatedList';
import ParallaxSection from '@/components/ui/ParallaxSection';
import Accordion from '@/components/ui/Accordion';
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MapPinIcon,
  CalendarIcon,
  UsersIcon,
  PlaneTakeoffIcon,
  DollarSignIcon,
  BuildingIcon,
  MessageCircleIcon,
  CheckIcon,
  XIcon,
  ArrowRightIcon,
  GlobeIcon,
  ShieldIcon,
  StarIcon,
  HelpCircleIcon,
  ChevronDownIcon,
  MousePointerIcon,
  PhoneIcon,
  RocketIcon,
  SparklesIcon,
  CloudIcon,
  Sun,
  Thermometer
} from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const { subscription, isSubscribed, upgradeSubscription } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'premium' | 'ai'>(
    subscription?.tier || 'free'
  );
  const featuresRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleUpgrade = async (plan: 'free' | 'premium' | 'ai') => {
    if (user) {
      try {
        await upgradeSubscription(plan);
      } catch (error) {
        console.error('Error upgrading subscription:', error);
      }
    } else {
      router.push('/register');
    }
  };

  const PricingFeature = ({ included, children }: { included: boolean; children: React.ReactNode }) => (
    <div className="flex items-center space-x-2">
      {included ? (
        <CheckIcon className="h-5 w-5 text-primary" />
      ) : (
        <XIcon className="h-5 w-5 text-muted-foreground" />
      )}
      <span className={included ? 'text-foreground' : 'text-muted-foreground'}>{children}</span>
    </div>
  );

  const features = [
    {
      title: 'Plan Your Trips',
      description: 'Create detailed itineraries, add accommodations, and organize transportation all in one place.',
      icon: <CalendarIcon className="h-6 w-6 text-primary" />,
      delay: 0,
      image: '/images/app-screenshot-1.jpg'
    },
    {
      title: 'Track Expenses',
      description: 'Keep track of your travel budget, split expenses with friends, and see who owes what.',
      icon: <DollarSignIcon className="h-6 w-6 text-primary" />,
      delay: 100,
      image: '/images/app-screenshot-2.jpg'
    },
    {
      title: 'Collaborate',
      description: 'Invite friends and family to join your trip planning, make decisions together, and share memories.',
      icon: <UsersIcon className="h-6 w-6 text-primary" />,
      delay: 200,
      image: '/images/app-screenshot-3.jpg'
    }
  ];

  const benefits = [
    {
      title: 'All-in-One Solution',
      description: 'Everything you need for trip planning in a single app',
      icon: <GlobeIcon className="h-5 w-5 text-primary" />
    },
    {
      title: 'Easy Expense Splitting',
      description: 'No more awkward money conversations with friends',
      icon: <DollarSignIcon className="h-5 w-5 text-primary" />
    },
    {
      title: 'Seamless Collaboration',
      description: 'Real-time updates and communication with travel companions',
      icon: <MessageCircleIcon className="h-5 w-5 text-primary" />
    },
    {
      title: 'Secure & Private',
      description: 'Your travel data is protected and only shared with those you invite',
      icon: <ShieldIcon className="h-5 w-5 text-primary" />
    }
  ];

  const faqItems = [
    {
      title: 'Is VoyageSmart free to use?',
      content: (
        <p>
          VoyageSmart offers a free tier that allows you to create up to 3 trips. For unlimited trips and access to premium features like accommodation and transportation tracking, you can upgrade to our Premium plan.
        </p>
      )
    },
    {
      title: 'How do I invite friends to my trip?',
      content: (
        <p>
          Once you\'ve created a trip, you can invite friends by going to the trip details page and clicking on the "Invite" button. You can then enter their email addresses to send them an invitation.
        </p>
      )
    },
    {
      title: 'Can I use VoyageSmart on my mobile device?',
      content: (
        <p>
          Yes! VoyageSmart is fully responsive and works on all devices, including smartphones and tablets. We\'ve optimized the interface for mobile use, so you can plan your trips on the go.
        </p>
      )
    },
    {
      title: 'How does expense splitting work?',
      content: (
        <p>
          Our expense tracking feature allows you to record expenses and assign them to specific trip participants. The app automatically calculates who owes what, making it easy to settle up at the end of your trip.
        </p>
      )
    },
    {
      title: 'Can I export my itinerary?',
      content: (
        <p>
          Currently, you can view your itinerary within the app. We're working on adding export functionality in a future update, which will allow you to export your itinerary to PDF or share it with non-VoyageSmart users.
        </p>
      )
    }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Navigation Menu */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Image
                src="/images/logo-voyage_smart.png"
                alt="Voyage Smart Logo"
                width={160}
                height={40}
                className="h-8 w-auto"
                priority
              />
            </div>
            <div className="hidden md:flex space-x-6">
              <button
                onClick={() => scrollToSection(featuresRef)}
                className="text-foreground/70 hover:text-primary transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection(pricingRef)}
                className="text-foreground/70 hover:text-primary transition-colors"
              >
                Plans & Pricing
              </button>
              <button
                onClick={() => scrollToSection(faqRef)}
                className="text-foreground/70 hover:text-primary transition-colors"
              >
                FAQ
              </button>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/login"
                className="text-foreground/70 hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer for fixed header */}
      <div className="h-20"></div>

      {/* Hero Section */}
      <ParallaxSection
        className="min-h-screen flex items-center justify-center pt-16 overflow-hidden"
        bgImage="/images/hero-bg.jpg"
        speed={0.3}
        overlayOpacity={0.7}
      >
        <div className="container mx-auto px-4 sm:px-6 relative z-10 py-20 md:py-32">
          <div className="flex flex-col items-center text-center">
            <div className="animate-fade-in flex flex-col items-center">
              <Image
                src="/images/logo-voyage_smart.png"
                alt="Voyage Smart Logo"
                width={400}
                height={120}
                className="h-auto w-auto max-w-[320px] md:max-w-[400px] mb-8"
                priority
              />
              <h1 className="sr-only">Voyage Smart</h1>
            </div>

            <p className="text-xl md:text-3xl text-foreground/90 max-w-3xl mx-auto mb-8 animate-slide-in-bottom delay-200 font-light">
              Your complete travel planning solution. Plan trips, manage expenses, and collaborate with friends all in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12 animate-slide-in-bottom delay-300">
              <RippleButton
                size="lg"
                className="font-medium text-base px-8 shadow-lg hover:shadow-xl transition-shadow"
                feedbackType="ripple"
              >
                <Link href="/register" className="flex items-center gap-2">
                  Get Started <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </RippleButton>

              <Button
                variant="outline"
                size="lg"
                className="font-medium text-base hover-scale bg-background/20 backdrop-blur-sm border-white/20 text-white hover:bg-white/30 hover:text-white"
              >
                <Link href="/login">Log In</Link>
              </Button>
            </div>

            <div className="animate-bounce-once delay-500 mt-8">
              <MousePointerIcon className="h-6 w-6 text-white/70" />
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/30 rounded-full filter blur-3xl animate-pulse opacity-70" />
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-primary/30 rounded-full filter blur-3xl animate-pulse opacity-70" />
      </ParallaxSection>

      {/* Features Section */}
      <section ref={featuresRef} className="py-20 md:py-32 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 animate-fade-in">Powerful Features</h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in delay-100">
              Everything you need to plan the perfect trip from start to finish
            </p>
          </div>

          {features.map((feature, index) => (
            <div
              key={index}
              className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 items-center mb-24 last:mb-0`}
            >
              <div className="w-full md:w-1/2 animate-fade-in" style={{ animationDelay: `${feature.delay}ms` }}>
                <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      width={800}
                      height={500}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                </div>
              </div>

              <div className="w-full md:w-1/2 animate-fade-in" style={{ animationDelay: `${feature.delay + 100}ms` }}>
                <div className="p-6">
                  <div className="flex items-center mb-4 text-primary">
                    <div className="p-3 bg-primary/10 rounded-lg mr-4 group-hover:bg-primary/20 transition-colors">
                      {feature.icon}
                    </div>
                    <h3 className="text-2xl md:text-3xl font-semibold">{feature.title}</h3>
                  </div>
                  <p className="text-lg text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 md:py-32 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Why Choose Voyage Smart</h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Simplify your travel planning and enjoy more of your journey
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {benefits.map((benefit, index) => (
              <Card
                key={index}
                className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-primary/10 h-full"
              >
                <CardContent className="p-6">
                  <div className="p-3 bg-primary/10 rounded-full w-14 h-14 flex items-center justify-center mb-4 mx-auto">
                    {benefit.icon}
                  </div>
                  <h3 className="font-semibold text-xl mb-3 text-center">{benefit.title}</h3>
                  <p className="text-muted-foreground text-center">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* New Features Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-background to-muted/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-muted/30 to-transparent"></div>
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-primary/5 rounded-full filter blur-3xl"></div>
        <div className="absolute top-1/3 left-1/4 w-48 h-48 bg-primary/5 rounded-full filter blur-2xl"></div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-3 py-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">New</Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Latest Features</h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              We're constantly improving VoyageSmart with new features to enhance your travel planning experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg p-6 order-2 md:order-1">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-primary/10 rounded-full mr-4">
                  <MapPinIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Multiple Destinations</h3>
              </div>
              <p className="text-muted-foreground mb-6">
                Plan trips with multiple destinations and easily keep track of all your stops. Perfect for road trips, backpacking adventures, or multi-city business trips.
              </p>
              <div className="bg-muted/30 rounded-lg p-4 border border-border">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center">
                    <span className="inline-flex items-center font-medium text-primary">
                      1. Paris, France
                      <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">Primary</span>
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="inline-flex items-center">
                      2. Lyon, France
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="inline-flex items-center">
                      3. Nice, France
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg p-6 order-1 md:order-2">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-primary/10 rounded-full mr-4">
                  <CloudIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Enhanced Weather Forecast</h3>
              </div>
              <p className="text-muted-foreground mb-6">
                Get accurate weather forecasts for all your destinations in a beautiful, modern interface. Plan your activities with confidence knowing the weather conditions.
              </p>
              <div className="bg-gradient-to-r from-primary/5 to-transparent rounded-lg p-4 border border-border overflow-hidden relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-full bg-primary/10">
                      <CloudIcon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">Weather Forecast</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary border border-background">P</div>
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary border border-background">L</div>
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary border border-background">N</div>
                    </div>
                    <button className="text-muted-foreground p-1 rounded-full hover:bg-muted/20">
                      <ChevronDownIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      <Sun className="h-8 w-8 text-yellow-400" />
                    </div>
                    <div className="flex items-center">
                      <Thermometer className="h-3 w-3 mr-1 text-primary" />
                      <span className="text-sm font-medium">24°C</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Paris, France
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section ref={pricingRef} className="py-20 md:py-32 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Choose Your Plan</h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Whether you're planning a single trip or multiple journeys, we have a plan that fits your needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 max-w-6xl mx-auto">
            {/* Free Plan */}
            <Card className={`border-2 ${selectedPlan === 'free' ? 'border-primary' : 'border-border'} hover:shadow-lg transition-shadow h-full`}>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  <StarIcon className="h-10 w-10 text-primary" />
                </div>
                <CardTitle>Free</CardTitle>
                <CardDescription>Perfect for occasional travelers</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">€0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <PricingFeature included={true}>Up to 3 trips</PricingFeature>
                <PricingFeature included={true}>Basic itinerary planning</PricingFeature>
                <PricingFeature included={true}>Expense tracking</PricingFeature>
                <PricingFeature included={true}>Trip collaboration</PricingFeature>
                <PricingFeature included={false}>Accommodations management</PricingFeature>
                <PricingFeature included={false}>Transportation tracking</PricingFeature>
                <PricingFeature included={false}>Priority support</PricingFeature>
              </CardContent>
              <CardFooter className="flex justify-center pt-4">
                {user && isSubscribed && isSubscribed('free') && !isSubscribed('premium') ? (
                  <Badge variant="outline" className="px-4 py-2">Current Plan</Badge>
                ) : user ? (
                  <Button
                    variant={selectedPlan === 'free' ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => setSelectedPlan('free')}
                  >
                    {isSubscribed && isSubscribed('premium') ? 'Downgrade' : 'Select'}
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => router.push('/register')}
                  >
                    Get Started
                  </Button>
                )}
              </CardFooter>
            </Card>

            {/* Premium Plan */}
            <Card className={`border-2 ${selectedPlan === 'premium' ? 'border-primary' : 'border-border'} hover:shadow-lg transition-shadow relative h-full`}>
              <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                <Badge className="bg-primary text-primary-foreground">Popular</Badge>
              </div>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  <RocketIcon className="h-10 w-10 text-primary" />
                </div>
                <CardTitle>Premium</CardTitle>
                <CardDescription>For frequent travelers</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">€4.99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <PricingFeature included={true}>Unlimited trips</PricingFeature>
                <PricingFeature included={true}>Advanced itinerary planning</PricingFeature>
                <PricingFeature included={true}>Expense tracking</PricingFeature>
                <PricingFeature included={true}>Trip collaboration</PricingFeature>
                <PricingFeature included={true}>Accommodations management</PricingFeature>
                <PricingFeature included={true}>Transportation tracking</PricingFeature>
                <PricingFeature included={true}>Priority support</PricingFeature>
              </CardContent>
              <CardFooter className="flex justify-center pt-4">
                {user && isSubscribed && isSubscribed('premium') ? (
                  <Badge variant="outline" className="px-4 py-2">Current Plan</Badge>
                ) : user ? (
                  <Button
                    variant={selectedPlan === 'premium' ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => setSelectedPlan('premium')}
                  >
                    Select
                  </Button>
                ) : (
                  <Badge variant="outline" className="px-4 py-2">Login to Subscribe</Badge>
                )}
              </CardFooter>
            </Card>

            {/* AI Plan */}
            <Card className="border-2 border-border hover:shadow-lg transition-shadow h-full relative overflow-hidden">
              {/* Coming Soon Ribbon */}
              <div className="absolute -right-12 top-8 transform rotate-45 z-10">
                <div className="bg-primary text-primary-foreground py-1 px-12 text-sm font-medium shadow-md">
                  Coming Soon
                </div>
              </div>

              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-background/80 pointer-events-none"></div>

              <CardHeader className="text-center relative z-1">
                <div className="flex justify-center mb-2">
                  <div className="rounded-full">
                    <SparklesIcon className="h-10 w-10 text-primary animate-pulse-once" />
                  </div>
                </div>
                <CardTitle>AI Assistant</CardTitle>
                <CardDescription>Our most advanced plan</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">€9.99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 relative z-1">
                <PricingFeature included={true}>All Premium features</PricingFeature>
                <PricingFeature included={true}>AI trip recommendations</PricingFeature>
                <PricingFeature included={true}>Smart itinerary optimization</PricingFeature>
                <PricingFeature included={true}>Budget forecasting</PricingFeature>
                <PricingFeature included={true}>Personalized travel insights</PricingFeature>
                <PricingFeature included={true}>Weather alerts</PricingFeature>
                <PricingFeature included={true}>24/7 AI travel assistant</PricingFeature>
              </CardContent>
              <CardFooter className="flex justify-center pt-4 relative z-1">
                <Button variant="outline" className="px-4 py-2 opacity-75 cursor-not-allowed" disabled>
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  Join Waitlist
                </Button>
              </CardFooter>
            </Card>
          </div>

          {user && selectedPlan && subscription?.tier !== selectedPlan && (
            <div className="flex justify-center mt-8">
              <Button
                size="lg"
                onClick={() => handleUpgrade(selectedPlan)}
                className="animate-pulse-once"
              >
                {subscription?.tier === 'free' && selectedPlan === 'premium'
                  ? 'Upgrade to Premium'
                  : subscription?.tier === 'premium' && selectedPlan === 'free'
                  ? 'Downgrade to Free'
                  : `Switch to ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}`}
              </Button>
            </div>
          )}

          <div className="mt-16 bg-card border border-border rounded-lg p-6 max-w-4xl mx-auto">
            <h3 className="text-xl font-semibold mb-4">Frequently Asked Questions About Pricing</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Can I upgrade or downgrade my plan at any time?</h4>
                <p className="text-muted-foreground">Yes, you can change your plan at any time. When upgrading, you'll have immediate access to new features. When downgrading, you'll keep premium features until the end of your billing period.</p>
              </div>
              <div>
                <h4 className="font-medium">What happens to my data if I downgrade?</h4>
                <p className="text-muted-foreground">Your data is always preserved. However, if you downgrade to Free and have more than 3 trips, you won't be able to create new trips until you're below the limit. You'll also lose access to Accommodations and Transportation features.</p>
              </div>
              <div>
                <h4 className="font-medium">When will the AI Assistant plan be available?</h4>
                <p className="text-muted-foreground">We're working hard to bring AI features to VoyageSmart. Sign up for our newsletter to be the first to know when it launches.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section ref={faqRef} className="py-20 md:py-32 bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Find answers to common questions about VoyageSmart
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion items={faqItems} className="mb-8" />

            <div className="text-center mt-12">
              <p className="text-muted-foreground mb-4">Still have questions?</p>
              <Button variant="outline" className="group">
                <PhoneIcon className="h-4 w-4 mr-2" />
                <span>Contact Support</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-card/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center mb-4">
                <Image
                  src="/images/logo-voyage_smart.png"
                  alt="Voyage Smart Logo"
                  width={160}
                  height={40}
                  className="h-10 w-auto"
                />
              </div>
              <p className="text-muted-foreground max-w-md mb-4">Travel planning made easy. Plan trips, manage expenses, and collaborate with friends all in one place.</p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-lg mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => scrollToSection(pricingRef)}
                    className="text-muted-foreground hover:text-primary transition-colors text-left"
                  >
                    Plans & Pricing
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection(featuresRef)}
                    className="text-muted-foreground hover:text-primary transition-colors text-left"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection(faqRef)}
                    className="text-muted-foreground hover:text-primary transition-colors text-left"
                  >
                    FAQ
                  </button>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    Support
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-lg mb-4">Account</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/login" className="text-muted-foreground hover:text-primary transition-colors">
                    Log In
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="text-muted-foreground hover:text-primary transition-colors">
                    Sign Up
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-border/50 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} VoyageSmart. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
