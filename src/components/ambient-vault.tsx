import { useEffect, useRef } from 'react'
import Hls from 'hls.js'

import { cn } from '@/lib/utils'

interface AmbientVaultProps {
  className?: string
}

export function AmbientVault({ className }: AmbientVaultProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const videoSrc =
      'https://stream.mux.com/01yW6GoUz01OTXk5w1Rt1MHkJWlCGIwj46SUONJZ4DJUE.m3u8'

    let hls: Hls | null = null

    if (Hls.isSupported()) {
      hls = new Hls({
        autoStartLoad: true,
      })
      hls.loadSource(videoSrc)
      hls.attachMedia(video)
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {
          // Ignore autoplay errors if browser blocks it initially
        })
      })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native support (Safari)
      video.src = videoSrc
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(() => {})
      })
    }

    return () => {
      if (hls) {
        hls.destroy()
      }
    }
  }, [])

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#050505]',
        className,
      )}
    >
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="absolute h-full w-full object-cover opacity-60"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-[#050505]/70" />
    </div>
  )
}
