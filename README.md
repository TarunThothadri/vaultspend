# VaultSpend

Offline-first, responsive React + TypeScript PWA expense tracker. The first login creates a local vault. If the local vault is empty, users can restore an existing Google Drive backup or import their own Excel/CSV transactions.

## Requirements
- Node.js 20.19+ or 22.12+
- Google Cloud project with Drive API enabled
- HTTPS in production (localhost is accepted for local development)

## Setup
```bash
npm install
cp .env.example .env
# Set VITE_GOOGLE_CLIENT_ID to your Google OAuth Web client ID
npm run dev
```
Open http://localhost:5173.

## Build
```bash
npm run build
npm run preview
```
Deploy the `dist/` directory to an HTTPS static host. Configure the host's SPA fallback to `/index.html`.

## Google OAuth setup
1. Open https://console.cloud.google.com/ and create/select a project.
2. APIs & Services → Library → enable **Google Drive API**.
3. APIs & Services → OAuth consent screen. Configure app name, support email, developer contact. Add test users while in Testing. For personal use, keep scopes limited to `openid`, `email`, `profile`, and `https://www.googleapis.com/auth/drive.file`.
4. APIs & Services → Credentials → Create Credentials → OAuth client ID → Web application.
5. Add `http://localhost:5173` to **Authorized JavaScript origins**. For production, add your exact HTTPS origin, e.g. `https://vaultspend.example.com`.
6. Do not add a client secret to this frontend. This app uses Google Identity Services' browser token flow; only the public Web client ID belongs in `.env`.
7. Copy the client ID into `.env`:
   `VITE_GOOGLE_CLIENT_ID=...apps.googleusercontent.com`
8. Restart the dev server after editing `.env`.

## Import format
The first worksheet is read. Required columns: `Date`, `Expense`; recommended columns: `Category`, `For/With`, `Description`. Date accepts Excel dates or `DD-MM-YYYY` / `YYYY-MM-DD`. Amount must be a positive number. Imported rows are merged into the local list; importing the same file twice can create duplicates.

## Data and security notes
- Local transaction data is stored in IndexedDB via localForage and encrypted with AES. A random key is stored in the same browser's IndexedDB. This is useful against casual inspection, but **is not strong protection against XSS, malware, or someone with access to the unlocked browser profile**. For stronger protection, derive the key from a user-held passphrase and never store that passphrase/key alongside the ciphertext.
- Google OAuth access tokens are short-lived. Google does not provide a permanent browser login token. The app remembers the account profile locally, but a Drive operation after token expiry requires the user to sign in again. This is intentional; never store access tokens in localStorage.
- `drive.file` is the narrow Drive scope. The app creates/finds its own `ExpenseTracker_Backup` folder and manages `expenses.json` there.
- The app does not upload automatically. Backup runs only when the user clicks **Backup to Drive**.
- When the local vault is empty, the app offers **Restore from Google Drive**. This downloads the existing `expenses.json` backup and saves it into that device's encrypted IndexedDB vault. The restore action is user-initiated so Google can request a fresh short-lived access token when needed.
- Existing non-empty local data is not automatically overwritten by a Drive backup. If both devices have changed independently, this version does not merge concurrent edits or resolve conflicts. Back up deliberately after making changes on each device; do not edit the same vault on multiple devices simultaneously until conflict resolution is implemented.
- Service worker caches the app shell, not private transaction API responses. The app remains usable offline after the first successful load; Google sign-in and Drive backup require internet.
- PWA installation requires HTTPS except on localhost. iOS: Share → Add to Home Screen. Android/desktop Chromium: use the install icon or browser menu.

## Google Drive backup fixes

The Drive integration now creates `expenses.json` with its `parents` folder metadata only on the initial create request. When updating an existing backup, it omits `parents`, as required by Drive API v3. OAuth token requests use an empty `prompt` value so Google requests consent on first authorization rather than forcing the consent screen every time. Because Google Identity Services access tokens are short-lived and held in memory, the app obtains a fresh token when the user clicks Backup after a reload or token expiry; an already-granted scope should not require consent again.
