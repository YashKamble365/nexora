import Link from "next/link"
import { ShieldCheck } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground">
      {/* Left Institutional Identity Panel */}
      <div className="hidden md:flex md:w-1/2 lg:w-5/12 bg-sidebar border-r border-border p-10 flex-col justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm tracking-tight shadow-sm">
            N
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight leading-none text-sidebar-foreground">
              Nexora
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
              Higher Education Operating System
            </span>
          </div>
        </Link>

        <div className="space-y-6 max-w-sm">
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <blockquote className="space-y-2">
            <p className="text-xl font-semibold tracking-tight text-sidebar-foreground leading-snug">
              “Institutional governance and student lifecycle in one unified operating layer.”
            </p>
            <footer className="text-xs text-muted-foreground">
              Universal Campus Standard • Multi-Tenant Enterprise Architecture
            </footer>
          </blockquote>
          <div className="pt-4 border-t border-sidebar-border text-xs text-muted-foreground space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              Role-governed data isolation per campus
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              Verified departmental rosters & academic syllabi
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              Audit-compliant grievance resolution workflows
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground flex items-center justify-between border-t border-sidebar-border/60 pt-4">
          <span>Enterprise Campus Cloud</span>
          <span className="font-mono text-[10px] text-muted-foreground/80">v2026.4</span>
        </div>
      </div>

      {/* Right Form Viewport */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12">
        <div className="flex justify-between md:justify-end items-center">
          <Link href="/" className="md:hidden flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-xs">
              N
            </div>
            <span className="font-semibold text-sm">Nexora</span>
          </Link>
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md md:max-w-xl lg:max-w-2xl xl:max-w-3xl mx-auto my-auto py-8 transition-all">
          {children}
        </div>

        <div className="text-center text-xs text-muted-foreground">
          Institutional access secured • Autonomous campus credential gateway
        </div>
      </div>
    </div>
  )
}
