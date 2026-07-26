import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Get started — Gymigo" },
      { name: "description", content: "Quick setup to personalize your Gymigo experience." },
      { property: "og:title", content: "Get started — Gymigo" },
      { property: "og:description", content: "Set your goals, units, and experience level." },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [uid, setUid] = useState<string | null>(null);
  const [goal, setGoal] = useState("strength");
  const [experience, setExperience] = useState("beginner");
  const [units, setUnits] = useState<"kg" | "lb">("kg");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) nav({ to: "/auth", replace: true });
      else setUid(data.user.id);
    });
  }, [nav]);

  async function finish() {
    if (!uid) return;
    const { error } = await supabase
      .from("profiles")
      .update({ goal, experience, units, onboarded: true } as any)
      .eq("id", uid);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("You're all set!");
    nav({ to: "/dashboard", replace: true });
  }

  return (
    <div className="min-h-screen bg-gradient-hero grid place-items-center px-4">
      <div className="w-full max-w-lg bg-gradient-card border border-border rounded-2xl p-8 shadow-card">
        <div className="flex gap-1 mb-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-border"}`} />
          ))}
        </div>

        {step === 0 && (
          <Step title="What's your main goal?" desc="We'll shape your defaults around it.">
            <Choices
              value={goal}
              onChange={setGoal}
              options={[
                ["strength", "Get stronger"],
                ["hypertrophy", "Build muscle"],
                ["weight_loss", "Lose fat"],
                ["general", "General fitness"],
              ]}
            />
          </Step>
        )}
        {step === 1 && (
          <Step title="How experienced are you?" desc="No wrong answer.">
            <Choices
              value={experience}
              onChange={setExperience}
              options={[
                ["beginner", "Beginner (< 1 year)"],
                ["intermediate", "Intermediate (1-3 years)"],
                ["advanced", "Advanced (3+ years)"],
              ]}
            />
          </Step>
        )}
        {step === 2 && (
          <Step title="Preferred units?" desc="You can change this later in settings.">
            <Choices
              value={units}
              onChange={(v) => setUnits(v as "kg" | "lb")}
              options={[
                ["kg", "Kilograms (kg)"],
                ["lb", "Pounds (lb)"],
              ]}
            />
          </Step>
        )}

        <div className="mt-8 flex justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="px-4 py-2 rounded-md text-sm text-muted-foreground disabled:opacity-40"
          >
            Back
          </button>
          {step < 2 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="px-6 py-2 rounded-md bg-gradient-primary text-primary-foreground font-semibold"
            >
              Next
            </button>
          ) : (
            <button
              onClick={finish}
              className="px-6 py-2 rounded-md bg-gradient-primary text-primary-foreground font-semibold"
            >
              Finish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Step({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="text-sm text-muted-foreground mt-1 mb-6">{desc}</p>
      {children}
    </div>
  );
}

function Choices({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="grid gap-2">
      {options.map(([v, label]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`text-left p-4 rounded-lg border transition-all ${
            value === v
              ? "border-primary bg-primary/10 shadow-glow"
              : "border-border bg-background hover:border-muted-foreground"
          }`}
        >
          <span className="font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
}
