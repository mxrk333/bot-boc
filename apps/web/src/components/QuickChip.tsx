import { cn } from '@repo/ui/utils'

interface QuickChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
}

/**
 * A horizontally-scrollable action chip.
 *
 * Usage:
 *   <QuickChip label="📦 Box Size Limits" onClick={() => ask('...')} />
 */
export function QuickChip({ label, className, ...props }: QuickChipProps) {
  return (
    <button
      className={cn(
        'whitespace-nowrap px-4 py-2 rounded-full',
        'bg-card border border-border',
        'text-xs font-semibold text-foreground',
        'hover:border-primary/40 hover:shadow-sm',
        'transition-all duration-150 shrink-0',
        className
      )}
      {...props}
    >
      {label}
    </button>
  )
}
