/**
 * fal.ai Model Registry
 * Comprehensive catalog of all available fal.ai models with capabilities,
 * input schemas, pricing tiers, and routing info.
 *
 * Categories: video-t2v, video-i2v, video-i2v-firstlast, image-t2i, image-i2i, tts, avatar
 */

export const FAL_MODELS = [
  // ─── VIDEO — Text to Video ────────────────────────────────────────────────

  {
    id: 'kling-video/v3/pro/text-to-video',
    label: 'Kling 3.0 Pro (T2V)',
    lab: 'Kling',
    category: 'video-t2v',
    tier: 'pro',
    description: 'Top-tier text-to-video with cinematic visuals, fluid motion, native audio.',
    supportsAudio: true,
    supportsFirstLastFrame: false,
    maxDuration: 10,
    aspectRatios: ['16:9', '9:16', '1:1'],
    inputFields: { prompt: 'string', duration: 'string', aspect_ratio: 'string' },
  },
  {
    id: 'kling-video/v3/standard/text-to-video',
    label: 'Kling 3.0 Standard (T2V)',
    lab: 'Kling',
    category: 'video-t2v',
    tier: 'standard',
    description: 'Kling 3.0 Standard: cinematic visuals and native audio, lower cost.',
    supportsAudio: true,
    supportsFirstLastFrame: false,
    maxDuration: 10,
    aspectRatios: ['16:9', '9:16', '1:1'],
    inputFields: { prompt: 'string', duration: 'string', aspect_ratio: 'string' },
  },
  {
    id: 'kling-video/v2.6/pro/text-to-video',
    label: 'Kling 2.6 Pro (T2V)',
    lab: 'Kling',
    category: 'video-t2v',
    tier: 'pro',
    description: 'Kling 2.6 Pro with native audio.',
    supportsAudio: true,
    maxDuration: 10,
    aspectRatios: ['16:9', '9:16', '1:1'],
    inputFields: { prompt: 'string', duration: 'string', aspect_ratio: 'string' },
  },
  {
    id: 'kling-video/v2.5-turbo/pro/text-to-video',
    label: 'Kling 2.5 Turbo Pro (T2V)',
    lab: 'Kling',
    category: 'video-t2v',
    tier: 'pro',
    description: 'Kling 2.5 Turbo Pro: motion fluidity and exceptional prompt precision.',
    supportsAudio: false,
    maxDuration: 10,
    aspectRatios: ['16:9', '9:16', '1:1'],
    inputFields: { prompt: 'string', duration: 'string', aspect_ratio: 'string' },
  },
  {
    id: 'kling-video/v2.1/standard/text-to-video',
    label: 'Kling 2.1 Standard (T2V)',
    lab: 'Kling',
    category: 'video-t2v',
    tier: 'standard',
    description: 'Kling 2.1 Standard for cost-effective generation.',
    supportsAudio: false,
    maxDuration: 10,
    aspectRatios: ['16:9', '9:16', '1:1'],
    inputFields: { prompt: 'string', duration: 'string', aspect_ratio: 'string' },
  },
  {
    id: 'kling-video/v1.6/standard/text-to-video',
    label: 'Kling 1.6 Standard (T2V)',
    lab: 'Kling',
    category: 'video-t2v',
    tier: 'standard',
    description: 'Kling 1.6 Standard — tested, confirmed working.',
    supportsAudio: false,
    maxDuration: 10,
    aspectRatios: ['16:9', '9:16', '1:1'],
    inputFields: { prompt: 'string', duration: 'string', aspect_ratio: 'string' },
    default: true,
  },
  {
    id: 'bytedance/seedance-2.0/text-to-video',
    label: 'Seedance 2.0 (T2V)',
    lab: 'ByteDance',
    category: 'video-t2v',
    tier: 'pro',
    description: 'ByteDance\'s most advanced T2V. Cinematic, native audio, multi-shot, real-world physics.',
    supportsAudio: true,
    maxDuration: 10,
    aspectRatios: ['16:9', '9:16', '1:1'],
    inputFields: { prompt: 'string', duration: 'number', aspect_ratio: 'string' },
    featured: true,
  },
  {
    id: 'bytedance/seedance-2.0/fast/text-to-video',
    label: 'Seedance 2.0 Fast (T2V)',
    lab: 'ByteDance',
    category: 'video-t2v',
    tier: 'standard',
    description: 'Seedance 2.0 fast tier — lower latency and cost.',
    supportsAudio: true,
    maxDuration: 10,
    aspectRatios: ['16:9', '9:16', '1:1'],
    inputFields: { prompt: 'string', duration: 'number', aspect_ratio: 'string' },
  },
  {
    id: 'veo3.1',
    label: 'Veo 3.1 (T2V)',
    lab: 'Google',
    category: 'video-t2v',
    tier: 'pro',
    description: 'Google\'s most advanced video model. Audio on! Photorealistic.',
    supportsAudio: true,
    maxDuration: 8,
    aspectRatios: ['16:9', '9:16', '1:1'],
    inputFields: { prompt: 'string', aspect_ratio: 'string' },
    featured: true,
  },
  {
    id: 'veo3.1/fast',
    label: 'Veo 3.1 Fast (T2V)',
    lab: 'Google',
    category: 'video-t2v',
    tier: 'standard',
    description: 'Faster and cheaper Veo 3.1.',
    supportsAudio: true,
    maxDuration: 8,
    aspectRatios: ['16:9', '9:16'],
    inputFields: { prompt: 'string', aspect_ratio: 'string' },
  },
  {
    id: 'veo3',
    label: 'Veo 3 (T2V)',
    lab: 'Google',
    category: 'video-t2v',
    tier: 'pro',
    description: 'Google Veo 3 with audio.',
    supportsAudio: true,
    maxDuration: 8,
    aspectRatios: ['16:9', '9:16'],
    inputFields: { prompt: 'string', aspect_ratio: 'string' },
  },
  {
    id: 'sora-2/text-to-video',
    label: 'Sora 2 (T2V)',
    lab: 'OpenAI',
    category: 'video-t2v',
    tier: 'pro',
    description: 'OpenAI Sora 2 — richly detailed, dynamic clips with audio.',
    supportsAudio: true,
    maxDuration: 20,
    aspectRatios: ['16:9', '9:16', '1:1'],
    inputFields: { prompt: 'string', duration: 'number', aspect_ratio: 'string' },
    featured: true,
  },
  {
    id: 'xai/grok-imagine-video/text-to-video',
    label: 'Grok Imagine Video (T2V)',
    lab: 'xAI',
    category: 'video-t2v',
    tier: 'pro',
    description: 'xAI Grok Imagine Video with audio.',
    supportsAudio: true,
    maxDuration: 10,
    aspectRatios: ['16:9', '9:16'],
    inputFields: { prompt: 'string', aspect_ratio: 'string' },
  },
  {
    id: 'minimax/hailuo-02/standard/text-to-video',
    label: 'MiniMax Hailuo-02 (T2V)',
    lab: 'MiniMax',
    category: 'video-t2v',
    tier: 'standard',
    description: 'MiniMax Hailuo-02 Standard 768p video.',
    supportsAudio: false,
    maxDuration: 10,
    aspectRatios: ['16:9', '9:16', '1:1'],
    inputFields: { prompt: 'string', duration: 'number', aspect_ratio: 'string' },
  },
  {
    id: 'wan/v2.2-a14b/text-to-video',
    label: 'Wan 2.2 (T2V)',
    lab: 'Alibaba',
    category: 'video-t2v',
    tier: 'standard',
    description: 'Wan 2.2 — high visual quality and motion diversity.',
    supportsAudio: false,
    maxDuration: 10,
    aspectRatios: ['16:9', '9:16', '1:1'],
    inputFields: { prompt: 'string', num_frames: 'number' },
  },
  {
    id: 'wan/v2.7/text-to-video',
    label: 'Wan 2.7 (T2V)',
    lab: 'Alibaba',
    category: 'video-t2v',
    tier: 'standard',
    description: 'Wan 2.7 — enhanced motion smoothness and scene fidelity.',
    supportsAudio: false,
    maxDuration: 10,
    aspectRatios: ['16:9', '9:16', '1:1'],
    inputFields: { prompt: 'string', aspect_ratio: 'string' },
  },
  {
    id: 'luma-dream-machine',
    label: 'Luma Dream Machine (T2V)',
    lab: 'Luma AI',
    category: 'video-t2v',
    tier: 'pro',
    description: 'Luma AI Dream Machine — fluid cinematic motion.',
    supportsAudio: false,
    maxDuration: 10,
    aspectRatios: ['16:9', '9:16', '1:1'],
    inputFields: { prompt: 'string', aspect_ratio: 'string' },
  },
  {
    id: 'alibaba/happy-horse/text-to-video',
    label: 'Happy Horse (T2V)',
    lab: 'Alibaba',
    category: 'video-t2v',
    tier: 'pro',
    description: 'Alibaba Happy Horse — 1080p with native audio.',
    supportsAudio: true,
    maxDuration: 15,
    aspectRatios: ['16:9', '9:16', '1:1', '4:3', '3:4'],
    inputFields: { prompt: 'string', duration: 'number', aspect_ratio: 'string' },
  },

  // ─── VIDEO — Image to Video ────────────────────────────────────────────────

  {
    id: 'kling-video/v3/pro/image-to-video',
    label: 'Kling 3.0 Pro (I2V)',
    lab: 'Kling',
    category: 'video-i2v',
    tier: 'pro',
    description: 'Kling 3.0 Pro image-to-video with native audio and custom elements.',
    supportsAudio: true,
    supportsFirstLastFrame: false,
    maxDuration: 10,
    aspectRatios: ['16:9', '9:16', '1:1'],
    inputFields: { prompt: 'string', image_url: 'string', duration: 'string', aspect_ratio: 'string' },
    featured: true,
  },
  {
    id: 'kling-video/v3/standard/image-to-video',
    label: 'Kling 3.0 Standard (I2V)',
    lab: 'Kling',
    category: 'video-i2v',
    tier: 'standard',
    description: 'Kling 3.0 Standard image-to-video with native audio.',
    supportsAudio: true,
    maxDuration: 10,
    aspectRatios: ['16:9', '9:16', '1:1'],
    inputFields: { prompt: 'string', image_url: 'string', duration: 'string', aspect_ratio: 'string' },
  },
  {
    id: 'kling-video/o3/pro/image-to-video',
    label: 'Kling O3 Pro (I2V — Start+End Frame)',
    lab: 'Kling',
    category: 'video-i2v-firstlast',
    tier: 'pro',
    description: 'Kling O3: animates transition between start and end frame. Most accurate for first+last.',
    supportsAudio: false,
    supportsFirstLastFrame: true,
    maxDuration: 10,
    aspectRatios: ['16:9', '9:16', '1:1'],
    inputFields: { prompt: 'string', image_url: 'string', tail_image_url: 'string', duration: 'string', aspect_ratio: 'string' },
  },
  {
    id: 'kling-video/o3/standard/image-to-video',
    label: 'Kling O3 Standard (I2V — Start+End Frame)',
    lab: 'Kling',
    category: 'video-i2v-firstlast',
    tier: 'standard',
    description: 'Kling O3 Standard: start + end frame animation.',
    supportsAudio: false,
    supportsFirstLastFrame: true,
    maxDuration: 10,
    aspectRatios: ['16:9', '9:16', '1:1'],
    inputFields: { prompt: 'string', image_url: 'string', tail_image_url: 'string', duration: 'string', aspect_ratio: 'string' },
  },
  {
    id: 'veo3.1/first-last-frame-to-video',
    label: 'Veo 3.1 First+Last Frame',
    lab: 'Google',
    category: 'video-i2v-firstlast',
    tier: 'pro',
    description: 'Google Veo 3.1 — generates video between first and last frame.',
    supportsAudio: true,
    supportsFirstLastFrame: true,
    maxDuration: 8,
    aspectRatios: ['16:9', '9:16'],
    inputFields: { prompt: 'string', image_url: 'string', last_image_url: 'string', aspect_ratio: 'string' },
  },
  {
    id: 'veo3.1/fast/first-last-frame-to-video',
    label: 'Veo 3.1 Fast First+Last Frame',
    lab: 'Google',
    category: 'video-i2v-firstlast',
    tier: 'standard',
    description: 'Google Veo 3.1 Fast — first and last frame, cheaper.',
    supportsAudio: true,
    supportsFirstLastFrame: true,
    maxDuration: 8,
    aspectRatios: ['16:9', '9:16'],
    inputFields: { prompt: 'string', image_url: 'string', last_image_url: 'string', aspect_ratio: 'string' },
  },
  {
    id: 'veo3.1/image-to-video',
    label: 'Veo 3.1 (I2V)',
    lab: 'Google',
    category: 'video-i2v',
    tier: 'pro',
    description: 'Veo 3.1 image-to-video.',
    supportsAudio: true,
    maxDuration: 8,
    aspectRatios: ['16:9', '9:16'],
    inputFields: { prompt: 'string', image_url: 'string', aspect_ratio: 'string' },
  },
  {
    id: 'veo3.1/fast/image-to-video',
    label: 'Veo 3.1 Fast (I2V)',
    lab: 'Google',
    category: 'video-i2v',
    tier: 'standard',
    description: 'Veo 3.1 Fast image-to-video.',
    supportsAudio: true,
    maxDuration: 8,
    aspectRatios: ['16:9', '9:16'],
    inputFields: { prompt: 'string', image_url: 'string', aspect_ratio: 'string' },
  },
  {
    id: 'bytedance/seedance-2.0/image-to-video',
    label: 'Seedance 2.0 (I2V)',
    lab: 'ByteDance',
    category: 'video-i2v',
    tier: 'pro',
    description: 'Seedance 2.0 image-to-video with audio, start/end frame control.',
    supportsAudio: true,
    supportsFirstLastFrame: true,
    maxDuration: 10,
    aspectRatios: ['16:9', '9:16', '1:1'],
    inputFields: { prompt: 'string', image_url: 'string', tail_image_url: 'string', duration: 'number', aspect_ratio: 'string' },
  },
  {
    id: 'kling-video/v1.6/standard/image-to-video',
    label: 'Kling 1.6 Standard (I2V)',
    lab: 'Kling',
    category: 'video-i2v',
    tier: 'standard',
    description: 'Kling 1.6 Standard image-to-video — confirmed working.',
    supportsAudio: false,
    maxDuration: 10,
    aspectRatios: ['16:9', '9:16', '1:1'],
    inputFields: { prompt: 'string', image_url: 'string', duration: 'string', aspect_ratio: 'string' },
    default: true,
  },
  {
    id: 'sora-2/image-to-video',
    label: 'Sora 2 (I2V)',
    lab: 'OpenAI',
    category: 'video-i2v',
    tier: 'pro',
    description: 'Sora 2 image-to-video with audio.',
    supportsAudio: true,
    maxDuration: 20,
    aspectRatios: ['16:9', '9:16', '1:1'],
    inputFields: { prompt: 'string', image_url: 'string', duration: 'number', aspect_ratio: 'string' },
  },
  {
    id: 'wan/v2.2-a14b/image-to-video',
    label: 'Wan 2.2 (I2V)',
    lab: 'Alibaba',
    category: 'video-i2v',
    tier: 'standard',
    description: 'Wan 2.2 image-to-video.',
    supportsAudio: false,
    maxDuration: 10,
    aspectRatios: ['16:9', '9:16', '1:1'],
    inputFields: { prompt: 'string', image_url: 'string', num_frames: 'number' },
  },
  {
    id: 'minimax/hailuo-02/standard/image-to-video',
    label: 'MiniMax Hailuo-02 (I2V)',
    lab: 'MiniMax',
    category: 'video-i2v',
    tier: 'standard',
    description: 'MiniMax Hailuo-02 image-to-video 768p.',
    supportsAudio: false,
    maxDuration: 10,
    aspectRatios: ['16:9', '9:16'],
    inputFields: { prompt: 'string', image_url: 'string', duration: 'number' },
  },
  {
    id: 'alibaba/happy-horse/image-to-video',
    label: 'Happy Horse (I2V)',
    lab: 'Alibaba',
    category: 'video-i2v',
    tier: 'pro',
    description: 'Happy Horse image-to-video with native audio.',
    supportsAudio: true,
    maxDuration: 15,
    aspectRatios: ['16:9', '9:16', '1:1'],
    inputFields: { prompt: 'string', image_url: 'string', duration: 'number', aspect_ratio: 'string' },
  },
  {
    id: 'xai/grok-imagine-video/image-to-video',
    label: 'Grok Imagine Video (I2V)',
    lab: 'xAI',
    category: 'video-i2v',
    tier: 'pro',
    description: 'xAI Grok image-to-video with audio.',
    supportsAudio: true,
    maxDuration: 10,
    aspectRatios: ['16:9', '9:16'],
    inputFields: { prompt: 'string', image_url: 'string', aspect_ratio: 'string' },
  },
  {
    id: 'xai/grok-imagine-video/v1.5/image-to-video',
    label: 'Grok Imagine Video 1.5 (I2V)',
    lab: 'xAI',
    category: 'video-i2v',
    tier: 'pro',
    description: 'xAI Grok 1.5 image-to-video with audio and lip-sync.',
    supportsAudio: true,
    maxDuration: 10,
    aspectRatios: ['16:9', '9:16'],
    inputFields: { prompt: 'string', image_url: 'string', aspect_ratio: 'string' },
  },

  // ─── IMAGE — Text to Image ────────────────────────────────────────────────

  {
    id: 'openai/gpt-image-2',
    label: 'GPT Image 2',
    lab: 'OpenAI',
    category: 'image-t2i',
    tier: 'pro',
    description: 'GPT Image 2 — detailed images with fine typography.',
    featured: true,
    inputFields: { prompt: 'string', image_size: 'string', num_images: 'number' },
  },
  {
    id: 'nano-banana-2',
    label: 'Nano Banana 2 (Gemini)',
    lab: 'Google',
    category: 'image-t2i',
    tier: 'standard',
    description: 'Google Nano Banana 2 — fast image generation.',
    featured: true,
    inputFields: { prompt: 'string', image_size: 'string' },
  },
  {
    id: 'nano-banana-pro',
    label: 'Nano Banana Pro (Gemini)',
    lab: 'Google',
    category: 'image-t2i',
    tier: 'pro',
    description: 'Google Nano Banana Pro — high-fidelity realism.',
    inputFields: { prompt: 'string', image_size: 'string' },
  },
  {
    id: 'flux/dev',
    label: 'FLUX.1 Dev',
    lab: 'Black Forest Labs',
    category: 'image-t2i',
    tier: 'standard',
    description: 'FLUX.1 [dev] — 12B parameter, high quality.',
    inputFields: { prompt: 'string', image_size: 'string', num_inference_steps: 'number' },
  },
  {
    id: 'flux/schnell',
    label: 'FLUX.1 Schnell (fastest)',
    lab: 'Black Forest Labs',
    category: 'image-t2i',
    tier: 'economy',
    description: 'FLUX.1 [schnell] — fastest, 1-4 steps.',
    inputFields: { prompt: 'string', image_size: 'string', num_inference_steps: 'number' },
  },
  {
    id: 'flux-pro/v1.1',
    label: 'FLUX1.1 Pro',
    lab: 'Black Forest Labs',
    category: 'image-t2i',
    tier: 'pro',
    description: 'FLUX1.1 [pro] — superior composition, detail, artistic fidelity.',
    inputFields: { prompt: 'string', image_size: 'string' },
  },
  {
    id: 'flux-pro/v1.1-ultra',
    label: 'FLUX1.1 Pro Ultra (2K)',
    lab: 'Black Forest Labs',
    category: 'image-t2i',
    tier: 'pro',
    description: 'FLUX1.1 [pro] ultra — up to 2K resolution.',
    inputFields: { prompt: 'string', aspect_ratio: 'string' },
  },
  {
    id: 'flux-2',
    label: 'FLUX 2 Dev',
    lab: 'Black Forest Labs',
    category: 'image-t2i',
    tier: 'standard',
    description: 'FLUX.2 [dev] — enhanced realism, crisper text.',
    featured: true,
    inputFields: { prompt: 'string', image_size: 'string' },
  },
  {
    id: 'flux-2-pro',
    label: 'FLUX 2 Pro',
    lab: 'Black Forest Labs',
    category: 'image-t2i',
    tier: 'pro',
    description: 'FLUX.2 [pro] — maximum quality, photorealism.',
    inputFields: { prompt: 'string', aspect_ratio: 'string' },
  },
  {
    id: 'ideogram/v4',
    label: 'Ideogram 4',
    lab: 'Ideogram',
    category: 'image-t2i',
    tier: 'pro',
    description: 'Ideogram V4 — crisp visuals, accurate text rendering.',
    featured: true,
    inputFields: { prompt: 'string', aspect_ratio: 'string' },
  },
  {
    id: 'ideogram/v3',
    label: 'Ideogram 3',
    lab: 'Ideogram',
    category: 'image-t2i',
    tier: 'pro',
    description: 'Ideogram V3 — high quality, exceptional typography.',
    inputFields: { prompt: 'string', aspect_ratio: 'string' },
  },
  {
    id: 'krea/v2/large/text-to-image',
    label: 'Krea 2 Large',
    lab: 'Krea',
    category: 'image-t2i',
    tier: 'pro',
    description: 'Krea 2 Large — high-fidelity with style references.',
    featured: true,
    inputFields: { prompt: 'string', aspect_ratio: 'string' },
  },
  {
    id: 'bytedance/seedream/v4.5/text-to-image',
    label: 'Seedream 4.5',
    lab: 'ByteDance',
    category: 'image-t2i',
    tier: 'standard',
    description: 'ByteDance Seedream 4.5 — generation + editing unified.',
    inputFields: { prompt: 'string', aspect_ratio: 'string' },
  },
  {
    id: 'xai/grok-imagine-image',
    label: 'Grok Imagine Image',
    lab: 'xAI',
    category: 'image-t2i',
    tier: 'pro',
    description: 'xAI Grok Imagine — highly aesthetic images.',
    inputFields: { prompt: 'string', aspect_ratio: 'string' },
  },

  // ─── IMAGE — Image to Image (editing) ─────────────────────────────────────

  {
    id: 'flux-pro/kontext',
    label: 'FLUX Kontext (Edit)',
    lab: 'Black Forest Labs',
    category: 'image-i2i',
    tier: 'pro',
    description: 'FLUX.1 Kontext — targeted edits and complex scene transformations.',
    inputFields: { prompt: 'string', image_url: 'string' },
  },
  {
    id: 'openai/gpt-image-2/edit',
    label: 'GPT Image 2 Edit',
    lab: 'OpenAI',
    category: 'image-i2i',
    tier: 'pro',
    description: 'GPT Image 2 fine-grained image editing.',
    inputFields: { prompt: 'string', image_url: 'string' },
  },
  {
    id: 'nano-banana-2/edit',
    label: 'Nano Banana 2 Edit',
    lab: 'Google',
    category: 'image-i2i',
    tier: 'standard',
    description: 'Nano Banana 2 image editing.',
    inputFields: { prompt: 'string', image_url: 'string' },
  },

  // ─── TTS ─────────────────────────────────────────────────────────────────

  {
    id: 'elevenlabs/tts/turbo-v2.5',
    label: 'ElevenLabs TTS Turbo v2.5',
    lab: 'ElevenLabs',
    category: 'tts',
    tier: 'standard',
    description: 'High-speed text-to-speech with ElevenLabs.',
    inputFields: { text: 'string', voice_id: 'string' },
  },
  {
    id: 'xai/tts/v1',
    label: 'xAI TTS',
    lab: 'xAI',
    category: 'tts',
    tier: 'standard',
    description: 'Expressive speech generation from xAI.',
    inputFields: { text: 'string' },
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getModelById(id) {
  return FAL_MODELS.find(m => m.id === id) || null
}

export function getVideoModels() {
  return FAL_MODELS.filter(m => m.category.startsWith('video'))
}

export function getImageModels() {
  return FAL_MODELS.filter(m => m.category.startsWith('image'))
}

export function getTtsModels() {
  return FAL_MODELS.filter(m => m.category === 'tts')
}

export function getFirstLastFrameModels() {
  return FAL_MODELS.filter(m => m.supportsFirstLastFrame)
}

export function getFeaturedModels() {
  return FAL_MODELS.filter(m => m.featured)
}

export function getDefaultVideoT2VModel() {
  return FAL_MODELS.find(m => m.category === 'video-t2v' && m.default)
    || FAL_MODELS.find(m => m.category === 'video-t2v')
}

export function getDefaultVideoI2VModel() {
  return FAL_MODELS.find(m => m.category === 'video-i2v' && m.default)
    || FAL_MODELS.find(m => m.category === 'video-i2v')
}

/**
 * Build the fal.ai payload for a given model, normalizing field names.
 * Different models use different field names (duration as string vs number, etc.)
 */
export function buildFalPayload(modelId, { prompt, imageUrl, finalImageUrl, aspectRatio, duration, extraFields = {} }) {
  const model = getModelById(modelId)
  const fields = model?.inputFields || {}

  const payload = {}

  if (fields.prompt !== undefined) payload.prompt = String(prompt || '')
  if (fields.aspect_ratio !== undefined) payload.aspect_ratio = aspectRatio || '16:9'

  // Duration: some models want string ('5'), others want number (5)
  if (fields.duration !== undefined) {
    const d = Number(duration) || 5
    payload.duration = fields.duration === 'string' ? String(d) : d
  }
  if (fields.num_frames !== undefined) {
    payload.num_frames = Math.round((Number(duration) || 5) * 16) // ~16fps
  }

  // Image inputs
  if (fields.image_url !== undefined && imageUrl) {
    payload.image_url = imageUrl
  }
  // End frame: Kling uses tail_image_url, Veo uses last_image_url
  if (finalImageUrl) {
    if (fields.tail_image_url !== undefined) payload.tail_image_url = finalImageUrl
    else if (fields.last_image_url !== undefined) payload.last_image_url = finalImageUrl
  }

  // Merge any extra fields
  Object.assign(payload, extraFields)

  return payload
}
