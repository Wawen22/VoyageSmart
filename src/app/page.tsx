'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { NavbarLogo, HeroLogo, FooterLogo } from '@/components/ui/OptimizedLogo';
import { FeatureScreenshot } from '@/components/ui/OptimizedScreenshot';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useSubscription } from '@/lib/subscription';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import RippleButton from '@/components/ui/RippleButton';

import Accordion from '@/components/ui/Accordion';
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MapPinIcon,
  CalendarIcon,
  UsersIcon,
  DollarSignIcon,
  CheckIcon,
  XIcon,
  ArrowRightIcon,
  GlobeIcon,
  ShieldIcon,
  StarIcon,
  HelpCircleIcon,
  PhoneIcon,
  RocketIcon,
  SparklesIcon,
  BookOpenIcon,
  ImageIcon,
  PlayIcon,
  ZapIcon,
  TrendingUpIcon,
  HeartIcon,
  AwardIcon,
  ChevronUpIcon,
  HomeIcon,
  LightbulbIcon,
  CheckSquareIcon,
  BarChart3Icon,
  CloudIcon
} from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const { subscription, isSubscribed, upgradeSubscription } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'premium' | 'ai'>(
    subscription?.tier || 'free'
  );
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [selectedMedia, setSelectedMedia] = useState<{
    src: string;
    alt: string;
    title: string;
    type: 'image' | 'video';
  } | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 200);

      // Calculate scroll progress
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      setScrollProgress(Math.min(100, Math.max(0, scrollPercent)));

      // Determine active section
      const sections = [
        { ref: heroRef, id: 'hero' },
        { ref: featuresRef, id: 'features' },
        { ref: pricingRef, id: 'pricing' }
      ];

      const scrollPosition = window.scrollY + 200;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section.ref.current) {
          const sectionTop = section.ref.current.offsetTop;
          if (scrollPosition >= sectionTop) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Call once to set initial state
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const openMediaPopup = (src: string, alt: string, title: string, type: 'image' | 'video' = 'image') => {
    setSelectedMedia({ src, alt, title, type });
    if (typeof window !== 'undefined') {
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
  };

  const closeMediaPopup = () => {
    setSelectedMedia(null);
    if (typeof window !== 'undefined') {
      document.body.style.overflow = 'unset'; // Restore scrolling
    }
  };

  // Close popup on Escape key (hydration-safe)
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedMedia) {
        closeMediaPopup();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [selectedMedia]);



  const handleUpgrade = async (plan: 'free' | 'premium' | 'ai') => {
    if (user) {
      try {
        await upgradeSubscription(plan);
      } catch (error) {
        logger.error('Error upgrading subscription', { error: error instanceof Error ? error.message : String(error) });
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
      title: 'Smart Trip Planning',
      description: 'Create detailed itineraries with AI-powered suggestions, manage accommodations, and organize transportation seamlessly.',
      icon: <CalendarIcon className="h-6 w-6 text-primary" />,
      delay: 0,
      image: '/images/app-screenshot-1.jpg'
    },
    {
      title: 'AI Travel Assistant',
      description: 'Get 24/7 intelligent recommendations, automated itinerary generation, and proactive suggestions tailored to your trip.',
      icon: <SparklesIcon className="h-6 w-6 text-primary" />,
      delay: 100,
      image: '/images/app-screenshots/4_Trip-Details_AI_Chat.png'
    },
    {
      title: 'Travel Journal & Memories',
      description: 'Document your journey with daily entries, organize photos in a beautiful gallery, and create an interactive timeline of memories.',
      icon: <BookOpenIcon className="h-6 w-6 text-primary" />,
      delay: 200,
      image: '/images/app-screenshots/10_TripPlanner_Journal_Timeline-View.jpeg'
    },
    {
      title: 'Smart Expense Tracking',
      description: 'Track expenses with multi-currency support, split costs fairly among travelers, and get real-time balance updates.',
      icon: <DollarSignIcon className="h-6 w-6 text-primary" />,
      delay: 300,
      image: '/images/app-screenshot-2.jpg'
    },
    {
      title: 'Travel Analytics & Insights',
      description: 'Discover patterns in your travel habits with comprehensive analytics on destinations, spending, duration, and preferences.',
      icon: <TrendingUpIcon className="h-6 w-6 text-primary" />,
      delay: 400,
      image: '/images/app-screenshots/2_Dashboard_Analytics.png'
    },
    {
      title: 'Real-Time Collaboration',
      description: 'Plan together with friends and family, share checklists, chat in real-time, and make group decisions effortlessly.',
      icon: <UsersIcon className="h-6 w-6 text-primary" />,
      delay: 500,
      image: '/images/app-screenshot-3.jpg'
    }
  ];





  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none"></div>
      <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-primary/8 via-primary/4 to-transparent rounded-full blur-3xl pointer-events-none"></div>

      {/* Navigation Menu */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-xl border-b border-border/50 h-16 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 h-full">
          <div className="flex justify-between items-center h-full">
            <div className="flex items-center">
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/20 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                <NavbarLogo className="relative z-10 transition-transform duration-300 group-hover:scale-105" />
              </div>
            </div>
            <div className="hidden md:flex space-x-8">
              <Link
                href="/hub"
                className="text-foreground/70 hover:text-primary transition-all duration-300 font-medium relative group"
              >
                Travel Hub
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link
                href="/documentation"
                target="_blank"
                className="text-foreground/70 hover:text-primary transition-all duration-300 font-medium relative group"
              >
                Documentation
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </Link>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/login"
                className="text-foreground/70 hover:text-primary px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-primary/5"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:from-primary/90 hover:to-primary px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} aria-label="Hero section - VoyageSmart AI-powered travel planning" className="min-h-screen lg:min-h-[85vh] xl:min-h-screen w-full flex items-center justify-center relative pt-16 overflow-hidden">
        {/* Animated Background Video */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-5 dark:opacity-10"
          >
            <source src="/images/animated_logo-voyage_smart.mp4" type="video/mp4" />
          </video>
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-12 xl:gap-16">
            {/* Left Side - Content */}
            <div className="flex-1 text-center lg:text-left">
              <div className="space-y-8">
                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-bold leading-tight mt-6 lg:mt-0">
                  <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent">
                    Your Journey,
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 bg-clip-text text-transparent">
                    Simplified
                  </span>
                </h1>

                <p className="text-xl md:text-2xl lg:text-xl xl:text-2xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  The <span className="text-primary font-semibold">AI-powered travel companion</span> that transforms how you plan, organize, and experience your adventures with intelligent suggestions and seamless collaboration.
                </p>

                <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                  <Badge variant="secondary" className="px-4 py-2 text-sm bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
                    <SparklesIcon className="h-4 w-4 mr-2" />
                    AI-Powered
                  </Badge>
                  <Badge variant="secondary" className="px-4 py-2 text-sm bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
                    <UsersIcon className="h-4 w-4 mr-2" />
                    Collaborative
                  </Badge>
                  <Badge variant="secondary" className="px-4 py-2 text-sm bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
                    <ZapIcon className="h-4 w-4 mr-2" />
                    Smart Planning
                  </Badge>
                  <Badge variant="secondary" className="px-4 py-2 text-sm bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
                    <BookOpenIcon className="h-4 w-4 mr-2" />
                    Travel Journal
                  </Badge>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <RippleButton
                    size="lg"
                    className="font-semibold text-lg lg:text-base xl:text-lg px-12 lg:px-8 xl:px-12 py-6 lg:py-4 xl:py-6 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white rounded-2xl shadow-2xl hover:shadow-primary/25 transition-all duration-300 hover:scale-105"
                    feedbackType="ripple"
                  >
                    <Link href="/register" className="flex items-center gap-3">
                      <RocketIcon className="h-6 w-6" />
                      Start Your Journey
                      <ArrowRightIcon className="h-5 w-5 animate-bounce-horizontal" />
                    </Link>
                  </RippleButton>

                  <Button
                    variant="outline"
                    size="lg"
                    className="font-semibold text-lg lg:text-base xl:text-lg px-12 lg:px-8 xl:px-12 py-6 lg:py-4 xl:py-6 bg-background/80 backdrop-blur-sm border-2 border-primary/20 text-foreground hover:bg-primary/5 hover:border-primary/40 transition-all duration-300 hover:scale-105 rounded-2xl shadow-lg"
                  >
                    <Link href="/login" className="flex items-center gap-2">
                      <HeartIcon className="h-5 w-5" />
                      Welcome Back
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Side - Animated Logo */}
            <div className="flex-1 flex justify-center lg:justify-end">
              <div className="relative group">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 rounded-3xl blur-3xl animate-pulse-slow scale-110"></div>

                {/* Logo Container */}
                <div className="relative bg-gradient-to-br from-background/90 to-background/70 backdrop-blur-xl rounded-3xl p-8 lg:p-6 xl:p-8 border border-primary/20 shadow-2xl hover:shadow-primary/20 transition-all duration-500 group-hover:scale-105">
                  <HeroLogo className="w-full h-auto max-w-[400px] md:max-w-[500px] lg:max-w-[400px] xl:max-w-[500px] object-contain" />

                  {/* Floating Indicators */}
                  <div className="absolute -top-3 -right-3 w-6 h-6 bg-gradient-to-r from-green-400 to-green-500 rounded-full animate-ping"></div>
                  <div className="absolute -bottom-3 -left-3 w-4 h-4 bg-gradient-to-r from-primary/60 to-primary/40 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Elements - Simplified */}
        <div className="absolute top-1/4 right-1/12 animate-float opacity-40">
          <div className="bg-primary/10 backdrop-blur-md p-3 rounded-xl shadow-lg border border-primary/20">
            <CalendarIcon className="h-6 w-6 text-primary" />
          </div>
        </div>
        <div className="absolute bottom-1/4 left-1/12 animate-float-delay opacity-40">
          <div className="bg-primary/10 backdrop-blur-md p-3 rounded-xl shadow-lg border border-primary/20">
            <SparklesIcon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section aria-label="How VoyageSmart works - Step by step guide" className="py-20 md:py-32 bg-gradient-to-b from-muted/10 via-background to-background relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-primary/5 to-transparent rounded-full blur-3xl"></div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16 lg:mb-20">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-6 py-3 rounded-full border border-primary/20 mb-6 backdrop-blur-sm">
              <RocketIcon className="h-5 w-5" />
              <span className="font-semibold">Simple Process</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                How VoyageSmart
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Works For You
              </span>
            </h2>

            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              From planning to memories, follow these simple steps to create unforgettable travel experiences
            </p>
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 mb-12">
            {/* Step 1 */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/10 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
              <div className="relative bg-card border-2 border-border/50 rounded-3xl p-8 hover:border-primary/30 transition-all duration-300 h-full">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                      1
                    </div>
                  </div>
                  <h3 className="text-xl font-bold">Create Your Trip</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Set your destination, dates, and invite travel companions to start planning together
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/10 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
              <div className="relative bg-card border-2 border-border/50 rounded-3xl p-8 hover:border-primary/30 transition-all duration-300 h-full">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                      2
                    </div>
                  </div>
                  <h3 className="text-xl font-bold">Plan with AI</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Use our AI Assistant to generate itineraries, get suggestions, and optimize your schedule
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/10 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
              <div className="relative bg-card border-2 border-border/50 rounded-3xl p-8 hover:border-primary/30 transition-all duration-300 h-full">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                      3
                    </div>
                  </div>
                  <h3 className="text-xl font-bold">Track & Organize</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Manage expenses, create checklists, and keep everything organized in one place
                  </p>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/10 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
              <div className="relative bg-card border-2 border-border/50 rounded-3xl p-8 hover:border-primary/30 transition-all duration-300 h-full">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                      4
                    </div>
                  </div>
                  <h3 className="text-xl font-bold">Capture Memories</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Document your journey with photos, journal entries, and create a beautiful timeline
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <p className="text-lg text-muted-foreground mb-6">
              Ready to transform your travel planning experience?
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white px-10 py-6 rounded-2xl text-lg font-semibold shadow-2xl hover:shadow-primary/25 transition-all duration-300 hover:scale-105"
            >
              <Link href="/register" className="flex items-center gap-3">
                <RocketIcon className="h-6 w-6" />
                Get Started Free
                <ArrowRightIcon className="h-5 w-5 animate-bounce-horizontal" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section - Consolidated & Categorized */}
      <section ref={featuresRef} aria-label="VoyageSmart features organized by category" className="py-20 md:py-32 relative overflow-hidden bg-gradient-to-b from-background via-muted/5 to-background">
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-gradient-to-bl from-purple-500/5 via-primary/5 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-primary/8 to-transparent rounded-full blur-3xl"></div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16 lg:mb-20">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-6 py-3 rounded-full border border-primary/20 mb-6 backdrop-blur-sm">
              <AwardIcon className="h-5 w-5" />
              <span className="font-semibold">Complete Platform</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Everything You Need
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                For Perfect Trips
              </span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              A comprehensive suite of tools powered by AI to plan, organize, and capture every moment of your journey
            </p>
          </div>

          {/* AI-Powered Intelligence - MOST PROMINENT */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-xl">
                <SparklesIcon className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 via-primary to-indigo-600 bg-clip-text text-transparent">
                  AI-Powered Intelligence
                </h3>
                <p className="text-muted-foreground text-sm">Let AI handle the heavy lifting</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* AI Travel Assistant */}
              <div className="group bg-card border-2 border-border/50 rounded-2xl overflow-hidden hover:border-purple-500/30 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                {/* Media Preview - Video */}
                <div
                  className="relative h-48 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-indigo-500/10 cursor-pointer overflow-hidden"
                  onClick={() => openMediaPopup('/images/app-screenshots/4_Trip-Details_AI_Chat.png', '24/7 AI Assistant', 'AI Chat Interface', 'image')}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FeatureScreenshot
                      src="/images/app-screenshots/4_Trip-Details_AI_Chat.png"
                      alt="AI Assistant Chat Interface"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                  {/* Play/Expand Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <div className="p-3 bg-purple-500/90 backdrop-blur-sm rounded-full border border-purple-300/30 shadow-xl">
                      <PlayIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  {/* Badge */}
                  <div className="absolute top-3 right-3 px-3 py-1 bg-purple-500/90 backdrop-blur-sm rounded-full border border-purple-300/30">
                    <span className="text-xs font-semibold text-white">Video Demo</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-gradient-to-br from-purple-500/20 to-purple-500/10 rounded-lg group-hover:scale-110 transition-transform">
                      <SparklesIcon className="h-5 w-5 text-purple-500" />
                    </div>
                    <h4 className="text-lg font-bold">24/7 AI Assistant</h4>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Chat with AI for instant recommendations, answers, and personalized travel advice anytime
                  </p>
                </div>
              </div>

              {/* AI Itinerary Wizard */}
              <div className="group bg-card border-2 border-border/50 rounded-2xl overflow-hidden hover:border-indigo-500/30 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                {/* Media Preview - Video Placeholder */}
                <div
                  className="relative h-48 bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-purple-500/10 cursor-pointer overflow-hidden"
                  onClick={() => openMediaPopup('/images/app-screenshot-1.jpg', 'AI Itinerary Wizard', 'AI-Generated Itinerary', 'image')}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FeatureScreenshot
                      src="/images/app-screenshot-1.jpg"
                      alt="AI Itinerary Wizard"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                  {/* Play/Expand Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <div className="p-3 bg-indigo-500/90 backdrop-blur-sm rounded-full border border-indigo-300/30 shadow-xl">
                      <PlayIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  {/* Badge */}
                  <div className="absolute top-3 right-3 px-3 py-1 bg-indigo-500/90 backdrop-blur-sm rounded-full border border-indigo-300/30">
                    <span className="text-xs font-semibold text-white">Video Demo</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-indigo-500/10 rounded-lg group-hover:scale-110 transition-transform">
                      <CalendarIcon className="h-5 w-5 text-indigo-500" />
                    </div>
                    <h4 className="text-lg font-bold">AI Itinerary Wizard</h4>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Generate complete day-by-day itineraries with activities, timing, and location suggestions
                  </p>
                </div>
              </div>

              {/* Proactive Suggestions */}
              <div className="group bg-card border-2 border-border/50 rounded-2xl overflow-hidden hover:border-purple-500/30 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                {/* Media Preview - Image Placeholder */}
                <div
                  className="relative h-48 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-pink-500/10 cursor-pointer overflow-hidden"
                  onClick={() => openMediaPopup('/images/app-screenshot-1.jpg', 'Proactive Suggestions', 'AI Proactive Suggestions', 'image')}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-6">
                      <LightbulbIcon className="h-16 w-16 text-purple-500/40 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Click to preview</p>
                    </div>
                  </div>
                  {/* Expand Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <div className="p-3 bg-purple-500/90 backdrop-blur-sm rounded-full border border-purple-300/30 shadow-xl">
                      <ImageIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  {/* Badge */}
                  <div className="absolute top-3 right-3 px-3 py-1 bg-purple-500/90 backdrop-blur-sm rounded-full border border-purple-300/30">
                    <span className="text-xs font-semibold text-white">Screenshot</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-gradient-to-br from-purple-500/20 to-purple-500/10 rounded-lg group-hover:scale-110 transition-transform">
                      <LightbulbIcon className="h-5 w-5 text-purple-500" />
                    </div>
                    <h4 className="text-lg font-bold">Proactive Suggestions</h4>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Get context-aware recommendations before you need them - packing lists, activities, and tips
                  </p>
                </div>
              </div>

              {/* Smart Budget Optimization */}
              <div className="group bg-card border-2 border-border/50 rounded-2xl overflow-hidden hover:border-indigo-500/30 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                {/* Media Preview - Image Placeholder */}
                <div
                  className="relative h-48 bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-blue-500/10 cursor-pointer overflow-hidden"
                  onClick={() => openMediaPopup('/images/app-screenshot-2.jpg', 'Budget Optimization', 'AI Budget Planning', 'image')}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FeatureScreenshot
                      src="/images/app-screenshot-2.jpg"
                      alt="Budget Optimization"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                  {/* Expand Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <div className="p-3 bg-indigo-500/90 backdrop-blur-sm rounded-full border border-indigo-300/30 shadow-xl">
                      <ImageIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  {/* Badge */}
                  <div className="absolute top-3 right-3 px-3 py-1 bg-indigo-500/90 backdrop-blur-sm rounded-full border border-indigo-300/30">
                    <span className="text-xs font-semibold text-white">Screenshot</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-gradient-to-br from-indigo-500/20 to-indigo-500/10 rounded-lg group-hover:scale-110 transition-transform">
                      <DollarSignIcon className="h-5 w-5 text-indigo-500" />
                    </div>
                    <h4 className="text-lg font-bold">Budget Optimization</h4>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    AI-powered budget planning to maximize your experience within your spending limits
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Planning & Organization */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
                <MapPinIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-bold">Planning & Organization</h3>
                <p className="text-muted-foreground text-sm">Build your perfect itinerary</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Smart Trip Planning */}
              <div className="group bg-card border-2 border-border/50 rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                {/* Media Preview */}
                <div
                  className="relative h-48 bg-gradient-to-br from-primary/10 via-primary/5 to-blue-500/10 cursor-pointer overflow-hidden"
                  onClick={() => openMediaPopup('/images/app-screenshot-1.jpg', 'Smart Trip Planning', 'Trip Planning Interface', 'image')}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FeatureScreenshot
                      src="/images/app-screenshot-1.jpg"
                      alt="Smart Trip Planning"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <div className="p-3 bg-primary/90 backdrop-blur-sm rounded-full border border-primary-foreground/30 shadow-xl">
                      <ImageIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg group-hover:scale-110 transition-transform">
                      <CalendarIcon className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="text-lg font-bold">Smart Trip Planning</h4>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Create detailed itineraries with activities, accommodations, and transportation all in one place
                  </p>
                </div>
              </div>

              {/* Interactive Maps */}
              <div className="group bg-card border-2 border-border/50 rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                {/* Media Preview - Video Placeholder */}
                <div
                  className="relative h-48 bg-gradient-to-br from-emerald-500/10 via-primary/5 to-teal-500/10 cursor-pointer overflow-hidden"
                  onClick={() => openMediaPopup('/images/app-screenshot-3.jpg', 'Interactive Maps', 'Map View Interface', 'image')}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-6">
                      <GlobeIcon className="h-16 w-16 text-primary/40 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Interactive map demo</p>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <div className="p-3 bg-emerald-500/90 backdrop-blur-sm rounded-full border border-emerald-300/30 shadow-xl">
                      <PlayIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 px-3 py-1 bg-emerald-500/90 backdrop-blur-sm rounded-full border border-emerald-300/30">
                    <span className="text-xs font-semibold text-white">Video Demo</span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg group-hover:scale-110 transition-transform">
                      <GlobeIcon className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="text-lg font-bold">Interactive Maps</h4>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Visualize your journey with map, calendar, and list views for all destinations
                  </p>
                </div>
              </div>

              {/* Multi-Destination */}
              <div className="group bg-card border-2 border-border/50 rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                {/* Media Preview */}
                <div
                  className="relative h-48 bg-gradient-to-br from-blue-500/10 via-primary/5 to-cyan-500/10 cursor-pointer overflow-hidden"
                  onClick={() => openMediaPopup('/images/app-screenshot-3.jpg', 'Multi-Destination Planning', 'Multi-Stop Trip View', 'image')}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FeatureScreenshot
                      src="/images/app-screenshot-3.jpg"
                      alt="Multi-Destination Planning"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-900/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <div className="p-3 bg-blue-500/90 backdrop-blur-sm rounded-full border border-blue-300/30 shadow-xl">
                      <ImageIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg group-hover:scale-110 transition-transform">
                      <MapPinIcon className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="text-lg font-bold">Multi-Destination</h4>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Plan complex trips with multiple stops, perfect for road trips and backpacking adventures
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Collaboration & Sharing */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
                <UsersIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-bold">Collaboration & Sharing</h3>
                <p className="text-muted-foreground text-sm">Plan together seamlessly</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Real-Time Collaboration */}
              <div className="group bg-card border-2 border-border/50 rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                {/* Media Preview - Video Placeholder */}
                <div
                  className="relative h-48 bg-gradient-to-br from-pink-500/10 via-primary/5 to-rose-500/10 cursor-pointer overflow-hidden"
                  onClick={() => openMediaPopup('/images/app-screenshot-3.jpg', 'Real-Time Collaboration', 'Collaborative Planning', 'image')}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-6">
                      <UsersIcon className="h-16 w-16 text-primary/40 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Real-time collaboration demo</p>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-pink-900/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <div className="p-3 bg-pink-500/90 backdrop-blur-sm rounded-full border border-pink-300/30 shadow-xl">
                      <PlayIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 px-3 py-1 bg-pink-500/90 backdrop-blur-sm rounded-full border border-pink-300/30">
                    <span className="text-xs font-semibold text-white">Video Demo</span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg group-hover:scale-110 transition-transform">
                      <UsersIcon className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="text-lg font-bold">Real-Time Collaboration</h4>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Plan together with friends and family, chat in real-time, and make group decisions effortlessly
                  </p>
                </div>
              </div>

              {/* Trip Checklists */}
              <div className="group bg-card border-2 border-border/50 rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                {/* Media Preview - Video Placeholder */}
                <div
                  className="relative h-48 bg-gradient-to-br from-green-500/10 via-primary/5 to-emerald-500/10 cursor-pointer overflow-hidden"
                  onClick={() => openMediaPopup('/images/app-screenshot-1.jpg', 'Trip Checklists', 'Checklist Interface', 'image')}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-6">
                      <CheckSquareIcon className="h-16 w-16 text-primary/40 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Drag-and-drop checklist demo</p>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-green-900/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <div className="p-3 bg-green-500/90 backdrop-blur-sm rounded-full border border-green-300/30 shadow-xl">
                      <PlayIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 px-3 py-1 bg-green-500/90 backdrop-blur-sm rounded-full border border-green-300/30">
                    <span className="text-xs font-semibold text-white">Video Demo</span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg group-hover:scale-110 transition-transform">
                      <CheckSquareIcon className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="text-lg font-bold">Trip Checklists</h4>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Create personal and group checklists with drag-and-drop organization and real-time sync
                  </p>
                </div>
              </div>

              {/* Role-Based Permissions */}
              <div className="group bg-card border-2 border-border/50 rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                {/* Media Preview */}
                <div
                  className="relative h-48 bg-gradient-to-br from-amber-500/10 via-primary/5 to-orange-500/10 cursor-pointer overflow-hidden"
                  onClick={() => openMediaPopup('/images/app-screenshot-2.jpg', 'Smart Permissions', 'Permission Management', 'image')}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-6">
                      <ShieldIcon className="h-16 w-16 text-primary/40 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Permission controls</p>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-amber-900/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <div className="p-3 bg-amber-500/90 backdrop-blur-sm rounded-full border border-amber-300/30 shadow-xl">
                      <ImageIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg group-hover:scale-110 transition-transform">
                      <ShieldIcon className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="text-lg font-bold">Smart Permissions</h4>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Control who can view, edit, or manage different aspects of your trip with role-based access
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tracking & Insights */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
                <TrendingUpIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-bold">Tracking & Insights</h3>
                <p className="text-muted-foreground text-sm">Stay organized and informed</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Smart Expense Tracking */}
              <div className="group bg-card border-2 border-border/50 rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                {/* Media Preview */}
                <div
                  className="relative h-48 bg-gradient-to-br from-green-500/10 via-primary/5 to-emerald-500/10 cursor-pointer overflow-hidden"
                  onClick={() => openMediaPopup('/images/app-screenshot-2.jpg', 'Expense Tracking', 'Expense Management Dashboard', 'image')}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FeatureScreenshot
                      src="/images/app-screenshot-2.jpg"
                      alt="Expense Tracking"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-green-900/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <div className="p-3 bg-green-500/90 backdrop-blur-sm rounded-full border border-green-300/30 shadow-xl">
                      <ImageIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg group-hover:scale-110 transition-transform">
                      <DollarSignIcon className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="text-lg font-bold">Expense Tracking</h4>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Track expenses with multi-currency support, split costs fairly, and see real-time balances
                  </p>
                </div>
              </div>

              {/* Travel Analytics */}
              <div className="group bg-card border-2 border-border/50 rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                {/* Media Preview */}
                <div
                  className="relative h-48 bg-gradient-to-br from-blue-500/10 via-primary/5 to-cyan-500/10 cursor-pointer overflow-hidden"
                  onClick={() => openMediaPopup('/images/app-screenshots/2_Dashboard_Analytics.png', 'Travel Analytics', 'Analytics Dashboard', 'image')}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FeatureScreenshot
                      src="/images/app-screenshots/2_Dashboard_Analytics.png"
                      alt="Travel Analytics Dashboard"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-900/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <div className="p-3 bg-blue-500/90 backdrop-blur-sm rounded-full border border-blue-300/30 shadow-xl">
                      <ImageIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg group-hover:scale-110 transition-transform">
                      <BarChart3Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="text-lg font-bold">Travel Analytics</h4>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Discover patterns in your travel with insights on destinations, spending, and preferences
                  </p>
                </div>
              </div>

              {/* Weather Integration */}
              <div className="group bg-card border-2 border-border/50 rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                {/* Media Preview */}
                <div
                  className="relative h-48 bg-gradient-to-br from-sky-500/10 via-primary/5 to-blue-500/10 cursor-pointer overflow-hidden"
                  onClick={() => openMediaPopup('/images/app-screenshot-3.jpg', 'Weather Integration', 'Weather Forecast Widget', 'image')}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-6">
                      <CloudIcon className="h-16 w-16 text-primary/40 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">7-day weather forecast</p>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-sky-900/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    <div className="p-3 bg-sky-500/90 backdrop-blur-sm rounded-full border border-sky-300/30 shadow-xl">
                      <ImageIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg group-hover:scale-110 transition-transform">
                      <CloudIcon className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="text-lg font-bold">Weather Integration</h4>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Real-time weather and 7-day forecasts for all destinations to plan activities perfectly
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white px-10 py-6 rounded-2xl text-lg font-semibold shadow-2xl hover:shadow-primary/25 transition-all duration-300 hover:scale-105"
            >
              <Link href="/register" className="flex items-center gap-3">
                <RocketIcon className="h-6 w-6" />
                Get Started Free
                <ArrowRightIcon className="h-5 w-5 animate-bounce-horizontal" />
              </Link>
            </Button>
          </div>
        </div>
      </section>





      {/* What's New Section */}
      <section aria-label="What's new - Latest VoyageSmart updates and features" className="py-20 md:py-32 bg-gradient-to-b from-muted/10 via-background to-background relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-gradient-to-bl from-emerald-500/5 via-primary/5 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-purple-500/5 via-primary/5 to-transparent rounded-full blur-3xl"></div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16 lg:mb-20">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/10 via-primary/10 to-purple-500/10 text-emerald-600 dark:text-emerald-400 px-6 py-3 rounded-full border border-emerald-500/20 mb-6 backdrop-blur-sm">
              <StarIcon className="h-5 w-5" />
              <span className="font-semibold">What's New</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              <span className="bg-gradient-to-r from-emerald-600 via-primary to-purple-600 bg-clip-text text-transparent">
                Latest Updates
              </span>
              <br />
              <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                & New Features
              </span>
            </h2>

            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Check out our newest features and improvements that make VoyageSmart even better
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
            {/* Proactive AI Suggestions */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-card/90 via-card/80 to-card/70 backdrop-blur-xl border-2 border-border/30 hover:border-emerald-500/40 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              {/* Glowing Background Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-3xl"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>

              {/* Media Preview */}
              <div
                className="relative h-56 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-green-500/10 cursor-pointer overflow-hidden"
                onClick={() => openMediaPopup('/images/app-screenshot-1.jpg', 'Proactive AI Suggestions', 'AI Suggestions Interface', 'image')}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-6">
                    <LightbulbIcon className="h-20 w-20 text-emerald-500/40 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground font-medium">AI Proactive Suggestions Demo</p>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                  <div className="p-4 bg-emerald-500/90 backdrop-blur-sm rounded-full border border-emerald-300/30 shadow-2xl">
                    <PlayIcon className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="absolute top-4 right-4 px-4 py-2 bg-emerald-500/90 backdrop-blur-sm rounded-full border border-emerald-300/30">
                  <span className="text-sm font-bold text-white">Video Demo</span>
                </div>
              </div>

              <div className="relative z-10 p-8 lg:p-10">
                {/* Icon & Title */}
                <div className="flex items-start gap-5 mb-6">
                  <div className="p-4 bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 rounded-2xl shadow-lg group-hover:scale-110 group-hover:shadow-emerald-500/20 transition-all duration-300">
                    <LightbulbIcon className="h-8 w-8 text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl lg:text-3xl font-bold mb-2 bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent group-hover:from-emerald-500 group-hover:to-emerald-600 transition-all duration-300">
                      Proactive AI Suggestions
                    </h3>
                    <p className="text-sm text-muted-foreground">Intelligent recommendations when you need them</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-base text-muted-foreground leading-relaxed mb-6">
                  Get smart, context-aware suggestions automatically based on your trip timeline and preferences. From packing reminders before departure to activity recommendations during your journey.
                </p>

                {/* Feature Highlights */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-emerald-500/5 to-emerald-500/10 border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse mt-2 flex-shrink-0"></div>
                    <p className="text-sm font-medium text-foreground">Upcoming trip reminders with smart packing lists</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-emerald-500/5 to-emerald-500/10 border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse mt-2 flex-shrink-0"></div>
                    <p className="text-sm font-medium text-foreground">In-trip activity suggestions based on location</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-emerald-500/5 to-emerald-500/10 border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse mt-2 flex-shrink-0"></div>
                    <p className="text-sm font-medium text-foreground">Snooze and manage suggestions with ease</p>
                  </div>
                </div>

                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
                  <SparklesIcon className="h-4 w-4" />
                  AI-Powered
                </div>
              </div>
            </div>

            {/* Trip Checklists */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-card/90 via-card/80 to-card/70 backdrop-blur-xl border-2 border-border/30 hover:border-teal-500/40 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              {/* Glowing Background Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-teal-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-3xl"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-teal-500/10 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>

              {/* Media Preview */}
              <div
                className="relative h-56 bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-cyan-500/10 cursor-pointer overflow-hidden"
                onClick={() => openMediaPopup('/images/app-screenshot-1.jpg', 'Trip Checklists', 'Checklist Management', 'image')}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-6">
                    <CheckSquareIcon className="h-20 w-20 text-teal-500/40 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground font-medium">Drag-and-Drop Checklist Demo</p>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-teal-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                  <div className="p-4 bg-teal-500/90 backdrop-blur-sm rounded-full border border-teal-300/30 shadow-2xl">
                    <PlayIcon className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="absolute top-4 right-4 px-4 py-2 bg-teal-500/90 backdrop-blur-sm rounded-full border border-teal-300/30">
                  <span className="text-sm font-bold text-white">Video Demo</span>
                </div>
              </div>

              <div className="relative z-10 p-8 lg:p-10">
                {/* Icon & Title */}
                <div className="flex items-start gap-5 mb-6">
                  <div className="p-4 bg-gradient-to-br from-teal-500/20 to-teal-500/10 rounded-2xl shadow-lg group-hover:scale-110 group-hover:shadow-teal-500/20 transition-all duration-300">
                    <CheckSquareIcon className="h-8 w-8 text-teal-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl lg:text-3xl font-bold mb-2 bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent group-hover:from-teal-500 group-hover:to-teal-600 transition-all duration-300">
                      Trip Checklists
                    </h3>
                    <p className="text-sm text-muted-foreground">Stay organized with smart checklists</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-base text-muted-foreground leading-relaxed mb-6">
                  Create personal and group checklists for every trip. Drag-and-drop to reorder items, check off tasks, and ensure nothing gets forgotten before or during your journey.
                </p>

                {/* Feature Highlights */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-teal-500/5 to-teal-500/10 border border-teal-500/20">
                    <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse mt-2 flex-shrink-0"></div>
                    <p className="text-sm font-medium text-foreground">Personal and group checklists for each trip</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-teal-500/5 to-teal-500/10 border border-teal-500/20">
                    <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse mt-2 flex-shrink-0"></div>
                    <p className="text-sm font-medium text-foreground">Drag-and-drop reordering for easy organization</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-teal-500/5 to-teal-500/10 border border-teal-500/20">
                    <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse mt-2 flex-shrink-0"></div>
                    <p className="text-sm font-medium text-foreground">Real-time sync across all participants</p>
                  </div>
                </div>

                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400 text-sm font-semibold">
                  <CheckSquareIcon className="h-4 w-4" />
                  Collaborative
                </div>
              </div>
            </div>

            {/* Travel Analytics */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-card/90 via-card/80 to-card/70 backdrop-blur-xl border-2 border-border/30 hover:border-blue-500/40 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              {/* Glowing Background Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-3xl"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>

              {/* Media Preview */}
              <div
                className="relative h-56 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-indigo-500/10 cursor-pointer overflow-hidden"
                onClick={() => openMediaPopup('/images/app-screenshots/2_Dashboard_Analytics.png', 'Travel Analytics', 'Analytics Dashboard', 'image')}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <FeatureScreenshot
                    src="/images/app-screenshots/2_Dashboard_Analytics.png"
                    alt="Travel Analytics Dashboard"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                  <div className="p-4 bg-blue-500/90 backdrop-blur-sm rounded-full border border-blue-300/30 shadow-2xl">
                    <ImageIcon className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="absolute top-4 right-4 px-4 py-2 bg-blue-500/90 backdrop-blur-sm rounded-full border border-blue-300/30">
                  <span className="text-sm font-bold text-white">Live Dashboard</span>
                </div>
              </div>

              <div className="relative z-10 p-8 lg:p-10">
                {/* Icon & Title */}
                <div className="flex items-start gap-5 mb-6">
                  <div className="p-4 bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-2xl shadow-lg group-hover:scale-110 group-hover:shadow-blue-500/20 transition-all duration-300">
                    <BarChart3Icon className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl lg:text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent group-hover:from-blue-500 group-hover:to-blue-600 transition-all duration-300">
                      Travel Analytics
                    </h3>
                    <p className="text-sm text-muted-foreground">Insights into your travel patterns</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-base text-muted-foreground leading-relaxed mb-6">
                  Discover fascinating insights about your travel habits. Analyze destinations, spending patterns, trip frequency, and more with beautiful visualizations and comprehensive statistics.
                </p>

                {/* Feature Highlights */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-500/5 to-blue-500/10 border border-blue-500/20">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse mt-2 flex-shrink-0"></div>
                    <p className="text-sm font-medium text-foreground">Comprehensive travel statistics and trends</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-500/5 to-blue-500/10 border border-blue-500/20">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse mt-2 flex-shrink-0"></div>
                    <p className="text-sm font-medium text-foreground">Spending analysis and budget insights</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-500/5 to-blue-500/10 border border-blue-500/20">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse mt-2 flex-shrink-0"></div>
                    <p className="text-sm font-medium text-foreground">Interactive charts and timeline views</p>
                  </div>
                </div>

                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-sm font-semibold">
                  <TrendingUpIcon className="h-4 w-4" />
                  Data-Driven
                </div>
              </div>
            </div>

            {/* Weather Integration */}
            <div className="group relative overflow-hidden bg-gradient-to-br from-card/90 via-card/80 to-card/70 backdrop-blur-xl border-2 border-border/30 hover:border-cyan-500/40 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              {/* Glowing Background Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-3xl"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>

              {/* Media Preview */}
              <div
                className="relative h-56 bg-gradient-to-br from-cyan-500/10 via-sky-500/5 to-blue-500/10 cursor-pointer overflow-hidden"
                onClick={() => openMediaPopup('/images/app-screenshot-3.jpg', 'Weather Integration', 'Weather Forecast Widget', 'image')}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-6">
                    <CloudIcon className="h-20 w-20 text-cyan-500/40 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground font-medium">7-Day Weather Forecast</p>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                  <div className="p-4 bg-cyan-500/90 backdrop-blur-sm rounded-full border border-cyan-300/30 shadow-2xl">
                    <ImageIcon className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="absolute top-4 right-4 px-4 py-2 bg-cyan-500/90 backdrop-blur-sm rounded-full border border-cyan-300/30">
                  <span className="text-sm font-bold text-white">Live Widget</span>
                </div>
              </div>

              <div className="relative z-10 p-8 lg:p-10">
                {/* Icon & Title */}
                <div className="flex items-start gap-5 mb-6">
                  <div className="p-4 bg-gradient-to-br from-cyan-500/20 to-cyan-500/10 rounded-2xl shadow-lg group-hover:scale-110 group-hover:shadow-cyan-500/20 transition-all duration-300">
                    <CloudIcon className="h-8 w-8 text-cyan-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl lg:text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-600 to-cyan-500 bg-clip-text text-transparent group-hover:from-cyan-500 group-hover:to-cyan-600 transition-all duration-300">
                      Weather Integration
                    </h3>
                    <p className="text-sm text-muted-foreground">Real-time weather for your destinations</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-base text-muted-foreground leading-relaxed mb-6">
                  Stay prepared with real-time weather data and forecasts for all your destinations. Plan activities around the weather and pack accordingly with accurate, up-to-date information.
                </p>

                {/* Feature Highlights */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-cyan-500/5 to-cyan-500/10 border border-cyan-500/20">
                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse mt-2 flex-shrink-0"></div>
                    <p className="text-sm font-medium text-foreground">Current weather and 7-day forecasts</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-cyan-500/5 to-cyan-500/10 border border-cyan-500/20">
                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse mt-2 flex-shrink-0"></div>
                    <p className="text-sm font-medium text-foreground">Multi-destination weather tracking</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-cyan-500/5 to-cyan-500/10 border border-cyan-500/20">
                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse mt-2 flex-shrink-0"></div>
                    <p className="text-sm font-medium text-foreground">Temperature, humidity, and precipitation data</p>
                  </div>
                </div>

                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 text-sm font-semibold">
                  <CloudIcon className="h-4 w-4" />
                  Real-Time
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-emerald-500 via-primary to-purple-600 hover:from-emerald-600 hover:via-primary/90 hover:to-purple-700 text-white px-10 py-6 rounded-2xl text-lg font-semibold shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-105"
            >
              <Link href="/register" className="flex items-center gap-3">
                <RocketIcon className="h-6 w-6" />
                Try These Features Now
                <ArrowRightIcon className="h-5 w-5 animate-bounce-horizontal" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section ref={pricingRef} aria-label="Pricing plans and options" className="py-20 md:py-32 bg-gradient-to-b from-background to-muted/20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-muted/10 to-transparent"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-72 h-72 bg-primary/5 rounded-full filter blur-2xl"></div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-20">
            <Badge className="mb-4 px-4 py-1.5 text-sm bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">Pricing</Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Choose Your Plan
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Whether you're planning a single trip or multiple journeys, we have a plan that fits your needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 max-w-6xl mx-auto">
            {/* Free Plan */}
            <Card className={`border-2 ${
              selectedPlan === 'free'
                ? 'border-primary shadow-lg shadow-primary/10'
                : 'border-border/50'
              } hover:shadow-xl transition-all duration-500 hover:-translate-y-2 h-full group hover:border-primary/20 bg-card/50 backdrop-blur-sm rounded-xl overflow-hidden`}
            >
              <CardHeader className="text-center pt-8 pb-6">
                <div className="flex justify-center mb-4">
                  <div className={`p-4 rounded-xl ${
                    selectedPlan === 'free'
                      ? 'bg-primary/20'
                      : 'bg-primary/10 group-hover:bg-primary/15'
                    } transition-colors duration-300 shadow-md`}
                  >
                    <StarIcon className="h-10 w-10 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold mb-2">Free</CardTitle>
                <CardDescription className="text-base">Perfect for occasional travelers</CardDescription>
                <div className="mt-6 flex items-end justify-center">
                  <span className="text-4xl font-bold">€0</span>
                  <span className="text-muted-foreground ml-1 mb-1">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 px-8">
                <div className="h-px w-full bg-border/50 my-4"></div>
                <PricingFeature included={true}>Up to 3 trips</PricingFeature>
                <PricingFeature included={true}>Basic itinerary planning</PricingFeature>
                <PricingFeature included={true}>Expense tracking</PricingFeature>
                <PricingFeature included={true}>Trip collaboration</PricingFeature>
                <PricingFeature included={false}>Accommodations management</PricingFeature>
                <PricingFeature included={false}>Transportation tracking</PricingFeature>
                <PricingFeature included={false}>Priority support</PricingFeature>
              </CardContent>
              <CardFooter className="flex justify-center pt-4 pb-8 px-8">
                {user && isSubscribed && isSubscribed('free') && !isSubscribed('premium') ? (
                  <Badge variant="outline" className="px-6 py-3 text-base border-primary/30 text-primary">Current Plan</Badge>
                ) : user ? (
                  <Button
                    variant={selectedPlan === 'free' ? 'default' : 'outline'}
                    className={`w-full py-6 text-base font-medium rounded-xl ${
                      selectedPlan === 'free'
                        ? 'bg-primary hover:bg-primary/90'
                        : 'hover:bg-primary/10 border-primary/20'
                    } transition-all duration-300`}
                    onClick={() => setSelectedPlan('free')}
                  >
                    {isSubscribed && isSubscribed('premium') ? 'Downgrade' : 'Select'}
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    className="w-full py-6 text-base font-medium rounded-xl bg-primary hover:bg-primary/90 transition-all duration-300"
                    onClick={() => router.push('/register')}
                  >
                    Get Started
                  </Button>
                )}
              </CardFooter>
            </Card>

            {/* Premium Plan */}
            <Card className={`border-2 ${
              selectedPlan === 'premium'
                ? 'border-primary shadow-lg shadow-primary/10'
                : 'border-border/50'
              } hover:shadow-xl transition-all duration-500 hover:-translate-y-2 h-full group hover:border-primary/20 bg-card/50 backdrop-blur-sm rounded-xl overflow-hidden relative scale-105 z-10`}
            >
              <div className="absolute -top-1 -right-1 transform rotate-0 z-20">
                <Badge className="bg-primary text-primary-foreground px-3 py-1.5 rounded-br-xl rounded-tl-xl font-medium shadow-md">
                  Popular
                </Badge>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500"></div>

              <CardHeader className="text-center pt-8 pb-6">
                <div className="flex justify-center mb-4">
                  <div className={`p-4 rounded-xl ${
                    selectedPlan === 'premium'
                      ? 'bg-primary/20'
                      : 'bg-primary/10 group-hover:bg-primary/15'
                    } transition-colors duration-300 shadow-md`}
                  >
                    <RocketIcon className="h-10 w-10 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold mb-2">Premium</CardTitle>
                <CardDescription className="text-base">For frequent travelers</CardDescription>
                <div className="mt-6 flex items-end justify-center">
                  <span className="text-4xl font-bold">€4.99</span>
                  <span className="text-muted-foreground ml-1 mb-1">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 px-8">
                <div className="h-px w-full bg-border/50 my-4"></div>
                <PricingFeature included={true}>Unlimited trips</PricingFeature>
                <PricingFeature included={true}>Advanced itinerary planning</PricingFeature>
                <PricingFeature included={true}>Expense tracking</PricingFeature>
                <PricingFeature included={true}>Trip collaboration</PricingFeature>
                <PricingFeature included={true}>Accommodations management</PricingFeature>
                <PricingFeature included={true}>Transportation tracking</PricingFeature>
                <PricingFeature included={true}>Priority support</PricingFeature>
              </CardContent>
              <CardFooter className="flex justify-center pt-4 pb-8 px-8">
                {user && isSubscribed && isSubscribed('premium') ? (
                  <Badge variant="outline" className="px-6 py-3 text-base border-primary/30 text-primary">Current Plan</Badge>
                ) : user ? (
                  <Button
                    variant={selectedPlan === 'premium' ? 'default' : 'outline'}
                    className={`w-full py-6 text-base font-medium rounded-xl ${
                      selectedPlan === 'premium'
                        ? 'bg-primary hover:bg-primary/90'
                        : 'hover:bg-primary/10 border-primary/20'
                    } transition-all duration-300`}
                    onClick={() => setSelectedPlan('premium')}
                  >
                    Select
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    className="w-full py-6 text-base font-medium rounded-xl bg-primary hover:bg-primary/90 transition-all duration-300"
                    onClick={() => router.push('/register')}
                  >
                    Get Premium
                  </Button>
                )}
              </CardFooter>
            </Card>

            {/* AI Plan */}
            <Card className={`border-2 ${
              selectedPlan === 'ai'
                ? 'border-purple-500 shadow-lg shadow-purple-500/10'
                : 'border-border/50'
              } hover:shadow-xl transition-all duration-500 hover:-translate-y-2 h-full group hover:border-purple-500/20 bg-card/50 backdrop-blur-sm rounded-xl overflow-hidden relative`}>
              {/* AI Badge */}
              <div className="absolute -top-1 -right-1 transform rotate-0 z-20">
                <Badge className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-3 py-1.5 rounded-br-xl rounded-tl-xl font-medium shadow-md">
                  AI Powered
                </Badge>
              </div>

              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-background/80 pointer-events-none"></div>

              <CardHeader className="text-center pt-8 pb-6 relative z-10">
                <div className="flex justify-center mb-4">
                  <div className="p-4 rounded-xl bg-purple-500/10 transition-colors duration-300 shadow-md relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent animate-pulse-slow"></div>
                    <SparklesIcon className="h-10 w-10 text-purple-500 relative z-10" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold mb-2">AI Assistant</CardTitle>
                <CardDescription className="text-base">Our most advanced plan</CardDescription>
                <div className="mt-6 flex items-end justify-center">
                  <span className="text-4xl font-bold">€9.99</span>
                  <span className="text-muted-foreground ml-1 mb-1">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 px-8 relative z-10">
                <div className="h-px w-full bg-border/50 my-4"></div>
                <PricingFeature included={true}>All Premium features</PricingFeature>
                <PricingFeature included={true}>24/7 AI travel assistant</PricingFeature>
                <PricingFeature included={true}>AI itinerary generation wizard</PricingFeature>
                <PricingFeature included={true}>Smart trip recommendations</PricingFeature>
                <PricingFeature included={true}>Intelligent activity suggestions</PricingFeature>
                <PricingFeature included={true}>Personalized travel insights</PricingFeature>
                <PricingFeature included={true}>AI-powered budget optimization</PricingFeature>
              </CardContent>
              <CardFooter className="flex justify-center pt-4 pb-8 px-8 relative z-10">
                {user && isSubscribed && isSubscribed('ai') ? (
                  <Badge variant="outline" className="px-6 py-3 text-base border-purple-500/30 text-purple-500">Current Plan</Badge>
                ) : user ? (
                  <Button
                    variant={selectedPlan === 'ai' ? 'default' : 'outline'}
                    className={`w-full py-6 text-base font-medium rounded-xl ${
                      selectedPlan === 'ai'
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white'
                        : 'hover:bg-purple-500/10 border-purple-500/20 text-purple-500'
                    } transition-all duration-300`}
                    onClick={() => setSelectedPlan('ai')}
                  >
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    Select AI Plan
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    className="w-full py-6 text-base font-medium rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white transition-all duration-300"
                    onClick={() => router.push('/register')}
                  >
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    Get AI Assistant
                  </Button>
                )}
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
                <h4 className="font-medium">What AI features are included in the AI Assistant plan?</h4>
                <p className="text-muted-foreground">The AI Assistant plan includes a 24/7 AI travel assistant, smart itinerary generation with our AI Wizard, personalized recommendations, and more advanced AI features to enhance your travel planning experience.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ready to Start Section */}
      <section className="py-20 md:py-24 bg-gradient-to-b from-background to-primary/5 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-gradient-to-br from-primary/8 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-gradient-to-tl from-primary/6 to-transparent rounded-full blur-3xl"></div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-12">
            <div className="space-y-6">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  Ready to Start
                </span>
                <br />
                <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  Your Adventure?
                </span>
              </h2>

              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Join thousands of travelers who've discovered the magic of AI-powered trip planning with proactive suggestions, smart checklists, and beautiful travel journals.
              </p>

              {/* Feature Highlights */}
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <Badge variant="secondary" className="px-4 py-2 bg-primary/10 text-primary border-primary/20">
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Free to Start
                </Badge>
                <Badge variant="secondary" className="px-4 py-2 bg-primary/10 text-primary border-primary/20">
                  <CheckIcon className="h-4 w-4 mr-2" />
                  No Credit Card Required
                </Badge>
                <Badge variant="secondary" className="px-4 py-2 bg-primary/10 text-primary border-primary/20">
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Setup in 2 Minutes
                </Badge>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <RippleButton
                size="lg"
                className="font-bold text-xl px-12 py-6 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white rounded-2xl shadow-2xl hover:shadow-primary/25 transition-all duration-300 hover:scale-105"
                feedbackType="ripple"
              >
                <Link href="/register" className="flex items-center gap-3">
                  <RocketIcon className="h-6 w-6" />
                  Start Free Today
                  <ArrowRightIcon className="h-5 w-5 animate-bounce-horizontal" />
                </Link>
              </RippleButton>

              <Button
                variant="outline"
                size="lg"
                className="font-bold text-xl px-12 py-6 bg-background/80 backdrop-blur-sm border-2 border-primary/30 text-foreground hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 hover:scale-105 rounded-2xl shadow-lg"
              >
                <Link href="/login" className="flex items-center gap-3">
                  <HeartIcon className="h-6 w-6" />
                  Welcome Back
                </Link>
              </Button>
            </div>

            {/* Help & Support Link - Enhanced Visibility */}
            <div className="pt-8">
              <div className="max-w-2xl mx-auto p-8 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/20 backdrop-blur-sm shadow-xl hover:shadow-2xl hover:border-primary/30 transition-all duration-300">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-primary/20 rounded-full">
                    <HelpCircleIcon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                      Have Questions?
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Visit our Help Center for FAQs, guides, and support
                    </p>
                  </div>
                  <Button
                    size="lg"
                    className="group px-10 py-6 text-lg font-semibold rounded-xl bg-primary/10 hover:bg-primary/20 border-2 border-primary/30 hover:border-primary/50 text-primary transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                    asChild
                  >
                    <Link href="/support" className="flex items-center gap-3">
                      <HelpCircleIcon className="h-6 w-6" />
                      <span>Visit Help Center & FAQ</span>
                      <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/10">
                <ShieldIcon className="h-8 w-8 text-primary" />
                <span className="font-semibold text-foreground">GDPR Compliant</span>
                <span className="text-sm text-muted-foreground text-center">Your data is secure and private</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/10">
                <StarIcon className="h-8 w-8 text-primary" />
                <span className="font-semibold text-foreground">10K+ Users</span>
                <span className="text-sm text-muted-foreground text-center">Trusted by travelers worldwide</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/10">
                <SparklesIcon className="h-8 w-8 text-primary" />
                <span className="font-semibold text-foreground">AI-Powered</span>
                <span className="text-sm text-muted-foreground text-center">Intelligent travel assistance</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 md:py-20 border-t border-border/50 bg-gradient-to-b from-background/95 to-primary/5 backdrop-blur-sm relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/10 to-transparent"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-primary/8 rounded-full filter blur-3xl"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/6 rounded-full filter blur-2xl"></div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
            <div className="md:col-span-2">
              <div className="flex items-center mb-6 md:mb-8">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-2xl filter blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                  <div className="relative bg-gradient-to-br from-background/80 to-background/60 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-primary/20 shadow-lg">
                    <FooterLogo className="h-12 md:h-16 w-auto relative z-10 group-hover:scale-105 transition-transform duration-300" />
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground max-w-lg mb-6 md:mb-8 text-base md:text-lg leading-relaxed">
                AI-powered travel planning made easy. Plan trips, manage expenses, keep a travel journal, get intelligent recommendations, and collaborate with friends all in one place.
              </p>
              <div className="flex space-x-3 md:space-x-4">
                <Button variant="ghost" size="icon" className="rounded-2xl hover:bg-primary/10 transition-all duration-300 hover:scale-110 group border border-transparent hover:border-primary/20 h-10 w-10 md:h-12 md:w-12">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground group-hover:text-primary transition-colors duration-300"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                </Button>
                <Button variant="ghost" size="icon" className="rounded-2xl hover:bg-primary/10 transition-all duration-300 hover:scale-110 group border border-transparent hover:border-primary/20 h-10 w-10 md:h-12 md:w-12">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground group-hover:text-primary transition-colors duration-300"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
                </Button>
                <Button variant="ghost" size="icon" className="rounded-2xl hover:bg-primary/10 transition-all duration-300 hover:scale-110 group border border-transparent hover:border-primary/20 h-10 w-10 md:h-12 md:w-12" asChild>
                  <Link href="https://www.instagram.com/voyagesmart_app/" target="_blank" rel="noopener noreferrer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground group-hover:text-primary transition-colors duration-300"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" className="rounded-2xl hover:bg-primary/10 transition-all duration-300 hover:scale-110 group border border-transparent hover:border-primary/20 h-10 w-10 md:h-12 md:w-12">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground group-hover:text-primary transition-colors duration-300"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg md:text-xl mb-4 md:mb-8 text-foreground bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">Quick Links</h3>
              <ul className="space-y-3 md:space-y-5">
                <li>
                  <button
                    onClick={() => scrollToSection(featuresRef)}
                    className="text-muted-foreground hover:text-primary transition-all duration-300 text-left flex items-center group text-base md:text-lg"
                  >
                    <ArrowRightIcon className="h-4 w-4 mr-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0 text-primary" />
                    <span className="group-hover:translate-x-1 transition-transform duration-300">Features</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection(pricingRef)}
                    className="text-muted-foreground hover:text-primary transition-all duration-300 text-left flex items-center group text-base md:text-lg"
                  >
                    <ArrowRightIcon className="h-4 w-4 mr-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0 text-primary" />
                    <span className="group-hover:translate-x-1 transition-transform duration-300">Plans & Pricing</span>
                  </button>
                </li>
                <li>
                  <Link href="/hub" className="text-muted-foreground hover:text-primary transition-all duration-300 flex items-center group text-base md:text-lg">
                    <ArrowRightIcon className="h-4 w-4 mr-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0 text-primary" />
                    <span className="group-hover:translate-x-1 transition-transform duration-300">Travel Hub</span>
                  </Link>
                </li>

                <li>
                  <Link href="/documentation" className="text-muted-foreground hover:text-primary transition-all duration-300 flex items-center group text-base md:text-lg">
                    <ArrowRightIcon className="h-4 w-4 mr-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0 text-primary" />
                    <span className="group-hover:translate-x-1 transition-transform duration-300">Documentation</span>
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg md:text-xl mb-4 md:mb-8 text-foreground bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">Get Started</h3>
              <ul className="space-y-3 md:space-y-5">
                <li>
                  <Link href="/login" className="text-muted-foreground hover:text-primary transition-all duration-300 flex items-center group text-base md:text-lg">
                    <ArrowRightIcon className="h-4 w-4 mr-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0 text-primary" />
                    <span className="group-hover:translate-x-1 transition-transform duration-300">Log In</span>
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="text-muted-foreground hover:text-primary transition-all duration-300 flex items-center group text-base md:text-lg">
                    <ArrowRightIcon className="h-4 w-4 mr-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0 text-primary" />
                    <span className="group-hover:translate-x-1 transition-transform duration-300">Sign Up Free</span>
                  </Link>
                </li>
                <li>
                  <Link href="/privacy-policy" className="text-muted-foreground hover:text-primary transition-all duration-300 flex items-center group text-base md:text-lg">
                    <ArrowRightIcon className="h-4 w-4 mr-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0 text-primary" />
                    <span className="group-hover:translate-x-1 transition-transform duration-300">Privacy Policy</span>
                  </Link>
                </li>
                <li>
                  <Link href="/terms-of-service" className="text-muted-foreground hover:text-primary transition-all duration-300 flex items-center group text-base md:text-lg">
                    <ArrowRightIcon className="h-4 w-4 mr-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0 text-primary" />
                    <span className="group-hover:translate-x-1 transition-transform duration-300">Terms of Service</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="mt-12 md:mt-20 pt-6 md:pt-8 border-t border-gradient-to-r from-transparent via-border/50 to-transparent">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
              <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-center md:text-left">
                <p className="text-muted-foreground text-sm md:text-lg">© {new Date().getFullYear()} VoyageSmart. All rights reserved.</p>
                <div className="hidden md:flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <span className="text-sm text-primary font-medium">Made with ❤️ for travelers</span>
                </div>
              </div>

              <div className="flex items-center gap-3 md:gap-4">
                <Badge variant="secondary" className="px-3 py-1.5 md:px-4 md:py-2 bg-primary/10 text-primary border-primary/20 text-xs md:text-sm">
                  <SparklesIcon className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                  AI-Powered
                </Badge>
                <Badge variant="secondary" className="px-3 py-1.5 md:px-4 md:py-2 bg-primary/10 text-primary border-primary/20 text-xs md:text-sm">
                  <ShieldIcon className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                  Secure
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Modern Navigation System */}
      {/* Progress Bar - Top */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-background/20">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300 ease-out shadow-sm"
          style={{ width: `${scrollProgress}%` }}
        ></div>
      </div>

      {/* Back to Top Button - Simple and Clean */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-6 lg:bottom-6 lg:right-6 z-50 bg-primary/90 hover:bg-primary text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 backdrop-blur-sm border border-primary/20 animate-fade-in group"
          aria-label="Back to top"
        >
          <ChevronUpIcon className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
        </button>
      )}

      {/* Section Navigation Dots - Left Side - Hidden on mobile */}
      <div className="hidden lg:flex fixed left-4 xl:left-6 top-1/2 transform -translate-y-1/2 z-50 flex-col gap-3 bg-background/90 backdrop-blur-xl rounded-xl p-4 border border-border/50 shadow-xl w-[64px] items-center">
        {[
          { id: 'hero', label: 'Home', icon: HomeIcon },
          { id: 'features', label: 'Features', icon: AwardIcon },
          { id: 'pricing', label: 'Pricing', icon: DollarSignIcon }
        ].map((section) => {
          const isActive = activeSection === section.id;
          const Icon = section.icon;

          return (
            <div key={section.id} className="relative group">
              <button
                onClick={() => {
                  const refs = { hero: heroRef, features: featuresRef, pricing: pricingRef };
                  const ref = refs[section.id as keyof typeof refs];
                  if (ref?.current) {
                    ref.current.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className={`relative w-12 h-12 lg:w-10 lg:h-10 xl:w-12 xl:h-12 rounded-full transition-all duration-300 backdrop-blur-sm border shadow-md hover:shadow-lg hover:scale-105 flex items-center justify-center ${
                  isActive
                    ? 'bg-primary text-white border-primary/20 shadow-primary/25'
                    : 'bg-background/80 text-muted-foreground border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/20'
                }`}
                aria-label={`Go to ${section.label}`}
              >
                <Icon className={`h-4 w-4 lg:h-4 lg:w-4 xl:h-5 xl:w-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-primary rounded-full animate-fade-in"></div>
                )}
              </button>

              {/* Tooltip */}
              <div className="absolute left-full ml-3 lg:ml-2 xl:ml-4 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs lg:text-xs xl:text-sm px-2 lg:px-2 xl:px-3 py-1 lg:py-1 xl:py-2 rounded-md lg:rounded-md xl:rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none shadow-lg z-60">
                {section.label}
                <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-2 lg:border-2 xl:border-4 border-transparent border-r-gray-900"></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Navigation Bar - Bottom (App-style) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/50 shadow-2xl">
        <div className="flex justify-around items-center py-2 px-4 max-w-md mx-auto">
          {[
            { id: 'hero', label: 'Home', icon: HomeIcon },
            { id: 'features', label: 'Features', icon: AwardIcon },
            { id: 'pricing', label: 'Pricing', icon: DollarSignIcon }
          ].map((section) => {
            const isActive = activeSection === section.id;
            const Icon = section.icon;

            return (
              <button
                key={section.id}
                onClick={() => {
                  const refs = { hero: heroRef, features: featuresRef, pricing: pricingRef };
                  const ref = refs[section.id as keyof typeof refs];
                  if (ref?.current) {
                    ref.current.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className={`flex flex-col items-center justify-center py-2 px-1 min-w-0 flex-1 transition-all duration-300 rounded-lg ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-primary'
                }`}
                aria-label={`Go to ${section.label}`}
              >
                <div className={`relative p-1 transition-all duration-300 ${isActive ? 'scale-110' : 'hover:scale-105'}`}>
                  <Icon className={`h-5 w-5 transition-all duration-300 ${isActive ? 'drop-shadow-sm' : ''}`} />
                  {/* Active indicator dot */}
                  {isActive && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  )}
                </div>
                <span className={`text-xs font-medium mt-1 transition-all duration-300 ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                } truncate max-w-full`}>
                  {section.label}
                </span>
                {/* Active underline */}
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full animate-fade-in"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* Safe area for devices with home indicator */}
        <div className="h-safe-area-inset-bottom"></div>
      </div>

      {/* Media Popup Modal */}
      {selectedMedia && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={closeMediaPopup}
        >
          <div
            className="relative max-w-6xl max-h-[90vh] w-full bg-background/95 backdrop-blur-xl rounded-2xl border border-border/50 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border/50 bg-gradient-to-r from-background/80 to-background/60">
              <h3 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                {selectedMedia.title}
              </h3>
              <button
                onClick={closeMediaPopup}
                className="group rounded-xl p-2.5 bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg transition-all duration-300 hover:scale-110 hover:rotate-90 hover:bg-destructive/10 hover:border-destructive/30"
              >
                <XIcon className="h-5 w-5 text-muted-foreground group-hover:text-destructive transition-colors duration-300" />
              </button>
            </div>

            {/* Media Content */}
            <div className="p-6">
              {selectedMedia.type === 'image' ? (
                <div className="relative">
                  <Image
                    src={selectedMedia.src}
                    alt={selectedMedia.alt}
                    width={1200}
                    height={800}
                    className="w-full h-auto max-h-[70vh] object-contain rounded-xl"
                    priority
                  />
                </div>
              ) : (
                <div className="relative">
                  <video
                    src={selectedMedia.src}
                    controls
                    autoPlay
                    className="w-full h-auto max-h-[70vh] object-contain rounded-xl"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {selectedMedia.type === 'image' ? 'Click outside to close' : 'Video preview'}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="px-3 py-1 bg-primary/10 text-primary border-primary/20">
                    <PlayIcon className="h-3 w-3 mr-1" />
                    {selectedMedia.type === 'image' ? 'Preview' : 'Video'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-xl opacity-50"></div>
            <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-tr from-primary/5 to-transparent rounded-full blur-lg opacity-30"></div>
          </div>
        </div>
      )}

    </main>
  );
}
