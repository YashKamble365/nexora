"use client"

import * as React from "react"
import {
  Settings,
  Shield,
  Bell,
  Lock,
  Moon,
  Sun,
  Laptop,
  CheckCircle2,
  AlertCircle,
  Eye,
  MessageSquare,
  LogOut,
  Sparkles,
  Loader2,
  Smartphone,
  ShieldAlert,
  Download,
  Fingerprint,
} from "lucide-react"

import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function SettingsPage() {
  const { user, logout, updateUser } = useAuth()

  // Settings State
  const [dmPermission, setDmPermission] = React.useState<
    "ALLOW_ALL" | "SAME_DEPARTMENT_ONLY" | "FACULTY_ONLY"
  >(user?.privacySettings?.dmPermission || "ALLOW_ALL")

  const [profileVisibility, setProfileVisibility] = React.useState<"PUBLIC" | "PRIVATE">(
    (user as any)?.profileVisibility || "PUBLIC"
  )

  const [emergencyAlertsEnabled, setEmergencyAlertsEnabled] = React.useState(true)
  const [noticeAlertsEnabled, setNoticeAlertsEnabled] = React.useState(true)
  const [eventAlertsEnabled, setEventAlertsEnabled] = React.useState(true)
  const [complaintAlertsEnabled, setComplaintAlertsEnabled] = React.useState(true)

  // Feedback State
  const [isSaving, setIsSaving] = React.useState(false)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  // Load latest settings on mount
  React.useEffect(() => {
    async function loadSettings() {
      try {
        const res = await apiClient.get<any>("/users/profile/me")
        if (res?.user?.privacySettings?.dmPermission) {
          setDmPermission(res.user.privacySettings.dmPermission)
        }
        if (res?.user?.profileVisibility) {
          setProfileVisibility(res.user.profileVisibility)
        }
      } catch (err) {
        console.warn("Could not load latest settings:", err)
      }
    }
    loadSettings()
  }, [])

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const res = await apiClient.patch<any>("/users/settings", {
        dmPermission,
        profileVisibility,
      })

      if (res?.privacySettings || res?.profileVisibility) {
        updateUser({
          privacySettings: res.privacySettings,
          profileVisibility: res.profileVisibility,
        } as any)
      }

      setSuccessMessage("Campus privacy and security preferences updated successfully!")
    } catch (err: any) {
      console.warn("Settings save error:", err)
      setErrorMessage(err.message || "Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  // Export personal data
  const handleExportData = () => {
    const data = {
      exportTimestamp: new Date().toISOString(),
      user: {
        id: user?.id,
        name: user?.name,
        email: user?.email,
        role: user?.role,
        department: user?.department,
        institutionalId: user?.institutionalId,
        academicYear: user?.academicYear,
        privacySettings: { dmPermission },
      },
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `nexora-profile-${user?.institutionalId || "data"}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <PageHeader
        title="Account & Security Settings"
        description="Configure your direct message privacy, campus alerts, and digital presence rules."
        badge={
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            <Lock className="h-3 w-3 mr-1" />
            Zero-Trust Protocol
          </Badge>
        }
      />

      {/* Alerts */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-sm animate-in fade-in-50 duration-300">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
          <p className="font-medium">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-in fade-in-50 duration-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="font-medium">{errorMessage}</p>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 0: Student Profile Visibility & Discovery */}
        <Card className="border-border shadow-xs">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              Directory Profile Visibility (Public vs Private)
            </CardTitle>
            <CardDescription>
              Control how much of your academic profile other students can view from the People Directory.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user?.role === "STUDENT" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Option 1: PUBLIC */}
                <label
                  className={`flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${
                    profileVisibility === "PUBLIC"
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      Public Scholar Profile
                    </span>
                    <input
                      type="radio"
                      name="profileVisibility"
                      value="PUBLIC"
                      checked={profileVisibility === "PUBLIC"}
                      onChange={() => setProfileVisibility("PUBLIC")}
                      className="accent-primary h-4 w-4"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Full academic profile, bio, campus activity stats, and shared materials are visible to all verified peers in the campus directory.
                  </p>
                </label>

                {/* Option 2: PRIVATE */}
                <label
                  className={`flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${
                    profileVisibility === "PRIVATE"
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-amber-500" />
                      Private Scholar Profile (Instagram-Style)
                    </span>
                    <input
                      type="radio"
                      name="profileVisibility"
                      value="PRIVATE"
                      checked={profileVisibility === "PRIVATE"}
                      onChange={() => setProfileVisibility("PRIVATE")}
                      className="accent-primary h-4 w-4"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Only your basic discovery card (name, department, roll number, avatar) appears in the directory. Detailed bio, campus statistics, and personal information are masked behind a privacy shield.
                  </p>
                </label>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs flex items-center gap-2.5">
                <Shield className="h-4 w-4 shrink-0" />
                <p>
                  <strong>Institutional Policy:</strong> Faculty and Administrator profiles are permanently public to ensure academic guidance, office hours accessibility, and transparent student mentorship.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 1: Direct Messaging & Discovery Privacy */}
        <Card className="border-border shadow-xs">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Direct Messaging & Interaction Privacy
            </CardTitle>
            <CardDescription>
              Control who can send you direct chat requests and invite you to academic groups.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Option 1: ALLOW_ALL */}
              <label
                className={`flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${
                  dmPermission === "ALLOW_ALL"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-xs text-foreground">Open Campus</span>
                  <input
                    type="radio"
                    name="dmPermission"
                    value="ALLOW_ALL"
                    checked={dmPermission === "ALLOW_ALL"}
                    onChange={() => setDmPermission("ALLOW_ALL")}
                    className="accent-primary h-4 w-4"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Any verified student, faculty, or staff member in your college can message you.
                </p>
              </label>

              {/* Option 2: SAME_DEPARTMENT_ONLY */}
              <label
                className={`flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${
                  dmPermission === "SAME_DEPARTMENT_ONLY"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-xs text-foreground">Department Only</span>
                  <input
                    type="radio"
                    name="dmPermission"
                    value="SAME_DEPARTMENT_ONLY"
                    checked={dmPermission === "SAME_DEPARTMENT_ONLY"}
                    onChange={() => setDmPermission("SAME_DEPARTMENT_ONLY")}
                    className="accent-primary h-4 w-4"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Only scholars and faculty within {user?.department || "your department"} can initiate chats.
                </p>
              </label>

              {/* Option 3: FACULTY_ONLY */}
              <label
                className={`flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${
                  dmPermission === "FACULTY_ONLY"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-xs text-foreground">Faculty Only</span>
                  <input
                    type="radio"
                    name="dmPermission"
                    value="FACULTY_ONLY"
                    checked={dmPermission === "FACULTY_ONLY"}
                    onChange={() => setDmPermission("FACULTY_ONLY")}
                    className="accent-primary h-4 w-4"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Only verified professors, class coordinators, and HoDs can send direct communications.
                </p>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Campus Alert Broadcasts & Notifications */}
        <Card className="border-border shadow-xs">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              Notifications & Campus Broadcasts
            </CardTitle>
            <CardDescription>
              Manage real-time WebSocket alerts and push updates for campus events.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 divide-y divide-border">
            {/* Siren Emergency Alert */}
            <div className="flex items-center justify-between pt-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-foreground">
                    Emergency Alert Sirens & Evacuation Grids
                  </span>
                  <Badge variant="destructive" className="text-[10px] py-0 px-1.5 uppercase font-bold">
                    Mandatory
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Immediate visual flashing siren and audio dispatch during campus safety threats.
                </p>
              </div>
              <input
                type="checkbox"
                checked={emergencyAlertsEnabled}
                disabled
                className="accent-primary h-4 w-4 cursor-not-allowed opacity-80"
              />
            </div>

            {/* Official Notices */}
            <div className="flex items-center justify-between pt-3">
              <div className="space-y-0.5">
                <span className="font-semibold text-xs text-foreground">
                  Notice Board Broadcasts
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Real-time alerts when department coordinators publish notices or exam circulars.
                </p>
              </div>
              <input
                type="checkbox"
                checked={noticeAlertsEnabled}
                onChange={(e) => setNoticeAlertsEnabled(e.target.checked)}
                className="accent-primary h-4 w-4 cursor-pointer"
              />
            </div>

            {/* Event RSVPs */}
            <div className="flex items-center justify-between pt-3">
              <div className="space-y-0.5">
                <span className="font-semibold text-xs text-foreground">
                  Event Reminders & RSVPs
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Get notified 24 hours prior to registered hackathons, seminars, and guest talks.
                </p>
              </div>
              <input
                type="checkbox"
                checked={eventAlertsEnabled}
                onChange={(e) => setEventAlertsEnabled(e.target.checked)}
                className="accent-primary h-4 w-4 cursor-pointer"
              />
            </div>

            {/* Grievance Progress */}
            <div className="flex items-center justify-between pt-3">
              <div className="space-y-0.5">
                <span className="font-semibold text-xs text-foreground">
                  Grievance Resolution Updates
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Real-time notifications when a faculty committee adds remarks or resolves your ticket.
                </p>
              </div>
              <input
                type="checkbox"
                checked={complaintAlertsEnabled}
                onChange={(e) => setComplaintAlertsEnabled(e.target.checked)}
                className="accent-primary h-4 w-4 cursor-pointer"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Whistleblower Privacy & Data Governance */}
        <Card className="border-border shadow-xs bg-muted/20">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Fingerprint className="h-4 w-4 text-primary" />
              Whistleblower Guarantee & Data Governance
            </CardTitle>
            <CardDescription>
              Nexora cryptographically severs personal identity from anonymous submissions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-card border border-border/80 text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <Shield className="h-4 w-4 text-emerald-500" />
                Zero-Knowledge Anonymous Reporting
              </div>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                When you file an anonymous grievance ticket, your database user identifier, name, and email are completely stripped before saving to the central server. Neither faculty coordinators nor database administrators can trace anonymous submissions back to your student account.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div>
                <p className="font-semibold text-xs text-foreground">Export Digital Campus Record</p>
                <p className="text-[11px] text-muted-foreground">
                  Download a JSON copy of your active profile and institutional activity logs.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExportData}
                className="text-xs font-semibold shrink-0"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Export Data
              </Button>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-3 border-t border-border pt-4">
            <Button
              type="submit"
              disabled={isSaving}
              className="font-semibold text-xs px-6"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                  Saving Settings...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 mr-2" />
                  Save Preferences
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>

      {/* Section 4: Session Security & Termination */}
      <Card className="border-destructive/20 shadow-xs bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-destructive flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Active Session Security
          </CardTitle>
          <CardDescription className="text-xs">
            Sign out of your active session on this device or terminate stored tokens.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="font-semibold text-xs text-foreground">
              Current Session: {user?.email}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Signed in with institutional JWT Bearer credentials.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={logout}
            className="text-xs font-semibold shrink-0"
          >
            <LogOut className="h-3.5 w-3.5 mr-1.5" />
            Sign Out of Nexora
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
