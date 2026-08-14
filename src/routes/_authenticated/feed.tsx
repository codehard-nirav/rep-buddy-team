import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Heart, MessageCircle, Clock, Weight } from "lucide-react";
import { toast } from "sonner";
import { useUnits } from "@/lib/use-units";

export const Route = createFileRoute("/_authenticated/feed")({
  head: () => ({
    meta: [
      { title: "Feed — Gymigo" },
      { name: "description", content: "See what your friends are lifting." },
      { property: "og:title", content: "Feed — Gymigo" },
      { property: "og:description", content: "Community activity feed." },
    ],
  }),
  component: Feed,
});

function Feed() {
  const qc = useQueryClient();
  const units = useUnits();
  const { data } = useQuery({
    queryKey: ["feed"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return { workouts: [], likes: new Set<string>() };
      const { data: follows } = await supabase.from("follows").select("followed_id").eq("follower_id", u.user.id);
      const ids = [u.user.id, ...(follows ?? []).map((f: any) => f.followed_id)];
      const { data: workouts } = await supabase
        .from("workouts")
        .select("id, name, started_at, total_volume, duration_seconds, user_id, profiles!workouts_user_id_profiles_fkey(display_name, avatar_url, username)")
        .in("user_id", ids)
        .not("finished_at", "is", null)
        .order("started_at", { ascending: false })
        .limit(30);
      const { data: likes } = await supabase.from("workout_likes").select("workout_id").eq("user_id", u.user.id);
      return { workouts: workouts ?? [], likes: new Set((likes ?? []).map((l: any) => l.workout_id)) };
    },
  });

  async function toggleLike(workoutId: string, liked: boolean) {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    if (liked) {
      await supabase.from("workout_likes").delete().eq("workout_id", workoutId).eq("user_id", u.user.id);
    } else {
      const { error } = await supabase.from("workout_likes").insert({ workout_id: workoutId, user_id: u.user.id } as any);
      if (error) toast.error(error.message);
    }
    qc.invalidateQueries({ queryKey: ["feed"] });
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-extrabold mb-6">Feed</h1>
      <div className="space-y-3">
        {data?.workouts.map((w: any) => {
          const liked = data.likes.has(w.id);
          return (
            <article key={w.id} className="bg-gradient-card border border-border rounded-2xl p-5 shadow-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-muted overflow-hidden grid place-items-center">
                  {w.profiles?.avatar_url ? <img src={w.profiles.avatar_url} className="w-full h-full object-cover" alt="" /> : <span className="text-sm font-bold">{(w.profiles?.display_name ?? "?")[0]}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <Link to="/u/$username" params={{ username: w.profiles?.username ?? w.user_id }} className="font-semibold hover:text-primary">
                    {w.profiles?.display_name ?? "Athlete"}
                  </Link>
                  <p className="text-xs text-muted-foreground">{new Date(w.started_at).toLocaleString()}</p>
                </div>
              </div>
              <Link to="/workout/$id" params={{ id: w.id }} className="block">
                <p className="font-medium mb-2">{w.name ?? "Workout"}</p>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {Math.round((w.duration_seconds ?? 0) / 60)}m</span>
                  <span className="flex items-center gap-1"><Weight className="w-3 h-3" /> {Math.round(Number(w.total_volume ?? 0))} {units}</span>
                </div>
              </Link>
              <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                <button onClick={() => toggleLike(w.id, liked)} className={`flex items-center gap-1 text-sm ${liked ? "text-accent" : "text-muted-foreground"}`}>
                  <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} /> Like
                </button>
                <Link to="/workout/$id" params={{ id: w.id }} className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MessageCircle className="w-4 h-4" /> Comment
                </Link>
              </div>
            </article>
          );
        })}
        {data?.workouts.length === 0 && (
          <p className="text-sm text-muted-foreground">Nothing here yet. Finish a workout, or follow other athletes to fill your feed.</p>
        )}
      </div>
    </div>
  );
}
