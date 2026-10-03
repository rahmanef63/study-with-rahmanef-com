import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { PwaInstallButton } from "./install-button";
import { canOfferPwaInstall } from "./install-availability";

test("install is offered only when the browser has a prompt and the app is not installed", () => {
  expect(canOfferPwaInstall({ hasPrompt: true, standalone: false })).toBe(true);
  expect(canOfferPwaInstall({ hasPrompt: false, standalone: false })).toBe(false);
  expect(canOfferPwaInstall({ hasPrompt: true, standalone: true })).toBe(false);
  expect(canOfferPwaInstall({ hasPrompt: false, standalone: true })).toBe(false);
});

test("the button is absent until a prompt exists, including the server render", () => {
  expect(renderToStaticMarkup(<PwaInstallButton />)).toBe("");
});

test("the control sits in the shared nav, which is both the sidebar and the dock drawer", () => {
  const nav = readFileSync("components/shell/shell-nav.tsx", "utf8");
  const dock = readFileSync("components/shell/shell-dock.tsx", "utf8");
  expect(nav).toContain("PwaInstallButton");
  expect(dock).toContain("<ShellNav");
  // Not a fifth dock cell. The drawer is the sheet that renders ShellNav.
  expect(dock).not.toContain("PwaInstallButton");
});
