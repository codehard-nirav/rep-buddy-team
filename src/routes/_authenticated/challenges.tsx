import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/challenges")({
  head: () => ({
    meta: [
      { title: "Challenges — Gymigo" },
      { name: "description", content: "Monthly training challenges and leaderboards." },
      { property: "og:title", content: "Challenges — Gymigo" },
      { property: "og:description", content: "Compete on volume and consistency." },
    ],
  }),
  component: Challenges,
});

function Challenges() {
  const { data } = useQuery({
    queryKey: ["leaderboard-monthly"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data: follows } = await supabase.from("follows").select("followed_id").eq("follower_id", u.user.id);
      const ids = [u.user.id, ...(follows ?? []).map((f: any) => f.followed_id)];
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const { data: workouts } = await supabase
        .from("workouts")
        .select("user_id, total_volume, profiles!workouts_user_id_fkey(display_name, avatar_url, username)")
        .in("user_id", ids)
        .not("finished_at", "is", null)
        .gte("started_at", monthStart.toISOString());
      const byUser: Record<string, { count: number; volume: number; profile: any }> = {};
      (workouts ?? []).forEach((w: any) => {
        const u = byUser[w.user_id] ??= { count: 0, volume: 0, profile: w.profiles };
        u.count += 1;
        u.volume += Number(w.total_volume ?? 0);
      });
      return Object.entries(byUser)
        .map(([id, v]) => ({ id, ...v }))
        .sort((a, b) => b.count - a.count);
    },
  });

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-extrabold mb-2">This Month</h1>
      <p className="text-muted-foreground mb-6">Most workouts among you and the people you follow.</p>

      <div className="bg-gradient-card border border-border rounded-2xl p-6 shadow-card">
        {data?.length ? (
          <ol className="space-y-2">
            {data.map((row, i) => (
              <li key={row.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40">
                <span className={`w-8 h-8 rounded-full grid place-items-center font-bold ${i === 0 ? "bg-gradient-primary text-primary-foreground" : "bg-muted"}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{row.profile?.display_name ?? "Athlete"}</p>
                  <p className="text-xs text-muted-foreground">{Math.round(row.volume)} kg volume</p>
                </div>
                <span className="font-bold flex items-center gap-1"><Trophy className="w-4 h-4 text-primary" /> {row.count}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">No workouts this month yet.</p>
        )}
      </div>
    </div>
  );
}

