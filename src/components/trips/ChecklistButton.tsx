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
      variant="outline"
      className={cn(
        'group inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm transition hover:border-primary/40 hover:text-foreground',
        disabled && 'opacity-60 cursor-not-allowed',
        className
      )}
    >
      <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition group-hover:bg-primary/15">
        <CheckSquareIcon className="h-4 w-4" />
        {typeof pendingCount === 'number' && pendingCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-w-[1.4rem] items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground shadow-sm">
            {pendingCount}
          </span>
        )}
      </span>
      <span>Checklist</span>
    </Button>
  );
}
