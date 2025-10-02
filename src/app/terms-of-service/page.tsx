import { Metadata } from 'next';
import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service | VoyageSmart',
  description: 'Terms of Service and user agreement for VoyageSmart',
};

export default function TermsOfServicePage() {
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
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">Terms of Service</h1>
              <p className="text-muted-foreground mt-1">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <div className="glass-card p-8 rounded-2xl border border-border/50 space-y-8">
            
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using VoyageSmart ("the Service"), you accept and agree to be bound by these 
                Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">2. Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed">
                VoyageSmart is a travel planning platform that provides tools for:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-3">
                <li>Creating and managing travel itineraries</li>
                <li>Tracking expenses and splitting costs</li>
                <li>Collaborative trip planning with other users</li>
                <li>AI-powered travel recommendations (with subscription)</li>
                <li>Accommodation and transportation management</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">3. User Accounts</h2>
              
              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">3.1 Account Creation</h3>
              <p className="text-muted-foreground leading-relaxed">
                To use certain features of the Service, you must create an account. You agree to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-3">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your information to keep it accurate</li>
                <li>Maintain the security of your password</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">3.2 Age Requirement</h3>
              <p className="text-muted-foreground leading-relaxed">
                You must be at least 16 years old to use VoyageSmart. By using the Service, you represent that 
                you meet this age requirement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">4. Subscription Plans</h2>
              
              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">4.1 Free Tier</h3>
              <p className="text-muted-foreground leading-relaxed">
                The free tier allows you to create up to 3 trips with basic features.
              </p>

              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">4.2 Premium Plans</h3>
              <p className="text-muted-foreground leading-relaxed">
                Premium and AI subscription plans provide additional features and are billed monthly or annually. 
                By subscribing, you agree to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-3">
                <li>Pay all fees associated with your subscription</li>
                <li>Automatic renewal unless cancelled</li>
                <li>Our refund policy as stated in Section 5</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">4.3 Cancellation</h3>
              <p className="text-muted-foreground leading-relaxed">
                You may cancel your subscription at any time. Cancellation will take effect at the end of your 
                current billing period. No refunds will be provided for partial months.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">5. Payment and Refunds</h2>
              <p className="text-muted-foreground leading-relaxed">
                All payments are processed securely through Stripe. We offer a 14-day money-back guarantee for 
                new subscriptions. After 14 days, subscriptions are non-refundable except as required by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">6. User Content</h2>
              
              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">6.1 Your Content</h3>
              <p className="text-muted-foreground leading-relaxed">
                You retain all rights to the content you create on VoyageSmart (trips, itineraries, notes, etc.). 
                By using the Service, you grant us a limited license to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-3">
                <li>Store and display your content</li>
                <li>Process your content to provide the Service</li>
                <li>Share your content with trip participants you invite</li>
                <li>Use anonymized data for service improvement</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">6.2 Prohibited Content</h3>
              <p className="text-muted-foreground leading-relaxed">
                You agree not to post content that:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-3">
                <li>Violates any law or regulation</li>
                <li>Infringes on intellectual property rights</li>
                <li>Contains malware or harmful code</li>
                <li>Is fraudulent, false, or misleading</li>
                <li>Harasses, threatens, or harms others</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">7. AI Features</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our AI-powered features use third-party services (Google Gemini, OpenAI) to provide recommendations. 
                By using AI features, you acknowledge that:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-3">
                <li>AI recommendations are suggestions only, not guarantees</li>
                <li>You are responsible for verifying all AI-generated information</li>
                <li>Your trip data may be processed by AI providers (with your consent)</li>
                <li>AI features require an active AI subscription</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">8. Privacy and Data Protection</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your privacy is important to us. Please review our{' '}
                <Link href="/privacy-policy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>{' '}
                to understand how we collect, use, and protect your personal information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">9. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Service, including its design, features, and content (excluding user content), is owned by 
                VoyageSmart and protected by copyright, trademark, and other intellectual property laws. You may 
                not copy, modify, distribute, or reverse engineer any part of the Service without our permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">10. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                VoyageSmart is provided "as is" without warranties of any kind. We are not liable for:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-3">
                <li>Indirect, incidental, or consequential damages</li>
                <li>Loss of data, profits, or business opportunities</li>
                <li>Service interruptions or errors</li>
                <li>Third-party actions or content</li>
                <li>Travel arrangements made based on our Service</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">11. Indemnification</h2>
              <p className="text-muted-foreground leading-relaxed">
                You agree to indemnify and hold VoyageSmart harmless from any claims, damages, or expenses arising 
                from your use of the Service, violation of these Terms, or infringement of any rights of others.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">12. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to suspend or terminate your account at any time for:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-3">
                <li>Violation of these Terms</li>
                <li>Fraudulent or illegal activity</li>
                <li>Non-payment of fees</li>
                <li>Abuse of the Service</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                You may terminate your account at any time through your account settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">13. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may modify these Terms at any time. We will notify you of significant changes via email or 
                through the Service. Your continued use after such changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">14. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms are governed by the laws of the European Union and Italy, without regard to conflict 
                of law principles. Any disputes shall be resolved in the courts of Italy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">15. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                For questions about these Terms, please contact us:
              </p>
              <div className="mt-4 p-4 bg-background/50 rounded-lg border border-border/50">
                <p className="text-foreground">
                  <strong>Email:</strong>{' '}
                  <a href="mailto:info@voyage-smart.app" className="text-primary hover:underline">
                    info@voyage-smart.app
                  </a>
                </p>
                <p className="text-foreground mt-2">
                  <strong>Support:</strong>{' '}
                  <a href="mailto:support@voyage-smart.app" className="text-primary hover:underline">
                    support@voyage-smart.app
                  </a>{' '}
                  (forwards to info@)
                </p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}

