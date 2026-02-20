import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { cn } from '@repo/ui/utils'
import { useAuth } from '../hooks/useAuth'
import { db } from '../lib/firebase'

/* ------------------------------------------------------------------ */
/*  Types & Constants                                                  */
/* ------------------------------------------------------------------ */

interface OnboardingAnswers {
  senderType: string
  sendFrequency: string
  itemTypes: string[]
  topConcern: string
}

const STEPS = [
  { id: 'verify', label: 'Verify Email' },
  { id: 'about', label: 'About You' },
  { id: 'usage', label: 'Your Needs' },
  { id: 'items', label: 'Items' },
  { id: 'done', label: 'All Set' },
] as const

const SENDER_TYPES = [
  {
    value: 'ofw',
    icon: 'flight',
    label: 'OFW / Overseas Filipino',
    desc: 'I send boxes home from abroad',
  },
  {
    value: 'family',
    icon: 'family_restroom',
    label: 'Family/Relative',
    desc: 'I receive or send on behalf of family',
  },
  {
    value: 'business',
    icon: 'business',
    label: 'Business/Commercial',
    desc: 'I ship commercially to the Philippines',
  },
  {
    value: 'curious',
    icon: 'school',
    label: 'Just Curious',
    desc: 'I want to learn about customs rules',
  },
]

const FREQUENCIES = [
  { value: 'first-time', label: 'First time', icon: '🆕' },
  { value: '1-2-year', label: '1–2 times a year', icon: '📅' },
  { value: '3-5-year', label: '3–5 times a year', icon: '📦' },
  { value: 'monthly', label: 'Monthly or more', icon: '🚀' },
]

const ITEM_TYPES = [
  { value: 'clothing', label: 'Clothing & Textiles', icon: '👕' },
  { value: 'electronics', label: 'Electronics & Gadgets', icon: '📱' },
  { value: 'food', label: 'Food & Groceries', icon: '🥫' },
  { value: 'medicine', label: 'Medicine & Vitamins', icon: '💊' },
  { value: 'household', label: 'Household Items', icon: '🏠' },
  { value: 'toys', label: 'Toys & Gifts', icon: '🎁' },
  { value: 'documents', label: 'Documents & Books', icon: '📄' },
  { value: 'cosmetics', label: 'Cosmetics & Personal Care', icon: '🧴' },
]

const CONCERNS = [
  {
    value: 'taxes',
    icon: 'payments',
    label: 'Tax & Tariff rates',
    desc: 'How much duty will I pay?',
  },
  {
    value: 'restrictions',
    icon: 'block',
    label: 'Restricted items',
    desc: "What can I or can't I send?",
  },
  {
    value: 'exemptions',
    icon: 'verified',
    label: 'OFW Exemptions',
    desc: 'Am I eligible for tax-free?',
  },
  {
    value: 'process',
    icon: 'local_shipping',
    label: 'Shipping process',
    desc: 'How does customs clearance work?',
  },
]

/* ------------------------------------------------------------------ */
/*  Onboarding Component                                               */
/* ------------------------------------------------------------------ */

export function Onboarding() {
  const navigate = useNavigate()
  const { user, sendVerification, refreshUser, logout } = useAuth()
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [verifyMsg, setVerifyMsg] = useState('')
  const [checking, setChecking] = useState(false)
  const [answers, setAnswers] = useState<OnboardingAnswers>({
    senderType: '',
    sendFrequency: '',
    itemTypes: [],
    topConcern: '',
  })

  // If the user already completed onboarding, redirect to home
  useEffect(() => {
    if (!user) return
    const checkOnboarding = async () => {
      const snap = await getDoc(doc(db, 'users', user.uid))
      if (snap.exists() && snap.data().onboardingComplete) {
        navigate('/', { replace: true })
      }
    }
    checkOnboarding()
  }, [user, navigate])

  // If Google user (already verified), skip verification step
  useEffect(() => {
    if (user?.emailVerified && step === 0) {
      setStep(1)
    }
  }, [user?.emailVerified, step])

  // Redirect if not authenticated
  if (!user) {
    navigate('/signup', { replace: true })
    return null
  }

  const currentStepId = STEPS[step]?.id

  /* ---- Verification helpers ---- */
  const handleResend = async () => {
    setBusy(true)
    try {
      await sendVerification()
      setVerifyMsg('Verification email sent! Check your inbox (and spam folder).')
    } catch {
      setVerifyMsg('Could not send email. Please try again in a moment.')
    } finally {
      setBusy(false)
    }
  }

  const handleCheckVerification = async () => {
    setChecking(true)
    try {
      await refreshUser()
      // After refresh, check if verified
      if (user.emailVerified) {
        setStep(1)
      } else {
        setVerifyMsg('Email not verified yet. Please check your inbox and click the link.')
      }
    } catch {
      setVerifyMsg('Could not check status. Please try again.')
    } finally {
      setChecking(false)
    }
  }

  /* ---- Step navigation ---- */
  const canProceed = () => {
    switch (currentStepId) {
      case 'verify':
        return user.emailVerified
      case 'about':
        return !!answers.senderType
      case 'usage':
        return !!answers.sendFrequency
      case 'items':
        return answers.itemTypes.length > 0
      default:
        return true
    }
  }

  const nextStep = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1)
  }

  const prevStep = () => {
    // Don't go back to verification step if already verified
    if (step > 1 || (step === 1 && !user.emailVerified)) {
      setStep(s => s - 1)
    }
  }

  const toggleItem = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      itemTypes: prev.itemTypes.includes(value)
        ? prev.itemTypes.filter(v => v !== value)
        : [...prev.itemTypes, value],
    }))
  }

  /* ---- Finish onboarding ---- */
  const handleFinish = useCallback(async () => {
    if (!user) return
    setBusy(true)
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          displayName: user.displayName || '',
          email: user.email || '',
          onboardingComplete: true,
          onboardingAnswers: answers,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      )
      navigate('/', { replace: true })
    } catch (err) {
      console.error('Failed to save onboarding data:', err)
    } finally {
      setBusy(false)
    }
  }, [user, answers, navigate])

  /* ---- Progress bar ---- */
  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined filled text-primary-foreground text-base">
              smart_toy
            </span>
          </div>
          <span className="text-sm font-semibold text-foreground">Account Setup</span>
        </div>
        <button
          onClick={() => {
            logout()
            navigate('/')
          }}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          Sign out
        </button>
      </header>

      {/* Progress bar */}
      <div className="w-full h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step indicator */}
      <div className="flex justify-center px-4 pt-6 pb-2">
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={cn(
                  'size-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
                  i < step
                    ? 'bg-primary text-primary-foreground'
                    : i === step
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                      : 'bg-muted text-muted-foreground'
                )}
              >
                {i < step ? (
                  <span className="material-symbols-outlined text-sm">check</span>
                ) : (
                  i + 1
                )}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    'w-6 md:w-10 h-0.5 rounded-full transition-colors duration-300',
                    i < step ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 flex items-start justify-center px-4 pt-4 pb-8 overflow-y-auto">
        <div className="w-full max-w-lg">
          {/* ============================================ */}
          {/* STEP 0 — Email Verification                  */}
          {/* ============================================ */}
          {currentStepId === 'verify' && (
            <div className="rounded-2xl border border-border bg-card p-8 shadow-lg space-y-6 text-center">
              <div className="size-16 bg-amber-100 dark:bg-amber-900/20 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <span className="material-symbols-outlined filled text-3xl">mark_email_unread</span>
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-foreground">Verify your email</h2>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  We sent a verification link to{' '}
                  <strong className="text-foreground">{user.email}</strong>. Click the link in the
                  email to activate your account.
                </p>
              </div>

              {verifyMsg && (
                <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 text-sm text-foreground">
                  {verifyMsg}
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleCheckVerification}
                  disabled={checking}
                  className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  {checking ? 'Checking…' : "I've verified my email"}
                </button>
                <button
                  onClick={handleResend}
                  disabled={busy}
                  className="w-full rounded-lg border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {busy ? 'Sending…' : 'Resend verification email'}
                </button>
              </div>

              <p className="text-xs text-muted-foreground">
                Didn't receive it? Check your spam folder or try resending.
              </p>
            </div>
          )}

          {/* ============================================ */}
          {/* STEP 1 — About You (Sender Type)             */}
          {/* ============================================ */}
          {currentStepId === 'about' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="size-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-primary/20">
                  <span className="material-symbols-outlined filled text-2xl">person</span>
                </div>
                <h2 className="text-xl font-bold text-foreground">Tell us about yourself</h2>
                <p className="text-sm text-muted-foreground">
                  Which best describes you? This helps us personalize your experience.
                </p>
              </div>

              <div className="grid gap-3">
                {SENDER_TYPES.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setAnswers(prev => ({ ...prev, senderType: opt.value }))}
                    className={cn(
                      'w-full flex items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200 cursor-pointer',
                      answers.senderType === opt.value
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border bg-card hover:bg-muted/50 hover:border-muted-foreground/20'
                    )}
                  >
                    <div
                      className={cn(
                        'size-10 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                        answers.senderType === opt.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      <span className="material-symbols-outlined text-xl">{opt.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </div>
                    {answers.senderType === opt.value && (
                      <span className="material-symbols-outlined text-primary text-xl shrink-0">
                        check_circle
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* STEP 2 — Send Frequency                      */}
          {/* ============================================ */}
          {currentStepId === 'usage' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="size-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-primary/20">
                  <span className="material-symbols-outlined filled text-2xl">schedule</span>
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  How often do you send or receive?
                </h2>
                <p className="text-sm text-muted-foreground">
                  This helps us tailor the customs information to your needs.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {FREQUENCIES.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setAnswers(prev => ({ ...prev, sendFrequency: opt.value }))}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-xl border p-5 transition-all duration-200 cursor-pointer',
                      answers.sendFrequency === opt.value
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border bg-card hover:bg-muted/50 hover:border-muted-foreground/20'
                    )}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <span className="text-sm font-medium text-foreground text-center">
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Top concern */}
              <div className="space-y-3 pt-2">
                <p className="text-sm font-semibold text-foreground text-center">
                  What's your biggest concern?
                </p>
                <div className="grid gap-2">
                  {CONCERNS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setAnswers(prev => ({ ...prev, topConcern: opt.value }))}
                      className={cn(
                        'w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200 cursor-pointer',
                        answers.topConcern === opt.value
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-border bg-card hover:bg-muted/50'
                      )}
                    >
                      <span
                        className={cn(
                          'material-symbols-outlined text-lg',
                          answers.topConcern === opt.value
                            ? 'text-primary'
                            : 'text-muted-foreground'
                        )}
                      >
                        {opt.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* STEP 3 — Item Types                          */}
          {/* ============================================ */}
          {currentStepId === 'items' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="size-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-primary/20">
                  <span className="material-symbols-outlined filled text-2xl">inventory_2</span>
                </div>
                <h2 className="text-xl font-bold text-foreground">What do you usually send?</h2>
                <p className="text-sm text-muted-foreground">
                  Select all that apply. We'll highlight relevant customs rules for you.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {ITEM_TYPES.map(opt => {
                  const selected = answers.itemTypes.includes(opt.value)
                  return (
                    <button
                      key={opt.value}
                      onClick={() => toggleItem(opt.value)}
                      className={cn(
                        'flex flex-col items-center gap-2 rounded-xl border p-4 transition-all duration-200 cursor-pointer relative',
                        selected
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-border bg-card hover:bg-muted/50 hover:border-muted-foreground/20'
                      )}
                    >
                      {selected && (
                        <span className="absolute top-2 right-2 material-symbols-outlined text-primary text-sm">
                          check_circle
                        </span>
                      )}
                      <span className="text-2xl">{opt.icon}</span>
                      <span className="text-xs font-medium text-foreground text-center">
                        {opt.label}
                      </span>
                    </button>
                  )
                })}
              </div>

              <p className="text-center text-xs text-muted-foreground">
                {answers.itemTypes.length} item{answers.itemTypes.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          )}

          {/* ============================================ */}
          {/* STEP 4 — Done!                               */}
          {/* ============================================ */}
          {currentStepId === 'done' && (
            <div className="rounded-2xl border border-border bg-card p-8 shadow-lg space-y-6 text-center">
              <div className="size-20 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <span className="material-symbols-outlined filled text-4xl">celebration</span>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">You're all set! 🎉</h2>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Your account is verified and your profile is ready. Start chatting with your AI
                  Customs Assistant!
                </p>
              </div>

              {/* Summary */}
              <div className="rounded-xl bg-muted/50 border border-border p-4 text-left space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Your Profile
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Account</p>
                    <p className="font-medium text-foreground">{user.displayName || user.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="font-medium text-foreground">
                      {SENDER_TYPES.find(s => s.value === answers.senderType)?.label || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Frequency</p>
                    <p className="font-medium text-foreground">
                      {FREQUENCIES.find(f => f.value === answers.sendFrequency)?.label || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Items</p>
                    <p className="font-medium text-foreground">
                      {answers.itemTypes.length} type{answers.itemTypes.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleFinish}
                disabled={busy}
                className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {busy ? 'Saving…' : 'Start Chatting →'}
              </button>
            </div>
          )}

          {/* ============================================ */}
          {/* Navigation buttons                           */}
          {/* ============================================ */}
          {currentStepId !== 'verify' && currentStepId !== 'done' && (
            <div className="flex items-center justify-between pt-6">
              <button
                onClick={prevStep}
                disabled={step <= 1}
                className={cn(
                  'flex items-center gap-1 text-sm font-medium transition-colors cursor-pointer',
                  step <= 1
                    ? 'text-muted-foreground/30 cursor-not-allowed'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                Back
              </button>
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-6 py-2.5 text-sm font-semibold transition-all cursor-pointer',
                  canProceed()
                    ? 'bg-primary text-primary-foreground shadow-sm hover:opacity-90 active:scale-[0.97]'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                )}
              >
                Continue
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
