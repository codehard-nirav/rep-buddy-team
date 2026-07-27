# Template: Feature Spec

## Summary
One paragraph describing the user-visible change.

## Users & Access
- Who can invoke this?
- Which roles?
- Access matrix:
  | Role | Read | Create | Update | Delete |
  |------|------|--------|--------|--------|
  | owner | ✅ | ✅ | ✅ | ✅ |
  | coach of owner | ✅ | ❌ | ❌ | ❌ |
  | other authenticated | ❌ | ❌ | ❌ | ❌ |
  | anonymous | ❌ | ❌ | ❌ | ❌ |

## Data
- New tables / columns / enums
- Indexes
- RLS policies

## Server Contract
- Zod schema signature
- Server fn name + return DTO

## Frontend
- Route(s) touched
- `queryOptions` key(s) invalidated on mutate

## Edge Cases
- Empty state
- Failure modes
- Concurrency / race

## Instrumentation
- Log events emitted
- Error codes returned

## Docs
- ADR? (link)
- Playbook updates
