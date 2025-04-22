'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LockIcon, RocketIcon } from 'lucide-react';

interface UpgradePromptProps {
  feature: string;
  description?: string;
}

export default function UpgradePrompt({ feature, description }: UpgradePromptProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <LockIcon className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl">Premium Feature</CardTitle>
          <CardDescription>
            {description || `The ${feature} feature is available for Premium subscribers only.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-4">
            Upgrade to Premium to unlock unlimited trips, {feature.toLowerCase()}, and more premium features.
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground mb-4">
            <RocketIcon className="h-4 w-4" />
            <span>Join thousands of travelers who have upgraded</span>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            onClick={() => router.push('/pricing')}
            className="w-full"
          >
            View Pricing Plans
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
