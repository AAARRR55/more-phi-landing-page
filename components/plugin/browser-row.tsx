export function BrowserRow() {
  return (
    <div className="flex items-center gap-2 border-b border-border bg-card/40 px-4 py-2">
      <div className="flex flex-1 items-center gap-2 rounded-md border border-border bg-muted/60 px-3 py-2">
        <span className="h-1.5 w-1.5 rounded-full bg-cyan-bright shadow-[0_0_8px] shadow-cyan-bright" />
        <span className="truncate text-[13px] text-foreground">Serum — Xfer Records</span>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">VST3</span>
      </div>
      <button className="rounded-md bg-primary px-3 py-2 text-[12px] font-semibold text-primary-foreground transition-colors hover:bg-gold-bright">
        Open Plugin
      </button>
      <button className="rounded-md border border-border px-3 py-2 text-[12px] font-medium text-muted-foreground transition-colors hover:border-cyan/50 hover:text-cyan-bright">
        Params &gt;
      </button>
    </div>
  )
}
