import { Checkout } from '@/components/checkout'
import { FeaturesGrid } from '@/components/features-grid'
import { Hero } from '@/components/hero'
import { MorphPad } from '@/components/morph-pad'
import { PluginHosts } from '@/components/plugin-hosts'
import { PluginShowcase } from '@/components/plugin-showcase'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter, SpecsFaq } from '@/components/specs-faq'

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <MorphPad />
        <FeaturesGrid />
        <PluginShowcase />
        <PluginHosts />
        <Checkout />
        <SpecsFaq />
      </main>
      <SiteFooter />
    </>
  )
}
