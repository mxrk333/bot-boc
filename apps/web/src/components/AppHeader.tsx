/**
 * Top navigation header for the main app layout.
 *
 * Contains:
 * - Sidebar toggle (authenticated users only)
 * - BOC logo + title
 * - Tariff Calculator toggle button
 * - Theme toggle
 * - New chat + UserMenu (authenticated) or Login/Signup buttons (guest)
 */

import { cn } from '@repo/ui/utils'
import { AuthButton } from './AuthButton'
import { ThemeToggle } from './ThemeToggle'
import { UserMenu } from './UserMenu'

interface AppHeaderProps {
  isLoggedIn: boolean
  sidebarOpen: boolean
  calculatorOpen: boolean
  onSidebarOpen: () => void
  onToggleCalculator: () => void
  onNewChat: () => void
}

export function AppHeader({
  isLoggedIn,
  sidebarOpen,
  calculatorOpen,
  onSidebarOpen,
  onToggleCalculator,
  onNewChat,
}: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40">
      <div className="flex items-center gap-3">
        {isLoggedIn && !sidebarOpen && (
          <button
            onClick={onSidebarOpen}
            className="size-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
          >
            <span className="material-symbols-outlined text-xl">menu</span>
          </button>
        )}
        <div className="size-10 rounded-lg flex items-center justify-center shadow-sm bg-white overflow-hidden p-0.5">
          <img src="/boc-icon.png" alt="BOC Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-base font-bold text-foreground hidden sm:block">
          BOC Tariff &amp; Balikbayan Guide
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggleCalculator}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer',
            calculatorOpen
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
          title="Toggle Tariff Calculator"
        >
          <span className="material-symbols-outlined text-base">calculate</span>
          <span className="hidden sm:inline">Tariff Calculator</span>
        </button>

        <ThemeToggle />

        {isLoggedIn ? (
          <>
            <button
              onClick={onNewChat}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="New chat"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span className="hidden sm:inline">New chat</span>
            </button>
            <UserMenu />
          </>
        ) : (
          <>
            <AuthButton variant="login" />
            <AuthButton variant="signup" />
          </>
        )}
      </div>
    </header>
  )
}
