import Link from 'next/link';
import { Mail, Shield, Wrench, HelpCircle, Clock, ArrowLeft, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-primary/5 border-b border-border/50">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-4xl mx-auto px-4 py-12 relative">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">Contact Support</h1>
              <p className="text-muted-foreground mt-2">
                We're here to help! Get in touch with our team.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Primary Contact */}
        <div className="mb-8 p-6 bg-primary/5 border border-primary/20 rounded-xl">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-foreground mb-2">Primary Contact</h2>
              <p className="text-muted-foreground mb-4">
                For all inquiries, questions, and support requests:
              </p>
              <a
                href="mailto:info@voyage-smart.app"
                className="inline-flex items-center gap-2 text-lg font-semibold text-primary hover:underline"
              >
                <Mail className="h-5 w-5" />
                info@voyage-smart.app
              </a>
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Response time: Within 24-48 hours</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* General Support */}
          <div className="p-6 bg-card border border-border rounded-xl hover:border-primary/50 transition-all">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">General Support</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Questions about features, account, or subscriptions
                </p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">Contact us for:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                <li>Account questions</li>
                <li>Feature requests</li>
                <li>Subscription inquiries</li>
                <li>General questions</li>
              </ul>
              <a
                href="mailto:support@voyage-smart.app"
                className="inline-flex items-center gap-2 text-primary hover:underline mt-3"
              >
                <Mail className="h-4 w-4" />
                support@voyage-smart.app
              </a>
              <p className="text-xs text-muted-foreground mt-1">(forwards to info@)</p>
            </div>
          </div>

          {/* Privacy & GDPR */}
          <div className="p-6 bg-card border border-border rounded-xl hover:border-primary/50 transition-all">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Privacy & GDPR</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Data protection, privacy, and GDPR requests
                </p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">Contact us for:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                <li>Data access requests</li>
                <li>Data deletion requests</li>
                <li>Privacy concerns</li>
                <li>GDPR inquiries</li>
              </ul>
              <a
                href="mailto:privacy@voyage-smart.app"
                className="inline-flex items-center gap-2 text-primary hover:underline mt-3"
              >
                <Shield className="h-4 w-4" />
                privacy@voyage-smart.app
              </a>
              <p className="text-xs text-muted-foreground mt-1">(forwards to info@)</p>
              <div className="mt-3 pt-3 border-t border-border/50">
                <Link
                  href="/profile/privacy"
                  className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                >
                  Manage Privacy Settings →
                </Link>
              </div>
            </div>
          </div>

          {/* Technical Issues */}
          <div className="p-6 bg-card border border-border rounded-xl hover:border-primary/50 transition-all">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Wrench className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Technical Issues</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Bug reports, errors, and technical problems
                </p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">Report:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                <li>Bugs and errors</li>
                <li>Performance issues</li>
                <li>Login problems</li>
                <li>Feature malfunctions</li>
              </ul>
              <a
                href="mailto:info@voyage-smart.app?subject=Technical Issue"
                className="inline-flex items-center gap-2 text-primary hover:underline mt-3"
              >
                <Mail className="h-4 w-4" />
                Report Technical Issue
              </a>
            </div>
          </div>

          {/* Data Protection Officer */}
          <div className="p-6 bg-card border border-border rounded-xl hover:border-primary/50 transition-all">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Data Protection Officer</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  For formal GDPR and data protection matters
                </p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">Contact for:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                <li>Formal GDPR requests</li>
                <li>Data protection concerns</li>
                <li>Compliance questions</li>
                <li>Legal inquiries</li>
              </ul>
              <a
                href="mailto:dpo@voyage-smart.app"
                className="inline-flex items-center gap-2 text-primary hover:underline mt-3"
              >
                <Shield className="h-4 w-4" />
                dpo@voyage-smart.app
              </a>
              <p className="text-xs text-muted-foreground mt-1">(forwards to info@)</p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-primary" />
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <details className="group p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-all">
              <summary className="font-semibold text-foreground cursor-pointer list-none flex items-center justify-between">
                <span>How quickly will I receive a response?</span>
                <span className="text-primary group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-3 text-muted-foreground text-sm">
                We aim to respond to all inquiries within 24-48 hours during business days. For urgent GDPR requests, we respond within 72 hours as required by law.
              </p>
            </details>

            <details className="group p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-all">
              <summary className="font-semibold text-foreground cursor-pointer list-none flex items-center justify-between">
                <span>How do I delete my account?</span>
                <span className="text-primary group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-3 text-muted-foreground text-sm">
                You can delete your account directly from your{' '}
                <Link href="/profile/privacy" className="text-primary hover:underline">
                  Privacy Settings
                </Link>{' '}
                page. This will permanently remove all your data from our servers.
              </p>
            </details>

            <details className="group p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-all">
              <summary className="font-semibold text-foreground cursor-pointer list-none flex items-center justify-between">
                <span>How do I export my data?</span>
                <span className="text-primary group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-3 text-muted-foreground text-sm">
                Visit your{' '}
                <Link href="/profile/privacy" className="text-primary hover:underline">
                  Privacy Settings
                </Link>{' '}
                page and click "Export My Data" to download all your personal data in JSON format.
              </p>
            </details>

            <details className="group p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-all">
              <summary className="font-semibold text-foreground cursor-pointer list-none flex items-center justify-between">
                <span>What information should I include in my support request?</span>
                <span className="text-primary group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-3 text-muted-foreground text-sm">
                Please include: your account email, a detailed description of the issue, steps to reproduce (for bugs), screenshots if applicable, and your browser/device information.
              </p>
            </details>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="p-6 bg-muted/50 rounded-xl border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Additional Resources</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/privacy-policy"
              className="text-sm text-primary hover:underline flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              Privacy Policy
            </Link>
            <Link
              href="/terms-of-service"
              className="text-sm text-primary hover:underline flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              Terms of Service
            </Link>
            <Link
              href="/cookie-policy"
              className="text-sm text-primary hover:underline flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              Cookie Policy
            </Link>
            <Link
              href="/profile/privacy"
              className="text-sm text-primary hover:underline flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              Privacy Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

