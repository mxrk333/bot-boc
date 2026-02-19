import { useState, useRef, useEffect } from 'react'
import './style.css'

import { askVertexAI } from './lib/vertexAI'
import { ChatBubble } from './components/ChatBubble'
import { ChatInput } from './components/ChatInput'
import { QuickChip } from './components/QuickChip'
import { SuggestionCard } from './components/SuggestionCard'

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

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function createId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function timeLabel() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/* ------------------------------------------------------------------ */
/*  App                                                                */
/* ------------------------------------------------------------------ */

export function App() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'bot', content: WELCOME_MSG, timestamp: 'Just now' },
  ])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

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
    setMessages(prev => [...prev, userMsg])
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
      setMessages(prev => [...prev, botMsg])
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

  const showWelcome = messages.length <= 1

  return (
    <div className="flex h-screen w-full">
      {/* ---- Main Column ---- */}
      <main className="flex-1 flex flex-col relative">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined filled text-primary-foreground text-base">
                smart_toy
              </span>
            </div>
            <h1 className="text-base font-bold text-foreground">
              BOC Tariff &amp; Balikbayan Guide
            </h1>
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
                <h2 className="text-xl font-bold mb-2">Mabuhay! Welcome to the Guide</h2>
                <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                  Get instant answers about your Balikbayan boxes and Philippines Customs
                  regulations.
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
