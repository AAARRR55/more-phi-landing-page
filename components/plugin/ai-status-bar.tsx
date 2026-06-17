export function AiStatusBar() {
  return (
    <footer className="flex h-8 items-center gap-2 border-t border-border bg-card/40 px-4">
      <span className="h-1.5 w-1.5 rounded-full bg-cyan-bright shadow-[0_0_8px] shadow-cyan-bright" />
      <span className="text-[11px] text-muted-foreground">AI engine online</span>
      <span className="ml-auto font-mono text-[10px] text-muted-foreground">CPU 4% · 48kHz</span>
    </footer>
  )
}
