import { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";
import { Timer, X, Minus, Plus, SkipForward, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const LS_KEY = "gymigo:rest-timer";

/** OFF is represented as null. */
export type RestPref = number | null;

/** OFF, 0–60s in 1s steps, 1m05s–5m in 5s steps. */
export function restOptions(): number[] {
  const out: number[] = [];
  for (let s = 0; s <= 60; s++) out.push(s);
  for (let s = 65; s <= 300; s += 5) out.push(s);
  return out;
}

export function formatRest(s: number) {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r === 0 ? `${m}m` : `${m}m ${r}s`;
}

function readLocal(): RestPref | undefined {
  if (typeof window === "undefined") return undefined;
  const raw = window.localStorage.getItem(LS_KEY);
  if (raw === null) return undefined;
  if (raw === "off") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

function writeLocal(v: RestPref) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_KEY, v === null ? "off" : String(v));
}

export type RestTimerHandle = { start: () => void };

export const RestTimer = forwardRef<RestTimerHandle, { dbDefault?: number | null }>(function RestTimer(
  { dbDefault },
  ref,
) {
  // Configured default rest duration; null = OFF.
  const [pref, setPref] = useState<RestPref>(() => {
    const local = readLocal();
    return local === undefined ? 90 : local;
  });
  const [hydrated, setHydrated] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const prefRef = useRef<RestPref>(pref);
  prefRef.current = pref;

  // Load persisted preference: local wins (it can express OFF), else DB value.
  useEffect(() => {
    if (hydrated) return;
    const local = readLocal();
    if (local !== undefined) setPref(local);
    else if (dbDefault !== undefined) setPref(dbDefault ? dbDefault : null);
    setHydrated(true);
  }, [dbDefault, hydrated]);

  const savePref = useCallback(async (v: RestPref) => {
    setPref(v);
    writeLocal(v);
    const { data: u } = await supabase.auth.getUser();
    if (u.user) {
      await supabase.from("profiles").update({ rest_timer_seconds: v ?? 0 }).eq("id", u.user.id);
    }
  }, []);

  useImperativeHandle(ref, () => ({
    start: () => {
      const p = prefRef.current;
      if (p === null) return; // OFF
      setRemaining(p);
    },
  }));

  // Single countdown.
  useEffect(() => {
    if (remaining === null) return;
    if (remaining <= 0) {
      const done = setTimeout(() => setRemaining(null), 800);
      return () => clearTimeout(done);
    }
    const t = setTimeout(() => setRemaining((r) => (r === null ? null : r - 1)), 1000);
    return () => clearTimeout(t);
  }, [remaining]);

  const active = remaining !== null;
  const mm = Math.floor((remaining ?? 0) / 60);
  const ss = (remaining ?? 0) % 60;

  return (
    <>
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-20 w-[min(92vw,26rem)]">
        {active ? (
          <div className="bg-card/95 backdrop-blur border border-primary rounded-2xl shadow-card p-3 flex items-center gap-2">
            <button
              onClick={() => setRemaining((r) => Math.max(0, (r ?? 0) - 15))}
              className="px-3 py-2 rounded-xl bg-secondary/70 hover:bg-secondary text-xs font-bold inline-flex items-center gap-1"
            >
              <Minus className="w-3.5 h-3.5" />15
            </button>
            <div className="flex-1 text-center">
              <p className="text-2xl font-extrabold tabular-nums leading-none">
                {mm}:{String(ss).padStart(2, "0")}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Rest</p>
            </div>
            <button
              onClick={() => setRemaining((r) => (r ?? 0) + 15)}
              className="px-3 py-2 rounded-xl bg-secondary/70 hover:bg-secondary text-xs font-bold inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />15
            </button>
            <button
              onClick={() => setRemaining(null)}
              className="px-3 py-2 rounded-xl bg-gradient-primary text-primary-foreground text-xs font-bold inline-flex items-center gap-1"
            >
              <SkipForward className="w-3.5 h-3.5" /> Skip
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={() => setPickerOpen(true)}
              className="px-4 py-2 rounded-full bg-card/90 backdrop-blur border border-border text-xs font-semibold inline-flex items-center gap-1.5 shadow-card"
            >
              <Timer className="w-3.5 h-3.5" /> Rest: {pref === null ? "OFF" : formatRest(pref)}
            </button>
          </div>
        )}
      </div>

      {pickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-end sm:place-items-center">
          <div className="bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full max-w-sm max-h-[75vh] flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold">Rest timer</h3>
              <button onClick={() => setPickerOpen(false)} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-2">
              <button
                onClick={() => {
                  void savePref(null);
                  setRemaining(null);
                  setPickerOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold ${
                  pref === null ? "bg-primary/15 text-primary" : "hover:bg-secondary/60"
                }`}
              >
                OFF {pref === null && <Check className="w-4 h-4" />}
              </button>
              {restOptions().map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    void savePref(s);
                    setPickerOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm ${
                    pref === s ? "bg-primary/15 text-primary font-semibold" : "hover:bg-secondary/60"
                  }`}
                >
                  {formatRest(s)} {pref === s && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
});
