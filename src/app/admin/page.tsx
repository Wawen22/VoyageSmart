'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminProtected } from '@/components/auth/AdminProtected';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import {
  SettingsIcon,
  TagIcon,
  UsersIcon,
  CreditCardIcon,
  BarChart3Icon,
  DatabaseIcon,
  ShieldIcon,
  ArrowRightIcon,
  ActivityIcon,
  TrendingUpIcon,
  UserCheckIcon,
  TicketIcon
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalTrips: number;
  activeSubscriptions: number;
  totalRevenue: number;
  promoCodes: number;
  recentActivity: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalTrips: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    promoCodes: 0,
    recentActivity: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        // Fetch users count
        const { count: usersCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });

        // Fetch trips count
        const { count: tripsCount } = await supabase
          .from('trips')
          .select('*', { count: 'exact', head: true });

        // Fetch active subscriptions count
        const { count: subscriptionsCount } = await supabase
          .from('user_subscriptions')
          .select('*', { count: 'exact', head: true })
          .neq('tier', 'free')
          .eq('status', 'active');

        // Fetch promo codes count
        const { count: promoCodesCount } = await supabase
          .from('promo_codes')
          .select('*', { count: 'exact', head: true });

        // Fetch recent activity (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { count: recentActivityCount } = await supabase
          .from('subscription_history')
          .select('*', { count: 'exact', head: true })
          .gte('event_timestamp', sevenDaysAgo.toISOString());

        setStats({
          totalUsers: usersCount || 0,
          totalTrips: tripsCount || 0,
          activeSubscriptions: subscriptionsCount || 0,
          totalRevenue: 0, // Revenue calculation will be implemented with payment analytics
          promoCodes: promoCodesCount || 0,
          recentActivity: recentActivityCount || 0
        });
      } catch (error) {
        // Error handling is managed by the UI
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const adminSections = [
    {
      title: 'Promo Codes Manager',
      description: 'Create, manage, and monitor promotional codes',
      icon: <TagIcon className="h-6 w-6" />,
      href: '/admin/promo-manager',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      stats: `${stats.promoCodes} codes`
    },
    {
      title: 'User Management',
      description: 'View and manage user accounts and permissions',
      icon: <UsersIcon className="h-6 w-6" />,
      href: '/admin/users',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      stats: `${stats.totalUsers} users`
    },
    {
      title: 'Subscription Analytics',
      description: 'Monitor subscription metrics and revenue',
      icon: <BarChart3Icon className="h-6 w-6" />,
      href: '/admin/analytics',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      stats: `${stats.activeSubscriptions} active`,
      comingSoon: true
    },
    {
      title: 'System Settings',
      description: 'Configure application settings and features',
      icon: <SettingsIcon className="h-6 w-6" />,
      href: '/admin/settings',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      stats: 'Configure',
      comingSoon: true
    },
    {
      title: 'Database Tools',
      description: 'Database management and maintenance tools',
      icon: <DatabaseIcon className="h-6 w-6" />,
      href: '/admin/database',
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      stats: 'Manage',
      comingSoon: true
    },
    {
      title: 'Security & Logs',
      description: 'Monitor security events and system logs',
      icon: <ShieldIcon className="h-6 w-6" />,
      href: '/admin/security',
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
      stats: 'Monitor',
      comingSoon: true
    }
  ];

  return (
    <AdminProtected>
      <PageLayout>
        <div className="min-h-screen bg-background">
          <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ShieldIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
                  <p className="text-muted-foreground">Manage and monitor VoyageSmart</p>
                </div>
              </div>
              
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                <ShieldIcon className="h-3 w-3 mr-1" />
                Administrator Access
              </Badge>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                      <p className="text-2xl font-bold text-foreground">
                        {loading ? '...' : stats.totalUsers.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-full">
                      <UserCheckIcon className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Subscriptions</p>
                      <p className="text-2xl font-bold text-foreground">
                        {loading ? '...' : stats.activeSubscriptions.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-full">
                      <TrendingUpIcon className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Trips</p>
                      <p className="text-2xl font-bold text-foreground">
                        {loading ? '...' : stats.totalTrips.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-500/10 rounded-full">
                      <ActivityIcon className="h-6 w-6 text-purple-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Promo Codes</p>
                      <p className="text-2xl font-bold text-foreground">
                        {loading ? '...' : stats.promoCodes.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-orange-500/10 rounded-full">
                      <TicketIcon className="h-6 w-6 text-orange-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Admin Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adminSections.map((section, index) => (
                <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-lg ${section.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                        <div className={section.color}>
                          {section.icon}
                        </div>
                      </div>
                      {section.comingSoon && (
                        <Badge variant="secondary" className="text-xs">
                          Coming Soon
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {section.title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {section.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{section.stats}</span>
                      {section.comingSoon ? (
                        <Button variant="ghost" size="sm" disabled className="opacity-50">
                          Coming Soon
                        </Button>
                      ) : (
                        <Button asChild variant="ghost" size="sm" className="group-hover:bg-primary/10">
                          <Link href={section.href} className="flex items-center gap-2">
                            Manage
                            <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Frequently used administrative tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Button asChild variant="outline">
                    <Link href="/admin/promo-manager">
                      <TagIcon className="h-4 w-4 mr-2" />
                      Create Promo Code
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/admin/users">
                      <UsersIcon className="h-4 w-4 mr-2" />
                      Manage Users
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/subscription">
                      <CreditCardIcon className="h-4 w-4 mr-2" />
                      Test Webhook
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/dashboard">
                      <ActivityIcon className="h-4 w-4 mr-2" />
                      View as User
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </PageLayout>
    </AdminProtected>
  );
}
