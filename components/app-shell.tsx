"use client"

import { type ReactNode } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { FloatingChat } from "@/components/chat/floating-chat"
import { ModeToggle } from "@/components/shared/mode-toggle"

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
          <ModeToggle />
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 !h-4" />
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6 pb-24 md:pb-6">
          {children}
        </main>
        <FloatingChat />
      </SidebarInset>
    </SidebarProvider>
  )
}
