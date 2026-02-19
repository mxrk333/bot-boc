import { cn } from '@repo/ui/utils'

interface ChatBubbleProps {
  /** 'bot' renders left-aligned with bot avatar, 'user' renders right-aligned */
  role: 'bot' | 'user'
  children: React.ReactNode
  timestamp?: string
  className?: string
}

/**
 * A single chat message bubble with avatar and timestamp.
 *
 * Usage:
 *   <ChatBubble role="bot" timestamp="Just now">Hello!</ChatBubble>
 *   <ChatBubble role="user" timestamp="Sent">How are you?</ChatBubble>
 */
export function ChatBubble({ role, children, timestamp, className }: ChatBubbleProps) {
  const isBot = role === 'bot'

  return (
    <div className={cn('flex gap-3 items-start', !isBot && 'justify-end', className)}>
      {/* Bot avatar (left) */}
      {isBot && (
        <div className="size-8 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-md">
          <span className="material-symbols-outlined text-white text-base">smart_toy</span>
        </div>
      )}

      {/* Message body */}
      <div className={cn('flex flex-col', !isBot && 'items-end', 'max-w-2xl')}>
        <div
          className={cn(
            'p-5 text-sm leading-relaxed shadow-sm',
            isBot
              ? 'bg-card border border-border rounded-[20px] rounded-tl-md text-card-foreground'
              : 'bg-primary text-primary-foreground rounded-[20px] rounded-tr-md'
          )}
        >
          {children}
        </div>
        {timestamp && (
          <span className="text-[10px] text-muted-foreground mt-1.5 px-1">
            {timestamp} • {isBot ? 'BOC AI Bot' : 'You'}
          </span>
        )}
      </div>

      {/* User avatar (right) */}
      {!isBot && (
        <div className="size-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-muted-foreground text-base">person</span>
        </div>
      )}
    </div>
  )
}
