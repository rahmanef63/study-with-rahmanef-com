// When the browser will actually show an install dialog.
//
// Chromium fires `beforeinstallprompt` once the page is installable. The event
// is single-use: after `prompt()` it will not fire again until the browser
// decides to offer install once more. iOS Safari never fires it, and a page
// already running as an installed app (`display-mode: standalone` or
// `minimal-ui`, or the legacy iOS `navigator.standalone` flag) must not grow a
// button that cannot do anything.
//
// One listener, shared by every mounted copy of the button. The nav renders
// twice — the desktop rail and the phone drawer — and two listeners would each
// hold the same event, so the second click would call `prompt()` on a consumed
// event.

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let promptEvent: InstallPromptEvent | null = null;
const subscribers = new Set<() => void>();
let listening = false;

function emit() {
  for (const notify of subscribers) notify();
}

/** Already running as an installed app, so there is nothing to install. */
export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  if (nav.standalone === true) return true;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches
  );
}

/** The only case the button is allowed to exist. */
export function canOfferPwaInstall(input: {
  hasPrompt: boolean;
  standalone: boolean;
}): boolean {
  return input.hasPrompt && !input.standalone;
}

function ensureListening() {
  if (listening || typeof window === "undefined") return;
  listening = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    if (isStandaloneDisplay()) return;
    promptEvent = event as InstallPromptEvent;
    emit();
  });

  window.addEventListener("appinstalled", () => {
    promptEvent = null;
    emit();
  });

  const onMode = () => {
    if (!isStandaloneDisplay()) return;
    promptEvent = null;
    emit();
  };
  window.matchMedia("(display-mode: standalone)").addEventListener("change", onMode);
  window.matchMedia("(display-mode: minimal-ui)").addEventListener("change", onMode);
}

export function subscribeInstall(onChange: () => void): () => void {
  ensureListening();
  subscribers.add(onChange);
  return () => {
    subscribers.delete(onChange);
  };
}

export function readInstallOffer(): boolean {
  return canOfferPwaInstall({
    hasPrompt: promptEvent !== null,
    standalone: isStandaloneDisplay(),
  });
}

/** Opens the browser install dialog. Safe to call when no prompt is stored. */
export async function promptPwaInstall(): Promise<void> {
  const event = promptEvent;
  if (event === null) return;
  // Drop it before awaiting so a second click, including the other nav copy,
  // cannot call prompt() on an event the browser has already consumed.
  promptEvent = null;
  emit();
  await event.prompt();
  try {
    await event.userChoice;
  } catch {
    // The dialog closed without a choice we can read. The button stays hidden
    // until the browser fires beforeinstallprompt again.
  }
}
