"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuth, DEMO_ACCOUNTS } from "@/lib/auth-context"

const PERSONA_CONFIGS = [
  {
    key: "STUDENT",
    label: "Student",
    sublabel: "Undergraduate",
    icon: GraduationCap,
    desc: "Notices, syllabus, grievance filing, campus polls",
  },
  {
    key: "COORDINATOR",
    label: "Coordinator",
    sublabel: "Class Faculty",
    icon: Users,
    desc: "Class notices, division subject notes, student approval",
  },
  {
    key: "HOD",
    label: "Dept HoD",
    sublabel: "Academic Chair",
    icon: Building2,
    desc: "Curricula catalog, faculty assignments, department SLA",
  },
  {
    key: "ADMIN",
    label: "Campus Admin",
    sublabel: "Dean / Registrar",
    icon: ShieldCheck,
    desc: "Institutional settings, safety alerts, audit records",
  },
  {
    key: "SUPER_ADMIN",
    label: "Super Admin",
    sublabel: "Grid Controller",
    icon: ShieldAlert,
    desc: "Multi-campus verification, global policy oversight",
  },
]

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get("redirect") || "/app"

  const { login } = useAuth()
  const [selectedPersona, setSelectedPersona] = React.useState<string>("STUDENT")
  const [email, setEmail] = React.useState("prathamesh.patange@prpcem.edu")
  const [password, setPassword] = React.useState("student123")
  const [showPassword, setShowPassword] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [isPendingApproval, setIsPendingApproval] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsPendingApproval(false)
    setLoading(true)

    try {
      if (!email.includes("@")) {
        throw new Error("Please enter a valid institutional email address")
      }
      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters")
      }

      await login(email, password)
      router.push(redirectUrl)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
        if (err.message.toLowerCase().includes("pending approval")) {
          setIsPendingApproval(true)
        }
      } else {
        setError("Invalid credentials or server unavailable")
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePersonaSelect = (key: string) => {
    setSelectedPersona(key)
    const acc = DEMO_ACCOUNTS[key]
    if (!acc) return
    setEmail(acc.email)
    setIsPendingApproval(false)
    setError(null)

    if (key === "SUPER_ADMIN") setPassword("super123")
    else if (key === "ADMIN") setPassword("admin123")
    else if (key === "COORDINATOR" || key === "HOD") setPassword("faculty123")
    else setPassword("student123")
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center sm:text-left">
        <h2 className="text-2xl font-bold tracking-tight">Institutional Portal Access</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Sign in to your campus operating workspace using verified institutional credentials.
        </p>
      </div>

      {error && (
        <div
          className={`flex items-start gap-2.5 p-3.5 rounded-lg border text-xs ${
            isPendingApproval
              ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          }`}
        >
          {isPendingApproval ? (
            <UserCheck className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
          ) : (
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <span className="font-semibold block">
              {isPendingApproval ? "Registration Under Institutional Review" : "Authentication Failed"}
            </span>
            <p className="leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Structured Persona Selector Bar */}
      <div className="p-3 rounded-xl border border-border bg-card space-y-2.5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            Evaluation Personas
          </span>
          <span className="text-[10px] text-muted-foreground font-medium">Click role to prefill</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
          {PERSONA_CONFIGS.map((persona) => {
            const Icon = persona.icon
            const isSelected = selectedPersona === persona.key
            return (
              <button
                key={persona.key}
                type="button"
                onClick={() => handlePersonaSelect(persona.key)}
                className={`p-2 rounded-lg border text-left flex flex-col justify-between transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
                    : "border-border bg-muted/20 hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <Icon className={`h-3.5 w-3.5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                  {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                </div>
                <div>
                  <span className="text-[11px] font-bold block leading-tight text-foreground">
                    {persona.label}
                  </span>
                  <span className="text-[9px] text-muted-foreground block truncate">
                    {persona.sublabel}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        <p className="text-[11px] text-muted-foreground/90 border-t border-border/60 pt-2 px-0.5">
          {PERSONA_CONFIGS.find((p) => p.key === selectedPersona)?.desc}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Institutional Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. name@university.edu"
              className="pl-9 text-xs h-9"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground">
              Password
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-xs text-primary hover:underline font-medium"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="pl-9 pr-9 text-xs h-9"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full h-9 text-xs font-semibold shadow-sm">
          {loading ? "Authenticating Credentials..." : "Sign In to Portal"}
        </Button>
      </form>

      <div className="pt-2 text-center text-xs text-muted-foreground border-t border-border space-y-2">
        <div>
          New student or faculty member?{" "}
          <Link href="/auth/register" className="font-semibold text-primary hover:underline">
            Register your campus account
          </Link>
        </div>
        <div className="text-[11px] text-muted-foreground/80 flex items-center justify-center gap-1.5">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Need your institution on Nexora?</span>
          <Link href="/auth/register?tab=institute" className="font-semibold text-foreground hover:underline">
            Register college
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-8 text-center text-xs text-muted-foreground">
          Loading authentication gateway...
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  )
}
