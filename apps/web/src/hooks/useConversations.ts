/**
 * Hook for managing chat conversations in Firestore.
 *
 * Subscribes to real-time updates via onSnapshot so the sidebar
 * stays in sync across tabs. Provides CRUD helpers that the chat
 * UI calls when the user sends messages or deletes conversations.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ChatMessage {
  id: string
  role: 'bot' | 'user'
  content: string
  timestamp: string
}

export interface Conversation {
  id: string
  title: string
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
  messageCount: number
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useConversations(uid: string | undefined) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loadingConversations, setLoadingConversations] = useState(true)

  // Real-time listener: fetches this user's conversations ordered by most recent
  useEffect(() => {
    if (!uid) {
      setConversations([])
      setLoadingConversations(false)
      return
    }

    const q = query(
      collection(db, 'conversations'),
      where('uid', '==', uid),
      orderBy('updatedAt', 'desc')
    )

    const unsub = onSnapshot(q, snap => {
      const list: Conversation[] = snap.docs.map(d => {
        const data = d.data()
        return {
          id: d.id,
          title: data.title || 'New chat',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          messageCount: data.messageCount || 0,
        }
      })
      setConversations(list)
      setLoadingConversations(false)
    })

    return unsub
  }, [uid])

  /** Create a new conversation doc and return its Firestore ID */
  const createConversation = useCallback(
    async (title = 'New chat'): Promise<string> => {
      if (!uid) throw new Error('Not authenticated')
      const ref = await addDoc(collection(db, 'conversations'), {
        uid,
        title,
        messages: [],
        messageCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return ref.id
    },
    [uid]
  )

  /** Overwrite the messages array on an existing conversation */
  const saveMessages = useCallback(
    async (conversationId: string, messages: ChatMessage[], title?: string) => {
      if (!uid) return

      const payload: {
        messages: ChatMessage[]
        messageCount: number
        updatedAt: ReturnType<typeof serverTimestamp>
        title?: string
      } = {
        messages,
        messageCount: messages.length,
        updatedAt: serverTimestamp(),
      }
      if (title) payload.title = title

      await updateDoc(doc(db, 'conversations', conversationId), payload)
    },
    [uid]
  )

  /** Permanently remove a conversation */
  const deleteConversation = useCallback(
    async (conversationId: string) => {
      if (!uid) return
      await deleteDoc(doc(db, 'conversations', conversationId))
    },
    [uid]
  )

  return {
    conversations,
    loadingConversations,
    createConversation,
    saveMessages,
    deleteConversation,
  }
}
