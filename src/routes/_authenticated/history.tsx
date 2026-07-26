import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "History — Gymigo" },
      { name: "description", content: "Every workout you've logged." },
      { property: "og:title", content: "History — Gymigo" },
      { property: "og:description", content: "Your complete workout log." },
    ],
  }),
  component: History,
});

function History() {
  const { data } = useQuery({
    queryKey: ["history"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data } = await supabase
        .from("workouts")
        .select("id, name, started_at, finished_at, total_volume, duration_seconds")
        .eq("user_id", u.user.id)
        .not("finished_at", "is", null)
        .order("started_at", { ascending: false })
        .limit(100);
      return data ?? [];
    },
  });

  const byMonth: Record<string, any[]> = {};
  (data ?? []).forEach((w: any) => {
    const key = new Date(w.started_at).toLocaleDateString(undefined, { month: "long", year: "numeric" });
    (byMonth[key] ??= []).push(w);
  });

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-extrabold mb-6">Workout History</h1>
      {Object.entries(byMonth).length === 0 && <p className="text-sm text-muted-foreground">No workouts yet.</p>}
      {Object.entries(byMonth).map(([month, list]) => (
        <section key={month} className="mb-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{month}</p>
          <div className="grid gap-2">
            {list.map((w) => (
              <Link key={w.id} to="/workout/$id" params={{ id: w.id }} className="p-4 rounded-xl border border-border bg-gradient-card hover:border-primary transition-colors flex items-center justify-between">
                <div>
                  <p className="font-semibold">{w.name ?? "Workout"}</p>
                  <p className="text-xs text-muted-foreground">{new Date(w.started_at).toLocaleDateString()} · {Math.round((w.duration_seconds ?? 0) / 60)}m</p>
                </div>
                <span className="text-sm font-medium">{Math.round(Number(w.total_volume ?? 0))} kg</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
