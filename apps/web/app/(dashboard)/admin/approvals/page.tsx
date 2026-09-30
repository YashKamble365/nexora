"use client"

import * as React from "react"
import {
  CheckCircle2,
  XCircle,
  Building2,
  GraduationCap,
  Shield,
  UserCheck,
  Clock,
  Search,
  Filter,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api"
import { UserDTO, InstituteDTO } from "@nexora/types"

export default function ApprovalsPage() {
  const { user } = useAuth()
  const [pendingUsers, setPendingUsers] = React.useState<UserDTO[]>([])
  const [pendingInstitutes, setPendingInstitutes] = React.useState<InstituteDTO[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [actionInProgress, setActionInProgress] = React.useState<string | null>(null)
  const [feedback, setFeedback] = React.useState<string | null>(null)

  const isSuperAdmin = user?.role === "SUPER_ADMIN"
  const isClassCoordinator = user?.role === "FACULTY" && user?.facultyRole === "CLASS_COORDINATOR"
  const isHod = user?.role === "FACULTY" && user?.facultyRole === "HOD"
  const isInstituteAdmin = user?.role === "ADMIN"

  const fetchPending = React.useCallback(async () => {
    setLoading(true)
    try {
      if (isSuperAdmin) {
        // Super Admin only manages educational institute accreditation
        const instData = await apiClient.get<{ institutes: InstituteDTO[] }>("/institutes/all")
        const pending = (instData.institutes || []).filter(
          (i: InstituteDTO) => i.status === "PENDING_APPROVAL"
        )
        setPendingInstitutes(pending)
      } else {
        // Campus Admins and HoDs manage student/faculty accounts for their college
        const userData = await apiClient.get<{ pendingUsers: UserDTO[] }>("/approvals/pending")
        setPendingUsers(userData.pendingUsers || [])
      }
    } catch {
      // Handle network errors
    } finally {
      setLoading(false)
    }
  }, [isSuperAdmin])

  React.useEffect(() => {
    fetchPending()
  }, [fetchPending])

  const handleUserDecision = async (userId: string, status: "ACTIVE" | "REJECTED") => {
    setActionInProgress(userId)
    setFeedback(null)
    try {
      const data = await apiClient.patch<{ message: string }>(`/approvals/users/${userId}`, { status })
      setFeedback(data.message || `User marked as ${status.toLowerCase()}`)
      setPendingUsers((prev) => prev.filter((u) => (u.id || (u as any)._id) !== userId))
    } catch (err: any) {
      setFeedback(err.message || "Failed to update user status")
    } finally {
      setActionInProgress(null)
    }
  }

  const handleInstituteDecision = async (instituteId: string, status: "APPROVED" | "REJECTED") => {
    setActionInProgress(instituteId)
    setFeedback(null)
    try {
      const data = await apiClient.patch<{ message: string }>(`/institutes/${instituteId}/status`, { status })
      setFeedback(data.message || `Institute marked as ${status.toLowerCase()}`)
      setPendingInstitutes((prev) => prev.filter((i) => (i.id || (i as any)._id) !== instituteId))
      // Automatically clear any users associated with this institute from the queue
      setPendingUsers((prev) =>
        prev.filter((u) => {
          const uInstId =
            typeof u.instituteId === "object"
              ? (u.instituteId as any)?.id || (u.instituteId as any)?._id
              : u.instituteId
          return uInstId !== instituteId
        })
      )
    } catch (err: any) {
      setFeedback(err.message || "Failed to update institute status")
    } finally {
      setActionInProgress(null)
    }
  }

  const filteredUsers = pendingUsers.filter((u) => {
    const q = searchQuery.toLowerCase()
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.institutionalId.toLowerCase().includes(q) ||
      u.department.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title={isSuperAdmin ? "College Accreditation & Approvals" : "Institutional Verification Hub"}
        description={
          isSuperAdmin
            ? "Platform-wide governance: review and verify incoming educational institutes. Approving a campus automatically provisions its root administrator."
            : isClassCoordinator
            ? `Class Coordinator verification for ${user?.coordinatorYear || "Final Year"} (${user?.department || "CSE"}).`
            : isHod
            ? `Department HoD oversight: verify all students in ${user?.department || "Engineering"}.`
            : "Campus administrator queue: verify incoming faculty, coordinators, and students."
        }
        badge={
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-semibold">
            <UserCheck className="h-3 w-3 mr-1" />
            {isSuperAdmin
              ? "Super Admin Platform Root"
              : isClassCoordinator
              ? `Year Coordinator (${user?.coordinatorYear})`
              : isHod
              ? `HoD (${user?.department})`
              : "Institute Admin Queue"}
          </Badge>
        }
      >
        <Button variant="outline" size="sm" onClick={fetchPending} disabled={loading} className="text-xs">
          <Clock className="mr-1.5 h-3.5 w-3.5" /> Refresh Queue
        </Button>
      </PageHeader>

      {feedback && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Super Admin Institute Approvals Section */}
      {isSuperAdmin && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Pending Educational Institutes ({pendingInstitutes.length})
            </h2>
          </div>

          {pendingInstitutes.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              No colleges currently awaiting Super Admin verification.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingInstitutes.map((inst) => {
                const instId = inst.id || (inst as any)._id
                const adminUser = (inst as any).adminUserId
                return (
                  <div key={instId} className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-[10px] uppercase font-bold text-muted-foreground">
                          CODE: {inst.code}
                        </span>
                        <h3 className="text-sm font-bold text-foreground leading-snug">{inst.name}</h3>
                        <p className="text-xs text-muted-foreground">{inst.address || "Campus Address Unspecified"}</p>
                      </div>
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">
                        Pending Approval
                      </Badge>
                    </div>

                    {adminUser && (
                      <div className="p-2.5 rounded bg-muted/40 border border-border/50 text-[11px] space-y-1">
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          <Shield className="h-3 w-3 text-emerald-500" />
                          Designated Campus Administrator:
                        </div>
                        <div className="text-muted-foreground font-medium">
                          {adminUser.name} • {adminUser.email}
                        </div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          ✓ Approving this campus automatically verifies and activates this Administrator.
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      <Button
                        size="sm"
                        onClick={() => handleInstituteDecision(instId, "APPROVED")}
                        disabled={actionInProgress === instId}
                        className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Approve Campus
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleInstituteDecision(instId, "REJECTED")}
                        disabled={actionInProgress === instId}
                        className="h-8 text-xs font-semibold text-destructive hover:bg-destructive/10"
                      >
                        <XCircle className="mr-1.5 h-3.5 w-3.5" /> Reject
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* User Verification Section (Faculty & Students - Campus Admins & HoDs only) */}
      {!isSuperAdmin && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h2 className="text-base font-semibold tracking-tight flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              Pending Institutional Members ({filteredUsers.length})
            </h2>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by roll, name, dept..."
                className="pl-8 text-xs h-8"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Synchronizing verification registry...
            </div>
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title="All members verified"
              description={
                searchQuery
                  ? "No pending registrations match your search filter."
                  : "There are no pending registrations in your jurisdiction queue."
              }
            />
          ) : (
            <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                    <tr>
                      <th className="py-2.5 px-4">Applicant</th>
                      <th className="py-2.5 px-4">Role & Designation</th>
                      <th className="py-2.5 px-4">Department & Year</th>
                      <th className="py-2.5 px-4">Institutional Roll / ID</th>
                      <th className="py-2.5 px-4 text-right">Verification Decision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredUsers.map((item) => {
                      const itemId = item.id || (item as any)._id
                      return (
                        <tr key={itemId} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-foreground">{item.name}</div>
                            <div className="text-[11px] text-muted-foreground">{item.email}</div>
                          </td>

                          <td className="py-3 px-4">
                            <Badge
                              variant="outline"
                              className={
                                item.role === "ADMIN" || item.role === "SUPER_ADMIN"
                                  ? "bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]"
                                  : item.role === "FACULTY"
                                  ? "bg-purple-500/10 text-purple-600 border-purple-500/20 text-[10px]"
                                  : "bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px]"
                              }
                            >
                              {item.role === "ADMIN"
                                ? "INSTITUTE ADMIN"
                                : item.role === "SUPER_ADMIN"
                                ? "SUPER ADMIN"
                                : item.role === "FACULTY"
                                ? item.facultyRole ? item.facultyRole.replace(/_/g, " ") : "FACULTY"
                                : "STUDENT"}
                            </Badge>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-medium">
                              {item.department || (item.role === "ADMIN" ? "Institutional Administration" : "General")}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {item.role === "ADMIN"
                                ? "Campus Administrator"
                                : item.academicYear || item.coordinatorYear || "Campus Wide"}
                            </div>
                          </td>

                          <td className="py-3 px-4 font-mono font-medium text-foreground">
                            {item.institutionalId}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                onClick={() => handleUserDecision(itemId, "ACTIVE")}
                                disabled={actionInProgress === itemId}
                                className="h-7 px-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                <CheckCircle2 className="mr-1 h-3 w-3" /> Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUserDecision(itemId, "REJECTED")}
                                disabled={actionInProgress === itemId}
                                className="h-7 px-2.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
                              >
                                <XCircle className="mr-1 h-3 w-3" /> Reject
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
