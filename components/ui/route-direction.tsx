"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

/**
 * Publishes `<html data-nav-dir="forward" | "back">` so the ::view-transition
 * rules in app/globals.css know which way the screen should travel.
 *
 * WHY THIS EXISTS. Next 16 forwards a <Link transitionTypes={[…]}> array into
 * React.addTransitionType, but it adds NOTHING for a history traversal
 * (`dispatchTraverseAction` in next/dist/client/components/app-router-instance
 * has no addTransitionType call). So the browser Back button — the single most
 * used navigation on a phone — is indistinguishable from a forward push unless
 * the history position is tracked by hand. That is all this file does.
 *
 * HOW. A cursor into a session-scoped stack of visited URLs:
 *   · a click on an internal link stamps "forward" in the CAPTURE phase, which
 *     runs before Next's own click handler and therefore before the snapshot;
 *   · a click on anything marked `data-nav-back` stamps "back" instead — that
 *     attribute is the sibling-facing API, see below;
 *   · `popstate` compares the new URL against the stack neighbours, so a
 *     FORWARD button press animates forward, not backwards;
 *   · after every committed navigation the stack is trimmed and extended, the
 *     same way a browser discards the forward entries after a new push.
 *
 * WHAT THE BROWSER BACK BUTTON DOES: nothing, and it cannot be fixed from here.
 * Next dispatches a history traversal as ACTION_RESTORE, which is the one
 * action type it deliberately keeps OUT of startTransition — the comment in
 * next/dist/client/components/app-router-instance.js says "it's important that
 * restore is handled quickly since it's fired on the popstate event and we
 * don't want to add any delay on a back/forward nav". No transition, so React
 * never opens a view transition and there is nothing to animate. Wrapping the
 * popstate in our own document.startViewTransition() was tried and MEASURED:
 * React has already committed the restored tree by the time the browser
 * captures the "old" snapshot, so the result is two identical frames
 * cross-fading. Hence `data-nav-back` on in-app back controls, which route
 * through a normal push and therefore do animate. The attribute is still
 * stamped on a real Back so that any transition that follows is correct.
 *
 * TIMING is the whole game for the forward case. The attribute has to be on
 * <html> before React commits, which the capture-phase click satisfies. The
 * reset back to "forward" is deliberately LATE — see RESET_DELAY_MS.
 */

const ATTR = "data-nav-dir"
const KEY = "nav-stack"
// Comfortably past the 220ms enter animation. Resetting sooner would unmatch
// the [data-nav-dir="back"] rules mid-flight and the animation would be
// dropped; the only thing this timer buys is that a PROGRAMMATIC router.push()
// right after a Back still reads as forward, so late is free and early is a bug.
const RESET_DELAY_MS = 400

type Stack = { urls: string[]; i: number }

function readStack(): Stack | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Stack
      if (Array.isArray(parsed.urls) && typeof parsed.i === "number") return parsed
    }
  } catch {
    // Private mode, quota, a hostile polyfill — a missing stack just means
    // every navigation reads as forward, which is the old behaviour.
  }
  // Null, NOT a fresh stack seeded from location.pathname: that seed always
  // matches the current URL, so the "did the URL change?" check below would
  // pass on every load and the stack would never get its first entry written.
  return null
}

function writeStack(stack: Stack) {
  try {
    // 50 entries is far more history than a session ever uses and keeps the
    // serialised blob under a kilobyte.
    if (stack.urls.length > 50) {
      stack.urls = stack.urls.slice(-50)
      stack.i = Math.min(stack.i, stack.urls.length - 1)
    }
    sessionStorage.setItem(KEY, JSON.stringify(stack))
  } catch {
    /* see readStack */
  }
}

export function RouteDirection() {
  const pathname = usePathname()

  React.useEffect(() => {
    const root = document.documentElement
    let resetTimer: ReturnType<typeof setTimeout> | undefined

    const setDir = (dir: "forward" | "back") => {
      root.setAttribute(ATTR, dir)
      clearTimeout(resetTimer)
      if (dir === "back") resetTimer = setTimeout(() => root.setAttribute(ATTR, "forward"), RESET_DELAY_MS)
    }

    const onClick = (event: MouseEvent) => {
      // Modified clicks open a new tab: no in-page navigation, no transition.
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const target = event.target as Element | null
      if (!target?.closest) return
      // THE OPT-IN: any control that means "go up/back" — a nav-bar chevron, a
      // "Kembali" button, a Link that walks the breadcrumb — marks itself
      // `data-nav-back` and the slide plays mirrored. This is the ONLY way to
      // get a backward animation (see the browser-Back note in the file
      // header), so it belongs on every in-app back affordance.
      if (target.closest("[data-nav-back]")) {
        setDir("back")
        return
      }
      const anchor = target.closest("a[href]")
      if (!(anchor instanceof HTMLAnchorElement)) return
      if (anchor.target && anchor.target !== "_self") return
      if (anchor.origin !== location.origin) return
      setDir("forward")
    }

    // Seed the entry the tab was opened on, once per session.
    if (!readStack()) writeStack({ urls: [location.pathname], i: 0 })

    const onPop = () => {
      const stack = readStack() ?? { urls: [location.pathname], i: 0 }
      const here = location.pathname
      if (stack.i > 0 && stack.urls[stack.i - 1] === here) {
        stack.i -= 1
        setDir("back")
      } else if (stack.i < stack.urls.length - 1 && stack.urls[stack.i + 1] === here) {
        stack.i += 1
        setDir("forward")
      } else {
        // A jump of more than one entry, or a URL we never recorded. Back is
        // the overwhelmingly likelier intent behind a popstate.
        const found = stack.urls.lastIndexOf(here)
        setDir(found !== -1 && found < stack.i ? "back" : "forward")
        if (found !== -1) stack.i = found
      }
      writeStack(stack)
    }

    // Capture phase: this must beat Next's own delegated click handler.
    document.addEventListener("click", onClick, true)
    window.addEventListener("popstate", onPop)
    return () => {
      clearTimeout(resetTimer)
      document.removeEventListener("click", onClick, true)
      window.removeEventListener("popstate", onPop)
    }
  }, [])

  // Record the committed URL. Runs after popstate has already moved the cursor,
  // so a traversal is a no-op here and only a real push extends the stack.
  React.useEffect(() => {
    const stack = readStack() ?? { urls: [pathname], i: 0 }
    if (stack.urls[stack.i] === pathname) return
    stack.urls = stack.urls.slice(0, stack.i + 1)
    stack.urls.push(pathname)
    stack.i = stack.urls.length - 1
    writeStack(stack)
  }, [pathname])

  return null
}
