import type { IfcMeshData } from './ifcWorker'

export type { IfcMeshData }

export async function loadIfcGeometry(file: File): Promise<IfcMeshData[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const buffer = await file.arrayBuffer()
      const worker = new Worker(new URL('./ifcWorker.ts', import.meta.url), {
        type: 'module',
      })

      worker.onmessage = (e: MessageEvent) => {
        const { ok, meshes, error } = e.data
        if (ok) {
          resolve(meshes)
        } else {
          reject(new Error(error))
        }
        worker.terminate()
      }

      worker.onerror = (err) => {
        reject(new Error(err.message || 'Worker error'))
        worker.terminate()
      }

      worker.postMessage({ buffer }, [buffer])
    } catch (err) {
      reject(err)
    }
  })
}
