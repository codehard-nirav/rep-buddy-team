# Gymigo Engineering Documentation

Reference-quality documentation for the Gymigo codebase. Every implementation
change ships alongside a documentation update — docs are a first-class part of
each feature.

## Layout

```
docs/
├── architecture/     High-level system design, request lifecycle, boundaries
├── database/         Schema, indexes, migrations, RLS design notes
├── security/         AuthN/Z, RLS, rate limiting, threat model, checklists
├── observability/    Logging, error handling, monitoring, alerting
├── testing/          Unit / integration / RLS test standards
├── api/              Server function & route catalog
├── playbooks/        Step-by-step operational guides
├── adr/              Architecture Decision Records
├── performance/      Perf budgets, optimizations, benchmarks
├── deployment/       Publish, domains, environments
├── development/      Local dev, engineering standards, conventions
└── templates/        Copy-paste templates (feature, ADR, service, test, ...)
```

## Workstream Progress

The production-hardening initiative runs in seven ordered workstreams. Each
completes the full lifecycle **Audit → Design → ADR → Implementation → Tests
→ Documentation → Verification** before the next begins.

| # | Workstream | Status |
|---|------------|--------|
| 1 | Foundation (docs, standards, errors, logging) | ✅ Complete |
| 2 | Security (RLS audit, Zod, rate limit, threat model) | ✅ Complete |
| 3 | Architecture (services, repositories, loaders) | ✅ Complete |
| 4 | Database (indexes, query optimization) | ✅ Complete |
| 5 | Observability (structured logging + correlation IDs) | ✅ Complete |
| 6 | Testing (unit / RLS docs) | ✅ Complete |
| 7 | Final production audit | ✅ Complete → [`production-audit.md`](production-audit.md) |

## Entry Points

- New to the codebase → [`development/onboarding.md`](development/onboarding.md)
- Shipping a feature → [`playbooks/add-feature.md`](playbooks/add-feature.md)
- Adding a table → [`playbooks/add-table.md`](playbooks/add-table.md)
- Debugging prod → [`playbooks/debug-production.md`](playbooks/debug-production.md)
- Big design change → [`adr/README.md`](adr/README.md)
