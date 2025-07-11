'use client';

import { AlertTriangle, Clock, Shield } from 'lucide-react';

interface RateLimitInfoProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function RateLimitInfo({ isVisible, onClose }: RateLimitInfoProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="h-6 w-6 text-yellow-500" />
          <h3 className="text-lg font-semibold text-foreground">Rate Limit Information</h3>
        </div>
        
        <div className="space-y-4 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-foreground mb-1">Security Protection</p>
              <p>Rate limiting protects against automated attacks and ensures fair usage for all users.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-foreground mb-1">What to do</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Wait for the cooldown period to complete</li>
                <li>Ensure you're using the correct credentials</li>
                <li>Avoid rapid repeated login attempts</li>
                <li>Clear your browser cache if issues persist</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-muted/50 rounded-md p-3">
            <p className="text-xs">
              <strong>Note:</strong> If you continue experiencing issues, please contact support or try again later.
            </p>
          </div>
        </div>
        
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
