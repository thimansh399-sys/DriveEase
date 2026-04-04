const LOCAL_API_BASE_URL = 'http://localhost:5000/api';
const PRODUCTION_API_BASE_URL = 'https://driveease-pshj.onrender.com/api';
const PRODUCTION_API_ORIGIN = 'https://driveease-pshj.onrender.com';

const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '');

const isBrowser = typeof window !== 'undefined';

const isLocalHostname = (hostname = '') => ['localhost', '127.0.0.1', '::1'].includes(hostname);

export const API_BASE_URL = (() => {
  const configured = trimTrailingSlash(process.env.REACT_APP_API_URL || '');

  if (isBrowser) {
    const host = (window.location.hostname || '').toLowerCase();

    // For deployed frontend domains, always use same-origin proxy to avoid CORS and stale env URLs.
    if (!isLocalHostname(host)) {
      return '/api';
    }

    if (configured) {
      return configured;
    }

    return LOCAL_API_BASE_URL;
  }

  if (configured) {
    return configured;
  }

  return PRODUCTION_API_BASE_URL;
})();

export const buildApiUrl = (path = '') => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export const buildAssetUrl = (assetPath = '') => {
  if (!assetPath) {
    return '';
  }

  if (/^https?:\/\//i.test(assetPath)) {
    return assetPath;
  }

  const normalizedPath = assetPath
    .replace(/^.*uploads[/\\]/, 'uploads/')
    .replace(/^\/+/, '');

  if (API_BASE_URL.startsWith('/')) {
    const configured = trimTrailingSlash(process.env.REACT_APP_API_URL || '');
    if (configured) {
      try {
        return `${new URL(configured).origin}/${normalizedPath}`;
      } catch (_) {
        // fall through to production origin
      }
    }
    return `${PRODUCTION_API_ORIGIN}/${normalizedPath}`;
  }

  try {
    const origin = new URL(API_BASE_URL).origin;
    return `${origin}/${normalizedPath}`;
  } catch (_) {
    return `/${normalizedPath}`;
  }
};

export const getApiCandidates = () => {
  if (isBrowser) {
    const host = (window.location.hostname || '').toLowerCase();

    if (!isLocalHostname(host)) {
      return ['/api'];
    }
  }

  const candidates = [API_BASE_URL];

  if (API_BASE_URL !== '/api') {
    candidates.push('/api');
  }

  if (API_BASE_URL !== LOCAL_API_BASE_URL) {
    candidates.push(LOCAL_API_BASE_URL);
  }

  return [...new Set(candidates.map(trimTrailingSlash).filter(Boolean))];
};
