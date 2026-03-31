import { motion } from 'framer-motion'
import { FastForward, Rewind } from 'lucide-react'
import {
  type Dispatch,
  type MutableRefObject,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { cn } from '@/lib/utils'

export interface CarouselItem {
  id: string
  title: string
}

interface InfiniteCarouselItem extends CarouselItem {
  instanceId: string
  originalIndex: number
}

interface RulerCarouselProps {
  originalItems: CarouselItem[]
  onItemClick?: (item: CarouselItem) => void
  className?: string
  initialCenteredIndex?: number
}

const ITEM_WIDTH_PX = 240
const ITEM_GAP_PX = 56
const STEP_PX = ITEM_WIDTH_PX + ITEM_GAP_PX

function createInfiniteItems(originalItems: CarouselItem[]) {
  const items: InfiniteCarouselItem[] = []

  for (let copy = 0; copy < 3; copy += 1) {
    originalItems.forEach((item, originalIndex) => {
      items.push({
        ...item,
        instanceId: `${copy}-${item.id}`,
        originalIndex,
      })
    })
  }

  return items
}

function scheduleIndexReset({
  direction,
  itemsPerSet,
  resetTimeoutRef,
  setActiveIndex,
  setIsResetting,
}: {
  direction: 'left' | 'right'
  itemsPerSet: number
  resetTimeoutRef: MutableRefObject<ReturnType<typeof setTimeout> | null>
  setActiveIndex: Dispatch<SetStateAction<number>>
  setIsResetting: Dispatch<SetStateAction<boolean>>
}) {
  if (resetTimeoutRef.current) {
    clearTimeout(resetTimeoutRef.current)
  }

  setIsResetting(true)

  resetTimeoutRef.current = setTimeout(() => {
    setActiveIndex((current) =>
      direction === 'left' ? current + itemsPerSet : current - itemsPerSet,
    )
    setIsResetting(false)
    resetTimeoutRef.current = null
  }, 0)
}

function RulerLines({
  top = true,
  totalLines = 101,
}: {
  top?: boolean
  totalLines?: number
}) {
  const lines: ReactNode[] = []
  const lineSpacing = 100 / Math.max(totalLines - 1, 1)

  for (let index = 0; index < totalLines; index += 1) {
    const isFifth = index % 5 === 0
    const isCenter = index === Math.floor(totalLines / 2)

    let height = 'h-1.5'
    let color = 'bg-white/30'

    if (isCenter) {
      height = 'h-5'
      color = 'bg-white/90'
    } else if (isFifth) {
      height = 'h-2.5'
      color = 'bg-white/60'
    }

    lines.push(
      <div
        key={index}
        className={cn('absolute w-0.5', height, color, top ? 'top-0' : 'bottom-0')}
        style={{ left: `${index * lineSpacing}%` }}
      />,
    )
  }

  return <div className="relative h-5 w-full px-4">{lines}</div>
}

export function RulerCarousel({
  originalItems,
  onItemClick,
  className,
  initialCenteredIndex,
}: RulerCarouselProps) {
  const itemsPerSet = originalItems.length

  const clampedInitialOriginalIndex = useMemo(() => {
    if (!itemsPerSet) {
      return 0
    }

    const fallbackIndex = Math.floor((itemsPerSet - 1) / 2)
    const preferredIndex = initialCenteredIndex ?? fallbackIndex

    return Math.min(Math.max(preferredIndex, 0), itemsPerSet - 1)
  }, [initialCenteredIndex, itemsPerSet])

  const infiniteItems = useMemo(
    () => createInfiniteItems(originalItems),
    [originalItems],
  )

  const [activeIndex, setActiveIndex] = useState(
    itemsPerSet ? itemsPerSet + clampedInitialOriginalIndex : 0,
  )
  const [isResetting, setIsResetting] = useState(false)
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearResetTimeout = useCallback(() => {
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current)
      resetTimeoutRef.current = null
    }
  }, [])

  useEffect(() => {
    return clearResetTimeout
  }, [clearResetTimeout])

  const shiftBy = useCallback(
    (delta: number) => {
      if (isResetting || !itemsPerSet) {
        return
      }

      setActiveIndex((previous) => previous + delta)
    },
    [isResetting, itemsPerSet],
  )

  useEffect(() => {
    if (!itemsPerSet || isResetting) {
      return
    }

    if (activeIndex < itemsPerSet) {
      scheduleIndexReset({
        direction: 'left',
        itemsPerSet,
        resetTimeoutRef,
        setActiveIndex,
        setIsResetting,
      })

      return
    }

    if (activeIndex >= itemsPerSet * 2) {
      scheduleIndexReset({
        direction: 'right',
        itemsPerSet,
        resetTimeoutRef,
        setActiveIndex,
        setIsResetting,
      })
    }
  }, [activeIndex, isResetting, itemsPerSet])

  useEffect(() => {
    if (!itemsPerSet) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isResetting) {
        return
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        shiftBy(-1)
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        shiftBy(1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isResetting, itemsPerSet, shiftBy])

  const handleItemClick = useCallback(
    (newIndex: number) => {
      if (isResetting || !itemsPerSet) {
        return
      }

      const targetOriginalIndex =
        ((newIndex % itemsPerSet) + itemsPerSet) % itemsPerSet

      const possibleIndices = [
        targetOriginalIndex,
        targetOriginalIndex + itemsPerSet,
        targetOriginalIndex + itemsPerSet * 2,
      ]

      let closestIndex = possibleIndices[0]
      let smallestDistance = Math.abs(possibleIndices[0] - activeIndex)

      for (const index of possibleIndices) {
        const distance = Math.abs(index - activeIndex)

        if (distance < smallestDistance) {
          smallestDistance = distance
          closestIndex = index
        }
      }

      setActiveIndex(closestIndex)

      const clickedItem = originalItems[targetOriginalIndex]

      if (clickedItem && onItemClick) {
        onItemClick(clickedItem)
      }
    },
    [activeIndex, isResetting, itemsPerSet, onItemClick, originalItems],
  )

  if (!itemsPerSet) {
    return (
      <div
        className={cn(
          'flex h-[132px] items-center justify-center rounded-3xl border border-white/10 bg-black/20 px-6 text-center text-sm text-muted-foreground',
          className,
        )}
      >
        Categories will appear here once you create them in your library.
      </div>
    )
  }

  const normalizedActiveIndex =
    ((activeIndex % itemsPerSet) + itemsPerSet) % itemsPerSet
  const centerPosition = (infiniteItems.length - 1) / 2
  const targetX = (centerPosition - activeIndex) * STEP_PX

  const currentPage = normalizedActiveIndex + 1
  const totalPages = itemsPerSet
  const activeItem = originalItems[normalizedActiveIndex]

  return (
    <div className={cn('w-full', className)}>
      <div className="relative w-full overflow-hidden py-1">
        <div className="mb-1 flex items-center justify-center">
          <RulerLines top />
        </div>

        <div className="relative h-[132px] w-full overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_62%)]"
          />

          <div className="flex h-full items-center justify-center">
            <motion.div
              className="flex items-center"
              animate={{ x: targetX }}
              style={{ gap: `${ITEM_GAP_PX}px` }}
              transition={
                isResetting
                  ? { duration: 0 }
                  : {
                      type: 'spring',
                      stiffness: 260,
                      damping: 20,
                      mass: 1,
                    }
              }
            >
              {infiniteItems.map((item, index) => {
                const isActive = index === activeIndex

                return (
                  <motion.button
                    key={item.instanceId}
                    onClick={() => handleItemClick(index)}
                    className={cn(
                      'cursor-pointer whitespace-nowrap text-center text-xl font-semibold tracking-wide transition-colors sm:text-3xl',
                      isActive
                        ? 'text-white'
                        : 'text-white/35 hover:text-white/60',
                    )}
                    animate={{
                      scale: isActive ? 1 : 0.76,
                      opacity: isActive ? 1 : 0.35,
                    }}
                    transition={
                      isResetting
                        ? { duration: 0 }
                        : {
                            type: 'spring',
                            stiffness: 400,
                            damping: 25,
                          }
                    }
                    style={{ width: `${ITEM_WIDTH_PX}px` }}
                  >
                    {item.title}
                  </motion.button>
                )
              })}
            </motion.div>
          </div>
        </div>

        <div className="mt-1 flex items-center justify-center">
          <RulerLines top={false} />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => shiftBy(-1)}
          disabled={isResetting}
          className="flex cursor-pointer items-center justify-center rounded-full border border-white/20 p-2 text-white/75 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous item"
        >
          <Rewind className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-white/75">{currentPage}</span>
          <span>/</span>
          <span className="font-medium text-white/75">{totalPages}</span>
          {activeItem ? (
            <span className="ml-2 max-w-[45vw] truncate text-white/55">• {activeItem.title}</span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => shiftBy(1)}
          disabled={isResetting}
          className="flex cursor-pointer items-center justify-center rounded-full border border-white/20 p-2 text-white/75 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next item"
        >
          <FastForward className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
