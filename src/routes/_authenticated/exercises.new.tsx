import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/exercises/new")({
  component: NewExercise,
});

function NewExercise() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [muscle, setMuscle] = useState("");
  const [equipment, setEquipment] = useState("barbell");
  const [instructions, setInstructions] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data, error } = await supabase
      .from("exercises")
      .insert({
        name,
        primary_muscles: muscle.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
        equipment,
        instructions,
        is_custom: true,
        created_by: u.user.id,
      } as any)
      .select()
      .single();
    if (error) return toast.error(error.message);
    toast.success("Exercise created");
    nav({ to: "/exercises/$id", params: { id: data.id } });
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <Link to="/exercises" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <h1 className="text-3xl font-extrabold mb-6">New custom exercise</h1>
      <form onSubmit={submit} className="bg-gradient-card border border-border rounded-2xl p-6 shadow-card space-y-4">
        <Field label="Name">
          <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full h-11 px-3 rounded-md bg-background border border-input" />
        </Field>
        <Field label="Primary muscles (comma separated)">
          <input value={muscle} onChange={(e) => setMuscle(e.target.value)} placeholder="chest, triceps" className="w-full h-11 px-3 rounded-md bg-background border border-input" />
        </Field>
        <Field label="Equipment">
          <select value={equipment} onChange={(e) => setEquipment(e.target.value)} className="w-full h-11 px-3 rounded-md bg-background border border-input">
            {["barbell", "dumbbell", "cable", "machine", "bodyweight", "kettlebell", "other"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
        <Field label="Instructions">
          <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={4} className="w-full px-3 py-2 rounded-md bg-background border border-input" />
        </Field>
        <button className="w-full h-11 rounded-md bg-gradient-primary text-primary-foreground font-semibold">Create</button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
