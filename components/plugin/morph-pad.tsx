"use client"

import { useRef, useState } from "react"

type Snapshot = { id: number; angle: number; label: string; filled: boolean }

// 12 snapshots arranged clockwise, starting at 12 o'clock (top).
// angle is measured in degrees clockwise from 12 o'clock.
const SNAPSHOTS: Snapshot[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  angle: i * 30, // 0 = 12 o'clock, 30 = 1 o'clock, ... clockwise
  label: String(i + 1),
  filled: [0, 2, 4, 6, 9].includes(i), // a few loaded slots for demo
}))

// Convert a clock angle (deg, clockwise from top) to x/y in [0,1] on a ring.
function polar(angle: number, radius: number) {
  const rad = ((angle - 90) * Math.PI) / 180
  return {
    x: 0.5 + radius * Math.cos(rad),
    y: 0.5 + radius * Math.sin(rad),
  }
}

const NODE_RADIUS = 0.43 // distance of snapshot nodes from center
const PUCK_LIMIT = 0.46 // max distance the puck can travel from center

export function MorphPad() {
  const [pos, setPos] = useState({ x: 0.5, y: 0.4 })
  const surfaceRef = useRef<HTMLDivElement>(null)

  const handlePointer = (cx: number, cy: number) => {
    const el = surfaceRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    let x = (cx - rect.left) / rect.width - 0.5
    let y = (cy - rect.top) / rect.height - 0.5
    // clamp inside the circle
    const dist = Math.hypot(x, y)
    if (dist > PUCK_LIMIT) {
      const k = PUCK_LIMIT / dist
      x *= k
      y *= k
    }
    setPos({ x: x + 0.5, y: y + 0.5 })
  }

  return (
    <div className="relative aspect-square w-full max-w-[300px]">
      {/* circular morph surface */}
      <div
        ref={surfaceRef}
        className="relative h-full w-full cursor-crosshair touch-none overflow-hidden rounded-full border border-border bg-[oklch(0.1_0.005_280)] grid-noise"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          handlePointer(e.clientX, e.clientY)
        }}
        onPointerMove={(e) => {
          if (e.buttons === 1) handlePointer(e.clientX, e.clientY)
        }}
      >
        {/* concentric guide rings */}
        <div className="pointer-events-none absolute inset-[12%] rounded-full border border-foreground/5" />
        <div className="pointer-events-none absolute inset-[30%] rounded-full border border-foreground/5" />
        <div className="pointer-events-none absolute inset-[48%] rounded-full border border-foreground/5" />

        {/* radial glow under puck */}
        <div
          className="pointer-events-none absolute h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-2xl"
          style={{
            left: `${pos.x * 100}%`,
            top: `${pos.y * 100}%`,
            background:
              "radial-gradient(circle, oklch(0.82 0.16 200 / 0.55), oklch(0.65 0.27 330 / 0.25), transparent 70%)",
          }}
        />

        {/* connection lines to filled snapshots */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full">
          {SNAPSHOTS.filter((s) => s.filled).map((s) => {
            const p = polar(s.angle, NODE_RADIUS)
            return (
              <line
                key={s.id}
                x1={`${pos.x * 100}%`}
                y1={`${pos.y * 100}%`}
                x2={`${p.x * 100}%`}
                y2={`${p.y * 100}%`}
                stroke="oklch(0.82 0.16 200 / 0.22)"
                strokeWidth={1}
                strokeDasharray="3 4"
              />
            )
          })}
        </svg>

        {/* snapshot nodes around the clock */}
        {SNAPSHOTS.map((s) => {
          const p = polar(s.angle, NODE_RADIUS)
          return (
            <div
              key={s.id}
              className="absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-[10px] font-bold"
              style={{
                left: `${p.x * 100}%`,
                top: `${p.y * 100}%`,
                borderColor: s.filled ? "var(--cyan-bright)" : "var(--border)",
                backgroundColor: s.filled ? "oklch(0.7 0.18 200 / 0.18)" : "var(--muted)",
                color: s.filled ? "var(--cyan-bright)" : "var(--muted-foreground)",
                boxShadow: s.filled ? "0 0 14px -2px oklch(0.82 0.16 200 / 0.6)" : "none",
              }}
            >
              {s.label}
            </div>
          )
        })}

        {/* puck */}
        <div
          className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-gold-bright bg-gold halo-gold"
          style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%` }}
        />

        {/* center label */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-[9px] tracking-widest text-gold/70">
          MORPH
        </div>
      </div>
    </div>
  )
}
