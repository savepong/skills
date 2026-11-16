// Plain browser scripts that publish window globals. Order matters: lib, kits, timing, then the video.
import "../lib/harness.js"
import "../lib/sound.js"
import "../style/ballpoint.js"
import "../style/whiteboard.js"
import "./thai-ocr/timing.js"
import "./thai-ocr/visuals.js"
import "./thai-ocr/score.js"

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void
type OfflineResult = { inter: Float32Array; peak: number; sr: number }

declare global {
  interface Window {
    VIDEOS: Record<string, { draw: Draw; duration: number; score: unknown; width?: number; height?: number; fps?: number; voice?: string }>
    SOUND: { renderOffline: (score: unknown, duration: number, sampleRate: number, opts: object) => Promise<OfflineResult> }
    LOGO: HTMLImageElement | null
    LOGOS: Record<string, HTMLImageElement>
  }
}

export const VIDEOS = window.VIDEOS
