"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Bell,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  Home,
  LifeBuoy,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  User,
  Users,
  UserCheck,
  Layers,
  Vote,
  BarChart3,
  ScrollText,
  Building2,
  GraduationCap,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ThemeToggle } from "@/components/theme-toggle"
import { CommandMenu } from "@/components/shared/command-menu"
import { NotificationBell } from "@/components/shared/notification-bell"

export type AppUserRole = "STUDENT" | "FACULTY" | "ADMIN" | "SUPER_ADMIN";

export interface AppShellUser {
  id: string;
  name: string;
  email: string;
  role: AppUserRole;
  facultyRole?: "HOD" | "CLASS_COORDINATOR" | "PROFESSOR" | "ASSISTANT_PROFESSOR";
  coordinatorYear?: string;
  department: string;
  academicYear?: string;
  instituteName?: string;
  avatarUrl?: string;
}

interface AppShellProps {
  children: React.ReactNode;
  user?: AppShellUser;
  unreadCounts?: {
    messages?: number;
    notices?: number;
    complaints?: number;
    pendingApprovals?: number;
    events?: number;
    polls?: number;
    files?: number;
  };
  hasActiveEmergency?: boolean;
  emergencyAlert?: {
    title: string;
    severity?: 'WARNING' | 'CRITICAL' | 'EVACUATION';
    actionRequired?: string;
  } | null;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  badgeVariant?: "default" | "destructive" | "secondary";
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function AppShell({
  children,
  user: propUser,
  unreadCounts = {},
  hasActiveEmergency = false,
  emergencyAlert = null,
}: AppShellProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [commandOpen, setCommandOpen] = React.useState(false)

  // Use propUser, or eagerly hydrate from localStorage on client to prevent flash of wrong role
  const [user, setUser] = React.useState<AppShellUser>(() => {
    if (propUser) return propUser
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("nexora_user")
        if (stored) return JSON.parse(stored) as AppShellUser
      } catch {}
    }
    return {
      id: "usr_active",
      name: "Campus User",
      email: "",
      role: "STUDENT",
      department: "Campus Grid",
    }
  })

  React.useEffect(() => {
    if (propUser) {
      setUser(propUser)
    } else if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("nexora_user")
        if (stored) setUser(JSON.parse(stored) as AppShellUser)
      } catch {}
    }
  }, [propUser])

  const isSuperAdmin = user.role === "SUPER_ADMIN"
  const isAdmin = user.role === "ADMIN"
  const isFaculty = user.role === "FACULTY"

  const navSections: NavSection[] = React.useMemo(() => {
    if (isSuperAdmin) {
      return [
        {
          title: "PLATFORM GOVERNANCE",
          items: [
            { title: "Platform Hub", href: "/admin/dashboard", icon: Shield },
            {
              title: "College Approvals",
              href: "/admin/approvals",
              icon: Building2,
              badge: unreadCounts.pendingApprovals,
            },
            { title: "Global Users", href: "/admin/users", icon: Users },
            { title: "Platform Analytics", href: "/admin/analytics", icon: BarChart3 },
            { title: "System Audit Logs", href: "/admin/audit-logs", icon: ScrollText },
          ],
        },
        {
          title: "COMMUNICATIONS",
          items: [
            {
              title: "Messages",
              href: "/app/messages",
              icon: MessageSquare,
              badge: unreadCounts.messages,
            },
          ],
        },
        {
          title: "SYSTEM PREFERENCES",
          items: [
            { title: "Profile", href: "/app/profile", icon: User },
            { title: "Settings", href: "/app/settings", icon: Settings },
          ],
        },
      ]
    }

    if (isAdmin) {
      return [
        {
          title: "CAMPUS CONTROL",
          items: [
            { title: "Executive Dashboard", href: "/admin/dashboard", icon: Shield },
            {
              title: "Verification Queue",
              href: "/admin/approvals",
              icon: UserCheck,
              badge: unreadCounts.pendingApprovals,
            },
            { title: "Academic Blueprint", href: "/admin/structure", icon: Layers },
            { title: "Campus Directory", href: "/admin/users", icon: Users },
          ],
        },
        {
          title: "OPERATIONS & COMPLIANCE",
          items: [
            { title: "Campus Analytics", href: "/admin/analytics", icon: BarChart3 },
            {
              title: "Grievance Triage",
              href: "/app/complaints",
              icon: LifeBuoy,
              badge: unreadCounts.complaints,
            },
            {
              title: "Emergency Command",
              href: "/app/emergency",
              icon: ShieldAlert,
              badge: hasActiveEmergency ? 1 : undefined,
              badgeVariant: "destructive",
            },
            { title: "Audit Trail", href: "/admin/audit-logs", icon: ScrollText },
          ],
        },
        {
          title: "CAMPUS BROADCASTS",
          items: [
            {
              title: "Campus Bulletins",
              href: "/app/notices",
              icon: Bell,
              badge: unreadCounts.notices,
            },
            {
              title: "Events & Fests",
              href: "/app/events",
              icon: Calendar,
              badge: unreadCounts.events,
            },
            {
              title: "Surveys & Polls",
              href: "/app/polls",
              icon: Vote,
              badge: unreadCounts.polls,
            },
            {
              title: "Academic Repository",
              href: "/app/files",
              icon: FileText,
              badge: unreadCounts.files,
            },
            {
              title: "Direct Messages",
              href: "/app/messages",
              icon: MessageSquare,
              badge: unreadCounts.messages,
            },
          ],
        },
      ]
    }

    if (isFaculty) {
      const isVerifier =
        user.facultyRole === "HOD" || user.facultyRole === "CLASS_COORDINATOR"
      return [
        {
          title: user.facultyRole === "HOD" ? "DEPARTMENT COMMAND" : "ACADEMIC WORKSPACE",
          items: [
            {
              title: user.facultyRole === "HOD" ? "Department Command" : "Faculty Overview",
              href: "/app",
              icon: user.facultyRole === "HOD" ? Building2 : Home,
            },
            ...(isVerifier
              ? [
                  {
                    title:
                      user.facultyRole === "HOD"
                        ? "Department Approvals"
                        : "Class Approvals",
                    href: "/admin/approvals",
                    icon: UserCheck,
                    badge: unreadCounts.pendingApprovals,
                  },
                ]
              : []),
            ...(user.facultyRole === "HOD"
              ? [
                  {
                    title: "Department Subjects",
                    href: "/admin/structure",
                    icon: Layers,
                  },
                ]
              : []),
            {
              title: "Course Files & Notes",
              href: "/app/files",
              icon: FileText,
              badge: unreadCounts.files,
            },
            {
              title: "Course Surveys & Polls",
              href: "/app/polls",
              icon: Vote,
              badge: unreadCounts.polls,
            },
          ],
        },
        {
          title: "DEPARTMENT & CAMPUS",
          items: [
            {
              title: "Department Notices",
              href: "/app/notices",
              icon: Bell,
              badge: unreadCounts.notices,
            },
            {
              title: "Campus Events",
              href: "/app/events",
              icon: Calendar,
              badge: unreadCounts.events,
            },
            { title: "Faculty & Peers", href: "/app/people", icon: Users },
            {
              title: "Messages",
              href: "/app/messages",
              icon: MessageSquare,
              badge: unreadCounts.messages,
            },
          ],
        },
        {
          title: "SUPPORT & SAFETY",
          items: [
            {
              title: "Department Grievances",
              href: "/app/complaints",
              icon: LifeBuoy,
              badge: unreadCounts.complaints,
            },
            {
              title: "Emergency Command",
              href: "/app/emergency",
              icon: ShieldAlert,
              badge: hasActiveEmergency ? 1 : undefined,
              badgeVariant: "destructive",
            },
          ],
        },
      ]
    }

    // Default: STUDENT
    return [
      {
        title: "ACADEMICS & LIFE",
        items: [
          { title: "Campus Feed", href: "/app", icon: Home },
          {
            title: "Course Files",
            href: "/app/files",
            icon: FileText,
            badge: unreadCounts.files,
          },
          {
            title: "Notices & Circulars",
            href: "/app/notices",
            icon: Bell,
            badge: unreadCounts.notices,
          },
          {
            title: "Upcoming Events",
            href: "/app/events",
            icon: Calendar,
            badge: unreadCounts.events,
          },
          {
            title: "Surveys & Polls",
            href: "/app/polls",
            icon: Vote,
            badge: unreadCounts.polls,
          },
        ],
      },
      {
        title: "COMMUNITY & CHAT",
        items: [
          {
            title: "Direct Messages",
            href: "/app/messages",
            icon: MessageSquare,
            badge: unreadCounts.messages,
          },
          { title: "People Directory", href: "/app/people", icon: Users },
        ],
      },
      {
        title: "STUDENT SUPPORT",
        items: [
          {
            title: "Submit Grievance",
            href: "/app/complaints",
            icon: LifeBuoy,
            badge: unreadCounts.complaints,
          },
          {
            title: "Emergency Alert",
            href: "/app/emergency",
            icon: ShieldAlert,
            badge: hasActiveEmergency ? 1 : undefined,
            badgeVariant: "destructive",
          },
        ],
      },
    ]
  }, [isSuperAdmin, isAdmin, isFaculty, user.facultyRole, unreadCounts, hasActiveEmergency])

  const renderNavItems = (isMobile = false) => (
    <div className="space-y-6">
      {navSections.map((section) => (
        <div key={section.title} className="space-y-1">
          {(!collapsed || isMobile) && (
            <h4 className="px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
              {section.title}
            </h4>
          )}
          <nav className="space-y-0.5">
            {section.items.map((item) => {
              const Icon = item.icon
              const isActive =
                item.href === "/app"
                  ? pathname === "/app"
                  : pathname?.startsWith(item.href)

              const navLink = (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => isMobile && setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                    collapsed && !isMobile && "justify-center px-2"
                  )}
                >
                  <div className="relative flex items-center justify-center">
                    <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
                    {collapsed && !isMobile && item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-destructive ring-2 ring-background animate-pulse" />
                    )}
                  </div>
                  {(!collapsed || isMobile) && (
                    <span className="flex-1 truncate">{item.title}</span>
                  )}
                  {item.badge !== undefined && item.badge > 0 && (!collapsed || isMobile) && (
                    <Badge
                      variant={item.badgeVariant || "secondary"}
                      className="ml-auto text-[10px] px-1.5 py-0 h-4 font-semibold"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              )

              if (collapsed && !isMobile) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger render={navLink} />
                    <TooltipContent side="right" className="font-medium">
                      {item.title}
                      {item.badge && item.badge > 0 && ` (${item.badge})`}
                    </TooltipContent>
                  </Tooltip>
                )
              }

              return navLink
            })}
          </nav>
        </div>
      ))}
    </div>
  )

  return (
    <TooltipProvider>
      <div className="flex min-h-screen bg-background text-foreground">
        {/* Desktop Sidebar */}
        <aside
          className={cn(
            "hidden md:flex flex-col border-r border-border bg-sidebar transition-all duration-200 z-30 sticky top-0 h-screen shrink-0",
            collapsed ? "w-16" : "w-64"
          )}
        >
          {/* Sidebar Header */}
          <div className="flex h-14 items-center justify-between px-3 border-b border-sidebar-border">
            <Link
              href={isSuperAdmin || isAdmin ? "/admin/dashboard" : "/app"}
              className={cn(
                "flex items-center gap-2 overflow-hidden transition-opacity",
                collapsed ? "justify-center w-full" : "px-1"
              )}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm shrink-0">
                N
              </div>
              {!collapsed && (
                <div className="flex flex-col min-w-0" suppressHydrationWarning>
                  <span
                    className="font-semibold text-sm tracking-tight leading-none text-sidebar-foreground truncate"
                    title={user.instituteName || "Nexora Campus"}
                    suppressHydrationWarning
                  >
                    {user.instituteName || "Nexora Campus"}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5 truncate" suppressHydrationWarning>
                    {isSuperAdmin
                      ? "Platform Operator"
                      : isAdmin
                      ? "Campus Administration"
                      : isFaculty
                      ? (user.facultyRole ? `${user.facultyRole.replace(/_/g, " ")}` : (user.department || "Faculty Member"))
                      : `${user.department || "Student"}`}
                  </span>
                </div>
              )}
            </Link>
            {!collapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => setCollapsed(true)}
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Sidebar Body */}
          <div className="flex-1 overflow-y-auto px-2 py-4">
            {renderNavItems(false)}
          </div>

          {/* Sidebar Footer */}
          <div className="p-2 border-t border-sidebar-border space-y-1">
            {collapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="w-full h-8 text-muted-foreground hover:text-foreground"
                onClick={() => setCollapsed(false)}
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
            
            <Link
              href="/app/settings"
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-colors",
                collapsed && "justify-center px-2"
              )}
            >
              <Settings className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Settings</span>}
            </Link>
          </div>
        </aside>

        {/* Main Application Container */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Accessible Skip to Content Link */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-3 focus:py-1.5 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:text-xs focus:font-semibold focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
          >
            Skip to main content
          </a>

          {/* Top Bar */}
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-border bg-background/95 backdrop-blur px-4 sm:px-6">
            <div className="flex items-center gap-3">
              {/* Mobile Drawer Trigger */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger
                  render={
                    <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" aria-label="Open navigation menu">
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Toggle navigation</span>
                    </Button>
                  }
                />
                <SheetContent side="left" className="w-72 p-0 flex flex-col bg-sidebar">
                  <SheetHeader className="p-4 border-b border-sidebar-border">
                    <SheetTitle className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm shrink-0">
                        N
                      </div>
                      <div className="flex flex-col min-w-0 text-left">
                        <span className="text-sm font-semibold truncate leading-none">{user.instituteName || "Nexora Campus"}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-normal mt-0.5">{user.role}</span>
                      </div>
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto p-3">
                    {renderNavItems(true)}
                  </div>
                </SheetContent>
              </Sheet>

              {/* Quick Search / Command Palette Trigger */}
              <button
                type="button"
                onClick={() => setCommandOpen(true)}
                aria-label="Search campus (Press Command K)"
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-md border border-input bg-muted/50 hover:bg-muted text-xs text-muted-foreground transition-colors w-44 sm:w-64"
              >
                <Search className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1 text-left truncate">Search campus...</span>
                <kbd className="pointer-events-none hidden sm:inline-flex h-4 items-center gap-0.5 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </button>

              {/* Campus Indicator Pill */}
              <div
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/40 border border-border/80 text-xs text-foreground max-w-xs xl:max-w-md shadow-xs"
                title={user.instituteName || "Nexora Campus"}
              >
                <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="font-medium truncate">{user.instituteName || "Nexora Campus"}</span>
              </div>
            </div>

            {/* Right Topbar Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {hasActiveEmergency && (
                <Link href="/app/emergency" aria-label="View active emergency safety alert">
                  <Badge variant="destructive" className="animate-pulse cursor-pointer flex items-center gap-1.5 text-xs py-1">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Active Alert</span>
                  </Badge>
                </Link>
              )}

              <NotificationBell />

              <ThemeToggle />

              <Separator orientation="vertical" className="h-5 hidden sm:block" />

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button
                      aria-label="Open user profile menu"
                      className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <Avatar className="h-8 w-8 border border-border">
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary" suppressHydrationWarning>
                          {user.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  }
                />
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="font-normal" suppressHydrationWarning>
                      <div className="flex flex-col space-y-1.5" suppressHydrationWarning>
                        <div>
                          <p className="text-sm font-semibold leading-none">{user.name}</p>
                          <p className="text-xs leading-none text-muted-foreground mt-1">{user.email}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-1">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 uppercase font-semibold">
                            {user.role}
                          </Badge>
                          {user.facultyRole && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {user.facultyRole.replace(/_/g, " ")}
                            </Badge>
                          )}
                          <span className="text-[10px] text-muted-foreground truncate">
                            • {user.department}
                          </span>
                        </div>
                        {user.instituteName && (
                          <div
                            className="pt-1 flex items-center gap-1.5 text-[11px] font-medium text-foreground/85 truncate border-t border-border/50"
                            title={user.instituteName}
                          >
                            <Building2 className="h-3 w-3 text-primary shrink-0" />
                            <span className="truncate">{user.instituteName}</span>
                          </div>
                        )}
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      render={
                        <Link href="/app/profile" className="flex items-center w-full cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </Link>
                      }
                    />
                    <DropdownMenuItem
                      render={
                        <Link href="/app/settings" className="flex items-center w-full cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Settings</span>
                        </Link>
                      }
                    />
                    {(isAdmin || isSuperAdmin) && (
                      <DropdownMenuItem
                        render={
                          <Link href="/admin/dashboard" className="flex items-center w-full cursor-pointer text-primary">
                            <Shield className="mr-2 h-4 w-4" />
                            <span>{isSuperAdmin ? "Platform Console" : "Administration"}</span>
                          </Link>
                        }
                      />
                    )}
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    render={
                      <Link href="/auth/login" className="flex items-center w-full cursor-pointer text-destructive focus:text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </Link>
                    }
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Active Emergency Global Banner */}
          {hasActiveEmergency && (
            <div
              role="alert"
              aria-live="assertive"
              className={cn(
                "text-white px-4 py-2.5 text-xs sm:text-sm font-medium flex items-center justify-between shadow-md transition-colors",
                emergencyAlert?.severity === 'EVACUATION' ? "bg-red-600 animate-pulse" : emergencyAlert?.severity === 'CRITICAL' ? "bg-red-700" : "bg-amber-600"
              )}
            >
              <div className="flex items-center gap-2 truncate">
                <ShieldAlert className="h-4 w-4 shrink-0 animate-bounce" aria-hidden="true" />
                <span className="font-bold tracking-wider uppercase">[{emergencyAlert?.severity || 'CAMPUS ALERT'}]:</span>
                <span className="truncate">{emergencyAlert?.title || 'Active campus safety alert in progress'}</span>
              </div>
              <Link href="/app/emergency" className="underline underline-offset-4 shrink-0 ml-3 text-xs font-semibold hover:opacity-90 bg-white/20 px-2.5 py-1 rounded transition-opacity">
                View Protocol & Evacuation Grid &rarr;
              </Link>
            </div>
          )}

          {/* Page Body Viewport */}
          <main id="main-content" tabIndex={-1} className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto outline-none">
            {children}
          </main>
        </div>
      </div>

      {/* Global Command Menu */}
      <CommandMenu
        open={commandOpen}
        onOpenChange={setCommandOpen}
        role={user.role}
        isAdmin={isAdmin}
      />
    </TooltipProvider>
  )
}
