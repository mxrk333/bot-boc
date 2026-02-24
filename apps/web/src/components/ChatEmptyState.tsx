/**
 * Welcome hero shown in the chat area before any messages exist.
 *
 * Displays the bot icon, a welcome heading, two suggestion cards,
 * and a disclaimer about which items are currently covered.
 */

import { SuggestionCard } from './SuggestionCard'

interface ChatEmptyStateProps {
  onSend: (text: string) => void
}

export function ChatEmptyState({ onSend }: ChatEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-7 my-12 animate-in fade-in zoom-in duration-500 max-w-3xl mx-auto px-4">
      {/* Bot icon */}
      <div className="w-[84px] h-[84px] rounded-[24px] bg-[#f0ecf6] dark:bg-primary/20 flex items-center justify-center p-3 shadow-sm border border-[#e0dbea] dark:border-primary/30 mt-6">
        <img src="/bot.png" alt="BOC Bot" className="w-full h-full object-contain" />
      </div>

      {/* Heading */}
      <div className="space-y-3">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Mabuhay! Welcome to the Guide
        </h2>
        <p className="text-[15px] text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
          Get instant answers about your Balikbayan boxes and Philippines Customs regulations. No
          registration is required to start chatting.
        </p>
      </div>

      {/* Suggestion cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full pt-4 max-w-[600px] mx-auto">
        <SuggestionCard
          icon="inventory_2"
          title="What can I send?"
          subtitle="Check restricted items list"
          iconBg="bg-[#f0f4fd] dark:bg-primary/20 text-primary"
          iconColor="text-inherit"
          onClick={() => onSend('What can I send? Check restricted items list')}
        />
        <SuggestionCard
          icon="payments"
          title="Is it tax-free?"
          subtitle="Rules for Balikbayan boxes"
          iconBg="bg-[#fcfbee] dark:bg-amber-900/40 text-[#b69512] dark:text-amber-400"
          iconColor="text-inherit"
          onClick={() => onSend('Is it tax-free? Rules for Balikbayan boxes')}
        />
      </div>

      {/* Coverage disclaimer */}
      <p className="text-xs text-muted-foreground mt-8 bg-muted/40 px-5 py-2.5 rounded-full border border-border flex items-center gap-2">
        <span className="material-symbols-outlined text-sm">inventory</span>
        <strong>Covered for now:</strong> Shoes, TV, Cocoa Powder, Laptop, Smartphone, Vitamin C,
        Suitcase &amp; Briefcase, and Perfumes.
      </p>
    </div>
  )
}
