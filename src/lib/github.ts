export const OWNER = 'Shafeeq-Cybersec';
export const REPO = 'Shafeeq-Cybersec.github.io';
export const BRANCH = 'main';

const API_BASE = `https://api.github.com/repos/${OWNER}/${REPO}`;

export class GitHubApiError extends Error {}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export function utf8ToBase64(str: string): string {
  return uint8ToBase64(new TextEncoder().encode(str));
}

export function base64ToUtf8(b64: string): string {
  const binary = atob(b64.replace(/\n/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
  };
}

export async function verifyToken(token: string): Promise<{ login: string }> {
  const res = await fetch(`${API_BASE}`, { headers: headers(token) });
  if (!res.ok) throw new GitHubApiError('Invalid token or no access to this repository.');
  const res2 = await fetch('https://api.github.com/user', { headers: headers(token) });
  if (!res2.ok) throw new GitHubApiError('Invalid token.');
  const data = await res2.json();
  return { login: data.login };
}

export async function getFile(token: string, path: string): Promise<{ content: string; sha: string } | null> {
  const res = await fetch(`${API_BASE}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}?ref=${BRANCH}`, {
    headers: headers(token),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new GitHubApiError(`Failed to fetch ${path}: ${res.status}`);
  const data = await res.json();
  return { content: base64ToUtf8(data.content), sha: data.sha };
}

export async function putFile(
  token: string,
  path: string,
  base64Content: string,
  message: string,
  sha?: string
): Promise<void> {
  const res = await fetch(`${API_BASE}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`, {
    method: 'PUT',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content: base64Content, branch: BRANCH, ...(sha ? { sha } : {}) }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new GitHubApiError(`Failed to write ${path}: ${res.status} ${body}`);
  }
}

export async function deleteFile(token: string, path: string, sha: string, message: string): Promise<void> {
  const res = await fetch(`${API_BASE}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`, {
    method: 'DELETE',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sha, branch: BRANCH }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new GitHubApiError(`Failed to delete ${path}: ${res.status} ${body}`);
  }
}

export function slugifyFilename(name: string): string {
  const dot = name.lastIndexOf('.');
  const base = dot > -1 ? name.slice(0, dot) : name;
  const ext = dot > -1 ? name.slice(dot) : '';
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug || 'file'}-${Date.now()}${ext.toLowerCase()}`;
}
