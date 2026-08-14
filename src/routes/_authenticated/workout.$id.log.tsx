import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, X, Timer, Check, Trash2, Search } from "lucide-react";
import { z } from "zod";
import { useUnits } from "@/lib/use-units";
import { RestTimer, type RestTimerHandle } from "@/components/RestTimer";

const searchSchema = z.object({
  add: z.string().optional(),
  routine: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/workout/$id/log")({
  validateSearch: searchSchema,
  component: LogWorkout,
});

function LogWorkout() {
  const { id } = Route.useParams();
  const search = Route.useSearch();
  const nav = useNavigate();
  const qc = useQueryClient();
  const units = useUnits();

  const { data: me } = useQuery({
    queryKey: ["me-log-profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.from("profiles").select("rest_timer_seconds").eq("id", u.user.id).maybeSingle();
      return { userId: u.user.id, restTimer: data?.rest_timer_seconds ?? 90 };
    },
    staleTime: 60_000,
  });


  const { data: workout } = useQuery({
    queryKey: ["workout", id],
    queryFn: async () => {
      const { data } = await supabase.from("workouts").select("*").eq("id", id).maybeSingle();
      return data;
    },
  });

  const { data: sets } = useQuery({
    queryKey: ["workout-sets", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("workout_sets")
        .select("*, exercises(name, primary_muscles)")
        .eq("workout_id", id)
        .order("logged_at");
      return data ?? [];
    },
    refetchInterval: 0,
  });

  const grouped = useMemo(() => {
    const map: Record<string, { exercise_id: string; name: string; sets: any[] }> = {};
    (sets ?? []).forEach((s: any) => {
      if (!map[s.exercise_id]) map[s.exercise_id] = { exercise_id: s.exercise_id, name: s.exercises?.name ?? "Exercise", sets: [] };
      map[s.exercise_id].sets.push(s);
    });
    return Object.values(map);
  }, [sets]);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const restRef = useRef<RestTimerHandle>(null);

  function toggleDone(setId: string) {
    setDone((d) => {
      const next = !d[setId];
      if (next) restRef.current?.start();
      return { ...d, [setId]: next };
    });
  }
  const bootstrappedRef = useRef<string | null>(null);

  // Auto-add exercise from ?add= or routine load — run at most once per workout id.
  useEffect(() => {
    if (!search.add && !search.routine) return;
    if (bootstrappedRef.current === id) return;
    bootstrappedRef.current = id;
    async function bootstrap() {
      if (search.add) {
        await addExercise(search.add, false);
        qc.invalidateQueries({ queryKey: ["workout-sets", id] });
      } else if (search.routine) {
        const { data: rex } = await supabase
          .from("routine_exercises")
          .select("*")
          .eq("routine_id", search.routine)
          .order("order_index");
        for (const r of rex ?? []) {
          await addExercise(r.exercise_id, false);
        }
        qc.invalidateQueries({ queryKey: ["workout-sets", id] });
      }
      nav({ to: "/workout/$id/log", params: { id }, search: {}, replace: true });
    }
    void bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, search.add, search.routine]);


  async function addExercise(exId: string, invalidate = true) {
    // Fetch previous set for autofill
    const { data: u } = await supabase.auth.getUser();
    let weight: number | null = null;
    let reps: number | null = null;
    if (u.user) {
      const { data: prev } = await supabase
        .from("workout_sets")
        .select("weight, reps, workouts!inner(user_id)")
        .eq("exercise_id", exId)
        .eq("workouts.user_id", u.user.id)
        .order("logged_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (prev) {
        weight = prev.weight;
        reps = prev.reps;
      }
    }
    await supabase.from("workout_sets").insert({
      workout_id: id,
      exercise_id: exId,
      set_number: 1,
      weight,
      reps,
    } as any);
    if (invalidate) qc.invalidateQueries({ queryKey: ["workout-sets", id] });
  }

  async function addSet(exerciseId: string, lastSet?: any) {
    const setNumber = (grouped.find((g) => g.exercise_id === exerciseId)?.sets.length ?? 0) + 1;
    await supabase.from("workout_sets").insert({
      workout_id: id,
      exercise_id: exerciseId,
      set_number: setNumber,
      weight: lastSet?.weight ?? null,
      reps: lastSet?.reps ?? null,
    } as any);
    qc.invalidateQueries({ queryKey: ["workout-sets", id] });
  }

  async function updateSet(setId: string, patch: any) {
    await supabase.from("workout_sets").update(patch).eq("id", setId);
    qc.invalidateQueries({ queryKey: ["workout-sets", id] });
  }

  async function deleteSet(setId: string) {
    await supabase.from("workout_sets").delete().eq("id", setId);
    qc.invalidateQueries({ queryKey: ["workout-sets", id] });
  }

  async function finish() {
    // Flush any focused NumInput so its onBlur commits first.
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    // Refetch fresh sets to include the just-committed edit.
    const { data: freshSets } = await supabase
      .from("workout_sets")
      .select("id, exercise_id, weight, reps")
      .eq("workout_id", id);
    const finalSets = freshSets ?? sets ?? [];
    const totalVolume = finalSets.reduce((sum: number, s: any) => sum + Number(s.weight ?? 0) * Number(s.reps ?? 0), 0);
    const { data: u } = await supabase.auth.getUser();
    if (u.user) {
      const byEx: Record<string, { max: number; set_id: string }> = {};
      finalSets.forEach((s: any) => {
        const load = Number(s.weight ?? 0);
        if (!byEx[s.exercise_id] || load > byEx[s.exercise_id].max) {
          byEx[s.exercise_id] = { max: load, set_id: s.id };
        }
      });
      for (const [exId, info] of Object.entries(byEx)) {
        const { data: prev } = await supabase
          .from("workout_sets")
          .select("weight, workouts!inner(user_id, finished_at, id)")
          .eq("exercise_id", exId)
          .eq("workouts.user_id", u.user.id)
          .not("workouts.finished_at", "is", null)
          .neq("workouts.id", id)
          .order("weight", { ascending: false })
          .limit(1)
          .maybeSingle();
        const isPr = !prev || Number(prev.weight ?? 0) < info.max;
        await supabase.from("workout_sets").update({ is_pr: isPr }).eq("id", info.set_id);
      }
    }
    const started = workout?.started_at ? new Date(workout.started_at).getTime() : Date.now();
    const duration = Math.round((Date.now() - started) / 1000);
    await supabase
      .from("workouts")
      .update({ finished_at: new Date().toISOString(), duration_seconds: duration, total_volume: totalVolume })
      .eq("id", id);
    toast.success("Workout complete!");
    nav({ to: "/workout/$id", params: { id } });
  }

  async function discard() {
    if (!confirm("Discard this workout?")) return;
    await supabase.from("workouts").delete().eq("id", id);
    nav({ to: "/dashboard" });
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 pb-32">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold">{workout?.name ?? "Workout"}</h1>
          <RunningTimer startedAt={workout?.started_at} />
        </div>
        <div className="flex gap-2">
          <button onClick={discard} className="p-2 rounded-md hover:bg-secondary text-destructive" title="Discard">
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={finish}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-primary text-primary-foreground font-semibold text-sm"
          >
            <Check className="w-4 h-4" /> Finish
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {grouped.map((g) => (
          <div key={g.exercise_id} className="bg-gradient-card border border-border rounded-xl p-4 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">{g.name}</h3>
              <button
                onClick={async () => {
                  for (const s of g.sets) await supabase.from("workout_sets").delete().eq("id", s.id);
                  qc.invalidateQueries({ queryKey: ["workout-sets", id] });
                }}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                Remove
              </button>
            </div>
            <div className="grid grid-cols-[24px_1fr_1fr_1fr_28px_24px] gap-1.5 items-center text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              <span className="text-center">#</span>
              <span>Weight</span>
              <span>Reps</span>
              <span>RPE</span>
              <span className="text-center">✓</span>
              <span />
            </div>
            {g.sets.map((s: any, i: number) => (
              <div key={s.id} className="grid grid-cols-[24px_1fr_1fr_1fr_28px_24px] gap-1.5 items-center py-0.5">
                <span className="text-center text-xs font-semibold">{i + 1}</span>
                <NumInput value={s.weight} onCommit={(v) => updateSet(s.id, { weight: v })} placeholder={units} />
                <NumInput value={s.reps} onCommit={(v) => updateSet(s.id, { reps: v })} placeholder="reps" />
                <NumInput value={s.rpe} onCommit={(v) => updateSet(s.id, { rpe: v })} placeholder="RPE" step={0.5} />
                <button
                  onClick={() => toggleDone(s.id)}
                  aria-label="Mark set complete"
                  className={`h-7 w-7 grid place-items-center rounded-md border ${
                    done[s.id] ? "bg-gradient-primary text-primary-foreground border-primary" : "border-input bg-background text-muted-foreground"
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => deleteSet(s.id)} className="p-0.5 text-muted-foreground hover:text-destructive">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button
              onClick={() => addSet(g.exercise_id, g.sets[g.sets.length - 1])}
              className="mt-2 w-full py-2 rounded-md bg-secondary/60 hover:bg-secondary text-sm font-medium flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add set
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() => setPickerOpen(true)}
        className="mt-6 w-full py-4 rounded-xl border-2 border-dashed border-border hover:border-primary text-muted-foreground hover:text-primary font-medium flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" /> Add exercise
      </button>

      <RestTimer ref={restRef} dbDefault={me?.restTimer} />

      {pickerOpen && (
        <ExercisePicker
          onClose={() => setPickerOpen(false)}
          onPick={async (exId) => {
            await addExercise(exId);
            setPickerOpen(false);
          }}
        />
      )}
    </div>
  );
}

function RunningTimer({ startedAt }: { startedAt?: string | null }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!startedAt) return null;
  const secs = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  const mm = Math.floor(secs / 60);
  const ss = secs % 60;
  return (
    <p className="text-sm text-muted-foreground flex items-center gap-1">
      <Timer className="w-3 h-3" /> {mm}m {String(ss).padStart(2, "0")}s
    </p>
  );
}

function NumInput({ value, onCommit, placeholder, step = 1 }: { value: any; onCommit: (v: number | null) => void; placeholder: string; step?: number }) {
  const [v, setV] = useState<string>(value == null ? "" : String(value));
  useEffect(() => setV(value == null ? "" : String(value)), [value]);
  return (
    <input
      inputMode="decimal"
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => onCommit(v === "" ? null : Number(v))}
      placeholder={placeholder}
      step={step}
      className="h-8 px-1.5 w-full min-w-0 text-sm rounded-md bg-background border border-input text-center font-medium"
    />
  );
}

function ExercisePicker({ onClose, onPick }: { onClose: () => void; onPick: (id: string) => void }) {
  const [q, setQ] = useState("");
  const { data } = useQuery({
    queryKey: ["picker-exercises", q],
    queryFn: async () => {
      let query = supabase.from("exercises").select("id, name, primary_muscles").order("name").limit(50);
      if (q) query = query.ilike("name", `%${q}%`);
      const { data } = await query;
      return data ?? [];
    },
  });
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-end sm:place-items-center p-0 sm:p-4">
      <div className="bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search exercises…"
            className="flex-1 bg-transparent focus:outline-none"
          />
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-2">
          {data?.map((ex: any) => (
            <button
              key={ex.id}
              onClick={() => onPick(ex.id)}
              className="w-full text-left p-3 rounded-lg hover:bg-secondary/60"
            >
              <p className="font-medium">{ex.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{(ex.primary_muscles ?? []).join(" · ")}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
