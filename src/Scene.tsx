import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Icosahedron, Environment, Lightformer, Sparkles } from '@react-three/drei'
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
  const inner = useRef<THREE.Mesh>(null!)
  useFrame((s, dt) => {
    const p = progress.get()
    g.current.rotation.y += dt * 0.16
    g.current.rotation.x = THREE.MathUtils.lerp(g.current.rotation.x, s.pointer.y * 0.4 + p * 1.2, 0.05)
    g.current.rotation.z = THREE.MathUtils.lerp(g.current.rotation.z, -s.pointer.x * 0.3, 0.05)
    g.current.scale.setScalar(1 + p * 0.2)
    inner.current.rotation.y -= dt * 0.5; inner.current.rotation.x += dt * 0.2
  })
  return (
    <group ref={g}>
      <Float speed={1.4} floatIntensity={0.6} rotationIntensity={0.3}>
        <Icosahedron args={[1.3, 0]}>
          <meshPhysicalMaterial color="#d6ebff" roughness={0.04} metalness={0} transmission={1} thickness={1.6} ior={1.31} clearcoat={1} clearcoatRoughness={0.05}
            iridescence={0.6} iridescenceIOR={1.3} envMapIntensity={2.2} flatShading attenuationColor="#9fd0ff" attenuationDistance={2.5} />
        </Icosahedron>
        <mesh ref={inner}><octahedronGeometry args={[0.42, 0]} /><meshStandardMaterial color="#e9c88a" metalness={1} roughness={0.15} envMapIntensity={2.5} emissive="#5a3e10" emissiveIntensity={0.25} /></mesh>
        <Icosahedron args={[1.36, 0]}><meshBasicMaterial wireframe color="#e9c88a" transparent opacity={0.28} /></Icosahedron>
        <mesh rotation={[Math.PI / 2.3, 0, 0]}><torusGeometry args={[2.4, 0.005, 8, 200]} /><meshBasicMaterial color="#8fc6ff" transparent opacity={0.55} /></mesh>
        <mesh rotation={[Math.PI / 1.8, 0.4, 0]}><torusGeometry args={[2.85, 0.004, 8, 200]} /><meshBasicMaterial color="#e9c88a" transparent opacity={0.5} /></mesh>
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
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 7], fov: 45 }} gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 5, 3]} intensity={2.4} color="#ffe2b0" />
      <directionalLight position={[-5, -2, -3]} intensity={1.6} color="#7fb8ff" />
      <pointLight position={[0, 0, 0]} intensity={4} distance={4} color="#e9c88a" />
      {/* local studio environment (no network HDR) for reflections */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3} color="#ffe6bf" position={[3, 3, 3]} scale={[4, 1.2, 1]} />
        <Lightformer form="rect" intensity={2.4} color="#a9d4ff" position={[-4, 0, 2]} rotation-y={Math.PI / 2} scale={[6, 1, 1]} />
        <Lightformer form="ring" intensity={2} color="#ffffff" position={[0, 4, -4]} scale={2.5} />
        <Lightformer form="rect" intensity={1.2} color="#e9c88a" position={[0, -4, 1]} rotation-x={Math.PI / 2} scale={[8, 2, 1]} />
      </Environment>
      <Crystal progress={progress} />
      <Sparkles count={60} scale={[7, 7, 4]} size={2} speed={0.25} color="#e9c88a" opacity={0.7} />
      <Snow count={300} />
    </Canvas>
  )
}
