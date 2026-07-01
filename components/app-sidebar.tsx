"use client"

import {
  BrainIcon,
  FileTextIcon,
  LightbulbIcon,
  ListTodoIcon,
  MessageCircleIcon,
  UploadIcon,
  SearchIcon,
  SparklesIcon,
  NetworkIcon,
  SettingsIcon,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ModeToggle } from "@/components/shared/mode-toggle"
import { Button } from "@/components/ui/button"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar"

const navItems = [
  { title: "Dashboard", href: "/", icon: BrainIcon },
  { title: "Notes", href: "/notes", icon: FileTextIcon },
  { title: "Documents", href: "/documents", icon: UploadIcon },
  { title: "AI Chat", href: "/chat", icon: MessageCircleIcon },
  { title: "Knowledge Graph", href: "/graph", icon: NetworkIcon },
  { title: "Tasks", href: "/tasks", icon: ListTodoIcon },
  { title: "Insights", href: "/insights", icon: LightbulbIcon },
  { title: "Search", href: "/search", icon: SearchIcon },
  { title: "Settings", href: "/settings", icon: SettingsIcon },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar className="border-r border-gray-100 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3 px-1">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/20">
            <BrainIcon className="size-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-foreground">Second Brain</span>
            <span className="text-[10px] text-muted-foreground font-medium">AI Knowledge Engine</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarSeparator className="opacity-50" />
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent className="mt-1.5">
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                        isActive
                          ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 font-medium shadow-sm shadow-emerald-500/5"
                          : "text-muted-foreground hover:text-foreground hover:bg-gray-50 dark:hover:bg-zinc-900"
                      }`}
                    >
                      <item.icon className={`size-4.5 transition-transform duration-200 ${isActive ? "scale-110 text-emerald-500" : "text-muted-foreground/80 group-hover:text-foreground"}`} />
                      <span className="text-sm">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3">
        <SidebarSeparator className="mb-3 opacity-50" />
        
        {/* User Profile Section */}
        <div className="flex items-center gap-2.5 rounded-xl p-2 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors duration-200">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500/10 to-teal-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-sm border border-emerald-500/10 shadow-inner">
            T
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-xs font-semibold text-foreground truncate leading-none mb-1">Tanay</span>
            <span className="text-[10px] text-muted-foreground truncate leading-none">tanay@secondbrain.ai</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-zinc-800"
            render={<Link href="/settings" />}
            nativeButton={false}
          >
            <SettingsIcon className="size-4" />
          </Button>
        </div>

        <div className="flex items-center justify-between mt-2 px-2">
          <div className="flex items-center gap-1.5 text-[9px] font-medium text-muted-foreground/70">
            <SparklesIcon className="size-3 text-emerald-500" />
            <span>Powered by Lemma</span>
          </div>
          <ModeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

