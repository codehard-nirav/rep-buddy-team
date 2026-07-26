import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/routines/")({
  head: () => ({
    meta: [
      { title: "Routines — Gymigo" },
      { name: "description", content: "Build and reuse workout routines." },
      { property: "og:title", content: "Routines — Gymigo" },
      { property: "og:description", content: "Reusable workout templates." },
    ],
  }),
  component: Routines,
});

function Routines() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const { data: routines } = useQuery({
    queryKey: ["routines"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data } = await supabase
        .from("routines")
        .select("*, routine_exercises(id)")
        .eq("owner_id", u.user.id)
        .eq("archived", false)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("routines").insert({ owner_id: u.user.id, name: name.trim() } as any);
    if (error) return toast.error(error.message);
    setName("");
    qc.invalidateQueries({ queryKey: ["routines"] });
  }

  async function del(id: string) {
    await supabase.from("routines").update({ archived: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["routines"] });
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-extrabold mb-6">Routines</h1>

      <form onSubmit={create} className="flex gap-2 mb-6">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New routine name…"
          className="flex-1 h-11 px-3 rounded-md bg-background border border-input"
        />
        <button className="px-5 rounded-md bg-gradient-primary text-primary-foreground font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create
        </button>
      </form>

      <div className="grid gap-2">
        {routines?.map((r: any) => (
          <div key={r.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-gradient-card">
            <Link to="/routines/$id" params={{ id: r.id }} className="flex-1">
              <p className="font-semibold">{r.name}</p>
              <p className="text-xs text-muted-foreground">{r.routine_exercises?.length ?? 0} exercises</p>
            </Link>
            <button onClick={() => del(r.id)} className="text-muted-foreground hover:text-destructive p-2">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {routines?.length === 0 && <p className="text-sm text-muted-foreground">No routines yet.</p>}
      </div>
    </div>
  );
}
