# Loader Patterns

Every route with data-fetching follows one of two shapes. Pick by whether the
data is cross-route reusable.

## Shape A — TanStack Query (default)

Use when the data is likely to be read from more than one place or benefits
from cache invalidation.

```tsx
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";

const workoutsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["workouts", userId],
    queryFn: () => listWorkouts({ data: { userId } }),
  });

export const Route = createFileRoute("/_authenticated/history")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(workoutsQueryOptions(context.userId)),
  component: History,
  errorComponent: ({ error }) => <ErrorState error={error} />,
  pendingComponent: () => <ListSkeleton />,
});

function History() {
  const { data } = useSuspenseQuery(workoutsQueryOptions(userId));
  return <WorkoutList items={data} />;
}
```

## Shape B — Loader-only

Use for single-consumer, single-render reads (detail pages, one-off data).

```tsx
export const Route = createFileRoute("/_authenticated/workout/$id")({
  loader: ({ params }) => getWorkout({ data: { id: params.id } }),
  component: WorkoutDetail,
  errorComponent: ({ error }) => <ErrorState error={error} />,
  notFoundComponent: () => <NotFound resource="Workout" />,
});

function WorkoutDetail() {
  const workout = Route.useLoaderData();
  return <WorkoutView workout={workout} />;
}
```

## URL state vs component state

Filters, sort, page, and search go in the URL. Never in `useState`.

```tsx
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";

const searchSchema = z.object({
  q: z.string().optional(),
  offset: z.number().int().nonnegative().default(0),
});

export const Route = createFileRoute("/_authenticated/exercises")({
  validateSearch: zodValidator(searchSchema),
  loaderDeps: ({ search: { q, offset } }) => ({ q, offset }),
  loader: ({ deps }) => listExercises({ data: deps }),
  component: Exercises,
});

function Exercises() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  return (
    <SearchInput
      value={q ?? ""}
      onChange={(v) =>
        navigate({ search: (p) => ({ ...p, q: v, offset: 0 }) })
      }
    />
  );
}
```

## Rules

- Every route with a `loader` has both `errorComponent` and (for detail routes)
  `notFoundComponent`.
- Loaders return only SSR-serializable DTOs — no `Date` (unless the RPC
  serializer handles it), no class instances, no functions.
- Never call browser APIs (`window`, `localStorage`) in a loader.
- Never fetch from a browser client inside a loader for authenticated data;
  use a server function under `requireSupabaseAuth`.
- Never call a protected server function from a public route loader. Protected
  loaders belong under `_authenticated/`.
- Refactoring `useState` → search params: replace **all** setters in one pass,
  then delete the state declarations. Half-migrated files break the build.

## Anti-patterns

- `useEffect(() => fetch(...), [])` — replace with a Query-backed loader.
- `useQuery` + `isLoading` render branch — use `useSuspenseQuery` + a
  `pendingComponent`.
- Passing full `search` object to `loaderDeps` — causes over-refetch.
- `staleTime: 0` combined with expensive derived state — bump `staleTime` for
  reference lists (exercises, muscles).
