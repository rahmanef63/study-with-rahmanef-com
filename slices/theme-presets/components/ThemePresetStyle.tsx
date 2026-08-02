// Server component — inline the build-time preset's vars into the initial HTML
// so the first paint already wears the preset (no neutral -> preset flash).
// Uses the SAME id the client injector reuses (STYLE_ID), so once JS boots the
// client just updates textContent: no flash, no duplicate <style>.
import { STYLE_ID } from "../lib/tweakcn/types";
import { buildPresetCss } from "../lib/tweakcn/ssr";

export function ThemePresetStyle({ preset }: { preset: string | null }) {
  const css = buildPresetCss(preset);
  if (!css) return null;
  return <style id={STYLE_ID} dangerouslySetInnerHTML={{ __html: css }} />;
}
