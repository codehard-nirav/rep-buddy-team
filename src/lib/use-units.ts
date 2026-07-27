import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useUnits(): "kg" | "lb" {
  const { data } = useQuery({
    queryKey: ["me-units"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return "kg" as const;
      const { data } = await supabase
        .from("profiles")
        .select("units")
        .eq("id", u.user.id)
        .maybeSingle();
      return (data?.units ?? "kg") as "kg" | "lb";
    },
    staleTime: 60_000,
  });
  return data ?? "kg";
}
