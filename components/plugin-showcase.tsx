'use client'

import { PluginWindow } from '@/components/plugin/plugin-window'

const HIGHLIGHTS = [
  {
    label: 'XY Morph Pad',
    desc: 'Drag the puck across 12 snapshots arranged clockwise — the engine interpolates every hosted parameter in real time.',
  },
  {
    label: 'Snapshot Ring',
    desc: 'Capture full plugin states into the radial slots and blend between them along the circular surface.',
  },
  {
    label: 'AI Morph Assist',
    desc: 'Describe a transition in plain language and let More\u2013Phi shape the path between your snapshots.',
  },
]

export function PluginShowcase() {
  return (
    <section
      id="interface"
      className="relative mx-auto w-full max-w-7xl scroll-mt-24 px-5 py-24"
    >
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-medium tracking-[0.25em] text-cyan uppercase">
          The Interface
        </span>
        <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          A studio-grade GUI,{' '}
          <span className="text-gradient-gold">built for the morph.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">
          This is the actual More&#8211;Phi plugin window. Drag the morph pad, ride
          the snap fader, and tweak the macro knobs — every control is live.
        </p>
      </div>

      <div className="mt-14 flex flex-col items-center">
        <div className="relative w-full max-w-[940px]">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-10 -inset-y-12 -z-10 rounded-[2.5rem] bg-[radial-gradient(ellipse_at_center,oklch(0.82_0.16_200/0.12),transparent_70%)] blur-2xl"
          />
          <PluginWindow />
        </div>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-3">
        {HIGHLIGHTS.map((item) => (
          <div
            key={item.label}
            className="glass rounded-2xl border border-slate-line p-5 transition-colors hover:border-cyan/40"
          >
            <div className="flex items-center gap-3">
              <span className="size-2 rounded-full bg-gradient-to-tr from-cyan to-magenta" />
              <h3 className="font-heading text-sm font-bold tracking-wide text-primary">
                {item.label}
              </h3>
            </div>
            <p className="mt-3 text-pretty text-xs leading-relaxed text-muted-foreground">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
