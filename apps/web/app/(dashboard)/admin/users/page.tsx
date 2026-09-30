"use client"

import * as React from "react"
import {
  Users,
  Search,
  Filter,
  Shield,
  GraduationCap,
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MoreVertical,
  UserCheck,
  UserX,
  RefreshCw,
  SlidersHorizontal,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/shared/page-header"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'FACULTY' | 'ADMIN' | 'SUPER_ADMIN';
  facultyRole?: 'HOD' | 'CLASS_COORDINATOR' | 'PROFESSOR' | 'DEAN';
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';
  institutionalId: string;
  department: string;
  academicYear?: string;
  semester?: string;
  isOnline: boolean;
  instituteId?: string;
  instituteName?: string;
  instituteCode?: string;
  createdAt: string;
}

const DEFAULT_DEPARTMENTS = [
  "Computer Science & Engineering",
  "Information Technology",
  "Artificial Intelligence & Data Science",
  "Electronics & Telecommunication",
  "Mechanical Engineering",
  "Civil Engineering",
]

export default function AdminUsersPage() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === "SUPER_ADMIN"

  const [users, setUsers] = React.useState<AdminUser[]>([])
  const [total, setTotal] = React.useState(0)
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [loading, setLoading] = React.useState(true)

  // Filters
  const [search, setSearch] = React.useState("")
  const [roleFilter, setRoleFilter] = React.useState("ALL")
  const [statusFilter, setStatusFilter] = React.useState("ALL")
  const [instituteFilter, setInstituteFilter] = React.useState("ALL")
  const [departmentFilter, setDepartmentFilter] = React.useState("ALL")
  const [institutesList, setInstitutesList] = React.useState<any[]>([])

  // Modals
  const [selectedUser, setSelectedUser] = React.useState<AdminUser | null>(null)
  const [statusModalOpen, setStatusModalOpen] = React.useState(false)
  const [newStatus, setNewStatus] = React.useState<'ACTIVE' | 'SUSPENDED' | 'REJECTED'>('ACTIVE')
  const [statusReason, setStatusReason] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Role Modal
  const [roleModalOpen, setRoleModalOpen] = React.useState(false)
  const [newRole, setNewRole] = React.useState<'STUDENT' | 'FACULTY' | 'ADMIN'>('STUDENT')
  const [newFacultyRole, setNewFacultyRole] = React.useState<string>('PROFESSOR')

  // Fetch registered institutes for Super Admin filter
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

  const fetchUsers = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set("search", search.trim())
      if (roleFilter !== "ALL") params.set("role", roleFilter)
      if (statusFilter !== "ALL") params.set("status", statusFilter)
      if (isSuperAdmin && instituteFilter !== "ALL") params.set("instituteId", instituteFilter)
      if (departmentFilter !== "ALL") params.set("department", departmentFilter)
      params.set("page", String(page))
      params.set("limit", "20")

      const res = await apiClient.get<{
        data: AdminUser[];
        total: number;
        page: number;
        totalPages: number;
      }>(`/admin/users?${params.toString()}`)

      setUsers(res.data || [])
      setTotal(res.total || 0)
      setTotalPages(res.totalPages || 1)
    } catch (err) {
      console.warn("Failed to load users:", err)
    } finally {
      setLoading(false)
    }
  }, [search, roleFilter, statusFilter, instituteFilter, departmentFilter, page, isSuperAdmin])

  React.useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleUpdateStatus = async () => {
    if (!selectedUser) return
    setIsSubmitting(true)
    try {
      await apiClient.patch(`/admin/users/${selectedUser.id}/status`, {
        status: newStatus,
        reason: statusReason.trim() || undefined,
      })
      setStatusModalOpen(false)
      fetchUsers()
    } catch (err: any) {
      alert(err.message || "Failed to update status")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateRole = async () => {
    if (!selectedUser) return
    setIsSubmitting(true)
    try {
      await apiClient.patch(`/admin/users/${selectedUser.id}/role`, {
        role: newRole,
        facultyRole: newRole === 'FACULTY' ? newFacultyRole : undefined,
      })
      setRoleModalOpen(false)
      fetchUsers()
    } catch (err: any) {
      alert(err.message || "Failed to update role")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Derive department options based on selected institute or defaults
  const availableDepartments = React.useMemo(() => {
    if (instituteFilter !== "ALL") {
      const matched = institutesList.find((i) => (i._id || i.id) === instituteFilter)
      if (matched && Array.isArray(matched.departments) && matched.departments.length > 0) {
        return matched.departments as string[]
      }
    }
    return DEFAULT_DEPARTMENTS
  }, [instituteFilter, institutesList])

  const hasActiveFilters =
    search.trim() !== "" ||
    roleFilter !== "ALL" ||
    statusFilter !== "ALL" ||
    instituteFilter !== "ALL" ||
    departmentFilter !== "ALL"

  const clearFilters = () => {
    setSearch("")
    setRoleFilter("ALL")
    setStatusFilter("ALL")
    setInstituteFilter("ALL")
    setDepartmentFilter("ALL")
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isSuperAdmin ? "Global User Directory & Access Control" : "Users & Roles Directory"}
        description={
          isSuperAdmin
            ? "Platform-wide user directory: filter across all affiliated colleges, academic departments, and role tiers."
            : "Campus member directory, authorization tiers, and account status governance."
        }
        badge={
          <Badge variant="outline" className="font-mono text-xs">
            {total} Members
          </Badge>
        }
      >
        <Button variant="outline" size="sm" onClick={() => fetchUsers()} className="h-8">
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </PageHeader>

      {/* Filter Toolbar: Multi-Parameter Filtering */}
      <div className="flex flex-col gap-3 bg-card p-3 rounded-lg border shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, roll number, or institutional ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Quick Clear Button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 text-xs text-muted-foreground hover:text-foreground self-start sm:self-auto"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>

        {/* Dropdown Filters Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t text-xs">
          {/* Super Admin Institute Filter */}
          {isSuperAdmin && (
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground flex items-center gap-1 font-semibold">
                <Building2 className="h-3.5 w-3.5 text-primary" /> Campus:
              </span>
              <select
                value={instituteFilter}
                onChange={(e) => {
                  setInstituteFilter(e.target.value)
                  setDepartmentFilter("ALL")
                  setPage(1)
                }}
                className="h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium max-w-[200px]"
              >
                <option value="ALL">🌐 All Campuses</option>
                {institutesList.map((inst) => (
                  <option key={inst._id || inst.id} value={inst._id || inst.id}>
                    {inst.name} ({inst.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Department Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground flex items-center gap-1 font-semibold">
              <Filter className="h-3.5 w-3.5 text-primary" /> Dept:
            </span>
            <select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value)
                setPage(1)
              }}
              className="h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium max-w-[220px]"
            >
              <option value="ALL">All Departments</option>
              {availableDepartments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground font-semibold">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value)
                setPage(1)
              }}
              className="h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium"
            >
              <option value="ALL">All Roles</option>
              <option value="STUDENT">Students</option>
              <option value="FACULTY">Faculty</option>
              <option value="ADMIN">Admins</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground font-semibold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b text-muted-foreground uppercase font-semibold text-[11px]">
              <tr>
                <th className="p-3">User & Identity</th>
                {isSuperAdmin && instituteFilter === "ALL" && (
                  <th className="p-3">College / Campus</th>
                )}
                <th className="p-3">Role & Designation</th>
                <th className="p-3">Department & Batch</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={isSuperAdmin && instituteFilter === "ALL" ? 6 : 5} className="p-8 text-center text-muted-foreground">
                    Loading users directory...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin && instituteFilter === "ALL" ? 6 : 5} className="p-8 text-center text-muted-foreground">
                    No members match the current filter criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    {/* User Identity Column */}
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                            {u.name.charAt(0)}
                          </div>
                          {u.isOnline && (
                            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{u.name}</div>
                          <div className="text-muted-foreground text-[11px] font-mono">
                            {u.email} • ID: {u.institutionalId}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Campus Column (Super Admin All-Campuses View) */}
                    {isSuperAdmin && instituteFilter === "ALL" && (
                      <td className="p-3">
                        <div className="space-y-0.5">
                          <Badge variant="outline" className="font-mono text-[10px] font-bold">
                            {u.instituteCode || "HQ"}
                          </Badge>
                          <div className="text-[11px] text-muted-foreground truncate max-w-[140px]" title={u.instituteName}>
                            {u.instituteName || "Central Platform"}
                          </div>
                        </div>
                      </td>
                    )}

                    {/* Role & Designation */}
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge
                          variant={
                            u.role === "ADMIN" || u.role === "SUPER_ADMIN"
                              ? "destructive"
                              : u.role === "FACULTY"
                              ? "default"
                              : "secondary"
                          }
                          className="text-[10px] font-semibold"
                        >
                          {u.role}
                        </Badge>
                        {u.facultyRole && (
                          <span className="text-[11px] text-muted-foreground font-medium">
                            ({u.facultyRole.replace(/_/g, " ")})
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Department & Batch */}
                    <td className="p-3">
                      <div className="text-foreground font-medium">{u.department || "General"}</div>
                      {u.academicYear && (
                        <div className="text-[11px] text-muted-foreground">
                          {u.academicYear} {u.semester ? `• Sem ${u.semester}` : ""}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="p-3">
                      <Badge
                        variant="outline"
                        className={
                          u.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]"
                            : u.status === "PENDING"
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px]"
                            : "bg-destructive/10 text-destructive border-destructive/30 text-[10px]"
                        }
                      >
                        {u.status}
                      </Badge>
                    </td>

                    {/* Actions Menu */}
                    <td className="p-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        } />
                        <DropdownMenuContent align="end" className="w-44 text-xs">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(u)
                              setNewStatus(u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')
                              setStatusReason('')
                              setStatusModalOpen(true)
                            }}
                          >
                            {u.status === 'ACTIVE' ? (
                              <>
                                <UserX className="h-3.5 w-3.5 mr-2 text-rose-500" />
                                Suspend Access
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-3.5 w-3.5 mr-2 text-emerald-500" />
                                Activate Member
                              </>
                            )}
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(u)
                              setNewRole(u.role === 'SUPER_ADMIN' ? 'ADMIN' : (u.role as any))
                              setNewFacultyRole(u.facultyRole || 'PROFESSOR')
                              setRoleModalOpen(true)
                            }}
                          >
                            <SlidersHorizontal className="h-3.5 w-3.5 mr-2 text-primary" />
                            Change Role & Tier
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t text-xs text-muted-foreground">
            <div>Page {page} of {totalPages} ({total} total members)</div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Change Status Modal */}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Modify Member Account Status
            </DialogTitle>
            <DialogDescription className="text-xs">
              Updating account status for <strong>{selectedUser?.name}</strong> ({selectedUser?.email}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">New Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="ACTIVE">ACTIVE (Authorized full access)</option>
                <option value="SUSPENDED">SUSPENDED (Access blocked)</option>
                <option value="REJECTED">REJECTED (Application denied)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Administrative Reason / Justification</label>
              <Input
                placeholder="e.g. Cleared semester dues / Discipline committee flag"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStatusModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isSubmitting}
              onClick={handleUpdateStatus}
              className="font-semibold"
            >
              {isSubmitting ? "Updating..." : "Save Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Modal */}
      <Dialog open={roleModalOpen} onOpenChange={setRoleModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Update Role & Academic Authority
            </DialogTitle>
            <DialogDescription className="text-xs">
              Assign permission tier for <strong>{selectedUser?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">System Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as any)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="STUDENT">Student</option>
                <option value="FACULTY">Faculty Member</option>
                <option value="ADMIN">Institute Administrator</option>
              </select>
            </div>

            {newRole === 'FACULTY' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Faculty Functional Designation</label>
                <select
                  value={newFacultyRole}
                  onChange={(e) => setNewFacultyRole(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="PROFESSOR">Assistant / Associate Professor</option>
                  <option value="CLASS_COORDINATOR">Class Coordinator</option>
                  <option value="HOD">Head of Department (HoD)</option>
                  <option value="DEAN">Dean / Principal</option>
                </select>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRoleModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isSubmitting}
              onClick={handleUpdateRole}
              className="font-semibold"
            >
              {isSubmitting ? "Applying..." : "Update Authorization"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
