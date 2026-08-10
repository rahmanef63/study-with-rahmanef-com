// Ported from notion-page-clone editor/page-editor/PageNotFound.tsx — empty
// state for a missing page. SEAM/DROP: the source's "Back home" button used the
// app router (useNavigate("/")). The editor seam only exposes per-page
// navigation (navigateToPage(pageId)), not an app-level home route, so the
// home-navigation affordance is dropped — the host owns app routing and renders
// its own chrome around this. The message is preserved.
export function PageNotFound() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">🕊️</div>
        <h2 className="text-xl font-semibold mb-2">Page not found</h2>
        <p className="text-muted-foreground text-sm">This page may have been moved or deleted.</p>
      </div>
    </div>
  );
}
