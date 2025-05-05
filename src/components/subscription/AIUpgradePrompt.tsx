'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LockIcon, SparklesIcon } from 'lucide-react';

interface AIUpgradePromptProps {
  feature: string;
  description?: string;
}

export default function AIUpgradePrompt({ feature, description }: AIUpgradePromptProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <SparklesIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
          <CardTitle className="text-xl">AI Assistant Feature</CardTitle>
          <CardDescription>
            {description || `The ${feature} feature is available for AI Assistant subscribers only.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-4">
            Upgrade to the AI Assistant plan to unlock AI-powered features including the AI Assistant, Itinerary Wizard, and more.
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground mb-4">
            <SparklesIcon className="h-4 w-4" />
            <span>Experience the power of AI in your travel planning</span>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            onClick={() => router.push('/pricing')}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
          >
            View AI Assistant Plan
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
