'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangleIcon, RocketIcon } from 'lucide-react';
import { usePremiumFeature } from '@/hooks/usePremiumFeature';

export default function TripLimitPrompt() {
  const router = useRouter();
  const { showUpgradeModal } = usePremiumFeature();

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <AlertTriangleIcon className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl">Trip Limit Reached</CardTitle>
          <CardDescription>
            Free accounts are limited to 5 trips maximum (including trips you participate in).
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-4">
            Upgrade to Premium to create unlimited trips and access all premium features.
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground mb-4">
            <RocketIcon className="h-4 w-4" />
            <span>Join thousands of travelers who have upgraded</span>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
          >
            Back to Dashboard
          </Button>
          <Button
            onClick={() => {
              if (showUpgradeModal) {
                showUpgradeModal();
              } else {
                router.push('/pricing');
              }
            }}
          >
            Upgrade Now
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
