const PLUGIN_GROUPS = [
  {
    category: 'Synthesizers',
    plugins: [
      'Serum 2',
      'Massive X',
      'Omnisphere 2',
      'Pigments 6',
      'Vital',
      'Sylenth1',
      'Spire',
      'Diva',
      'Repro-5',
      'Phase Plant',
      'Hive 2',
      'Nexus 5',
      'Avenger 2',
      'Zebra2 / Zebra3',
    ],
  },
  {
    category: 'Effects & Dynamics',
    plugins: [
      'FabFilter Pro-Q 4',
      'FabFilter Pro-C 2',
      'FabFilter Pro-L 2',
      'Soothe2',
      'Valhalla VintageVerb',
      'OTT',
      'Kickstart 2',
      'ShaperBox 3',
      'Gullfoss',
      'Saturn 2',
      'Decapitator',
      'EchoBoy',
    ],
  },
  {
    category: 'Mixing & Mastering',
    plugins: [
      'Waves CLA-2A',
      'Waves SSL E-Channel',
      'iZotope Ozone 11',
      'iZotope Neutron 5',
      'UAD LA-2A',
      'UAD 1176',
      'Slate Digital VMR',
      'Plugin Alliance bx_console',
      'Sonnox Oxford',
      'DMG Audio EQuilibrium',
    ],
  },
  {
    category: 'Instruments & Samplers',
    plugins: [
      'Kontakt 7',
      'Native Instruments Komplete',
      'Spitfire LABS',
      'EastWest Opus',
      'Spectrasonics Keyscape',
      'Spectrasonics Trilian',
      'Arturia V Collection',
      'UVI Falcon',
      'Output Arcade',
      'XLN Addictive Drums 2',
    ],
  },
]

export function PluginHosts() {
  return (
    <section
      id="hosts"
      className="relative mx-auto w-full max-w-7xl scroll-mt-24 px-5 py-24"
    >
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-medium tracking-[0.25em] text-cyan uppercase">
          Universal VST3 Host
        </span>
        <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          Morph the plugins you{' '}
          <span className="text-gradient-morph">already own.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">
          More&#8211;Phi loads any compliant VST3 instrument or effect directly
          inside its engine, snapshots its full parameter state, and interpolates
          across it in real time. Below are just a few of the biggest commercial
          plugins it hosts seamlessly.
        </p>
      </div>

      <div className="mt-14 grid gap-4 sm:grid-cols-2">
        {PLUGIN_GROUPS.map((group) => (
          <div
            key={group.category}
            className="glass group rounded-2xl border border-slate-line p-6 transition-colors hover:border-cyan/40"
          >
            <div className="flex items-center gap-3">
              <span className="size-2 rounded-full bg-gradient-to-tr from-cyan to-magenta" />
              <h3 className="font-heading text-sm font-bold tracking-wide text-primary">
                {group.category}
              </h3>
            </div>
            <ul className="mt-5 flex flex-wrap gap-2">
              {group.plugins.map((name) => (
                <li key={name}>
                  <span className="inline-flex rounded-full border border-slate-line bg-foreground/[0.02] px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-cyan/50 hover:text-foreground">
                    {name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="mx-auto mt-10 max-w-2xl text-center text-xs leading-relaxed text-muted-foreground/70">
        Plugin names and trademarks are the property of their respective owners
        and are listed for compatibility reference only. More&#8211;Phi is not
        affiliated with or endorsed by these manufacturers.
      </p>
    </section>
  )
}
