/**
 * Main application screen — two-column layout.
 *
 * Left:  Manual Tariff Calculator (inline, always visible)
 * Right: AI Chat Assistant with conversation sidebar
 *
 * - Anonymous users see the chat UI with login/signup buttons.
 * - Authenticated users get a conversation sidebar, message persistence
 *   in Firestore, and a user menu in the header.
 * - Messages are sent to the Gemini AI Cloud Function via tRPC.
 * - Logging out clears the current session and resets the chat.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import './style.css'
import { trpc } from './lib/trpc'
import { db } from './lib/firebase'
import { useAuth } from './hooks/useAuth'
import { useConversations, type ChatMessage } from './hooks/useConversations'
import { AppFooter } from './components/AppFooter'
import { AppHeader } from './components/AppHeader'
import { CalculatorSection } from './components/CalculatorSection'
import { ChatPanel } from './components/ChatPanel'
import { ConversationSidebar } from './components/ConversationSidebar'
import { LoadingScreen } from './components/LoadingScreen'
import { TermsOfServiceModal } from './components/TermsOfServiceModal'
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal'
import type { Message, Source } from './types/chat'

/* ------------------------------------------------------------------ */
/*  Static content                                                     */
/* ------------------------------------------------------------------ */

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'bot',
  content:
    'Hello! I am your AI Customs Assistant. I can help you with questions about Balikbayan boxes, tariff rates, OFW exemption privileges, de minimis value rules, and more.\n\nWhat would you like to know today?',
  timestamp: 'Just now',
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Compact unique ID for messages (not meant for Firestore doc IDs) */
function createId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

/** Human-readable time like "2:34 PM" */
function timeLabel() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/** Truncate a message to use as a conversation title */
function titleFromMessage(text: string) {
  const clean = text.replace(/\n/g, ' ').trim()
  return clean.length > 40 ? clean.slice(0, 40) + '…' : clean
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function App() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { conversations, createConversation, saveMessages, deleteConversation } = useConversations(
    user?.uid
  )
  const botMutation = trpc.bot.ask.useMutation()

  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const [showTos, setShowTos] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)

  // Redirect to onboarding if the user hasn't finished it yet
  useEffect(() => {
    if (!user || authLoading) return
    const check = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid))
        if (!snap.exists() || !snap.data().onboardingComplete) {
          navigate('/onboarding', { replace: true })
        }
      } catch {
        // Firestore down → don't block the user
      }
    }
    check()
  }, [user, authLoading, navigate])

  // Clear session when logging out (user goes from defined to null)
  const prevUserRef = useRef<typeof user>(undefined)
  useEffect(() => {
    if (prevUserRef.current && !user) {
      // User just logged out — reset everything
      setMessages([WELCOME_MESSAGE])
      setActiveConvId(null)
      setQuery('')
      setSidebarOpen(false)
    }
    prevUserRef.current = user
  }, [user])

  /* ---- Clean up an empty conversation when navigating away from it ---- */
  const cleanupEmptyConversation = useCallback(
    async (convId: string | null) => {
      if (!convId || !user) return
      const conv = conversations.find(c => c.id === convId)
      if (conv && conv.messageCount === 0) {
        try {
          await deleteConversation(convId)
        } catch {
          // silent — best effort cleanup
        }
      }
    },
    [user, conversations, deleteConversation]
  )

  /* ---- Load a saved conversation ---- */
  const loadConversation = useCallback(
    async (convId: string) => {
      // Clean up the current conversation if it's empty before switching
      await cleanupEmptyConversation(activeConvId)

      try {
        const snap = await getDoc(doc(db, 'conversations', convId))
        if (snap.exists()) {
          const msgs: Message[] = snap.data().messages || []
          setMessages(msgs.length > 0 ? msgs : [WELCOME_MESSAGE])
          setActiveConvId(convId)
        }
      } catch (err) {
        console.error('Failed to load conversation:', err)
      }
    },
    [activeConvId, cleanupEmptyConversation]
  )

  /* ---- Create a new chat and immediately show it in the sidebar ---- */
  const startNewChat = useCallback(async () => {
    // If we're already on an empty "New chat", just reset — don't create another
    if (activeConvId) {
      const current = conversations.find(c => c.id === activeConvId)
      if (current && current.messageCount === 0) {
        setMessages([WELCOME_MESSAGE])
        setQuery('')
        return
      }
    }

    setMessages([WELCOME_MESSAGE])
    setQuery('')

    if (user) {
      try {
        const newId = await createConversation('New chat')
        setActiveConvId(newId)
        setSidebarOpen(true)
      } catch (err) {
        console.error('Failed to create new conversation:', err)
        setActiveConvId(null)
      }
    } else {
      setActiveConvId(null)
    }
  }, [user, activeConvId, conversations, createConversation])

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  /* ---- Send a message ---- */
  const send = async (text: string, file?: File | null) => {
    const trimmed = text.trim()
    if ((!trimmed && !file) || loading) return

    setLoading(true)

    // Convert file to base64 first (used for both preview and backend)
    let imageBase64: string | undefined
    let imagePreviewUrl: string | undefined
    if (file) {
      try {
        imageBase64 = await fileToBase64(file)
        imagePreviewUrl = `data:${file.type};base64,${imageBase64}` // for display in chat
      } catch (err) {
        console.error('Failed to convert image to base64:', err)
      }
    }

    const userMsg: Message = {
      id: createId(),
      role: 'user',
      content: trimmed,
      timestamp: timeLabel(),
      imageUrl: imagePreviewUrl,
    }

    const chatHistory = messages
      .filter(m => m.id !== 'welcome')
      .map(m => ({
        role: m.role === 'bot' ? ('model' as const) : ('user' as const),
        text: m.content,
      }))

    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setQuery('')

    try {
      const response = await botMutation.mutateAsync({
        query: trimmed || 'What is this item? What are the customs rules for it?',
        history: chatHistory,
        image: imageBase64,
      })

      console.log('🔍 DEBUG: BOC Bot Response Data:', response)

      const botMsg: Message = {
        id: createId(),
        role: 'bot',
        content: response.answer,
        timestamp: timeLabel(),
        sources: (response as { answer: string; sources?: Source[] }).sources || [],
      }

      const finalMessages = [...newMessages, botMsg]
      setMessages(finalMessages)

      if (user) {
        const chatMsgs: ChatMessage[] = finalMessages
          .filter(m => m.id !== 'welcome')
          .map(m => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: m.timestamp,
            imageUrl: m.imageUrl,
          }))

        const firstUserMsg = finalMessages.find(m => m.role === 'user')
        const title = firstUserMsg ? titleFromMessage(firstUserMsg.content) : 'New chat'

        if (activeConvId) {
          await saveMessages(activeConvId, chatMsgs, title)
        } else {
          const newId = await createConversation(title)
          setActiveConvId(newId)
          await saveMessages(newId, chatMsgs, title)
        }
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'The BOC server is currently unavailable.'
      const errMsg: Message = {
        id: createId(),
        role: 'bot',
        content: `⚠️ Error: ${message}`,
        timestamp: timeLabel(),
      }
      setMessages(prev => [...prev, errMsg])
    } finally {
      setLoading(false)
    }
  }

  /* ---- Delete a conversation ---- */
  const handleDeleteConversation = async (convId: string) => {
    await deleteConversation(convId)
    if (activeConvId === convId) startNewChat()
  }

  const isLoggedIn = !!user

  /* ================================================================ */
  /*  Render                                                          */
  /* ================================================================ */

  if (authLoading) return <LoadingScreen />

  return (
    <div className="flex h-screen w-full">
      {/* ---- Sidebar (authenticated users only) ---- */}
      {isLoggedIn && (
        <ConversationSidebar
          conversations={conversations}
          activeId={activeConvId}
          onSelect={loadConversation}
          onNew={startNewChat}
          onDelete={handleDeleteConversation}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      {/* ---- Main column ---- */}
      <main className="flex-1 flex flex-col relative min-w-0">
        {/* Error overlay */}
        {botMutation.error && (
          <div className="bg-red-600 text-white p-4 text-xs z-50 overflow-auto max-h-40">
            Click the link in your terminal or try to find it here:
            <p className="mt-2 break-all">{botMutation.error.message}</p>
          </div>
        )}

        <AppHeader
          isLoggedIn={isLoggedIn}
          sidebarOpen={sidebarOpen}
          calculatorOpen={calculatorOpen}
          onSidebarOpen={() => setSidebarOpen(true)}
          onToggleCalculator={() => setCalculatorOpen(prev => !prev)}
          onNewChat={startNewChat}
        />

        {/* ---- Two-column content area ---- */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto w-full pb-8">
          <div className="max-w-[1400px] mx-auto w-full px-6 py-6 h-[calc(100vh-140px)] min-h-[700px]">
            <div className="flex flex-col lg:flex-row gap-8 items-start h-full relative">
              {/* Left column — Manual Tariff Calculator */}
              <CalculatorSection isOpen={calculatorOpen} />

              {/* Right column — AI Chat Assistant */}
              <ChatPanel
                messages={messages}
                loading={loading}
                query={query}
                calculatorOpen={calculatorOpen}
                onQueryChange={setQuery}
                onSend={send}
                onNewChat={startNewChat}
              />
            </div>
          </div>
        </div>

        <AppFooter onShowTos={() => setShowTos(true)} onShowPrivacy={() => setShowPrivacy(true)} />
      </main>

      {/* Modals */}
      <TermsOfServiceModal open={showTos} onClose={() => setShowTos(false)} />
      <PrivacyPolicyModal open={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </div>
  )
}
