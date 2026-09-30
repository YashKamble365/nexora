"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, Mail, ShieldAlert } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.includes("@")) {
      setError("Please enter a valid email address")
      return
    }

    setLoading(true)
    await new Promise((r) => setTimeout(r, 500))
    setLoading(false)
    setSubmitted(true)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center sm:text-left">
        <h2 className="text-2xl font-bold tracking-tight">Reset password</h2>
        <p className="text-xs text-muted-foreground">
          Enter your registered institutional email to receive a password recovery link.
        </p>
      </div>

      {submitted ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 dark:bg-emerald-950/30 p-4 space-y-3">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-xs">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Recovery email dispatched
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            If an institutional account matching <span className="font-semibold text-foreground">{email}</span> exists, you will receive password reset instructions within 2 minutes.
          </p>
          <div className="pt-2">
            <Link
              href="/auth/login"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full text-xs")}
            >
              Return to Sign In
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Institutional Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@prpcem.edu"
                className="pl-9 text-xs h-9"
                required
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full h-9 text-xs font-semibold">
            {loading ? "Sending link..." : "Send Recovery Instructions"}
          </Button>
        </form>
      )}

      <div className="pt-2 text-center text-xs text-muted-foreground border-t border-border">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="h-3 w-3" /> Back to sign in
        </Link>
      </div>
    </div>
  )
}
