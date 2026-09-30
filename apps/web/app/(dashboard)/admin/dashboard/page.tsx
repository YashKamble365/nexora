"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Clock,
  LifeBuoy,
  Shield,
  ShieldAlert,
  Users,
  Megaphone,
  FileText,
  Vote,
  FolderOpen,
  Building2,
  Layers,
} from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { PriorityBadge } from "@/components/shared/priority-badge"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api"
import { cn } from "@/lib/utils"

interface AdminMetrics {
  institutes?: {
    total: number;
    approved: number;
    pending: number;
  };
  users: {
    total: number;
    students: number;
    faculty: number;
    admins: number;
    online: number;
    pending: number;
  };
  complaints: {
    open: number;
    resolved: number;
  };
  notices: {
    published: number;
  };
  polls: {
    active: number;
  };
  files: {
    count: number;
    downloads: number;
    totalBytes: number;
  };
  emergency: {
    hasActiveAlert: boolean;
    severity: string | null;
    title: string | null;
  };
}

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const [metrics, setMetrics] = React.useState<AdminMetrics | null>(null)
  const [recentComplaints, setRecentComplaints] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  const isSuperAdmin = user?.role === "SUPER_ADMIN"

  const fetchDashboardData = React.useCallback(async () => {
    try {
      const [mRes, cRes] = await Promise.all([
        apiClient.get<{ data: AdminMetrics }>("/admin/metrics"),
        apiClient.get<any[]>("/complaints"),
      ])
      setMetrics(mRes?.data || null)
      setRecentComplaints(Array.isArray(cRes) ? cRes.slice(0, 3) : [])
    } catch (err) {
      console.warn("Failed to load admin metrics:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          isSuperAdmin
            ? "Platform Control Center"
            : `${user?.instituteName || (typeof user?.instituteId === 'object' ? (user?.instituteId as any)?.name : null) || "P. R. Pote Patil College of Engineering and Management"} Administration`
        }
        description={
          isSuperAdmin
            ? "Platform-wide multi-tenant governance, college authorizations, and root compliance."
            : "Institutional governance, verification workflows, and campus safety operations."
        }
        badge={
          <Badge
            variant="outline"
            className={
              isSuperAdmin
                ? "bg-amber-500/10 text-amber-600 border-amber-500/20 font-semibold"
                : "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 font-semibold"
            }
          >
            <Shield className="h-3 w-3 mr-1" />
            {isSuperAdmin ? "Super Admin Platform Root" : `Campus Admin (${user?.instituteCode || "HQ"})`}
          </Badge>
        }
      >
        {isSuperAdmin ? (
          <>
            <Link
              href="/admin/approvals"
              className={cn(buttonVariants({ size: "sm" }), "bg-amber-600 hover:bg-amber-700 text-white")}
            >
              <Building2 className="mr-2 h-4 w-4" />
              Verify Colleges ({metrics?.institutes?.pending ?? 0})
            </Link>
            <Link
              href="/admin/users"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <Users className="mr-2 h-4 w-4" />
              Global Users
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/app/emergency"
              className={cn(buttonVariants({ variant: "destructive", size: "sm" }))}
            >
              <ShieldAlert className="mr-2 h-4 w-4" />
              Broadcast Emergency
            </Link>
            <Link
              href="/admin/users"
              className={cn(buttonVariants({ size: "sm" }))}
            >
              <Users className="mr-2 h-4 w-4" />
              Manage Users
            </Link>
          </>
        )}
      </PageHeader>

      {/* Admin Operational KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">
              {isSuperAdmin ? "Registered Campuses" : "Total Campus Users"}
            </span>
            {isSuperAdmin ? (
              <Building2 className="h-4 w-4 text-primary" />
            ) : (
              <Users className="h-4 w-4 text-primary" />
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight">
              {loading
                ? "..."
                : isSuperAdmin
                ? metrics?.institutes?.total ?? 0
                : metrics?.users.total ?? 0}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              {isSuperAdmin
                ? `${metrics?.institutes?.approved ?? 0} active • ${metrics?.institutes?.pending ?? 0} pending`
                : `${metrics?.users.online ?? 0} active now`}
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">
              {isSuperAdmin ? "Global Network Users" : "Open Grievances"}
            </span>
            {isSuperAdmin ? (
              <Users className="h-4 w-4 text-primary" />
            ) : (
              <LifeBuoy className="h-4 w-4 text-amber-500" />
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight">
              {loading
                ? "..."
                : isSuperAdmin
                ? metrics?.users.total ?? 0
                : metrics?.complaints.open ?? 0}
            </span>
            <span className="text-xs text-muted-foreground">
              {isSuperAdmin
                ? `${metrics?.users.students ?? 0} students • ${metrics?.users.faculty ?? 0} staff`
                : `${metrics?.complaints.resolved ?? 0} resolved`}
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">
              {isSuperAdmin ? "Civic Governance" : "Active Bulletins"}
            </span>
            {isSuperAdmin ? (
              <Vote className="h-4 w-4 text-indigo-500" />
            ) : (
              <Megaphone className="h-4 w-4 text-indigo-500" />
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight">
              {loading
                ? "..."
                : isSuperAdmin
                ? metrics?.polls.active ?? 0
                : metrics?.notices.published ?? 0}
            </span>
            <span className="text-xs text-muted-foreground">
              {isSuperAdmin
                ? "active campus polls"
                : "published live"}
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Security Grid</span>
            <Shield className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            {metrics?.emergency.hasActiveAlert ? (
              <>
                <span className="text-2xl font-bold tracking-tight text-destructive animate-pulse">
                  {metrics.emergency.severity}
                </span>
                <span className="text-xs text-destructive font-semibold">Incident Active</span>
              </>
            ) : (
              <>
                <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                  Normal
                </span>
                <span className="text-xs text-muted-foreground">
                  {isSuperAdmin ? "All campus grids normal" : "Zero active alerts"}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Actionable Urgent Queues */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold tracking-tight">
                {isSuperAdmin ? "Platform Grievance Monitoring" : "Triage Required Grievances"}
              </h2>
              <Badge variant="outline" className="text-xs">
                {metrics?.complaints.open ?? 0} pending
              </Badge>
            </div>
            <Link
              href="/app/complaints"
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              Open grievance grid <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentComplaints.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                No open student grievances currently require triage.
              </div>
            ) : (
              recentComplaints.map((c) => (
                <div key={c.id} className="rounded-lg border border-border bg-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-medium text-muted-foreground">
                        {c.ticketNumber || c.id.slice(-6).toUpperCase()}
                      </span>
                      <PriorityBadge priority={c.priority} />
                      <StatusBadge status={c.status} />
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {c.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {c.description}
                  </p>
                  <div className="pt-2 flex items-center gap-2">
                    <Link
                      href="/app/complaints"
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-7 text-xs")}
                    >
                      View Ticket & Timeline
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Administration Quick Shortcuts */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold tracking-tight">
            {isSuperAdmin ? "Platform Governance" : "Admin Hub"}
          </h2>
          <div className="rounded-lg border border-border bg-card p-4 space-y-2.5">
            <Link
              href="/admin/approvals"
              className="flex items-center justify-between p-2.5 rounded-md hover:bg-muted text-xs font-medium transition-colors"
            >
              <span className="flex items-center gap-2">
                {isSuperAdmin ? (
                  <Building2 className="h-4 w-4 text-primary" />
                ) : (
                  <Users className="h-4 w-4 text-primary" />
                )}
                {isSuperAdmin ? "College Approvals" : "Verification Hub"}
              </span>
              <span className="text-muted-foreground">
                {isSuperAdmin
                  ? `${metrics?.institutes?.pending ?? 0} pending →`
                  : `${metrics?.users.pending ?? 0} pending →`}
              </span>
            </Link>

            <Link
              href="/admin/users"
              className="flex items-center justify-between p-2.5 rounded-md hover:bg-muted text-xs font-medium transition-colors"
            >
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                {isSuperAdmin ? "Platform User Roster" : "Users & Roles Directory"}
              </span>
              <span className="text-muted-foreground">Manage →</span>
            </Link>

            {!isSuperAdmin && (
              <Link
                href="/admin/structure"
                className="flex items-center justify-between p-2.5 rounded-md hover:bg-muted text-xs font-medium transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" /> Academic Blueprint
                </span>
                <span className="text-muted-foreground">Configure →</span>
              </Link>
            )}

            <Link
              href="/admin/analytics"
              className="flex items-center justify-between p-2.5 rounded-md hover:bg-muted text-xs font-medium transition-colors"
            >
              <span className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                {isSuperAdmin ? "Network Analytics" : "Campus Engagement"}
              </span>
              <span className="text-muted-foreground">View stats →</span>
            </Link>

            <Link
              href="/admin/audit-logs"
              className="flex items-center justify-between p-2.5 rounded-md hover:bg-muted text-xs font-medium transition-colors"
            >
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" /> Compliance Audit Trail
              </span>
              <span className="text-muted-foreground">Immutable ledger →</span>
            </Link>

            {!isSuperAdmin && (
              <Link
                href="/app/emergency"
                className="flex items-center justify-between p-2.5 rounded-md hover:bg-destructive/10 text-xs font-medium transition-colors text-destructive"
              >
                <span className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-destructive" /> Emergency Siren Center
                </span>
                <span className="text-destructive font-semibold">Active Grid →</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
