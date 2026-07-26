import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/profile")({
  component: MyProfile,
});

function MyProfile() {
  const nav = useNavigate();
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: p } = await supabase.from("profiles").select("username, id").eq("id", data.user.id).maybeSingle();
      nav({ to: "/u/$username", params: { username: p?.username ?? p?.id ?? data.user.id }, replace: true });
    });
  }, [nav]);
  return <div className="p-8 text-muted-foreground">Loading profile…</div>;
}
