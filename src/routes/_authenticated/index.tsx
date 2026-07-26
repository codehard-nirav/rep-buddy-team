import { createFileRoute, redirect } from "@tanstack/react-router";

// /dashboard as the default authenticated landing has its own route. The
// pathless _authenticated layout itself never renders content at "/", so no
// index route is needed here.
export const Route = createFileRoute("/_authenticated/")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
