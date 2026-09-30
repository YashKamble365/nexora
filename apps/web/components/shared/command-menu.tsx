"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Bell,
  Calendar,
  FileText,
  Home,
  MessageSquare,
  ShieldAlert,
  Users,
  Vote,
  Settings,
  User,
  Shield,
  LifeBuoy
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: string;
  isAdmin?: boolean;
}

export function CommandMenu({ open, onOpenChange, role = "STUDENT" }: CommandMenuProps) {
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open, onOpenChange])

  const runCommand = React.useCallback(
    (command: () => void) => {
      onOpenChange(false)
      command()
    },
    [onOpenChange]
  )

  const isSuperAdmin = role === "SUPER_ADMIN"
  const isAdmin = role === "ADMIN"
  const isFaculty = role === "FACULTY"
  const isStudent = role === "STUDENT"

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search campus..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* 1. Super Admin Platform Commands */}
        {isSuperAdmin && (
          <CommandGroup heading="Platform Governance">
            <CommandItem onSelect={() => runCommand(() => router.push("/admin/dashboard"))}>
              <Shield className="mr-2 h-4 w-4 text-primary" />
              <span>Platform Control Center</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/admin/approvals"))}>
              <Users className="mr-2 h-4 w-4 text-amber-500" />
              <span>Colleges Verification Queue</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/admin/users"))}>
              <Users className="mr-2 h-4 w-4 text-primary" />
              <span>Global Multi-Tenant Users</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/admin/analytics"))}>
              <FileText className="mr-2 h-4 w-4 text-indigo-500" />
              <span>Platform Analytics</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/admin/audit-logs"))}>
              <ShieldAlert className="mr-2 h-4 w-4 text-rose-500" />
              <span>System Security Audit Logs</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/app/messages"))}>
              <MessageSquare className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Platform Messages</span>
            </CommandItem>
          </CommandGroup>
        )}

        {/* 2. Campus Admin Executive Commands */}
        {isAdmin && (
          <CommandGroup heading="Campus Executive Control">
            <CommandItem onSelect={() => runCommand(() => router.push("/admin/dashboard"))}>
              <Shield className="mr-2 h-4 w-4 text-primary" />
              <span>Executive Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/admin/approvals"))}>
              <Users className="mr-2 h-4 w-4 text-amber-500" />
              <span>Member Verification Queue</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/admin/structure"))}>
              <FileText className="mr-2 h-4 w-4 text-primary" />
              <span>Academic Blueprint Configuration</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/admin/users"))}>
              <Users className="mr-2 h-4 w-4 text-primary" />
              <span>Campus Directory & Roles</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/admin/analytics"))}>
              <FileText className="mr-2 h-4 w-4 text-indigo-500" />
              <span>Institutional Intelligence Analytics</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/app/complaints"))}>
              <LifeBuoy className="mr-2 h-4 w-4 text-amber-500" />
              <span>Grievance Triage & Redressal</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/admin/audit-logs"))}>
              <ShieldAlert className="mr-2 h-4 w-4 text-rose-500" />
              <span>Campus Security Audit Trail</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/app/notices"))}>
              <Bell className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Publish & Manage Notices</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/app/events"))}>
              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Campus Events & Fests</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/app/polls"))}>
              <Vote className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Campus Democracy Polls</span>
            </CommandItem>
          </CommandGroup>
        )}

        {/* 3. Faculty Academic Commands */}
        {isFaculty && (
          <CommandGroup heading="Faculty Workspace">
            <CommandItem onSelect={() => runCommand(() => router.push("/app"))}>
              <Home className="mr-2 h-4 w-4 text-primary" />
              <span>Faculty Academic Overview</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/admin/approvals"))}>
              <Users className="mr-2 h-4 w-4 text-amber-500" />
              <span>Student Class / Department Approvals</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/app/files"))}>
              <FileText className="mr-2 h-4 w-4 text-primary" />
              <span>Course Files & Lecture Notes</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/app/polls"))}>
              <Vote className="mr-2 h-4 w-4 text-primary" />
              <span>Class Polls & Elective Surveys</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/app/notices"))}>
              <Bell className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Department Notices & Bulletins</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/app/events"))}>
              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Academic Events & Rosters</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/app/complaints"))}>
              <LifeBuoy className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Department Grievance Triage</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/app/people"))}>
              <Users className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Faculty & Students Directory</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/app/messages"))}>
              <MessageSquare className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Department Chat Grid</span>
            </CommandItem>
          </CommandGroup>
        )}

        {/* 4. Student Learning Commands */}
        {isStudent && (
          <CommandGroup heading="Student Campus Life">
            <CommandItem onSelect={() => runCommand(() => router.push("/app"))}>
              <Home className="mr-2 h-4 w-4 text-primary" />
              <span>Campus Feed & Timeline</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/app/files"))}>
              <FileText className="mr-2 h-4 w-4 text-primary" />
              <span>Course Syllabus & Lab Manuals</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/app/notices"))}>
              <Bell className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Official Circulars & Notices</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/app/events"))}>
              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Upcoming Events & Passes</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/app/polls"))}>
              <Vote className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Campus Democracy & Voting</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/app/messages"))}>
              <MessageSquare className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Direct Messages & Channels</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/app/people"))}>
              <Users className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>People & Peers Directory</span>
            </CommandItem>
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* 5. Role-Tailored Quick Actions */}
        <CommandGroup heading="Quick Actions">
          {(isStudent || isFaculty) && (
            <CommandItem onSelect={() => runCommand(() => router.push("/app/complaints"))}>
              <LifeBuoy className="mr-2 h-4 w-4 text-amber-500" />
              <span>File a Whistleblower Grievance</span>
            </CommandItem>
          )}

          {(isAdmin || isFaculty) && (
            <CommandItem onSelect={() => runCommand(() => router.push("/app/emergency"))}>
              <ShieldAlert className="mr-2 h-4 w-4 text-rose-500" />
              <span>Broadcast Emergency Siren</span>
            </CommandItem>
          )}

          {isStudent && (
            <CommandItem onSelect={() => runCommand(() => router.push("/app/emergency"))}>
              <ShieldAlert className="mr-2 h-4 w-4 text-rose-500" />
              <span>View Emergency Grid & Helplines</span>
            </CommandItem>
          )}

          {isStudent && (
            <CommandItem onSelect={() => runCommand(() => router.push("/app/polls"))}>
              <Vote className="mr-2 h-4 w-4 text-purple-500" />
              <span>Submit Faculty Evaluation</span>
            </CommandItem>
          )}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings & Account">
          <CommandItem onSelect={() => runCommand(() => router.push("/app/profile"))}>
            <User className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Profile</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/app/settings"))}>
            <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
