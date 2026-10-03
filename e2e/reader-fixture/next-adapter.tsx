import { lazy, Suspense, useSyncExternalStore, type AnchorHTMLAttributes, type ComponentType } from "react";

const subscribe = (callback: () => void) => {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
};
export function useFixtureParams() {
  return new URLSearchParams(useSyncExternalStore(subscribe, () => location.search, () => ""));
}
export function navigate(href: string) {
  history.pushState(null, "", href);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
export function usePathname() { return location.pathname; }
export function useRouter() { return { push: navigate, replace: navigate, back: () => history.back() }; }

function FixtureLink({ href, onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a {...props} href={href} onClick={(event) => {
    onClick?.(event);
    if (event.defaultPrevented || !href || event.ctrlKey || event.metaKey || event.shiftKey || props.target) return;
    const url = new URL(href, location.href);
    if (url.origin !== location.origin) return;
    event.preventDefault();
    navigate(url.pathname + url.search + url.hash);
  }} />;
}

function fixtureDynamic<P extends object>(load: () => Promise<ComponentType<P>>, options?: { loading?: ComponentType }) {
  const Component = lazy(async () => ({ default: await load() }));
  const Loading = options?.loading;
  return function FixtureDynamic(props: P) {
    return <Suspense fallback={Loading ? <Loading /> : null}><Component {...props} /></Suspense>;
  };
}

export { FixtureLink, fixtureDynamic };
export default FixtureLink;
