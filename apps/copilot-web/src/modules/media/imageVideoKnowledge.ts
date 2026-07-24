// Media, Image, Video, and Animation Knowledge & Skill Definitions
export const MEDIA_CAPABILITIES = [
  'Image Generation (ArchVis) via Fal.ai',
  "Video Generation (Director's Cut) via Kling",
  'FFmpeg Slideshow rendering',
  'Avatar Video Pipelines',
  'Prompt Enhancement for Text-to-Image'
]

export type MediaModule = {
  id: string
  name: string
  description: string
  status: 'active' | 'development' | 'planned'
}

export const mediaModules: MediaModule[] = [
  {
    id: 'archvis-studio',
    name: 'ArchVis Studio',
    description: 'Generates photorealistic images using AI based on architectural prompts.',
    status: 'active'
  },
  {
    id: 'directors-cut',
    name: "Director's Cut Studio",
    description: 'Video timeline, AI video generation, and FFmpeg compiling.',
    status: 'active'
  },
  {
    id: 'avatar-pipeline',
    name: 'Avatar Synthesis Pipeline',
    description: 'Creates training/VSL avatars using AI generation.',
    status: 'development'
  }
]
