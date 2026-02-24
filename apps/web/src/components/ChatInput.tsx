/**
 * Chat text input with auto-resize, camera button, and send button.
 *
 * Enter sends the message; Shift+Enter inserts a newline.
 * The textarea grows up to ~4 lines then scrolls internally.
 *
 * Supports a `compact` prop for the inline chat panel (slimmer padding).
 */

import { useRef, useEffect, useState } from 'react'
import { cn } from '@repo/ui/utils'
import { IconButton } from './IconButton'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: (file?: File | null) => void
  disabled?: boolean
  placeholder?: string
  compact?: boolean
  className?: string
}

const MAX_HEIGHT_PX = 120 // roughly 4 lines

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  placeholder = 'Type your question here…',
  compact = false,
  className,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [showMenu, setShowMenu] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [attachedImage, setAttachedImage] = useState<string | null>(null)
  const [attachedFile, setAttachedFile] = useState<File | null>(null)

  useEffect(() => {
    if (!value) {
      setAttachedImage(null)
      setAttachedFile(null)
    }
  }, [value])

  useEffect(() => {
    if (showWarning && countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
      return () => clearTimeout(timer)
    } else if (showWarning && countdown === 0) {
      setShowWarning(false)
    }
  }, [showWarning, countdown])

  // Camera stream management
  useEffect(() => {
    let stream: MediaStream | null = null
    if (showCamera) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' } })
        .then(s => {
          stream = s
          if (videoRef.current) {
            videoRef.current.srcObject = s
            videoRef.current.play()
          }
        })
        .catch(err => {
          console.error('Error accessing camera:', err)
          alert('Could not access camera. Please check permissions.')
          setShowCamera(false)
        })
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [showCamera])

  const handleMenuClick = (type: 'file' | 'camera') => {
    setShowMenu(false)

    if (type === 'camera') {
      setShowCamera(true)
      return
    }

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = e => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        setAttachedFile(file)
        const reader = new FileReader()
        reader.onload = ev => {
          setAttachedImage(ev.target?.result as string)
        }
        reader.readAsDataURL(file)

        const textToPaste = `[Attached: ${file.name}]`
        const newValue = value ? `${value}\n${textToPaste}` : textToPaste
        onChange(newValue)
      }
    }
    input.click()
  }

  // Auto-resize to fit content (capped at MAX_HEIGHT_PX)
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`
  }, [value])

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)

      canvas.toBlob(
        blob => {
          if (blob) {
            const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' })
            setAttachedFile(file)
            const reader = new FileReader()
            reader.onload = ev => {
              setAttachedImage(ev.target?.result as string)
            }
            reader.readAsDataURL(blob)

            const textToPaste = `[Attached: ${file.name}]`
            const newValue = value ? `${value}\n${textToPaste}` : textToPaste
            onChange(newValue)
          }
          setShowCamera(false)
        },
        'image/jpeg',
        0.8
      )
    }
  }

  const doSend = () => {
    onSend(attachedFile)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      doSend()
    }
  }

  return (
    <div className={cn('flex flex-col gap-2 w-full', className)}>
      <div className={cn('relative flex items-center gap-2')}>
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => {
              if (!showMenu) {
                setShowWarning(true)
                setCountdown(5)
              }
              setShowMenu(prev => !prev)
            }}
            disabled={disabled}
            className={cn(
              'flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary hover:border-primary/30 transition-all shrink-0 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed',
              compact ? 'size-10 rounded-xl' : 'size-12 rounded-2xl'
            )}
            aria-label="Attach file"
          >
            <span
              className={cn('material-symbols-outlined', compact ? 'text-[20px]' : 'text-[24px]')}
            >
              add_circle
            </span>
          </button>

          {showMenu && (
            <div className="absolute left-0 bottom-[110%] mb-2 w-48 bg-card border border-border shadow-2xl rounded-xl overflow-hidden z-[80] flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-200">
              <button
                onClick={() => handleMenuClick('file')}
                className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted text-left transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl text-primary">attach_file</span>
                Attach File
              </button>
              <button
                onClick={() => handleMenuClick('camera')}
                className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted text-left transition-colors border-t border-border cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl text-primary">photo_camera</span>
                Open Camera
              </button>
            </div>
          )}
        </div>

        <div className="relative flex-1 flex items-center">
          {attachedImage && (
            <div className="absolute left-4 bottom-full mb-2 z-10 bg-card p-1 rounded-xl shadow-lg border border-border animate-in fade-in slide-in-from-bottom-2">
              <div className="relative">
                <img
                  src={attachedImage}
                  alt="preview"
                  className="h-16 w-16 object-cover rounded-lg"
                />
                <button
                  onClick={() => {
                    setAttachedImage(null)
                    setAttachedFile(null)
                  }}
                  className="absolute -top-2 -right-2 bg-slate-800 text-white w-5 h-5 rounded-full flex items-center justify-center shadow-md hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Remove attachment"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              'w-full resize-none bg-card border border-border shadow-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50',
              'text-foreground placeholder:text-muted-foreground',
              compact
                ? 'pl-4 pr-12 py-3 rounded-xl min-h-[44px] text-[13px]'
                : 'pl-5 pr-14 py-4 rounded-2xl min-h-[56px] text-sm'
            )}
          />

          {/* Send button (right) */}
          <IconButton
            icon="send"
            onClick={() => doSend()}
            disabled={disabled || !value.trim()}
            className={cn(
              'absolute bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:scale-105 active:scale-95 z-10',
              compact ? 'right-1.5 bottom-1.5 size-[32px]' : 'right-2 bottom-2'
            )}
            size={compact ? undefined : 'sm'}
            aria-label="Send message"
          />
        </div>
      </div>

      {showWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowWarning(false)}
          ></div>
          <div className="bg-card w-full max-w-sm rounded-2xl shadow-2xl border border-border p-6 flex flex-col relative z-10 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/40 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Heads up!</h3>
            <p className="text-sm text-muted-foreground mb-6">
              When attaching files, only these items are supported: Shoes, TV, Cocoa Powder, Laptop,
              Smartphone, Vitamin C, Suitcase & Briefcase, and Perfumes.
            </p>
            <button
              onClick={() => setShowWarning(false)}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-xl font-medium transition-colors cursor-pointer"
            >
              OK {countdown > 0 ? `(${countdown}s)` : ''}
            </button>
          </div>
        </div>
      )}

      {/* Camera Modal Overlay */}
      {showCamera && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black animate-in fade-in duration-200">
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => setShowCamera(false)}
              className="size-10 rounded-full bg-white/20 text-white flex items-center justify-center backdrop-blur-md hover:bg-white/30 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="flex-1 relative overflow-hidden flex items-center justify-center">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            {/* Viewfinder overlay */}
            <div className="absolute inset-0 border-[40px] border-black/50 pointer-events-none"></div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 border-2 border-white/50 rounded-3xl"></div>
            </div>
          </div>
          <div className="h-32 bg-black flex items-center justify-center shrink-0">
            <button
              onClick={capturePhoto}
              className="size-20 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <div className="size-16 bg-white rounded-full"></div>
            </button>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  )
}
