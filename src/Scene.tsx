import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Icosahedron } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

function Snow({ count = 900 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null!)
  const positions = useMemo(() => {
    const p = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) { p[i * 3] = (Math.random() - 0.5) * 22; p[i * 3 + 1] = (Math.random() - 0.5) * 14; p[i * 3 + 2] = (Math.random() - 0.5) * 12 }
    return p
  }, [count])
  useFrame((s, dt) => {
    const a = ref.current.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < count; i++) {
      let y = a.getY(i) - dt * (0.35 + (i % 7) * 0.06)
      if (y < -7) y = 7
      a.setY(i, y); a.setX(i, a.getX(i) + Math.sin(s.clock.elapsedTime * 0.5 + i) * dt * 0.08)
    }
    a.needsUpdate = true
    ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, s.pointer.x * 0.15, 0.03)
  })
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial size={0.04} color="#dbeeff" transparent opacity={0.75} depthWrite={false} sizeAttenuation />
    </points>
  )
}

function Crystal({ progress }: { progress: { get: () => number } }) {
  const g = useRef<THREE.Group>(null!)
  useFrame((s, dt) => {
    const p = progress.get()
    g.current.rotation.y += dt * 0.18
    g.current.rotation.x = THREE.MathUtils.lerp(g.current.rotation.x, s.pointer.y * 0.4 + p * 1.2, 0.05)
    g.current.rotation.z = THREE.MathUtils.lerp(g.current.rotation.z, -s.pointer.x * 0.3, 0.05)
    const sc = 1 + p * 0.25; g.current.scale.setScalar(sc)
  })
  return (
    <group ref={g}>
      <Float speed={1.4} floatIntensity={0.6} rotationIntensity={0.3}>
        <Icosahedron args={[1.25, 0]}>
          <meshPhysicalMaterial color="#bcdcff" roughness={0.12} metalness={0.1} transmission={0.6} thickness={1} clearcoat={1} flatShading transparent opacity={0.85} />
        </Icosahedron>
        <Icosahedron args={[1.32, 0]}><meshBasicMaterial wireframe color="#e9c88a" transparent opacity={0.35} /></Icosahedron>
        <mesh rotation={[Math.PI / 2.3, 0, 0]}><torusGeometry args={[2.6, 0.006, 8, 160]} /><meshBasicMaterial color="#8fc6ff" transparent opacity={0.6} /></mesh>
        <mesh rotation={[Math.PI / 1.8, 0.4, 0]}><torusGeometry args={[3.1, 0.004, 8, 160]} /><meshBasicMaterial color="#e9c88a" transparent opacity={0.45} /></mesh>
      </Float>
    </group>
  )
}

export function SnowOverlay() {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 8], fov: 55 }} gl={{ alpha: true, antialias: false }}>
      <Snow count={700} />
    </Canvas>
  )
}

export function CrystalScene({ progress }: { progress: { get: () => number } }) {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 7], fov: 45 }} gl={{ alpha: true }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 5, 3]} intensity={2.2} color="#ffe2b0" />
      <directionalLight position={[-5, -2, -3]} intensity={1.4} color="#7fb8ff" />
      <Crystal progress={progress} />
      <Snow count={350} />
    </Canvas>
  )
}
