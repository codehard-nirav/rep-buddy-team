import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/workout/new")({
  component: NewWorkout,
});

function NewWorkout() {
  const nav = useNavigate();
  const { data: routines } = useQuery({
    queryKey: ["my-routines"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data } = await supabase
        .from("routines")
        .select("*, routine_exercises(id, exercise_id, order_index)")
        .eq("owner_id", u.user.id)
        .eq("archived", false)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function startEmpty() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data, error } = await supabase
      .from("workouts")
      .insert({ user_id: u.user.id, name: "Empty workout" } as any)
      .select()
      .single();
    if (error) return toast.error(error.message);
    nav({ to: "/workout/$id/log", params: { id: data.id }, search: {} });
  }

  async function startFromRoutine(r: any) {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data: workout, error } = await supabase
      .from("workouts")
      .insert({ user_id: u.user.id, routine_id: r.id, name: r.name } as any)
      .select()
      .single();
    if (error) return toast.error(error.message);
    nav({ to: "/workout/$id/log", params: { id: workout.id }, search: { routine: r.id } });
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <h1 className="text-3xl font-extrabold mb-6">Start a workout</h1>

      <button
        onClick={startEmpty}
        className="w-full p-5 rounded-2xl bg-gradient-primary text-primary-foreground font-bold text-left shadow-glow flex items-center justify-between mb-4"
      >
        <span>
          <span className="block text-lg">Empty workout</span>
          <span className="text-sm opacity-80 font-normal">Freestyle — add exercises as you go</span>
        </span>
        <Plus className="w-6 h-6" />
      </button>

      <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">Your routines</h2>
      {routines?.length ? (
        <div className="grid gap-2">
          {routines.map((r: any) => (
            <button
              key={r.id}
              onClick={() => startFromRoutine(r)}
              className="text-left p-4 rounded-xl border border-border bg-gradient-card hover:border-primary transition-colors"
            >
              <p className="font-semibold">{r.name}</p>
              <p className="text-xs text-muted-foreground">{r.routine_exercises?.length ?? 0} exercises</p>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No routines yet.{" "}
          <Link to="/routines" className="text-primary underline">
            Create one
          </Link>
          .
        </p>
      )}
    </div>
  );
}
