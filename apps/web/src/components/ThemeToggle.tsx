/**
 * Standalone theme toggle button for the header.
 * Cycles through light → dark → system on click.
 * Visible to all users (logged in or not).
 */

import { cn } from '@repo/ui/utils'
import { useTheme } from '../hooks/useTheme'

const THEME_CYCLE = ['light', 'dark', 'system'] as const

const THEME_ICON: Record<string, string> = {
  light: 'light_mode',
  dark: 'dark_mode',
  system: 'desktop_windows',
}

const THEME_LABEL: Record<string, string> = {
  light: 'Light mode',
  dark: 'Dark mode',
  system: 'System default',
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const handleToggle = () => {
    const currentIdx = THEME_CYCLE.indexOf(theme)
    const nextIdx = (currentIdx + 1) % THEME_CYCLE.length
    setTheme(THEME_CYCLE[nextIdx])
  }

  return (
    <button
      onClick={handleToggle}
      className={cn(
        'inline-flex items-center justify-center size-9 rounded-lg',
        'text-muted-foreground hover:text-foreground hover:bg-muted',
        'transition-colors cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      )}
      title={THEME_LABEL[theme]}
      aria-label={`Switch theme (currently ${THEME_LABEL[theme]})`}
    >
      <span className="material-symbols-outlined text-lg">{THEME_ICON[theme]}</span>
    </button>
  )
}
