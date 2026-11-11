import localforage from 'localforage';
import CryptoJS from 'crypto-js';
import type { VaultData } from '../types';

const db = localforage.createInstance({ name: 'VaultSpend', storeName: 'encrypted_vault', description: 'Encrypted local VaultSpend data' });
const KEY_SLOT = 'vault_key_v1';
const DATA_SLOT = 'vault_data_v1';

const emptyData = (): VaultData => ({
  expenses: [],
  categories: ['Fuel', 'Himmie', 'Rent', 'Essentials', 'Shopping', 'Groceries', 'Food', 'Transport', 'Entertainment', 'Trip', 'Meds', 'Gift', 'Other'],
  people: ['Myself', 'Family', 'Friends'],
  updatedAt: new Date().toISOString()
});

// A per-browser random key is generated once and retained in IndexedDB.
// This protects stored records from casual inspection; it is not protection
// against XSS or an attacker who controls the logged-in browser profile.
async function getKey(): Promise<string> {
  let key = await db.getItem<string>(KEY_SLOT);
  if (!key) {
    key = CryptoJS.lib.WordArray.random(32).toString();
    await db.setItem(KEY_SLOT, key);
  }
  return key;
}

export async function loadVault(): Promise<VaultData> {
  const cipher = await db.getItem<string>(DATA_SLOT);
  if (!cipher) {
    const initial = emptyData();
    await saveVault(initial);
    return initial;
  }
  try {
    const key = await getKey();
    const bytes = CryptoJS.AES.decrypt(cipher, key);
    const plain = bytes.toString(CryptoJS.enc.Utf8);
    if (!plain) throw new Error('Unable to decrypt local data');
    return JSON.parse(plain) as VaultData;
  } catch {
    throw new Error('Local VaultSpend data could not be decrypted. Do not clear site storage; restore from your Drive backup if available.');
  }
}

export async function saveVault(data: VaultData): Promise<void> {
  const key = await getKey();
  const cipher = CryptoJS.AES.encrypt(JSON.stringify({ ...data, updatedAt: new Date().toISOString() }), key).toString();
  await db.setItem(DATA_SLOT, cipher);
}

export async function clearLocalVault(): Promise<void> {
  await db.removeItem(DATA_SLOT);
  await db.removeItem(KEY_SLOT);
}
