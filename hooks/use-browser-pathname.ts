"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

export function normalizePathname(pathname: string) {
  if (pathname !== "/" && pathname.endsWith("/")) {
    return pathname.slice(0, -1)
  }

  return pathname
}

export function useBrowserPathname() {
  const nextPathname = usePathname()
  const [browserPathname, setBrowserPathname] = useState(() =>
    normalizePathname(nextPathname || "/")
  )

  useEffect(() => {
    setBrowserPathname(normalizePathname(nextPathname || "/"))
  }, [nextPathname])

  useEffect(() => {
    function syncBrowserPathname() {
      setBrowserPathname(normalizePathname(window.location.pathname || "/"))
    }

    syncBrowserPathname()
    window.addEventListener("popstate", syncBrowserPathname)

    return () => {
      window.removeEventListener("popstate", syncBrowserPathname)
    }
  }, [])

  return browserPathname
}
