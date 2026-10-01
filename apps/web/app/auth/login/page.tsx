"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Building2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldAlert,
  Sparkles,
  UserCheck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth, DEMO_ACCOUNTS } from "@/lib/auth-context"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get("redirect") || "/app"

  const { login } = useAuth()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
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
      const stored = localStorage.getItem("nexora_user")
      let target = redirectUrl
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          if ((parsed.role === "ADMIN" || parsed.role === "SUPER_ADMIN") && (redirectUrl === "/app" || redirectUrl === "/")) {
            target = "/admin/dashboard"
          }
        } catch {}
      }
      router.push(target)
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

  const fillSuperAdmin = () => {
    const acc = DEMO_ACCOUNTS.SUPER_ADMIN
    if (!acc) return
    setEmail(acc.email)
    setPassword("super123")
    setIsPendingApproval(false)
    setError(null)
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

      {/* Demo Super Admin Access Banner */}
      <div className="p-3 rounded-xl border border-primary/25 bg-primary/5 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <ShieldAlert className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-foreground">Demo Super Admin</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-primary/15 text-primary border border-primary/25">ROOT</span>
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              superadmin@nexora.edu • Grid Controller
            </p>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={fillSuperAdmin}
          className="h-7 px-2.5 text-xs font-medium border-primary/30 text-primary hover:bg-primary/10 shrink-0 gap-1"
        >
          <Sparkles className="size-3" />
          <span>Prefill Demo</span>
        </Button>
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
