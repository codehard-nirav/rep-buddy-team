import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/measurements")({
  head: () => ({
    meta: [
      { title: "Body — Gymigo" },
      { name: "description", content: "Track body weight and measurements over time." },
      { property: "og:title", content: "Body — Gymigo" },
      { property: "og:description", content: "Log body measurements." },
    ],
  }),
  component: Measurements,
});

function Measurements() {
  const qc = useQueryClient();
  const [type, setType] = useState("weight");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("kg");

  function pickUnitForType(t: string) {
    const s = t.trim().toLowerCase();
    if (["waist", "chest", "arm", "arms", "thigh", "thighs", "hip", "hips", "neck", "calf", "calves", "shoulder", "shoulders"].includes(s)) return "cm";
    if (["body_fat", "bodyfat", "fat", "bf"].includes(s)) return "%";
    return "kg";
  }

  const { data } = useQuery({
    queryKey: ["measurements"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data } = await supabase.from("body_measurements").select("*").eq("user_id", u.user.id).order("logged_at");
      return data ?? [];
    },
  });

  async function log(e: React.FormEvent) {
    e.preventDefault();
    const { data: u } = await supabase.auth.getUser();
    if (!u.user || !value) return;
    const { error } = await supabase.from("body_measurements").insert({ user_id: u.user.id, type, value: Number(value), unit } as any);
    if (error) return toast.error(error.message);
    setValue("");
    qc.invalidateQueries({ queryKey: ["measurements"] });
  }

  const filtered = (data ?? []).filter((m: any) => m.type === type);
  const chart = filtered.map((m: any) => ({ date: new Date(m.logged_at).toLocaleDateString(), value: Number(m.value) }));

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-extrabold mb-6">Body</h1>

      <form onSubmit={log} className="bg-gradient-card border border-border rounded-2xl p-4 mb-4 grid grid-cols-2 md:grid-cols-4 gap-2">
        <input value={type} onChange={(e) => { setType(e.target.value); setUnit(pickUnitForType(e.target.value)); }} placeholder="weight, waist…" className="h-10 px-3 rounded-md bg-background border border-input col-span-2 md:col-span-1" />
        <input type="number" step="0.1" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Value" className="h-10 px-3 rounded-md bg-background border border-input" />
        <select value={unit} onChange={(e) => setUnit(e.target.value)} className="h-10 px-3 rounded-md bg-background border border-input">
          {["kg", "lb", "cm", "in", "%"].map((u) => <option key={u}>{u}</option>)}
        </select>
        <button className="h-10 rounded-md bg-gradient-primary text-primary-foreground font-semibold">Log</button>
      </form>

      <div className="bg-gradient-card border border-border rounded-2xl p-6 shadow-card mb-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 capitalize">{type} history</p>
        {chart.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.017 260)" />
              <XAxis dataKey="date" stroke="oklch(0.68 0.02 260)" fontSize={11} />
              <YAxis stroke="oklch(0.68 0.02 260)" fontSize={11} />
              <Tooltip contentStyle={{ background: "oklch(0.21 0.017 260)", border: "1px solid oklch(0.28 0.017 260)", borderRadius: 8 }} />
              <Line type="monotone" dataKey="value" stroke="oklch(0.7 0.19 30)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground">No entries yet.</p>
        )}
      </div>

      <div className="bg-gradient-card border border-border rounded-2xl p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">All entries</p>
        <ul className="divide-y divide-border">
          {(data ?? []).slice().reverse().map((m: any) => (
            <li key={m.id} className="py-2 flex justify-between text-sm">
              <span className="capitalize">{m.type}</span>
              <span>{m.value} {m.unit}</span>
              <span className="text-muted-foreground text-xs">{new Date(m.logged_at).toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
