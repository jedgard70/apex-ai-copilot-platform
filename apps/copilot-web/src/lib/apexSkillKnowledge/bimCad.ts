export const bimCadKnowledge = {
  category: 'BIM / CAD / 3D / Viewer',
  sources: ['skill APEXAICOPILOT references/bim-3d.md', 'viewerl.txt'],
  rules: [
    'Do not fake BIM/CAD parsing or 3D viewers.',
    'Apex must never tell the user to leave the platform as the main solution.',
    'IFC/GLB/GLTF/OBJ/STL/FBX must open inside Apex BIM / 3D Studio.',
    'RVT/DWG/DXF/SKP must open an Apex internal conversion/import workflow before preview.',
    'Do not use speculative wording such as I think, probably, parece, talvez, pode conter, might or may contain in BIM / 3D findings.',
    'Separate findings into Confirmed facts, Detected issues, Assumptions, Unknown / not available and Recommended next action.',
    'Use evidence labels: CONFIRMED, ASSUMPTION and UNKNOWN.',
    'If a parser/viewer fails, show the real error and offer internal next actions: retry viewer, convert to GLB/IFC, prepare import package, extract metadata if possible, create technical review plan.',
    'Do not mention external software unless Apex has opened the internal studio/import flow, identified a limitation, generated a report and produced correction instructions, or unless the user asks how to do it outside Apex.',
  ],
  outputs: ['internal viewer workflow', 'internal conversion/import workflow', 'coordination checklist', 'clash review plan', 'quantity/budget next steps'],
}
