/**
 * Auth navigation button for the header bar.
 *
 * variant="login"  → outlined "Log in" button
 * variant="signup" → filled primary "Sign up" button
 */

import { useNavigate } from 'react-router-dom'
import { cn } from '@repo/ui/utils'

interface AuthButtonProps {
  variant?: 'login' | 'signup'
  className?: string
}

export function AuthButton({ variant = 'login', className }: AuthButtonProps) {
  const navigate = useNavigate()

  const isSignup = variant === 'signup'
  const label = isSignup ? 'Sign up' : 'Log in'
  const path = isSignup ? '/signup' : '/login'

  return (
    <button
      onClick={() => navigate(path)}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold',
        'transition-all duration-200 cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isSignup
          ? 'bg-primary text-primary-foreground shadow-sm hover:opacity-90 active:scale-[0.97]'
          : 'border border-border text-foreground hover:bg-muted active:scale-[0.97]',
        className
      )}
    >
      <span className="material-symbols-outlined text-base" style={{ fontSize: '18px' }}>
        {isSignup ? 'person_add' : 'login'}
      </span>
      {label}
    </button>
  )
}
