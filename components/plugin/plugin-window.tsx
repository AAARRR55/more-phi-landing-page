"use client"

import { useState } from "react"
import { TitleBar } from "@/components/plugin/title-bar"
import { BrowserRow } from "@/components/plugin/browser-row"
import { SnapFader } from "@/components/plugin/snap-fader"
import { MorphPad } from "@/components/plugin/morph-pad"
import { ClassicTab } from "@/components/plugin/classic-tab"
import { TabBar, type TabId } from "@/components/plugin/tab-bar"
import { AiStatusBar } from "@/components/plugin/ai-status-bar"
import { EnginePlaceholder } from "@/components/plugin/engine-placeholder"

export function PluginWindow() {
  const [tab, setTab] = useState<TabId>("classic")

  return (
    <div className="flex w-full max-w-[940px] flex-col overflow-hidden rounded-xl border border-border bg-background shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
      <TitleBar />

      <BrowserRow />

      {/* Main area: snap fader + morph pad */}
      <div className="flex items-stretch gap-3 px-4 py-4">
        <SnapFader />
        <div className="flex flex-1 items-center justify-center">
          <MorphPad />
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4">
        {tab === "classic" ? <ClassicTab /> : <EnginePlaceholder tab={tab} />}
      </div>

      {/* Tab bar */}
      <div className="px-4 pb-1 pt-3">
        <TabBar active={tab} onChange={setTab} />
      </div>

      {/* AI status bar */}
      <AiStatusBar />
    </div>
  )
}
