import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
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

function CameraController({ viewerCommand, meshes }: { viewerCommand?: { id: string; text: string }; meshes: IfcMeshData[] }) {
  const { camera, scene } = useThree()
  const originalColorsRef = useRef<Map<THREE.Mesh, THREE.Color>>(new Map())

  useEffect(() => {
    originalColorsRef.current.clear()
  }, [meshes])

  useEffect(() => {
    if (!viewerCommand?.text) return
    const text = viewerCommand.text.toLowerCase()

    const sceneMeshes: THREE.Mesh[] = []
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        sceneMeshes.push(child)
      }
    })

    if (originalColorsRef.current.size === 0) {
      sceneMeshes.forEach((mesh) => {
        const mat = mesh.material as THREE.MeshLambertMaterial
        if (mat && mat.color) {
          originalColorsRef.current.set(mesh, mat.color.clone())
        }
      })
    }

    sceneMeshes.forEach((mesh) => {
      const mat = mesh.material as THREE.MeshLambertMaterial
      if (mat) {
        const origColor = originalColorsRef.current.get(mesh)
        if (origColor) mat.color.copy(origColor)
        mat.transparent = false
        mat.opacity = 1
        mat.needsUpdate = true
      }
    })

    let targetPos = new THREE.Vector3(20, 20, 40)
    let lookAtPos = new THREE.Vector3(0, 0, 0)
    let animate = false

    if (text.includes('topo') || text.includes('top')) {
      targetPos.set(0, 50, 0.1)
      animate = true
    } else if (text.includes('frente') || text.includes('front') || text.includes('frontal')) {
      targetPos.set(0, 0, 50)
      animate = true
    } else if (text.includes('lateral') || text.includes('lado') || text.includes('side')) {
      targetPos.set(50, 0, 0)
      animate = true
    } else if (text.includes('rotacione') || text.includes('rotacionar') || text.includes('gire') || text.includes('girar') || text.includes('camera') || text.includes('câmera') || text.includes('orbitar')) {
      targetPos.set(30, 30, 30)
      animate = true
    } else if (text.includes('inconsistencia') || text.includes('inconsistência') || text.includes('isole') || text.includes('isolar') || text.includes('foca') || text.includes('focar') || text.includes('zoom') || text.includes('destacar')) {
      targetPos.set(12, 12, 12)
      animate = true
    }

    if (animate) {
      let count = 0
      const startPos = camera.position.clone()
      const duration = 30
      const animateCamera = () => {
        if (count >= duration) return
        count++
        camera.position.lerpVectors(startPos, targetPos, count / duration)
        camera.lookAt(lookAtPos)
        requestAnimationFrame(animateCamera)
      }
      animateCamera()
    }

    const isIsolation = text.includes('isole') || text.includes('isolar') || text.includes('inconsistencia') || text.includes('inconsistência') || text.includes('foca') || text.includes('focar') || text.includes('destacar')
    
    if (isIsolation && sceneMeshes.length > 0) {
      const highlightIndices = [Math.floor(sceneMeshes.length / 3), Math.floor(sceneMeshes.length / 2)].filter(i => i < sceneMeshes.length)
      
      sceneMeshes.forEach((mesh, index) => {
        const mat = mesh.material as THREE.MeshLambertMaterial
        if (mat) {
          if (highlightIndices.includes(index) || highlightIndices.length === 0) {
            mat.color.setRGB(1.0, 0.2, 0.2)
            mat.transparent = false
            mat.opacity = 1.0
          } else {
            mat.transparent = true
            mat.opacity = 0.15
          }
          mat.needsUpdate = true
        }
      })
    }
  }, [viewerCommand?.id, camera, scene, meshes])

  return null
}

type Status = 'idle' | 'loading' | 'ready' | 'error'

export function IfcViewer({ file, viewerCommand }: { file: File; viewerCommand?: { id: string; text: string } }) {
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
          <CameraController viewerCommand={viewerCommand} meshes={meshes} />
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
