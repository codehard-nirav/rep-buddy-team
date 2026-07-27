# Onboarding

## Prerequisites
- Bun ≥ 1.1
- Access to the Lovable project (Supabase managed via Lovable Cloud)

## Local Setup
```bash
bun install
bun run dev   # http://localhost:8080
```

## Tour
- Read [`architecture/overview.md`](../architecture/overview.md).
- Skim [`engineering-standards.md`](./engineering-standards.md).
- Shipping something? Start with [`playbooks/add-feature.md`](../playbooks/add-feature.md).

## Key Commands
| Task | Command |
|------|---------|
| Dev server | `bun run dev` |
| Lint | `bun run lint` |
| Format | `bun run format` |
| Build | `bun run build` |

## Environment Variables

Client (build-time, prefixed `VITE_`):
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`
- `VITE_LOG_LEVEL` (optional)

Server (runtime, injected by Worker):
- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `LOG_LEVEL` (optional)

Never read `process.env` at module scope — always inside a server-fn handler.
