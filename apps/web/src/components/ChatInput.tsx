/**
 * Chat text input with auto-resize, camera button, and send button.
 *
 * Enter sends the message; Shift+Enter inserts a newline.
 * The textarea grows up to ~4 lines then scrolls internally.
 */

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

const MAX_HEIGHT_PX = 120 // roughly 4 lines

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  placeholder = 'Type your question here…',
  className,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize to fit content (capped at MAX_HEIGHT_PX)
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`
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
            'w-full pl-14 pr-14 py-4 rounded-2xl resize-none',
            'bg-card border border-border shadow-lg',
            'text-sm text-foreground placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
            'transition-all duration-150',
            'min-h-[56px]',
            'disabled:opacity-50'
          )}
        />

        {/* Camera / upload button (left) */}
        <IconButton
          icon="photo_camera"
          onClick={() => alert('Multimodal image upload coming soon!')}
          disabled={disabled}
          className={cn(
            'absolute left-3 bottom-2.5',
            'text-muted-foreground hover:text-foreground hover:bg-muted/50',
            'transition-colors'
          )}
          size="sm"
          aria-label="Upload image"
          title="Take a photo or upload an image"
        />

        {/* Send button (right) */}
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
