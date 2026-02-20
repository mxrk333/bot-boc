import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './style.css'

import { askVertexAI } from './lib/vertexAI'
import { useAuth } from './hooks/useAuth'
import { useConversations, type ChatMessage } from './hooks/useConversations'
import { AuthButton } from './components/AuthButton'
import { ChatBubble } from './components/ChatBubble'
import { ChatInput } from './components/ChatInput'
import { ConversationSidebar } from './components/ConversationSidebar'
import { QuickChip } from './components/QuickChip'
import { SuggestionCard } from './components/SuggestionCard'
import { UserMenu } from './components/UserMenu'
import { doc, getDoc } from 'firebase/firestore'
import { db } from './lib/firebase'

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
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const WELCOME_MSG =
  'Hello! I am your AI Customs Assistant. I can help you with questions about Balikbayan boxes, tariff rates, OFW exemption privileges, de minimis value rules, and more.\n\nWhat would you like to know today?'

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

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'bot',
  content: WELCOME_MSG,
  timestamp: 'Just now',
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function createId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function timeLabel() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/** Build a short title from the first user message */
function titleFromMessage(text: string) {
  const clean = text.replace(/\n/g, ' ').trim()
  return clean.length > 40 ? clean.slice(0, 40) + '…' : clean
}

/* ------------------------------------------------------------------ */
/*  App                                                                */
/* ------------------------------------------------------------------ */

export function App() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { conversations, createConversation, saveMessages, deleteConversation } = useConversations(
    user?.uid
  )

  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Redirect to onboarding if user hasn't completed it
  useEffect(() => {
    if (!user || authLoading) return
    const checkOnboarding = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid))
        if (!snap.exists() || !snap.data().onboardingComplete) {
          navigate('/onboarding', { replace: true })
        }
      } catch {
        // If Firestore check fails, don't block — let them use the app
      }
    }
    checkOnboarding()
  }, [user, authLoading, navigate])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  /* ---- Load a conversation from Firestore ---- */
  const loadConversation = useCallback(async (convId: string) => {
    try {
      const snap = await getDoc(doc(db, 'conversations', convId))
      if (snap.exists()) {
        const data = snap.data()
        const msgs: Message[] = data.messages || []
        setMessages(msgs.length > 0 ? msgs : [WELCOME_MESSAGE])
        setActiveConvId(convId)
      }
    } catch (err) {
      console.error('Failed to load conversation:', err)
    }
  }, [])

  /* ---- Start a new chat ---- */
  const startNewChat = useCallback(() => {
    setMessages([WELCOME_MESSAGE])
    setActiveConvId(null)
    setQuery('')
  }, [])

  /* ---- Send a message ---- */
  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    // Add user message
    const userMsg: Message = {
      id: createId(),
      role: 'user',
      content: trimmed,
      timestamp: timeLabel(),
    }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setQuery('')
    setLoading(true)

    try {
      const answer = await askVertexAI(trimmed)
      const botMsg: Message = {
        id: createId(),
        role: 'bot',
        content: answer || 'Sorry, I could not generate a response. Please try again.',
        timestamp: timeLabel(),
      }
      const finalMessages = [...newMessages, botMsg]
      setMessages(finalMessages)

      // Persist conversation if user is logged in
      if (user) {
        const chatMsgs: ChatMessage[] = finalMessages
          .filter(m => m.id !== 'welcome')
          .map(m => ({ id: m.id, role: m.role, content: m.content, timestamp: m.timestamp }))

        // Find the first user message for the title
        const firstUserMsg = finalMessages.find(m => m.role === 'user')
        const title = firstUserMsg ? titleFromMessage(firstUserMsg.content) : 'New chat'

        if (activeConvId) {
          // Update existing conversation
          await saveMessages(activeConvId, chatMsgs, title)
        } else {
          // Create new conversation
          const newId = await createConversation(title)
          setActiveConvId(newId)
          await saveMessages(newId, chatMsgs, title)
        }
      }
    } catch (err) {
      const errText = err instanceof Error ? err.message : 'Something went wrong.'
      const errMsg: Message = {
        id: createId(),
        role: 'bot',
        content: `⚠️ ${errText}`,
        timestamp: timeLabel(),
      }
      setMessages(prev => [...prev, errMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteConversation = async (convId: string) => {
    await deleteConversation(convId)
    if (activeConvId === convId) {
      startNewChat()
    }
  }

  const showWelcome = messages.length <= 1
  const isLoggedIn = !!user

  // Show a loading spinner while auth initializes
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
      {/* ---- Conversation Sidebar (logged in only) ---- */}
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

      {/* ---- Main Column ---- */}
      <main className="flex-1 flex flex-col relative min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle (logged in only) */}
            {isLoggedIn && (
              <button
                onClick={() => setSidebarOpen(prev => !prev)}
                className="size-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors cursor-pointer text-muted-foreground hover:text-foreground md:hidden"
                aria-label="Toggle sidebar"
              >
                <span className="material-symbols-outlined text-xl">menu</span>
              </button>
            )}
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
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined filled text-primary-foreground text-base">
                smart_toy
              </span>
            </div>
            <h1 className="text-base font-bold text-foreground hidden sm:block">
              BOC Tariff &amp; Balikbayan Guide
            </h1>
          </div>

          {/* Right side: auth buttons OR user menu */}
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <>
                {/* New chat button */}
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

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto chat-scroll p-4 md:p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Welcome hero (only when there's just the initial message) */}
            {showWelcome && (
              <div className="text-center pt-8 pb-4 px-4">
                <div className="size-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm border border-primary/20">
                  <span className="material-symbols-outlined filled text-3xl">smart_toy</span>
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

            {/* Messages */}
            {messages.map(msg => (
              <ChatBubble key={msg.id} role={msg.role} timestamp={msg.timestamp}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </ChatBubble>
            ))}

            {/* Loading indicator */}
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

            {/* Scroll anchor */}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="border-t border-border bg-gradient-to-t from-background via-background/95 to-background/80 px-4 pb-4 pt-3">
          <div className="max-w-3xl mx-auto space-y-3">
            {/* Quick chips */}
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

            {/* Text input */}
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
    </div>
  )
}
