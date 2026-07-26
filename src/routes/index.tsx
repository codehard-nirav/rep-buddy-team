import { createFileRoute, Link } from "@tanstack/react-router";
import { Dumbbell, Zap, Users, BarChart3, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gymigo — Think less, lift more" },
      {
        name: "description",
        content:
          "Fast gym workout tracking, a rich exercise library, and coach-client tools. Free while in beta.",
      },
      { property: "og:title", content: "Gymigo — Think less, lift more" },
      {
        property: "og:description",
        content: "Fast in-gym logging, exercise library, PRs, and community.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="max-w-6xl mx-auto flex items-center justify-between p-6">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
            <Dumbbell className="w-5 h-5 text-primary-foreground" />
          </div>
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
            <h3 className="font-bold text-lg">{f.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{f.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
