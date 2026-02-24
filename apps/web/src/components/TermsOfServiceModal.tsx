import { useState, useEffect } from 'react'
import { cn } from '@repo/ui/utils'

interface TermsOfServiceModalProps {
  open: boolean
  onClose: () => void
  onAccept?: () => void
  requireAcceptance?: boolean
}

export function TermsOfServiceModal({
  open,
  onClose,
  onAccept,
  requireAcceptance = false,
}: TermsOfServiceModalProps) {
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
              <span className="material-symbols-outlined">policy</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight leading-none">
                Terms of Service
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
            Please read these Terms of Service carefully before using the BOC–BOT application. By
            accessing or using our services, you agree to be bound by these terms.
          </p>
          <div className="flex flex-col">
            {/* Section 1 */}
            <details className="group border-b border-border py-2" open>
              <summary className="flex items-center justify-between py-2 cursor-pointer list-none">
                <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                  <span className="text-primary font-bold">1.</span> Overview
                </span>
                <span className="material-symbols-outlined transition-transform group-open:rotate-180 text-primary">
                  expand_more
                </span>
              </summary>
              <div className="pb-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                BOC–BOT provides automated information services subject to the following terms and
                conditions. Our platform utilizes advanced algorithms to deliver real-time data
                processing and interaction capabilities.
              </div>
            </details>
            {/* Section 2 */}
            <details className="group border-b border-border py-2">
              <summary className="flex items-center justify-between py-2 cursor-pointer list-none">
                <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                  <span className="text-primary font-bold">2.</span> Purpose of the Application
                </span>
                <span className="material-symbols-outlined transition-transform group-open:rotate-180 text-primary">
                  expand_more
                </span>
              </summary>
              <div className="pb-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                The primary goal of BOC–BOT is to streamline information retrieval and automate
                routine queries. It is designed as a productivity tool for professional and personal
                use cases.
              </div>
            </details>
            {/* Section 3 */}
            <details className="group border-b border-border py-2">
              <summary className="flex items-center justify-between py-2 cursor-pointer list-none">
                <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                  <span className="text-primary font-bold">3.</span> No Official Advice
                </span>
                <span className="material-symbols-outlined transition-transform group-open:rotate-180 text-primary">
                  expand_more
                </span>
              </summary>
              <div className="pb-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                Information provided by BOC–BOT does not constitute professional, legal, or
                financial advice. All automated responses should be verified through official
                channels.
              </div>
            </details>
            {/* Section 4 */}
            <details className="group border-b border-border py-2">
              <summary className="flex items-center justify-between py-2 cursor-pointer list-none">
                <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                  <span className="text-primary font-bold">4.</span> User Responsibilities
                </span>
                <span className="material-symbols-outlined transition-transform group-open:rotate-180 text-primary">
                  expand_more
                </span>
              </summary>
              <div className="pb-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                Users are responsible for maintaining the confidentiality of their account and for
                all activities that occur under their login credentials. Misuse of the API or
                platform is strictly prohibited.
              </div>
            </details>
            {/* Section 5 */}
            <details className="group border-b border-border py-2">
              <summary className="flex items-center justify-between py-2 cursor-pointer list-none">
                <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                  <span className="text-primary font-bold">5.</span> Intellectual Property
                </span>
                <span className="material-symbols-outlined transition-transform group-open:rotate-180 text-primary">
                  expand_more
                </span>
              </summary>
              <div className="pb-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                All content, algorithms, and logos associated with BOC–BOT are the exclusive
                property of the service provider. Unauthorized duplication or reverse engineering is
                prohibited.
              </div>
            </details>
            {/* Section 6 */}
            <details className="group border-b border-border py-2">
              <summary className="flex items-center justify-between py-2 cursor-pointer list-none">
                <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                  <span className="text-primary font-bold">6.</span> Limitation of Liability
                </span>
                <span className="material-symbols-outlined transition-transform group-open:rotate-180 text-primary">
                  expand_more
                </span>
              </summary>
              <div className="pb-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                BOC–BOT shall not be liable for any indirect, incidental, or consequential damages
                resulting from the use or inability to use the application services.
              </div>
            </details>
            {/* Section 7 */}
            <details className="group border-b border-border py-2">
              <summary className="flex items-center justify-between py-2 cursor-pointer list-none">
                <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                  <span className="text-primary font-bold">7.</span> Modifications
                </span>
                <span className="material-symbols-outlined transition-transform group-open:rotate-180 text-primary">
                  expand_more
                </span>
              </summary>
              <div className="pb-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                We reserve the right to modify these terms at any time. Significant changes will be
                communicated via the application interface or registered email.
              </div>
            </details>
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
                <span className="text-primary font-medium hover:underline">Terms of Service</span>.
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
