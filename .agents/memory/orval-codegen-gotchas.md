---
name: Orval codegen gotchas
description: Two traps after running orval codegen that cause confusing TS errors in consuming artifacts
---

After `pnpm --filter @workspace/api-spec run codegen`:

1. `lib/api-client-react` is a composite TS project; consumers resolve its
   stale `dist/*.d.ts`, so newly added exports (hooks, query-key helpers)
   appear "missing". Run `npx tsc -b` inside `lib/api-client-react` after
   codegen before typechecking consumers.
2. Orval v8 hook options require `queryKey` inside `options.query` (e.g.
   `{ query: { queryKey: getGetXQueryKey(...), retry: false } }`) — omitting
   it is a TS error.

**Why:** a design subagent burned a review cycle on exactly these errors.
**How to apply:** any task touching `lib/api-spec/openapi.yaml` + codegen
should rebuild declarations and pass explicit queryKeys in hook options.
