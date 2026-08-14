import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, X } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/programs/$id")({
  component: ProgramDetail,
});

function ProgramDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data: program } = useQuery({
    queryKey: ["program", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("programs")
        .select("*, program_days(*, routines(name))")
        .eq("id", id)
        .maybeSingle();
      return data;
    },
  });

  const { data: routines } = useQuery({
    queryKey: ["routines-mine"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data } = await supabase.from("routines").select("id, name").eq("owner_id", u.user.id).eq("archived", false);
      return data ?? [];
    },
  });

  const [week, setWeek] = useState(1);
  const [day, setDay] = useState(1);
  const [routineId, setRoutineId] = useState<string>("");
  const [label, setLabel] = useState("");

  async function add() {
    if (!routineId) return toast.error("Pick a routine first.");
    // Replace existing (week, day) for this program
    const del = await supabase.from("program_days").delete().eq("program_id", id).eq("week_number", week).eq("day_number", day);
    if (del.error) return toast.error(del.error.message);
    const { error } = await supabase.from("program_days").insert({ program_id: id, week_number: week, day_number: day, routine_id: routineId, label: label.trim() || null } as any);
    if (error) return toast.error(error.message);
    await qc.invalidateQueries({ queryKey: ["program", id] });
    setLabel("");
    toast.success(`Week ${week} · Day ${day} added`);
  }

  async function remove(dayId: string) {
    const { error } = await supabase.from("program_days").delete().eq("id", dayId);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["program", id] });
  }


  if (!program) return <div className="p-8">Loading…</div>;

  const grid = Array.from({ length: program.duration_weeks }, (_, w) => w + 1);
  const daysByWeek: Record<number, any[]> = {};
  (program.program_days ?? []).forEach((d: any) => (daysByWeek[d.week_number] ??= []).push(d));

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <Link to="/programs" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <h1 className="text-3xl font-extrabold mb-1">{program.name}</h1>
      <p className="text-muted-foreground mb-6">{program.duration_weeks} weeks</p>

      <div className="bg-gradient-card border border-border rounded-2xl p-4 mb-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Add day</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <input type="number" min={1} max={program.duration_weeks} value={week} onChange={(e) => setWeek(Number(e.target.value))} placeholder="Week" className="h-10 px-3 rounded-md bg-background border border-input" />
          <input type="number" min={1} max={7} value={day} onChange={(e) => setDay(Number(e.target.value))} placeholder="Day" className="h-10 px-3 rounded-md bg-background border border-input" />
          <select value={routineId} onChange={(e) => setRoutineId(e.target.value)} className="h-10 px-3 rounded-md bg-background border border-input md:col-span-2">
            <option value="">Pick routine…</option>
            {routines?.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <button onClick={add} className="h-10 rounded-md bg-gradient-primary text-primary-foreground font-semibold flex items-center justify-center gap-1"><Plus className="w-4 h-4" />Add</button>
        </div>
      </div>

      <div className="space-y-4">
        {grid.map((w) => (
          <div key={w} className="bg-gradient-card border border-border rounded-xl p-4">
            <p className="font-bold mb-2">Week {w}</p>
            <div className="grid gap-2">
              {(daysByWeek[w] ?? []).sort((a, b) => a.day_number - b.day_number).map((d) => (
                <div key={d.id} className="flex items-center justify-between p-2 rounded-md bg-secondary/40">
                  <span className="text-sm">Day {d.day_number}: <strong>{d.routines?.name ?? "—"}</strong></span>
                  <button onClick={() => remove(d.id)} className="text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
                </div>
              ))}
              {(daysByWeek[w] ?? []).length === 0 && <p className="text-xs text-muted-foreground">No days planned.</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
