import { cn } from '@repo/ui/utils'

interface SuggestionCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string
  /** Tailwind bg class for the icon circle, e.g. "bg-blue-50 dark:bg-blue-900/20" */
  iconBg?: string
  /** Tailwind text color for the icon */
  iconColor?: string
  title: string
  subtitle: string
}

/**
 * A clickable suggestion tile shown in the welcome hero.
 *
 * Usage:
 *   <SuggestionCard
 *     icon="inventory_2"
 *     iconColor="text-primary"
 *     title="What can I send?"
 *     subtitle="Check restricted items list"
 *     onClick={() => ask('What items can I send in a Balikbayan box?')}
 *   />
 */
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
