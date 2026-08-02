// Consumer-grade defineFeature — sanitize-lift of rr's zod-validated version
// (template-base/frontend/shared/lib/features/defineFeature.ts). The rr site
// validates feature configs with zod at publish time; a consumer app only
// needs the typed shape, so this is a typed identity fn with zero deps.
// TODO(rr): confirm — chose minimal stub over full zod lift because the full
// version drags zod + FEATURE_* constants that only the rr catalog uses.
import type { ComponentType } from "react";

export type FeatureRoute = {
  path: string;
  view: () => Promise<{ default: ComponentType } | Record<string, unknown>>;
};

export type FeatureConfig = {
  slug: string;
  title: string;
  category: string;
  routes?: FeatureRoute[];
  nav?: { label: string; group?: string; order?: number };
};

export function defineFeature<T extends FeatureConfig>(config: T): T {
  return config;
}
