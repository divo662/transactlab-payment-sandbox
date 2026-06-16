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
