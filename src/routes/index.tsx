import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Zap, Users, BarChart3, ArrowRight, Dumbbell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import gymigoLogoAsset from "@/assets/gymigo-logo.png.asset.json";
import gymigoSplashAsset from "@/assets/gymigo-splash.png.asset.json";


const gymigoLogo = gymigoLogoAsset.url;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gymigo — Free Gym Workout Tracker & Coaching App" },
      {
        name: "description",
        content:
          "Log sets in seconds, auto-detect PRs, follow multi-week programs, and coach clients. Gymigo is the distraction-free gym workout tracker — free in beta.",
      },
      { property: "og:title", content: "Gymigo — Free Gym Workout Tracker & Coaching App" },
      {
        property: "og:description",
        content:
          "Fast in-gym set logging, a 60+ movement exercise library, PR and volume charts, plus coach-client programs.",
      },
      { property: "og:url", content: "https://gymigo.fit/" },
      { property: "og:type", content: "website" },
      {
        property: "og:image",
        content: `https://gymigo.fit${gymigoSplashAsset.url}`,
      },
      {
        name: "twitter:image",
        content: `https://gymigo.fit${gymigoSplashAsset.url}`,
      },

    ],
    links: [{ rel: "canonical", href: "https://gymigo.fit/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Gymigo",
          url: "https://gymigo.fit/",
          applicationCategory: "HealthApplication",
          operatingSystem: "Web",
          description:
            "Gym workout tracker with fast set logging, PR detection, programs, and coach-client tools.",
        }),
      },
    ],
  }),
  component: Landing,
});


function Landing() {
  const nav = useNavigate();
  const router = useRouter();
  const [handlingCallback] = useState(() =>
    typeof window !== "undefined" && window.location.hash.includes("access_token="),
  );
  useEffect(() => {
    let cancelled = false;

    const go = async () => {
      if (cancelled) return;
      await router.invalidate();
      if (!cancelled) nav({ to: "/dashboard", replace: true });
    };

    // Google OAuth full-page redirect returns here with tokens in the URL hash.
    const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
    const params = new URLSearchParams(hash);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (access_token && refresh_token) {
      supabase.auth
        .setSession({ access_token, refresh_token })
        .then(({ error }) => {
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
          if (!error) void go();
        })
        .catch(() => {});
    } else {
      supabase.auth.getSession().then(({ data }) => {
        if (!cancelled && data.session) void go();
      });
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) void go();
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [nav, router]);

  if (handlingCallback) {
    return (
      <div className="min-h-screen bg-gradient-hero grid place-items-center px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
            <Dumbbell className="w-6 h-6 text-primary-foreground" />
          </div>
          <div role="status" aria-label="Signing you in" className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Signing you in…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="max-w-6xl mx-auto flex items-center justify-between p-6">
        <div className="flex items-center gap-2">
          <img src={gymigoLogo} alt="Gymigo logo" width={36} height={36} className="w-9 h-9 rounded-lg shadow-glow" />
          <span className="font-display font-extrabold text-2xl tracking-tight">Gymigo</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/auth" className="px-4 py-2 text-sm rounded-md hover:bg-secondary/60 transition-colors">
            Sign in
          </Link>
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="px-4 py-2 text-sm font-semibold rounded-md bg-gradient-primary text-primary-foreground shadow-glow"
          >
            Get started
          </Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-16 pb-24 text-center">
        <p className="uppercase tracking-[0.25em] text-xs text-primary font-semibold mb-4">
          Workout tracker · Coaching · Community
        </p>
        <h1 className="text-5xl md:text-7xl font-extrabold font-display tracking-tighter leading-[1.05] max-w-4xl mx-auto">
          Think less. <span className="text-gradient-primary">Lift more.</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          A fast, distraction-free logger for the gym floor — backed by a rich exercise library,
          visual progress tracking, and a coaching layer that keeps you accountable.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-primary text-primary-foreground font-semibold shadow-glow hover:scale-105 transition-transform"
          >
            Start training free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border font-semibold hover:bg-secondary/60"
          >
            I have an account
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-4">
        {[
          {
            icon: Zap,
            title: "Log in seconds",
            body: "Big tap targets, previous-set autofill, and a rest timer that doesn't nag.",
          },
          {
            icon: BarChart3,
            title: "See real progress",
            body: "Auto-detected PRs, volume charts, estimated 1RM, streaks and body stats.",
          },
          {
            icon: Users,
            title: "Coach or be coached",
            body: "Build programs, assign to clients, and check in on their training.",
          },
        ].map((f) => (
          <div key={f.title} className="bg-gradient-card p-6 rounded-2xl border border-border shadow-card">
            <div className="w-10 h-10 rounded-lg bg-primary/10 grid place-items-center mb-4">
              <f.icon className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-bold text-lg">{f.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{f.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
