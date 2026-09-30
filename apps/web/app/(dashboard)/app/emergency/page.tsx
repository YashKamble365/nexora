"use client"

import * as React from "react"
import {
  AlertTriangle,
  Flame,
  PhoneCall,
  MapPin,
  CheckCircle2,
  Clock,
  Radio,
  FileText,
  LifeBuoy,
  XCircle,
  Users,
  Compass,
  AlertOctagon,
  Megaphone,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api"
import { useSocket } from "@/lib/use-socket"
import { EmergencyAlertDTO } from "@nexora/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"


export default function EmergencyPage() {
  const { user } = useAuth()
  const { socket } = useSocket()

  const [activeAlert, setActiveAlert] = React.useState<EmergencyAlertDTO | null>(null)
  const [history, setHistory] = React.useState<EmergencyAlertDTO[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  // Declare Alert Modal
  const [broadcastOpen, setBroadcastOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [severity, setSeverity] = React.useState<'WARNING' | 'CRITICAL' | 'EVACUATION'>('WARNING')
  const [title, setTitle] = React.useState('')
  const [message, setMessage] = React.useState('')
  const [affectedAreasInput, setAffectedAreasInput] = React.useState('')
  const [actionRequired, setActionRequired] = React.useState('')
  const [durationHours, setDurationHours] = React.useState('4')
  const [confirmationCode, setConfirmationCode] = React.useState('')
  const [broadcastError, setBroadcastError] = React.useState('')

  // Resolve Alert Modal
  const [resolveOpen, setResolveOpen] = React.useState(false)
  const [resolutionNote, setResolutionNote] = React.useState('')
  const [isResolving, setIsResolving] = React.useState(false)

  const canBroadcast = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'FACULTY'

  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const [activeRes, histRes] = await Promise.all([
        apiClient.get<any>('/emergency/active'),
        apiClient.get<any>('/emergency/history'),
      ])
      const activeList = Array.isArray(activeRes) ? activeRes : (activeRes?.data || [])
      setActiveAlert(activeList.length > 0 ? activeList[0] : null)
      const histList = Array.isArray(histRes) ? histRes : (histRes?.data || [])
      setHistory(histList)
    } catch (err) {
      console.warn('Failed to load emergency data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  // Socket updates
  React.useEffect(() => {
    if (!socket) return

    const handleBroadcast = (newAlert: EmergencyAlertDTO) => {
      setActiveAlert(newAlert)
      setHistory((prev) => [newAlert, ...prev.filter((a) => a.id !== newAlert.id)])
    }

    const handleDeactivated = () => {
      fetchData()
    }

    socket.on('emergency_alert_broadcast', handleBroadcast)
    socket.on('emergency_alert_deactivated', handleDeactivated)

    return () => {
      socket.off('emergency_alert_broadcast', handleBroadcast)
      socket.off('emergency_alert_deactivated', handleDeactivated)
    }
  }, [socket, fetchData])

  const handleCreateBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()
    setBroadcastError('')

    if (confirmationCode.trim() !== 'CONFIRM_BROADCAST') {
      setBroadcastError('Type CONFIRM_BROADCAST exactly to authorize campus-wide transmission.')
      return
    }

    const areas = affectedAreasInput
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean)

    if (areas.length === 0) {
      setBroadcastError('Specify at least one affected zone or building.')
      return
    }

    setIsSubmitting(true)
    try {
      await apiClient.post('/emergency', {
        title,
        message,
        severity,
        affectedAreas: areas,
        actionRequired,
        confirmationCode: confirmationCode.trim(),
        expiresHours: Number(durationHours) || 4,
      })

      setBroadcastOpen(false)
      setTitle('')
      setMessage('')
      setAffectedAreasInput('')
      setActionRequired('')
      setConfirmationCode('')
      fetchData()
    } catch (err: any) {
      setBroadcastError(err.message || 'Failed to broadcast emergency alert')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResolveAlert = async () => {
    if (!activeAlert) return
    setIsResolving(true)
    try {
      await apiClient.patch(`/emergency/${activeAlert.id}/deactivate`, {
        resolutionNote: resolutionNote.trim() || 'Situation contained. All clear verified.',
      })
      setResolveOpen(false)
      setResolutionNote('')
      fetchData()
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate alert')
    } finally {
      setIsResolving(false)
    }
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Emergency Response Grid
            </h1>
            <Badge variant="outline" className="text-xs bg-red-500/10 text-red-600 border-red-500/30">
              High Priority Grid
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time incident response broadcasts, evacuation schematics, and critical safety hotlines.
          </p>
        </div>

        {canBroadcast && (
          <Button
            variant="destructive"
            onClick={() => setBroadcastOpen(true)}
            className="flex items-center gap-2 shadow-md hover:shadow-lg font-semibold"
          >
            <Megaphone className="h-4 w-4" />
            Declare Campus Alert
          </Button>
        )}
      </div>

      {/* Active Incident Warning or All Clear */}
      {isLoading ? (
        <Card className="animate-pulse h-32 border-muted" />
      ) : activeAlert ? (
        <Card className={`border-2 ${
          activeAlert.severity === 'EVACUATION'
            ? 'border-red-600 bg-red-500/10 dark:bg-red-950/40'
            : activeAlert.severity === 'CRITICAL'
            ? 'border-red-500 bg-red-500/5 dark:bg-red-950/20'
            : 'border-amber-500 bg-amber-500/10 dark:bg-amber-950/30'
        }`}>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <Badge
                  className={
                    activeAlert.severity === 'EVACUATION'
                      ? 'bg-red-600 text-white font-bold'
                      : activeAlert.severity === 'CRITICAL'
                      ? 'bg-red-700 text-white font-bold'
                      : 'bg-amber-600 text-white font-bold'
                  }
                >
                  ACTIVE {activeAlert.severity} DIRECTIVE
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Issued {new Date(activeAlert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {canBroadcast && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setResolveOpen(true)}
                  className="bg-background text-emerald-600 border-emerald-500/40 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Issue All-Clear & Deactivate
                </Button>
              )}
            </div>
            <CardTitle className="text-xl sm:text-2xl text-destructive font-black tracking-tight mt-2">
              {activeAlert.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm sm:text-base leading-relaxed text-foreground font-medium">
              {activeAlert.message}
            </p>

            <div className="bg-background/80 rounded-lg p-4 border space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-destructive flex items-center gap-1.5">
                <AlertOctagon className="h-4 w-4" />
                Mandatory Action Directive
              </div>
              <p className="text-sm font-semibold text-foreground">
                {activeAlert.actionRequired}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Affected Zones:</span>
              {activeAlert.affectedAreas.map((area, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs font-medium">
                  <MapPin className="h-3 w-3 mr-1 text-destructive" />
                  {area}
                </Badge>
              ))}
            </div>

            <div className="text-xs text-muted-foreground pt-1 border-t flex items-center justify-between">
              <span>Authority: {activeAlert.issuedBy.name} ({activeAlert.issuedBy.role})</span>
              <span>Expires at: {new Date(activeAlert.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20">
          <CardContent className="py-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                Normal Campus Operating Conditions
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                No active threats or emergencies reported across college premises. All blocks, laboratories, and grounds are operating normally.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campus Evacuation Assembly Zones */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary" />
            Designated Safe Assembly Points
          </h2>
          <p className="text-xs text-muted-foreground">
            In the event of an evacuation alarm, proceed immediately along designated green exit corridors to these zones.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs font-semibold bg-primary/10 text-primary border-primary/30">
                  Zone Alpha
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" /> Cap: 3,500
                </span>
              </div>
              <CardTitle className="text-base font-bold mt-1">
                Main Sports Complex Lawn
              </CardTitle>
              <CardDescription className="text-xs">
                Primary outdoor clearing zone
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs space-y-2 text-muted-foreground">
              <p>
                Serves: Main Administrative Building, IT Block, Central Library, and Cafeteria.
              </p>
              <div className="rounded bg-muted p-2 text-[11px] font-medium text-foreground">
                First Aid Tent #1 & Emergency Command Post deployed here.
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs font-semibold bg-primary/10 text-primary border-primary/30">
                  Zone Beta
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" /> Cap: 1,500
                </span>
              </div>
              <CardTitle className="text-base font-bold mt-1">
                North Ground & Open Amphitheater
              </CardTitle>
              <CardDescription className="text-xs">
                Engineering lab clearing area
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs space-y-2 text-muted-foreground">
              <p>
                Serves: Mechanical Workshop Block, Civil Engineering Labs, and Heavy Machinery Sheds.
              </p>
              <div className="rounded bg-muted p-2 text-[11px] font-medium text-foreground">
                Dedicated wide gate access for municipal fire trucks and water tenders.
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs font-semibold bg-primary/10 text-primary border-primary/30">
                  Zone Gamma
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" /> Cap: 1,200
                </span>
              </div>
              <CardTitle className="text-base font-bold mt-1">
                Elevated West Deck (High Ground)
              </CardTitle>
              <CardDescription className="text-xs">
                Monsoon flood mitigation sanctuary
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs space-y-2 text-muted-foreground">
              <p>
                Serves: Lower basement parking, ground-level labs, and canteen annex.
              </p>
              <div className="rounded bg-muted p-2 text-[11px] font-medium text-foreground">
                Elevated concrete plateau above 100-year municipal flood line with generator backup.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Emergency Protocols & Safety Directory Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Standard Operating Procedures (SOPs) */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Standard Safety Protocols (SOPs)
            </h2>
            <p className="text-xs text-muted-foreground">
              Immediate action guides for students, faculty, and campus staff during critical occurrences.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-red-500">
                  <Flame className="h-4 w-4" />
                  Fire & Smoke (R.A.C.E.)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1.5 text-muted-foreground">
                <p><strong className="text-foreground">R</strong>escue anyone in immediate danger.</p>
                <p><strong className="text-foreground">A</strong>larm: Pull nearest red wall pull-station.</p>
                <p><strong className="text-foreground">C</strong>ontain: Close doors behind you to retard fire spread.</p>
                <p><strong className="text-foreground">E</strong>vacuate: Use stairs only, never use elevators.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-blue-500">
                  <LifeBuoy className="h-4 w-4" />
                  Medical Emergency
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1.5 text-muted-foreground">
                <p>1. Do not move casualty unless there is impending hazard.</p>
                <p>2. Call Health Center (+91-721-2580371) immediately.</p>
                <p>3. Send a runner to corridor to guide first-aid team.</p>
                <p>4. Keep casualty warm, calm, and crowds cleared.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-500">
                  <AlertTriangle className="h-4 w-4" />
                  Earthquake / Tremors
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1.5 text-muted-foreground">
                <p><strong className="text-foreground">DROP</strong> to your hands and knees.</p>
                <p><strong className="text-foreground">COVER</strong> your head and neck under sturdy desk.</p>
                <p><strong className="text-foreground">HOLD ON</strong> until shaking ceases completely.</p>
                <p>Stay away from glass windows and light fixtures.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-purple-500">
                  <Radio className="h-4 w-4" />
                  Campus Lockdown / Active Threat
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1.5 text-muted-foreground">
                <p>1. Lock and barricade classroom or lab doors.</p>
                <p>2. Turn off lights, silence all smartphones.</p>
                <p>3. Stay out of sight behind structural masonry walls.</p>
                <p>4. Do not open doors until official police all-clear.</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Emergency Hotlines Directory */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <PhoneCall className="h-5 w-5 text-destructive" />
              Emergency Hotlines
            </h2>
            <p className="text-xs text-muted-foreground">
              Direct dial lines available 24/7.
            </p>
          </div>

          <Card className="border-destructive/30">
            <CardContent className="p-4 space-y-3.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b">
                <div>
                  <div className="font-bold text-foreground">Campus Security Chief</div>
                  <div className="text-[11px] text-muted-foreground">Main Gate Station (24/7)</div>
                </div>
                <a href="tel:07212580371" className="font-mono font-bold text-primary hover:underline">
                  0721-2580371
                </a>
              </div>

              <div className="flex items-center justify-between pb-2 border-b">
                <div>
                  <div className="font-bold text-foreground">Health Center & Ambulance</div>
                  <div className="text-[11px] text-muted-foreground">Dr. A. K. Joshi (Room G-04)</div>
                </div>
                <a href="tel:9881023456" className="font-mono font-bold text-primary hover:underline">
                  +91-9881023456
                </a>
              </div>

              <div className="flex items-center justify-between pb-2 border-b">
                <div>
                  <div className="font-bold text-foreground">City Fire Station</div>
                  <div className="text-[11px] text-muted-foreground">Amravati MIDC Fire Brigade</div>
                </div>
                <a href="tel:101" className="font-mono font-bold text-destructive hover:underline">
                  101 / 0721-2551020
                </a>
              </div>

              <div className="flex items-center justify-between pb-2 border-b">
                <div>
                  <div className="font-bold text-foreground">Police Emergency</div>
                  <div className="text-[11px] text-muted-foreground">Gadge Nagar Police Station</div>
                </div>
                <a href="tel:112" className="font-mono font-bold text-destructive hover:underline">
                  112 / 0721-2562222
                </a>
              </div>

              <div className="flex items-center justify-between pb-2 border-b">
                <div>
                  <div className="font-bold text-foreground">Anti-Ragging Helpline</div>
                  <div className="text-[11px] text-muted-foreground">National UGC Toll-Free</div>
                </div>
                <a href="tel:18001805522" className="font-mono font-bold text-foreground hover:underline">
                  1800-180-5522
                </a>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-foreground">Women Helpline / ICC</div>
                  <div className="text-[11px] text-muted-foreground">Internal Complaints Committee</div>
                </div>
                <a href="tel:07212580379" className="font-mono font-bold text-foreground hover:underline">
                  0721-2580379
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Historical Incident Log */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Historical Incident & Resolution Archive
          </h2>
          <p className="text-xs text-muted-foreground">
            Audited history of resolved incidents, deactivation stamps, and post-emergency notes.
          </p>
        </div>

        {history.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-xs text-muted-foreground">
              No previous incidents recorded on the institutional ledger.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {history.map((alert) => (
              <Card key={alert.id} className="hover:border-muted-foreground/30 transition-colors">
                <CardContent className="p-4 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs font-semibold">
                        {alert.severity}
                      </Badge>
                      <span className="font-bold text-sm">{alert.title}</span>
                      {alert.isActive ? (
                        <Badge className="bg-red-500 text-xs">ACTIVE</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs text-emerald-600 bg-emerald-500/10">
                          RESOLVED
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {new Date(alert.createdAt).toLocaleDateString()} at{' '}
                      {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground">{alert.message}</p>

                  {alert.resolutionNote && (
                    <div className="rounded bg-muted/60 p-2.5 text-xs text-foreground mt-2 border-l-2 border-emerald-500">
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">Resolution Note: </span>
                      {alert.resolutionNote}
                      {alert.resolvedBy && (
                        <span className="text-muted-foreground ml-2">
                          — Verified by {alert.resolvedBy.name}
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Broadcast Alert Modal (Admins Only) */}
      <Dialog open={broadcastOpen} onOpenChange={setBroadcastOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Declare Campus Emergency Broadcast
            </DialogTitle>
            <DialogDescription className="text-xs">
              This action transmits high-priority sirens and push alerts to all enrolled students, faculty, and administrative staff connected to the campus grid.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateBroadcast} className="space-y-4 pt-2">
            {broadcastError && (
              <div className="rounded bg-destructive/10 border border-destructive/30 p-2.5 text-xs text-destructive flex items-center gap-2 font-medium">
                <XCircle className="h-4 w-4 shrink-0" />
                <span>{broadcastError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="emergency-severity" className="text-xs font-semibold">Severity Level</label>
                <select
                  id="emergency-severity"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as 'WARNING' | 'CRITICAL' | 'EVACUATION')}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="WARNING">WARNING (Advisory)</option>
                  <option value="CRITICAL">CRITICAL (Action Required)</option>
                  <option value="EVACUATION">EVACUATION (Immediate)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="emergency-duration" className="text-xs font-semibold">Auto-Expire Duration</label>
                <select
                  id="emergency-duration"
                  value={durationHours}
                  onChange={(e) => setDurationHours(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="1">1 Hour</option>
                  <option value="2">2 Hours</option>
                  <option value="4">4 Hours (Recommended)</option>
                  <option value="8">8 Hours</option>
                  <option value="24">24 Hours</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="emergency-title" className="text-xs font-semibold">Emergency Incident Headline *</label>
              <Input
                id="emergency-title"
                required
                placeholder="e.g. Flash Flooding in North Workshop & Lower Parking"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="emergency-affected" className="text-xs font-semibold">Affected Zones / Buildings (Comma-separated) *</label>
              <Input
                id="emergency-affected"
                required
                placeholder="e.g. Mechanical Workshop, Basement Parking, Civil Annex"
                value={affectedAreasInput}
                onChange={(e) => setAffectedAreasInput(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="emergency-action" className="text-xs font-semibold">Mandatory Action Directive *</label>
              <Input
                id="emergency-action"
                required
                placeholder="e.g. Evacuate basement immediately. Assemble at Zone Gamma."
                value={actionRequired}
                onChange={(e) => setActionRequired(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="emergency-message" className="text-xs font-semibold">Incident Details & Instructions *</label>
              <Textarea
                id="emergency-message"
                required
                rows={3}
                placeholder="Provide precise details, hazard location, and clear safety precautions..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="text-xs resize-none"
              />
            </div>

            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 space-y-2">
              <label htmlFor="emergency-confirm-code" className="text-xs font-bold text-destructive uppercase tracking-wider block">
                Type CONFIRM_BROADCAST to Authorize
              </label>
              <Input
                id="emergency-confirm-code"
                required
                placeholder="CONFIRM_BROADCAST"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                className="h-9 text-xs font-mono bg-background"
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBroadcastOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                disabled={isSubmitting || confirmationCode.trim() !== 'CONFIRM_BROADCAST'}
                className="font-bold"
              >
                {isSubmitting ? 'Transmitting Siren...' : 'Authorize Broadcast'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Resolve Incident Modal */}
      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
              Issue All-Clear & Deactivate Alert
            </DialogTitle>
            <DialogDescription className="text-xs">
              This will stand down the emergency state and notify the campus grid that normal operations have resumed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <label htmlFor="emergency-resolve-note" className="text-xs font-semibold">Resolution Summary & Safety Audit Note</label>
              <Textarea
                id="emergency-resolve-note"
                rows={3}
                placeholder="e.g. Fire extinguished. Building inspected by Chief Safety Officer and cleared for re-entry."
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                className="text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setResolveOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleResolveAlert}
              disabled={isResolving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              {isResolving ? 'Deactivating...' : 'Confirm All-Clear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
