import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { UserPlus, Check, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/coach")({
  head: () => ({
    meta: [
      { title: "Coach — Gymigo" },
      { name: "description", content: "Manage your clients and their programs." },
      { property: "og:title", content: "Coach — Gymigo" },
      { property: "og:description", content: "Coach dashboard for Gymigo." },
    ],
  }),
  component: Coach,
});

function Coach() {
  const qc = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState("");

  const { data } = useQuery({
    queryKey: ["coach-data"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const [{ data: asCoach }, { data: asClient }] = await Promise.all([
        supabase.from("coach_clients").select("*, client:profiles!coach_clients_client_id_fkey(display_name, avatar_url, username)").eq("coach_id", u.user.id),
        supabase.from("coach_clients").select("*, coach:profiles!coach_clients_coach_id_fkey(display_name, avatar_url, username)").eq("client_id", u.user.id),
      ]);
      return { meId: u.user.id, asCoach: asCoach ?? [], asClient: asClient ?? [] };
    },
  });

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!data?.meId || !inviteEmail.trim()) return;
    const uname = inviteEmail.trim().replace(/^@/, "");
    const { data: match } = await supabase.from("profiles").select("id").eq("username", uname).maybeSingle();
    const clientId = match?.id;
    if (!clientId) {
      toast.error("Client not found. They need to sign up and share their @username first.");
      return;
    }
    if (clientId === data.meId) {
      toast.error("You can't invite yourself.");
      return;
    }
    const { data: existing } = await supabase
      .from("coach_clients")
      .select("id, status")
      .eq("coach_id", data.meId)
      .eq("client_id", clientId)
      .maybeSingle();
    if (existing) {
      toast.error(`Already ${existing.status}.`);
      return;
    }
    const { data: inserted, error } = await supabase
      .from("coach_clients")
      .insert({ coach_id: data.meId, client_id: clientId, status: "pending" } as any)
      .select("id")
      .single();
    if (error) return toast.error(error.message);
    if (inserted?.id) {
      await supabase
        .from("coach_invite_emails")
        .insert({ coach_client_id: inserted.id, coach_id: data.meId, invited_email: uname } as any);
    }
    toast.success("Invite sent");
    setInviteEmail("");
    qc.invalidateQueries({ queryKey: ["coach-data"] });
  }

  async function respond(rowId: string, status: "active" | "declined") {
    await supabase.from("coach_clients").update({ status }).eq("id", rowId);
    qc.invalidateQueries({ queryKey: ["coach-data"] });
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      <h1 className="text-3xl font-extrabold">Coaching</h1>

      <section className="bg-gradient-card border border-border rounded-2xl p-6 shadow-card">
        <h2 className="font-bold mb-4">Invite a client</h2>
        <form onSubmit={invite} className="flex gap-2">
          <input
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Client @username"
            className="flex-1 h-11 px-3 rounded-md bg-background border border-input"
          />
          <button className="px-5 rounded-md bg-gradient-primary text-primary-foreground font-semibold flex items-center gap-1">
            <UserPlus className="w-4 h-4" /> Invite
          </button>
        </form>
        <p className="text-xs text-muted-foreground mt-2">Enter a client's Gymigo @username to send an invite.</p>
      </section>

      <section className="bg-gradient-card border border-border rounded-2xl p-6 shadow-card">
        <h2 className="font-bold mb-4">Your clients</h2>
        {data?.asCoach.length === 0 && <p className="text-sm text-muted-foreground">No clients yet.</p>}
        <div className="grid gap-2">
          {data?.asCoach.map((c: any) => (
            <div key={c.id} className="p-3 rounded-lg bg-secondary/40 flex items-center justify-between">
              <div>
                <p className="font-medium">{c.client?.display_name ?? "Client"}</p>
                <p className="text-xs text-muted-foreground capitalize">{c.status}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-card border border-border rounded-2xl p-6 shadow-card">
        <h2 className="font-bold mb-4">Your coaches</h2>
        {data?.asClient.length === 0 && <p className="text-sm text-muted-foreground">No coaches yet.</p>}
        <div className="grid gap-2">
          {data?.asClient.map((c: any) => (
            <div key={c.id} className="p-3 rounded-lg bg-secondary/40 flex items-center justify-between">
              <div>
                <p className="font-medium">{c.coach?.display_name ?? "Coach"}</p>
                <p className="text-xs text-muted-foreground capitalize">{c.status}</p>
              </div>
              {c.status === "pending" && (
                <div className="flex gap-1">
                  <button onClick={() => respond(c.id, "active")} className="p-2 rounded-md bg-success text-success-foreground"><Check className="w-4 h-4" /></button>
                  <button onClick={() => respond(c.id, "declined")} className="p-2 rounded-md bg-destructive text-destructive-foreground"><X className="w-4 h-4" /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
