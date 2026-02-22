/**
 * Main chat screen.
 *
 * Layout: optional sidebar (left) + header / messages / input (right).
 *
 * - Anonymous users see the chat UI with login/signup buttons.
 * - Authenticated users get a conversation sidebar, message persistence
 *   in Firestore, and a user menu in the header.
 * - Messages are sent to the Gemini AI Cloud Function via askVertexAI().
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import './style.css'
import { trpc } from './lib/trpc'; // or wherever it's pointing // Adjust path if needed
import { askVertexAI } from './lib/vertexAI'
import { db } from './lib/firebase'
import { useAuth } from './hooks/useAuth'
import { useConversations, type ChatMessage } from './hooks/useConversations'
import { AuthButton } from './components/AuthButton'
import { ChatBubble } from './components/ChatBubble'
import { ChatInput } from './components/ChatInput'
import { ConversationSidebar } from './components/ConversationSidebar'
import { QuickChip } from './components/QuickChip'
import { SuggestionCard } from './components/SuggestionCard'
import { UserMenu } from './components/UserMenu'
import { TariffHub } from './components/TariffHub'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Message {
  id: string
  role: 'bot' | 'user'
  content: string
  timestamp: string
}

/* ------------------------------------------------------------------ */
/*  Static content                                                     */
/* ------------------------------------------------------------------ */

const WELCOME_MSG =
  'Hello! I am your AI Customs Assistant. I can help you with questions about Balikbayan boxes, tariff rates, OFW exemption privileges, de minimis value rules, and more.\n\nWhat would you like to know today?'

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'bot',
  content: WELCOME_MSG,
  timestamp: 'Just now',
}

const SUGGESTIONS = [
  {
    icon: 'inventory_2',
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-primary',
    title: 'What can I send?',
    subtitle: 'Check restricted items list',
    prompt: 'What items are restricted from Balikbayan boxes?',
  },
  {
    icon: 'payments',
    iconBg: 'bg-amber-50 dark:bg-amber-900/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
    title: 'Is it tax-free?',
    subtitle: 'Rules for Balikbayan boxes',
    prompt: 'Are Balikbayan boxes tax-free? What are the exemption rules?',
  },
] as const

const QUICK_CHIPS = [
  {
    label: '📦 Box Size Limits',
    prompt: 'What are the standard Balikbayan box size and weight limits?',
  },
  {
    label: '🥫 Prohibited Food Items',
    prompt: 'What food items are prohibited in Balikbayan boxes?',
  },
  {
    label: '📱 Sending Gadgets',
    prompt: 'Can I send gadgets like a laptop or phone in a Balikbayan box? Are there taxes?',
  },
  {
    label: '✈️ Commercial Shipments',
    prompt: 'What are the rules for commercial shipments to the Philippines?',
  },
] as const

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
  // 👈 ADD THIS LINE HERE:
  const botMutation = trpc.bot.ask.useMutation()

  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [tariffHubOpen, setTariffHubOpen] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

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

  // Keep the chat scrolled to the bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  /* ---- Load a saved conversation ---- */
  const loadConversation = useCallback(async (convId: string) => {
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
  }, [])

  /* ---- Reset to a blank chat ---- */
  const startNewChat = useCallback(() => {
    setMessages([WELCOME_MESSAGE])
    setActiveConvId(null)
    setQuery('')
  }, [])


  /* --- FIND YOUR SEND FUNCTION AND REPLACE IT WITH THIS --- */

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    // 1. Create User Message
    const userMsg: Message = {
      id: createId(),
      role: 'user',
      content: trimmed,
      timestamp: timeLabel(),
    }

    // 2. Prepare History for the Backend (Mapping our local Message type to the Backend expected type)
    const chatHistory = messages
      .filter(m => m.id !== 'welcome') // Don't send the welcome text as history
      .map(m => ({
        role: m.role === 'bot' ? ('model' as const) : ('user' as const),
        text: m.content,
      }))

    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setQuery('')
    setLoading(true)

    try {
      // 3. CALL YOUR NEW RAG BACKEND (Using tRPC instead of askVertexAI)
      const response = await botMutation.mutateAsync({
        query: trimmed,
        history: chatHistory,
      })
      console.log('🔍 DEBUG: BOC Bot Response Data:', response)

      const botMsg: Message = {
        id: createId(),
        role: 'bot',
        content: response.answer,
        timestamp: timeLabel(),
      }

      const finalMessages = [...newMessages, botMsg]
      setMessages(finalMessages)

      // 4. PERSIST TO FIRESTORE (Keep your partner's existing logic)
      if (user) {
        const chatMsgs: ChatMessage[] = finalMessages
          .filter(m => m.id !== 'welcome')
          .map(m => ({ id: m.id, role: m.role, content: m.content, timestamp: m.timestamp }))

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
    } catch (err: any) {
      const errMsg: Message = {
        id: createId(),
        role: 'bot',
        content: `⚠️ Error: ${err.message || 'The BOC server is currently unavailable.'}`,
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

  const showWelcome = messages.length <= 1
  const isLoggedIn = !!user

  /* ================================================================ */
  /*  Render                                                          */
  /* ================================================================ */

  // Full-screen spinner while Firebase Auth initialises
  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    )
  }

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
        {/* 👈 ADD THIS ERROR OVERLAY HERE */}
        {botMutation.error && (
          <div className="bg-red-600 text-white p-4 text-xs z-50 overflow-auto max-h-40">
            Click the link in your terminal or try to find it here:
            <p className="mt-2 break-all">{botMutation.error.message}</p>
          </div>
        )}

        {/* Header */}
        <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle — mobile */}
            {isLoggedIn && (
              <button
                onClick={() => setSidebarOpen(prev => !prev)}
                className="size-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors cursor-pointer text-muted-foreground hover:text-foreground md:hidden"
                aria-label="Toggle sidebar"
              >
                <span className="material-symbols-outlined text-xl">menu</span>
              </button>
            )}
            {/* Sidebar toggle — desktop */}
            {isLoggedIn && (
              <button
                onClick={() => setSidebarOpen(prev => !prev)}
                className="hidden md:flex size-8 rounded-lg items-center justify-center hover:bg-muted transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
                aria-label="Toggle sidebar"
              >
                <span className="material-symbols-outlined text-xl">
                  {sidebarOpen ? 'side_navigation' : 'menu'}
                </span>
              </button>
            )}
            <div className="size-10 rounded-lg flex items-center justify-center shadow-sm bg-white overflow-hidden p-0.5">
              <img src="/boc-icon.png" alt="BOC Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-base font-bold text-foreground hidden sm:block">
              BOC Tariff &amp; Balikbayan Guide
            </h1>
          </div>

          {/* Right side: tariff calculator + auth buttons or user menu */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTariffHubOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
              title="Tariff Calculator"
            >
              <span className="material-symbols-outlined text-base">calculate</span>
              <span className="hidden sm:inline">Tariff Calculator</span>
            </button>

            {isLoggedIn ? (
              <>
                <button
                  onClick={startNewChat}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  title="New chat"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  <span className="hidden sm:inline">New chat</span>
                </button>
                <UserMenu />
              </>
            ) : (
              <>
                <AuthButton variant="login" />
                <AuthButton variant="signup" />
              </>
            )}
          </div>
        </header>

        {/* ---- Chat messages area ---- */}
        <div className="flex-1 overflow-y-auto chat-scroll p-4 md:p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Welcome hero (shown only before the first real message) */}
            {showWelcome && (
              <div className="text-center pt-8 pb-4 px-4">
                <div className="size-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm border border-primary/20 overflow-hidden p-1">
                  <img
                    src="/boc-icon.png"
                    alt="BOC Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h2 className="text-xl font-bold mb-2">
                  {isLoggedIn
                    ? `Welcome back, ${user.displayName?.split(' ')[0] || 'there'}!`
                    : 'Mabuhay! Welcome to the Guide'}
                </h2>
                <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                  {isLoggedIn
                    ? 'Your conversations are being saved. Pick up where you left off, or start a new chat.'
                    : 'Get instant answers about your Balikbayan boxes and Philippines Customs regulations.'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                  {SUGGESTIONS.map(s => (
                    <SuggestionCard
                      key={s.title}
                      icon={s.icon}
                      iconBg={s.iconBg}
                      iconColor={s.iconColor}
                      title={s.title}
                      subtitle={s.subtitle}
                      onClick={() => send(s.prompt)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Message bubbles */}
            {messages.map(msg => (
              <ChatBubble key={msg.id} role={msg.role} timestamp={msg.timestamp}>
                {msg.content}
              </ChatBubble>
            ))}

            {/* Typing indicator while waiting for AI */}
            {loading && (
              <ChatBubble role="bot">
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

            {/* Invisible anchor element for auto-scroll */}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* ---- Input area (pinned to bottom) ---- */}
        <div className="border-t border-border bg-gradient-to-t from-background via-background/95 to-background/80 px-4 pb-4 pt-3">
          <div className="max-w-3xl mx-auto space-y-3">
            {/* Quick-action chips */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {QUICK_CHIPS.map(c => (
                <QuickChip
                  key={c.label}
                  label={c.label}
                  onClick={() => send(c.prompt)}
                  disabled={loading}
                />
              ))}
            </div>

            <ChatInput
              value={query}
              onChange={setQuery}
              onSend={() => send(query)}
              disabled={loading}
              placeholder="Type your question about customs here…"
            />

            <p className="text-center text-[10px] text-muted-foreground">
              AI information is for guidance only. Consult official BOC rulings for final decisions.
            </p>
          </div>
        </div>
      </main>

      {/* Tariff Hub overlay */}
      {tariffHubOpen && <TariffHub onClose={() => setTariffHubOpen(false)} />}
    </div>
  )
}
