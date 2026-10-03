"use client";
import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { extractAnalyticsError } from "../lib/errors";
import type { PlatformAnalyticsCopy } from "../config/platform-copy";

type Props = { children: ReactNode; copy: PlatformAnalyticsCopy; onRetry: () => void };
/** Keep the admin shell and navigation available when the reactive query fails. */
export class PlatformQueryBoundary extends Component<Props, { error: unknown }> {
  state = { error: null as unknown };
  static getDerivedStateFromError(error: unknown) { return { error }; }
  render() {
    if (this.state.error === null) return this.props.children;
    const code = extractAnalyticsError(this.state.error).code;
    const denied = code === "NOT_AUTHENTICATED" || code === "NOT_AUTHORIZED";
    return <div role="alert" className="space-y-3 border-l-4 border-primary px-4 py-3 text-sm"><p>{denied ? this.props.copy.denied : this.props.copy.error}</p>{denied ? null : <Button variant="outline" className="min-h-11" onClick={this.props.onRetry}>{this.props.copy.recovery}</Button>}</div>;
  }
}
