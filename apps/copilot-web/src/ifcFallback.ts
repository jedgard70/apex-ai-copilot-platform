// src/ifcFallback.ts
// Fallback conversion using IfcOpenShell WASM
// This module can be imported by the BIM Viewer when IFC parsing fails.

export async function convertIfcToGlb(ifcArrayBuffer: ArrayBuffer): Promise<ArrayBuffer> {
  // Try dynamic import; ignore TypeScript resolution errors if package missing
  // @ts-ignore
  const module = await import('@' + 'ifcopenshell/wasm').catch(() => null);
  if (!module || !module.default) {
    throw new Error('IfcOpenShell WASM not available');
  }
  const ifcOpenShell = module.default;
  const wasmModule = ifcOpenShell.getInstance && ifcOpenShell.getInstance();
  if (!wasmModule || typeof wasmModule.ifcToGlb !== 'function') {
    throw new Error('IfcOpenShell WASM instance not available');
  }
  const glbBuffer = await wasmModule.ifcToGlb(ifcArrayBuffer);
  return glbBuffer;
}

// Helper to load the WASM module if not already loaded
export function loadIfcOpenShell(): Promise<void> {
  if ((window as any).ifcopenshell) {
    return Promise.resolve();
  }
  // @ts-ignore
  return import('@' + 'ifcopenshell/wasm')
    .then(module => {
      (window as any).ifcopenshell = module.default;
    })
    .catch(() => undefined);
}
