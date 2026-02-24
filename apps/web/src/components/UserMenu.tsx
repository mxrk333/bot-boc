/**
 * User avatar + dropdown menu (header, top-right).
 *
 * Shows the user's photo or initials. Clicking opens a dropdown
 * with their name, email, appearance toggle, and a logout button.
 * Closes on outside click.
 */

import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@repo/ui/utils'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'

export function UserMenu() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside of it
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  if (!user) return null

  // Build initials from display name or email (e.g. "Juan Dela Cruz" → "JD")
  const initials = (user.displayName || user.email || '?')
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase())
    .join('')

  const handleLogout = async () => {
    setOpen(false)
    await logout()
    navigate('/')
  }

  const themeOptions = [
    { value: 'light' as const, icon: 'light_mode', label: 'Light' },
    { value: 'dark' as const, icon: 'dark_mode', label: 'Dark' },
    { value: 'system' as const, icon: 'desktop_windows', label: 'System' },
  ]

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar trigger */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className={cn(
          'size-9 rounded-full flex items-center justify-center',
          'text-xs font-bold cursor-pointer',
          'transition-all duration-150 ring-2 ring-transparent hover:ring-primary/30',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          user.photoURL ? 'bg-transparent' : 'bg-primary text-primary-foreground shadow-sm'
        )}
        aria-label="User menu"
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="" className="size-9 rounded-full object-cover" />
        ) : (
          initials
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-12 w-72 rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* User info */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold text-foreground truncate">
              {user.displayName || 'User'}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>

          {/* Appearance section */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Appearance
            </p>
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
              {themeOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer',
                    theme === opt.value
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span className="material-symbols-outlined text-sm">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Logout */}
          <div className="p-1.5">
            <button
              onClick={handleLogout}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm',
                'text-destructive hover:bg-destructive/10 transition-colors cursor-pointer'
              )}
            >
              <span className="material-symbols-outlined text-base">logout</span>
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
