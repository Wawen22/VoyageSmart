import { Metadata } from 'next';
import Link from 'next/link';
import { Cookie, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Cookie Policy | VoyageSmart',
  description: 'Cookie Policy and tracking information for VoyageSmart',
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Cookie className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">Cookie Policy</h1>
              <p className="text-muted-foreground mt-1">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <div className="glass-card p-8 rounded-2xl border border-border/50 space-y-8">
            
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">1. What Are Cookies?</h2>
              <p className="text-muted-foreground leading-relaxed">
                Cookies are small text files that are placed on your device when you visit our website. They help 
                us provide you with a better experience by remembering your preferences, keeping you logged in, 
                and understanding how you use our platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">2. Types of Cookies We Use</h2>
              
              <div className="space-y-6 mt-6">
                <div className="p-6 bg-green-500/5 rounded-lg border border-green-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="px-3 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-sm font-medium">
                      Always Active
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">Strictly Necessary Cookies</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    These cookies are essential for the website to function properly. They enable core functionality 
                    such as security, authentication, and accessibility features.
                  </p>
                  <div className="mt-4">
                    <h4 className="font-semibold text-foreground mb-2">Examples:</h4>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      <li><code className="text-sm bg-background/50 px-2 py-1 rounded">sb-*-auth-token</code> - Authentication session</li>
                      <li><code className="text-sm bg-background/50 px-2 py-1 rounded">cookie-consent-given</code> - Cookie consent status</li>
                      <li><code className="text-sm bg-background/50 px-2 py-1 rounded">theme-preference</code> - Dark/light mode preference</li>
                    </ul>
                  </div>
                </div>

                <div className="p-6 bg-blue-500/5 rounded-lg border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium">
                      Optional
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">Analytics Cookies</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    These cookies help us understand how visitors interact with our website by collecting and 
                    reporting information anonymously. This helps us improve our services.
                  </p>
                  <div className="mt-4">
                    <h4 className="font-semibold text-foreground mb-2">Examples:</h4>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      <li><code className="text-sm bg-background/50 px-2 py-1 rounded">_ga</code> - Google Analytics (if enabled)</li>
                      <li><code className="text-sm bg-background/50 px-2 py-1 rounded">usage-analytics</code> - Internal analytics</li>
                    </ul>
                  </div>
                </div>

                <div className="p-6 bg-purple-500/5 rounded-lg border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="px-3 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full text-sm font-medium">
                      Optional
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">Functional Cookies</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    These cookies enable enhanced functionality and personalization, such as remembering your 
                    preferences and settings.
                  </p>
                  <div className="mt-4">
                    <h4 className="font-semibold text-foreground mb-2">Examples:</h4>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      <li><code className="text-sm bg-background/50 px-2 py-1 rounded">user-preferences</code> - User settings and preferences</li>
                      <li><code className="text-sm bg-background/50 px-2 py-1 rounded">language</code> - Language preference</li>
                      <li><code className="text-sm bg-background/50 px-2 py-1 rounded">currency</code> - Currency preference</li>
                    </ul>
                  </div>
                </div>

                <div className="p-6 bg-orange-500/5 rounded-lg border border-orange-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="px-3 py-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-full text-sm font-medium">
                      Optional
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">Marketing Cookies</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    These cookies track your online activity to help advertisers deliver more relevant advertising 
                    or to limit how many times you see an ad.
                  </p>
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground italic">
                      Note: VoyageSmart currently does not use marketing cookies. This section is reserved for 
                      future use if we implement advertising features.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">3. Third-Party Cookies</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Some cookies are placed by third-party services that appear on our pages:
              </p>
              
              <div className="space-y-3">
                <div className="p-4 bg-background/50 rounded-lg border border-border/50">
                  <h4 className="font-semibold text-foreground mb-2">Stripe</h4>
                  <p className="text-sm text-muted-foreground">
                    Payment processing cookies for secure transactions. These are necessary for payment functionality.
                  </p>
                </div>

                <div className="p-4 bg-background/50 rounded-lg border border-border/50">
                  <h4 className="font-semibold text-foreground mb-2">Mapbox</h4>
                  <p className="text-sm text-muted-foreground">
                    Map service cookies for displaying interactive maps and location features.
                  </p>
                </div>

                <div className="p-4 bg-background/50 rounded-lg border border-border/50">
                  <h4 className="font-semibold text-foreground mb-2">Supabase</h4>
                  <p className="text-sm text-muted-foreground">
                    Authentication and database cookies for secure user sessions.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">4. How to Manage Cookies</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You have several options to manage or disable cookies:
              </p>

              <div className="space-y-4">
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <h4 className="font-semibold text-foreground mb-2">1. Cookie Consent Banner</h4>
                  <p className="text-sm text-muted-foreground">
                    When you first visit VoyageSmart, you'll see a cookie consent banner where you can choose 
                    which types of cookies to accept. You can change your preferences at any time in your{' '}
                    <Link href="/profile/privacy" className="text-primary hover:underline">
                      Privacy Settings
                    </Link>.
                  </p>
                </div>

                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <h4 className="font-semibold text-foreground mb-2">2. Browser Settings</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Most browsers allow you to control cookies through their settings:
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
                    <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
                    <li><strong>Safari:</strong> Preferences → Privacy → Cookies and website data</li>
                    <li><strong>Edge:</strong> Settings → Cookies and site permissions → Cookies and site data</li>
                  </ul>
                </div>

                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <h4 className="font-semibold text-foreground mb-2">3. Opt-Out Tools</h4>
                  <p className="text-sm text-muted-foreground">
                    You can use browser extensions like Privacy Badger or uBlock Origin to block tracking cookies.
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">⚠️ Important:</strong> Disabling necessary cookies may affect 
                  the functionality of VoyageSmart. You may not be able to log in or use certain features.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">5. Cookie Lifespan</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Cookies have different lifespans:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li><strong>Session Cookies:</strong> Deleted when you close your browser</li>
                <li><strong>Persistent Cookies:</strong> Remain on your device for a set period (typically 1-12 months)</li>
                <li><strong>Authentication Cookies:</strong> Expire after 7 days of inactivity</li>
                <li><strong>Preference Cookies:</strong> Stored for 1 year</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">6. Updates to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Cookie Policy from time to time to reflect changes in our practices or for 
                legal, operational, or regulatory reasons. We will notify you of any significant changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">7. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about our use of cookies, please contact us:
              </p>
              <div className="mt-4 p-4 bg-background/50 rounded-lg border border-border/50">
                <p className="text-foreground">
                  <strong>Email:</strong>{' '}
                  <a href="mailto:info@voyage-smart.app" className="text-primary hover:underline">
                    info@voyage-smart.app
                  </a>
                </p>
                <p className="text-foreground mt-2 text-sm text-muted-foreground">
                  For privacy-specific inquiries, you can also use{' '}
                  <a href="mailto:privacy@voyage-smart.app" className="text-primary hover:underline">
                    privacy@voyage-smart.app
                  </a>
                </p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}

