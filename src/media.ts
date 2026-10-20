import { useEffect, useState } from 'react'
/*
 * Media delivery.
 * Default: real binary files from /media (public/).
 * Pages build (VITE_MEDIA_MODE=b64): the GitHub connector used for deployment can only commit text,
 * so scripts/encode-media.mjs converts each file to base64 text (media/<file>.b64.txt). They are fetched
 * lazily at runtime, decoded and turned into Blob object URLs.
 */
const B = import.meta.env.BASE_URL + 'media/'
const B64 = import.meta.env.VITE_MEDIA_MODE === 'b64'
const FILES = {
  mp4: ['hero.mp4', 'video/mp4'], webm: ['hero.webm', 'video/webm'], poster: ['poster.webp', 'image/webp'],
  drift: ['g-drift.webp', 'image/webp'], valley: ['g-valley.webp', 'image/webp'], road: ['g-road.webp', 'image/webp'],
  wheel: ['g-wheel.webp', 'image/webp'], sunrise: ['g-sunrise.webp', 'image/webp'], spray: ['g-spray.webp', 'image/webp'],
} as const
export type MediaKey = keyof typeof FILES
export const mediaMode = B64 ? 'b64' : 'binary'
const cache = new Map<MediaKey, Promise<string>>()
export function loadMedia(k: MediaKey): Promise<string> {
  if (!B64) return Promise.resolve(B + FILES[k][0])
  if (!cache.has(k)) cache.set(k, fetch(B + FILES[k][0] + '.b64.txt').then(r => r.text()).then(t => {
    const bin = atob(t.trim()); const u = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i)
    return URL.createObjectURL(new Blob([u], { type: FILES[k][1] }))
  }))
  return cache.get(k)!
}
export function useMedia(k: MediaKey): string | undefined {
  const [url, setUrl] = useState<string | undefined>(B64 ? undefined : B + FILES[k][0])
  useEffect(() => { if (B64) { let live = true; loadMedia(k).then(u => live && setUrl(u)); return () => { live = false } } }, [k])
  return url
}
