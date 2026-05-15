// Centralized API configuration and helper functions
export const API = process.env.REACT_APP_API_URL || 'http://localhost:4000';

export async function apiGet(path) {
  const res = await fetch(`${API}${path}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`API GET ${path} failed: ${res.status}`);
  }
  return res.json();
}

export async function apiPost(path, body = {}) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`API POST ${path} failed: ${res.status}`);
  }
  return res.json();
}

export async function apiDelete(path) {
  const res = await fetch(`${API}${path}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`API DELETE ${path} failed: ${res.status}`);
  }
  return res.json();
}

// Resolve image URLs: convert relative paths to full URLs
export function resolveImageUrl(imgPath) {
  if (!imgPath) return null;
  if (typeof imgPath !== 'string') return null;
  if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) return imgPath;
  if (imgPath.startsWith('/images/')) return `${API}${imgPath}`;
  if (imgPath.includes('/images/')) return imgPath.includes('http') ? imgPath : `${API}${imgPath}`;
  // assume it's a filename, prepend /images/
  return `${API}/images/${imgPath}`;
}

export default { API, apiGet, apiPost, apiDelete, resolveImageUrl };
