/**
 * Chat message bubble.
 *
 * Bot messages render left-aligned with an avatar and support
 * markdown (via react-markdown + remark-gfm).
 * User messages render right-aligned with a person icon.
 */

import { cn } from '@repo/ui/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ChatBubbleProps {
  role: 'bot' | 'user'
  children: React.ReactNode
  timestamp?: string
  className?: string
}

export function ChatBubble({ role, children, timestamp, className }: ChatBubbleProps) {
  const isBot = role === 'bot'

  return (
    <div className={cn('flex gap-3 items-start', !isBot && 'justify-end', className)}>
      {/* Bot avatar */}
      {isBot && (
        <div className="size-12 rounded-xl flex items-center justify-center shrink-0 shadow-md overflow-hidden bg-white p-0.5">
          <img
            src="/bot.png"
            alt="BOC AI bot"
            className="w-full h-full object-cover rounded-[10px] scale-150"
          />
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
          {/* Bot messages: render markdown. User messages: plain text. */}
          {isBot && typeof children === 'string' ? (
            <div className="prose prose-sm max-w-none text-card-foreground break-words">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <span className="block mb-2 last:mb-0">{children}</span>,
                  ul: ({ children }) => (
                    <ul className="list-disc pl-4 mb-2 last:mb-0">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-4 mb-2 last:mb-0">{children}</ol>
                  ),
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  code: ({ children, ...props }) => {
                    // Detect block vs inline code by checking if it spans multiple lines
                    const isBlock =
                      'node' in props &&
                      props.node?.position?.start.line !== props.node?.position?.end.line
                    return isBlock ? (
                      <code
                        className="block bg-muted p-2 rounded text-xs mb-2 overflow-x-auto"
                        {...props}
                      >
                        {children}
                      </code>
                    ) : (
                      <code className="bg-muted px-1.5 py-0.5 rounded text-xs" {...props}>
                        {children}
                      </code>
                    )
                  },
                }}
              >
                {children}
              </ReactMarkdown>
            </div>
          ) : typeof children === 'string' ? (
            <p className="whitespace-pre-wrap">{children}</p>
          ) : (
            children
          )}
        </div>

        {timestamp && (
          <span className="text-[10px] text-muted-foreground mt-1.5 px-1">
            {timestamp} &bull; {isBot ? 'BOC AI Bot' : 'You'}
          </span>
        )}
      </div>

      {/* User avatar */}
      {!isBot && (
        <div className="size-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-muted-foreground text-base">person</span>
        </div>
      )}
    </div>
  )
}
