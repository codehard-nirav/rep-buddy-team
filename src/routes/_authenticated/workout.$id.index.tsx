import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Clock, Weight, ArrowLeft, MessageCircle, Heart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/workout/$id/")({
  component: WorkoutDetail,
});

function WorkoutDetail() {
  const { id } = Route.useParams();
  const { data: workout } = useQuery({
    queryKey: ["workout-full", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("workouts")
        .select("*, profiles!workouts_user_id_fkey(display_name, avatar_url), workout_sets(*, exercises(name))")
        .eq("id", id)
        .maybeSingle();
      return data;
    },
  });

  const { data: comments, refetch: refetchComments } = useQuery({
    queryKey: ["workout-comments", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("workout_comments")
        .select("*, profiles(display_name, avatar_url)")
        .eq("workout_id", id)
        .order("created_at");
      return data ?? [];
    },
  });

  const [comment, setComment] = useState("");

  async function postComment() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user || !comment.trim()) return;
    const { error } = await supabase.from("workout_comments").insert({
      workout_id: id,
      author_id: u.user.id,
      text: comment.trim(),
    } as any);
    if (error) return toast.error(error.message);
    setComment("");
    refetchComments();
  }

  if (!workout) return <div className="p-8">Loading…</div>;

  const grouped: Record<string, any[]> = {};
  (workout.workout_sets ?? []).forEach((s: any) => {
    const k = s.exercises?.name ?? "Exercise";
    (grouped[k] ??= []).push(s);
  });

  const prs = (workout.workout_sets ?? []).filter((s: any) => s.is_pr).length;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <Link to="/history" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="bg-gradient-card border border-border rounded-2xl p-6 shadow-card mb-4">
        <h1 className="text-2xl font-extrabold">{workout.name ?? "Workout"}</h1>
        <p className="text-sm text-muted-foreground">{new Date(workout.started_at).toLocaleString()}</p>

        <div className="grid grid-cols-3 gap-3 mt-6">
          <Stat icon={Clock} label="Duration" value={fmtDur(workout.duration_seconds)} />
          <Stat icon={Weight} label="Volume" value={`${Math.round(Number(workout.total_volume ?? 0))} kg`} />
          <Stat icon={Trophy} label="PRs" value={String(prs)} />
        </div>
      </div>

      <div className="bg-gradient-card border border-border rounded-2xl p-6 shadow-card mb-4">
        <h2 className="font-bold mb-3">Sets</h2>
        {Object.entries(grouped).map(([name, sets]) => (
          <div key={name} className="mb-4 last:mb-0">
            <p className="font-semibold text-sm mb-1">{name}</p>
            <div className="space-y-1">
              {sets.map((s: any, i: number) => (
                <div key={s.id} className="flex items-center gap-3 text-sm bg-secondary/40 rounded-md px-3 py-1.5">
                  <span className="w-6 text-muted-foreground">#{i + 1}</span>
                  <span className="font-medium">{s.weight ?? "—"} kg × {s.reps ?? "—"}</span>
                  {s.rpe && <span className="text-xs text-muted-foreground">RPE {s.rpe}</span>}
                  {s.is_pr && <span className="ml-auto text-xs font-bold text-primary">🏆 PR</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-card border border-border rounded-2xl p-6 shadow-card">
        <h2 className="font-bold mb-3 flex items-center gap-2">
          <MessageCircle className="w-4 h-4" /> Comments
        </h2>
        <div className="space-y-2 mb-3">
          {comments?.length === 0 && <p className="text-sm text-muted-foreground">No comments yet.</p>}
          {comments?.map((c: any) => (
            <div key={c.id} className="p-3 rounded-lg bg-secondary/40">
              <p className="text-xs text-muted-foreground">{c.profiles?.display_name ?? "User"}</p>
              <p className="text-sm">{c.text}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Say something…"
            className="flex-1 h-10 px-3 rounded-md bg-background border border-input"
          />
          <button onClick={postComment} className="px-4 rounded-md bg-primary text-primary-foreground font-semibold">
            Post
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: any) {
  return (
    <div className="text-center">
      <Icon className="w-4 h-4 mx-auto text-muted-foreground" />
      <p className="text-lg font-bold mt-1">{value}</p>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function fmtDur(secs?: number | null) {
  if (!secs) return "—";
  const m = Math.floor(secs / 60);
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
}
