export default function Footer() {
  return (
    <footer
      role="contentinfo"
      className="border-t border-gray-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 text-xs text-gray-500">
        © {new Date().getFullYear()} Diffchecker YAML — for practice use.
      </div>
    </footer>
  )
}
