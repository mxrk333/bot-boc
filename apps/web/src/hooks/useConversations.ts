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
  Timestamp,
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

  // Listen to the user's conversations in real-time
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

  /** Create a new conversation and return its Firestore doc ID */
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

  /** Save the full messages array to a conversation */
  const saveMessages = useCallback(
    async (conversationId: string, messages: ChatMessage[], title?: string) => {
      if (!uid) return
      const updateData: Record<string, unknown> = {
        messages,
        messageCount: messages.length,
        updatedAt: serverTimestamp(),
      }
      if (title) updateData.title = title
      await updateDoc(doc(db, 'conversations', conversationId), updateData)
    },
    [uid]
  )

  /** Delete a conversation */
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
