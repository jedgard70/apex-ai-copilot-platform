// BIM Knowledge & Skill Definitions
export const BIM_CAPABILITIES = [
  'IFC File Parsing',
  'WebGL 3D Visualization',
  'Clash Detection (Structural vs MEP)',
  'Quantity Takeoff (QTO)',
  'Autodesk Platform Services (APS) Integration'
]

export type BimModule = {
  id: string
  name: string
  description: string
  status: 'active' | 'development' | 'planned'
}

export const bimModules: BimModule[] = [
  {
    id: 'ifc-viewer',
    name: 'IFC Viewer (WebGL)',
    description: 'Renders 3D models directly in the browser using ifcopenshell and WebGL.',
    status: 'active'
  },
  {
    id: 'clash-detection',
    name: 'BIM Clash Detection',
    description: 'Identifies spatial conflicts between different engineering disciplines.',
    status: 'active'
  }
]
