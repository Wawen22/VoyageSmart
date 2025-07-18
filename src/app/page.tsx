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
  Thermometer,
  BookOpenIcon,
  ImageIcon,
  PlayIcon,
  ZapIcon,
  TrendingUpIcon,
  HeartIcon,
  AwardIcon,
  ChevronUpIcon,
  NavigationIcon,
  CircleIcon,
  HomeIcon
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
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const aiRef = useRef<HTMLDivElement>(null);
  const latestRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
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
        { ref: aiRef, id: 'ai' },
        { ref: latestRef, id: 'latest' },
        { ref: pricingRef, id: 'pricing' },
        { ref: faqRef, id: 'faq' }
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      title: 'AI-Powered Assistant',
      description: 'Get intelligent travel recommendations, smart itinerary optimization, and 24/7 AI assistance for your trips.',
      icon: <SparklesIcon className="h-6 w-6 text-primary" />,
      delay: 100,
      image: '/images/app-screenshot-2.jpg'
    },
    {
      title: 'Keep a Travel Journal',
      description: 'Document your journey with daily entries, organize photos in a gallery, and create a timeline of memories.',
      icon: <BookOpenIcon className="h-6 w-6 text-primary" />,
      delay: 200,
      image: '/images/app-screenshot-2.jpg'
    },
    {
      title: 'Track Expenses',
      description: 'Keep track of your travel budget, split expenses with friends, and see who owes what.',
      icon: <DollarSignIcon className="h-6 w-6 text-primary" />,
      delay: 300,
      image: '/images/app-screenshot-2.jpg'
    },
    {
      title: 'Travel Analytics',
      description: 'Discover insights about your travel patterns with detailed analytics on destinations, frequency, duration, and spending habits.',
      icon: <TrendingUpIcon className="h-6 w-6 text-primary" />,
      delay: 400,
      image: '/images/app-screenshot-3.jpg'
    },
    {
      title: 'Collaborate',
      description: 'Invite friends and family to join your trip planning, make decisions together, and share memories.',
      icon: <UsersIcon className="h-6 w-6 text-primary" />,
      delay: 500,
      image: '/images/app-screenshot-3.jpg'
    }
  ];



  const faqItems = [
    {
      title: 'Is VoyageSmart free to use?',
      content: (
        <p>
          VoyageSmart offers a free tier that allows you to create up to 3 trips. For unlimited trips and access to premium features like accommodation and transportation tracking, you can upgrade to our Premium plan. For AI-powered features, check out our AI Assistant plan.
        </p>
      )
    },
    {
      title: 'What AI features are available?',
      content: (
        <p>
          Our AI Assistant plan includes a 24/7 AI travel assistant that provides personalized recommendations, an AI Itinerary Generation Wizard that creates complete day-by-day plans, smart budget optimization, and intelligent activity suggestions based on your preferences and travel style.
        </p>
      )
    },
    {
      title: 'How does the AI Itinerary Generation Wizard work?',
      content: (
        <p>
          The AI Wizard asks you about your travel preferences, budget, interests, and time constraints. Based on this information, it generates a complete itinerary with activities, timing suggestions, and location recommendations. You can then review and edit the suggestions before adding them to your trip.
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
      title: 'What is the Travel Journal feature?',
      content: (
        <p>
          The Travel Journal feature allows you to document your journey with daily entries, organize photos in a gallery, and create a timeline of memories. You can access it from the Trip Planner section, which combines both Itinerary and Journal functionality in one convenient place.
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
                <Image
                  src="/images/logo-voyage_smart.png"
                  alt="Voyage Smart Logo"
                  width={200}
                  height={50}
                  className="h-12 w-auto relative z-10 transition-transform duration-300 group-hover:scale-105"
                  priority
                />
              </div>
            </div>
            <div className="hidden md:flex space-x-8">
              <button
                onClick={() => scrollToSection(featuresRef)}
                className="text-foreground/70 hover:text-primary transition-all duration-300 font-medium relative group"
              >
                Features
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </button>
              <button
                onClick={() => scrollToSection(pricingRef)}
                className="text-foreground/70 hover:text-primary transition-all duration-300 font-medium relative group"
              >
                Plans & Pricing
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </button>
              <button
                onClick={() => scrollToSection(faqRef)}
                className="text-foreground/70 hover:text-primary transition-all duration-300 font-medium relative group"
              >
                FAQ
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </button>
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
      <section ref={heroRef} className="min-h-screen lg:min-h-[85vh] xl:min-h-screen w-full flex items-center justify-center relative pt-16">
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-12 xl:gap-16">
            {/* Left Side - Content */}
            <div className="flex-1 text-center lg:text-left">
              <div className="space-y-8">
                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent">
                    Your Journey,
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 bg-clip-text text-transparent">
                    Simplified
                  </span>
                </h1>

                <p className="text-xl md:text-2xl lg:text-xl xl:text-2xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  The <span className="text-primary font-semibold">AI-powered travel companion</span> that transforms how you plan, organize, and experience your adventures.
                </p>

                <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                  <Badge variant="secondary" className="px-4 py-2 text-sm bg-primary/10 text-primary border-primary/20">
                    <SparklesIcon className="h-4 w-4 mr-2" />
                    AI-Powered
                  </Badge>
                  <Badge variant="secondary" className="px-4 py-2 text-sm bg-primary/10 text-primary border-primary/20">
                    <UsersIcon className="h-4 w-4 mr-2" />
                    Collaborative
                  </Badge>
                  <Badge variant="secondary" className="px-4 py-2 text-sm bg-primary/10 text-primary border-primary/20">
                    <ZapIcon className="h-4 w-4 mr-2" />
                    Smart Planning
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
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-auto max-w-[400px] md:max-w-[500px] lg:max-w-[400px] xl:max-w-[500px] object-contain"
                    poster="/images/logo-voyage_smart.png"
                  >
                    <source src="/images/animated_logo-voyage_smart.mp4" type="video/mp4" />
                    <Image
                      src="/images/animated_logo-voyage_smart.gif"
                      alt="VoyageSmart - Your AI Travel Companion"
                      width={500}
                      height={150}
                      className="w-full h-auto"
                      priority
                    />
                  </video>

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

      {/* Features Section */}
      <section ref={featuresRef} className="py-24 md:py-32 relative overflow-hidden bg-gradient-to-b from-background to-muted/10">
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-primary/8 to-transparent rounded-full blur-3xl"></div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-6 py-3 rounded-full border border-primary/20 mb-6 animate-fade-in">
              <AwardIcon className="h-5 w-5" />
              <span className="font-semibold">Powerful Features</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent leading-tight">
              Everything You Need
              <span className="block bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                In One Place
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto animate-fade-in delay-100 leading-relaxed">
              From planning to memories, we've got every aspect of your journey covered
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group relative overflow-hidden border-2 border-border/50 hover:border-primary/30 bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 rounded-3xl"
                style={{ animationDelay: `${feature.delay}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>

                <CardHeader className="relative z-10 pb-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-4 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-300 shadow-lg group-hover:scale-110">
                      {feature.icon}
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent group-hover:from-primary group-hover:to-primary/80 transition-all duration-300">
                        {feature.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="relative z-10 pt-0">
                  <p className="text-muted-foreground leading-relaxed mb-6 text-lg">
                    {feature.description}
                  </p>

                  {/* Feature Image */}
                  <div className="relative overflow-hidden rounded-2xl mb-6 group-hover:scale-[1.02] transition-transform duration-500">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10"></div>
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      width={600}
                      height={400}
                      className="w-full h-48 object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>

                  {/* Feature Highlight */}
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-4 border border-primary/20 group-hover:border-primary/30 transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      <p className="text-sm font-medium text-primary/90">
                        {index === 0 && "Create detailed day-by-day plans for your entire trip"}
                        {index === 1 && "Get personalized recommendations and smart suggestions powered by AI"}
                        {index === 2 && "Document your journey with photos and daily entries"}
                        {index === 3 && "Split expenses fairly and see who owes what"}
                        {index === 4 && "Analyze your travel patterns with detailed insights and statistics"}
                        {index === 5 && "Plan together with friends and family in real-time"}
                      </p>
                    </div>
                  </div>
                </CardContent>

                {/* Decorative Elements */}
                <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-tr from-primary/5 to-transparent rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
              </Card>
            ))}
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white px-12 py-6 rounded-2xl text-lg font-semibold shadow-2xl hover:shadow-primary/25 transition-all duration-300 hover:scale-105"
            >
              <Link href="/register" className="flex items-center gap-3">
                <TrendingUpIcon className="h-6 w-6" />
                Explore All Features
                <ArrowRightIcon className="h-5 w-5 animate-bounce-horizontal" />
              </Link>
            </Button>
          </div>
        </div>
      </section>







      {/* AI Features Section */}
      <section ref={aiRef} className="py-20 md:py-24 bg-gradient-to-b from-primary/5 to-background relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-purple-500/8 via-primary/5 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-indigo-500/6 via-primary/4 to-transparent rounded-full blur-3xl"></div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Left Side - Content */}
            <div className="flex-1 text-center lg:text-left">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/10 via-primary/10 to-indigo-500/10 text-purple-600 px-4 py-2 rounded-full border border-purple-500/20">
                  <SparklesIcon className="h-5 w-5" />
                  <span className="font-semibold">AI Powered</span>
                </div>

                <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-purple-600 via-primary to-indigo-600 bg-clip-text text-transparent">
                    Intelligent Travel
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    Planning
                  </span>
                </h2>

                <p className="text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Experience the future of travel planning with our AI-powered assistant that learns your preferences and provides personalized recommendations.
                </p>

                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-purple-500/20 to-purple-500/10 rounded-xl shadow-md">
                      <SparklesIcon className="h-6 w-6 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-purple-600">24/7 AI Travel Assistant</h3>
                      <p className="text-muted-foreground">Get instant answers and personalized suggestions</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-indigo-500/10 rounded-xl shadow-md">
                      <CalendarIcon className="h-6 w-6 text-indigo-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-indigo-600">AI Itinerary Wizard</h3>
                      <p className="text-muted-foreground">Generate complete day-by-day plans</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-purple-500/20 to-purple-500/10 rounded-xl shadow-md">
                      <DollarSignIcon className="h-6 w-6 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-purple-600">Smart Budget Optimization</h3>
                      <p className="text-muted-foreground">Maximize your experience within your budget</p>
                    </div>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-500 via-primary to-indigo-600 hover:from-purple-600 hover:via-primary/90 hover:to-indigo-700 text-white px-8 py-6 rounded-xl text-lg font-semibold shadow-xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105"
                  onClick={() => scrollToSection(pricingRef)}
                >
                  <SparklesIcon className="h-5 w-5 mr-2" />
                  Experience AI Magic
                </Button>
              </div>
            </div>

            {/* Right Side - AI Demo */}
            <div className="flex-1 mt-12 lg:mt-0">
              <div className="bg-gradient-to-br from-purple-500/10 via-primary/5 to-indigo-500/10 rounded-2xl p-6 border border-purple-500/20 shadow-xl backdrop-blur-sm">
                <div className="bg-gradient-to-br from-card/95 to-card/85 rounded-xl p-6 shadow-lg border border-border/50">
                  {/* Header */}
                  <div className="flex items-center mb-4">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mr-3 shadow-md">
                        <SparklesIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                    </div>
                    <div>
                      <span className="font-bold text-base bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">AI Travel Assistant</span>
                      <p className="text-xs text-muted-foreground">Online • Ready to help</p>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="space-y-3">
                    <div className="bg-gradient-to-r from-purple-500/10 to-purple-500/5 rounded-xl p-3 border border-purple-500/20">
                      <p className="text-xs text-muted-foreground mb-1">You</p>
                      <p className="font-medium text-sm">"Suggest activities for my trip to Rome"</p>
                    </div>

                    <div className="bg-gradient-to-r from-indigo-500/10 to-indigo-500/5 rounded-xl p-3 border border-indigo-500/20">
                      <p className="text-xs text-muted-foreground mb-2">AI Assistant</p>
                      <p className="text-sm mb-2">Based on your trip to Rome (June 15-20) and your interest in history and food, I recommend:</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 bg-background/50 rounded-lg p-2">
                          <CalendarIcon className="h-4 w-4 text-indigo-500" />
                          <span className="text-xs">Colosseum tour (morning, avoid crowds)</span>
                        </div>
                        <div className="flex items-center gap-2 bg-background/50 rounded-lg p-2">
                          <DollarSignIcon className="h-4 w-4 text-indigo-500" />
                          <span className="text-xs">Trastevere food tour (evening)</span>
                        </div>
                        <div className="flex items-center gap-2 bg-background/50 rounded-lg p-2">
                          <MapPinIcon className="h-4 w-4 text-indigo-500" />
                          <span className="text-xs">Vatican Museums (book skip-the-line)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Typing Indicator */}
                  <div className="mt-3 flex items-center gap-2 text-muted-foreground">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs">AI is thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Features Section */}
      <section ref={latestRef} className="py-20 md:py-24 bg-gradient-to-b from-background to-muted/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-muted/30 to-transparent"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-primary/5 rounded-full filter blur-2xl animate-pulse-slow"></div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-1.5 text-sm bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
              <span className="animate-pulse-slow mr-1">●</span> New
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              Latest Features
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              We're constantly improving VoyageSmart with new features to enhance your travel planning experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            <div className="bg-card border-2 border-border/50 rounded-xl overflow-hidden shadow-xl p-8 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:border-primary/20 group">
              <div className="flex items-center mb-6">
                <div className="p-4 bg-primary/10 rounded-xl mr-5 group-hover:bg-primary/20 transition-all duration-300 shadow-md transform group-hover:scale-110">
                  <MapPinIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold group-hover:text-primary transition-colors duration-300">Interactive Maps</h3>
              </div>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Visualize your trips with interactive maps featuring List, Calendar, and Map views. See all your destinations in one beautiful interface.
              </p>
              <div className="bg-gradient-to-br from-primary/5 to-transparent rounded-xl p-5 border border-primary/10 group-hover:border-primary/20 transition-all duration-300">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10 shadow-sm">
                      <MapPinIcon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">Interactive Map View</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10 shadow-sm">
                      <CalendarIcon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">Calendar Integration</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10 shadow-sm">
                      <GlobeIcon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">Route Visualization</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border-2 border-border/50 rounded-xl overflow-hidden shadow-xl p-8 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:border-primary/20 group">
              <div className="flex items-center mb-6">
                <div className="p-4 bg-primary/10 rounded-xl mr-5 group-hover:bg-primary/20 transition-all duration-300 shadow-md transform group-hover:scale-110">
                  <BookOpenIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold group-hover:text-primary transition-colors duration-300">Travel Journal</h3>
              </div>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Document your journey with daily entries, organize photos in a gallery, and create a timeline of memories all in one place.
              </p>
              <div className="bg-gradient-to-br from-primary/5 to-transparent rounded-xl p-5 border border-primary/10 group-hover:border-primary/20 transition-all duration-300">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10 shadow-sm">
                      <BookOpenIcon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">Daily Entries</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10 shadow-sm">
                      <ImageIcon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">Photo Gallery</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10 shadow-sm">
                      <CalendarIcon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">Memories Timeline</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border-2 border-border/50 rounded-xl overflow-hidden shadow-xl p-8 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:border-primary/20 group">
              <div className="flex items-center mb-6">
                <div className="p-4 bg-primary/10 rounded-xl mr-5 group-hover:bg-primary/20 transition-all duration-300 shadow-md transform group-hover:scale-110">
                  <MapPinIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold group-hover:text-primary transition-colors duration-300">Multiple Destinations</h3>
              </div>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Plan trips with multiple destinations and easily keep track of all your stops. Perfect for road trips, backpacking adventures, or multi-city business trips.
              </p>
              <div className="bg-gradient-to-br from-primary/5 to-transparent rounded-xl p-5 border border-primary/10 group-hover:border-primary/20 transition-all duration-300">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center p-1 bg-white/50 dark:bg-black/5 rounded-lg shadow-sm">
                    <span className="inline-flex items-center font-medium text-primary">
                      <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold mr-2">1</span>
                      Paris, France
                      <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">Primary</span>
                    </span>
                  </div>
                  <div style={{ paddingLeft: '4px' }} className="flex items-center p-2 bg-white/50 dark:bg-black/5 rounded-lg shadow-sm">
                    <span className="inline-flex items-center">
                      <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold mr-2">2</span>
                      Lyon, France
                    </span>
                  </div>
                  <div className="flex items-center p-1 bg-white/50 dark:bg-black/5 rounded-lg shadow-sm">
                    <span className="inline-flex items-center">
                      <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold mr-2">3</span>
                      Nice, France
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section ref={pricingRef} className="py-20 md:py-32 bg-gradient-to-b from-background to-muted/20 relative overflow-hidden">
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

      {/* FAQ Section */}
      <section ref={faqRef} className="py-20 md:py-32 bg-gradient-to-b from-muted/20 to-background relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-muted/20 to-transparent"></div>
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-primary/5 rounded-full filter blur-2xl"></div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-20">
            <Badge className="mb-4 px-4 py-1.5 text-sm bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">Help</Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Frequently Asked Questions
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Find answers to common questions about VoyageSmart
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="bg-card/50 backdrop-blur-sm border-2 border-border/50 rounded-xl p-6 md:p-8 shadow-lg">
              <Accordion items={faqItems} className="mb-8" />
            </div>

            <div className="text-center mt-16">
              <p className="text-muted-foreground mb-6 text-lg">Still have questions?</p>
              <Button
                variant="outline"
                className="group px-8 py-6 text-base font-medium rounded-xl border-primary/20 hover:bg-primary/5 transition-all duration-300 hover:scale-105"
              >
                <PhoneIcon className="h-5 w-5 mr-3 group-hover:text-primary transition-colors duration-300" />
                <span className="group-hover:text-primary transition-colors duration-300">Contact Support</span>
              </Button>
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
                Join thousands of travelers who've discovered the magic of AI-powered trip planning.
              </p>
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

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-70">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ShieldIcon className="h-5 w-5 text-primary" />
                <span className="font-medium">Secure & Private</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <StarIcon className="h-5 w-5 text-primary" />
                <span className="font-medium">10K+ Happy Users</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <ZapIcon className="h-5 w-5 text-primary" />
                <span className="font-medium">AI-Powered</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-border/50 bg-gradient-to-b from-background/95 to-primary/5 backdrop-blur-sm relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/10 to-transparent"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-primary/8 rounded-full filter blur-3xl"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/6 rounded-full filter blur-2xl"></div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <div className="flex items-center mb-8">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-2xl filter blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                  <div className="relative bg-gradient-to-br from-background/80 to-background/60 backdrop-blur-sm rounded-2xl p-6 border border-primary/20 shadow-lg">
                    <Image
                      src="/images/logo-voyage_smart.png"
                      alt="Voyage Smart Logo"
                      width={240}
                      height={60}
                      className="h-16 w-auto relative z-10 group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground max-w-lg mb-8 text-lg leading-relaxed">
                AI-powered travel planning made easy. Plan trips, manage expenses, keep a travel journal, get intelligent recommendations, and collaborate with friends all in one place.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="icon" className="rounded-2xl hover:bg-primary/10 transition-all duration-300 hover:scale-110 group border border-transparent hover:border-primary/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors duration-300"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                </Button>
                <Button variant="ghost" size="icon" className="rounded-2xl hover:bg-primary/10 transition-all duration-300 hover:scale-110 group border border-transparent hover:border-primary/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors duration-300"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
                </Button>
                <Button variant="ghost" size="icon" className="rounded-2xl hover:bg-primary/10 transition-all duration-300 hover:scale-110 group border border-transparent hover:border-primary/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors duration-300"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
                </Button>
                <Button variant="ghost" size="icon" className="rounded-2xl hover:bg-primary/10 transition-all duration-300 hover:scale-110 group border border-transparent hover:border-primary/20">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors duration-300"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-xl mb-8 text-foreground bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">Quick Links</h3>
              <ul className="space-y-5">
                <li>
                  <button
                    onClick={() => scrollToSection(featuresRef)}
                    className="text-muted-foreground hover:text-primary transition-all duration-300 text-left flex items-center group text-lg"
                  >
                    <ArrowRightIcon className="h-4 w-4 mr-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0 text-primary" />
                    <span className="group-hover:translate-x-1 transition-transform duration-300">Features</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection(pricingRef)}
                    className="text-muted-foreground hover:text-primary transition-all duration-300 text-left flex items-center group text-lg"
                  >
                    <ArrowRightIcon className="h-4 w-4 mr-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0 text-primary" />
                    <span className="group-hover:translate-x-1 transition-transform duration-300">Plans & Pricing</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection(faqRef)}
                    className="text-muted-foreground hover:text-primary transition-all duration-300 text-left flex items-center group text-lg"
                  >
                    <ArrowRightIcon className="h-4 w-4 mr-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0 text-primary" />
                    <span className="group-hover:translate-x-1 transition-transform duration-300">FAQ</span>
                  </button>
                </li>
                <li>
                  <Link href="/documentation" className="text-muted-foreground hover:text-primary transition-all duration-300 flex items-center group text-lg">
                    <ArrowRightIcon className="h-4 w-4 mr-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0 text-primary" />
                    <span className="group-hover:translate-x-1 transition-transform duration-300">Documentation</span>
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-xl mb-8 text-foreground bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">Get Started</h3>
              <ul className="space-y-5">
                <li>
                  <Link href="/login" className="text-muted-foreground hover:text-primary transition-all duration-300 flex items-center group text-lg">
                    <ArrowRightIcon className="h-4 w-4 mr-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0 text-primary" />
                    <span className="group-hover:translate-x-1 transition-transform duration-300">Log In</span>
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="text-muted-foreground hover:text-primary transition-all duration-300 flex items-center group text-lg">
                    <ArrowRightIcon className="h-4 w-4 mr-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0 text-primary" />
                    <span className="group-hover:translate-x-1 transition-transform duration-300">Sign Up Free</span>
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-primary transition-all duration-300 flex items-center group text-lg">
                    <ArrowRightIcon className="h-4 w-4 mr-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0 text-primary" />
                    <span className="group-hover:translate-x-1 transition-transform duration-300">Privacy Policy</span>
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-primary transition-all duration-300 flex items-center group text-lg">
                    <ArrowRightIcon className="h-4 w-4 mr-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0 text-primary" />
                    <span className="group-hover:translate-x-1 transition-transform duration-300">Terms of Service</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="mt-20 pt-8 border-t border-gradient-to-r from-transparent via-border/50 to-transparent">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                <p className="text-muted-foreground text-lg">© {new Date().getFullYear()} VoyageSmart. All rights reserved.</p>
                <div className="hidden md:flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <span className="text-sm text-primary font-medium">Made with ❤️ for travelers</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="px-4 py-2 bg-primary/10 text-primary border-primary/20">
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  AI-Powered
                </Badge>
                <Badge variant="secondary" className="px-4 py-2 bg-primary/10 text-primary border-primary/20">
                  <ShieldIcon className="h-4 w-4 mr-2" />
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
      <div className="hidden lg:flex fixed left-4 xl:left-6 top-1/2 transform -translate-y-1/2 z-50 flex-col gap-3 bg-background/90 backdrop-blur-xl rounded-xl p-3 border border-border/50 shadow-xl max-w-[60px]">
        {[
          { id: 'hero', label: 'Home', icon: HomeIcon },
          { id: 'features', label: 'Features', icon: SparklesIcon },
          { id: 'ai', label: 'AI Powered', icon: RocketIcon },
          { id: 'latest', label: 'Latest', icon: StarIcon },
          { id: 'pricing', label: 'Pricing', icon: DollarSignIcon },
          { id: 'faq', label: 'Help', icon: HelpCircleIcon }
        ].map((section) => {
          const isActive = activeSection === section.id;
          const Icon = section.icon;

          return (
            <div key={section.id} className="relative group">
              <button
                onClick={() => {
                  const refs = { hero: heroRef, features: featuresRef, ai: aiRef, latest: latestRef, pricing: pricingRef, faq: faqRef };
                  const ref = refs[section.id as keyof typeof refs];
                  if (ref?.current) {
                    ref.current.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className={`relative p-2.5 lg:p-2 xl:p-3 rounded-full transition-all duration-300 backdrop-blur-sm border shadow-md hover:shadow-lg hover:scale-105 ${
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
            { id: 'features', label: 'Features', icon: SparklesIcon },
            { id: 'ai', label: 'AI', icon: RocketIcon },
            { id: 'latest', label: 'New', icon: StarIcon },
            { id: 'pricing', label: 'Pricing', icon: DollarSignIcon },
            { id: 'faq', label: 'Help', icon: HelpCircleIcon }
          ].map((section) => {
            const isActive = activeSection === section.id;
            const Icon = section.icon;

            return (
              <button
                key={section.id}
                onClick={() => {
                  const refs = { hero: heroRef, features: featuresRef, ai: aiRef, latest: latestRef, pricing: pricingRef, faq: faqRef };
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


    </main>
  );
}
