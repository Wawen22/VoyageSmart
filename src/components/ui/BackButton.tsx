import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';

export type BackButtonProps = {
  href: string;
  label?: string;
  className?: string;
  theme?: 'default' | 'blue' | 'purple' | 'violet' | 'green' | 'orange' | 'amber' | 'sky';
};

export default function BackButton({ href, label = 'Back', className, theme = 'default' }: BackButtonProps) {
  const getThemeClasses = () => {
    switch (theme) {
      case 'blue':
        return 'from-blue-500/20 via-blue-400/15 to-indigo-500/20 border-blue-500/30 text-blue-600 hover:text-blue-500 shadow-blue-500/25';
      case 'purple':
        return 'from-purple-500/20 via-purple-400/15 to-indigo-500/20 border-purple-500/30 text-purple-600 hover:text-purple-500 shadow-purple-500/25';
      case 'violet':
        return 'from-violet-500/20 via-violet-400/15 to-pink-500/20 border-violet-500/30 text-violet-600 hover:text-violet-500 shadow-violet-500/25';
      case 'green':
        return 'from-emerald-500/20 via-green-400/15 to-teal-500/20 border-emerald-500/30 text-emerald-600 hover:text-emerald-500 shadow-emerald-500/25';
      case 'orange':
        return 'from-orange-500/20 via-orange-400/15 to-red-500/20 border-orange-500/30 text-orange-600 hover:text-orange-500 shadow-orange-500/25';
      case 'amber':
        return 'from-amber-500/20 via-yellow-400/15 to-orange-500/20 border-amber-500/30 text-amber-600 hover:text-amber-500 shadow-amber-500/25';
      case 'sky':
        return 'from-sky-500/20 via-sky-400/15 to-cyan-500/20 border-sky-500/30 text-sky-600 hover:text-sky-500 shadow-sky-500/25';
      default:
        return 'from-primary/20 via-primary/15 to-primary/20 border-primary/30 text-primary hover:text-primary/80 shadow-primary/25';
    }
  };

  return (
    <Link
      href={href}
      className={cn(
        "relative overflow-hidden inline-flex items-center px-3 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 group shadow-lg back-button-mobile",
        className
      )}
      aria-label={`Back to ${label}`}
    >
      {/* Glassy Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getThemeClasses()} backdrop-blur-sm border rounded-xl`}></div>
      <div className={`absolute inset-0 bg-gradient-to-br from-current/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl`}></div>

      {/* Content */}
      <div className="relative z-10 flex items-center gap-2">
        <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </Link>
  );
}
