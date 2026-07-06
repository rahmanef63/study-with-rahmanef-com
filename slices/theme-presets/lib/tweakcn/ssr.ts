// Server-only: synchronously build a preset's CSS so the host can inline it
// pre-hydration and kill the first-paint FOUC (neutral -> preset flash). No
// DOM, no dynamic import — mirrors writeVars() in apply.ts but returns a string.
import registryData from "./registry-data.json";
import { buildBlock, buildBrandBridge } from "./cssBuilder";
import type { TweakcnRegistry } from "./types";

const registry = registryData as unknown as TweakcnRegistry;

export function buildPresetCss(name: string | null): string {
  if (!name) return "";
  const preset = registry.items.find((i) => i.name === name);
  if (!preset) return "";
  const blocks: string[] = [];
  const { theme, light, dark } = preset.cssVars ?? {};
  if (theme) {
    const b = buildBlock(":root", theme);
    if (b) blocks.push(b);
  }
  if (light) {
    const b = buildBlock(":root", light);
    if (b) blocks.push(b);
    const bridge = buildBrandBridge(light);
    if (bridge) blocks.push(bridge);
  }
  if (dark) {
    const b = buildBlock(".dark", dark);
    if (b) blocks.push(b);
  }
  return blocks.join("\n\n");
}
