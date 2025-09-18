'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useSubscription } from '@/lib/subscription';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';
import TripCounterWidget from '@/components/ui/TripCounterWidget';
import { HomeIcon, PlusCircleIcon, UserIcon, TagIcon, ShieldIcon, UsersIcon, BookOpenIcon } from 'lucide-react';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { subscription } = useSubscription();
  const { isAdmin, loading: isAdminLoading } = useIsAdmin();
  const pathname = usePathname();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside (hydration-safe)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Check if the click is outside the menu
      if (menuRef.current && !menuRef.current.contains(target)) {
        // Add a small delay to allow link clicks to be processed first
        setTimeout(() => {
          setIsProfileMenuOpen(false);
        }, 0);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
      }
    };

    if (isProfileMenuOpen) {
      // Use 'click' instead of 'mousedown' to allow link clicks to be processed
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isProfileMenuOpen]);

  // Show simplified navbar for non-authenticated users on auth pages
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';
  const isLandingPage = pathname === '/';

  // Return empty div only for landing page (it has its own navigation)
  if (isLandingPage) {
    return <div></div>;
  }

  // Show simplified navbar for auth pages and documentation for non-authenticated users
  if (isAuthPage || !user) {
    return (
      <nav className="bg-background border-b border-border transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
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

            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center space-x-6">
              {/* Documentation link - always visible */}
              <Link
                href="/documentation"
                className={`${
                  pathname.startsWith('/documentation')
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                } text-sm font-medium transition-colors`}
              >
                Documentation
              </Link>

              {!isAuthPage && (
                <>
                  <Link
                    href="/pricing"
                    className={`${
                      pathname === '/pricing'
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    } text-sm font-medium transition-colors`}
                  >
                    Pricing
                  </Link>

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
                </>
              )}
            </div>

            {/* Mobile Navigation */}
            <div className="flex items-center gap-2 sm:hidden">
              {/* Documentation link for mobile */}
              <Link
                href="/documentation"
                className={`p-2 rounded-md ${
                  pathname.startsWith('/documentation')
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-label="Documentation"
              >
                <BookOpenIcon className="h-5 w-5" />
              </Link>

              {!isAuthPage && (
                <>
                  <Link
                    href="/pricing"
                    className={`p-2 rounded-md ${
                      pathname === '/pricing'
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    aria-label="Pricing"
                  >
                    <TagIcon className="h-5 w-5" />
                  </Link>

                  <Link
                    href="/login"
                    className="text-muted-foreground hover:text-foreground px-2 py-1 rounded-md text-xs font-medium transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-2 py-1 rounded-md text-xs font-medium transition-colors"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    );
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
            <TripCounterWidget />
            <ThemeSwitcher />
            {user ? (
              <div className="ml-3 relative" ref={menuRef}>
                <div>
                  <button
                    type="button"
                    className="bg-secondary rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    id="user-menu"
                    aria-expanded={isProfileMenuOpen}
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
                      onClick={(e) => {
                        // Allow the navigation to happen first
                        setTimeout(() => setIsProfileMenuOpen(false), 0);
                      }}
                    >
                      Your Profile
                    </Link>
                    <Link
                      href="/subscription"
                      className="block px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                      role="menuitem"
                      onClick={(e) => {
                        // Allow the navigation to happen first
                        setTimeout(() => setIsProfileMenuOpen(false), 0);
                      }}
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
                          onClick={(e) => {
                            // Allow the navigation to happen first
                            setTimeout(() => setIsProfileMenuOpen(false), 0);
                          }}
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
                          onClick={(e) => {
                            // Allow the navigation to happen first
                            setTimeout(() => setIsProfileMenuOpen(false), 0);
                          }}
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
                          onClick={(e) => {
                            // Allow the navigation to happen first
                            setTimeout(() => setIsProfileMenuOpen(false), 0);
                          }}
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
            {/* Trip Counter Widget for Mobile */}
            <TripCounterWidget />

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="p-2 rounded-md text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              onClick={toggleProfileMenu}
              aria-label="Open menu"
            >
              <UserIcon className="h-5 w-5" />
            </button>

            {/* Mobile Menu Dropdown */}
            {isProfileMenuOpen && (
              <>
                {/* Overlay for mobile */}
                <div
                  className="fixed inset-0 bg-black/20 z-40 sm:hidden"
                  onClick={() => setIsProfileMenuOpen(false)}
                />
                <div
                  ref={menuRef}
                  className="absolute top-16 right-4 w-56 bg-background border border-border rounded-lg shadow-lg z-50 animate-in slide-in-from-top-2 duration-200"
                >
                <div className="py-2">
                  <Link
                    href="/dashboard"
                    className={`flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors ${
                      pathname === '/dashboard' ? 'text-primary bg-muted' : 'text-foreground'
                    }`}
                    onClick={(e) => {
                      // Allow the navigation to happen first
                      setTimeout(() => setIsProfileMenuOpen(false), 0);
                    }}
                  >
                    <HomeIcon className="h-4 w-4" />
                    Dashboard
                  </Link>

                  <Link
                    href="/profile"
                    className={`flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors ${
                      pathname === '/profile' ? 'text-primary bg-muted' : 'text-foreground'
                    }`}
                    onClick={(e) => {
                      // Allow the navigation to happen first
                      setTimeout(() => setIsProfileMenuOpen(false), 0);
                    }}
                  >
                    <UserIcon className="h-4 w-4" />
                    Profile
                  </Link>

                  <Link
                    href={user ? "/subscription" : "/pricing"}
                    className={`flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors ${
                      pathname === '/subscription' || pathname === '/pricing' ? 'text-primary bg-muted' : 'text-foreground'
                    }`}
                    onClick={(e) => {
                      // Allow the navigation to happen first
                      setTimeout(() => setIsProfileMenuOpen(false), 0);
                    }}
                  >
                    <TagIcon className="h-4 w-4" />
                    {user ? "Subscription" : "Pricing"}
                  </Link>

                  <Link
                    href="/documentation"
                    className={`flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors ${
                      pathname.startsWith('/documentation') ? 'text-primary bg-muted' : 'text-foreground'
                    }`}
                    onClick={(e) => {
                      // Allow the navigation to happen first
                      setTimeout(() => setIsProfileMenuOpen(false), 0);
                    }}
                  >
                    <BookOpenIcon className="h-4 w-4" />
                    Documentation
                  </Link>

                  {isAdmin && !isAdminLoading && (
                    <Link
                      href="/admin"
                      className={`flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors ${
                        pathname.startsWith('/admin') ? 'text-primary bg-muted' : 'text-foreground'
                      }`}
                      onClick={(e) => {
                        // Allow the navigation to happen first
                        setTimeout(() => setIsProfileMenuOpen(false), 0);
                      }}
                    >
                      <ShieldIcon className="h-4 w-4" />
                      Admin
                    </Link>
                  )}

                  <div className="border-t border-border my-2"></div>

                  <div className="px-4 py-2">
                    <ThemeSwitcher />
                  </div>

                  <div className="border-t border-border my-2"></div>

                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      signOut();
                    }}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full text-left"
                  >
                    <UserIcon className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu removed */}
    </nav>
  );
}
