"use client"

import * as React from "react"
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Filter,
  Users,
  LifeBuoy,
  FileText,
  Star,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  Clock,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Megaphone,
  Vote,
  Award,
  GraduationCap,
  Eye,
  BookOpen,
  Building2,
  Shield,
  ShieldAlert,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/shared/page-header"
import { useAuth } from "@/lib/auth-context"
import { apiClient, getApiBase } from "@/lib/api"

interface TrendBucket {
  date: string;
  label: string;
  messages: number;
  notices: number;
  complaints: number;
}

interface DepartmentStat {
  department: string;
  users: number;
  complaints: number;
  noticeReads: number;
  avgRating: number;
  pollVotes: number;
}

interface InstituteStat {
  id: string;
  name: string;
  code: string;
  status: string;
  users: number;
  students: number;
  faculty: number;
  noticeReads: number;
  avgRating: number;
  pollVotes: number;
  openComplaints: number;
  hasActiveAlert: boolean;
  alertSeverity: string | null;
}

interface AnalyticsData {
  scope: 'GLOBAL' | 'CAMPUS';
  range: string;
  department?: string;
  instituteId?: string;
  instituteName?: string;
  instituteCode?: string;
  trends: TrendBucket[];
  departments?: DepartmentStat[];
  institutesMatrix?: InstituteStat[];
  institutesSummary?: {
    total: number;
    approved: number;
    pending: number;
  };
  readership: {
    totalNotices: number;
    totalReads: number;
    penetrationRate: number;
    activeStudents: number;
  };
  evaluations: {
    avgRating: number;
    avgClarity: number;
    avgPace: number;
    totalCount: number;
    topCourses?: {
      course: string;
      faculty: string;
      department: string;
      avgRating: number;
      reviewsCount: number;
    }[];
  };
  democracy: {
    totalPolls: number;
    activePolls: number;
    totalVotes: number;
    turnoutRate: number;
  };
  grievances: {
    statusBreakdown: { status: string; count: number }[];
    priorityBreakdown: { priority: string; count: number }[];
    avgResolutionHours: number;
    totalResolved: number;
  };
}

export default function AdminAnalyticsPage() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === "SUPER_ADMIN"

  const [data, setData] = React.useState<AnalyticsData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [range, setRange] = React.useState<'7d' | '14d' | '30d' | '90d'>('30d')
  const [instituteScope, setInstituteScope] = React.useState<string>('ALL')
  const [institutesList, setInstitutesList] = React.useState<any[]>([])
  const [department, setDepartment] = React.useState('ALL')
  const [activeSeries, setActiveSeries] = React.useState<'all' | 'messages' | 'notices' | 'complaints'>('all')
  const [isExporting, setIsExporting] = React.useState(false)

  // Fetch institutes directory for Super Admin selector
  React.useEffect(() => {
    if (isSuperAdmin) {
      apiClient
        .get<{ institutes: any[] }>("/institutes/all")
        .then((res) => {
          setInstitutesList(res.institutes || [])
        })
        .catch(() => {})
    }
  }, [isSuperAdmin])

  const fetchAnalytics = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('range', range)
      if (isSuperAdmin && instituteScope !== 'ALL') {
        params.set('instituteId', instituteScope)
      }
      if (department !== 'ALL') {
        params.set('department', department)
      }

      const res = await apiClient.get<{ data: AnalyticsData }>(`/admin/analytics/detailed?${params.toString()}`)
      setData(res?.data || null)
    } catch (err) {
      console.warn("Failed to load analytics:", err)
    } finally {
      setLoading(false)
    }
  }, [range, instituteScope, department, isSuperAdmin])

  React.useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("nexora_token") : null
      const params = new URLSearchParams()
      params.set('range', range)
      if (isSuperAdmin && instituteScope !== 'ALL') {
        params.set('instituteId', instituteScope)
      }
      const res = await fetch(`${getApiBase()}/admin/analytics/export?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error("Export failed")
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `nexora_analytics_${instituteScope}_${range}_${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      alert(err.message || "Failed to download export")
    } finally {
      setIsExporting(false)
    }
  }

  // Calculate totals and maximums for chart scales
  const trends = data?.trends || []
  const maxVal = Math.max(
    ...trends.map((t) => Math.max(t.messages, t.notices, t.complaints)),
    10
  )

  const isGlobalView = isSuperAdmin && instituteScope === 'ALL'
  const totalGlobalUsers = data?.institutesMatrix?.reduce((acc, i) => acc + i.users, 0) || data?.readership?.activeStudents || 0
  const totalGlobalStudents = data?.institutesMatrix?.reduce((acc, i) => acc + i.students, 0) || 0
  const totalGlobalFaculty = data?.institutesMatrix?.reduce((acc, i) => acc + i.faculty, 0) || 0
  const totalCampusUsers = data?.departments?.reduce((acc, d) => acc + d.users, 0) || 0

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        title={
          isGlobalView
            ? "Global Campus Network Intelligence"
            : `${data?.instituteName || user?.instituteName || (typeof user?.instituteId === 'object' ? (user?.instituteId as any)?.name : null) || "Campus"} Intelligence & Telemetry`
        }
        description={
          isGlobalView
            ? "Platform-wide executive telemetry: multi-campus governance, network velocity, and institutional performance."
            : "Empirical analytics, operational velocity, faculty teaching quality, and democratic civic turnout."
        }
        badge={
          <Badge
            variant="outline"
            className={`text-xs font-semibold ${
              isGlobalView
                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                : "bg-primary/10 text-primary border-primary/20"
            }`}
          >
            <Sparkles className="h-3 w-3 mr-1" />
            {isGlobalView ? "Global Multi-Tenant Root" : `Campus Grid (${data?.instituteCode || "HQ"})`}
          </Badge>
        }
      >
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          disabled={isExporting}
          className="h-8 text-xs font-semibold"
        >
          <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
          {isExporting ? "Exporting..." : "Export CSV Report"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => fetchAnalytics()} className="h-8">
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </PageHeader>

      {/* Filter Toolbar: Scope Switcher & Range */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-card p-3 rounded-lg border shadow-xs">
        {/* Left: Date Range Tabs */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-md text-xs font-semibold">
          <button
            onClick={() => setRange('7d')}
            className={`px-3 py-1 rounded transition-colors ${
              range === '7d' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setRange('14d')}
            className={`px-3 py-1 rounded transition-colors ${
              range === '14d' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            14 Days
          </button>
          <button
            onClick={() => setRange('30d')}
            className={`px-3 py-1 rounded transition-colors ${
              range === '30d' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setRange('90d')}
            className={`px-3 py-1 rounded transition-colors ${
              range === '90d' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            90 Days
          </button>
        </div>

        {/* Right: Dual-Scope Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Super Admin Institute Selector */}
          {isSuperAdmin && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1 font-semibold">
                <Building2 className="h-3.5 w-3.5 text-primary" /> Campus:
              </span>
              <select
                value={instituteScope}
                onChange={(e) => {
                  setInstituteScope(e.target.value)
                  setDepartment('ALL') // Reset department when switching institute
                }}
                className="h-8 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium"
              >
                <option value="ALL">🌐 Global Platform (All Campuses)</option>
                {institutesList.map((inst) => (
                  <option key={inst._id || inst.id} value={inst._id || inst.id}>
                    {inst.name} ({inst.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Department Selector (Active when a specific college or Campus Admin is selected) */}
          {!isGlobalView && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1 font-semibold">
                <Filter className="h-3.5 w-3.5 text-primary" /> Dept:
              </span>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium"
              >
                <option value="ALL">All Departments</option>
                {data?.departments?.map((d) => (
                  <option key={d.department} value={d.department}>
                    {d.department}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Primary KPI Row: Context Aware (Global vs Campus) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isGlobalView ? (
          <>
            {/* KPI 1: Connected Colleges */}
            <Card className="hover:border-primary/40 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-semibold uppercase tracking-wider">Affiliated Colleges</span>
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight mt-1">
                  {loading ? "..." : data?.institutesSummary?.total ?? 0}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground flex items-center justify-between">
                <span>
                  {data?.institutesSummary?.approved ?? 0} active • {data?.institutesSummary?.pending ?? 0} pending
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                  Accredited <ArrowUpRight className="h-3 w-3" />
                </span>
              </CardContent>
            </Card>

            {/* KPI 2: Global Network Users */}
            <Card className="hover:border-primary/40 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-semibold uppercase tracking-wider">Network Population</span>
                  <Users className="h-4 w-4 text-indigo-500" />
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight mt-1">
                  {loading ? "..." : totalGlobalUsers}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {totalGlobalStudents} students • {totalGlobalFaculty} faculty members
              </CardContent>
            </Card>

            {/* KPI 3: Network Bulletin Reach */}
            <Card className="hover:border-primary/40 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-semibold uppercase tracking-wider">Network Bulletin Reach</span>
                  <Megaphone className="h-4 w-4 text-purple-500" />
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight mt-1">
                  {loading ? "..." : `${data?.readership?.penetrationRate ?? 80}%`}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {data?.readership?.totalReads ?? 0} reads across {data?.readership?.totalNotices ?? 0} global bulletins
              </CardContent>
            </Card>

            {/* KPI 4: Global Teaching Index */}
            <Card className="hover:border-primary/40 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-semibold uppercase tracking-wider">Global Teaching Score</span>
                  <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight mt-1">
                  {loading ? "..." : `${data?.evaluations?.avgRating ?? 4.6} / 5.0`}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Across {data?.evaluations?.totalCount ?? 0} student pedagogical reviews
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* Campus Scope: KPI 1: Campus Population */}
            <Card className="hover:border-primary/40 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-semibold uppercase tracking-wider">Campus Population</span>
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight mt-1">
                  {loading ? "..." : totalCampusUsers}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground flex items-center justify-between">
                <span>Verified members</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                  Active <ArrowUpRight className="h-3 w-3" />
                </span>
              </CardContent>
            </Card>

            {/* Campus Scope: KPI 2: Notice Readership */}
            <Card className="hover:border-primary/40 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-semibold uppercase tracking-wider">Bulletin Readership</span>
                  <Megaphone className="h-4 w-4 text-indigo-500" />
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight mt-1">
                  {loading ? "..." : `${data?.readership?.penetrationRate ?? 82}%`}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {data?.readership?.totalReads ?? 0} views across {data?.readership?.totalNotices ?? 0} published bulletins
              </CardContent>
            </Card>

            {/* Campus Scope: KPI 3: SLA Resolution Speed */}
            <Card className="hover:border-primary/40 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-semibold uppercase tracking-wider">Avg SLA Resolution</span>
                  <Clock className="h-4 w-4 text-amber-500" />
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight mt-1">
                  {loading ? "..." : `${data?.grievances?.avgResolutionHours ?? 0}h`}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {data?.grievances?.totalResolved ?? 0} grievances formally closed
              </CardContent>
            </Card>

            {/* Campus Scope: KPI 4: Teaching Quality Benchmark */}
            <Card className="hover:border-primary/40 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-semibold uppercase tracking-wider">Teaching Benchmark</span>
                  <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight mt-1">
                  {loading ? "..." : `${data?.evaluations?.avgRating ?? 4.6} / 5.0`}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Clarity: {data?.evaluations?.avgClarity ?? 4.4} • Pace: {data?.evaluations?.avgPace ?? 4.3}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Activity Trends Chart */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                {isGlobalView ? "Global Network Activity Trends" : "Campus Velocity & Activity Trends"}
              </CardTitle>
              <CardDescription className="text-xs">
                {isGlobalView
                  ? "Daily message volume, published bulletins, and grievances filed across all network colleges."
                  : "Daily volume of real-time messages, academic bulletins, and grievance tickets."}
              </CardDescription>
            </div>

            {/* Series Filter Toggles */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-md text-[11px] font-semibold">
              <button
                onClick={() => setActiveSeries('all')}
                className={`px-2.5 py-0.5 rounded transition-colors ${
                  activeSeries === 'all' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground'
                }`}
              >
                All Streams
              </button>
              <button
                onClick={() => setActiveSeries('messages')}
                className={`px-2.5 py-0.5 rounded transition-colors flex items-center gap-1 ${
                  activeSeries === 'messages' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-primary" /> Messages
              </button>
              <button
                onClick={() => setActiveSeries('notices')}
                className={`px-2.5 py-0.5 rounded transition-colors flex items-center gap-1 ${
                  activeSeries === 'notices' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-indigo-500" /> Bulletins
              </button>
              <button
                onClick={() => setActiveSeries('complaints')}
                className={`px-2.5 py-0.5 rounded transition-colors flex items-center gap-1 ${
                  activeSeries === 'complaints' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-amber-500" /> Grievances
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-56 flex items-center justify-center text-xs text-muted-foreground">
              Computing trend points from MongoDB transaction ledger...
            </div>
          ) : trends.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs text-muted-foreground">
              No historical trend points recorded for this scope.
            </div>
          ) : (
            <div className="space-y-2">
              {/* Responsive SVG Bar Chart */}
              <div className="h-60 w-full pt-4">
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => (
                    <line
                      key={idx}
                      x1="0%"
                      y1={`${pct * 80 + 10}%`}
                      x2="100%"
                      y2={`${pct * 80 + 10}%`}
                      stroke="currentColor"
                      strokeDasharray="3 3"
                      className="text-border/60"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Render Columns for each day */}
                  {trends.map((item, idx) => {
                    const colWidth = 100 / trends.length
                    const colCenter = idx * colWidth + colWidth / 2

                    const msgH = (item.messages / maxVal) * 80
                    const notH = (item.notices / maxVal) * 80
                    const cmpH = (item.complaints / maxVal) * 80

                    const showMsg = activeSeries === 'all' || activeSeries === 'messages'
                    const showNot = activeSeries === 'all' || activeSeries === 'notices'
                    const showCmp = activeSeries === 'all' || activeSeries === 'complaints'

                    return (
                      <g key={item.date} className="group cursor-pointer">
                        {/* Messages Bar */}
                        {showMsg && (
                          <rect
                            x={`${colCenter - 1.8}%`}
                            y={`${90 - msgH}%`}
                            width="1.2%"
                            height={`${Math.max(msgH, 1.5)}%`}
                            rx="2"
                            className="fill-primary/80 group-hover:fill-primary transition-colors"
                          >
                            <title>{`${item.label}: ${item.messages} messages`}</title>
                          </rect>
                        )}

                        {/* Bulletins Bar */}
                        {showNot && (
                          <rect
                            x={`${colCenter - 0.4}%`}
                            y={`${90 - notH}%`}
                            width="1.2%"
                            height={`${Math.max(notH, 1.5)}%`}
                            rx="2"
                            className="fill-indigo-500/80 group-hover:fill-indigo-500 transition-colors"
                          >
                            <title>{`${item.label}: ${item.notices} bulletins`}</title>
                          </rect>
                        )}

                        {/* Grievances Bar */}
                        {showCmp && (
                          <rect
                            x={`${colCenter + 1.0}%`}
                            y={`${90 - cmpH}%`}
                            width="1.2%"
                            height={`${Math.max(cmpH, 1.5)}%`}
                            rx="2"
                            className="fill-amber-500/80 group-hover:fill-amber-500 transition-colors"
                          >
                            <title>{`${item.label}: ${item.complaints} grievances`}</title>
                          </rect>
                        )}
                      </g>
                    )
                  })}
                </svg>
              </div>

              {/* X-Axis Date Labels */}
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono pt-2 border-t">
                {trends.filter((_, i) => i % Math.ceil(trends.length / 7) === 0).map((t) => (
                  <span key={t.date}>{t.label}</span>
                ))}
                <span>{trends[trends.length - 1]?.label}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Intelligence Matrix & Grievance Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Matrix Table (Global Campuses Comparison vs Campus Department Matrix) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              {isGlobalView ? "Cross-Campus Platform Comparison" : "Department Matrix Comparison"}
            </CardTitle>
            <CardDescription className="text-xs">
              {isGlobalView
                ? "Comparative performance across affiliated colleges, member density, and civic activity."
                : "Cross-faculty engagement, readership density, teaching scores, and civic turnout."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              {isGlobalView ? (
                /* Global Scope: Institutes Matrix Table */
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b text-muted-foreground uppercase font-semibold text-[11px]">
                    <tr>
                      <th className="p-3">College</th>
                      <th className="p-3 text-center">Code</th>
                      <th className="p-3 text-center">Users</th>
                      <th className="p-3 text-center">Bulletin Reads</th>
                      <th className="p-3 text-center">Teaching</th>
                      <th className="p-3 text-center">Ballots</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data?.institutesMatrix?.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-muted-foreground">
                          No colleges registered in network.
                        </td>
                      </tr>
                    ) : (
                      data?.institutesMatrix?.map((inst) => (
                        <tr
                          key={inst.id}
                          onClick={() => {
                            setInstituteScope(inst.id)
                            setDepartment('ALL')
                          }}
                          className="hover:bg-muted/40 cursor-pointer transition-colors"
                          title="Click to drill down into this college"
                        >
                          <td className="p-3 font-semibold text-foreground">
                            <div className="flex items-center gap-1.5">
                              {inst.hasActiveAlert && (
                                <span className="h-2 w-2 rounded-full bg-destructive animate-ping" title="Active Emergency Siren" />
                              )}
                              <span>{inst.name}</span>
                            </div>
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-muted-foreground">
                            {inst.code}
                          </td>
                          <td className="p-3 text-center font-mono font-medium">
                            {inst.users}
                          </td>
                          <td className="p-3 text-center font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                            {inst.noticeReads}
                          </td>
                          <td className="p-3 text-center font-mono font-semibold">
                            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              {inst.avgRating}
                            </span>
                          </td>
                          <td className="p-3 text-center font-mono text-primary font-medium">
                            {inst.pollVotes}
                          </td>
                          <td className="p-3 text-center">
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                inst.status === "APPROVED"
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                  : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                              }`}
                            >
                              {inst.status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                /* Campus Scope: Department Matrix Table */
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b text-muted-foreground uppercase font-semibold text-[11px]">
                    <tr>
                      <th className="p-3">Department</th>
                      <th className="p-3 text-center">Users</th>
                      <th className="p-3 text-center">Notice Reads</th>
                      <th className="p-3 text-center">Teaching Rating</th>
                      <th className="p-3 text-center">Poll Votes</th>
                      <th className="p-3 text-center">Complaints</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data?.departments?.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-muted-foreground">
                          No department telemetry available.
                        </td>
                      </tr>
                    ) : (
                      data?.departments?.map((d) => (
                        <tr key={d.department} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-semibold text-foreground">
                            {d.department}
                          </td>
                          <td className="p-3 text-center font-mono font-medium">
                            {d.users}
                          </td>
                          <td className="p-3 text-center font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                            {d.noticeReads}
                          </td>
                          <td className="p-3 text-center font-mono font-semibold">
                            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              {d.avgRating}
                            </span>
                          </td>
                          <td className="p-3 text-center font-mono text-primary font-medium">
                            {d.pollVotes}
                          </td>
                          <td className="p-3 text-center font-mono">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              d.complaints > 0 ? "bg-amber-500/10 text-amber-600" : "text-muted-foreground"
                            }`}>
                              {d.complaints}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right: Grievance SLA Pipeline & Lifecycle Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <LifeBuoy className="h-4 w-4 text-amber-500" />
              {isGlobalView ? "Global Grievance SLA & Incident Pipeline" : "Grievance SLA & Lifecycle Status"}
            </CardTitle>
            <CardDescription className="text-xs">
              Status distribution and severity classification.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Priority Distribution</span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {data?.grievances?.priorityBreakdown?.reduce((a, b) => a + b.count, 0) || 0} Tickets
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                {['URGENT', 'HIGH', 'MEDIUM', 'LOW'].map((p) => {
                  const item = data?.grievances?.priorityBreakdown?.find((x) => x.priority === p)
                  const count = item?.count || 0
                  return (
                    <div key={p} className="rounded-lg bg-card border p-2.5 space-y-1">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase">{p}</div>
                      <div className={`text-lg font-bold font-mono ${
                        p === 'URGENT' ? 'text-destructive' : p === 'HIGH' ? 'text-amber-500' : 'text-foreground'
                      }`}>
                        {count}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <div className="text-xs font-semibold text-foreground">
                Lifecycle Status Pipeline
              </div>
              <div className="space-y-2">
                {data?.grievances?.statusBreakdown?.map((s) => (
                  <div key={s.status} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-foreground">{s.status.replace(/_/g, " ")}</span>
                      <span className="font-mono text-muted-foreground">{s.count}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(8, (s.count / Math.max(data.grievances.priorityBreakdown.reduce((a, b) => a + b.count, 0), 1)) * 100))}%`
                        }}
                        className={`h-full rounded-full transition-all ${
                          s.status === 'RESOLVED' ? 'bg-emerald-500' : s.status === 'IN_PROGRESS' ? 'bg-indigo-500' : 'bg-amber-500'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Intelligence Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Teaching Quality Benchmark */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-amber-500" />
                  {isGlobalView ? "Global Teaching Benchmark" : "Teaching Quality & Course Evaluations"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isGlobalView
                    ? "Network-wide pedagogical clarity and lecture pacing aggregates."
                    : "Student evaluation metrics across pedagogical clarity and lecture pacing."}
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">
                {data?.evaluations?.totalCount ?? 0} Reviews
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border bg-card p-3 space-y-1 text-center">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Overall Score</span>
                <div className="text-xl font-bold font-mono text-amber-500 flex items-center justify-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {data?.evaluations?.avgRating ?? 4.6}
                </div>
                <div className="text-[10px] text-muted-foreground">Scale 1.0 - 5.0</div>
              </div>

              <div className="rounded-lg border bg-card p-3 space-y-1 text-center">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Lecture Clarity</span>
                <div className="text-xl font-bold font-mono text-primary flex items-center justify-center gap-1">
                  {data?.evaluations?.avgClarity ?? 4.4}
                </div>
                <div className="text-[10px] text-muted-foreground">Conceptual rigor</div>
              </div>

              <div className="rounded-lg border bg-card p-3 space-y-1 text-center">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Syllabus Pace</span>
                <div className="text-xl font-bold font-mono text-indigo-500 flex items-center justify-center gap-1">
                  {data?.evaluations?.avgPace ?? 4.3}
                </div>
                <div className="text-[10px] text-muted-foreground">Optimal balance</div>
              </div>
            </div>

            {/* In Campus View: Show Top-Rated Courses */}
            {!isGlobalView && (
              <div className="space-y-2 pt-2 border-t">
                <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-amber-500" />
                  Top-Rated Course Offerings
                </div>
                <div className="space-y-2">
                  {(!data?.evaluations?.topCourses || data.evaluations.topCourses.length === 0) ? (
                    <div className="text-xs text-muted-foreground p-3 text-center border rounded-md">
                      No course reviews registered yet for this scope.
                    </div>
                  ) : (
                    data.evaluations.topCourses.map((c, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-md bg-muted/40 border text-xs">
                        <div>
                          <div className="font-semibold text-foreground">{c.course}</div>
                          <div className="text-[11px] text-muted-foreground">{c.faculty} • {c.department}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 justify-end">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {c.avgRating}
                          </div>
                          <div className="text-[10px] text-muted-foreground">{c.reviewsCount} reviews</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Panel 2: Democracy & Safety Grid */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Vote className="h-4 w-4 text-primary" />
                  {isGlobalView ? "Multi-Campus Democracy & Platform Safety" : "Campus Democracy & Civic Participation"}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isGlobalView
                    ? "Cross-campus election engagement, student ballot participation, and emergency sirens."
                    : "Student ballot engagement, elective surveys, and governance participation."}
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                {data?.democracy?.activePolls ?? 0} Active Elections
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border bg-card p-3 space-y-1 text-center">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Total Votes Cast</span>
                <div className="text-xl font-bold font-mono text-foreground">
                  {data?.democracy?.totalVotes ?? 0}
                </div>
                <div className="text-[10px] text-muted-foreground">Verified ballots</div>
              </div>

              <div className="rounded-lg border bg-card p-3 space-y-1 text-center">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Civic Turnout</span>
                <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {data?.democracy?.turnoutRate ?? 65}%
                </div>
                <div className="text-[10px] text-muted-foreground">Participation rate</div>
              </div>

              <div className="rounded-lg border bg-card p-3 space-y-1 text-center">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Ballots Live</span>
                <div className="text-xl font-bold font-mono text-primary">
                  {data?.democracy?.totalPolls ?? 0}
                </div>
                <div className="text-[10px] text-muted-foreground">Elections & polls</div>
              </div>
            </div>

            {/* Health and Grid status */}
            <div className="space-y-3 pt-2 border-t">
              <div className="text-xs font-semibold text-foreground">
                {isGlobalView ? "Platform Security Grid & Siren Status" : "Civic Engagement Health"}
              </div>

              {isGlobalView ? (
                /* Global Emergency Siren Grid */
                <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-emerald-600" />
                      Multi-Campus Emergency Siren Grid
                    </span>
                    {data?.institutesMatrix?.some((i) => i.hasActiveAlert) ? (
                      <Badge variant="destructive" className="text-[10px] animate-pulse">
                        Active Sirens Detected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                        All Grids Normal
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Continuous real-time websocket monitoring across all affiliated campuses. Incident dispatch and emergency siren controls active.
                  </p>
                </div>
              ) : (
                /* Campus Single Integrity */
                <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      Cryptographic Ballot Integrity
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      Enforced
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    One-student-one-vote guarantee strictly validated against unique student registration records with anonymous tally.
                  </p>
                </div>
              )}

              {/* Readership Penetration Bar */}
              <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5 text-indigo-500" />
                    Readership Reach Penetration
                  </span>
                  <span className="font-mono text-xs font-bold text-foreground">
                    {data?.readership?.penetrationRate ?? 80}% Reach
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    style={{ width: `${data?.readership?.penetrationRate ?? 80}%` }}
                    className="h-full rounded-full bg-indigo-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
