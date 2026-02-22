/**
 * Icon-only button using Material Symbols.
 * Comes in three sizes (sm / md / lg) and supports the "filled" variant.
 */

import { cn } from '@repo/ui/utils'

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string
  filled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: 'size-8 text-base',
  md: 'size-10 text-xl',
  lg: 'size-12 text-2xl',
} as const

export function IconButton({ icon, filled, size = 'md', className, ...props }: IconButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl',
        'transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:pointer-events-none disabled:opacity-40',
        sizeMap[size],
        className
      )}
      {...props}
    >
      <span className={cn('material-symbols-outlined', filled && 'filled')}>{icon}</span>
    </button>
  )
}
