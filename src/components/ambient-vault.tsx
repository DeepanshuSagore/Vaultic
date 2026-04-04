import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { cn } from '@/lib/utils'

const PARTICLE_COUNT = 200
const CONNECTION_DISTANCE = 90
const MOUSE_INFLUENCE_RADIUS = 280
const MOUSE_INFLUENCE_STRENGTH = 0.00006
const DRIFT_SPEED = 0.08
const FIELD_SIZE = 1000

interface AmbientVaultProps {
  className?: string
}

export function AmbientVault({ className }: AmbientVaultProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    const width = Math.max(container.clientWidth, 1)
    const height = Math.max(container.clientHeight, 1)

    /* ── Scene ── */
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x050505, 0.0012)

    /* ── Camera ── */
    const camera = new THREE.PerspectiveCamera(55, width / height, 1, 2000)
    camera.position.set(0, 0, 500)

    /* ── Renderer ── */
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    renderer.setClearColor(0x050505, 0)
    container.appendChild(renderer.domElement)

    /* ── Particles ── */
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const velocities = new Float32Array(PARTICLE_COUNT * 3)
    const colors = new Float32Array(PARTICLE_COUNT * 3)

    const goldColor = new THREE.Color(0xe8c35e)
    const whiteColor = new THREE.Color(0xffffff)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3
      positions[i3] = (Math.random() - 0.5) * FIELD_SIZE
      positions[i3 + 1] = (Math.random() - 0.5) * FIELD_SIZE
      positions[i3 + 2] = (Math.random() - 0.5) * FIELD_SIZE

      velocities[i3] = (Math.random() - 0.5) * DRIFT_SPEED
      velocities[i3 + 1] = (Math.random() - 0.5) * DRIFT_SPEED
      velocities[i3 + 2] = (Math.random() - 0.5) * DRIFT_SPEED * 0.3

      const isGold = Math.random() < 0.15
      const color = isGold ? goldColor : whiteColor
      const brightness = 0.3 + Math.random() * 0.5

      colors[i3] = color.r * brightness
      colors[i3 + 1] = color.g * brightness
      colors[i3 + 2] = color.b * brightness
    }

    const particleGeometry = new THREE.BufferGeometry()
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const particleMaterial = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const points = new THREE.Points(particleGeometry, particleMaterial)
    scene.add(points)

    /* ── Constellation Lines ── */
    const maxLines = PARTICLE_COUNT * 4
    const linePositions = new Float32Array(maxLines * 6)
    const lineColors = new Float32Array(maxLines * 6)

    const lineGeometry = new THREE.BufferGeometry()
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3))
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3))

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial)
    scene.add(lineSegments)

    /* ── Mouse tracking ── */
    const mouse = { x: 0, y: 0 }

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    }

    container.addEventListener('mousemove', handleMouseMove)

    /* ── Animation Loop ── */
    let animationId = 0

    const animate = () => {
      animationId = requestAnimationFrame(animate)

      const positionArray = particleGeometry.attributes.position.array as Float32Array

      /* Mouse world position */
      const mouseWorld = new THREE.Vector3(
        mouse.x * (FIELD_SIZE * 0.5),
        mouse.y * (FIELD_SIZE * 0.5),
        200,
      )

      /* Update particle positions */
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3

        positionArray[i3] += velocities[i3]
        positionArray[i3 + 1] += velocities[i3 + 1]
        positionArray[i3 + 2] += velocities[i3 + 2]

        /* Wrap around field boundaries */
        const half = FIELD_SIZE * 0.5
        for (let axis = 0; axis < 3; axis++) {
          if (positionArray[i3 + axis] > half) positionArray[i3 + axis] = -half
          if (positionArray[i3 + axis] < -half) positionArray[i3 + axis] = half
        }

        /* Mouse influence — subtle gravitational pull */
        const dx = mouseWorld.x - positionArray[i3]
        const dy = mouseWorld.y - positionArray[i3 + 1]
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < MOUSE_INFLUENCE_RADIUS && dist > 0.1) {
          const force = MOUSE_INFLUENCE_STRENGTH * (1 - dist / MOUSE_INFLUENCE_RADIUS)
          velocities[i3] += dx * force
          velocities[i3 + 1] += dy * force
        }

        /* Dampen velocities */
        velocities[i3] *= 0.999
        velocities[i3 + 1] *= 0.999
        velocities[i3 + 2] *= 0.999
      }

      particleGeometry.attributes.position.needsUpdate = true

      /* Update constellation lines */
      let lineIndex = 0

      for (let i = 0; i < PARTICLE_COUNT && lineIndex < maxLines; i++) {
        const ix = positionArray[i * 3]
        const iy = positionArray[i * 3 + 1]
        const iz = positionArray[i * 3 + 2]

        for (let j = i + 1; j < PARTICLE_COUNT && lineIndex < maxLines; j++) {
          const jx = positionArray[j * 3]
          const jy = positionArray[j * 3 + 1]
          const jz = positionArray[j * 3 + 2]

          const ddx = ix - jx
          const ddy = iy - jy
          const ddz = iz - jz
          const d = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz)

          if (d < CONNECTION_DISTANCE) {
            const alpha = 1 - d / CONNECTION_DISTANCE
            const li = lineIndex * 6

            linePositions[li] = ix
            linePositions[li + 1] = iy
            linePositions[li + 2] = iz
            linePositions[li + 3] = jx
            linePositions[li + 4] = jy
            linePositions[li + 5] = jz

            const brightness = alpha * 0.2

            lineColors[li] = brightness
            lineColors[li + 1] = brightness
            lineColors[li + 2] = brightness
            lineColors[li + 3] = brightness
            lineColors[li + 4] = brightness
            lineColors[li + 5] = brightness

            lineIndex++
          }
        }
      }

      lineGeometry.setDrawRange(0, lineIndex * 2)
      lineGeometry.attributes.position.needsUpdate = true
      lineGeometry.attributes.color.needsUpdate = true

      /* Slow camera drift */
      camera.position.x = Math.sin(Date.now() * 0.00005) * 30
      camera.position.y = Math.cos(Date.now() * 0.00004) * 20
      camera.lookAt(0, 0, 0)

      renderer.render(scene, camera)
    }

    animate()

    /* ── Resize ── */
    const handleResize = () => {
      const w = Math.max(container.clientWidth, 1)
      const h = Math.max(container.clientHeight, 1)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      container.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
      particleGeometry.dispose()
      particleMaterial.dispose()
      lineGeometry.dispose()
      lineMaterial.dispose()
      renderer.dispose()

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={cn('pointer-events-none fixed inset-0 z-0', className)}
    />
  )
}
