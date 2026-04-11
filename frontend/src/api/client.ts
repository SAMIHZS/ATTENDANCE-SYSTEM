import { supabase } from '../lib/supabase';

const API_BASE = '/api/v1';

async function fetchWithAuth(url: string, options: RequestInit & { params?: any; responseType?: 'json' | 'blob' } = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  
  let fullUrl = `${API_BASE}${url}`;
  if (options.params) {
    const q = new URLSearchParams();
    Object.entries(options.params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) q.append(k, String(v));
    });
    fullUrl += `?${q.toString()}`;
  }

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }

  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const responseData = await response.json().catch(() => ({}));
    throw new Error(responseData.message || 'API request failed');
  }

  if (options.responseType === 'blob') {
    const blob = await response.blob();
    return { data: blob };
  }

  const responseData = await response.json();
  return { data: responseData };
}

export const apiClient = {
  get: (url: string, options?: any) => fetchWithAuth(url, { ...options, method: 'GET' }),
  post: (url: string, body?: any) => fetchWithAuth(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: (url: string, body?: any) => fetchWithAuth(url, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: (url: string) => fetchWithAuth(url, { method: 'DELETE' }),
};
