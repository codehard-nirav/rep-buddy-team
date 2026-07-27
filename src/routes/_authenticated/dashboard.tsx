import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Trophy, TrendingUp, Calendar as CalendarIcon, Plus } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useUnits } from "@/lib/use-units";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Gymigo" },
      { name: "description", content: "Your workout dashboard: streak, PRs, and today's plan." },
      { property: "og:title", content: "Dashboard — Gymigo" },
      { property: "og:description", content: "Your training at a glance." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const nav = useNavigate();
  const units = useUnits();
  const { data: profile } = useQuery({
    queryKey: ["profile-me"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (profile && profile.onboarded === false) nav({ to: "/onboarding", replace: true });
  }, [profile, nav]);

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const [{ count: total }, { count: weekCount }, { data: recent }, { data: streakRows }] = await Promise.all([
        supabase.from("workouts").select("id", { count: "exact", head: true }).eq("user_id", u.user.id).not("finished_at", "is", null),
        supabase.from("workouts").select("id", { count: "exact", head: true }).eq("user_id", u.user.id).not("finished_at", "is", null).gte("started_at", weekAgo),
        supabase.from("workouts").select("id, name, started_at, finished_at, total_volume").eq("user_id", u.user.id).not("finished_at", "is", null).order("started_at", { ascending: false }).limit(5),
        supabase.from("workouts").select("started_at").eq("user_id", u.user.id).not("finished_at", "is", null).order("started_at", { ascending: false }).limit(60),
      ]);
      const streak = calcStreak((streakRows ?? []).map((w) => new Date(w.started_at)));
      return { total: total ?? 0, streak, week: weekCount ?? 0, recent: recent ?? [] };
    },
  });

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-muted-foreground text-sm">Welcome back{profile?.display_name ? "," : ""}</p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            {profile?.display_name ?? "Athlete"}
          </h1>
        </div>
        <Link
          to="/workout/new"
          className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-primary text-primary-foreground font-semibold shadow-glow"
        >
          <Plus className="w-4 h-4" /> Start workout
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatCard icon={Flame} label="Streak" value={`${stats?.streak ?? 0}d`} tint="text-accent" />
        <StatCard icon={CalendarIcon} label="This week" value={String(stats?.week ?? 0)} tint="text-primary" />
        <StatCard icon={Trophy} label="Total workouts" value={String(stats?.total ?? 0)} tint="text-warning" />
        <StatCard icon={TrendingUp} label="Goal" value={(profile?.goal ?? "—").toString().replace("_", " ")} tint="text-primary" />
      </div>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="bg-gradient-card border border-border rounded-2xl p-6 shadow-card">
          <h2 className="font-bold text-lg mb-4">Recent workouts</h2>
          {stats?.recent.length ? (
            <ul className="space-y-2">
              {stats.recent.map((w) => (
                <li key={w.id}>
                  <Link
                    to="/workout/$id"
                    params={{ id: w.id }}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{w.name ?? "Workout"}</p>
                      <p className="text-xs text-muted-foreground">{new Date(w.started_at).toLocaleDateString()}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">{Math.round(Number(w.total_volume ?? 0))} kg vol</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No workouts yet. Hit <Link to="/workout/new" className="text-primary underline">Start workout</Link> to begin.
            </p>
          )}
        </div>
        <div className="bg-gradient-card border border-border rounded-2xl p-6 shadow-card">
          <h2 className="font-bold text-lg mb-4">Quick actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <QuickLink to="/exercises" label="Browse exercises" />
            <QuickLink to="/routines" label="Manage routines" />
            <QuickLink to="/progress" label="View progress" />
            <QuickLink to="/feed" label="Community feed" />
          </div>
        </div>
      </section>
    </div>
  );
}

function QuickLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="p-4 rounded-lg bg-secondary/60 hover:bg-secondary text-sm font-medium border border-border">
      {label}
    </Link>
  );
}

function StatCard({ icon: Icon, label, value, tint }: any) {
  return (
    <div className="bg-gradient-card border border-border rounded-xl p-4 shadow-card">
      <Icon className={`w-5 h-5 mb-2 ${tint}`} />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function calcStreak(dates: Date[]): number {
  if (!dates.length) return 0;
  const days = new Set(dates.map((d) => d.toISOString().slice(0, 10)));
  let streak = 0;
  const cur = new Date();
  while (days.has(cur.toISOString().slice(0, 10))) {
    streak++;
    cur.setDate(cur.getDate() - 1);
  }
  return streak;
}
