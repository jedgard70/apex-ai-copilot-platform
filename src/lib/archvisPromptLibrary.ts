export type ArchVisPromptStyle =
  | 'humanized-floor-plan'
  | 'photorealistic-facade'
  | 'interior-design'
  | 'futuristic-interior'
  | 'cinematic-real-estate'
  | 'technical-bim-mep'
  | 'topographic-hologram'
  | 'masterplan-overlay'
  | 'video-camera-movement'

export const archvisPromptStyleLabels: Record<ArchVisPromptStyle, string> = {
  'humanized-floor-plan': 'Humanized floor plan',
  'photorealistic-facade': 'Photorealistic facade',
  'interior-design': 'Interior design',
  'futuristic-interior': 'Futuristic interior',
  'cinematic-real-estate': 'Cinematic real estate',
  'technical-bim-mep': 'Technical BIM/MEP',
  'topographic-hologram': 'Topographic hologram',
  'masterplan-overlay': 'Masterplan overlay',
  'video-camera-movement': 'Video / camera movement',
}

export const archvisPromptLibrary = {
  promptAnatomy: {
    subject: 'Define the exact subject or asset being generated.',
    style: 'Name the visual style, realism level, architectural language and production goal.',
    detailsMaterials: 'Describe materials, finishes, vegetation, furniture, fixtures and construction details.',
    lighting: 'Define natural, artificial, indirect, cinematic or documentation lighting.',
    camera: 'Define camera angle, lens, composition, framing and movement when relevant.',
  },
  preserveExactHumanizedFloorPlan: [
    'Strict image-to-image transformation.',
    'Transform this exact uploaded architectural floor plan into a high-quality humanized floor plan visualization.',
    'Preserve layout, walls, openings, room positions, labels where possible, pool location, garage location, road/access, lot shape, proportions and top-down orthographic camera.',
    'No geometry change. No extra rooms. No missing rooms. No invented gardens. No redesigned layout.',
    'Only enhance existing zones with realistic materials, floor textures, furniture, existing landscaping, shadows, water, lighting and presentation quality.',
    'Treat unknown, blank, white or technical areas as unchanged neutral surfaces.',
    'High realism, clean architectural presentation, client-ready humanized plan.',
  ],
  creativeRedesign: [
    'Creative concept mode.',
    'The output may imagine and redesign the project for exploration.',
    'Clearly treat this as a creative concept, not a faithful plan or construction document.',
    'Explore stronger architecture, richer materials, better landscape mood and more cinematic presentation.',
  ],
  exteriorArchitecture: {
    minimalistResidence: 'Minimalist residence, clean volumes, warm concrete, glass, wood, refined landscape and photorealistic facade.',
    photorealisticFacade: 'Photorealistic facade render, realistic materials, accurate shadows, architectural scale and premium real estate presentation.',
    urbanBuilding: 'Urban building, contemporary street presence, facade rhythm, glazing, balconies, sidewalk context and city lighting.',
    ruralGuesthouse: 'Rural guesthouse, natural materials, quiet landscape, warm exterior lighting, human scale and hospitality atmosphere.',
    brutalistFuturistic: 'Brutalist/futuristic architecture, monolithic concrete, dramatic geometry, precise light, cinematic realism.',
    sustainableHouse: 'Sustainable house, passive design, green roof, solar cues, native landscaping, natural ventilation and low-impact materials.',
    coastalBeachHouse: 'Coastal/beach house, light materials, ocean breeze atmosphere, decks, sand-toned palette, vegetation and relaxed luxury.',
  },
  interiorFuturisticChecklist: [
    'Budget and finish level.',
    'Rooms to renovate.',
    'Palette and material direction.',
    'Polished concrete, porcelain, dark matte walls.',
    'Metal, leather, teak/freijo wood.',
    'LED linear lighting 4000-6500K.',
    'Indirect lighting.',
    'Minimal objects and clean composition.',
  ],
  cinematicCamera: [
    'eye-level',
    'low angle',
    'high angle',
    "bird's-eye / top-down",
    'front view',
    'side view',
    'rear view',
    '3/4 angle',
    'dolly in',
    'dolly out',
    'orbit',
    'flyover',
    'top reveal',
    'wide angle',
    'telephoto',
  ],
  technicalVisualization: [
    'masterplan overlay',
    'GIS/neon linework',
    'topographic hologram',
    'BIM/MEP comparison',
    'wireframe/hologram architecture',
    '3D text placement',
  ],
  negativePromptLibrary: [
    'changed geometry',
    'altered walls',
    'missing rooms',
    'extra rooms',
    'moved pool',
    'moved road',
    'invented garden',
    'added patio',
    'perspective distortion',
    'cartoon style',
    'unrealistic furniture scale',
    'misspelled labels',
    'filename text in image',
    'cropped plan',
    'garden continuation',
    'extra landscaping',
    'added deck',
    'extended vegetation',
    'filled blank area',
    'new exterior area',
    'invented service yard',
    'changed backyard',
    'added outdoor strip',
    'random plants outside original garden',
  ],
}

export const archvisCameraPresets = [
  'auto',
  'eye-level',
  'low angle',
  'high angle',
  "bird's-eye / top-down",
  'front view',
  'side view',
  'rear view',
  '3/4 angle',
  'dolly in',
  'dolly out',
  'orbit',
  'flyover',
  'top reveal',
  'wide angle',
  'telephoto',
] as const

export type ArchVisCameraPreset = (typeof archvisCameraPresets)[number]

export function getArchVisStylePrompt(style: ArchVisPromptStyle) {
  switch (style) {
    case 'humanized-floor-plan':
      return archvisPromptLibrary.preserveExactHumanizedFloorPlan.join('\n')
    case 'photorealistic-facade':
      return [
        archvisPromptLibrary.exteriorArchitecture.photorealisticFacade,
        archvisPromptLibrary.exteriorArchitecture.minimalistResidence,
        'Use realistic architectural scale, premium materials, correct facade lighting and polished sales-ready composition.',
      ].join('\n')
    case 'interior-design':
      return [
        'Interior design visualization.',
        'Use the active project context to create a coherent interior scene with furniture, materials, lighting and presentation quality.',
        'Clarify room function, circulation, finish palette and construction realism.',
      ].join('\n')
    case 'futuristic-interior':
      return [
        'Futuristic interior checklist:',
        ...archvisPromptLibrary.interiorFuturisticChecklist,
        'Create a polished, high-end interior concept with controlled lighting and minimal objects.',
      ].join('\n')
    case 'cinematic-real-estate':
      return [
        'Cinematic real estate visualization.',
        `Camera language: ${archvisPromptLibrary.cinematicCamera.join(', ')}.`,
        'Use realistic lens behavior, dramatic but clean lighting, client-ready composition and sales atmosphere.',
      ].join('\n')
    case 'technical-bim-mep':
      return [
        'Technical BIM/MEP visualization.',
        'Use clean documentation style, precise linework, BIM/MEP comparison, wireframe/hologram architecture and legible technical overlays.',
        'Avoid decorative clutter; make systems, layers and coordination readable.',
      ].join('\n')
    case 'topographic-hologram':
      return [
        'Topographic hologram visualization.',
        'Use topographic terrain, GIS/neon linework, holographic contours, site levels and technical depth.',
      ].join('\n')
    case 'masterplan-overlay':
      return [
        'Masterplan overlay visualization.',
        'Use clean site planning, zones, circulation, landscape areas, roads, access logic and subtle 3D text placement where appropriate.',
      ].join('\n')
    case 'video-camera-movement':
      return [
        'Video / camera movement planning.',
        `Movement language: ${archvisPromptLibrary.cinematicCamera.join(', ')}.`,
        'Think in shot sequence, reveal, orbit, flyover, dolly and cinematic real estate presentation.',
      ].join('\n')
  }
}

export function getArchVisNegativePrompt(style: ArchVisPromptStyle, lockBoundaries: boolean) {
  const base = [...archvisPromptLibrary.negativePromptLibrary]
  if (style !== 'humanized-floor-plan' && !lockBoundaries) {
    return [
      'low quality',
      'bad lighting',
      'blurry textures',
      'cartoon style',
      'unrealistic furniture scale',
      'misspelled labels',
      'filename text in image',
    ].join(', ')
  }
  return base.join(', ')
}
