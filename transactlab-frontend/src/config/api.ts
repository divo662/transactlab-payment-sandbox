const DEFAULT_API_ORIGIN =
  'https://transactlab-api-f5fnb4d3apcpczhx.westeurope-01.azurewebsites.net';

/** Backend origin without trailing slash. Override with VITE_API_URL on Vercel. */
export const API_ORIGIN = (
  import.meta.env.VITE_API_URL || DEFAULT_API_ORIGIN
).replace(/\/$/, '');

export const API_BASE_URL = `${API_ORIGIN}/api/v1`;
export const SANDBOX_API_BASE = `${API_BASE_URL}/sandbox`;
export const MAGIC_SDK_API_BASE = `${API_BASE_URL}/magic-sdk`;
export const LIVE_API_BASE = `${API_BASE_URL}/live`;

export function resolveBackendAssetUrl(path: string): string {
  if (!path) return path;
  if (path.startsWith('http')) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_ORIGIN}${normalized}`;
}

export function sandboxPayQlUrl(token: string, query = ''): string {
  const qs = query ? `?${query}` : '';
  return `${API_ORIGIN}/sandbox/pay/ql/${encodeURIComponent(token)}${qs}`;
}

export function sandboxPayQlStartUrl(token: string, query = ''): string {
  const qs = query ? `?${query}` : '';
  return `${API_ORIGIN}/sandbox/pay/ql/${encodeURIComponent(token)}/start${qs}`;
}

export const DOCS_PATH = '/transactlab-docs';

/** Current frontend origin (custom domain or Vercel). */
export function getFrontendOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  const fromEnv = import.meta.env.VITE_FRONTEND_URL;
  if (fromEnv) return String(fromEnv).replace(/\/$/, '');
  return 'https://transactlab.divinenzeh.click';
}

export function getDocsUrl(): string {
  return `${getFrontendOrigin()}${DOCS_PATH}`;
}

export function openDocsInNewTab(): void {
  if (typeof window !== 'undefined') {
    window.open(getDocsUrl(), '_blank', 'noopener,noreferrer');
  }
}
