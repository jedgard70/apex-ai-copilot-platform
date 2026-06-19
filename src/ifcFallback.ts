// src/ifcFallback.ts
// Fallback conversion using IfcOpenShell WASM
// This module can be imported by the BIM Viewer when IFC parsing fails.

export async function convertIfcToGlb(ifcArrayBuffer: ArrayBuffer): Promise<ArrayBuffer> {
  // Dynamically import the WASM module
  const { default: ifcOpenShell } = await import('@ifcopenshell/wasm');
  // Load the WASM instance (if not already loaded)
  const wasmModule = ifcOpenShell.getInstance();
  // Convert IFC to GLB (example function)
  const glbBuffer = await wasmModule.ifcToGlb(ifcArrayBuffer);
  return glbBuffer;
}

// Helper to load the WASM module if not already loaded
export function loadIfcOpenShell(): Promise<void> {
  if (window.ifcopenshell) {
    return Promise.resolve();
  }
  return import('@ifcopenshell/wasm').then(module => {
    window.ifcopenshell = module.default;
  });
}
