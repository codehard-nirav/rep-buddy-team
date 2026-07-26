import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BodyMap } from "@/components/BodyMap";
import { prettyMuscle } from "@/lib/muscle-map";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/exercises/$id")({
  component: ExerciseDetail,
});

function ExerciseDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const { data: ex } = useQuery({
    queryKey: ["exercise", id],
    queryFn: async () => {
      const { data } = await supabase.from("exercises").select("*").eq("id", id).maybeSingle();
      return data;
    },
  });

  async function addToNewWorkout() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user || !ex) return;
    const { data: workout, error } = await supabase
      .from("workouts")
      .insert({ user_id: u.user.id, name: `${ex.name} session` } as any)
      .select()
      .single();
    if (error) return toast.error(error.message);
    nav({ to: "/workout/$id/log", params: { id: workout.id }, search: { add: ex.id } });
  }

  if (!ex) return <div className="p-8">Loading…</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <Link to="/exercises" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to library
      </Link>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{ex.name}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            {(ex.primary_muscles ?? []).map((m: string) => (
              <span key={m} className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                {prettyMuscle(m)}
              </span>
            ))}
            {(ex.secondary_muscles ?? []).map((m: string) => (
              <span key={m} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                {prettyMuscle(m)}
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={addToNewWorkout}
          className="px-4 py-2 rounded-md bg-gradient-primary text-primary-foreground font-semibold text-sm"
        >
          Add to workout
        </button>
      </div>

      <div className="grid md:grid-cols-[1fr_1.4fr] gap-6">
        <div className="bg-gradient-card border border-border rounded-2xl p-4 shadow-card">
          <BodyMap primary={ex.primary_muscles ?? []} secondary={ex.secondary_muscles ?? []} />
        </div>
        <div className="bg-gradient-card border border-border rounded-2xl p-6 shadow-card space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Equipment</p>
            <p className="font-medium capitalize">{ex.equipment ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Type</p>
            <p className="font-medium capitalize">{ex.category ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">How to</p>
            <p className="text-sm text-foreground/90 leading-relaxed mt-1">{ex.instructions ?? "No instructions yet."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
