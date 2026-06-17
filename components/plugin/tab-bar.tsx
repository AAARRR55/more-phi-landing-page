"use client"

export type TabId = "classic" | "engine" | "modulation" | "presets" | "ai"

const TABS: { id: TabId; label: string }[] = [
  { id: "classic", label: "Classic" },
  { id: "engine", label: "Engine" },
  { id: "modulation", label: "Modulation" },
  { id: "presets", label: "Presets" },
  { id: "ai", label: "AI" },
]

export function TabBar({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
      {TABS.map((t) => {
        const isActive = t.id === active
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`flex-1 rounded-md px-3 py-1.5 text-[12px] font-medium transition-all ${
              isActive
                ? "bg-card text-gold shadow-[inset_0_0_0_1px_oklch(0.82_0.13_90_/_0.4)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
