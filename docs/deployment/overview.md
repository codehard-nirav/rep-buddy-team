# Deployment

## Environments
| Env | URL | Purpose |
|-----|-----|---------|
| Preview | `id-preview--<id>.lovable.app` | Live editor preview per branch/session |
| Preview stable | `project--<id>-dev.lovable.app` | Stable preview build (safe for external cron) |
| Production | `rep-buddy-team.lovable.app`, `gymigo.fit`, `www.gymigo.fit` | End users |

## Custom Domains
- `gymigo.fit` and `www.gymigo.fit` are connected. DNS: A records → `185.158.133.1`, TXT `_lovable` verification.

## Publishing
- Preview: automatic on every save.
- Production: manual via the Publish action in the editor.
- Secrets: server-side secrets take effect in preview immediately; publish to promote to prod.

## Environment Variables (public → client)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`
- `VITE_LOG_LEVEL` (optional)

## Environment Variables (server-only)
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `LOG_LEVEL` (optional)
- `LOVABLE_API_KEY` (managed; rotate via `lovable_api_key--rotate_lovable_api_key`)

## Runtime
Cloudflare Workers with `nodejs_compat`. Constraints documented in
`server-runtime` context — no child_process, no sharp/canvas, no `fs.watch`,
no `os.cpus`. Prefer Web APIs and pure JS.
