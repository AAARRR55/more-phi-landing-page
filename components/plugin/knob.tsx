"use client"

import { useState } from "react"

type KnobProps = {
  label: string
  initial?: number
  accent?: "gold" | "cyan" | "magenta"
  bipolar?: boolean
}

const ACCENTS: Record<string, string> = {
  gold: "var(--gold)",
  cyan: "var(--cyan-bright)",
  magenta: "var(--magenta)",
}

export function Knob({ label, initial = 0.5, accent = "gold", bipolar = false }: KnobProps) {
  const [value, setValue] = useState(initial)
  const color = ACCENTS[accent]

  // Arc geometry: -135deg to +135deg (270 sweep)
  const start = -135
  const sweep = 270
  const angle = start + value * sweep

  const r = 18
  const cx = 24
  const cy = 24
  const polar = (deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }
  const arcPath = (fromDeg: number, toDeg: number) => {
    const a = polar(fromDeg)
    const b = polar(toDeg)
    const large = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0
    return `M ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y}`
  }

  const fillFrom = bipolar ? start + sweep / 2 : start
  const handleDrag = (e: React.PointerEvent) => {
    if (e.buttons !== 1) return
    setValue((v) => Math.max(0, Math.min(1, v - e.movementY / 120)))
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="cursor-ns-resize touch-none"
        onPointerDown={(e) => e.currentTarget.setPointerCapture(e.pointerId)}
        onPointerMove={handleDrag}
      >
        <svg width={48} height={48} viewBox="0 0 48 48">
          {/* track */}
          <path d={arcPath(start, start + sweep)} fill="none" stroke="var(--muted)" strokeWidth={3} strokeLinecap="round" />
          {/* value arc */}
          <path
            d={arcPath(Math.min(fillFrom, angle), Math.max(fillFrom, angle))}
            fill="none"
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${color})` }}
          />
          {/* indicator dot */}
          <circle cx={polar(angle).x} cy={polar(angle).y} r={2.6} fill={color} />
          {/* center cap */}
          <circle cx={cx} cy={cy} r={9} fill="var(--card)" stroke="var(--border)" />
        </svg>
      </div>
      <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
    </div>
  )
}
