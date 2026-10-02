import type { Instrumentation } from "next";

// Log only framework categories. URLs, query strings, headers and error payloads
// may contain user data or OAuth credentials and must never enter these logs.
export const onRequestError: Instrumentation.onRequestError = (_error, _request, context) => {
  console.error("[request:error]", {
    router: context.routerKind,
    routeType: context.routeType,
  });
};
