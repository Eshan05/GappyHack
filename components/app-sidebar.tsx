"use client"

import {
  BrainIcon,
  ChevronsUpDownIcon,
  FileTextIcon,
  LightbulbIcon,
  ListTodoIcon,
  MessageCircleIcon,
  UploadIcon,
  SearchIcon,
  NetworkIcon,
  SettingsIcon,
  LogOutIcon,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useAuth } from "lemma-sdk/react"
import { getLemmaClient } from "@/lib/lemma"
import { useChatDrawer } from "@/context/chat-drawer-context"
import { useBrowserPathname } from "@/hooks/use-browser-pathname"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: BrainIcon },
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
  const activePath = useBrowserPathname()
  const { isMobile } = useSidebar()
  const { close: closeChat } = useChatDrawer()
  const { user } = useAuth(getLemmaClient())
  const [isSigningOut, setIsSigningOut] = useState(false)
  const displayName = user?.name || user?.email?.split("@")[0] || "User"
  const displayEmail = user?.email || ""
  const initial = displayName[0]?.toUpperCase() || "U"

  async function handleSignOut() {
    if (isSigningOut) return
    closeChat()
    setIsSigningOut(true)
    let shouldNavigateHome = true

    try {
      const signedOut = await getLemmaClient().auth.signOut()

      if (!signedOut) {
        shouldNavigateHome = false
        await getLemmaClient().auth.redirectToFederatedLogout({
          redirectUri: window.location.origin,
        })
        return
      }
    } catch {
      shouldNavigateHome = true
    } finally {
      if (shouldNavigateHome) {
        window.location.assign("/")
      }
    }
  }

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-gray-100 dark:border-zinc-800"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/dashboard" />}
              tooltip="Second Brain"
              size="lg"
              className="group-data-[collapsible=icon]:aspect-square group-data-[collapsible=icon]:size-8!"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <BrainIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-semibold">Second Brain</span>
                <span className="truncate text-xs text-muted-foreground">AI Knowledge Engine</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = activePath === item.href
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive}
                      tooltip={item.title}
                      className="data-active:bg-emerald-500/10 data-active:text-emerald-700 dark:data-active:bg-emerald-500/20 dark:data-active:text-emerald-300"
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger className="group/menu-button flex h-12 w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground group-data-[collapsible=icon]:aspect-square group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! [&_svg]:size-4 [&_svg]:shrink-0">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg border border-emerald-500/15 bg-emerald-500/10 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  {initial}
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-medium">{displayName}</span>
                  {displayEmail && <span className="truncate text-xs text-muted-foreground">{displayEmail}</span>}
                </div>
                <ChevronsUpDownIcon className="ml-auto" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="min-w-56"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg border border-emerald-500/15 bg-emerald-500/10 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                      {initial}
                    </div>
                    <div className="grid flex-1 leading-tight">
                      <span className="truncate font-medium">{displayName}</span>
                      {displayEmail && <span className="truncate text-xs text-muted-foreground">{displayEmail}</span>}
                    </div>
                  </div>
                </DropdownMenuLabel>
                {/* <DropdownMenuSeparator />
                <DropdownMenuLinkItem href="/settings" onClick={closeChat}>
                  <SettingsIcon />
                  <span>Settings</span>
                </DropdownMenuLinkItem> */}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  variant="destructive"
                >
                  <LogOutIcon />
                  <span>{isSigningOut ? "Signing out..." : "Sign out"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
