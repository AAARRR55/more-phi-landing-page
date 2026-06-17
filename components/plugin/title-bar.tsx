"use client"

import { useEffect, useState } from "react"

export function TitleBar() {
  // Animated faux RMS meter (starts after mount to avoid hydration mismatch)
  const [level, setLevel] = useState(0.45)
  useEffect(() => {
    setLevel(0.5)
    const id = setInterval(() => {
      setLevel((prev) => {
        const next = prev + (Math.random() - 0.5) * 0.3
        return Math.max(0.05, Math.min(0.95, next))
      })
    }, 320)
    return () => clearInterval(id)
  }, [])

  const meterColor =
    level > 0.9 ? "var(--destructive)" : level > 0.7 ? "var(--gold)" : "var(--cyan-bright)"

  return (
    <header className="flex h-12 items-center justify-between border-b border-border bg-gradient-to-b from-card to-background px-4">
      <div className="flex items-baseline gap-3">
        <span className="font-heading text-lg font-bold tracking-tight text-gradient-gold">
          More-Phi
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">v3.3.0</span>
      </div>

      <div className="flex items-center gap-3">
        <button className="rounded-md border border-border px-3 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-gold/50 hover:text-gold">
          Deactivate License
        </button>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] tracking-widest text-muted-foreground">OUT</span>
          <div className="relative h-2.5 w-28 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-[width] duration-300 ease-out"
              style={{ width: `${level * 100}%`, backgroundColor: meterColor }}
            />
          </div>
        </div>
      </div>
    </header>
  )
}
