'use client'

import { useState } from 'react'

const FEATURES = [
  'VST3 & AU plugin formats',
  'Powered by the JUCE 8 audio engine',
  'Sub-2% CPU footprint at 96 kHz',
  '12-slot snapshot bank with genetic breeding',
  'Built-in MCP AI assistant',
  'Lifetime updates, no subscription',
]

export function Checkout() {
  const [hovering, setHovering] = useState(false)

  return (
    <section
      id="checkout"
      className="relative mx-auto w-full max-w-7xl scroll-mt-24 px-5 py-24"
    >
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <span className="text-xs font-medium tracking-[0.25em] text-primary uppercase">
          One Price. Forever.
        </span>
        <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          Own the instrument.
        </h2>
      </div>

      <div className="glass-strong mx-auto grid max-w-4xl overflow-hidden rounded-3xl md:grid-cols-2">
        {/* Left: value */}
        <div className="border-b border-slate-line p-8 md:border-r md:border-b-0">
          <div
            className="inline-flex cursor-default items-baseline gap-2 transition-transform duration-300"
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            style={{ transform: hovering ? 'scale(1.05)' : 'scale(1)' }}
          >
            <span
              className={`font-heading text-5xl font-bold transition-all ${
                hovering ? 'text-gradient-gold' : 'text-foreground'
              }`}
            >
              $129
            </span>
            <span className="text-sm text-muted-foreground line-through">
              $199
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            One-time purchase &middot; Launch pricing
          </p>

          <ul className="mt-8 space-y-3" id="checkout-feature-list">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-cyan/15">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--color-cyan)" strokeWidth="3" aria-hidden="true">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <span className="text-foreground/90">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: mock checkout */}
        <div className="p-8">
          <h3 className="font-heading text-sm font-bold tracking-wide">
            Secure Checkout
          </h3>

          <form
            id="checkout-form"
            className="mt-5 space-y-3"
            onSubmit={(e) => e.preventDefault()}
          >
            <Field id="checkout-email" label="Email" type="email" placeholder="you@studio.com" />
            <Field id="checkout-card" label="Card number" placeholder="4242 4242 4242 4242" inputMode="numeric" />
            <div className="grid grid-cols-2 gap-3">
              <Field id="checkout-exp" label="Expiry" placeholder="MM / YY" />
              <Field id="checkout-cvc" label="CVC" placeholder="123" inputMode="numeric" />
            </div>

            <button
              id="checkout-pay-btn"
              type="submit"
              className="group relative mt-2 w-full overflow-hidden rounded-xl p-px"
            >
              <span className="absolute inset-0 bg-[conic-gradient(from_0deg,var(--color-cyan),var(--color-magenta),var(--color-gold),var(--color-cyan))] opacity-80 transition-opacity group-hover:opacity-100" />
              <span className="glass-strong relative flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-foreground">
                Pay $129
              </span>
            </button>

            <div className="relative py-1 text-center">
              <span className="text-[10px] tracking-widest text-muted-foreground uppercase">
                or
              </span>
            </div>

            <button
              id="checkout-paypal-btn"
              type="button"
              className="w-full rounded-xl bg-[#ffc439] px-6 py-3 text-sm font-bold text-[#003087] transition-transform hover:scale-[1.02]"
            >
              PayPal
            </button>

            <p className="flex items-center justify-center gap-1.5 pt-2 text-center text-[11px] text-muted-foreground">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              256-bit encrypted. Instant download &amp; license key.
            </p>
          </form>
        </div>
      </div>
    </section>
  )
}

function Field({
  id,
  label,
  ...props
}: { id: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs text-muted-foreground">
        {label}
      </label>
      <input
        id={id}
        className="w-full rounded-lg border border-slate-line bg-background/50 px-3 py-2.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/50 focus:border-cyan/60 focus:halo-cyan"
        {...props}
      />
    </div>
  )
}
