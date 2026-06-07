export const bimCadKnowledge = {
  category: 'BIM / CAD / 3D / Viewer',
  sources: ['skill APEXAICOPILOT references/bim-3d.md', 'viewerl.txt'],
  rules: [
    'Do not fake BIM/CAD parsing or 3D viewers.',
    'IFC requires real viewer/loading path.',
    'RVT/DWG/DXF/SKP require conversion/import strategy before preview.',
    'For unsupported files, use metadata honestly and guide the next action.',
  ],
  outputs: ['viewer strategy', 'coordination checklist', 'clash review plan', 'quantity/budget next steps'],
}
