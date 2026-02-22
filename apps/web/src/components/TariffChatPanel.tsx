import { useState, useRef, useEffect } from 'react'

/* ------------------------------------------------------------------ */
/*  Static demo tariff lookup                                          */
/* ------------------------------------------------------------------ */

interface ChatMsg {
  id: string
  role: 'user' | 'bot'
  content: string
}

const TARIFF_MAP: Record<string, { item: string; rate: number; year: number }> = {
  cocoa: { item: 'Cocoa powder', rate: 7, year: 2025 },
  laptop: { item: 'Laptop', rate: 0, year: 2026 },
  perfume: { item: 'Perfume', rate: 7, year: 2025 },
  smartphone: { item: 'Smartphone', rate: 0, year: 2025 },
  phone: { item: 'Smartphone', rate: 0, year: 2025 },
  suitcase: { item: 'Suitcase', rate: 15, year: 2025 },
  briefcase: { item: 'Suitcase', rate: 15, year: 2025 },
  transmission: { item: 'Transmission Apparatus', rate: 0, year: 2025 },
  vitamin: { item: 'Vitamin C', rate: 1, year: 2025 },
}

function findTariff(q: string) {
  const lower = q.toLowerCase()
  for (const [key, data] of Object.entries(TARIFF_MAP)) {
    if (lower.includes(key)) return data
  }
  return null
}

function extractValue(q: string): number | null {
  const patterns = [
    /₱\s?([\d,]+)/i,
    /php\s?([\d,]+)/i,
    /([\d,]+)\s*(?:php|pesos?)/i,
    /([\d,]+)\s+(?:of|worth)/i,
  ]
  for (const p of patterns) {
    const m = q.match(p)
    if (m) return parseFloat(m[1].replace(/,/g, ''))
  }
  const nums = q.match(/\d[\d,]*/g)
  if (nums) {
    const big = nums.map(n => parseFloat(n.replace(/,/g, ''))).find(v => v >= 100)
    if (big) return big
  }
  return null
}

function buildResponse(query: string): string {
  const tariff = findTariff(query)
  const value = extractValue(query)
  const fmt = (n: number) => '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2 })

  if (tariff && value) {
    const duty = value * (tariff.rate / 100)
    const vat = (value + duty) * 0.12
    const total = duty + vat
    return `${tariff.item} — Declared Value: ${fmt(value)}\n\nTariff Rate: ${tariff.rate}% (MFN ${tariff.year})\nCustoms Duty: ${fmt(duty)}\nVAT (12%): ${fmt(vat)}\nTotal Tax: ${fmt(total)}\n\nComputed using Official Tariff Database`
  }
  if (tariff) {
    return `${tariff.item} has a tariff rate of ${tariff.rate}% (MFN ${tariff.year}).\n\nProvide a declared value and I'll compute the total tax for you.`
  }
  if (value) {
    return `I see a value of ${fmt(value)}, but I need the item type.\n\nAvailable: Cocoa powder, Laptops, Perfumes, Smartphones, Suitcases, Transmission apparatus, Vitamin C`
  }
  return 'Try asking:\n"How much tax for ₱50,000 of laptops?"\n"Duty on ₱10,000 perfume?"\n"Tax for smartphones worth ₱25,000"'
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

let nextId = 100

export function TariffChatPanel() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: '0',
      role: 'bot',
      content:
        'Hello! I\'m the BOC Tariff Bot.\n\nAsk me something like:\n"How much tax for ₱50,000 of laptops?"',
    },
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const send = () => {
    const text = input.trim()
    if (!text || typing) return
    setMessages(prev => [...prev, { id: String(++nextId), role: 'user', content: text }])
    setInput('')
    setTyping(true)
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { id: String(++nextId), role: 'bot', content: buildResponse(text) },
      ])
      setTyping(false)
    }, 700)
  }

  return (
    <div className="tariff-chatpanel">
      {/* Messages */}
      <div className="tariff-chatpanel-messages chat-scroll">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`tariff-msg ${msg.role === 'user' ? 'tariff-msg-user' : 'tariff-msg-bot'}`}
          >
            {msg.role === 'bot' && (
              <div className="tariff-msg-avatar">
                <span className="material-symbols-outlined text-xs text-blue-600">smart_toy</span>
              </div>
            )}
            <div
              className={`tariff-msg-body ${msg.role === 'user' ? 'tariff-msg-body-user' : 'tariff-msg-body-bot'}`}
            >
              {msg.content.split('\n').map((line, i) =>
                line === '' ? (
                  <br key={i} />
                ) : (
                  <p key={i} className="text-[13px] leading-relaxed">
                    {line}
                  </p>
                )
              )}
            </div>
          </div>
        ))}

        {typing && (
          <div className="tariff-msg tariff-msg-bot">
            <div className="tariff-msg-avatar">
              <span className="material-symbols-outlined text-xs text-blue-600">smart_toy</span>
            </div>
            <div className="tariff-msg-body tariff-msg-body-bot">
              <div className="flex items-center gap-1.5 py-1">
                <span className="size-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0ms]" />
                <span className="size-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:150ms]" />
                <span className="size-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="tariff-chatpanel-input">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask about tariffs..."
          className="tariff-chatpanel-textbox"
        />
        <button onClick={send} disabled={!input.trim() || typing} className="tariff-chatpanel-send">
          <span className="material-symbols-outlined text-lg">send</span>
        </button>
      </div>
    </div>
  )
}
