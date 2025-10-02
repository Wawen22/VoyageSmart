import { Metadata } from 'next';
import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | VoyageSmart',
  description: 'Privacy Policy and data protection information for VoyageSmart',
};

export default function PrivacyPolicyPage() {
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
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">Privacy Policy</h1>
              <p className="text-muted-foreground mt-1">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <div className="glass-card p-8 rounded-2xl border border-border/50 space-y-8">
            
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                Welcome to VoyageSmart ("we," "our," or "us"). We are committed to protecting your personal 
                information and your right to privacy. This Privacy Policy explains how we collect, use, 
                disclose, and safeguard your information when you use our travel planning platform.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                By using VoyageSmart, you agree to the collection and use of information in accordance with 
                this policy. If you do not agree with our policies and practices, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">2.1 Personal Information</h3>
              <p className="text-muted-foreground leading-relaxed">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-3">
                <li>Account information (email address, name, password)</li>
                <li>Profile information (avatar, preferences, settings)</li>
                <li>Trip information (destinations, dates, itineraries)</li>
                <li>Financial information (processed securely through Stripe)</li>
                <li>Communication data (support requests, feedback)</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">2.2 Automatically Collected Information</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Device information (browser type, operating system)</li>
                <li>Usage data (pages visited, features used, time spent)</li>
                <li>Location data (with your consent, for map features)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">3. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use the information we collect for the following purposes:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-3">
                <li><strong>Service Delivery:</strong> To provide, maintain, and improve our travel planning services</li>
                <li><strong>Personalization:</strong> To customize your experience and provide relevant recommendations</li>
                <li><strong>AI Features:</strong> To power AI-driven itinerary generation and travel suggestions (with your consent)</li>
                <li><strong>Communication:</strong> To send you updates, notifications, and support messages</li>
                <li><strong>Payment Processing:</strong> To process subscriptions and payments through Stripe</li>
                <li><strong>Analytics:</strong> To understand usage patterns and improve our services (with your consent)</li>
                <li><strong>Security:</strong> To detect, prevent, and address fraud and security issues</li>
                <li><strong>Legal Compliance:</strong> To comply with legal obligations and enforce our terms</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">4. Third-Party Services</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We share your information with trusted third-party service providers who assist us in operating 
                our platform. These providers are contractually obligated to protect your data:
              </p>
              
              <div className="space-y-4">
                <div className="p-4 bg-background/50 rounded-lg border border-border/50">
                  <h4 className="font-semibold text-foreground mb-2">Stripe (Payment Processing)</h4>
                  <p className="text-sm text-muted-foreground">
                    Handles all payment transactions and subscription management. 
                    <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                      Privacy Policy
                    </a>
                  </p>
                </div>

                <div className="p-4 bg-background/50 rounded-lg border border-border/50">
                  <h4 className="font-semibold text-foreground mb-2">Google Gemini AI & OpenAI (AI Services)</h4>
                  <p className="text-sm text-muted-foreground">
                    Powers AI-driven travel recommendations and itinerary generation (only with your explicit consent).
                  </p>
                </div>

                <div className="p-4 bg-background/50 rounded-lg border border-border/50">
                  <h4 className="font-semibold text-foreground mb-2">Mapbox (Maps & Location)</h4>
                  <p className="text-sm text-muted-foreground">
                    Provides mapping and location services for trip planning.
                    <a href="https://www.mapbox.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                      Privacy Policy
                    </a>
                  </p>
                </div>

                <div className="p-4 bg-background/50 rounded-lg border border-border/50">
                  <h4 className="font-semibold text-foreground mb-2">Supabase (Database & Authentication)</h4>
                  <p className="text-sm text-muted-foreground">
                    Hosts our database and manages user authentication securely.
                    <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                      Privacy Policy
                    </a>
                  </p>
                </div>

                <div className="p-4 bg-background/50 rounded-lg border border-border/50">
                  <h4 className="font-semibold text-foreground mb-2">Resend (Email Communications)</h4>
                  <p className="text-sm text-muted-foreground">
                    Sends transactional emails and notifications (with opt-out options).
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">5. Your Rights (GDPR)</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Under the General Data Protection Regulation (GDPR), you have the following rights:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-3">
                <li><strong>Right to Access:</strong> Request a copy of all personal data we hold about you</li>
                <li><strong>Right to Rectification:</strong> Correct any inaccurate or incomplete data</li>
                <li><strong>Right to Erasure:</strong> Request deletion of your account and all associated data</li>
                <li><strong>Right to Data Portability:</strong> Export your data in a machine-readable format</li>
                <li><strong>Right to Object:</strong> Object to certain types of data processing</li>
                <li><strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
                <li><strong>Right to Withdraw Consent:</strong> Withdraw consent for optional data processing at any time</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                To exercise any of these rights, please visit your{' '}
                <Link href="/profile/privacy" className="text-primary hover:underline">
                  Privacy Settings
                </Link>{' '}
                or contact us at{' '}
                <a href="mailto:info@voyage-smart.app" className="text-primary hover:underline">
                  info@voyage-smart.app
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">6. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement industry-standard security measures to protect your personal information:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-3">
                <li>Encryption of data in transit (HTTPS/TLS)</li>
                <li>Encryption of data at rest</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication</li>
                <li>Secure payment processing through Stripe</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">7. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your personal information for as long as necessary to provide our services and comply 
                with legal obligations. Specifically:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-3">
                <li>Account data: Until you delete your account</li>
                <li>Trip data: Until you delete the trip or your account</li>
                <li>Financial records: 7 years (legal requirement)</li>
                <li>Analytics data: 2 years maximum</li>
                <li>Deleted account data: Permanently removed within 30 days</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">8. Cookies and Tracking</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar technologies to enhance your experience. You can manage your cookie 
                preferences through our{' '}
                <Link href="/cookie-policy" className="text-primary hover:underline">
                  Cookie Policy
                </Link>{' '}
                or your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">9. Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                VoyageSmart is not intended for users under the age of 16. We do not knowingly collect personal 
                information from children. If you believe we have collected information from a child, please 
                contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">10. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any significant 
                changes by email or through a prominent notice on our platform. Your continued use of VoyageSmart 
                after such changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">11. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="mt-4 p-4 bg-background/50 rounded-lg border border-border/50">
                <p className="text-foreground"><strong>Email:</strong> <a href="mailto:info@voyage-smart.app" className="text-primary hover:underline">info@voyage-smart.app</a></p>
                <p className="text-foreground mt-2"><strong>Privacy Inquiries:</strong> <a href="mailto:privacy@voyage-smart.app" className="text-primary hover:underline">privacy@voyage-smart.app</a> (forwards to info@)</p>
                <p className="text-foreground mt-2"><strong>Data Protection Officer:</strong> <a href="mailto:dpo@voyage-smart.app" className="text-primary hover:underline">dpo@voyage-smart.app</a> (forwards to info@)</p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}

