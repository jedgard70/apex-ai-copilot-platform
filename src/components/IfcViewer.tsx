import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, GizmoHelper, GizmoViewport } from '@react-three/drei'
import * as THREE from 'three'
import { loadIfcGeometry, type IfcMeshData } from '../lib/ifcLoader'

function IfcMesh({ data }: { data: IfcMeshData }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(data.positions, 3))
    g.setIndex(new THREE.BufferAttribute(data.indices, 1))
    g.computeVertexNormals()
    return g
  }, [data])

  const color = useMemo(
    () => new THREE.Color(data.color.r, data.color.g, data.color.b),
    [data.color]
  )

  return (
    <mesh geometry={geo}>
      <meshLambertMaterial
        color={color}
        transparent={data.color.a < 1}
        opacity={data.color.a}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function Scene({ meshes }: { meshes: IfcMeshData[] }) {
  const groupRef = useRef<THREE.Group>(null)

  useEffect(() => {
    if (!groupRef.current || meshes.length === 0) return
    const box = new THREE.Box3().setFromObject(groupRef.current)
    const center = box.getCenter(new THREE.Vector3())
    groupRef.current.position.sub(center)
  }, [meshes])

  return (
    <group ref={groupRef}>
      {meshes.map((m, i) => (
        <IfcMesh key={i} data={m} />
      ))}
    </group>
  )
}

type Status = 'idle' | 'loading' | 'ready' | 'error'

export function IfcViewer({ file }: { file: File }) {
  const [meshes, setMeshes] = useState<IfcMeshData[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<File | null>(null)

  useEffect(() => {
    if (fileRef.current === file) return
    fileRef.current = file
    setStatus('loading')
    setError(null)
    loadIfcGeometry(file)
      .then((data) => {
        setMeshes(data)
        setStatus('ready')
      })
      .catch((err) => {
        setError(err?.message ?? 'Erro ao carregar IFC')
        setStatus('error')
      })
  }, [file])

  if (status === 'loading') {
    return (
      <div className="ifc-viewer-overlay">
        <div className="ifc-viewer-spinner" />
        <span>Carregando modelo IFC…</span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="ifc-viewer-overlay ifc-viewer-error">
        <span>⚠ Erro ao processar IFC</span>
        {error && <small>{error}</small>}
      </div>
    )
  }

  if (status === 'idle') return null

  return (
    <div className="ifc-viewer-canvas-wrap">
      <Canvas
        camera={{ position: [20, 20, 40], fov: 55, near: 0.1, far: 5000 }}
        gl={{ antialias: true }}
        shadows
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[50, 100, 50]} intensity={0.8} castShadow />
        <Suspense fallback={null}>
          <Scene meshes={meshes} />
        </Suspense>
        <OrbitControls makeDefault />
        <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
          <GizmoViewport />
        </GizmoHelper>
      </Canvas>
      <div className="ifc-viewer-badge">
        {meshes.length} elementos · {file.name}
      </div>
    </div>
  )
}
