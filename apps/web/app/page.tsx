import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  Clock,
  Compass,
  FileCheck2,
  GraduationCap,
  Layers,
  Lock,
  MessageSquare,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  Users,
  Vote,
} from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      {/* Top Enterprise Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm tracking-tight shadow-sm">
              N
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight leading-none">
                Nexora
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                Higher Education OS
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <a href="#solutions" className="hover:text-foreground transition-colors">
              Pillars
            </a>
            <a href="#showcase" className="hover:text-foreground transition-colors">
              Platform
            </a>
            <a href="#capabilities" className="hover:text-foreground transition-colors">
              Capabilities
            </a>
            <a href="#roles" className="hover:text-foreground transition-colors">
              Governance
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <Link
              href="/auth/login"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs font-semibold h-9 px-3.5")}
            >
              Sign In
            </Link>
            <Link
              href="/auth/register?tab=institute"
              className={cn(buttonVariants({ size: "sm" }), "hidden sm:inline-flex text-xs font-semibold h-9 px-4 shadow-sm")}
            >
              Register College
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-16 md:pt-24 md:pb-20 border-b border-border/60 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-border bg-muted/60 text-xs font-medium text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            Universal Campus Operating Standard • Release 2026-27
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.12]">
            Unified Institutional Governance for Higher Education
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed font-normal">
            A single authenticated operating layer connecting university leadership, department heads, teaching faculty, and students across autonomous institutions.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <Link
              href="/auth/login"
              className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto px-7 h-11 text-xs font-semibold shadow-sm")}
            >
              Access Campus Portal <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/auth/register?tab=institute"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto px-7 h-11 text-xs font-semibold")}
            >
              Onboard Your Institution
            </Link>
          </div>

          {/* Academic Domain Pills */}
          <div className="pt-8 border-t border-border/50 max-w-3xl mx-auto">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Engineered for Diverse Academic Disciplines
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs border border-border bg-card font-medium">
                <Compass className="h-3.5 w-3.5 text-primary" /> Engineering & Technology
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs border border-border bg-card font-medium">
                <Stethoscope className="h-3.5 w-3.5 text-rose-500" /> Medical & Health Sciences
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs border border-border bg-card font-medium">
                <BookOpen className="h-3.5 w-3.5 text-indigo-500" /> Arts, Science & Humanities
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs border border-border bg-card font-medium">
                <Scale className="h-3.5 w-3.5 text-amber-500" /> Law & Public Policy
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs border border-border bg-card font-medium">
                <Building2 className="h-3.5 w-3.5 text-teal-500" /> Management & Commerce
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Platform Architecture Showcase */}
      <section id="showcase" className="py-20 border-b border-border/60 bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto space-y-2.5 mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Institutional Architecture in Action</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Every workflow enforces strict auditability, role isolation, and academic compliance.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-lg p-6 sm:p-8">
            <Tabs defaultValue="academics" className="w-full">
              <TabsList className="grid grid-cols-2 md:grid-cols-4 h-auto p-1 bg-muted/70 gap-1 mb-8">
                <TabsTrigger value="academics" className="text-xs py-2 font-medium">
                  Academic Curricula
                </TabsTrigger>
                <TabsTrigger value="grievances" className="text-xs py-2 font-medium">
                  Grievance Redressal
                </TabsTrigger>
                <TabsTrigger value="democracy" className="text-xs py-2 font-medium">
                  Institutional Polling
                </TabsTrigger>
                <TabsTrigger value="governance" className="text-xs py-2 font-medium">
                  Campus Governance
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Academic Curricula */}
              <TabsContent value="academics" className="space-y-6 focus-visible:outline-none">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  <div className="lg:col-span-1 space-y-3">
                    <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
                      <BookOpen className="h-4 w-4" /> Curriculum Roster
                    </div>
                    <h3 className="text-lg font-bold tracking-tight">Departmental Syllabus & Faculty Assignment</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Department heads configure official course catalogs. Faculty members claim teaching divisions, publish verified subject notes, and maintain academic continuity.
                    </p>
                    <div className="pt-2 space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        Official semester course catalogs
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        Division-specific faculty rosters
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        Verified curriculum exit feedback
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2 rounded-lg border border-border bg-background p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-border text-xs">
                      <div>
                        <span className="font-semibold text-foreground">Course Catalog & Active Faculty</span>
                        <p className="text-[11px] text-muted-foreground">Academic Session 2026-27 • Semester 5</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        Accredited Curriculum
                      </Badge>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between p-3 rounded-md border border-border/80 bg-muted/30 text-xs">
                        <div className="space-y-0.5">
                          <span className="font-semibold block">CS-501: Distributed Database Systems</span>
                          <span className="text-[11px] text-muted-foreground">4 Credits • Theory + Laboratory</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-medium text-foreground">Assigned: Prof. D. Rao</span>
                          <span className="text-[10px] block text-emerald-600 font-semibold">Division A & B</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-md border border-border/80 bg-muted/30 text-xs">
                        <div className="space-y-0.5">
                          <span className="font-semibold block">CS-504: Cloud Architecture & DevOps</span>
                          <span className="text-[11px] text-muted-foreground">3 Credits • Practical Elective</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-medium text-foreground">Assigned: Dr. S. Verma</span>
                          <span className="text-[10px] block text-emerald-600 font-semibold">Division A</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-md border border-border/80 bg-muted/30 text-xs">
                        <div className="space-y-0.5">
                          <span className="font-semibold block">CS-509: Information Security & Ethics</span>
                          <span className="text-[11px] text-muted-foreground">3 Credits • Core Requirement</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-medium text-foreground">Assigned: Prof. K. Joshi</span>
                          <span className="text-[10px] block text-emerald-600 font-semibold">Division C</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 2: Grievance Redressal */}
              <TabsContent value="grievances" className="space-y-6 focus-visible:outline-none">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  <div className="lg:col-span-1 space-y-3">
                    <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
                      <FileCheck2 className="h-4 w-4" /> Transparent Accountability
                    </div>
                    <h3 className="text-lg font-bold tracking-tight">Institutional Issue Tracking & SLAs</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Complaints are submitted with priority classification, routed directly to designated coordinators or campus facilities, and monitored against statutory resolution deadlines.
                    </p>
                    <div className="pt-2 space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        Optional anonymous submission toggle
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        Assigned coordinator accountability
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        Immutable resolution audit trail
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2 rounded-lg border border-border bg-background p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-border text-xs">
                      <div>
                        <span className="font-semibold text-foreground">Active Grievance Tickets</span>
                        <p className="text-[11px] text-muted-foreground">Department Committee Queue</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono text-amber-600 border-amber-300">
                        SLA Monitored
                      </Badge>
                    </div>

                    <div className="space-y-2.5">
                      <div className="p-3 rounded-md border border-border/80 bg-muted/30 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] text-muted-foreground font-semibold">TKT-2026-081</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            In Investigation
                          </span>
                        </div>
                        <div className="font-semibold">Library Digital Terminal Network Latency</div>
                        <p className="text-[11px] text-muted-foreground">Assigned to IT Infrastructure Committee. 16 hours remaining under institutional SLA.</p>
                      </div>

                      <div className="p-3 rounded-md border border-border/80 bg-muted/30 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] text-muted-foreground font-semibold">TKT-2026-074</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            Resolved & Verified
                          </span>
                        </div>
                        <div className="font-semibold">Laboratory Workstation Replacement (Room 204)</div>
                        <p className="text-[11px] text-muted-foreground">Hardware installed and inspected by Dept Lab In-charge.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 3: Polling & Surveys */}
              <TabsContent value="democracy" className="space-y-6 focus-visible:outline-none">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  <div className="lg:col-span-1 space-y-3">
                    <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
                      <Vote className="h-4 w-4" /> Democratic Participation
                    </div>
                    <h3 className="text-lg font-bold tracking-tight">Institutional Polling & Course Exit Reviews</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Faculty and student representatives conduct authenticated elections, course satisfaction exit surveys, and departmental referendums with strict duplicate prevention.
                    </p>
                    <div className="pt-2 space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        Single-vote cryptographic token validation
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        Targeted cohort restrictions by year & branch
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        Real-time analytical percentage breakdowns
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2 rounded-lg border border-border bg-background p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-border text-xs">
                      <div>
                        <span className="font-semibold text-foreground">Annual Symposium Keynote Track</span>
                        <p className="text-[11px] text-muted-foreground">Verified Student Council Ballot • Closes Friday</p>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Active Poll
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 rounded border border-border bg-muted/20 space-y-1">
                        <div className="flex justify-between font-medium">
                          <span>AI & Quantum Architectures</span>
                          <span className="font-mono text-muted-foreground">58% (342 votes)</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                          <div className="bg-primary h-1.5 rounded-full" style={{ width: "58%" }} />
                        </div>
                      </div>

                      <div className="p-2.5 rounded border border-border bg-muted/20 space-y-1">
                        <div className="flex justify-between font-medium">
                          <span>Sustainable Energy Grids</span>
                          <span className="font-mono text-muted-foreground">27% (159 votes)</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                          <div className="bg-primary/70 h-1.5 rounded-full" style={{ width: "27%" }} />
                        </div>
                      </div>

                      <div className="p-2.5 rounded border border-border bg-muted/20 space-y-1">
                        <div className="flex justify-between font-medium">
                          <span>Biotechnology & Genomic Data</span>
                          <span className="font-mono text-muted-foreground">15% (88 votes)</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                          <div className="bg-primary/50 h-1.5 rounded-full" style={{ width: "15%" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 4: Governance & Verification */}
              <TabsContent value="governance" className="space-y-6 focus-visible:outline-none">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  <div className="lg:col-span-1 space-y-3">
                    <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
                      <ShieldCheck className="h-4 w-4" /> Administrative Oversight
                    </div>
                    <h3 className="text-lg font-bold tracking-tight">Multi-Tier Approval & Institutional Structure</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Campus administrators maintain full oversight: approve new faculty applications, manage department programs, issue urgent safety broadcasts, and inspect immutable system audit logs.
                    </p>
                    <div className="pt-2 space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        Multi-step faculty onboarding approval
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        Campus-wide emergency broadcast grid
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        Complete institutional data isolation
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2 rounded-lg border border-border bg-background p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-border text-xs">
                      <div>
                        <span className="font-semibold text-foreground">Pending Faculty Verification Requests</span>
                        <p className="text-[11px] text-muted-foreground">Principal & Dean Approval Desk</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        2 Awaiting Decision
                      </Badge>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between p-3 rounded-md border border-border/80 bg-muted/30 text-xs">
                        <div className="space-y-0.5">
                          <span className="font-semibold block">Dr. Ananya Sengupta</span>
                          <span className="text-[11px] text-muted-foreground">Appointed: Head of Department • Electronics Engineering</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            Credentials Verified
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-md border border-border/80 bg-muted/30 text-xs">
                        <div className="space-y-0.5">
                          <span className="font-semibold block">Prof. Rajesh Malhotra</span>
                          <span className="text-[11px] text-muted-foreground">Appointed: Class Coordinator • Final Year Mechanical</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            Pending Dean Signoff
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      {/* Core Enterprise Capabilities */}
      <section id="capabilities" className="py-20 border-b border-border/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto space-y-2.5 mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Enterprise Infrastructure Modules</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Built from first principles to fulfill regulatory standards and institutional workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold">Multi-Tenant Campus Isolation</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Autonomous data boundaries ensure every institution retains complete privacy over member profiles, grievances, notices, and curricula.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold">Five-Tier Role Hierarchy</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Granular permissions distinguish Students, Class Coordinators, Department Heads, Campus Administrators, and University Trustees.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="h-9 w-9 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold">Emergency Broadcast Grid</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                High-priority safety and contingency alerts dispatched across connected student and faculty devices with two-step administrative confirmation.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold">Auditable Grievance Timelines</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Formal complaint resolution with transparent status steps, assignee accountability, SLA clocks, and permanent compliance logs.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold">Course Exit & Syllabus Review</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Automated end-semester satisfaction surveys and syllabus completion verification aligned with accreditation requirements.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold">Regulatory Access Records</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Strict audit logs recording credential changes, role promotions, and institutional policy edits for compliance inspections.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Institutional Roles Matrix */}
      <section id="roles" className="py-20 border-b border-border/60 bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto space-y-2.5 mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Structured for Every Institutional Persona</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Clear responsibilities and server-side boundaries tailored to university governance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <h3 className="text-base font-bold">Students</h3>
                </div>
                <Badge variant="outline" className="text-[10px]">Academic</Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Access official notices, submit transparent grievances, review course syllabi, vote in campus referendums, and participate in verified events.
              </p>
              <div className="pt-2 text-xs space-y-1.5 text-muted-foreground font-mono">
                <div>• Verified institutional identity</div>
                <div>• Anonymous or direct issue filing</div>
                <div>• Division course materials</div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="text-base font-bold">Faculty & HoDs</h3>
                </div>
                <Badge variant="outline" className="text-[10px]">Instruction</Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Manage subject allocations, approve student cohort actions, publish official notices, review course exit feedback, and resolve department tickets.
              </p>
              <div className="pt-2 text-xs space-y-1.5 text-muted-foreground font-mono">
                <div>• Department notice publishing</div>
                <div>• Course assignment & syllabus tracking</div>
                <div>• Student approval queue</div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h3 className="text-base font-bold">Executive Leadership</h3>
                </div>
                <Badge variant="outline" className="text-[10px]">Governance</Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Configure campus departments and academic calendars, verify incoming faculty appointments, dispatch emergency alerts, and inspect campus analytics.
              </p>
              <div className="pt-2 text-xs space-y-1.5 text-muted-foreground font-mono">
                <div>• Institution-wide emergency dispatch</div>
                <div>• Regulatory compliance audit trail</div>
                <div>• Multi-department analytics</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Institutional Onboarding Callout Banner */}
      <section className="py-16 border-b border-border/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="rounded-2xl border border-border bg-card p-8 sm:p-12 text-center space-y-5 shadow-sm">
            <Badge variant="outline" className="text-xs font-semibold px-3 py-1">
              Autonomous & Affiliated Institutions
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Ready to modernize your campus operations?
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Register your college on the Nexora grid in minutes. Complete with autonomous departmental structures, faculty onboarding queues, and accreditation-ready records.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/auth/register?tab=institute"
                className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto px-7 h-11 text-xs font-semibold")}
              >
                Register Your Institution
              </Link>
              <Link
                href="/auth/register"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto px-7 h-11 text-xs font-semibold")}
              >
                Join Approved Campus
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Footer */}
      <footer className="py-12 border-t border-border mt-auto bg-muted/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-border/60">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground font-bold text-xs">
                  N
                </div>
                <span className="font-bold text-sm tracking-tight">Nexora</span>
                <span className="text-[10px] font-mono text-muted-foreground">v2026.4</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Universal Higher Education Operating System • Multi-Campus Infrastructure
              </p>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-muted-foreground">All Institutional Grid Systems Operational</span>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <div>
              &copy; {new Date().getFullYear()} Nexora Educational Systems. All institutional rights reserved.
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <Link href="/auth/login" className="hover:text-foreground transition-colors">
                Sign In
              </Link>
              <Link href="/auth/register" className="hover:text-foreground transition-colors">
                Member Registration
              </Link>
              <Link href="/auth/register?tab=institute" className="hover:text-foreground transition-colors">
                College Onboarding
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
