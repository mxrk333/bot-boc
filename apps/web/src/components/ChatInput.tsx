import { useRef, useEffect } from 'react'
import { cn } from '@repo/ui/utils'
import { IconButton } from './IconButton'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

/**
 * Auto-resizing textarea with a send button.
 *
 * Usage:
 *   <ChatInput value={query} onChange={setQuery} onSend={handleSend} />
 */
export function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  placeholder = 'Type your question here…',
  className,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize the textarea to fit content (up to ~4 lines)
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <div className={cn('relative flex items-end gap-2', className)}>
      <div className="relative flex-1">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            'w-full pl-5 pr-14 py-4 rounded-2xl resize-none',
            'bg-card border border-border shadow-lg',
            'text-sm text-foreground placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
            'transition-all duration-150',
            'min-h-[56px]',
            'disabled:opacity-50'
          )}
        />
        <IconButton
          icon="send"
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className={cn(
            'absolute right-2 bottom-2',
            'bg-primary hover:bg-primary/90 text-primary-foreground',
            'shadow-md hover:scale-105 active:scale-95'
          )}
          size="sm"
          aria-label="Send message"
        />
      </div>
    </div>
  )
}
