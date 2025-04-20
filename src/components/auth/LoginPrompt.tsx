'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { InfoIcon } from 'lucide-react';

interface LoginPromptProps {
  message?: string;
  redirectUrl?: string;
}

export default function LoginPrompt({ 
  message = 'You need to sign in to access this feature', 
  redirectUrl 
}: LoginPromptProps) {
  const router = useRouter();
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  
  const handleLogin = () => {
    const returnUrl = redirectUrl || currentPath;
    router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
  };
  
  return (
    <div className="bg-amber-100 dark:bg-amber-900/30 border-l-4 border-amber-500 p-4 text-amber-700 dark:text-amber-300 rounded-md">
      <div className="flex items-start">
        <InfoIcon className="h-5 w-5 mr-2 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium">{message}</p>
          <p className="text-sm mt-1">Please sign in to continue.</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-3 bg-amber-200 dark:bg-amber-800 border-amber-300 dark:border-amber-700 hover:bg-amber-300 dark:hover:bg-amber-700"
            onClick={handleLogin}
          >
            Sign In
          </Button>
        </div>
      </div>
    </div>
  );
}
