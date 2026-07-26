import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, Trophy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/progress")({
  head: () => ({
    meta: [
      { title: "Progress — Gymigo" },
      { name: "description", content: "Track PRs, estimated 1RM, and training volume." },
      { property: "og:title", content: "Progress — Gymigo" },
      { property: "og:description", content: "Your training progress in charts." },
    ],
  }),
  component: Progress,
});

function Progress() {
  const { data } = useQuery({
    queryKey: ["progress-data"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data: workouts } = await supabase
        .from("workouts")
        .select("id, started_at, total_volume")
        .eq("user_id", u.user.id)
        .not("finished_at", "is", null)
        .order("started_at");
      const { data: prs } = await supabase
        .from("workout_sets")
        .select("weight, reps, logged_at, exercises(name), workouts!inner(user_id)")
        .eq("workouts.user_id", u.user.id)
        .eq("is_pr", true)
        .order("logged_at", { ascending: false })
        .limit(10);
      return { workouts: workouts ?? [], prs: prs ?? [] };
    },
  });

  const chart = (data?.workouts ?? []).map((w) => ({
    date: new Date(w.started_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    volume: Math.round(Number(w.total_volume ?? 0)),
  }));

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-extrabold mb-6">Progress</h1>

      <div className="bg-gradient-card border border-border rounded-2xl p-6 shadow-card mb-4">
        <h2 className="font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Volume over time</h2>
        {chart.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.017 260)" />
              <XAxis dataKey="date" stroke="oklch(0.68 0.02 260)" fontSize={12} />
              <YAxis stroke="oklch(0.68 0.02 260)" fontSize={12} />
              <Tooltip contentStyle={{ background: "oklch(0.21 0.017 260)", border: "1px solid oklch(0.28 0.017 260)", borderRadius: 8 }} />
              <Line type="monotone" dataKey="volume" stroke="oklch(0.86 0.22 128)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground">Complete a workout to see your chart.</p>
        )}
      </div>

      <div className="bg-gradient-card border border-border rounded-2xl p-6 shadow-card">
        <h2 className="font-bold mb-4 flex items-center gap-2"><Trophy className="w-4 h-4 text-primary" /> Recent PRs</h2>
        {data?.prs.length ? (
          <ul className="divide-y divide-border">
            {data.prs.map((p: any, i: number) => {
              const est1rm = Math.round(Number(p.weight ?? 0) * (1 + Number(p.reps ?? 0) / 30));
              return (
                <li key={i} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{p.exercises?.name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(p.logged_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{p.weight} kg × {p.reps}</p>
                    <p className="text-xs text-muted-foreground">est. 1RM {est1rm} kg</p>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No PRs yet — go set one!</p>
        )}
      </div>
    </div>
  );
}
