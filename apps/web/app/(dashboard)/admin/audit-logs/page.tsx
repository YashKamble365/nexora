"use client"

import * as React from "react"
import {
  Shield,
  Search,
  RefreshCw,
  Clock,
  Terminal,
  FileCode,
  Globe,
  User,
  ChevronDown,
  ChevronRight,
  Filter,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/shared/page-header"
import { apiClient } from "@/lib/api"
import { AuditLogDTO } from "@nexora/types"

export default function AuditLogsPage() {
  const [logs, setLogs] = React.useState<AuditLogDTO[]>([])
  const [total, setTotal] = React.useState(0)
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [loading, setLoading] = React.useState(true)

  // Filters
  const [search, setSearch] = React.useState("")
  const [actionFilter, setActionFilter] = React.useState("ALL")
  const [expandedLogId, setExpandedLogId] = React.useState<string | null>(null)

  const fetchLogs = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set("search", search.trim())
      if (actionFilter !== "ALL") params.set("action", actionFilter)
      params.set("page", String(page))
      params.set("limit", "25")

      const res = await apiClient.get<{
        data: AuditLogDTO[];
        total: number;
        page: number;
        totalPages: number;
      }>(`/audit?${params.toString()}`)

      setLogs(res.data || [])
      setTotal(res.total || 0)
      setTotalPages(res.totalPages || 1)
    } catch (err) {
      console.warn("Failed to load audit logs:", err)
    } finally {
      setLoading(false)
    }
  }, [search, actionFilter, page])

  React.useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const toggleExpand = (id: string) => {
    setExpandedLogId((prev) => (prev === id ? null : id))
  }

  const getActionBadge = (action: string) => {
    if (action.includes("EMERGENCY")) {
      return <Badge variant="destructive" className="font-mono text-[10px]">{action}</Badge>
    }
    if (action.includes("STATUS") || action.includes("ROLE")) {
      return <Badge className="bg-amber-600 text-white font-mono text-[10px]">{action}</Badge>
    }
    if (action.includes("INIT") || action.includes("APPROV")) {
      return <Badge className="bg-emerald-600 text-white font-mono text-[10px]">{action}</Badge>
    }
    return <Badge variant="outline" className="font-mono text-[10px]">{action}</Badge>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance & Audit Trail"
        description="Tamper-evident, immutable transaction ledger documenting institutional operations, administrative role modifications, and system events."
        badge={
          <Badge variant="outline" className="font-mono text-xs bg-muted">
            <Shield className="h-3 w-3 mr-1 text-primary" />
            {total} Audit Records
          </Badge>
        }
      >
        <Button variant="outline" size="sm" onClick={() => fetchLogs()} className="h-8">
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </PageHeader>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-lg border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by actor name, email, action..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value)
              setPage(1)
            }}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="ALL">All Actions</option>
            <option value="USER_STATUS_CHANGE">USER_STATUS_CHANGE</option>
            <option value="USER_ROLE_CHANGE">USER_ROLE_CHANGE</option>
            <option value="EMERGENCY_BROADCAST">EMERGENCY_BROADCAST</option>
            <option value="SYSTEM_INITIALIZATION">SYSTEM_INITIALIZATION</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b text-muted-foreground uppercase font-semibold">
              <tr>
                <th className="p-3 w-8"></th>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Action</th>
                <th className="p-3">Actor / Origin</th>
                <th className="p-3">Target Entity</th>
                <th className="p-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground font-sans">
                    Loading immutable audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground font-sans">
                    No audit records recorded for this filter scope.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isExpanded = expandedLogId === log.id
                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        onClick={() => toggleExpand(log.id)}
                        className="hover:bg-muted/40 cursor-pointer transition-colors"
                      >
                        <td className="p-3 text-muted-foreground">
                          {isExpanded ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                        </td>

                        <td className="p-3 text-muted-foreground whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-sans">
                            <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                            <span className="font-mono text-[11px] text-foreground">
                              {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>
                        </td>

                        <td className="p-3">
                          {getActionBadge(log.action)}
                        </td>

                        <td className="p-3 font-sans">
                          <div className="font-semibold text-foreground flex items-center gap-1">
                            <User className="h-3 w-3 text-primary" />
                            {log.actor?.name || 'System'}
                          </div>
                          <div className="text-[11px] text-muted-foreground font-mono">
                            {log.actor?.email} ({log.actor?.role})
                          </div>
                        </td>

                        <td className="p-3">
                          <span className="bg-muted px-1.5 py-0.5 rounded text-[11px]">
                            {log.entityType}: {log.entityId}
                          </span>
                        </td>

                        <td className="p-3 text-muted-foreground text-[11px]">
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3 text-muted-foreground" />
                            {log.ipAddress || '127.0.0.1'}
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-muted/20">
                          <td colSpan={6} className="p-4 border-t border-b">
                            <div className="rounded-lg bg-background border p-3 font-mono text-[11px] space-y-2">
                              <div className="flex items-center justify-between text-muted-foreground pb-1 border-b">
                                <span className="font-sans font-semibold flex items-center gap-1.5 text-xs text-foreground">
                                  <FileCode className="h-3.5 w-3.5 text-primary" />
                                  Audit Payload Metadata
                                </span>
                                <span>Record ID: {log.id}</span>
                              </div>
                              <pre className="overflow-x-auto text-foreground py-1">
                                {JSON.stringify(log.metadata || {}, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t text-xs text-muted-foreground">
            <div>Page {page} of {totalPages}</div>
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
    </div>
  )
}
