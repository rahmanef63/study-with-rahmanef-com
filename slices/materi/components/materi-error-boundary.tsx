"use client";
// materi slice — a LOCAL error boundary for the member-gated reads.
//
// Why this exists. `getBySlug` throws NOT_FOUND for an unknown slug, a deleted
// materi AND a draft below instructor level — one indistinguishable code, on
// purpose (a 404-vs-403 difference is an existence oracle). convex/react
// surfaces a query error by throwing during render, so without a boundary here
// a mistyped URL takes the whole app to app/error.tsx: full-screen crash copy,
// no community chrome, no way back except the browser button. That is the
// wrong response to "this materi is not here".
//
// Scoped to the island, so the header, the tabs and the bottom bar all survive.
// Anything that is NOT one of our typed codes is RE-THROWN from render — a
// genuine bug must still reach the app boundary and the logs.
import { Component, type ReactNode } from "react";
import { extractMateriError } from "../lib/errors";

type Props = {
  children: ReactNode;
  fallback: ReactNode;
  /**
   * Reset the boundary when this changes — pass the materi slug. Client
   * navigation from /materi/a to /materi/b keeps this instance mounted (same
   * route segment, new param), so without it one bad slug would poison every
   * materi opened afterwards until a hard reload.
   */
  resetKey: string;
};
type State = { error: unknown; resetKey: string };

export class MateriErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null, resetKey: props.resetKey };
  }

  static getDerivedStateFromError(error: unknown): Partial<State> {
    return { error };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    return props.resetKey === state.resetKey
      ? null
      : { error: null, resetKey: props.resetKey };
  }

  render() {
    if (this.state.error !== null) {
      // Not our contract → let it climb to app/error.tsx.
      if (extractMateriError(this.state.error).code === undefined) throw this.state.error;
      return this.props.fallback;
    }
    return this.props.children;
  }
}
