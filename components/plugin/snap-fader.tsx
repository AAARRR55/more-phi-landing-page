"use client"

import { useRef, useState } from "react"

export function SnapFader() {
  const [value, setValue] = useState(0.62)
  const trackRef = useRef<HTMLDivElement>(null)

  const handlePointer = (clientY: number) => {
    const el = trackRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const v = 1 - (clientY - rect.top) / rect.height
    setValue(Math.max(0, Math.min(1, v)))
  }

  return (
    <div className="flex w-14 flex-col items-center gap-2">
      <span className="font-mono text-[9px] tracking-widest text-muted-foreground">SNAP</span>
      <div
        ref={trackRef}
        className="relative flex-1 w-3 cursor-ns-resize rounded-full bg-muted"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          handlePointer(e.clientY)
        }}
        onPointerMove={(e) => {
          if (e.buttons === 1) handlePointer(e.clientY)
        }}
      >
        {/* fill */}
        <div
          className="absolute bottom-0 left-0 right-0 rounded-full bg-gradient-to-t from-cyan to-magenta"
          style={{ height: `${value * 100}%` }}
        />
        {/* thumb */}
        <div
          className="absolute left-1/2 h-4 w-7 -translate-x-1/2 rounded-md border border-gold-bright bg-card halo-gold"
          style={{ bottom: `calc(${value * 100}% - 8px)` }}
        />
      </div>
      <span className="font-mono text-[10px] font-semibold text-gold">{Math.round(value * 100)}</span>
    </div>
  )
}
