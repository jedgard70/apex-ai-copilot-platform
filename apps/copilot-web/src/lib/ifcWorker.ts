import type { IfcAPI } from 'web-ifc'

export type IfcMeshData = {
  positions: Float32Array
  indices: Uint32Array
  color: { r: number; g: number; b: number; a: number }
}

let api: IfcAPI | null = null

async function resolveWasmPrefix(): Promise<string> {
  const candidates = ['/', '/wasm/', '/assets/']
  for (const prefix of candidates) {
    try {
      const res = await fetch(`${prefix}web-ifc.wasm`, { method: 'HEAD' })
      if (res.ok) return prefix
    } catch {
      // try next
    }
  }
  return '/'
}

async function getApi(): Promise<IfcAPI> {
  if (api) return api
  const { IfcAPI: IFC } = await import('web-ifc')
  api = new IFC()
  const prefix = await resolveWasmPrefix()
  await api.Init((path: string) => `${prefix}${path}`)
  return api
}

self.onmessage = async (e: MessageEvent) => {
  const { buffer } = e.data
  try {
    const ifcApi = await getApi()
    const data = new Uint8Array(buffer)
    const modelID = ifcApi.OpenModel(data, { COORDINATE_TO_ORIGIN: true })

    const meshes: IfcMeshData[] = []
    const transferables: ArrayBuffer[] = []

    try {
      ifcApi.StreamAllMeshes(modelID, (mesh) => {
        const placedGeometries = mesh.geometries
        for (let i = 0; i < placedGeometries.size(); i++) {
          const placed = placedGeometries.get(i)
          const geometry = ifcApi.GetGeometry(modelID, placed.geometryExpressID)
          const vData = ifcApi.GetVertexArray(geometry.GetVertexData(), geometry.GetVertexDataSize())
          const iData = ifcApi.GetIndexArray(geometry.GetIndexData(), geometry.GetIndexDataSize())

          // vData interleaves position (3 floats) + normal (3 floats) per vertex
          const vertexCount = vData.length / 6
          const positions = new Float32Array(vertexCount * 3)
          for (let v = 0; v < vertexCount; v++) {
            positions[v * 3] = vData[v * 6]
            positions[v * 3 + 1] = vData[v * 6 + 1]
            positions[v * 3 + 2] = vData[v * 6 + 2]
          }

          const indices = new Uint32Array(iData)

          meshes.push({
            positions,
            indices,
            color: {
              r: placed.color.x,
              g: placed.color.y,
              b: placed.color.z,
              a: placed.color.w,
            },
          })

          transferables.push(positions.buffer, indices.buffer)
          geometry.delete()
        }
      })
    } finally {
      ifcApi.CloseModel(modelID)
    }

    (self as any).postMessage({ ok: true, meshes }, transferables)
  } catch (error: any) {
    (self as any).postMessage({ ok: false, error: error?.message || 'Erro ao processar IFC no Worker' })
  }
}
