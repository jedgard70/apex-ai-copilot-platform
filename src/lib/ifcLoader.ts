import type { IfcAPI } from 'web-ifc'

export type IfcMeshData = {
  positions: Float32Array
  indices: Uint32Array
  color: { r: number; g: number; b: number; a: number }
}

let api: IfcAPI | null = null

async function getApi(): Promise<IfcAPI> {
  if (api) return api
  const { IfcAPI: IFC } = await import('web-ifc')
  api = new IFC()
  await api.Init((path: string, prefix: string) => prefix + path)
  return api
}

export async function loadIfcGeometry(file: File): Promise<IfcMeshData[]> {
  const ifcApi = await getApi()
  const buffer = await file.arrayBuffer()
  const data = new Uint8Array(buffer)
  const modelID = ifcApi.OpenModel(data, { COORDINATE_TO_ORIGIN: true })

  const meshes: IfcMeshData[] = []

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

        meshes.push({
          positions,
          indices: new Uint32Array(iData),
          color: {
            r: placed.color.x,
            g: placed.color.y,
            b: placed.color.z,
            a: placed.color.w,
          },
        })

        geometry.delete()
      }
    })
  } finally {
    ifcApi.CloseModel(modelID)
  }

  return meshes
}
