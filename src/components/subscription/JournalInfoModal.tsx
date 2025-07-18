'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpenIcon, 
  ImageIcon, 
  ClockIcon, 
  StarIcon, 
  LockIcon,
  CheckIcon,
  InfoIcon,
  SparklesIcon
} from 'lucide-react';
import Image from 'next/image';

interface JournalInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function JournalInfoModal({ isOpen, onClose }: JournalInfoModalProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    onClose();
    router.push('/pricing');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
              <LockIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Premium Feature</DialogTitle>
              <Badge variant="secondary" className="mt-1">
                <SparklesIcon className="h-3 w-3 mr-1" />
                Premium Only
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Feature Preview Image */}
          <div className="relative rounded-lg overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-8">
            <div className="text-center">
              <div className="flex justify-center gap-4 mb-4">
                <div className="p-4 rounded-xl bg-white dark:bg-gray-800 shadow-lg">
                  <BookOpenIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-gray-800 shadow-lg">
                  <ImageIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-gray-800 shadow-lg">
                  <ClockIcon className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Travel Journal & Photo Gallery
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Capture your memories with rich journal entries, photo galleries, and timeline views
              </p>
            </div>
          </div>

          {/* Feature Description */}
          <div>
            <h4 className="font-semibold text-lg mb-3">What you'll get with Premium:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckIcon className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Unlimited Journal Entries</p>
                    <p className="text-sm text-muted-foreground">Write detailed daily entries about your adventures</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckIcon className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Photo Gallery</p>
                    <p className="text-sm text-muted-foreground">Upload and organize unlimited travel photos</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckIcon className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Timeline View</p>
                    <p className="text-sm text-muted-foreground">See your memories in chronological order</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckIcon className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Rich Text Editor</p>
                    <p className="text-sm text-muted-foreground">Format your entries with styles and links</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckIcon className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Media Attachments</p>
                    <p className="text-sm text-muted-foreground">Add photos and files to your entries</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckIcon className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Export & Backup</p>
                    <p className="text-sm text-muted-foreground">Download your memories anytime</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Free vs Premium Comparison */}
          <div className="bg-muted/30 rounded-lg p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <InfoIcon className="h-4 w-4" />
              Free vs Premium
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-muted-foreground mb-2">Free Plan</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• No journal access</li>
                  <li>• No photo gallery</li>
                  <li>• Basic trip planning only</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-primary mb-2">Premium Plan</p>
                <ul className="space-y-1 text-foreground">
                  <li>• Unlimited journal entries</li>
                  <li>• Unlimited photo uploads</li>
                  <li>• Timeline & gallery views</li>
                  <li>• Rich text formatting</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Social Proof */}
          <div className="text-center bg-gradient-to-r from-primary/10 to-purple-100/50 dark:from-primary/10 dark:to-purple-900/20 rounded-lg p-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <StarIcon className="h-4 w-4 text-yellow-500 fill-current" />
              <StarIcon className="h-4 w-4 text-yellow-500 fill-current" />
              <StarIcon className="h-4 w-4 text-yellow-500 fill-current" />
              <StarIcon className="h-4 w-4 text-yellow-500 fill-current" />
              <StarIcon className="h-4 w-4 text-yellow-500 fill-current" />
            </div>
            <p className="text-sm font-medium">Join thousands of travelers who have upgraded</p>
            <p className="text-xs text-muted-foreground mt-1">
              "The journal feature helped me remember every detail of my trip!" - Sarah M.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={handleUpgrade}
              className="flex-1 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-semibold py-3"
            >
              <SparklesIcon className="h-4 w-4 mr-2" />
              Upgrade to Premium
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Maybe Later
            </Button>
          </div>

          {/* Pricing Hint */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Starting from <span className="font-semibold text-primary">€9.99/month</span></p>
            <p>Cancel anytime • 30-day money-back guarantee</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
