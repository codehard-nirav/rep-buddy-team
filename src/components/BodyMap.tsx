import { bodyBaseUrls, muscleOverlayUrls, type Sex } from "@/lib/muscle-map";

interface Props {
  primary?: string[];
  secondary?: string[];
  sex?: Sex;
  className?: string;
}

// Renders front + back grey silhouettes with primary (red-ish tint) and
// secondary (dimmer) muscle overlays. The base assets already carry color;
// we simply layer the images with mix-blend-mode for a decent effect.
export function BodyMap({ primary = [], secondary = [], sex = "male", className }: Props) {
  const base = bodyBaseUrls(sex);
  const primaryOverlays = muscleOverlayUrls(primary, sex);
  const secondaryOverlays = muscleOverlayUrls(secondary, sex);

  return (
    <div className={`grid grid-cols-2 gap-2 ${className ?? ""}`}>
      <View base={base.front} primary={primaryOverlays.filter((u) => u.includes("front"))} secondary={secondaryOverlays.filter((u) => u.includes("front"))} label="Front" />
      <View base={base.back} primary={primaryOverlays.filter((u) => u.includes("back"))} secondary={secondaryOverlays.filter((u) => u.includes("back"))} label="Back" />
    </div>
  );
}

function View({
  base,
  primary,
  secondary,
  label,
}: {
  base: string;
  primary: string[];
  secondary: string[];
  label: string;
}) {
  return (
    <div className="relative rounded-lg bg-muted/40 p-2 border border-border">
      <div className="relative aspect-[1/2] mx-auto max-w-[180px]">
        <img src={base} alt={`${label} body`} className="absolute inset-0 w-full h-full object-contain opacity-90" />
        {secondary.map((src) => (
          <img key={src} src={src} alt="" aria-hidden className="absolute inset-0 w-full h-full object-contain opacity-40" style={{ filter: "hue-rotate(20deg) saturate(1.5)" }} />
        ))}
        {primary.map((src) => (
          <img key={src} src={src} alt="" aria-hidden className="absolute inset-0 w-full h-full object-contain" style={{ filter: "drop-shadow(0 0 0.5px #ff4757)" }} />
        ))}
      </div>
      <p className="mt-1 text-center text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
