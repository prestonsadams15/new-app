import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

/**
 * Hash-based routes so every section and page has its own URL on the website:
 *
 *   #/                         → District home
 *   #/<section>                → Section overview  (e.g. #/safety)
 *   #/<section>/<page>         → Page              (e.g. #/safety/visitors)
 *
 * Hash routes work on any static host (GitHub Pages, Netlify, S3) without server rewrites.
 * On iOS/Android the route lives in memory only.
 */
export type Route = { sectionId: string | null; tabId: string | null };

const HOME: Route = { sectionId: null, tabId: null };
const isWeb = Platform.OS === 'web' && typeof window !== 'undefined';

export function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').map((part) => decodeURIComponent(part.trim())).filter(Boolean);
  if (!parts.length) return HOME;
  return { sectionId: parts[0], tabId: parts[1] ?? null };
}

export function routeToHash(route: Route): string {
  if (!route.sectionId) return '#/';
  return `#/${encodeURIComponent(route.sectionId)}${route.tabId ? `/${encodeURIComponent(route.tabId)}` : ''}`;
}

export function sameRoute(a: Route, b: Route): boolean {
  return a.sectionId === b.sectionId && a.tabId === b.tabId;
}

export function useHashRoute(): [Route, (next: Route, options?: { replace?: boolean }) => void] {
  const [route, setRoute] = useState<Route>(() => (isWeb ? parseRoute(window.location.hash) : HOME));

  useEffect(() => {
    if (!isWeb) return;
    const onChange = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener('hashchange', onChange);
    window.addEventListener('popstate', onChange);
    return () => {
      window.removeEventListener('hashchange', onChange);
      window.removeEventListener('popstate', onChange);
    };
  }, []);

  const navigate = useCallback((next: Route, options?: { replace?: boolean }) => {
    setRoute((current) => (sameRoute(current, next) ? current : next));
    if (!isWeb) return;
    const hash = routeToHash(next);
    if (window.location.hash === hash) return;
    if (options?.replace) window.history.replaceState(null, '', hash);
    else window.history.pushState(null, '', hash);
  }, []);

  return [route, navigate];
}

export function setDocumentTitle(title: string) {
  if (isWeb && typeof document !== 'undefined') document.title = title;
}
