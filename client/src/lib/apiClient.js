// One configured Axios instance for the whole app.
//
//  - baseURL points at the API. In dev, Vite proxies /api to the Express server.
//  - the access token is kept in memory (not localStorage) and attached to every request.
//  - on a 401 we try one silent refresh via /auth/refresh, then replay the request once.

import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

export const api = axios.create({
  baseURL,
  withCredentials: true, // send the httpOnly refresh cookie
});

// ---- access token, held in memory only ----
let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token;
};
export const getAccessToken = () => accessToken;

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// ---- single-flight refresh on 401 ----
let refreshRequest = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const isAuthCall = original?.url?.includes('/auth/');

    if (status === 401 && original && !original._retried && !isAuthCall) {
      original._retried = true;
      try {
        // Share one refresh call if several requests 401 at the same time.
        refreshRequest = refreshRequest || api.post('/auth/refresh');
        const { data } = await refreshRequest;
        refreshRequest = null;
        setAccessToken(data.accessToken);
        return api(original);
      } catch (refreshError) {
        refreshRequest = null;
        setAccessToken(null);
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

// Turns an Axios error into a plain string for the UI.
export const errorMessage = (error, fallback = 'Something went wrong') =>
  error?.response?.data?.error?.message || error?.message || fallback;

// Absolute URL for an API path (for links the browser fetches directly, like a
// public brochure PDF).
export const apiUrl = (path) =>
  `${(import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')}${path}`;

// Fetches a file through the authenticated client and hands it to the browser.
export const downloadFile = async (path, fileName) => {
  const res = await api.get(path, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName || 'download';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};

// Opens an authenticated PDF in a new tab.
export const openPdf = async (path) => {
  const res = await api.get(path, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
};
