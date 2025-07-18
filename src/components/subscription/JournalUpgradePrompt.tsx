'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LockIcon, BookOpenIcon, ImageIcon, StarIcon } from 'lucide-react';

interface JournalUpgradePromptProps {
  feature: 'journal' | 'photo_gallery';
  showPreview?: boolean;
  previewCount?: number;
  maxPreview?: number;
}

export default function JournalUpgradePrompt({ 
  feature, 
  showPreview = false, 
  previewCount = 0, 
  maxPreview = 2 
}: JournalUpgradePromptProps) {
  const router = useRouter();

  const featureConfig = {
    journal: {
      icon: BookOpenIcon,
      title: 'Journal Entries',
      description: 'Keep detailed travel journals and memories',
      previewText: `You can create up to ${maxPreview} journal entries with the Free plan.`,
      upgradeText: 'Upgrade to Premium for unlimited journal entries and advanced features.'
    },
    photo_gallery: {
      icon: ImageIcon,
      title: 'Photo Gallery',
      description: 'Upload and organize your travel photos',
      previewText: `You can upload up to ${maxPreview} photos with the Free plan.`,
      upgradeText: 'Upgrade to Premium for unlimited photo uploads and gallery features.'
    }
  };

  const config = featureConfig[feature];
  const IconComponent = config.icon;

  if (showPreview && previewCount < maxPreview) {
    // Show preview mode - user can still add items
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <IconComponent className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-blue-900 dark:text-blue-100">{config.title}</h3>
              <Badge variant="secondary" className="text-xs">
                {previewCount}/{maxPreview} Free
              </Badge>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              {config.previewText}
            </p>
            <Button
              size="sm"
              onClick={() => router.push('/pricing')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <StarIcon className="h-4 w-4 mr-2" />
              Upgrade for Unlimited
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (showPreview && previewCount >= maxPreview) {
    // Show limit reached
    return (
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800/30 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
            <LockIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-amber-900 dark:text-amber-100">Limit Reached</h3>
              <Badge variant="destructive" className="text-xs">
                {previewCount}/{maxPreview}
              </Badge>
            </div>
            <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
              You've reached the free limit for {config.title.toLowerCase()}. {config.upgradeText}
            </p>
            <Button
              size="sm"
              onClick={() => router.push('/pricing')}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <StarIcon className="h-4 w-4 mr-2" />
              Upgrade to Premium
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show full upgrade prompt
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <IconComponent className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl">Premium Feature</CardTitle>
          <CardDescription>
            {config.description} - available for Premium subscribers only.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-4">
            {config.upgradeText}
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground mb-4">
            <StarIcon className="h-4 w-4" />
            <span>Join thousands of travelers who have upgraded</span>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            onClick={() => router.push('/pricing')}
            className="w-full"
          >
            View Premium Plans
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
