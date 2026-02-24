/**
 * Bottom footer for the main app layout.
 *
 * Contains the BOC branding, Terms of Service / Privacy Policy
 * links (open as modals), and the Official Portal external link.
 */

interface AppFooterProps {
  onShowTos: () => void
  onShowPrivacy: () => void
}

export function AppFooter({ onShowTos, onShowPrivacy }: AppFooterProps) {
  return (
    <footer className="bg-card border-t border-border py-6">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 opacity-60">
          <span className="material-symbols-outlined text-primary">account_balance</span>
          <span className="text-xs font-semibold uppercase tracking-widest">
            Bureau of Customs Philippines
          </span>
        </div>

        <div className="flex gap-8">
          <button
            className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            onClick={onShowTos}
          >
            Terms of Service
          </button>
          <button
            className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            onClick={onShowPrivacy}
          >
            Privacy Policy
          </button>
          <a
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
            href="https://client.customs.gov.ph/"
          >
            Official Portal
          </a>
        </div>

        <p className="text-xs text-muted-foreground font-medium">
          © 2025 BOC Tariff Calculator. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
