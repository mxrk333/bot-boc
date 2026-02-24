/**
 * Conversation history sidebar.
 *
 * On mobile it slides in as a drawer (with a dark overlay).
 * On desktop (md+) it sits as a static column on the left.
 * Each row shows the conversation title, message count, and
 * a delete button that appears on hover.
 */

import { useState } from 'react'
import { cn } from '@repo/ui/utils'
import type { Conversation } from '../hooks/useConversations'
import { DeleteConfirmModal } from './DeleteConfirmModal'

/* ------------------------------------------------------------------ */
/*  ConversationItem                                                   */
/* ------------------------------------------------------------------ */

interface ConversationItemProps {
  conv: Conversation
  isActive: boolean
  onSelect: () => void
  onRequestDelete: () => void
}

function ConversationItem({ conv, isActive, onSelect, onRequestDelete }: ConversationItemProps) {
  return (
    <div
      className={cn(
        'group flex items-center gap-2 rounded-lg px-3 py-2.5 cursor-pointer',
        'transition-colors duration-150',
        isActive
          ? 'bg-primary/10 text-foreground'
          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
      )}
      onClick={onSelect}
    >
      <span className="material-symbols-outlined text-sm shrink-0 opacity-60">
        chat_bubble_outline
      </span>
      <span className="flex-1 text-sm truncate">{conv.title}</span>
      <span className="text-[10px] text-muted-foreground shrink-0">{conv.messageCount}</span>

      {/* Delete button — visible on hover */}
      <button
        onClick={e => {
          e.stopPropagation()
          onRequestDelete()
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
  )
}

/* ------------------------------------------------------------------ */
/*  ConversationSidebar                                                */
/* ------------------------------------------------------------------ */

interface ConversationSidebarProps {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  open: boolean
  onClose: () => void
}

export function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  open,
  onClose,
}: ConversationSidebarProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const pendingConv = pendingDeleteId ? conversations.find(c => c.id === pendingDeleteId) : null

  const confirmDelete = () => {
    if (pendingDeleteId) {
      onDelete(pendingDeleteId)
      setPendingDeleteId(null)
    }
  }

  return (
    <>
      {/* Dark overlay behind drawer on mobile */}
      {open && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={onClose} />}

      <aside
        className={cn(
          'fixed md:relative inset-y-0 left-0 z-40',
          'bg-card border-r border-border shrink-0',
          'flex flex-col',
          'transition-all duration-300 ease-in-out overflow-hidden',
          open ? 'w-72 translate-x-0 border-r' : 'w-0 -translate-x-full md:translate-x-0 border-r-0'
        )}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Conversations</h2>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onClose}
              className={cn(
                'size-8 rounded-lg flex items-center justify-center',
                'hover:bg-muted transition-colors cursor-pointer',
                'text-muted-foreground hover:text-foreground'
              )}
              title="Toggle sidebar"
            >
              <span className="material-symbols-outlined text-lg">menu</span>
            </button>
            <button
              onClick={onNew}
              className={cn(
                'size-8 rounded-lg flex items-center justify-center',
                'bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer',
                'text-primary'
              )}
              title="New chat"
            >
              <span className="material-symbols-outlined text-lg">add</span>
            </button>
          </div>
        </div>

        {/* Scrollable conversation list */}
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
              <ConversationItem
                key={conv.id}
                conv={conv}
                isActive={activeId === conv.id}
                onSelect={() => {
                  onSelect(conv.id)
                  // Only auto-close on mobile screens where the sidebar is an overlay
                  if (window.innerWidth < 768) {
                    onClose()
                  }
                }}
                onRequestDelete={() => setPendingDeleteId(conv.id)}
              />
            ))
          )}
        </div>
      </aside>

      {/* Delete confirmation modal */}
      {pendingDeleteId && (
        <DeleteConfirmModal
          heading="Delete Conversation?"
          description={
            pendingConv ? (
              <>
                Are you sure you want to delete &ldquo;
                <span className="font-medium text-foreground">{pendingConv.title}</span>&rdquo;?
                This action cannot be undone.
              </>
            ) : (
              'Are you sure you want to delete this conversation? This action cannot be undone.'
            )
          }
          onConfirm={confirmDelete}
          onCancel={() => setPendingDeleteId(null)}
        />
      )}
    </>
  )
}
