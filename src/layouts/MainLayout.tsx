import type { ReactNode } from "react"
import Header from "../components/Header"
import SideNav from "../components/SideNav"
import Footer from "../components/Footer"

type MainLayoutProps = { children: ReactNode }

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <>
      <Header />
      <div
        className="min-h-[calc(100dvh-var(--header-h))]"
        style={{ paddingTop: "var(--header-h)" }}
      >
        {/* FULL-WIDTH with controllable gutters */}
        <div className="w-full px-[var(--page-gutter)] py-4">
          {/* Sidebar + content; uses CSS var width for the sidenav */}
          <div className="grid grid-cols-1 md:grid-cols-[var(--sidenav-w,_220px)_minmax(0,1fr)] gap-4">
            <SideNav />
            <main id="content" role="main" className="pb-8">
              {children}
            </main>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}