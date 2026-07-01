"use client"

import { type ComponentType, type ReactNode } from "react"
import { DashboardHome } from "@/app/page"
import ChatPage from "@/app/chat/page"
import DocumentsPage from "@/app/documents/page"
import GraphPage from "@/app/graph/page"
import InsightsPage from "@/app/insights/page"
import NotesPage from "@/app/notes/page"
import SearchPage from "@/app/search/page"
import SettingsPage from "@/app/settings/page"
import TasksPage from "@/app/tasks/page"
import { useBrowserPathname } from "@/hooks/use-browser-pathname"

const routedPages: Record<string, ComponentType> = {
  "/dashboard": DashboardHome,
  "/chat": ChatPage,
  "/documents": DocumentsPage,
  "/graph": GraphPage,
  "/insights": InsightsPage,
  "/notes": NotesPage,
  "/search": SearchPage,
  "/settings": SettingsPage,
  "/tasks": TasksPage,
}

export function RouteContentRouter({ children }: { children: ReactNode }) {
  const pathname = useBrowserPathname()
  const RoutedPage = routedPages[pathname]

  if (RoutedPage) {
    return <RoutedPage />
  }

  return <>{children}</>
}
