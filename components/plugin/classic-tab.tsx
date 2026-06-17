"use client"

import { useState } from "react"
import { Knob } from "./knob"

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-lg p-3">
      <div className="mb-2 font-mono text-[9px] tracking-widest text-muted-foreground">{title}</div>
      {children}
    </div>
  )
}

const MODES = ["Morph", "Blend", "Snap", "Random"]

export function ClassicTab() {
  const [mode, setMode] = useState("Morph")
  const macros = [
    { label: "Macro 1", v: 0.7, a: "gold" as const },
    { label: "Macro 2", v: 0.4, a: "cyan" as const },
    { label: "Macro 3", v: 0.55, a: "magenta" as const },
    { label: "Macro 4", v: 0.3, a: "cyan" as const },
  ]

  return (
    <div className="flex flex-col gap-3">
      {/* Control strip */}
      <Panel title="CONTROL">
        <div className="flex items-center justify-around">
          <Knob label="Smooth" initial={0.4} accent="gold" />
          <Knob label="Curve" initial={0.5} accent="gold" bipolar />
          <Knob label="Drift" initial={0.25} accent="cyan" />
          <Knob label="Spread" initial={0.6} accent="cyan" />
          <Knob label="Depth" initial={0.5} accent="magenta" />
          <Knob label="Mix" initial={0.85} accent="gold" />
        </div>
      </Panel>

      {/* Mode bar */}
      <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
        {MODES.map((m) => {
          const active = m === mode
          return (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 rounded-md px-3 py-2 text-[12px] font-medium transition-all ${
                active
                  ? "bg-cyan/15 text-cyan-bright shadow-[inset_0_0_0_1px_oklch(0.82_0.16_200_/_0.45)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m}
            </button>
          )
        })}
      </div>

      {/* Macro strip */}
      <Panel title="MACROS">
        <div className="flex items-center justify-around">
          {macros.map((mc) => (
            <Knob key={mc.label} label={mc.label} initial={mc.v} accent={mc.a} />
          ))}
        </div>
      </Panel>

      {/* Breeding panel */}
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card/50 px-3 py-2.5">
        <span className="font-mono text-[9px] tracking-widest text-muted-foreground">BREED</span>
        <button className="rounded-md bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground transition-colors hover:bg-gold-bright">
          Generate
        </button>
        <button className="rounded-md border border-border px-3 py-1.5 text-[11px] font-medium text-foreground transition-colors hover:border-magenta/50 hover:text-magenta">
          Mutate
        </button>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-magenta shadow-[0_0_8px] shadow-magenta" />
          <span className="text-[11px] text-muted-foreground">4 offspring ready</span>
        </div>
      </div>
    </div>
  )
}
