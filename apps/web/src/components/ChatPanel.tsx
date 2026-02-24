/**
 * The full right-column chat interface.
 *
 * Includes:
 * - Chat panel header (bot avatar, status, new-chat button)
 * - Scrollable message area with empty state, message bubbles, and
 *   a typing indicator while the bot is responding
 * - Quick-action chips + chat input + disclaimer footer
 *
 * All data and callbacks are passed down from App.tsx; no backend
 * calls originate from this component.
 */

import { useRef, useEffect } from 'react'
import type { Message } from '../types/chat'
import { ChatBubble } from './ChatBubble'
import { ChatEmptyState } from './ChatEmptyState'
import { ChatInput } from './ChatInput'
import { QuickChip } from './QuickChip'

const QUICK_CHIPS = [
  {
    label: '📦 Box Size Limits',
    prompt: 'What are the standard Balikbayan box size and weight limits?',
  },
  {
    label: '🥫 Prohibited Items ',
    prompt: 'What items are prohibited in Balikbayan boxes?',
  },
  {
    label: '📱 Sending Gadgets',
    prompt: 'Are there taxes or limits on sending smartphones and laptops?',
  },
  {
    label: '💰 De Minimis Value',
    prompt: 'How does the ₱10,000 de minimis rule work?',
  },
] as const

interface ChatPanelProps {
  messages: Message[]
  loading: boolean
  query: string
  calculatorOpen: boolean
  onQueryChange: (value: string) => void
  onSend: (text: string, file?: File | null) => void
  onNewChat: () => void
}

export function ChatPanel({
  messages,
  loading,
  query,
  calculatorOpen,
  onQueryChange,
  onSend,
  onNewChat,
}: ChatPanelProps) {
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Keep the chat scrolled to the bottom whenever messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  return (
    <div className="flex flex-col flex-1 w-full h-full min-w-0 bg-card rounded-2xl shadow-sm border border-border overflow-hidden transition-all duration-500 ease-in-out relative z-20">
      {/* Panel header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/30">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 border border-border shadow-sm p-1 overflow-hidden">
              <img src="/bot.png" alt="BOC Assistant" className="w-full h-full object-contain" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-card rounded-full" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground leading-none">BOC Assistant</h3>
            <span className="text-[10px] text-emerald-500 font-semibold uppercase">
              Always Active
            </span>
          </div>
        </div>
        <button
          onClick={onNewChat}
          className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors cursor-pointer"
          title="New conversation"
        >
          <span className="material-symbols-outlined">add_comment</span>
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 chat-scroll cursor-default">
        {messages.length === 0 && <ChatEmptyState onSend={text => onSend(text)} />}

        {messages.map(msg => (
          <ChatBubble
            key={msg.id}
            role={msg.role}
            timestamp={msg.timestamp}
            sources={msg.sources}
            imageUrl={msg.imageUrl}
            compact={calculatorOpen}
          >
            {msg.content}
          </ChatBubble>
        ))}

        {loading && (
          <ChatBubble role="bot" compact={calculatorOpen}>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="inline-flex gap-1">
                <span className="size-1.5 rounded-full bg-current animate-bounce [animation-delay:0ms]" />
                <span className="size-1.5 rounded-full bg-current animate-bounce [animation-delay:150ms]" />
                <span className="size-1.5 rounded-full bg-current animate-bounce [animation-delay:300ms]" />
              </span>
              <span className="text-xs">Thinking…</span>
            </div>
          </ChatBubble>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
          {QUICK_CHIPS.map(c => (
            <QuickChip
              key={c.label}
              label={c.label}
              onClick={() => onSend(c.prompt)}
              disabled={loading}
            />
          ))}
        </div>

        <ChatInput
          value={query}
          onChange={onQueryChange}
          onSend={file => onSend(query, file)}
          disabled={loading}
          placeholder="Ask about tariffs..."
          compact={calculatorOpen}
        />
        <p className="text-[10px] text-center text-muted-foreground mt-2">
          AI can make mistakes. Please verify important calculations.
        </p>
      </div>
    </div>
  )
}
