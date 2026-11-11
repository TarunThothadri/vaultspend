import type { GoogleUser, VaultData } from '../types';

declare global {
  interface Window {
    google?: any;
  }
}

const FOLDER = 'ExpenseTracker_Backup';
const FILE = 'expenses.json';
const SCOPES = 'https://www.googleapis.com/auth/drive.file openid email profile';
let accessToken = '';
let tokenExpiresAt = 0;

export function getSavedUser(): GoogleUser | null {
  const raw = localStorage.getItem('vaultspend_user');
  return raw ? JSON.parse(raw) as GoogleUser : null;
}

export function signOutLocal() {
  localStorage.removeItem('vaultspend_user');
  accessToken = '';
  tokenExpiresAt = 0;
}

async function requestGoogleAccessToken(): Promise<string> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('Set VITE_GOOGLE_CLIENT_ID in your .env file first.');
  await waitForGoogle();
  const token = await new Promise<string>((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (response: any) => response.error ? reject(new Error(response.error_description || response.error)) : resolve(response.access_token),
      error_callback: (error: any) => reject(new Error(error.message || 'Google sign-in failed'))
    });
    // Empty prompt: Google asks for consent only on the first authorization.
    // Do not use 'consent' here; it forces the consent screen on every login.
    client.requestAccessToken({ prompt: '' });
  });
  accessToken = token;
  tokenExpiresAt = Date.now() + 55 * 60 * 1000;
  return token;
}

export async function signIn(): Promise<GoogleUser> {
  await requestGoogleAccessToken();
  const profile = await api('https://www.googleapis.com/oauth2/v2/userinfo');
  const user: GoogleUser = { name: profile.name || profile.email, email: profile.email, picture: profile.picture };
  localStorage.setItem('vaultspend_user', JSON.stringify(user));
  return user;
}

function waitForGoogle(): Promise<void> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const poll = () => {
      if (window.google?.accounts?.oauth2) return resolve();
      if (Date.now() - started > 12000) return reject(new Error('Google Identity Services did not load. Check your network and reload.'));
      window.setTimeout(poll, 150);
    };
    poll();
  });
}

async function ensureToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiresAt) return accessToken;
  // The GIS token model does not persist access tokens across page reloads.
  // Re-request one when the user explicitly starts a Drive operation. Since
  // prompt is empty, an already-approved user is not asked to consent again.
  return requestGoogleAccessToken();
}

async function api(url: string, init: RequestInit = {}) {
  const token = await ensureToken();
  const response = await fetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init.headers || {}) } });
  if (!response.ok) throw new Error(`Google API error ${response.status}: ${await response.text()}`);
  return response.status === 204 ? null : response.json();
}

async function findFolder(): Promise<string> {
  const q = encodeURIComponent(`name='${FOLDER}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const result = await api(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&pageSize=10`);
  if (result.files?.length) return result.files[0].id;
  const created = await api('https://www.googleapis.com/drive/v3/files?fields=id', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: FOLDER, mimeType: 'application/vnd.google-apps.folder' })
  });
  return created.id;
}

export async function backupToDrive(data: VaultData): Promise<void> {
  // Obtain/refresh the short-lived token directly from the Backup button flow.
  await ensureToken();
  const folderId = await findFolder();
  const q = encodeURIComponent(`name='${FILE}' and '${folderId}' in parents and trashed=false`);
  const result = await api(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)&pageSize=10`);
  // parents is writable only on file creation. For PATCH/update requests,
  // Drive requires addParents/removeParents query parameters instead. This
  // file is already found inside folderId, so an update must not send parents.
  const metadata = result.files?.length
    ? { name: FILE, mimeType: 'application/json' }
    : { name: FILE, mimeType: 'application/json', parents: [folderId] };
  const boundary = 'vaultspend_boundary';
  const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(data, null, 2)}\r\n--${boundary}--`;
  const url = result.files?.length
    ? `https://www.googleapis.com/upload/drive/v3/files/${result.files[0].id}?uploadType=multipart`
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
  const response = await fetch(url, {
    method: result.files?.length ? 'PATCH' : 'POST',
    headers: { Authorization: `Bearer ${await ensureToken()}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body
  });
  if (!response.ok) throw new Error(`Drive backup failed (${response.status}): ${await response.text()}`);
}

export async function restoreFromDrive(): Promise<VaultData | null> {
  await ensureToken();
  const folderId = await findFolder();
  const q = encodeURIComponent(`name='${FILE}' and '${folderId}' in parents and trashed=false`);
  const result = await api(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)&pageSize=10`);
  if (!result.files?.length) return null;
  const token = await ensureToken();
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${result.files[0].id}?alt=media`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error('Could not download Drive backup.');
  return await response.json() as VaultData;
}
