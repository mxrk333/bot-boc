/**
 * Pill-shaped action chip displayed in the horizontal quick-action bar
 * beneath the chat input.
 */

import { cn } from '@repo/ui/utils'

interface QuickChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
}

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
