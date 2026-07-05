# Feedback States

The "no real content to show yet" placeholder family, in two co-located
variants. Install one surface or all of them:

```bash
npx rr add feedback-states loading   # skeletons + spinners
npx rr add feedback-states empty      # 404/500/403 + zero-data
npx rr add feedback-states            # both — import the component you need
```

## loading

```tsx
import { LoadingSkeleton, LoadingState } from "@/features/feedback-states";

<LoadingSkeleton kind="table" columns={4} />        // text|card|list|table|form|page|block
<LoadingState variant="overlay" label="Saving…" />  // inline|block|overlay
```

Drop `kind="page"` straight into a route `loading.tsx`.

## empty

```tsx
import { EmptyState, ErrorPage } from "@/features/feedback-states";

<EmptyState kind="404" primaryAction={{ label: "Back home" }} />  // 404|500|403|no-results|empty-list|first-use
<ErrorPage kind="500" />                                          // full-page wrapper
```

Both variants are pure UI — no backend, no store. Presets are overridable per
use; the `*.configure` agentic tool merge-patches props.
