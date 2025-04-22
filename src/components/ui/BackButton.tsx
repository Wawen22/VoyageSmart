import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';

export type BackButtonProps = {
  href: string;
  label?: string;
  className?: string;
};

export default function BackButton({ href, label = 'Back', className }: BackButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        "text-primary hover:text-primary/90 transition-all flex items-center text-xs sm:text-sm",
        className
      )}
      aria-label={`Back to ${label}`}
    >
      <ArrowLeft className="h-4 w-4 mr-1" />
      {label}
    </Link>
  );
}
