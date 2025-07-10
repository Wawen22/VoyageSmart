'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useSubscription } from '@/lib/subscription';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';
import { HomeIcon, PlusCircleIcon, UserIcon, TagIcon, ShieldIcon, UsersIcon, BookOpenIcon } from 'lucide-react';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { subscription } = useSubscription();
  const { isAdmin, loading: isAdminLoading } = useIsAdmin();
  const pathname = usePathname();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Return empty div for landing page and auth pages
  if (pathname === '/' || pathname === '/login' || pathname === '/register' || pathname === '/forgot-password') {
    return <div></div>;
  }

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const handleSignOut = async () => {
    try {
      console.log('Navbar - Signing out...');
      await signOut();
      console.log('Navbar - Sign out successful');
    } catch (error) {
      console.error('Navbar - Error signing out:', error);
      // Show a notification to the user
      alert('There was an error signing out. Please try again.');
    }
  };

  return (
    <nav className="bg-background border-b border-border transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                <Image
                  src="/images/logo-voyage_smart.png"
                  alt="Voyage Smart Logo"
                  width={200}
                  height={60}
                  className="h-12 w-auto"
                  priority
                />
                <span className="sr-only">Voyage Smart</span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/dashboard"
                className={`nav-indicator ${
                  pathname === '/dashboard'
                    ? 'border-primary text-foreground active'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Dashboard
              </Link>
              <Link
                href="/trips/new"
                className={`nav-indicator ${
                  pathname === '/trips/new'
                    ? 'border-primary text-foreground active'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                New Trip
              </Link>
              <Link
                href={user ? "/subscription" : "/pricing"}
                className={`nav-indicator ${
                  pathname === '/pricing' || pathname === '/subscription'
                    ? 'border-primary text-foreground active'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                {user ? "Subscription" : "Pricing"}
              </Link>
              <Link
                href="/documentation"
                className={`nav-indicator ${
                  pathname.startsWith('/documentation')
                    ? 'border-primary text-foreground active'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Documentation
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center gap-4">
            <ThemeSwitcher />
            {user ? (
              <div className="ml-3 relative">
                <div>
                  <button
                    type="button"
                    className="bg-secondary rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    id="user-menu"
                    aria-expanded="false"
                    aria-haspopup="true"
                    onClick={toggleProfileMenu}
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-medium">
                        {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </button>
                </div>
                {isProfileMenuOpen && (
                  <div
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-popover border border-border focus:outline-none z-50"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu"
                  >
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                      role="menuitem"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Your Profile
                    </Link>
                    <Link
                      href="/subscription"
                      className="block px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                      role="menuitem"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Subscription {' '}
                      {subscription?.tier === 'premium' ? (
                        <span className="text-primary font-medium">(Premium)</span>
                      ) : subscription?.tier === 'ai' ? (
                        <span className="text-purple-500 font-medium">(AI Assistant)</span>
                      ) : (
                        <span className="text-muted-foreground">(Free)</span>
                      )}
                    </Link>
                    {isAdmin && (
                      <>
                        <div className="border-t border-border my-1"></div>
                        <Link
                          href="/admin"
                          className="block px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                          role="menuitem"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <span className="flex items-center">
                            <ShieldIcon className="h-4 w-4 mr-2 text-blue-500" />
                            Admin Dashboard
                          </span>
                        </Link>
                        <Link
                          href="/admin/promo-manager"
                          className="block px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                          role="menuitem"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <span className="flex items-center">
                            <TagIcon className="h-4 w-4 mr-2 text-purple-500" />
                            Promo Codes
                          </span>
                        </Link>
                        <Link
                          href="/admin/users"
                          className="block px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                          role="menuitem"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <span className="flex items-center">
                            <UsersIcon className="h-4 w-4 mr-2 text-green-500" />
                            User Management
                          </span>
                        </Link>
                      </>
                    )}
                    <div className="border-t border-border my-1"></div>
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                      role="menuitem"
                      onClick={handleSignOut}
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex space-x-4">
                <Link
                  href="/login"
                  className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium transition-colors"
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
            )}
          </div>
          <div className="-mr-2 flex items-center gap-2 sm:hidden">
            {/* Mobile Quick Links */}
            <Link
              href="/dashboard"
              className={`p-2 rounded-md ${pathname === '/dashboard' ? 'text-primary animate-pulse-once' : 'text-muted-foreground'}`}
              aria-label="Dashboard"
            >
              <HomeIcon className="h-5 w-5" />
            </Link>

            <Link
              href="/trips/new"
              className={`p-2 rounded-md ${pathname === '/trips/new' ? 'text-primary animate-pulse-once' : 'text-muted-foreground'}`}
              aria-label="New Trip"
            >
              <PlusCircleIcon className="h-5 w-5" />
            </Link>

            <Link
              href="/profile"
              className={`p-2 rounded-md ${pathname === '/profile' ? 'text-primary animate-pulse-once' : 'text-muted-foreground'}`}
              aria-label="Profile"
            >
              <UserIcon className="h-5 w-5" />
            </Link>

            <Link
              href={user ? "/subscription" : "/pricing"}
              className={`p-2 rounded-md ${pathname === '/pricing' || pathname === '/subscription' ? 'text-primary animate-pulse-once' : 'text-muted-foreground'}`}
              aria-label={user ? "Subscription" : "Pricing"}
            >
              <TagIcon className="h-5 w-5" />
            </Link>

            <Link
              href="/documentation"
              className={`p-2 rounded-md ${pathname.startsWith('/documentation') ? 'text-primary animate-pulse-once' : 'text-muted-foreground'}`}
              aria-label="Documentation"
            >
              <BookOpenIcon className="h-5 w-5" />
            </Link>

            {isAdmin && (
              <Link
                href="/admin"
                className={`p-2 rounded-md ${pathname.startsWith('/admin') ? 'text-primary animate-pulse-once' : 'text-muted-foreground'}`}
                aria-label="Admin Dashboard"
              >
                <ShieldIcon className="h-5 w-5" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu removed */}
    </nav>
  );
}
