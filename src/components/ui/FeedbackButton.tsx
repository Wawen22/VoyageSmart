import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckIcon, XIcon, LoaderIcon } from 'lucide-react';

interface FeedbackButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onClick: () => Promise<boolean> | Promise<void>;
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  successText?: string;
  errorText?: string;
  loadingText?: string;
  showIcon?: boolean;
  feedbackDuration?: number;
}

export default function FeedbackButton({
  onClick,
  children,
  variant = 'default',
  size = 'default',
  successText,
  errorText,
  loadingText,
  showIcon = true,
  feedbackDuration = 2000,
  ...props
}: FeedbackButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [originalText] = useState(children);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (status === 'success' || status === 'error') {
      timer = setTimeout(() => {
        setStatus('idle');
      }, feedbackDuration);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [status, feedbackDuration]);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (status === 'loading') return;
    
    try {
      setStatus('loading');
      const result = await onClick();
      
      // If the onClick returns a boolean, use it to determine success/error
      if (typeof result === 'boolean') {
        setStatus(result ? 'success' : 'error');
      } else {
        setStatus('success');
      }
    } catch (error) {
      setStatus('error');
      console.error('Button action failed:', error);
    }
  };

  const getButtonText = () => {
    switch (status) {
      case 'loading':
        return loadingText || children;
      case 'success':
        return successText || children;
      case 'error':
        return errorText || children;
      default:
        return children;
    }
  };

  const getButtonIcon = () => {
    if (!showIcon) return null;
    
    switch (status) {
      case 'loading':
        return <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />;
      case 'success':
        return <CheckIcon className="h-4 w-4 mr-2" />;
      case 'error':
        return <XIcon className="h-4 w-4 mr-2" />;
      default:
        return null;
    }
  };

  const getButtonVariant = () => {
    if (status === 'success') {
      return 'success';
    } else if (status === 'error') {
      return 'destructive';
    } else {
      return variant;
    }
  };

  const getButtonClassName = () => {
    let className = '';
    
    if (status === 'success') {
      className += ' bg-green-600 hover:bg-green-700 text-white';
    } else if (status === 'error') {
      className += ' bg-red-600 hover:bg-red-700 text-white';
    }
    
    if (status === 'loading' || status === 'success' || status === 'error') {
      className += ' animate-pulse-once';
    }
    
    return className;
  };

  return (
    <Button
      variant={variant as any}
      size={size}
      onClick={handleClick}
      disabled={status === 'loading' || props.disabled}
      className={`${props.className || ''} ${getButtonClassName()}`}
      {...props}
    >
      {getButtonIcon()}
      {getButtonText()}
    </Button>
  );
}
