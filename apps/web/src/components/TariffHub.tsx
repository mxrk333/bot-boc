import { useState } from 'react'
import { TariffCalculatorPanel } from './TariffCalculatorPanel'
import { TariffChatPanel } from './TariffChatPanel'

/* ------------------------------------------------------------------ */
/*  Tariff Hub — floating overlay with chat & calculator panels        */
/* ------------------------------------------------------------------ */

type ActivePanel = 'chat' | 'calculator'

export function TariffHub({ onClose }: { onClose: () => void }) {
  const [activePanel, setActivePanel] = useState<ActivePanel>('calculator')

  return (
    <div className="tariff-hub-overlay" onClick={onClose}>
      <div className="tariff-hub-container" onClick={e => e.stopPropagation()}>
        {/* Floating header bar */}
        <div className="tariff-hub-header">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <span className="material-symbols-outlined text-white text-lg">customs</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-white">BOC Tariff Bot & Calculator</h2>
              <p className="text-[11px] text-blue-200/70">
                Bureau of Customs · Official Tariff Database
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="size-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer text-white/60 hover:text-white"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Tab switcher */}
        <div className="tariff-hub-tabs">
          <button
            onClick={() => setActivePanel('chat')}
            className={`tariff-hub-tab ${activePanel === 'chat' ? 'tariff-hub-tab-active' : ''}`}
          >
            <span className="material-symbols-outlined text-lg">smart_toy</span>
            AI Chat Assistant
          </button>
          <button
            onClick={() => setActivePanel('calculator')}
            className={`tariff-hub-tab ${activePanel === 'calculator' ? 'tariff-hub-tab-active' : ''}`}
          >
            <span className="material-symbols-outlined text-lg">calculate</span>
            Tariff Calculator
          </button>
        </div>

        {/* Panel area */}
        <div className="tariff-hub-body">
          <div
            className="tariff-hub-panels"
            style={{ transform: activePanel === 'chat' ? 'translateX(0)' : 'translateX(-50%)' }}
          >
            <div className="tariff-hub-panel-slot">
              <TariffChatPanel />
            </div>
            <div className="tariff-hub-panel-slot">
              <TariffCalculatorPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
