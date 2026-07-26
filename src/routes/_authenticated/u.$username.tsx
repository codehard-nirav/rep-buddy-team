import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, UserMinus, Trophy, Flame } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/u/$username")({
  component: UserProfile,
});

function UserProfile() {
  const { username } = Route.useParams();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["profile-by-username", username],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const meId = u.user?.id;
      // Try by username, then fall back to raw id
      let { data: p } = await supabase.from("profiles").select("*").eq("username", username).maybeSingle();
      if (!p) {
        const { data: p2 } = await supabase.from("profiles").select("*").eq("id", username).maybeSingle();
        p = p2;
      }
      if (!p) return null;
      const [{ count: workoutCount }, { data: follows }] = await Promise.all([
        supabase.from("workouts").select("id", { count: "exact", head: true }).eq("user_id", p.id).not("finished_at", "is", null),
        supabase.from("follows").select("follower_id, followed_id"),
      ]);
      const followers = (follows ?? []).filter((f: any) => f.followed_id === p.id).length;
      const followingCount = (follows ?? []).filter((f: any) => f.follower_id === p.id).length;
      const iFollow = !!(meId && (follows ?? []).find((f: any) => f.follower_id === meId && f.followed_id === p.id));
      return { profile: p, workoutCount: workoutCount ?? 0, followers, followingCount, iFollow, meId, isMe: meId === p.id };
    },
  });

  async function toggleFollow() {
    if (!data?.meId || !data.profile) return;
    if (data.iFollow) {
      await supabase.from("follows").delete().eq("follower_id", data.meId).eq("followed_id", data.profile.id);
    } else {
      const { error } = await supabase.from("follows").insert({ follower_id: data.meId, followed_id: data.profile.id } as any);
      if (error) toast.error(error.message);
    }
    qc.invalidateQueries({ queryKey: ["profile-by-username", username] });
  }

  if (!data) return <div className="p-8">Loading…</div>;
  const { profile, workoutCount, followers, followingCount, iFollow, isMe } = data;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <div className="bg-gradient-card border border-border rounded-2xl p-6 shadow-card mb-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-muted overflow-hidden grid place-items-center">
            {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" /> : <span className="text-2xl font-bold">{(profile.display_name ?? "?")[0]}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold">{profile.display_name ?? "Athlete"}</h1>
            {profile.username && <p className="text-sm text-muted-foreground">@{profile.username}</p>}
            {profile.bio && <p className="text-sm mt-1">{profile.bio}</p>}
          </div>
          {!isMe && (
            <button
              onClick={toggleFollow}
              className={`px-4 py-2 rounded-md font-semibold text-sm flex items-center gap-1 ${
                iFollow ? "bg-secondary" : "bg-gradient-primary text-primary-foreground"
              }`}
            >
              {iFollow ? <><UserMinus className="w-4 h-4" /> Following</> : <><UserPlus className="w-4 h-4" /> Follow</>}
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3 mt-6">
          <Stat icon={Trophy} label="Workouts" value={String(workoutCount)} />
          <Stat icon={Flame} label="Followers" value={String(followers)} />
          <Stat icon={Flame} label="Following" value={String(followingCount)} />
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: any) {
  return (
    <div className="text-center p-3 rounded-lg bg-secondary/40">
      <Icon className="w-4 h-4 mx-auto text-primary" />
      <p className="text-xl font-bold mt-1">{value}</p>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
