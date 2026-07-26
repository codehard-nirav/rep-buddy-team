import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, X, Search } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/routines/$id")({
  component: RoutineDetail,
});

function RoutineDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);

  const { data: routine } = useQuery({
    queryKey: ["routine", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("routines")
        .select("*, routine_exercises(*, exercises(name, primary_muscles))")
        .eq("id", id)
        .maybeSingle();
      return data;
    },
  });

  async function addExercise(exId: string) {
    await supabase.from("routine_exercises").insert({
      routine_id: id,
      exercise_id: exId,
      order_index: routine?.routine_exercises?.length ?? 0,
    } as any);
    qc.invalidateQueries({ queryKey: ["routine", id] });
    setPickerOpen(false);
  }

  async function remove(rexId: string) {
    await supabase.from("routine_exercises").delete().eq("id", rexId);
    qc.invalidateQueries({ queryKey: ["routine", id] });
  }

  async function updateTargets(rexId: string, patch: any) {
    await supabase.from("routine_exercises").update(patch).eq("id", rexId);
    qc.invalidateQueries({ queryKey: ["routine", id] });
  }

  if (!routine) return <div className="p-8">Loading…</div>;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <Link to="/routines" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <h1 className="text-3xl font-extrabold mb-6">{routine.name}</h1>

      <div className="space-y-2 mb-4">
        {routine.routine_exercises?.map((rex: any) => (
          <div key={rex.id} className="p-4 rounded-xl border border-border bg-gradient-card">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold">{rex.exercises?.name}</p>
              <button onClick={() => remove(rex.id)} className="text-muted-foreground hover:text-destructive">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Target label="Sets" val={rex.target_sets} onChange={(v) => updateTargets(rex.id, { target_sets: v })} />
              <Target label="Reps" val={rex.target_reps} onChange={(v) => updateTargets(rex.id, { target_reps: v })} />
              <Target label="Weight" val={rex.target_weight} onChange={(v) => updateTargets(rex.id, { target_weight: v })} />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setPickerOpen(true)}
        className="w-full py-3 rounded-xl border-2 border-dashed border-border hover:border-primary text-muted-foreground hover:text-primary flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" /> Add exercise
      </button>

      {pickerOpen && <Picker onPick={addExercise} onClose={() => setPickerOpen(false)} />}
    </div>
  );
}

function Target({ label, val, onChange }: { label: string; val: any; onChange: (v: number | null) => void }) {
  const [v, setV] = useState(val == null ? "" : String(val));
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => onChange(v === "" ? null : Number(v))}
        className="w-full h-9 px-2 rounded-md bg-background border border-input mt-1"
      />
    </label>
  );
}

function Picker({ onPick, onClose }: { onPick: (id: string) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const { data } = useQuery({
    queryKey: ["picker-ex", q],
    queryFn: async () => {
      let query = supabase.from("exercises").select("id, name").order("name").limit(50);
      if (q) query = query.ilike("name", `%${q}%`);
      const { data } = await query;
      return data ?? [];
    },
  });
  return (
    <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} className="flex-1 bg-transparent focus:outline-none" placeholder="Search…" />
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto flex-1">
          {data?.map((e: any) => (
            <button key={e.id} onClick={() => onPick(e.id)} className="w-full text-left p-3 hover:bg-secondary/60">
              {e.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
