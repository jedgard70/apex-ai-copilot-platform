import { describe, it, expect } from 'vitest'

// Replicate the service worker URL classification logic from public/sw.js
function shouldSkipCache(url: string): boolean {
  return url.includes('/api/') || url.includes('supabase.co') || url.includes('anthropic.com') || url.includes('openai.com') || url.includes('tavily.com') || url.includes('fal.ai')
}

function isNavigationRequest(pathname: string, mode: string): boolean {
  return mode === 'navigate' && !pathname.includes('.')
}

function isStaticAsset(url: string): boolean {
  return /\.(js|css|png|jpg|jpeg|svg|wasm|ico|webp|woff2?)$/.test(url)
}

describe('service worker — cache exclusions', () => {
  it('excludes /api/ routes', () => {
    expect(shouldSkipCache('https://apexglobalai.com/api/copilot/plan')).toBe(true)
    expect(shouldSkipCache('https://apexglobalai.com/api/copilot/research')).toBe(true)
  })

  it('excludes Supabase requests', () => {
    expect(shouldSkipCache('https://xyz.supabase.co/rest/v1/knowledge_items')).toBe(true)
  })

  it('excludes Anthropic API', () => {
    expect(shouldSkipCache('https://api.anthropic.com/v1/messages')).toBe(true)
  })

  it('excludes OpenAI API', () => {
    expect(shouldSkipCache('https://api.openai.com/v1/embeddings')).toBe(true)
  })

  it('excludes Tavily API', () => {
    expect(shouldSkipCache('https://api.tavily.com/search')).toBe(true)
  })

  it('excludes fal.ai API', () => {
    expect(shouldSkipCache('https://fal.ai/run')).toBe(true)
  })

  it('does NOT exclude app pages', () => {
    expect(shouldSkipCache('https://apexglobalai.com/')).toBe(false)
    expect(shouldSkipCache('https://apexglobalai.com/dashboard')).toBe(false)
  })

  it('does NOT exclude static assets', () => {
    expect(shouldSkipCache('https://apexglobalai.com/assets/index.js')).toBe(false)
    expect(shouldSkipCache('https://apexglobalai.com/manifest.json')).toBe(false)
  })
})

describe('service worker — navigation requests', () => {
  it('detects navigation request', () => {
    expect(isNavigationRequest('/dashboard', 'navigate')).toBe(true)
    expect(isNavigationRequest('/', 'navigate')).toBe(true)
  })

  it('non-navigate mode is not navigation', () => {
    expect(isNavigationRequest('/dashboard', 'cors')).toBe(false)
  })

  it('asset paths are not navigation even in navigate mode', () => {
    expect(isNavigationRequest('/assets/index.js', 'navigate')).toBe(false)
  })
})

describe('service worker — static asset detection', () => {
  it('detects JS files', () => {
    expect(isStaticAsset('/assets/index-abc123.js')).toBe(true)
  })

  it('detects CSS files', () => {
    expect(isStaticAsset('/assets/index-abc123.css')).toBe(true)
  })

  it('detects WASM files', () => {
    expect(isStaticAsset('/web-ifc.wasm')).toBe(true)
  })

  it('detects image files', () => {
    expect(isStaticAsset('/favicon.ico')).toBe(true)
    expect(isStaticAsset('/logo.png')).toBe(true)
    expect(isStaticAsset('/icon.webp')).toBe(true)
  })

  it('does not classify HTML pages as static', () => {
    expect(isStaticAsset('/dashboard')).toBe(false)
    expect(isStaticAsset('/api/copilot/plan')).toBe(false)
  })
})
