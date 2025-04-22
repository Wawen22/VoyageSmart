'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import RippleButton from '@/components/ui/RippleButton';
import AnimatedList from '@/components/ui/AnimatedList';
import {
  MapPinIcon,
  CalendarIcon,
  UsersIcon,
  PlaneTakeoffIcon,
  DollarSignIcon,
  BuildingIcon,
  MessageCircleIcon,
  CheckIcon,
  ArrowRightIcon,
  GlobeIcon,
  ShieldIcon
} from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const features = [
    {
      title: 'Plan Your Trips',
      description: 'Create detailed itineraries, add accommodations, and organize transportation all in one place.',
      icon: <CalendarIcon className="h-6 w-6 text-primary" />,
      delay: 0
    },
    {
      title: 'Track Expenses',
      description: 'Keep track of your travel budget, split expenses with friends, and see who owes what.',
      icon: <DollarSignIcon className="h-6 w-6 text-primary" />,
      delay: 100
    },
    {
      title: 'Collaborate',
      description: 'Invite friends and family to join your trip planning, make decisions together, and share memories.',
      icon: <UsersIcon className="h-6 w-6 text-primary" />,
      delay: 200
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

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 md:pt-24 lg:pt-32">
        <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col items-center text-center">
            <div className="animate-fade-in">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-600 mb-6 animate-pulse-once">
                Voyage Smart
              </h1>
            </div>

            <p className="text-xl md:text-2xl text-foreground/80 max-w-3xl mx-auto mb-8 animate-slide-in-bottom delay-200">
              Your complete travel planning solution. Plan trips, manage expenses, and collaborate with friends all in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12 animate-slide-in-bottom delay-300">
              <RippleButton
                size="lg"
                className="font-medium text-base px-8"
                feedbackType="ripple"
              >
                <Link href="/register" className="flex items-center gap-2">
                  Get Started <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </RippleButton>

              <Button
                variant="outline"
                size="lg"
                className="font-medium text-base hover-scale"
              >
                <Link href="/login">Log In</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/10 rounded-full filter blur-3xl animate-pulse opacity-70" />
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-primary/10 rounded-full filter blur-3xl animate-pulse opacity-70" />
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-fade-in">Powerful Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in delay-100">
              Everything you need to plan the perfect trip from start to finish
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-card border border-border p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 group animate-fade-in"
                style={{ animationDelay: `${feature.delay}ms` }}
              >
                <div className="flex items-center mb-4 text-primary">
                  <div className="p-2 bg-primary/10 rounded-lg mr-3 group-hover:bg-primary/20 transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                </div>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Voyage Smart</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Simplify your travel planning and enjoy more of your journey
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <AnimatedList
              animationType="slide-left"
              className="space-y-4"
            >
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-start p-4 bg-card border border-border rounded-lg shadow-sm"
                >
                  <div className="p-2 bg-primary/10 rounded-lg mr-4 flex-shrink-0">
                    {benefit.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-lg mb-1">{benefit.title}</h3>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </AnimatedList>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-4xl mx-auto bg-card border border-border p-8 md:p-12 rounded-2xl shadow-lg">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Planning?</h2>
              <p className="text-lg text-muted-foreground">
                Join thousands of travelers who use Voyage Smart to plan better trips
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <RippleButton
                size="lg"
                className="font-medium text-base px-8"
              >
                <Link href="/register" className="flex items-center gap-2">
                  Create Free Account <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </RippleButton>

              <Button
                variant="outline"
                size="lg"
                className="font-medium text-base"
              >
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/3 -right-20 w-72 h-72 bg-primary/5 rounded-full filter blur-3xl" />
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-lg font-semibold text-primary">Voyage Smart</p>
              <p className="text-sm text-muted-foreground">Travel planning made easy</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
              <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Log In
              </Link>
              <Link href="/register" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Sign Up
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-border/50 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Voyage Smart. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
