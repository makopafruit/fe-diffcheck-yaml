import { useState, useEffect } from "react"

export default function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0)
    onScroll() // set initial state
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      role="banner"
      style={{
        // Keep height consistent with CSS var in global styles
        height: "var(--header-h)",
        // Respect iOS safe areas
        paddingTop: "max(env(safe-area-inset-top), 0px)",
      }}
      className={[
        "fixed inset-x-0 top-0 z-50",
        "bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60",
        scrolled ? "shadow-sm ring-1 ring-black/5" : "",
        "transition-colors duration-200",
      ].join(" ")}
    >
      <div className="h-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-full items-center justify-between">
          {/* Logo */}
          <a href="#" className="font-semibold tracking-tight">
            AppName
          </a>

          {/* Navigation (desktop only for now) */}
          <nav aria-label="Primary navigation" className="hidden md:flex gap-6">
            <a
              href="#features"
              className="text-sm text-gray-700 hover:text-gray-900"
            >
              header
            </a>
            <a
              href="#pricing"
              className="text-sm text-gray-700 hover:text-gray-900"
            >
              header
            </a>
            <a
              href="#contact"
              className="text-sm text-gray-700 hover:text-gray-900"
            >
              header
            </a>
          </nav>
        </div>
      </div>
    </header>
  )
}
