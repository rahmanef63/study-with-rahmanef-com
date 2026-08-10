/// <reference types="react/canary" />
import * as React from "react"

/**
 * Re-export of React's built-in <ViewTransition>, plus the ONE place in the
 * repo that has to know how it is wired in this Next version.
 *
 * Verified against next@16.2.10 / react@19.2.7, not guessed:
 *   · `experimental.viewTransition: true` (next.config.mjs) is the switch. It
 *     does NOT pull in the experimental React channel — see
 *     next/dist/lib/needs-experimental-react.js, which lists only taint,
 *     transitionIndicator and gestureTransition.
 *   · The bundler aliases bare `react` to next/dist/compiled/react
 *     (next/dist/build/create-compiler-aliases.js), and that build exports
 *     `ViewTransition` (unprefixed) and `addTransitionType`. The userland
 *     react@19.2.7 in node_modules does not — which is exactly why nothing may
 *     import ViewTransition outside a Next-bundled module, and why this file
 *     is the single import site.
 *   · Types come from @types/react's canary declarations, pulled in by the
 *     triple-slash reference above. A `import {} from "react/canary"` would be
 *     emitted as a real side-effect import under `isolatedModules` and crash at
 *     runtime, because there is no such module on disk.
 *
 * `name` gives an element its own snapshot, which pulls it OUT of the page-wide
 * `root` snapshot. globals.css reserves two names — "app-nav" and "app-tabbar"
 * — and pins them so persistent chrome does not slide off with the content.
 */
export const ViewTransition = React.ViewTransition
