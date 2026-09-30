"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Bell,
  Calendar,
  LifeBuoy,
  MessageSquare,
  Users,
  ArrowRight,
  Clock,
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Building2,
  PlusCircle,
  FileText,
  UserCheck,
  Star,
  BookOpen,
  BookPlus,
  Check,
  X,
  ShieldCheck,
  Crown,
  GraduationCap,
  Layers,
  AlertCircle,
} from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { PriorityBadge } from "@/components/shared/priority-badge"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api"
import { NoticeDTO, EventDTO, UserDTO, ComplaintDTO, DepartmentSubject } from "@nexora/types"
import { cn } from "@/lib/utils"

export default function CampusOverviewPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [notices, setNotices] = React.useState<NoticeDTO[]>([])
  const [events, setEvents] = React.useState<EventDTO[]>([])
  const [metrics, setMetrics] = React.useState({
    activeUsers: 48,
    publishedNotices: 14,
    openComplaints: 3,
    upcomingEvents: 2,
  })
  const [loading, setLoading] = React.useState(true)
  const [registeringEventId, setRegisteringEventId] = React.useState<string | null>(null)
  const [needsRatingReminder, setNeedsRatingReminder] = React.useState(false)

  // HoD Command Center State
  const isFaculty = user?.role === "FACULTY"
  const isHod = isFaculty && user?.facultyRole === "HOD"
  const isVerifier = isFaculty && (isHod || user?.facultyRole === "CLASS_COORDINATOR")

  const [pendingDeptUsers, setPendingDeptUsers] = React.useState<UserDTO[]>([])
  const [deptFacultyList, setDeptFacultyList] = React.useState<any[]>([])
  const [deptSubjects, setDeptSubjects] = React.useState<DepartmentSubject[]>([])
  const [deptComplaints, setDeptComplaints] = React.useState<ComplaintDTO[]>([])
  const [academicYears, setAcademicYears] = React.useState<string[]>([
    "First Year",
    "Second Year",
    "Third Year",
    "Final Year",
  ])
  const [semesters, setSemesters] = React.useState<string[]>([
    "Semester 1",
    "Semester 2",
    "Semester 3",
    "Semester 4",
    "Semester 5",
    "Semester 6",
    "Semester 7",
    "Semester 8",
  ])

  // Quick Action States
  const [approvingUserId, setApprovingUserId] = React.useState<string | null>(null)
  const [actionFeedback, setActionFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null)

  // Add Subject Dialog
  const [isAddSubjectOpen, setIsAddSubjectOpen] = React.useState(false)
  const [newSubName, setNewSubName] = React.useState("")
  const [newSubCode, setNewSubCode] = React.useState("")
  const [newSubYear, setNewSubYear] = React.useState("Third Year")
  const [newSubSem, setNewSubSem] = React.useState("Semester 5")
  const [subModalError, setSubModalError] = React.useState<string | null>(null)
  const [subModalSubmitting, setSubModalSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") {
      router.replace("/admin/dashboard")
    }
  }, [user, router])

  const instituteId =
    typeof user?.instituteId === "object"
      ? (user?.instituteId as any)?.id || (user?.instituteId as any)?._id
      : user?.instituteId || "current"

  const fetchData = React.useCallback(async () => {
    try {
      const [overviewRes, noticesRes, eventsRes] = await Promise.all([
        apiClient.get<{ metrics?: any }>("/overview"),
        apiClient.get<{ notices?: NoticeDTO[] } | NoticeDTO[]>("/notices"),
        apiClient.get<{ events?: EventDTO[] } | EventDTO[]>("/events"),
      ])

      if (overviewRes?.metrics) {
        setMetrics(overviewRes.metrics)
      }
      const noticeList = Array.isArray(noticesRes) ? noticesRes : noticesRes?.notices || []
      setNotices(noticeList.slice(0, 4))

      const eventList = Array.isArray(eventsRes) ? eventsRes : eventsRes?.events || []
      setEvents(eventList.slice(0, 3))

      // Check monthly rating reminder for students
      if (user?.role === "STUDENT") {
        try {
          const reminderRes = await apiClient.get<any>("/feedback/reminder-status")
          if (reminderRes?.needsReminder) {
            setNeedsRatingReminder(true)
          }
        } catch {
          // ignore
        }
      }

      // Fetch HoD specific metrics
      if (isHod && user?.department) {
        try {
          const [pendingRes, facultyRes, subjectsRes, complaintsRes, structureRes] = await Promise.all([
            apiClient.get<{ pendingUsers: UserDTO[] }>("/approvals/pending"),
            apiClient.get<any[]>(`/users/directory?department=${encodeURIComponent(user.department)}&role=FACULTY`),
            apiClient.get<{ subjects: DepartmentSubject[] }>(`/institutes/${instituteId}/subjects?department=${encodeURIComponent(user.department)}`),
            apiClient.get<{ complaints: ComplaintDTO[] }>(`/complaints?department=${encodeURIComponent(user.department)}`),
            apiClient.get<{ academicYears?: string[]; semesters?: string[] }>(`/institutes/${instituteId}/structure`).catch(() => null),
          ])

          setPendingDeptUsers(pendingRes?.pendingUsers || [])
          setDeptFacultyList(Array.isArray(facultyRes) ? facultyRes : [])
          setDeptSubjects(subjectsRes?.subjects || [])
          setDeptComplaints(complaintsRes?.complaints || [])

          if (structureRes?.academicYears?.length) {
            setAcademicYears(structureRes.academicYears)
            setNewSubYear(structureRes.academicYears[0])
          }
          if (structureRes?.semesters?.length) {
            setSemesters(structureRes.semesters)
            setNewSubSem(structureRes.semesters[0])
          }
        } catch (err) {
          console.error("Failed to load HoD telemetry:", err)
        }
      }
    } catch {
      // Fallback to static mock for smooth display if API is booting
    } finally {
      setLoading(false)
    }
  }, [user?.role, user?.department, isHod, instituteId])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRegisterEvent = async (eventId: string) => {
    setRegisteringEventId(eventId)
    try {
      await apiClient.post(`/events/${eventId}/register`)
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === eventId
            ? { ...ev, isRegistered: true, registeredCount: (ev.registeredCount || 0) + 1 }
            : ev
        )
      )
    } catch {
      // Handle network errors
    } finally {
      setRegisteringEventId(null)
    }
  }

  // HoD Quick Approvals
  const handleQuickApprove = async (targetId: string) => {
    setApprovingUserId(targetId)
    setActionFeedback(null)
    try {
      await apiClient.patch(`/approvals/users/${targetId}`, { status: "ACTIVE" })
      setPendingDeptUsers((prev) => prev.filter((u) => u.id !== targetId))
      setActionFeedback({
        type: "success",
        message: "Department member verified and activated successfully.",
      })
    } catch (err: any) {
      setActionFeedback({
        type: "error",
        message: err.message || "Failed to approve user.",
      })
    } finally {
      setApprovingUserId(null)
    }
  }

  const handleQuickReject = async (targetId: string) => {
    setApprovingUserId(targetId)
    setActionFeedback(null)
    try {
      await apiClient.patch(`/approvals/users/${targetId}`, { status: "REJECTED" })
      setPendingDeptUsers((prev) => prev.filter((u) => u.id !== targetId))
      setActionFeedback({
        type: "success",
        message: "Application rejected.",
      })
    } catch (err: any) {
      setActionFeedback({
        type: "error",
        message: err.message || "Failed to reject user.",
      })
    } finally {
      setApprovingUserId(null)
    }
  }

  // HoD Subject Creation
  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubModalError(null)

    if (!newSubName.trim() || !newSubYear || !newSubSem) {
      setSubModalError("Subject name, academic year, and semester are required.")
      return
    }

    setSubModalSubmitting(true)
    try {
      const res = await apiClient.post<{ subject: DepartmentSubject }>(`/institutes/${instituteId}/subjects`, {
        department: user?.department,
        name: newSubName.trim(),
        code: newSubCode.trim() || undefined,
        academicYear: newSubYear,
        semester: newSubSem,
      })

      if (res?.subject) {
        setDeptSubjects((prev) => [...prev, res.subject])
      }
      setNewSubName("")
      setNewSubCode("")
      setIsAddSubjectOpen(false)
      setActionFeedback({
        type: "success",
        message: `Subject "${newSubName.trim()}" successfully added to ${user?.department || "department"} curriculum.`,
      })
    } catch (err: any) {
      setSubModalError(err.message || "Failed to create subject. Please check inputs.")
    } finally {
      setSubModalSubmitting(false)
    }
  }

  // Greeting time
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

  if (user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") {
    return (
      <div className="flex h-[40vh] items-center justify-center text-xs text-muted-foreground">
        Loading administrative console...
      </div>
    )
  }

  // -------------------------------------------------------------
  // 1. HoD SPECIFIC DEPARTMENT COMMAND CENTER
  // -------------------------------------------------------------
  if (isHod) {
    const openDeptComplaints = deptComplaints.filter(
      (c) => c.status !== "RESOLVED" && c.status !== "REJECTED" && c.status !== "CLOSED"
    )

    return (
      <div className="space-y-6">
        {/* HoD Executive Page Header */}
        <PageHeader
          title={`${greeting}, Dr. ${user?.name || "Head of Department"}`}
          description={`${user?.instituteName || (typeof user?.instituteId === 'object' ? (user?.instituteId as any)?.name : null) || "P. R. Pote Patil College of Engineering and Management"} • Department of ${user?.department || "Engineering"} • Academic Executive Lead`}
          badge={
            <Badge
              variant="outline"
              className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 font-semibold px-2.5 py-1"
            >
              <Crown className="h-3.5 w-3.5 mr-1.5 text-purple-600 dark:text-purple-400" />
              DEPARTMENT COMMAND CENTER
            </Badge>
          }
        >
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/admin/approvals"
              className={cn(buttonVariants({ size: "sm" }), "bg-purple-600 hover:bg-purple-700 text-white relative")}
            >
              <UserCheck className="mr-1.5 h-4 w-4" />
              Approvals Queue
              {pendingDeptUsers.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-400 text-purple-950">
                  {pendingDeptUsers.length}
                </span>
              )}
            </Link>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAddSubjectOpen(true)}
              className="border-purple-500/30 text-foreground hover:bg-purple-500/10"
            >
              <BookPlus className="mr-1.5 h-4 w-4 text-purple-600 dark:text-purple-400" />
              + Add Course Subject
            </Button>

            <Link
              href="/app/notices?action=create"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <PlusCircle className="mr-1.5 h-4 w-4" />
              Publish Circular
            </Link>

            <Link
              href="/app/complaints"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <LifeBuoy className="mr-1.5 h-4 w-4 text-amber-500" />
              Grievances
              {openDeptComplaints.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600">
                  {openDeptComplaints.length}
                </span>
              )}
            </Link>
          </div>
        </PageHeader>

        {/* Action Feedback Banner */}
        {actionFeedback && (
          <div
            className={cn(
              "p-3.5 rounded-lg border text-xs flex items-center justify-between shadow-xs animate-in fade-in",
              actionFeedback.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                : "bg-destructive/10 border-destructive/30 text-destructive"
            )}
          >
            <div className="flex items-center gap-2">
              {actionFeedback.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
              )}
              <span className="font-medium">{actionFeedback.message}</span>
            </div>
            <button
              onClick={() => setActionFeedback(null)}
              className="text-muted-foreground hover:text-foreground p-1 text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* HoD Department KPI Metric Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pending Verifications */}
          <div
            className={cn(
              "rounded-xl border bg-card p-4.5 shadow-sm transition-all",
              pendingDeptUsers.length > 0
                ? "border-amber-500/40 bg-amber-500/5 ring-1 ring-amber-500/20"
                : "border-border"
            )}
          >
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Pending Verifications</span>
              <UserCheck
                className={cn(
                  "h-4 w-4",
                  pendingDeptUsers.length > 0 ? "text-amber-500" : "text-muted-foreground"
                )}
              />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-foreground">
                {pendingDeptUsers.length}
              </span>
              <span
                className={cn(
                  "text-xs font-semibold",
                  pendingDeptUsers.length > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                )}
              >
                {pendingDeptUsers.length > 0 ? "Awaiting your sign-off" : "All cleared"}
              </span>
            </div>
          </div>

          {/* Department Faculty */}
          <div className="rounded-xl border border-border bg-card p-4.5 shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Department Faculty</span>
              <Users className="h-4 w-4 text-purple-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-foreground">
                {deptFacultyList.length}
              </span>
              <span className="text-xs text-muted-foreground font-medium">Instruction Staff</span>
            </div>
          </div>

          {/* Department Subjects */}
          <div className="rounded-xl border border-border bg-card p-4.5 shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Course Catalog</span>
              <BookOpen className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-foreground">
                {deptSubjects.length}
              </span>
              <span className="text-xs text-muted-foreground font-medium">Configured Subjects</span>
            </div>
          </div>

          {/* Department Grievances */}
          <div className="rounded-xl border border-border bg-card p-4.5 shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Open Grievances</span>
              <LifeBuoy className="h-4 w-4 text-rose-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-foreground">
                {openDeptComplaints.length}
              </span>
              <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                {openDeptComplaints.length > 0 ? "Requires triage" : "Zero active"}
              </span>
            </div>
          </div>
        </div>

        {/* Main Command Center Grid: Approvals, Curriculum & Triage */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main 2-Column Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Approvals Queue Widget */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold tracking-tight text-foreground">
                      Department Applicant Verifications
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Admissions and faculty appointments for {user?.department}
                    </p>
                  </div>
                </div>
                <Link
                  href="/admin/approvals"
                  className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                >
                  Full verification queue ({pendingDeptUsers.length}) <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {pendingDeptUsers.length === 0 ? (
                <div className="p-6 rounded-lg border border-dashed border-border bg-muted/20 text-center space-y-2">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto" />
                  <p className="text-xs font-semibold text-foreground">
                    Department Verification Queue Clear
                  </p>
                  <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                    All student admissions and faculty credentials in {user?.department} have been processed.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingDeptUsers.slice(0, 4).map((applicant) => (
                    <div
                      key={applicant.id}
                      className="p-3.5 rounded-lg border border-border bg-muted/10 hover:border-purple-500/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-foreground">{applicant.name}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-mono uppercase font-bold",
                              applicant.role === "FACULTY"
                                ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30"
                                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                            )}
                          >
                            {applicant.role === "FACULTY" ? applicant.facultyRole || "FACULTY" : applicant.academicYear || "STUDENT"}
                          </Badge>
                          {applicant.rollNumber && (
                            <span className="text-[10px] font-mono text-muted-foreground">
                              Roll: {applicant.rollNumber}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>{applicant.email}</span>
                          <span>•</span>
                          <span>ID: {applicant.institutionalId || "N/A"}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          disabled={approvingUserId === applicant.id}
                          onClick={() => handleQuickApprove(applicant.id)}
                          className="h-7 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-2.5"
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          {approvingUserId === applicant.id ? "Approving..." : "Approve"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={approvingUserId === applicant.id}
                          onClick={() => handleQuickReject(applicant.id)}
                          className="h-7 text-xs text-destructive hover:bg-destructive/10 px-2"
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Department Course Catalog Widget */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold tracking-tight text-foreground">
                      Department Curriculum & Subjects
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Course catalog configured for {user?.department}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsAddSubjectOpen(true)}
                    className="h-7 text-xs border-indigo-500/30 hover:bg-indigo-500/10"
                  >
                    <BookPlus className="h-3.5 w-3.5 mr-1 text-indigo-600" />
                    + Add Subject
                  </Button>
                  <Link
                    href="/admin/structure"
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Manage Syllabus →
                  </Link>
                </div>
              </div>

              {deptSubjects.length === 0 ? (
                <div className="p-6 rounded-lg border border-dashed border-border bg-muted/20 text-center space-y-2">
                  <BookOpen className="h-6 w-6 text-muted-foreground mx-auto" />
                  <p className="text-xs font-semibold text-foreground">
                    No Course Subjects Configured
                  </p>
                  <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                    Click "+ Add Subject" to create semester course offerings for your department.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {deptSubjects.slice(0, 6).map((sub) => (
                    <div
                      key={sub.id || (sub as any)._id}
                      className="p-3 rounded-lg border border-border bg-muted/10 hover:border-indigo-500/30 transition-colors space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-foreground leading-tight">
                          {sub.name}
                        </span>
                        {sub.code && (
                          <Badge variant="outline" className="text-[9px] font-mono uppercase bg-indigo-500/5 text-indigo-700 dark:text-indigo-300">
                            {sub.code}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span className="font-medium text-foreground">{sub.academicYear}</span>
                        <span>•</span>
                        <span>{sub.semester}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Department Grievances Triage Widget */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <LifeBuoy className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold tracking-tight text-foreground">
                      Department Grievance Triage
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Student concerns filed within {user?.department}
                    </p>
                  </div>
                </div>

                <Link
                  href="/app/complaints"
                  className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                >
                  Triage all tickets ({deptComplaints.length}) <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {deptComplaints.length === 0 ? (
                <div className="p-6 rounded-lg border border-dashed border-border bg-muted/20 text-center space-y-2">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto" />
                  <p className="text-xs font-semibold text-foreground">
                    Zero Active Grievances
                  </p>
                  <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                    No open student grievances or departmental dispute tickets at this time.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {deptComplaints.slice(0, 3).map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-3.5 rounded-lg border border-border bg-muted/10 hover:border-amber-500/30 transition-colors space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <PriorityBadge priority={ticket.priority} />
                          <StatusBadge status={ticket.status} />
                          <Badge variant="outline" className="text-[10px] font-mono uppercase">
                            #{ticket.ticketNumber || ticket.id.slice(-6)}
                          </Badge>
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-foreground">
                        <Link href="/app/complaints" className="hover:text-primary hover:underline">
                          {ticket.subject}
                        </Link>
                      </h4>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">
                        {ticket.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Column: Executive Tools & Bulletins */}
          <div className="space-y-6">
            {/* Quick Executive Shortcuts */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                HoD Executive Shortcuts
              </h2>
              <div className="space-y-2">
                <Link
                  href="/admin/approvals"
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted text-xs font-medium transition-colors border border-border/40"
                >
                  <span className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-purple-600" />
                    Verify Students & Faculty
                  </span>
                  {pendingDeptUsers.length > 0 && (
                    <Badge variant="destructive" className="text-[10px] font-mono">
                      {pendingDeptUsers.length}
                    </Badge>
                  )}
                </Link>

                <Link
                  href="/admin/structure"
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted text-xs font-medium transition-colors border border-border/40"
                >
                  <span className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-indigo-500" />
                    Curriculum & Course Structure
                  </span>
                  <span className="text-muted-foreground">Manage →</span>
                </Link>

                <Link
                  href="/app/notices?action=create"
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted text-xs font-medium transition-colors border border-border/40"
                >
                  <span className="flex items-center gap-2">
                    <PlusCircle className="h-4 w-4 text-emerald-500" />
                    Issue Department Circular
                  </span>
                  <span className="text-muted-foreground">Publish →</span>
                </Link>

                <Link
                  href="/app/people"
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted text-xs font-medium transition-colors border border-border/40"
                >
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    Department Roster & Directory
                  </span>
                  <span className="text-muted-foreground">Browse →</span>
                </Link>

                <Link
                  href="/app/polls?tab=SURVEYS"
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted text-xs font-medium transition-colors border border-border/40"
                >
                  <span className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-indigo-600" />
                    Course Exit Surveys (NBA COs)
                  </span>
                  <span className="text-muted-foreground">Inspect →</span>
                </Link>
              </div>
            </div>

            {/* Recent Institutional Notices */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold tracking-tight text-foreground">
                  Official Bulletins
                </h2>
                <Link href="/app/notices" className="text-xs font-medium text-primary hover:underline">
                  View all →
                </Link>
              </div>

              <div className="space-y-3">
                {notices.slice(0, 3).map((notice) => (
                  <div key={notice.id} className="p-3 rounded-lg border border-border bg-muted/10 space-y-1.5">
                    <div className="flex items-center justify-between gap-1 text-[10px]">
                      <PriorityBadge priority={notice.priority} />
                      <span className="text-muted-foreground">{new Date(notice.publishedAt || notice.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-xs font-semibold text-foreground">
                      <Link href="/app/notices" className="hover:text-primary hover:underline">
                        {notice.title}
                      </Link>
                    </h3>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* In-Dashboard Subject Creation Modal */}
        <Dialog open={isAddSubjectOpen} onOpenChange={setIsAddSubjectOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <BookPlus className="h-5 w-5 text-indigo-600" />
                Add Department Course Subject
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Configure a course subject for {user?.department}. This subject will appear in curriculum rosters and faculty teaching assignment pickers.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddSubject} className="space-y-4 py-2">
              {subModalError && (
                <div className="p-2.5 rounded-lg border border-destructive/30 bg-destructive/10 text-xs text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{subModalError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Department</label>
                <Input
                  value={user?.department || "Computer Science & Engineering"}
                  disabled
                  className="bg-muted text-muted-foreground text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Academic Year *</label>
                  <select
                    value={newSubYear}
                    onChange={(e) => setNewSubYear(e.target.value)}
                    className="w-full text-xs h-9 rounded-md border border-input bg-background px-3 py-1 shadow-xs focus:ring-1 focus:ring-ring focus:outline-none"
                    required
                  >
                    {academicYears.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Semester *</label>
                  <select
                    value={newSubSem}
                    onChange={(e) => setNewSubSem(e.target.value)}
                    className="w-full text-xs h-9 rounded-md border border-input bg-background px-3 py-1 shadow-xs focus:ring-1 focus:ring-ring focus:outline-none"
                    required
                  >
                    {semesters.map((sem) => (
                      <option key={sem} value={sem}>
                        {sem}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Subject Name *</label>
                <Input
                  placeholder="e.g. Database Management Systems"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Subject Code (Optional)</label>
                <Input
                  placeholder="e.g. CS501"
                  value={newSubCode}
                  onChange={(e) => setNewSubCode(e.target.value)}
                  className="text-xs font-mono uppercase"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddSubjectOpen(false)}
                  disabled={subModalSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={subModalSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  {subModalSubmitting ? "Adding..." : "Add Course Subject"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // -------------------------------------------------------------
  // 2. STANDARD CAMPUS / PROFESSOR / STUDENT OVERVIEW
  // -------------------------------------------------------------
  return (
    <div className="space-y-6">
      <PageHeader
        title={
          isFaculty
            ? `${greeting}, Prof. ${user?.name || "Faculty Member"}`
            : `${greeting}, ${user?.name || "Campus Member"}`
        }
        description={
          isFaculty
            ? `${user?.instituteName || (typeof user?.instituteId === 'object' ? (user?.instituteId as any)?.name : null) || "P. R. Pote Patil College of Engineering and Management"} • Department of ${user?.department || "Academics"} • ${user?.facultyRole?.replace(/_/g, " ") || "Faculty"}`
            : `${user?.instituteName || (typeof user?.instituteId === 'object' ? (user?.instituteId as any)?.name : null) || "P. R. Pote Patil College of Engineering and Management"} • ${user?.department || "Department"} • ${user?.academicYear || "Enrolled Student"}`
        }
        badge={
          <Badge
            variant="outline"
            className={
              isFaculty
                ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20 font-semibold"
                : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 font-semibold"
            }
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full mr-1.5 shrink-0",
                isFaculty ? "bg-purple-500" : "bg-emerald-500"
              )}
            />
            {isFaculty ? (user?.facultyRole || "FACULTY PORTAL") : `Grid Active • ${user?.academicYear || "STUDENT"}`}
          </Badge>
        }
      >
        {isFaculty ? (
          <>
            {isVerifier && (
              <Link
                href="/admin/approvals"
                className={cn(buttonVariants({ size: "sm" }), "bg-purple-600 hover:bg-purple-700 text-white")}
              >
                <UserCheck className="mr-2 h-4 w-4" />
                {user?.facultyRole === "HOD" ? "Department Approvals" : "Class Approvals"}
              </Link>
            )}
            <Link
              href="/app/notices?action=create"
              className={cn(buttonVariants({ variant: isVerifier ? "outline" : "default", size: "sm" }))}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Publish Circular
            </Link>
            <Link
              href="/app/files"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <FileText className="mr-2 h-4 w-4" />
              Upload Materials
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/app/complaints"
              className={cn(buttonVariants({ size: "sm" }))}
            >
              <LifeBuoy className="mr-2 h-4 w-4" />
              File Grievance
            </Link>
            <Link
              href="/app/files"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <FileText className="mr-2 h-4 w-4" />
              Course Notes
            </Link>
          </>
        )}
      </PageHeader>

      {/* Monthly Faculty Rating Reminder Prompt for Students */}
      {needsRatingReminder && user?.role === "STUDENT" && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
              <Star className="h-5 w-5 fill-amber-500" />
            </div>
            <div className="space-y-0.5">
              <h3 className="font-bold text-foreground">Monthly Academic Evaluation Reminder</h3>
              <p className="text-muted-foreground text-xs">
                Take 2 minutes to evaluate your semester professors and course lectures. Your anonymous feedback ensures transparent academic quality.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={() => router.push("/app/people")}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs h-8"
            >
              Evaluate Faculty
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNeedsRatingReminder(false)}
              className="text-xs h-8 text-muted-foreground hover:text-foreground"
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Quick Status Metrics (Connected to Live DB) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Campus Bulletins</span>
            <Bell className="h-4 w-4 text-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight">{metrics.publishedNotices}</span>
            <span className="text-xs text-muted-foreground">published live</span>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Active Grievances</span>
            <LifeBuoy className="h-4 w-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight">{metrics.openComplaints}</span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">In resolution</span>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Upcoming Events</span>
            <Calendar className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight">{metrics.upcomingEvents}</span>
            <span className="text-xs text-muted-foreground">Open for RSVP</span>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Verified Peers</span>
            <Users className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight">{metrics.activeUsers}</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">On-grid now</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Live Notices & Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Important Campus Notices */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold tracking-tight">Recent Official Bulletins</h2>
              <Badge variant="secondary" className="text-xs font-mono">{notices.length} Live</Badge>
            </div>
            <Link
              href="/app/notices"
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              All bulletins <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="p-8 text-center text-xs text-muted-foreground rounded-lg border border-border bg-card">
                Connecting to institutional bulletin grid...
              </div>
            ) : notices.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground rounded-lg border border-dashed border-border">
                No published bulletins in your department queue.
              </div>
            ) : (
              notices.map((notice) => (
                <div key={notice.id} className="rounded-lg border border-border bg-card p-4 space-y-2 hover:border-primary/40 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <PriorityBadge priority={notice.priority} />
                      <Badge variant="outline" className="text-[10px] uppercase font-mono">
                        {notice.category}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                      <Clock className="h-3 w-3" />
                      {new Date(notice.publishedAt || notice.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-foreground leading-snug">
                    <Link href="/app/notices" className="hover:text-primary hover:underline">
                      {notice.title}
                    </Link>
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {notice.summary || notice.content}
                  </p>

                  <div className="pt-2 flex items-center justify-between border-t border-border/60 text-[11px] text-muted-foreground">
                    <span>Published by <strong className="text-foreground">{notice.author.name}</strong> ({notice.author.department})</span>
                    <Link href="/app/notices" className="text-primary hover:underline font-medium">
                      Read bulletin →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar Column: Campus Events & Rapid Actions */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold tracking-tight">Upcoming Events</h2>
              <Link href="/app/events" className="text-xs font-medium text-primary hover:underline">
                View all →
              </Link>
            </div>

            <div className="space-y-3">
              {events.map((ev) => (
                <div key={ev.id} className="rounded-lg border border-border bg-card p-3.5 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs font-bold text-foreground leading-tight">{ev.title}</h3>
                    <Badge variant="outline" className="text-[9px] uppercase font-mono shrink-0">
                      {ev.category}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-primary" />
                      <span>{new Date(ev.startDate).toLocaleDateString()} • {new Date(ev.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-rose-500" />
                      <span className="truncate">{ev.venue}</span>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {ev.registeredCount || 0} / {ev.capacity} Seats Filled
                    </span>
                    {isFaculty ? (
                      <span className="text-[10px] font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded border border-border">
                        Faculty Access
                      </span>
                    ) : ev.isRegistered ? (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded">
                        <CheckCircle2 className="h-3 w-3" /> Registered
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleRegisterEvent(ev.id)}
                        disabled={registeringEventId === ev.id}
                        className="h-7 px-2.5 text-xs font-semibold"
                      >
                        {registeringEventId === ev.id ? "Securing Pass..." : "Register"}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="space-y-3">
            <h2 className="text-base font-semibold tracking-tight">Quick Shortcuts</h2>
            <div className="rounded-lg border border-border bg-card p-3.5 space-y-2">
              <Link
                href="/app/notices"
                className="flex items-center justify-between p-2 rounded-md hover:bg-muted text-xs font-medium transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Bell className="h-3.5 w-3.5 text-primary" /> Official Notice Board
                </span>
                <span className="text-muted-foreground">Browse →</span>
              </Link>

              <Link
                href="/app/events"
                className="flex items-center justify-between p-2 rounded-md hover:bg-muted text-xs font-medium transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-indigo-500" /> Campus Technical Events
                </span>
                <span className="text-muted-foreground">Browse →</span>
              </Link>

              <Link
                href="/app/complaints"
                className="flex items-center justify-between p-2 rounded-md hover:bg-muted text-xs font-medium transition-colors"
              >
                <span className="flex items-center gap-2">
                  <LifeBuoy className="h-3.5 w-3.5 text-amber-500" /> Student Grievance Tracker
                </span>
                <span className="text-muted-foreground">Track →</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

