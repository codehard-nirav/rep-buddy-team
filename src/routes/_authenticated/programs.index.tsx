import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/programs/")({
  head: () => ({
    meta: [
      { title: "Programs — Gymigo" },
      { name: "description", content: "Multi-week training programs." },
      { property: "og:title", content: "Programs — Gymigo" },
      { property: "og:description", content: "Plan your training weeks." },
    ],
  }),
  component: Programs,
});

function Programs() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [weeks, setWeeks] = useState(4);

  const { data: programs } = useQuery({
    queryKey: ["programs"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data } = await supabase
        .from("programs")
        .select("*, program_days(id)")
        .eq("owner_id", u.user.id)
        .eq("archived", false)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const { data: u } = await supabase.auth.getUser();
    if (!u.user || !name.trim()) return;
    const { error } = await supabase.from("programs").insert({ owner_id: u.user.id, name: name.trim(), duration_weeks: weeks } as any);
    if (error) return toast.error(error.message);
    setName("");
    qc.invalidateQueries({ queryKey: ["programs"] });
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-extrabold mb-6">Programs</h1>

      <form onSubmit={create} className="flex flex-wrap gap-2 mb-6">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Program name…" className="flex-1 min-w-[200px] h-11 px-3 rounded-md bg-background border border-input" />
        <input type="number" min={1} max={52} value={weeks} onChange={(e) => setWeeks(Number(e.target.value))} className="w-24 h-11 px-3 rounded-md bg-background border border-input" />
        <button className="px-5 h-11 rounded-md bg-gradient-primary text-primary-foreground font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create
        </button>
      </form>

      <div className="grid sm:grid-cols-2 gap-3">
        {programs?.map((p: any) => (
          <Link key={p.id} to="/programs/$id" params={{ id: p.id }} className="p-5 rounded-xl border border-border bg-gradient-card hover:border-primary transition-colors">
            <div className="flex items-center gap-2 text-primary text-xs uppercase tracking-wider mb-2">
              <CalendarIcon className="w-3 h-3" /> {p.duration_weeks} weeks
            </div>
            <p className="font-bold text-lg">{p.name}</p>
            <p className="text-xs text-muted-foreground mt-1">{p.program_days?.length ?? 0} days planned</p>
          </Link>
        ))}
        {programs?.length === 0 && <p className="text-sm text-muted-foreground">No programs yet.</p>}
      </div>
    </div>
  );
}
