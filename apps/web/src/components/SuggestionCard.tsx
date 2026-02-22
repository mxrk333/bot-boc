/**
 * Clickable suggestion tile shown in the welcome hero section.
 * Each card has a Material Symbol icon, a title, and a subtitle.
 */

import { cn } from '@repo/ui/utils'

interface SuggestionCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string
  iconBg?: string
  iconColor?: string
  title: string
  subtitle: string
}

export function SuggestionCard({
  icon,
  iconBg = 'bg-primary/10',
  iconColor = 'text-primary',
  title,
  subtitle,
  className,
  ...props
}: SuggestionCardProps) {
  return (
    <button
      className={cn(
        'flex items-center gap-4 p-4 w-full',
        'bg-card border border-border rounded-2xl',
        'hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5',
        'transition-all duration-200 text-left',
        className
      )}
      {...props}
    >
      <div className={cn('size-11 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
        <span className={cn('material-symbols-outlined', iconColor)}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-foreground truncate">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
      </div>
    </button>
  )
}
