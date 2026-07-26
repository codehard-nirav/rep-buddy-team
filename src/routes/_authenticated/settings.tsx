import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Gymigo" },
      { name: "description", content: "Units, privacy, and account settings." },
      { property: "og:title", content: "Settings — Gymigo" },
      { property: "og:description", content: "Manage your Gymigo account." },
    ],
  }),
  component: Settings,
});

function Settings() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: p } = await supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
      setProfile(p);
    });
  }, []);

  async function save(patch: any) {
    if (!profile) return;
    const { error } = await supabase.from("profiles").update(patch).eq("id", profile.id);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    setProfile({ ...profile, ...patch });
  }

  async function exportData() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data: workouts } = await supabase
      .from("workouts")
      .select("*, workout_sets(*, exercises(name))")
      .eq("user_id", u.user.id);
    const rows = [["date", "workout", "exercise", "set", "weight", "reps", "rpe"]];
    (workouts ?? []).forEach((w: any) => {
      (w.workout_sets ?? []).forEach((s: any) => {
        rows.push([
          new Date(w.started_at).toISOString(),
          w.name ?? "",
          s.exercises?.name ?? "",
          String(s.set_number),
          String(s.weight ?? ""),
          String(s.reps ?? ""),
          String(s.rpe ?? ""),
        ]);
      });
    });
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "gymigo-workouts.csv";
    a.click();
  }

  if (!profile) return <div className="p-8">Loading…</div>;

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-4">
      <h1 className="text-3xl font-extrabold mb-4">Settings</h1>

      <Card title="Profile">
        <Field label="Display name">
          <input defaultValue={profile.display_name ?? ""} onBlur={(e) => save({ display_name: e.target.value })} className="w-full h-10 px-3 rounded-md bg-background border border-input" />
        </Field>
        <Field label="Username">
          <input defaultValue={profile.username ?? ""} onBlur={(e) => save({ username: e.target.value })} className="w-full h-10 px-3 rounded-md bg-background border border-input" />
        </Field>
        <Field label="Bio">
          <textarea defaultValue={profile.bio ?? ""} onBlur={(e) => save({ bio: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-md bg-background border border-input" />
        </Field>
      </Card>

      <Card title="Preferences">
        <Field label="Units">
          <select value={profile.units} onChange={(e) => save({ units: e.target.value })} className="w-full h-10 px-3 rounded-md bg-background border border-input">
            <option value="kg">Kilograms</option>
            <option value="lb">Pounds</option>
          </select>
        </Field>
        <Field label="Rest timer (seconds)">
          <input type="number" defaultValue={profile.rest_timer_seconds ?? 90} onBlur={(e) => save({ rest_timer_seconds: Number(e.target.value) })} className="w-full h-10 px-3 rounded-md bg-background border border-input" />
        </Field>
        <Field label="Profile privacy">
          <select value={profile.privacy} onChange={(e) => save({ privacy: e.target.value })} className="w-full h-10 px-3 rounded-md bg-background border border-input">
            <option value="public">Public — anyone can view</option>
            <option value="private">Private — only you & coaches</option>
          </select>
        </Field>
      </Card>

      <Card title="Data">
        <button onClick={exportData} className="w-full h-10 rounded-md bg-secondary hover:bg-secondary/80 font-medium">
          Export workouts as CSV
        </button>
      </Card>
    </div>
  );
}

function Card({ title, children }: any) {
  return (
    <div className="bg-gradient-card border border-border rounded-2xl p-6 shadow-card space-y-3">
      <h2 className="font-bold">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: any) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
