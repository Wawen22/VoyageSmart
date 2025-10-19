import Link from 'next/link';
import { Shield, Cookie, FileText, Mail, HelpCircle, BookOpen, Compass, Map } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t border-border/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* About */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">VoyageSmart</h3>
            <p className="text-sm text-muted-foreground">
              Intelligent travel planning platform for modern travelers.
            </p>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/hub"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
                >
                  <BookOpen className="h-3 w-3" />
                  Travel Hub
                </Link>
              </li>
              <li>
                <Link
                  href="/support"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
                >
                  <FileText className="h-3 w-3" />
                  Support
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
                >
                  <Compass className="h-3 w-3" />
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
                >
                  <Shield className="h-3 w-3" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms-of-service"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
                >
                  <FileText className="h-3 w-3" />
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/cookie-policy"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
                >
                  <Cookie className="h-3 w-3" />
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Privacy */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Your Privacy</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/profile/privacy"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Privacy Settings
                </Link>
              </li>
              <li>
                <button
                  onClick={() => {
                    // Clear cookie consent to show banner again
                    localStorage.removeItem('cookie-consent-given');
                    window.location.reload();
                  }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors text-left"
                >
                  Manage Cookies
                </button>
              </li>
              <li>
                <Link
                  href="/profile/privacy"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Export My Data
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Contact</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/support"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
                >
                  <HelpCircle className="h-3 w-3" />
                  Contact Support
                </Link>
              </li>
              <li>
                <a
                  href="mailto:info@voyage-smart.app"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
                >
                  <Mail className="h-3 w-3" />
                  General Inquiries
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@voyage-smart.app"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
                >
                  <Mail className="h-3 w-3" />
                  Support
                </a>
              </li>
              <li>
                <a
                  href="mailto:privacy@voyage-smart.app"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
                >
                  <Shield className="h-3 w-3" />
                  Privacy Inquiries
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-border/50">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} VoyageSmart. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>GDPR Compliant</span>
              <span>•</span>
              <span>EU Data Protection</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

