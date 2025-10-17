import { CheckSquareIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChecklistButtonProps {
  onClick: () => void;
  disabled?: boolean;
  pendingCount?: number;
  className?: string;
}

export function ChecklistButton({
  onClick,
  disabled,
  pendingCount,
  className
}: ChecklistButtonProps) {
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-gradient-to-r from-emerald-400/40 via-emerald-500/25 to-teal-500/40 px-3 py-2 text-sm font-medium text-emerald-100 shadow-[0_10px_30px_-15px_rgba(16,185,129,0.8)] backdrop-blur-md transition hover:scale-105 hover:border-emerald-300/60 hover:shadow-[0_12px_40px_-10px_rgba(20,184,166,0.65)] focus-visible:ring-emerald-300/60 disabled:opacity-60 disabled:cursor-not-allowed',
        disabled && 'opacity-60 cursor-not-allowed',
        className
      )}
    >
      <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400/25 text-emerald-100 ring-1 ring-emerald-200/30 transition group-hover:bg-emerald-300/35 group-hover:shadow-inner">
        <CheckSquareIcon className="h-4 w-4" />
        {typeof pendingCount === 'number' && pendingCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-w-[1.4rem] items-center justify-center rounded-full bg-emerald-400 px-1 text-xs font-semibold text-emerald-950 shadow-sm">
            {pendingCount}
          </span>
        )}
      </span>
      <span className="tracking-wide drop-shadow-sm">Checklist</span>
    </Button>
  );
}
