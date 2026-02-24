import { useState, useEffect } from 'react'
import { cn } from '@repo/ui/utils'

interface PrivacyPolicyModalProps {
  open: boolean
  onClose: () => void
  onAccept?: () => void
  requireAcceptance?: boolean
}

export function PrivacyPolicyModal({
  open,
  onClose,
  onAccept,
  requireAcceptance = false,
}: PrivacyPolicyModalProps) {
  const [agreed, setAgreed] = useState(false)

  // Reset agreement state when modal opens
  useEffect(() => {
    if (open) {
      setAgreed(false)
    }
  }, [open])

  // Close on Escape if not required
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open && !requireAcceptance) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, requireAcceptance, onClose])

  if (!open) return null

  const handleAccept = () => {
    if (requireAcceptance && !agreed) return
    if (onAccept) onAccept()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={() => {
          if (!requireAcceptance) onClose()
        }}
      />
      {/* Modal Container */}
      <div className="relative z-10 bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-border animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <header className="flex items-center justify-between px-6 py-5 border-b border-primary/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white">
              <span className="material-symbols-outlined">security</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight leading-none">
                Privacy Policy
              </h2>
              <p className="text-xs font-medium text-primary mt-1">Last Updated: February 2026</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-primary/10 rounded-full transition-colors text-slate-500 dark:text-slate-400 cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        {/* Modal Content - Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar">
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
            Please read our Privacy Policy carefully to understand how we collect, use, and protect
            your personal data in accordance with the Data Privacy Act.
          </p>
          <div className="flex flex-col">
            {/* Section 1 */}
            <details className="group border-b border-border py-2" open>
              <summary className="flex items-center justify-between py-2 cursor-pointer list-none">
                <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                  <span className="text-primary font-bold">1.</span> Data Collection
                </span>
                <span className="material-symbols-outlined transition-transform group-open:rotate-180 text-primary">
                  expand_more
                </span>
              </summary>
              <div className="pb-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                We collect information you provide directly to the bot, including tariff queries,
                item descriptions, and contact details for further inquiries. We may also collect
                metadata related to your interaction session to improve our services.
              </div>
            </details>
            {/* Section 2 */}
            <details className="group border-b border-border py-2">
              <summary className="flex items-center justify-between py-2 cursor-pointer list-none">
                <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                  <span className="text-primary font-bold">2.</span> How We Use Information
                </span>
                <span className="material-symbols-outlined transition-transform group-open:rotate-180 text-primary">
                  expand_more
                </span>
              </summary>
              <div className="pb-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                Your data is used to provide accurate tariff classifications, respond to specific
                customs queries, and analyze trends in trade inquiries to improve the BOC's digital
                services.
              </div>
            </details>
            {/* Section 3 */}
            <details className="group border-b border-border py-2">
              <summary className="flex items-center justify-between py-2 cursor-pointer list-none">
                <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                  <span className="text-primary font-bold">3.</span> Cookies and Tracking
                </span>
                <span className="material-symbols-outlined transition-transform group-open:rotate-180 text-primary">
                  expand_more
                </span>
              </summary>
              <div className="pb-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                We use essential cookies to maintain your chat session. Analytical cookies may be
                used to understand how users interact with the bot interface without identifying
                individuals.
              </div>
            </details>
            {/* Section 4 */}
            <details className="group border-b border-border py-2">
              <summary className="flex items-center justify-between py-2 cursor-pointer list-none">
                <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                  <span className="text-primary font-bold">4.</span> Data Security
                </span>
                <span className="material-symbols-outlined transition-transform group-open:rotate-180 text-primary">
                  expand_more
                </span>
              </summary>
              <div className="pb-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                We implement industry-standard encryption and security protocols to protect your
                data from unauthorized access, alteration, or destruction.
              </div>
            </details>
            {/* Section 5 */}
            <details className="group border-b border-border py-2">
              <summary className="flex items-center justify-between py-2 cursor-pointer list-none">
                <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                  <span className="text-primary font-bold">5.</span> Your Rights
                </span>
                <span className="material-symbols-outlined transition-transform group-open:rotate-180 text-primary">
                  expand_more
                </span>
              </summary>
              <div className="pb-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                You have the right to access, correct, or request deletion of your personal
                information stored in our systems. Please contact our Data Protection Officer for
                such requests.
              </div>
            </details>
            {/* Section 6 */}
            <details className="group border-b border-border py-2">
              <summary className="flex items-center justify-between py-2 cursor-pointer list-none">
                <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                  <span className="text-primary font-bold">6.</span> Data Retention
                </span>
                <span className="material-symbols-outlined transition-transform group-open:rotate-180 text-primary">
                  expand_more
                </span>
              </summary>
              <div className="pb-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                We retain interaction logs for a period of up to 24 months for audit purposes, after
                which they are either deleted or fully anonymized.
              </div>
            </details>
            {/* Section 7 */}
            <details className="group border-b border-border py-2">
              <summary className="flex items-center justify-between py-2 cursor-pointer list-none">
                <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                  <span className="text-primary font-bold">7.</span> Contact Us
                </span>
                <span className="material-symbols-outlined transition-transform group-open:rotate-180 text-primary">
                  expand_more
                </span>
              </summary>
              <div className="pb-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                For any privacy concerns, please contact the BOC Management Information System and
                Technology Group (MISTG) at helpdesk@customs.gov.ph.
              </div>
            </details>
          </div>

          <div className="mt-8 rounded-lg bg-orange-50 dark:bg-orange-900/10 p-5 border border-orange-200/50 dark:border-orange-900/30">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100 mb-2 uppercase tracking-wide">
              <span className="material-symbols-outlined text-amber-500 text-lg">warning</span>
              Important Disclaimer
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              The BOC Tariff Bot provides automated tariff classification suggestions based on the
              Harmonized System. While we strive for accuracy, these responses are for guidance only
              and do not constitute a formal ruling. Final assessment and classification are subject
              to physical inspection and verification by customs officers at the point of entry.
              <br />
              <br />
              <strong>Note:</strong> This project is an independent educational/utility tool and is
              not officially associated with or endorsed by the Bureau of Customs Philippines.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        {requireAcceptance && (
          <footer className="p-6 border-t border-primary/10 flex flex-col gap-4 bg-card">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center mt-0.5">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  className="peer h-5 w-5 rounded border-primary/30 text-primary focus:ring-primary/20 bg-transparent transition-all cursor-pointer"
                />
              </div>
              <span className="text-sm text-slate-700 dark:text-slate-300 select-none">
                I have read and agree to the{' '}
                <span className="text-primary font-medium hover:underline">Privacy Policy</span>.
              </span>
            </label>
            <div className="flex gap-3 mt-2">
              <button
                onClick={handleAccept}
                disabled={requireAcceptance && !agreed}
                className={cn(
                  'flex-1 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 text-sm flex items-center justify-center gap-2 cursor-pointer',
                  requireAcceptance && !agreed && 'opacity-50 cursor-not-allowed'
                )}
              >
                I Understand
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </footer>
        )}
      </div>
    </div>
  )
}
