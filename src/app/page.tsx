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
  ImageIcon
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
      title: 'Keep a Travel Journal',
      description: 'Document your journey with daily entries, organize photos in a gallery, and create a timeline of memories.',
      icon: <BookOpenIcon className="h-6 w-6 text-primary" />,
      delay: 100,
      image: '/images/app-screenshot-2.jpg'
    },
    {
      title: 'Track Expenses',
      description: 'Keep track of your travel budget, split expenses with friends, and see who owes what.',
      icon: <DollarSignIcon className="h-6 w-6 text-primary" />,
      delay: 200,
      image: '/images/app-screenshot-2.jpg'
    },
    {
      title: 'Collaborate',
      description: 'Invite friends and family to join your trip planning, make decisions together, and share memories.',
      icon: <UsersIcon className="h-6 w-6 text-primary" />,
      delay: 300,
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
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Navigation Menu */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border h-16">
        <div className="container mx-auto px-4 sm:px-6 h-full">
          <div className="flex justify-between items-center h-full">
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

      {/* Hero Section */}
      <ParallaxSection
        className="min-h-screen w-full flex items-center justify-center overflow-hidden py-20"
        bgImage="/images/hero-bg.jpg"
        speed={0.3}
        overlayOpacity={0.7}
      >
        <div className="container mx-auto px-4 sm:px-6 relative z-10 flex flex-col justify-center">
          <div className="flex flex-col items-center text-center">
            <div className="animate-fade-in flex flex-col items-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary/20 rounded-full filter blur-3xl animate-pulse-slow"></div>
                <Image
                  src="/images/logo-voyage_smart.png"
                  alt="Voyage Smart Logo"
                  width={450}
                  height={135}
                  className="h-auto w-auto max-w-[220px] sm:max-w-[250px] md:max-w-[280px] lg:max-w-[350px] xl:max-w-[450px] relative z-10"
                  priority
                />
              </div>
              <h1 className="sr-only">Voyage Smart</h1>
            </div>

            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white max-w-3xl mx-auto mb-8 animate-slide-in-bottom delay-200 font-light leading-relaxed drop-shadow-md">
              Your <span className="text-primary font-medium">complete travel planning solution</span>. Plan trips, manage expenses, and collaborate with friends all in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12 animate-slide-in-bottom delay-300">
              <RippleButton
                size="lg"
                className="font-medium text-base px-10 py-6 shadow-xl hover:shadow-2xl transition-all duration-300 bg-primary hover:bg-primary/90 text-white rounded-xl"
                feedbackType="ripple"
              >
                <Link href="/register" className="flex items-center gap-2">
                  Get Started <ArrowRightIcon className="h-5 w-5 ml-1 animate-bounce-horizontal" />
                </Link>
              </RippleButton>

              <Button
                variant="outline"
                size="lg"
                className="font-medium text-base px-10 py-6 hover:scale-105 bg-background/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:text-white transition-all duration-300 rounded-xl"
              >
                <Link href="/login">Log In</Link>
              </Button>
            </div>

            <div className="animate-bounce delay-700 mt-8 bg-white/10 backdrop-blur-sm p-3 rounded-full border border-white/20 shadow-lg">
              <MousePointerIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Decorative elements - Improved positioning */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/30 rounded-full filter blur-3xl animate-pulse-slow opacity-70" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary/30 rounded-full filter blur-3xl animate-pulse-slow opacity-70" />
        <div className="absolute top-2/3 left-1/3 w-64 h-64 bg-primary/20 rounded-full filter blur-2xl animate-float opacity-50" />

        {/* Floating elements - Enhanced visibility */}
        <div className="absolute top-1/3 right-1/4 animate-float opacity-90">
          <div className="bg-white/15 backdrop-blur-md p-3 rounded-xl shadow-lg border border-white/30">
            <CalendarIcon className="h-8 w-8 text-white" />
          </div>
        </div>
        <div className="absolute bottom-1/3 left-1/4 animate-float-delay opacity-90">
          <div className="bg-white/15 backdrop-blur-md p-3 rounded-xl shadow-lg border border-white/30">
            <BookOpenIcon className="h-8 w-8 text-white" />
          </div>
        </div>
        <div className="absolute top-2/3 right-1/3 animate-float-more-delay opacity-90">
          <div className="bg-white/15 backdrop-blur-md p-3 rounded-xl shadow-lg border border-white/30">
            <DollarSignIcon className="h-8 w-8 text-white" />
          </div>
        </div>
      </ParallaxSection>

      {/* Features Section */}
      <section ref={featuresRef} className="py-20 md:py-32 relative overflow-hidden">
        {/* Improved transition from hero section */}
        <div className="absolute -top-16 left-0 right-0 h-32 bg-gradient-to-b from-black/30 to-transparent z-10"></div>
        <div className="absolute top-0 right-0 w-full h-32 bg-gradient-to-b from-muted/30 to-transparent"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-muted/30 to-transparent"></div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-20">
            <Badge className="mb-4 px-4 py-1.5 text-sm bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">Explore</Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 animate-fade-in bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              Powerful Features
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in delay-100">
              Everything you need to plan the perfect trip from start to finish
            </p>
          </div>

          {features.map((feature, index) => (
            <div
              key={index}
              className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-12 items-center mb-32 last:mb-0`}
            >
              <div className="w-full md:w-1/2 animate-fade-in" style={{ animationDelay: `${feature.delay}ms` }}>
                <div className="bg-card border-2 border-border/50 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 group hover:border-primary/20 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      width={800}
                      height={500}
                      className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute bottom-0 left-0 w-full p-6 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 opacity-0 group-hover:opacity-100">
                      <span className="inline-block bg-primary text-white text-sm px-3 py-1 rounded-full">
                        Learn more
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-1/2 animate-fade-in" style={{ animationDelay: `${feature.delay + 100}ms` }}>
                <div className="p-6">
                  <div className="flex items-center mb-6 text-primary">
                    <div className="p-4 bg-primary/10 rounded-xl mr-5 group-hover:bg-primary/20 transition-colors transform hover:scale-110 duration-300 shadow-md">
                      {feature.icon}
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="mt-6 border-l-4 border-primary/30 pl-4 py-2 bg-primary/5 rounded-r-lg">
                    <p className="text-sm text-primary/80 italic">
                      {index === 0 && "Create detailed day-by-day plans for your entire trip"}
                      {index === 1 && "Document your journey with photos and daily entries"}
                      {index === 2 && "Split expenses fairly and see who owes what"}
                      {index === 3 && "Plan together with friends and family in real-time"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-muted/20 to-background relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-background to-transparent"></div>
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-primary/5 rounded-full filter blur-2xl"></div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-20">
            <Badge className="mb-4 px-4 py-1.5 text-sm bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">Benefits</Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Why Choose Voyage Smart
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Simplify your travel planning and enjoy more of your journey
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {benefits.map((benefit, index) => (
              <Card
                key={index}
                className="overflow-hidden hover:shadow-xl transition-all duration-500 hover:-translate-y-2 border-2 border-border/50 hover:border-primary/20 h-full bg-card/50 backdrop-blur-sm group"
              >
                <CardContent className="p-8">
                  <div className="p-4 bg-primary/10 rounded-xl w-16 h-16 flex items-center justify-center mb-6 mx-auto transform group-hover:scale-110 transition-transform duration-300 shadow-md group-hover:bg-primary/20 group-hover:shadow-lg">
                    {benefit.icon}
                  </div>
                  <h3 className="font-bold text-xl mb-4 text-center group-hover:text-primary transition-colors duration-300">{benefit.title}</h3>
                  <p className="text-muted-foreground text-center">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Button
              className="bg-primary/90 hover:bg-primary text-white px-8 py-6 rounded-xl text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <Link href="/register" className="flex items-center gap-2">
                Start Planning Your Trip <ArrowRightIcon className="h-5 w-5 ml-1 animate-bounce-horizontal" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* New Features Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-background to-muted/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-muted/30 to-transparent"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-primary/5 rounded-full filter blur-2xl animate-pulse-slow"></div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-20">
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
              <div className="mt-6 text-center">
                <span className="inline-block text-primary text-sm font-medium hover:underline cursor-pointer group-hover:translate-x-1 transition-transform duration-300">
                  Learn more →
                </span>
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
                  <div className="flex items-center p-2 bg-white/50 dark:bg-black/5 rounded-lg shadow-sm">
                    <span className="inline-flex items-center font-medium text-primary">
                      <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold mr-2">1</span>
                      Paris, France
                      <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">Primary</span>
                    </span>
                  </div>
                  <div className="flex items-center p-2 bg-white/50 dark:bg-black/5 rounded-lg shadow-sm">
                    <span className="inline-flex items-center">
                      <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold mr-2">2</span>
                      Lyon, France
                    </span>
                  </div>
                  <div className="flex items-center p-2 bg-white/50 dark:bg-black/5 rounded-lg shadow-sm">
                    <span className="inline-flex items-center">
                      <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold mr-2">3</span>
                      Nice, France
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-6 text-center">
                <span className="inline-block text-primary text-sm font-medium hover:underline cursor-pointer group-hover:translate-x-1 transition-transform duration-300">
                  Learn more →
                </span>
              </div>
            </div>

            <div className="bg-card border-2 border-border/50 rounded-xl overflow-hidden shadow-xl p-8 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:border-primary/20 group">
              <div className="flex items-center mb-6">
                <div className="p-4 bg-primary/10 rounded-xl mr-5 group-hover:bg-primary/20 transition-all duration-300 shadow-md transform group-hover:scale-110">
                  <CloudIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold group-hover:text-primary transition-colors duration-300">Enhanced Weather</h3>
              </div>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Get accurate weather forecasts for all your destinations in a beautiful, modern interface. Plan your activities with confidence knowing the weather conditions.
              </p>
              <div className="bg-gradient-to-br from-primary/5 to-transparent rounded-xl p-5 border border-primary/10 group-hover:border-primary/20 transition-all duration-300">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-full bg-primary/10 shadow-sm">
                        <CloudIcon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">Weather Forecast</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="flex -space-x-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary border border-background shadow-sm">P</div>
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary border border-background shadow-sm">L</div>
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary border border-background shadow-sm">N</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/50 dark:bg-black/5 rounded-lg p-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center">
                          <Sun className="h-8 w-8 text-yellow-400 animate-pulse-slow" />
                        </div>
                        <div>
                          <div className="flex items-center">
                            <Thermometer className="h-3 w-3 mr-1 text-primary" />
                            <span className="text-sm font-medium">24°C</span>
                          </div>
                          <div className="text-xs text-muted-foreground">Sunny</div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <div className="font-medium">Paris, France</div>
                        <div>Today</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 text-center">
                <span className="inline-block text-primary text-sm font-medium hover:underline cursor-pointer group-hover:translate-x-1 transition-transform duration-300">
                  Learn more →
                </span>
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
            <Card className={`border-2 border-border/50 hover:shadow-xl transition-all duration-500 hover:-translate-y-2 h-full group hover:border-primary/20 bg-card/50 backdrop-blur-sm rounded-xl overflow-hidden relative`}>
              {/* New Badge */}
              <div className="absolute -top-1 -right-1 transform rotate-0 z-20">
                <Badge className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-3 py-1.5 rounded-br-xl rounded-tl-xl font-medium shadow-md">
                  New
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
                <PricingFeature included={true}>AI trip recommendations</PricingFeature>
                <PricingFeature included={true}>Smart itinerary optimization</PricingFeature>
                <PricingFeature included={true}>Budget forecasting</PricingFeature>
                <PricingFeature included={true}>Personalized travel insights</PricingFeature>
                <PricingFeature included={true}>Weather alerts</PricingFeature>
                <PricingFeature included={true}>24/7 AI travel assistant</PricingFeature>
              </CardContent>
              <CardFooter className="flex justify-center pt-4 pb-8 px-8 relative z-10">
                <Button
                  variant="outline"
                  className="w-full py-6 text-base font-medium rounded-xl border-primary/20 text-primary/80 hover:bg-primary/5 transition-all duration-300 backdrop-blur-sm cursor-not-allowed opacity-90"
                  disabled
                >
                  <SparklesIcon className="h-5 w-5 mr-2 animate-pulse-slow" />
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

      {/* Footer */}
      <footer className="py-16 border-t border-border bg-gradient-to-b from-card/50 to-background/80 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-background to-transparent"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full filter blur-2xl"></div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <div className="flex items-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/10 rounded-full filter blur-xl opacity-50"></div>
                  <Image
                    src="/images/logo-voyage_smart.png"
                    alt="Voyage Smart Logo"
                    width={180}
                    height={45}
                    className="h-12 w-auto relative z-10"
                  />
                </div>
              </div>
              <p className="text-muted-foreground max-w-md mb-6 text-base leading-relaxed">
                Travel planning made easy. Plan trips, manage expenses, keep a travel journal, and collaborate with friends all in one place.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 transition-all duration-300 hover:scale-110">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors duration-300"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 transition-all duration-300 hover:scale-110">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors duration-300"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 transition-all duration-300 hover:scale-110">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors duration-300"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-6 text-foreground">Quick Links</h3>
              <ul className="space-y-4">
                <li>
                  <button
                    onClick={() => scrollToSection(featuresRef)}
                    className="text-muted-foreground hover:text-primary transition-colors text-left flex items-center group"
                  >
                    <ArrowRightIcon className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0" />
                    <span>Features</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection(pricingRef)}
                    className="text-muted-foreground hover:text-primary transition-colors text-left flex items-center group"
                  >
                    <ArrowRightIcon className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0" />
                    <span>Plans & Pricing</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection(faqRef)}
                    className="text-muted-foreground hover:text-primary transition-colors text-left flex items-center group"
                  >
                    <ArrowRightIcon className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0" />
                    <span>FAQ</span>
                  </button>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-primary transition-colors flex items-center group">
                    <ArrowRightIcon className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0" />
                    <span>Support</span>
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-6 text-foreground">Account</h3>
              <ul className="space-y-4">
                <li>
                  <Link href="/login" className="text-muted-foreground hover:text-primary transition-colors flex items-center group">
                    <ArrowRightIcon className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0" />
                    <span>Log In</span>
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="text-muted-foreground hover:text-primary transition-colors flex items-center group">
                    <ArrowRightIcon className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0" />
                    <span>Sign Up</span>
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-primary transition-colors flex items-center group">
                    <ArrowRightIcon className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0" />
                    <span>Privacy Policy</span>
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-primary transition-colors flex items-center group">
                    <ArrowRightIcon className="h-3 w-3 mr-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0" />
                    <span>Terms of Service</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-border/30 text-center">
            <p className="text-muted-foreground">© {new Date().getFullYear()} VoyageSmart. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
