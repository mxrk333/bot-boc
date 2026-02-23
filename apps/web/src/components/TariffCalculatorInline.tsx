/**
 * Inline Tariff Calculator — displayed directly in the left column.
 *
 * Features:
 * - Input validation/restrictions (positive numbers, max value, required fields)
 * - Hardcoded tariff rates for manual computation
 * - Clean, flat design without "box-in-a-box" nesting
 */

import { useState, useCallback } from 'react'

/* ------------------------------------------------------------------ */
/*  Static tariff data                                                 */
/* ------------------------------------------------------------------ */

interface TariffItem {
  label: string
  rate: number
  year: number
}

const TARIFF_ITEMS: TariffItem[] = [
  { label: 'Cocoa powder, containing added sugar or other sweetening matter', rate: 7, year: 2025 },
  { label: 'Laptops including notebooks and subnotebooks', rate: 0, year: 2026 },
  { label: 'Perfumes and toilet waters', rate: 7, year: 2025 },
  { label: 'Smartphones', rate: 0, year: 2025 },
  { label: 'Suit-Case or brief-case (max 56x45x25 cm)', rate: 15, year: 2025 },
  { label: 'Transmission Apparatus', rate: 0, year: 2025 },
  { label: 'Vitamin C and its derivatives', rate: 1, year: 2025 },
]

const TRADE_AGREEMENTS = [
  'MFN (Most Favoured Nation)',
  'ATIGA (ASEAN Goods)',
  'ACFTA (ASEAN-China)',
  'AKFTA (ASEAN-Korea)',
  'AJCEP (ASEAN-Japan)',
  'AIFTA (ASEAN-India)',
  'AANZFTA (ASEAN-AUS-NZ)',
]

const MAX_DECLARED_VALUE = 100_000_000 // 100M PHP limit
const MIN_DECLARED_VALUE = 1 // Minimum 1 PHP

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function TariffCalculatorInline() {
  const [selectedItem, setSelectedItem] = useState(0)
  const [declaredValue, setDeclaredValue] = useState('')
  const [tradeAgreement, setTradeAgreement] = useState(TRADE_AGREEMENTS[0])
  const [error, setError] = useState('')
  const [result, setResult] = useState<{
    duty: number
    vat: number
    total: number
    rate: number
    item: string
  } | null>(null)

  const currentYear = new Date().getFullYear()

  const validateAndSetValue = useCallback((raw: string) => {
    setError('')
    setResult(null)

    // Allow empty (user is clearing)
    if (raw === '') {
      setDeclaredValue('')
      return
    }

    // Block negative signs, 'e', and special chars
    if (raw.includes('-') || raw.includes('e') || raw.includes('E')) {
      return
    }

    const num = parseFloat(raw)

    if (isNaN(num)) {
      return
    }

    if (num > MAX_DECLARED_VALUE) {
      setError(`Maximum declared value is ₱${MAX_DECLARED_VALUE.toLocaleString()}`)
      return
    }

    // Allow the raw string so user can type decimals freely
    setDeclaredValue(raw)
  }, [])

  const calculate = useCallback(() => {
    setError('')

    if (!declaredValue) {
      setError('Please enter a declared value.')
      return
    }

    const value = parseFloat(declaredValue)

    if (isNaN(value)) {
      setError('Please enter a valid number.')
      return
    }

    if (value < MIN_DECLARED_VALUE) {
      setError(`Minimum declared value is ₱${MIN_DECLARED_VALUE}.`)
      return
    }

    if (value > MAX_DECLARED_VALUE) {
      setError(`Maximum declared value is ₱${MAX_DECLARED_VALUE.toLocaleString()}.`)
      return
    }

    const item = TARIFF_ITEMS[selectedItem]
    const duty = value * (item.rate / 100)
    const vat = (value + duty) * 0.12
    const total = duty + vat

    setResult({ duty, vat, total, rate: item.rate, item: item.label })
  }, [declaredValue, selectedItem])

  const reset = useCallback(() => {
    setSelectedItem(0)
    setDeclaredValue('')
    setTradeAgreement(TRADE_AGREEMENTS[0])
    setResult(null)
    setError('')
  }, [])

  const fmt = (n: number) => '₱ ' + n.toLocaleString('en-PH', { minimumFractionDigits: 2 })

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">calculate</span>
          Manual Tariff Calculator
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Official 2025 Tariff Rates for precision assessment.
        </p>
      </div>

      {/* Form fields */}
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Item select */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Select Item
            </label>
            <div className="relative">
              <select
                value={selectedItem}
                onChange={e => {
                  setSelectedItem(Number(e.target.value))
                  setResult(null)
                  setError('')
                }}
                className="w-full pl-4 pr-10 py-3 bg-secondary/30 border border-border rounded-lg text-sm focus:ring-primary focus:border-primary appearance-none text-foreground"
              >
                {TARIFF_ITEMS.map((item, i) => (
                  <option key={i} value={i}>
                    {item.label}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-3 text-muted-foreground pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          {/* Declared value */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Declared Value (PHP)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-muted-foreground text-sm font-medium">
                ₱
              </span>
              <input
                type="number"
                value={declaredValue}
                onChange={e => validateAndSetValue(e.target.value)}
                onKeyDown={e => {
                  // Block e, E, -, + characters at keyboard level
                  if (['e', 'E', '-', '+'].includes(e.key)) {
                    e.preventDefault()
                  }
                }}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 bg-secondary/30 border border-border rounded-lg text-sm focus:ring-primary focus:border-primary text-foreground"
                min="0"
                max={MAX_DECLARED_VALUE}
                step="0.01"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Trade agreement */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Trade Agreement
            </label>
            <div className="relative">
              <select
                value={tradeAgreement}
                onChange={e => setTradeAgreement(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-secondary/30 border border-border rounded-lg text-sm focus:ring-primary focus:border-primary appearance-none text-foreground"
              >
                {TRADE_AGREEMENTS.map(ta => (
                  <option key={ta} value={ta}>
                    {ta}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-3 text-muted-foreground pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          {/* Year (auto) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Year
            </label>
            <input
              type="text"
              value={currentYear}
              disabled
              className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-lg text-sm text-muted-foreground cursor-not-allowed"
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <span className="material-symbols-outlined text-destructive text-sm">error</span>
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Calculate button */}
        <button
          onClick={calculate}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-lg transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Calculate Fees</span>
          <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
        </button>

        {/* Result card */}
        {result && (
          <div className="mt-2 bg-primary/5 border border-primary/20 rounded-xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">receipt_long</span>
              Estimated Breakdown
            </h3>

            <div className="text-xs text-muted-foreground mb-3 bg-secondary/50 rounded-lg p-2.5 border border-border">
              <span className="font-medium text-foreground">{result.item}</span>
              <span className="mx-1.5 text-border">|</span>
              Rate: {result.rate}%<span className="mx-1.5 text-border">|</span>
              {tradeAgreement.split(' ')[0]}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Customs Duty</span>
                <span className="text-sm font-semibold text-foreground">{fmt(result.duty)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">VAT (12%)</span>
                <span className="text-sm font-semibold text-foreground">{fmt(result.vat)}</span>
              </div>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between items-center pt-1">
                <span className="text-base font-bold text-foreground">Total Tax Payable</span>
                <span className="text-xl font-black text-primary">{fmt(result.total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Reset */}
        {(result || declaredValue) && (
          <button
            onClick={reset}
            className="w-full text-sm text-muted-foreground hover:text-foreground py-2 flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            Reset Calculator
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 bg-secondary/30 border-t border-border flex items-center justify-center gap-2">
        <span className="material-symbols-outlined text-[16px] text-muted-foreground">
          verified
        </span>
        <p className="text-[11px] text-muted-foreground uppercase tracking-tighter">
          Computed using Official Tariff Database (MFN 2025)
        </p>
      </div>
    </div>
  )
}
