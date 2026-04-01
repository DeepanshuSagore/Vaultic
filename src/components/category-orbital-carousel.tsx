import { Text } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Color, Group, MathUtils, Mesh, MeshPhysicalMaterial } from 'three'

import type { VaultCategory } from '@/lib/vault-api'

const MAX_VISIBLE_CATEGORIES = 10
const ITEM_SPACING = 1.35
const SIDE_DEPTH = 1.4
const DRAG_SENSITIVITY = 0.009
const DRAG_START_THRESHOLD_PX = 4
const WHEEL_SENSITIVITY = 0.0012
const SNAP_DELAY_MS = 170
const AUTO_SCROLL_SPEED = 0.045
const MOTION_DAMPING = 8.4
const SIDE_FALLOFF_DISTANCE = 3.9

interface GradientTone {
  top: string
  bottom: string
  emissive: string
}

const CATEGORY_GRADIENT_TONES: Array<{ match: RegExp; tone: GradientTone }> = [
  {
    match: /code|dev|program|engineer/i,
    tone: { top: '#2563eb', bottom: '#1e3a8a', emissive: '#1d4ed8' },
  },
  {
    match: /design|ui|ux|brand/i,
    tone: { top: '#7c3aed', bottom: '#5b21b6', emissive: '#6d28d9' },
  },
  {
    match: /learn|study|course|read/i,
    tone: { top: '#f59e0b', bottom: '#92400e', emissive: '#b45309' },
  },
  {
    match: /ai|ml|model|llm/i,
    tone: { top: '#22d3ee', bottom: '#0ea5e9', emissive: '#0ea5e9' },
  },
  {
    match: /tools?|utility|stack|kit/i,
    tone: { top: '#64748b', bottom: '#334155', emissive: '#475569' },
  },
]

const FALLBACK_GRADIENT_TONES: readonly GradientTone[] = [
  { top: '#62748a', bottom: '#35485e', emissive: '#4f6178' },
  { top: '#6e77a0', bottom: '#414a72', emissive: '#5a6387' },
  { top: '#688498', bottom: '#3b5768', emissive: '#4f6a7d' },
  { top: '#667f95', bottom: '#3e5566', emissive: '#4f677b' },
]

function resolveGradientTone(name: string, index: number): GradientTone {
  const byName = CATEGORY_GRADIENT_TONES.find((entry) => entry.match.test(name))

  if (byName) {
    return byName.tone
  }

  return FALLBACK_GRADIENT_TONES[index % FALLBACK_GRADIENT_TONES.length]
}

interface CategoryLinearCarouselProps {
  categories: VaultCategory[]
  onCategoryNavigate: (category: VaultCategory) => void
}

interface LinearSceneProps {
  items: VaultCategory[]
  hoveredId: string | null
  selectedId: string | null
  offsetRef: MutableRefObject<number>
  targetOffsetRef: MutableRefObject<number>
  isDraggingRef: MutableRefObject<boolean>
  lastInteractionAtRef: MutableRefObject<number>
  onHover: (id: string | null) => void
  onSelect: (item: VaultCategory, index: number) => void
  onActiveChange: (id: string | null) => void
}

function wrapDistance(value: number, count: number) {
  if (count <= 0) {
    return 0
  }

  const half = count / 2
  return ((((value + half) % count) + count) % count) - half
}

function lerpFactor(delta: number, speed: number) {
  return 1 - Math.exp(-delta * speed)
}

interface GradientHoverUniform {
  value: number
}

interface MeshUserData {
  gradientHoverUniform?: GradientHoverUniform
}

interface MaterialShader {
  uniforms: Record<string, { value: unknown }>
  vertexShader: string
  fragmentShader: string
}

function LinearScene({
  items,
  hoveredId,
  selectedId,
  offsetRef,
  targetOffsetRef,
  isDraggingRef,
  lastInteractionAtRef,
  onHover,
  onSelect,
  onActiveChange,
}: LinearSceneProps) {
  const rootRefs = useRef<Array<Group | null>>([])
  const orbRefs = useRef<Array<Group | null>>([])
  const meshRefs = useRef<Array<Mesh | null>>([])
  const activeIdRef = useRef<string | null>(null)

  useFrame((state, delta) => {
    const count = items.length

    if (!count) {
      return
    }

    const idleForMs = state.clock.elapsedTime * 1000 - lastInteractionAtRef.current

    if (!isDraggingRef.current && idleForMs > 1400) {
      targetOffsetRef.current += delta * AUTO_SCROLL_SPEED
    }

    const blend = lerpFactor(delta, MOTION_DAMPING)
    offsetRef.current = MathUtils.lerp(offsetRef.current, targetOffsetRef.current, blend)

    let nearestIndex = 0
    let nearestDistance = Number.POSITIVE_INFINITY

    for (let index = 0; index < count; index += 1) {
      const root = rootRefs.current[index]
      const orb = orbRefs.current[index]
      const mesh = meshRefs.current[index]

      if (!root || !orb || !mesh) {
        continue
      }

      const relative = wrapDistance(index - offsetRef.current, count)
      const distance = Math.abs(relative)
      const falloff = MathUtils.clamp(distance / SIDE_FALLOFF_DISTANCE, 0, 1)
      const isHovered = hoveredId === items[index]._id
      const isSelected = selectedId === items[index]._id

      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestIndex = index
      }

      const targetX = relative * ITEM_SPACING
      const targetZ = -MathUtils.lerp(0, SIDE_DEPTH, Math.pow(falloff, 1.05))
      const targetY = Math.sin(state.clock.elapsedTime * 0.32 + index * 0.75) * 0.035

      root.position.x = MathUtils.lerp(root.position.x, targetX, 0.14)
      root.position.y = MathUtils.lerp(root.position.y, targetY, 0.12)
      root.position.z = MathUtils.lerp(root.position.z, targetZ, 0.14)

      const baseScale = MathUtils.lerp(1.1, 0.42, falloff)
      const hoverBoost = isHovered ? 0.05 : 0
      const selectedBoost = isSelected ? 0.07 : 0
      const targetScale = baseScale + hoverBoost + selectedBoost
      const nextScale = MathUtils.lerp(orb.scale.x, targetScale, 0.14)

      orb.scale.setScalar(nextScale)

      const forwardOffset = isSelected ? 0.38 : 0
      orb.position.z = MathUtils.lerp(orb.position.z, forwardOffset, 0.14)

      const material = mesh.material as MeshPhysicalMaterial
      const targetOpacity = MathUtils.lerp(0.28, 0.96, 1 - falloff)
      const baseEmissiveIntensity = MathUtils.lerp(0.04, 0.06, 1 - falloff)
      const targetEmissiveIntensity = isHovered ? 0.11 : baseEmissiveIntensity

      material.opacity = MathUtils.lerp(material.opacity, targetOpacity, 0.14)
      material.emissiveIntensity = MathUtils.lerp(
        material.emissiveIntensity,
        targetEmissiveIntensity,
        0.14,
      )

      const gradientHoverUniform = (mesh.userData as MeshUserData).gradientHoverUniform

      if (gradientHoverUniform) {
        const targetHoverBrightness = isHovered ? 0.08 : 0
        gradientHoverUniform.value = MathUtils.lerp(
          gradientHoverUniform.value,
          targetHoverBrightness,
          0.14,
        )
      }
    }

    const nextActiveId = items[nearestIndex]?._id ?? null

    if (nextActiveId !== activeIdRef.current) {
      activeIdRef.current = nextActiveId
      onActiveChange(nextActiveId)
    }
  })

  return (
    <>
      {items.map((item, index) => {
        const tone = resolveGradientTone(item.name, index)

        return (
          <group
            key={item._id}
            ref={(node) => {
              rootRefs.current[index] = node
            }}
          >
            <group
              ref={(node) => {
                orbRefs.current[index] = node
              }}
            >
              <mesh
                ref={(node) => {
                  meshRefs.current[index] = node
                }}
                onPointerOver={(event) => {
                  event.stopPropagation()
                  onHover(item._id)
                }}
                onPointerOut={() => onHover(null)}
                onClick={(event) => {
                  event.stopPropagation()
                  onSelect(item, index)
                }}
              >
                <sphereGeometry args={[0.42, 36, 36]} />
                <meshPhysicalMaterial
                  color={tone.bottom}
                  emissive={tone.emissive}
                  emissiveIntensity={0.05}
                  metalness={0.05}
                  transmission={0.9}
                  roughness={0.15}
                  thickness={1}
                  clearcoat={1}
                  clearcoatRoughness={0.1}
                  ior={1.2}
                  transparent
                  opacity={0.92}
                  onBeforeCompile={(shader: MaterialShader) => {
                    shader.uniforms.uGradientTop = { value: new Color(tone.top) }
                    shader.uniforms.uGradientBottom = { value: new Color(tone.bottom) }
                    shader.uniforms.uHoverBrightness = { value: 0 }

                    shader.vertexShader = shader.vertexShader.replace(
                      'void main() {',
                      `varying vec3 vLocalPosition;\nvoid main() {\n  vLocalPosition = position;`,
                    )

                    shader.fragmentShader = shader.fragmentShader
                      .replace(
                        'void main() {',
                        `uniform vec3 uGradientTop;\nuniform vec3 uGradientBottom;\nuniform float uHoverBrightness;\nvarying vec3 vLocalPosition;\nvoid main() {`,
                      )
                      .replace(
                        '#include <color_fragment>',
                        `#include <color_fragment>\nfloat gradientMix = clamp(0.5 + vLocalPosition.y * 0.72 + vLocalPosition.x * 0.25, 0.0, 1.0);\nvec3 gradientColor = mix(uGradientBottom, uGradientTop, gradientMix);\ngradientColor = mix(gradientColor, vec3(1.0), uHoverBrightness);\ndiffuseColor.rgb = gradientColor;`,
                      )

                    const mesh = meshRefs.current[index]

                    if (mesh) {
                      ;(mesh.userData as MeshUserData).gradientHoverUniform =
                        shader.uniforms.uHoverBrightness as GradientHoverUniform
                    }
                  }}
                />
              </mesh>

              <Text
                position={[0, -0.72, 0]}
                fontSize={0.15}
                color={hoveredId === item._id || selectedId === item._id ? '#e8eef8' : '#9ea8b6'}
                anchorX="center"
                anchorY="middle"
                maxWidth={1.7}
                textAlign="center"
                onClick={(event) => {
                  event.stopPropagation()
                  onSelect(item, index)
                }}
              >
                {item.name}
              </Text>
            </group>
          </group>
        )
      })}
    </>
  )
}

export function CategoryLinearCarousel({
  categories,
  onCategoryNavigate,
}: CategoryLinearCarouselProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const snapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const offsetRef = useRef(0)
  const targetOffsetRef = useRef(0)
  const isDraggingRef = useRef(false)
  const isPointerDownRef = useRef(false)
  const pointerDownXRef = useRef(0)
  const lastPointerXRef = useRef(0)
  const lastInteractionAtRef = useRef(0)

  const visibleCategories = useMemo(
    () => categories.slice(0, MAX_VISIBLE_CATEGORIES),
    [categories],
  )

  const activeCategory = useMemo(
    () => visibleCategories.find((item) => item._id === activeId) ?? null,
    [activeId, visibleCategories],
  )

  const markInteraction = useCallback(() => {
    lastInteractionAtRef.current = performance.now()
  }, [])

  const scheduleSnap = useCallback(() => {
    if (snapTimeoutRef.current) {
      clearTimeout(snapTimeoutRef.current)
    }

    snapTimeoutRef.current = setTimeout(() => {
      targetOffsetRef.current = Math.round(targetOffsetRef.current)
    }, SNAP_DELAY_MS)
  }, [])

  const moveByStep = useCallback(
    (direction: -1 | 1) => {
      if (!visibleCategories.length) {
        return
      }

      targetOffsetRef.current += direction
      setSelectedId(null)
      markInteraction()
      scheduleSnap()
    },
    [markInteraction, scheduleSnap, visibleCategories.length],
  )

  const handleSelect = useCallback(
    (category: VaultCategory, index: number) => {
      if (!visibleCategories.length) {
        return
      }

      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current)
      }

      const relative = wrapDistance(
        index - targetOffsetRef.current,
        visibleCategories.length,
      )

      targetOffsetRef.current += relative
      setSelectedId(category._id)
      markInteraction()

      clickTimeoutRef.current = setTimeout(() => {
        onCategoryNavigate(category)
      }, 380)
    },
    [markInteraction, onCategoryNavigate, visibleCategories.length],
  )

  const handleWheel = useCallback(
    (event: ReactWheelEvent<HTMLDivElement>) => {
      event.preventDefault()

      const delta = event.deltaY + event.deltaX
      targetOffsetRef.current += delta * WHEEL_SENSITIVITY

      markInteraction()
      scheduleSnap()
    },
    [markInteraction, scheduleSnap],
  )

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      isPointerDownRef.current = true
      pointerDownXRef.current = event.clientX
      lastPointerXRef.current = event.clientX

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }

      markInteraction()
    },
    [markInteraction],
  )

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!isPointerDownRef.current) {
        return
      }

      if (!isDraggingRef.current) {
        const pointerTravel = Math.abs(event.clientX - pointerDownXRef.current)

        if (pointerTravel >= DRAG_START_THRESHOLD_PX) {
          isDraggingRef.current = true
          setIsDragging(true)
          event.currentTarget.setPointerCapture(event.pointerId)
        }
      }

      const deltaX = event.clientX - lastPointerXRef.current
      lastPointerXRef.current = event.clientX

      if (!isDraggingRef.current) {
        return
      }

      targetOffsetRef.current -= deltaX * DRAG_SENSITIVITY

      markInteraction()
    },
    [markInteraction],
  )

  const handlePointerRelease = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!isPointerDownRef.current) {
        return
      }

      isPointerDownRef.current = false

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }

      if (!isDraggingRef.current) {
        return
      }

      isDraggingRef.current = false
      setIsDragging(false)

      scheduleSnap()
    },
    [scheduleSnap],
  )

  useEffect(() => {
    lastInteractionAtRef.current = performance.now()

    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current)
      }

      if (snapTimeoutRef.current) {
        clearTimeout(snapTimeoutRef.current)
      }
    }
  }, [])

  if (visibleCategories.length === 0) {
    return (
      <div className="-mt-4 flex h-[420px] items-center justify-center bg-transparent px-6 text-center text-sm text-muted-foreground">
        Categories will appear here as a linear carousel once you create them in
        your library.
      </div>
    )
  }

  return (
    <div
      className={`relative -mt-4 h-[440px] overflow-hidden bg-transparent ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerRelease}
      onPointerCancel={handlePointerRelease}
      onPointerLeave={(event) => {
        if (isDraggingRef.current) {
          handlePointerRelease(event)
        }
      }}
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.1, 5.4], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.34} />
        <directionalLight position={[1.4, 2.5, 2.6]} intensity={0.48} color="#dde6f7" />
        <pointLight position={[-2.8, 0.9, 2.2]} intensity={0.18} color="#7f95b4" />
        <pointLight position={[3.1, -0.1, -1.2]} intensity={0.14} color="#46586f" />
        <pointLight position={[0.2, 1.1, -3.8]} intensity={0.2} color="#95a4bd" />

        <LinearScene
          items={visibleCategories}
          hoveredId={hoveredId}
          selectedId={selectedId}
          offsetRef={offsetRef}
          targetOffsetRef={targetOffsetRef}
          isDraggingRef={isDraggingRef}
          lastInteractionAtRef={lastInteractionAtRef}
          onHover={setHoveredId}
          onSelect={handleSelect}
          onActiveChange={setActiveId}
        />
      </Canvas>

      <button
        type="button"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => moveByStep(-1)}
        className="absolute top-1/2 left-3 z-20 -translate-y-1/2 rounded-full border border-white/20 bg-black/30 px-3 py-2 text-sm text-foreground transition-colors hover:bg-black/45"
        aria-label="Previous category"
      >
        {'<'}
      </button>

      <button
        type="button"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => moveByStep(1)}
        className="absolute top-1/2 right-3 z-20 -translate-y-1/2 rounded-full border border-white/20 bg-black/30 px-3 py-2 text-sm text-foreground transition-colors hover:bg-black/45"
        aria-label="Next category"
      >
        {'>'}
      </button>

      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
        <p className="px-5 py-2 text-xs tracking-[0.15em] text-muted-foreground uppercase sm:text-sm">
          Drag, scroll, or use arrows
          {activeCategory ? ` • ${activeCategory.name}` : ''}
        </p>
      </div>
    </div>
  )
}
