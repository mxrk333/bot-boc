import { useState } from 'react'

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

const TRADE_AGREEMENTS = ['MFN', 'ATIGA', 'ACFTA', 'AKFTA', 'AJCEP', 'AIFTA', 'AANZFTA']

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function TariffCalculatorPanel() {
  const [selectedItem, setSelectedItem] = useState(0)
  const [declaredValue, setDeclaredValue] = useState('')
  const [tradeAgreement, setTradeAgreement] = useState('MFN')
  const [result, setResult] = useState<{
    duty: number
    vat: number
    total: number
    rate: number
    item: string
  } | null>(null)

  const currentYear = new Date().getFullYear()

  const calculate = () => {
    const value = parseFloat(declaredValue)
    if (isNaN(value) || value <= 0) return

    const item = TARIFF_ITEMS[selectedItem]
    const duty = value * (item.rate / 100)
    const vat = (value + duty) * 0.12
    const total = duty + vat

    setResult({ duty, vat, total, rate: item.rate, item: item.label })
  }

  const reset = () => {
    setSelectedItem(0)
    setDeclaredValue('')
    setTradeAgreement('MFN')
    setResult(null)
  }

  const fmt = (n: number) => '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2 })

  return (
    <div className="tariff-calc-panel">
      {/* Form fields */}
      <div className="space-y-4">
        {/* Item */}
        <div>
          <label className="tariff-field-label">
            <span className="material-symbols-outlined text-sm">category</span>
            Item
          </label>
          <select
            value={selectedItem}
            onChange={e => {
              setSelectedItem(Number(e.target.value))
              setResult(null)
            }}
            className="tariff-field-select"
          >
            {TARIFF_ITEMS.map((item, i) => (
              <option key={i} value={i}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {/* Declared Value */}
        <div>
          <label className="tariff-field-label">
            <span className="material-symbols-outlined text-sm">payments</span>
            Declared Value (PHP)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
              ₱
            </span>
            <input
              type="number"
              value={declaredValue}
              onChange={e => {
                setDeclaredValue(e.target.value)
                setResult(null)
              }}
              placeholder="e.g. 50000"
              className="tariff-field-input pl-8"
              min="0"
            />
          </div>
        </div>

        {/* Trade Agreement */}
        <div>
          <label className="tariff-field-label">
            <span className="material-symbols-outlined text-sm">handshake</span>
            Trade Agreement
          </label>
          <select
            value={tradeAgreement}
            onChange={e => setTradeAgreement(e.target.value)}
            className="tariff-field-select"
          >
            {TRADE_AGREEMENTS.map(ta => (
              <option key={ta} value={ta}>
                {ta}
              </option>
            ))}
          </select>
        </div>

        {/* Year */}
        <div>
          <label className="tariff-field-label">
            <span className="material-symbols-outlined text-sm">calendar_today</span>
            Year
          </label>
          <div className="tariff-field-input bg-slate-50/80 text-slate-500 flex items-center cursor-default">
            {currentYear}
            <span className="ml-auto text-[11px] text-slate-400">Auto-detected</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-1">
          <button onClick={calculate} className="tariff-calc-btn flex-1">
            <span className="material-symbols-outlined text-lg">calculate</span>
            Calculate
          </button>
          <button onClick={reset} className="tariff-reset-btn">
            <span className="material-symbols-outlined text-lg">refresh</span>
          </button>
        </div>
      </div>

      {/* Result card */}
      {result && (
        <div className="tariff-result mt-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-emerald-400">receipt_long</span>
            <h3 className="font-semibold text-slate-800 text-sm">Tax Computation</h3>
          </div>

          <div className="text-xs text-slate-500 mb-3 bg-blue-50/80 rounded-lg p-2.5 border border-blue-100/60">
            <span className="font-medium text-slate-700">{result.item}</span>
            <span className="mx-1.5 text-slate-300">|</span>
            Rate: {result.rate}%<span className="mx-1.5 text-slate-300">|</span>
            {tradeAgreement}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Declared Value</span>
              <span className="font-medium text-slate-700">{fmt(parseFloat(declaredValue))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">
                Customs Duty <span className="text-xs text-slate-400">({result.rate}%)</span>
              </span>
              <span className="font-medium text-slate-700">{fmt(result.duty)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">
                VAT <span className="text-xs text-slate-400">(12%)</span>
              </span>
              <span className="font-medium text-slate-700">{fmt(result.vat)}</span>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-1" />
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-800">Total Tax</span>
              <span className="text-lg font-bold text-emerald-600">{fmt(result.total)}</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 mt-3 text-center">
            Computed using Official Tariff Database (MFN 2025/2026)
          </p>
        </div>
      )}
    </div>
  )
}
