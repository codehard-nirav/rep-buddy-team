import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/exercises/")({
  head: () => ({
    meta: [
      { title: "Exercises — Gymigo" },
      { name: "description", content: "Browse 60+ exercises. Filter by muscle group and equipment." },
      { property: "og:title", content: "Exercises — Gymigo" },
      { property: "og:description", content: "Searchable exercise library." },
    ],
  }),
  component: Exercises,
});

const MUSCLES = ["chest", "back", "lats", "shoulders", "biceps", "triceps", "quadriceps", "hamstrings", "glutes", "calves", "core"];
const EQUIPMENT = ["barbell", "dumbbell", "cable", "machine", "bodyweight", "kettlebell"];

function Exercises() {
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState<string>("");
  const [equip, setEquip] = useState<string>("");

  const { data } = useQuery({
    queryKey: ["exercises", q, muscle, equip],
    queryFn: async () => {
      let query = supabase.from("exercises").select("*").order("name");
      if (q) query = query.ilike("name", `%${q}%`);
      if (muscle) query = query.contains("primary_muscles", [muscle]);
      if (equip) query = query.eq("equipment", equip);
      const { data } = await query.limit(200);
      return data ?? [];
    },
  });

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Exercise Library</h1>
        <Link
          to="/exercises/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-primary text-primary-foreground font-semibold text-sm"
        >
          <Plus className="w-4 h-4" /> Custom exercise
        </Link>
      </div>

      <div className="bg-gradient-card border border-border rounded-2xl p-4 mb-6 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search exercises…"
            className="w-full h-11 pl-9 pr-3 rounded-md bg-background border border-input"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={!muscle} onClick={() => setMuscle("")}>All muscles</FilterChip>
          {MUSCLES.map((m) => (
            <FilterChip key={m} active={muscle === m} onClick={() => setMuscle(m)}>
              {m}
            </FilterChip>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={!equip} onClick={() => setEquip("")}>All equipment</FilterChip>
          {EQUIPMENT.map((e) => (
            <FilterChip key={e} active={equip === e} onClick={() => setEquip(e)}>
              {e}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {data?.map((ex: any) => (
          <Link
            key={ex.id}
            to="/exercises/$id"
            params={{ id: ex.id }}
            className="bg-gradient-card border border-border rounded-xl p-4 shadow-card hover:border-primary transition-colors"
          >
            <p className="font-semibold">{ex.name}</p>
            <p className="text-xs text-muted-foreground mt-1 capitalize">
              {(ex.primary_muscles ?? []).slice(0, 3).join(" · ")}
            </p>
            <div className="mt-3 flex gap-2">
              {ex.equipment && (
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary">{ex.equipment}</span>
              )}
              {ex.category && (
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary">{ex.category}</span>
              )}
            </div>
          </Link>
        ))}
        {data && data.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full">No exercises match your filters.</p>
        )}
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize border transition-colors ${
        active ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}
