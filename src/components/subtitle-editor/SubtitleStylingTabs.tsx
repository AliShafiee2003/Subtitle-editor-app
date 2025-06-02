"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import React, { useContext } from "react"
import { AppContext } from "@/contexts/AppContext"
import { StylingControls } from "@/components/StylingControls"
import BatchStylingTab from "./BatchStylingTab"

export function SubtitleStylingTabs() {
  return (
    <Tabs defaultValue="single-cue" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="single-cue">Single Cue Styling</TabsTrigger> {/* Individual styling controls here */}
        <TabsTrigger value="batch-styling">Batch Styling</TabsTrigger>
      </TabsList>
      <TabsContent value="single-cue">
        <StylingControls />
      </TabsContent>
      <TabsContent value="batch-styling">
        <BatchStylingTab />
      </TabsContent>
    </Tabs>
  )
}