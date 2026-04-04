import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ArtifactCardProps {
  url: string
  title: string
  className?: string
}

function hostFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./i, '')
  } catch {
    return url
  }
}

function faviconFromUrl(url: string) {
  const host = hostFromUrl(url)
  if (!host) return ''
  return `https://www.google.com/s2/favicons?domain=${host}&sz=64`
}

export function ArtifactCard({ url, title, className }: ArtifactCardProps) {
  const domain = hostFromUrl(url)
  const favicon = faviconFromUrl(url)

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noreferrer"
      whileHover={{ scale: 1.015, y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className={cn(
        'frosted-obsidian glass-to-glow group block rounded-2xl p-4 transition-all duration-300',
        className,
      )}
    >
      <div className="flex items-start gap-3.5">
        {/* Favicon with glow ring */}
        <div className="relative flex-shrink-0">
          <div className="absolute -inset-1 rounded-xl bg-accent/0 transition-all duration-500 group-hover:bg-accent/10 group-hover:blur-md" />
          <div className="frosted-obsidian relative flex h-10 w-10 items-center justify-center rounded-xl">
            {favicon ? (
              <img
                src={favicon}
                alt=""
                className="h-5 w-5 rounded-sm"
                loading="lazy"
              />
            ) : (
              <div className="h-5 w-5 rounded-sm bg-muted" />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-accent">
            {title}
          </p>
          <p className="mt-0.5 truncate font-mono text-xs tracking-wide text-muted-foreground">
            {domain}
          </p>
        </div>

        {/* Arrow indicator */}
        <div className="flex-shrink-0 pt-0.5">
          <svg
            className="h-4 w-4 -translate-x-1 text-muted-foreground/40 transition-all duration-300 group-hover:translate-x-0 group-hover:text-accent"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25"
            />
          </svg>
        </div>
      </div>
    </motion.a>
  )
}
