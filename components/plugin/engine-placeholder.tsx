import type { TabId } from "./tab-bar"

const COPY: Record<string, { title: string; sub: string }> = {
  engine: { title: "Engine", sub: "Oscillator & morph engine parameters" },
  modulation: { title: "Modulation Matrix", sub: "Route LFOs and envelopes to any target" },
  presets: { title: "Preset Browser", sub: "Browse, save and organize morph banks" },
  ai: { title: "AI Assistant", sub: "Describe a sound and let More-Phi morph toward it" },
}

export function EnginePlaceholder({ tab }: { tab: TabId }) {
  const c = COPY[tab] ?? COPY.engine
  return (
    <div className="flex h-[260px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/30 text-center">
      <div className="font-heading text-base font-bold text-gradient-morph">{c.title}</div>
      <p className="mt-1 max-w-xs text-pretty text-[12px] text-muted-foreground">{c.sub}</p>
    </div>
  )
}
