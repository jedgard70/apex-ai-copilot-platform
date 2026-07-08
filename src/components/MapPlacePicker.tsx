/**
 * MapPlacePicker.tsx
 * Componente Google Maps Platform com Place Picker e mapa interativo.
 * API Key autorizada pelo Owner (2026-07-08) — Regra 12 Exceção 2.
 */

import React, { useEffect, useRef, useState } from 'react'

const MAPS_API_KEY = 'CHAVE_OCULTADA_EM_ENV_LOCAL'

interface PlaceResult {
  name: string
  address: string
  lat: number
  lng: number
  placeId: string
}

interface MapPlacePickerProps {
  onPlaceSelect?: (place: PlaceResult) => void
  initialCenter?: { lat: number; lng: number }
  height?: string
  showMap?: boolean
  placeholder?: string
}

let scriptLoaded = false
let scriptLoading = false
const callbacks: Array<() => void> = []

function loadGoogleMapsComponents(cb: () => void) {
  if (scriptLoaded) { cb(); return }
  callbacks.push(cb)
  if (scriptLoading) return
  scriptLoading = true

  const ecl = document.createElement('script')
  ecl.type = 'module'
  ecl.src = 'https://ajax.googleapis.com/ajax/libs/@googlemaps/extended-component-library/0.6.11/index.min.js'
  ecl.onload = () => {
    scriptLoaded = true
    callbacks.forEach(fn => fn())
    callbacks.length = 0
  }
  document.head.appendChild(ecl)

  if (!document.querySelector('gmpx-api-loader')) {
    const loader = document.createElement('gmpx-api-loader')
    loader.setAttribute('key', MAPS_API_KEY)
    loader.setAttribute('solution-channel', 'GMP_APEX_AI_001')
    document.body.appendChild(loader)
  }
}

export function MapPlacePicker({
  onPlaceSelect,
  initialCenter = { lat: -15.793, lng: -47.882 },
  height = '400px',
  showMap = true,
  placeholder = 'Pesquisar endereço ou local...',
}: MapPlacePickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null)

  useEffect(() => {
    loadGoogleMapsComponents(() => setReady(true))
  }, [])

  useEffect(() => {
    if (!ready || !containerRef.current) return
    const picker = containerRef.current.querySelector('gmpx-place-picker')
    if (!picker) return
    const handler = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const place = (picker as any).value
      if (!place) return
      const result: PlaceResult = {
        name: place.displayName || '',
        address: place.formattedAddress || '',
        lat: place.location?.lat() ?? 0,
        lng: place.location?.lng() ?? 0,
        placeId: place.id || '',
      }
      setSelectedPlace(result)
      onPlaceSelect?.(result)
    }
    picker.addEventListener('gmpx-placechange', handler)
    return () => picker.removeEventListener('gmpx-placechange', handler)
  }, [ready, onPlaceSelect])

  if (!ready) {
    return (
      <div style={{ padding: '16px', borderRadius: '8px', background: '#1a1a2e', color: '#94a3b8', textAlign: 'center' }}>
        <span style={{ fontSize: '14px' }}>⏳ Carregando Google Maps...</span>
      </div>
    )
  }

  const mapCenter = `${selectedPlace?.lat ?? initialCenter.lat},${selectedPlace?.lng ?? initialCenter.lng}`

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {/* Place Picker via React.createElement to avoid TS issues with web components */}
      {React.createElement('gmpx-place-picker', {
        placeholder,
        style: {
          width: '100%',
          '--gmpx-color-surface': '#1e293b',
          '--gmpx-color-on-surface': '#f1f5f9',
          '--gmpx-color-primary': '#6366f1',
          '--gmpx-border-radius': '8px',
        },
      })}

      {selectedPlace && (
        <div style={{
          background: 'rgba(99,102,241,0.1)',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: '8px',
          padding: '12px',
          fontSize: '13px',
          color: '#e2e8f0',
        }}>
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>📍 {selectedPlace.name}</div>
          <div style={{ color: '#94a3b8' }}>{selectedPlace.address}</div>
          {selectedPlace.lat !== 0 && (
            <div style={{ color: '#64748b', marginTop: '4px', fontSize: '12px' }}>
              {selectedPlace.lat.toFixed(6)}, {selectedPlace.lng.toFixed(6)}
            </div>
          )}
        </div>
      )}

      {showMap && React.createElement(
        'gmp-map',
        { center: mapCenter, zoom: '14', 'map-id': 'APEX_AI_MAP', style: { width: '100%', height, borderRadius: '10px', overflow: 'hidden' } },
        selectedPlace
          ? React.createElement('gmp-advanced-marker', { position: `${selectedPlace.lat},${selectedPlace.lng}`, title: selectedPlace.name })
          : null
      )}
    </div>
  )
}

export default MapPlacePicker
