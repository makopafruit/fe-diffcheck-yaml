import { useEffect, useState } from "react"

export default function SideNav() {
  const [collapsed, setCollapsed] = useState(false)

  // Optional: persist user preference
  useEffect(() => {
    const saved = localStorage.getItem("sidenav:collapsed")
    if (saved) setCollapsed(saved === "1")
  }, [])
  useEffect(() => {
    localStorage.setItem("sidenav:collapsed", collapsed ? "1" : "0")
    // Update a global CSS variable so layout can react without JS re-renders
    const root = document.documentElement
    root.style.setProperty("--sidenav-w", collapsed ? "64px" : "220px")
  }, [collapsed])

  return (
    <aside
      className={[
        "hidden md:block",
        "sticky",
        "top-[calc(var(--header-h)+1rem)]",
        "h-[calc(100dvh-var(--header-h)-1rem)]",
        "border-r border-gray-200",
        "pr-2", // tiny padding even when collapsed
      ].join(" ")}
      aria-label="Section navigation"
    >
      {/* Header / Toggle */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={[
            "text-xs font-semibold text-gray-500 tracking-wide",
            collapsed ? "sr-only" : "",
          ].join(" ")}
        >
          NAVIGATION
        </span>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={collapsed}
          aria-expanded={!collapsed}
          onClick={() => setCollapsed(v => !v)}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {/* Simple icon: chevrons (no deps) */}
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            {collapsed ? (
              <path fill="currentColor" d="m9 6 6 6-6 6" />
            ) : (
              <path fill="currentColor" d="m15 6-6 6 6 6" />
            )}
          </svg>
        </button>
      </div>

      {/* Nav items */}
      <nav className="space-y-1 text-sm">
        <SideLink collapsed={collapsed} href="#editors" label="Editors" icon="✏️" />
        <SideLink collapsed={collapsed} href="#actions" label="Actions" icon="⚙️" />
        <SideLink collapsed={collapsed} href="#results" label="Results" icon="📄" />
      </nav>
    </aside>
  )
}

function SideLink({
  collapsed,
  href,
  label,
  icon,
}: {
  collapsed: boolean
  href: string
  label: string
  icon?: string
}) {
  return (
    <a
      href={href}
      className={[
        "group flex items-center gap-2 rounded px-2 py-1 hover:bg-gray-100",
        "transition-[padding,opacity,width] duration-200",
      ].join(" ")}
      title={collapsed ? label : undefined} // tooltip on hover when collapsed
    >
      <span aria-hidden="true" className="w-5 text-center">
        {icon ?? "•"}
      </span>

      {/* Hide label when collapsed but keep for AT with aria-hidden */}
      <span
        className={[
          "whitespace-nowrap text-gray-700",
          collapsed ? "opacity-0 pointer-events-none w-0" : "opacity-100 w-auto",
          "transition-[opacity,width] duration-200",
        ].join(" ")}
        aria-hidden={collapsed}
      >
        {label}
      </span>
    </a>
  )
}
