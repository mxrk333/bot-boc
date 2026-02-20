import { cn } from '@repo/ui/utils'
import type { Conversation } from '../hooks/useConversations'

interface ConversationSidebarProps {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  open: boolean
  onClose: () => void
}

/**
 * ChatGPT-style sidebar showing conversation history.
 * Slides in from the left on mobile, always visible on desktop.
 */
export function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  open,
  onClose,
}: ConversationSidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={onClose} />}

      <aside
        className={cn(
          'fixed md:static inset-y-0 left-0 z-40',
          'w-72 bg-card border-r border-border',
          'flex flex-col',
          'transition-transform duration-300 ease-in-out',
          'md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Conversations</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={onNew}
              className={cn(
                'size-8 rounded-lg flex items-center justify-center',
                'hover:bg-muted transition-colors cursor-pointer',
                'text-muted-foreground hover:text-foreground'
              )}
              title="New chat"
            >
              <span className="material-symbols-outlined text-lg">add</span>
            </button>
            <button
              onClick={onClose}
              className={cn(
                'size-8 rounded-lg flex items-center justify-center md:hidden',
                'hover:bg-muted transition-colors cursor-pointer',
                'text-muted-foreground hover:text-foreground'
              )}
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto chat-scroll p-2 space-y-0.5">
          {conversations.length === 0 ? (
            <div className="text-center py-10 px-4">
              <span className="material-symbols-outlined text-3xl text-muted-foreground/40 mb-2 block">
                forum
              </span>
              <p className="text-xs text-muted-foreground">No conversations yet. Start chatting!</p>
            </div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                className={cn(
                  'group flex items-center gap-2 rounded-lg px-3 py-2.5 cursor-pointer',
                  'transition-colors duration-150',
                  activeId === conv.id
                    ? 'bg-primary/10 text-foreground'
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                )}
                onClick={() => {
                  onSelect(conv.id)
                  onClose()
                }}
              >
                <span className="material-symbols-outlined text-sm shrink-0 opacity-60">
                  chat_bubble_outline
                </span>
                <span className="flex-1 text-sm truncate">{conv.title}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {conv.messageCount}
                </span>
                <button
                  onClick={e => {
                    e.stopPropagation()
                    onDelete(conv.id)
                  }}
                  className={cn(
                    'size-6 rounded flex items-center justify-center shrink-0',
                    'opacity-0 group-hover:opacity-100 transition-opacity',
                    'hover:bg-destructive/10 text-destructive cursor-pointer'
                  )}
                  title="Delete"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  )
}
