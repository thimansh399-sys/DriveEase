const LOCAL_API_BASE_URL = 'http://localhost:5000/api';
const PRODUCTION_API_BASE_URL = 'https://api.mydriveease.in/api';

const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '');

const isBrowser = typeof window !== 'undefined';

const isLocalHostname = (hostname = '') => ['localhost', '127.0.0.1', '::1'].includes(hostname);

export const API_BASE_URL = (() => {
  const configured = trimTrailingSlash(process.env.REACT_APP_API_URL || '');
  if (configured) {
    return configured;
  }

  if (isBrowser && !isLocalHostname(window.location.hostname)) {
    const host = (window.location.hostname || '').toLowerCase();
    if (host === 'mydriveease.in' || host === 'www.mydriveease.in') {
      return PRODUCTION_API_BASE_URL;
    }

    return '/api';
  }

  return LOCAL_API_BASE_URL;
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
    return `/${normalizedPath}`;
  }

  try {
    const origin = new URL(API_BASE_URL).origin;
    return `${origin}/${normalizedPath}`;
  } catch (_) {
    return `/${normalizedPath}`;
  }
};

export const getApiCandidates = () => {
  const candidates = [API_BASE_URL];

  if (API_BASE_URL !== '/api') {
    candidates.push('/api');
  }

  if (API_BASE_URL !== LOCAL_API_BASE_URL) {
    candidates.push(LOCAL_API_BASE_URL);
  }

  return [...new Set(candidates.map(trimTrailingSlash).filter(Boolean))];
};
