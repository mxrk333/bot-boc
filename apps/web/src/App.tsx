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
import { cn } from '@repo/ui/utils'
import './style.css'
import { trpc } from './lib/trpc' // or wherever it's pointing // Adjust path if needed
import { db } from './lib/firebase'
import { useAuth } from './hooks/useAuth'
import { useConversations, type ChatMessage } from './hooks/useConversations'
import { AuthButton } from './components/AuthButton'
import { ChatBubble } from './components/ChatBubble'
import { ChatInput } from './components/ChatInput'
import { ConversationSidebar } from './components/ConversationSidebar'
import { QuickChip } from './components/QuickChip'
import { UserMenu } from './components/UserMenu'
import { TariffCalculatorInline } from './components/TariffCalculatorInline'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Source {
  name: string
  url: string
}

interface Message {
  id: string
  role: 'bot' | 'user'
  content: string
  timestamp: string
  sources?: Source[]
  imageUrl?: string
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

const QUICK_CHIPS = [
  {
    label: '📦 Box Size Limits',
    prompt: 'What are the standard Balikbayan box size and weight limits?',
  },
  {
    label: '🥫 Prohibited Items ',
    prompt: 'What items are prohibited in Balikbayan boxes?',
  },
  {
    label: '📱 Sending Gadgets',
    prompt: 'Are there taxes or limits on sending smartphones and laptops?',
  },
  {
    label: '💰 De Minimis Value',
    prompt: 'How does the ₱10,000 de minimis rule work?',
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
  const botMutation = trpc.bot.ask.useMutation()

  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [calculatorOpen, setCalculatorOpen] = useState(false)
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
        {/* Error overlay */}
        {botMutation.error && (
          <div className="bg-red-600 text-white p-4 text-xs z-50 overflow-auto max-h-40">
            Click the link in your terminal or try to find it here:
            <p className="mt-2 break-all">{botMutation.error.message}</p>
          </div>
        )}

        {/* Header */}
        <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-3">
            {isLoggedIn && !sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="size-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <span className="material-symbols-outlined text-xl">menu</span>
              </button>
            )}
            <div className="size-10 rounded-lg flex items-center justify-center shadow-sm bg-white overflow-hidden p-0.5">
              <img src="/boc-icon.png" alt="BOC Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-base font-bold text-foreground hidden sm:block">
              BOC Tariff &amp; Balikbayan Guide
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCalculatorOpen(prev => !prev)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer',
                calculatorOpen
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
              title="Toggle Tariff Calculator"
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

        {/* ---- Two-column content area ---- */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto w-full">
          <div className="max-w-7xl mx-auto w-full px-4 py-8 h-full">
            <div className="flex flex-col lg:flex-row gap-8 items-start h-full relative">
              {/* Left column — Manual Tariff Calculator */}
              <div
                className={cn(
                  'transition-all duration-500 ease-in-out z-10 shrink-0',
                  calculatorOpen
                    ? 'lg:w-[58%] w-full opacity-100 max-h-[2000px] lg:max-h-none transform translate-x-0'
                    : 'w-0 opacity-0 max-h-0 lg:max-h-none overflow-hidden m-0 p-0 transform -translate-x-8'
                )}
              >
                <div className="w-full lg:min-w-[600px] space-y-6">
                  <TariffCalculatorInline />

                  {/* Info cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-card border border-border rounded-xl flex items-start gap-4">
                      <div className="bg-amber-100 dark:bg-amber-900/20 text-amber-600 p-2 rounded-lg">
                        <span className="material-symbols-outlined">inventory_2</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground">Balikbayan Boxes</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Check the tax-free limits and qualified senders for 2025.
                        </p>
                      </div>
                    </div>
                    <div className="p-4 bg-card border border-border rounded-xl flex items-start gap-4">
                      <div className="bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 p-2 rounded-lg">
                        <span className="material-symbols-outlined">menu_book</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground">Import Guide</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Step-by-step documentation for personal importations.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right column — AI Chat Assistant */}
              <div
                className={cn(
                  'flex flex-col flex-1 min-w-0 h-[700px] bg-card rounded-xl shadow-sm border border-border overflow-hidden transition-all duration-500 ease-in-out relative z-20'
                )}
              >
                {/* Chat Header */}
                <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 border-2 border-primary/20 p-0.5 overflow-hidden">
                        <img
                          src="/bot.png"
                          alt="BOC Assistant"
                          className="w-full h-full object-cover rounded-[10px] scale-150"
                        />
                      </div>
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-card rounded-full" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground leading-none">
                        BOC Assistant
                      </h3>
                      <span className="text-[10px] text-emerald-500 font-semibold uppercase">
                        Always Active
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={startNewChat}
                    className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors cursor-pointer"
                    title="New conversation"
                  >
                    <span className="material-symbols-outlined">add_comment</span>
                  </button>
                </div>

                {/* Chat Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-scroll">
                  {messages.map(msg => (
                    <ChatBubble
                      key={msg.id}
                      role={msg.role}
                      timestamp={msg.timestamp}
                      sources={msg.sources}
                      imageUrl={msg.imageUrl}
                      compact={calculatorOpen}
                    >
                      {msg.content}
                    </ChatBubble>
                  ))}

                  {loading && (
                    <ChatBubble role="bot" compact={calculatorOpen}>
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

                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-border bg-card">
                  {/* Quick-action chips */}
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
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
                    onSend={file => send(query, file)}
                    disabled={loading}
                    placeholder="Ask about tariffs..."
                    compact={calculatorOpen}
                  />
                  <p className="text-[10px] text-center text-muted-foreground mt-2">
                    AI can make mistakes. Please verify important calculations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-card border-t border-border py-6">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 opacity-60">
              <span className="material-symbols-outlined text-primary">account_balance</span>
              <span className="text-xs font-semibold uppercase tracking-widest">
                Bureau of Customs Philippines
              </span>
            </div>
            <div className="flex gap-8">
              <a
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
                href="#"
              >
                Terms of Service
              </a>
              <a
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
                href="#"
              >
                Privacy Policy
              </a>
              <a
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
                href="https://client.customs.gov.ph/"
              >
                Official Portal
              </a>
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              © 2025 BOC Tariff Calculator. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </div>
  )
}
