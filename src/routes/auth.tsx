import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Dumbbell } from "lucide-react";
import { toast } from "sonner";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — Gymigo" },
      { name: "description", content: "Sign in or create your Gymigo account to start tracking your workouts." },
      { property: "og:title", content: "Sign in — Gymigo" },
      { property: "og:description", content: "Log in or create your Gymigo account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const search = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);


  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled && data.session) nav({ to: search.redirect ?? "/dashboard", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) nav({ to: search.redirect ?? "/dashboard", replace: true });
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [nav, search.redirect]);

  async function handleResend() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      toast.success("Confirmation email sent. Check your inbox (and spam).");
    } catch (err: any) {
      toast.error(err.message ?? "Could not resend the email");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setNeedsConfirm(false);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Account created!");
          nav({ to: "/onboarding", replace: true });
        } else {
          toast.success("Check your email to confirm your account, then sign in.");
          setNeedsConfirm(true);
          setMode("signin");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav({ to: search.redirect ?? "/dashboard", replace: true });
      }
    } catch (err: any) {
      const code = err?.code ?? "";
      const raw = String(err?.message ?? "");
      if (code === "email_not_confirmed" || /not confirmed/i.test(raw)) {
        setNeedsConfirm(true);
        toast.error("Your email isn't confirmed yet. Resend the confirmation link below.");
      } else if (code === "invalid_credentials") {
        setNeedsConfirm(true);
        toast.error(
          "We couldn't sign you in. If you signed up with Google, use “Continue with Google”. If you signed up with email, confirm your email first — you can resend the link below.",
        );
      } else {
        toast.error(raw || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  }


  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(result.error.message ?? "Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    nav({ to: search.redirect ?? "/dashboard", replace: true });
  }

  return (
    <div className="min-h-screen bg-gradient-hero grid place-items-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
            <div className="w-11 h-11 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
              <Dumbbell className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-display font-extrabold text-3xl tracking-tight">Gymigo</span>
          </div>
          <h1 className="mt-6 text-2xl font-bold">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {mode === "signup" ? "Start tracking in under a minute." : "Sign in to keep the streak alive."}
          </p>
        </div>

        <div className="bg-gradient-card border border-border rounded-2xl p-6 shadow-card space-y-4">
          <button
            onClick={handleGoogle}
            className="w-full h-11 rounded-md border border-border bg-secondary/60 hover:bg-secondary font-medium flex items-center justify-center gap-2"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            or
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <input
                required
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-11 px-3 rounded-md bg-background border border-input focus:border-primary focus:outline-none"
              />
            )}
            <input
              required
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 px-3 rounded-md bg-background border border-input focus:border-primary focus:outline-none"
            />
            <input
              required
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              className="w-full h-11 px-3 rounded-md bg-background border border-input focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-md bg-gradient-primary text-primary-foreground font-semibold shadow-glow disabled:opacity-60"
            >
              {loading ? "…" : mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {mode === "signup" ? (
              <>
                Already have an account?{" "}
                <button className="text-primary font-semibold" onClick={() => setMode("signin")}>
                  Sign in
                </button>
              </>
            ) : (
              <>
                New here?{" "}
                <button className="text-primary font-semibold" onClick={() => setMode("signup")}>
                  Create account
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285f4" d="M23.7 12.3c0-.9-.1-1.7-.2-2.5H12v4.9h6.6c-.3 1.5-1.2 2.7-2.5 3.6v3h4c2.4-2.2 3.6-5.4 3.6-9z" />
      <path fill="#34a853" d="M12 24c3.2 0 6-1.1 8-2.9l-4-3c-1.1.7-2.5 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.3v3.1C3.3 21.4 7.3 24 12 24z" />
      <path fill="#fbbc04" d="M5.4 14.4c-.2-.7-.3-1.4-.3-2.4s.1-1.7.3-2.4V6.5H1.3C.5 8.1 0 10 0 12s.5 3.9 1.3 5.5l4.1-3.1z" />
      <path fill="#ea4335" d="M12 4.8c1.7 0 3.3.6 4.5 1.7l3.4-3.4C17.9 1.2 15.2 0 12 0 7.3 0 3.3 2.6 1.3 6.5l4.1 3.1C6.3 6.9 8.9 4.8 12 4.8z" />
    </svg>
  );
}
