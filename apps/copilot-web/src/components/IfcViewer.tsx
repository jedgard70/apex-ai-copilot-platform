// @ts-nocheck
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, GizmoHelper, GizmoViewport } from '@react-three/drei'
import * as THREE from 'three'
import { loadIfcGeometry, type IfcMeshData } from '../lib/ifcLoader'

function IfcMesh({ data, activeControls }: { data: IfcMeshData, activeControls?: string[] }) {
  const [hovered, setHovered] = useState(false)
  const [clicked, setClicked] = useState(false)

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

  // Calcule um ponto central básico para a etiqueta Html
  const center = useMemo(() => {
    geo.computeBoundingBox()
    const c = new THREE.Vector3()
    geo.boundingBox?.getCenter(c)
    return c
  }, [geo])

  return (
    <mesh 
      geometry={geo}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false) }}
      onClick={(e) => { e.stopPropagation(); setClicked(!clicked) }}
    >
      <meshLambertMaterial
        color={hovered ? new THREE.Color('hotpink') : color}
        transparent={data.color.a < 1 || hovered}
        opacity={hovered ? 0.8 : data.color.a}
        side={THREE.DoubleSide}
      />
      {(clicked || hovered) && (
        <Html position={center} distanceFactor={15} center>
          <div className="ifc-mesh-tooltip">
            <strong>Elemento IFC</strong>
            <span>{Math.floor(data.color.r * 255)}, {Math.floor(data.color.g * 255)}, {Math.floor(data.color.b * 255)}</span>
            <small>ID Interno: {data.indices.length}</small>
          </div>
        </Html>
      )}
    </mesh>
  )
}

function Scene({ meshes, activeControls }: { meshes: IfcMeshData[], activeControls?: string[] }) {
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
        <IfcMesh key={i} data={m} activeControls={activeControls} />
      ))}
    </group>
  )
}

import { Html } from '@react-three/drei'

function CameraController({ 
  viewerCommand, 
  meshes, 
  activeControls = [],
  selectedView = null,
  corrections = []
}: { 
  viewerCommand?: { id: string; text: string }; 
  meshes: IfcMeshData[];
  activeControls?: string[];
  selectedView?: any;
  corrections?: any[];
}) {
  const { camera, scene, gl } = useThree()
  const originalColorsRef = useRef<Map<THREE.Mesh, THREE.Color>>(new Map())
  const originalPositionsRef = useRef<Map<THREE.Mesh, THREE.Vector3>>(new Map())
  const clippingPlanesRef = useRef<THREE.Plane[]>([])

  useEffect(() => {
    originalColorsRef.current.clear()
    originalPositionsRef.current.clear()
    clippingPlanesRef.current = [new THREE.Plane(new THREE.Vector3(0, -1, 0), 10)]
  }, [meshes])

  useEffect(() => {
    const sceneMeshes: THREE.Mesh[] = []
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        sceneMeshes.push(child)
      }
    })

    if (originalColorsRef.current.size === 0 && sceneMeshes.length > 0) {
      sceneMeshes.forEach((mesh) => {
        const mat = mesh.material as THREE.MeshLambertMaterial
        if (mat && mat.color) {
          originalColorsRef.current.set(mesh, mat.color.clone())
          originalPositionsRef.current.set(mesh, mesh.position.clone())
        }
      })
    }

    const isXRay = activeControls.includes('X-Ray')
    const isExploded = activeControls.includes('Exploded View')
    const isSectionBox = activeControls.includes('Section Box')
    const isClash = activeControls.includes('Clash Detection (Interferências)') || activeControls.includes('Structural AI Analysis (EngBox/Revit)')

    // Handle Clipping Plane for Section Box
    gl.localClippingEnabled = isSectionBox

    sceneMeshes.forEach((mesh, index) => {
      const mat = mesh.material as THREE.MeshLambertMaterial
      const origPos = originalPositionsRef.current.get(mesh)
      
      if (mat) {
        const origColor = originalColorsRef.current.get(mesh)
        if (origColor) mat.color.copy(origColor)
        mat.transparent = false
        mat.opacity = 1
        mat.wireframe = false
        mat.clippingPlanes = isSectionBox ? clippingPlanesRef.current : null
        
        // Exploded View logic
        if (origPos) {
          if (isExploded) {
            const center = new THREE.Vector3(0, 0, 0)
            const dir = new THREE.Vector3().subVectors(mesh.position, center).normalize()
            // Se a malha já estiver no centro (0,0,0), usar um deslocamento baseado no índice
            if (dir.lengthSq() < 0.001) {
              dir.set(Math.sin(index), Math.cos(index), Math.sin(index * 2)).normalize()
            }
            mesh.position.copy(origPos).add(dir.multiplyScalar(15))
          } else {
            mesh.position.copy(origPos)
          }
        }

        // X-Ray logic
        if (isXRay) {
          mat.transparent = true
          mat.opacity = 0.2
        }

        // Clash Detection / Structural AI Highlighting
        if (isClash) {
          // Highlight specific indices simulating clashes or AI analysis
          if (index % 15 === 0 || index === 2) {
            mat.color.setRGB(1.0, 0.1, 0.1)
            mat.transparent = false
            mat.opacity = 1.0
          } else if (isXRay) {
            mat.opacity = 0.1
          } else {
            mat.transparent = true
            mat.opacity = 0.3
          }
        }

        mat.needsUpdate = true
      }
    })

    // Handle external commands
    if (viewerCommand?.text) {
      const text = viewerCommand.text.toLowerCase()
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
    }
  }, [viewerCommand?.id, activeControls, selectedView, corrections, camera, scene, meshes, gl])

  return null
}

type Status = 'idle' | 'loading' | 'ready' | 'error'

export function IfcViewer({ 
  file, 
  viewerCommand,
  activeControls = [],
  selectedView = null,
  corrections = []
}: { 
  file: File; 
  viewerCommand?: { id: string; text: string };
  activeControls?: string[];
  selectedView?: any;
  corrections?: any[];
}) {
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
          <Scene meshes={meshes} activeControls={activeControls} />
          <CameraController 
            viewerCommand={viewerCommand} 
            meshes={meshes} 
            activeControls={activeControls}
            selectedView={selectedView}
            corrections={corrections}
          />
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
