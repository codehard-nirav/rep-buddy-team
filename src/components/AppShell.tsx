import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  Home,
  BookOpen,
  BarChart3,
  Users,
  Trophy,
  Settings as SettingsIcon,
  LogOut,
  Plus,
  Calendar,
  Ruler,
  UserRound,
  ClipboardList,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import gymigoLogoAsset from "@/assets/gymigo-logo.png.asset.json";

const gymigoLogo = gymigoLogoAsset.url;

const NAV = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/exercises", label: "Exercises", icon: BookOpen },
  { to: "/routines", label: "Routines", icon: ClipboardList },
  { to: "/programs", label: "Programs", icon: Calendar },
  { to: "/progress", label: "Progress", icon: BarChart3 },
  { to: "/history", label: "History", icon: Calendar },
  { to: "/measurements", label: "Body", icon: Ruler },
  { to: "/feed", label: "Feed", icon: Users },
  { to: "/challenges", label: "Challenges", icon: Trophy },
  { to: "/coach", label: "Coach", icon: UserRound },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["me-profile"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, username")
        .eq("id", auth.user.id)
        .maybeSingle();
      return data;
    },
  });

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 border-r border-sidebar-border bg-sidebar">
        <div className="p-5 border-b border-sidebar-border">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img
              src={gymigoLogo}
              alt="Gymigo logo"
              width={36}
              height={36}
              className="w-9 h-9 rounded-lg shadow-glow"
            />
            <span className="font-display font-bold text-xl tracking-tight">Gymigo</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map((item) => (
            <NavLink key={item.to} {...item} />
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border space-y-2">
          <Link to="/profile" className="flex items-center gap-2 p-2 rounded-md hover:bg-sidebar-accent transition-colors">
            <div className="w-8 h-8 rounded-full bg-muted grid place-items-center overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
              ) : (
                <UserRound className="w-4 h-4" />
              )}
            </div>
            <span className="text-sm truncate">{profile?.display_name ?? "Profile"}</span>
          </Link>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-sidebar-accent text-sm text-muted-foreground"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-30 flex items-center justify-between px-4 h-14 border-b border-border bg-background/80 backdrop-blur">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src={gymigoLogo} alt="Gymigo logo" width={28} height={28} className="w-7 h-7 rounded-md" />
          <span className="font-display font-bold">Gymigo</span>
        </Link>
        <button onClick={() => setOpen((v) => !v)} className="text-sm px-3 py-1.5 rounded-md bg-secondary">
          Menu
        </button>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-40 pt-14 bg-background/95 backdrop-blur">
          <nav className="p-4 space-y-1">
            {NAV.map((item) => (
              <NavLink key={item.to} {...item} />
            ))}
            <button onClick={signOut} className="w-full flex items-center gap-2 p-3 rounded-md text-muted-foreground">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </nav>
        </div>
      )}

      <main className="flex-1 min-w-0 lg:pt-0 pt-14">
        {children}
      </main>

      {/* Floating start-workout FAB */}
      <Link
        to="/workout/new"
        className="fixed bottom-5 right-5 z-20 flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-primary text-primary-foreground font-semibold shadow-glow hover:scale-105 transition-transform"
      >
        <Plus className="w-5 h-5" />
        Start Workout
      </Link>
    </div>
  );
}

function NavLink({ to, label, icon: Icon }: { to: string; label: string; icon: typeof Home }) {
  return (
    <Link
      to={to}
      activeProps={{ className: "bg-sidebar-accent text-primary" }}
      className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  );
}
