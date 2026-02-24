/**
 * Left column — Tariff Calculator with supporting info cards.
 *
 * Controlled by a single `isOpen` prop that drives the
 * slide-in / slide-out animation.  When closed the column
 * collapses to zero width so the chat panel fills the screen.
 */

import { cn } from '@repo/ui/utils'
import { TariffCalculatorInline } from './TariffCalculatorInline'

interface CalculatorSectionProps {
  isOpen: boolean
}

export function CalculatorSection({ isOpen }: CalculatorSectionProps) {
  return (
    <div
      className={cn(
        'transition-all duration-500 ease-in-out z-10 shrink-0',
        isOpen
          ? 'lg:w-[58%] w-full opacity-100 max-h-[2000px] lg:max-h-none transform translate-x-0'
          : 'w-0 opacity-0 max-h-0 lg:max-h-none overflow-hidden m-0 p-0 transform -translate-x-8'
      )}
    >
      <div className="w-full lg:min-w-[600px] space-y-6">
        <TariffCalculatorInline />

        {/* Info cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-card border border-border rounded-xl flex items-start gap-4">
            <div className="bg-amber-100 dark:bg-amber-900/20 text-amber-600 p-2 rounded-lg">
              <span className="material-symbols-outlined">inventory_2</span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">Balikbayan Boxes</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Check the tax-free limits and qualified senders for 2025.
              </p>
            </div>
          </div>

          <div className="p-4 bg-card border border-border rounded-xl flex items-start gap-4">
            <div className="bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 p-2 rounded-lg">
              <span className="material-symbols-outlined">menu_book</span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">Import Guide</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Step-by-step documentation for personal importations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
