/**
 * Chat message bubble.
 *
 * Bot messages render left-aligned with an avatar and support
 * markdown (via react-markdown + remark-gfm).
 * User messages render right-aligned with a person icon.
 *
 * Supports:
 * - `compact` mode for the inline chat panel (smaller avatars, padding)
 * - `sources` array to display clickable PDF source links
 */

import { cn } from '@repo/ui/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useState, useEffect } from 'react'
import { getDownloadURL, ref } from 'firebase/storage'
import { storage } from '../lib/firebase'

interface Source {
  name: string
  url: string
}

interface ChatBubbleProps {
  role: 'bot' | 'user'
  children: React.ReactNode
  timestamp?: string
  sources?: Source[]
  imageUrl?: string
  compact?: boolean
  className?: string
}

export function ChatBubble({
  role,
  children,
  timestamp,
  sources,
  imageUrl,
  compact = false,
  className,
}: ChatBubbleProps) {
  const isBot = role === 'bot'

  return (
    <div className={cn('flex gap-3 items-start', !isBot && 'justify-end', className)}>
      {/* Bot avatar */}
      {isBot && (
        <div
          className={cn(
            'rounded-xl flex items-center justify-center shrink-0 shadow-md overflow-hidden bg-white',
            compact ? 'size-8 p-0.5' : 'size-12 p-0.5'
          )}
        >
          <img
            src="/bot.png"
            alt="BOC AI bot"
            className="w-full h-full object-cover rounded-[10px] scale-150"
          />
        </div>
      )}

      {/* Message body */}
      <div
        className={cn(
          'flex flex-col',
          !isBot && 'items-end',
          compact ? 'max-w-[85%]' : 'max-w-2xl'
        )}
      >
        <div
          className={cn(
            'text-sm leading-relaxed shadow-sm',
            compact ? 'p-3.5' : 'p-5',
            isBot
              ? cn(
                  'bg-card border border-border text-card-foreground',
                  compact ? 'rounded-2xl rounded-tl-none' : 'rounded-[20px] rounded-tl-md'
                )
              : cn(
                  'bg-primary text-primary-foreground',
                  compact ? 'rounded-2xl rounded-tr-none' : 'rounded-[20px] rounded-tr-md'
                )
          )}
        >
          {imageUrl && (
            <div className="mb-3 rounded-lg overflow-hidden border border-black/10 dark:border-white/10 max-w-xs">
              <img src={imageUrl} alt="Attached" className="w-full h-auto object-cover" />
            </div>
          )}

          {/* Bot messages: render markdown. User messages: plain text. */}
          {isBot && typeof children === 'string' ? (
            <div className="prose prose-sm max-w-none text-card-foreground break-words">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <span className="block mb-2 last:mb-0">{children}</span>,
                  ul: ({ children }) => (
                    <ul className="list-disc pl-4 mb-2 last:mb-0">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-4 mb-2 last:mb-0">{children}</ol>
                  ),
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  code: ({ children, ...props }) => {
                    // Detect block vs inline code by checking if it spans multiple lines
                    const isBlock =
                      'node' in props &&
                      props.node?.position?.start.line !== props.node?.position?.end.line
                    return isBlock ? (
                      <code
                        className="block bg-muted p-2 rounded text-xs mb-2 overflow-x-auto"
                        {...props}
                      >
                        {children}
                      </code>
                    ) : (
                      <code className="bg-muted px-1.5 py-0.5 rounded text-xs" {...props}>
                        {children}
                      </code>
                    )
                  },
                }}
              >
                {children}
              </ReactMarkdown>
            </div>
          ) : typeof children === 'string' ? (
            <p className="whitespace-pre-wrap">{children}</p>
          ) : (
            children
          )}

          {/* Source attribution links */}
          {isBot && sources && sources.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <div className="flex items-center gap-1 mb-1.5">
                <span className="material-symbols-outlined text-xs text-muted-foreground">
                  description
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Sources
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sources.map((source, i) => (
                  <SourceLink key={i} source={source} />
                ))}
              </div>
            </div>
          )}
        </div>

        {timestamp && (
          <span className="text-[10px] text-muted-foreground mt-1.5 px-1">
            {timestamp} &bull; {isBot ? 'BOC AI Bot' : 'You'}
          </span>
        )}
      </div>

      {/* User avatar */}
      {!isBot && (
        <div
          className={cn(
            'rounded-lg bg-secondary flex items-center justify-center shrink-0',
            compact ? 'size-8' : 'size-8'
          )}
        >
          <span className="material-symbols-outlined text-muted-foreground text-base">person</span>
        </div>
      )}
    </div>
  )
}

function SourceLink({ source }: { source: Source }) {
  const [url, setUrl] = useState(source.url)
  const [loading, setLoading] = useState(!source.url)

  useEffect(() => {
    if (!url && source.name) {
      const getUrl = async () => {
        const hasPdfExt = source.name.toLowerCase().endsWith('.pdf')
        const nameWithExt = hasPdfExt ? source.name : `${source.name}.pdf`

        // Known specific edge cases matching what's physically in the bucket
        const knownEdgeCases = [
          'boc-pdfs/CAO-2-2016-ONAR-DE-MINIMIS.pdf',
          'boc-pdfs/CMTA-RA-10863.pdf',
          'boc-pdfs/cmo-18-2018_Guidelines_on_the_Implementation_of_CAO_No_1_2018_on_Amended_Rules_on_Balikbayan_Boxes.pdf',
        ]

        // Check a variety of likely paths in Storage where it might be located
        const pathsToTry = [
          source.name, // Just as the metadata dictates
          nameWithExt, // Explicitly with .pdf
          `pdfs/${nameWithExt}`, // In pdfs folder
          `boc-pdfs/${nameWithExt}`, // From ingest scripts
          `boc-pdfs/${source.name}`, // Ingest script exact source
        ]

        // Add known edge cases that might be loosely matched
        const normalizedSrc = source.name.toLowerCase()
        const cleanedSrc = normalizedSrc.replace(/[^a-z0-9]/g, '') // remove dashes/spaces for looser matching

        knownEdgeCases.forEach(kc => {
          const normalizedKc = kc.toLowerCase()
          if (
            normalizedKc.includes(normalizedSrc) ||
            normalizedKc.replace(/[^a-z0-9]/g, '').includes(cleanedSrc)
          ) {
            pathsToTry.unshift(kc) // Prioritize known matches
          }
        })

        for (const path of pathsToTry) {
          try {
            const res = await getDownloadURL(ref(storage, path))
            setUrl(res)
            setLoading(false)
            return
          } catch (e) {
            // Keep looping to try next path variant
          }
        }

        // If all fallbacks fail, just stop loading and show plain text
        setLoading(false)
      }

      getUrl()
    } else {
      setLoading(false)
    }
  }, [source.name, url])

  if (loading) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary/30 text-[11px] text-muted-foreground font-medium animate-pulse">
        <span className="material-symbols-outlined text-xs">sync</span>
        <span className="truncate max-w-[140px]">Fetching link...</span>
      </span>
    )
  }

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/5 hover:bg-primary/10 border border-primary/15 text-[11px] text-primary font-medium transition-colors"
        title={`View: ${source.name}`}
      >
        <span className="material-symbols-outlined text-xs">picture_as_pdf</span>
        <span className="truncate max-w-[140px]">{source.name}</span>
        <span className="material-symbols-outlined text-[10px] opacity-50">open_in_new</span>
      </a>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary/50 text-[11px] text-muted-foreground font-medium">
      <span className="material-symbols-outlined text-xs">article</span>
      <span className="truncate max-w-[140px]">{source.name}</span>
    </span>
  )
}
