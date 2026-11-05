import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_URL_KEY = 'al_mulk_custom_supabase_url';
const STORAGE_ANON_KEY = 'al_mulk_custom_supabase_anon_key';

export function normalizeSupabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim().replace(/^['"]|['"]$/g, '');
  url = url.replace(/\/rest\/v1\/?$/i, '');
  url = url.replace(/\/+$/, '');
  return url;
}

export function cleanSupabaseKey(rawKey: string): string {
  if (!rawKey) return '';
  return rawKey.trim().replace(/^['"]|['"]$/g, '');
}

export const DEFAULT_SUPABASE_URL = 'https://dariqcmfjnoopecliyar.supabase.co';
export const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhcmlxY21mam5vb3BlY2xpeWFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxMzcwNzIsImV4cCI6MjEwODcxMzA3Mn0.Rp-bqdEl6FF2yIIYINyPyoaxOV8toCDZovLOLuikeUM';

export function getStoredSupabaseCredentials(): { url: string; key: string } {
  let url = '';
  let key = '';

  try {
    url = localStorage.getItem(STORAGE_URL_KEY) || '';
    key = localStorage.getItem(STORAGE_ANON_KEY) || '';
  } catch (e) {
    // ignore
  }

  if (!url) {
    url = (import.meta.env.VITE_SUPABASE_URL as string) || DEFAULT_SUPABASE_URL;
  }
  if (!key) {
    key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || DEFAULT_SUPABASE_KEY;
  }

  return { url: normalizeSupabaseUrl(url), key: cleanSupabaseKey(key) };
}

export function saveStoredSupabaseCredentials(url: string, key: string) {
  try {
    const cleanUrl = normalizeSupabaseUrl(url);
    const cleanKey = cleanSupabaseKey(key);
    if (cleanUrl) {
      localStorage.setItem(STORAGE_URL_KEY, cleanUrl);
    } else {
      localStorage.removeItem(STORAGE_URL_KEY);
    }

    if (cleanKey) {
      localStorage.setItem(STORAGE_ANON_KEY, cleanKey);
    } else {
      localStorage.removeItem(STORAGE_ANON_KEY);
    }
  } catch (e) {
    console.warn('Could not save Supabase credentials to localStorage:', e);
  }
}

let cachedClient: SupabaseClient | null = null;
let cachedUrl = '';
let cachedKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key } = getStoredSupabaseCredentials();

  if (!url || !key) {
    return null;
  }

  if (cachedClient && cachedUrl === url && cachedKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: { persistSession: false },
    });
    cachedUrl = url;
    cachedKey = key;
    return cachedClient;
  } catch (err) {
    console.error('Failed to create Supabase client:', err);
    return null;
  }
}

export async function testSupabaseConnection(customUrl?: string, customKey?: string): Promise<{
  success: boolean;
  message: string;
  visitsCount?: number;
  referralsCount?: number;
}> {
  const { url, key } = customUrl && customKey 
    ? { url: customUrl, key: customKey }
    : getStoredSupabaseCredentials();

  if (!url || !key) {
    return {
      success: false,
      message: 'Parameter URL atau Anon Key Supabase belum terisi.',
    };
  }

  try {
    const client = createClient(url, key, {
      auth: { persistSession: false },
    });

    const { count: vCount, error: vErr } = await client
      .from('marketing_visits')
      .select('*', { count: 'exact', head: true });

    if (vErr) {
      if (vErr.code === '42P01') {
        return {
          success: true,
          message: 'Terhubung ke Supabase! Namun tabel "marketing_visits" belum dibuat. Silakan jalankan Skrip SQL DDL.',
          visitsCount: 0,
          referralsCount: 0,
        };
      }
      return {
        success: false,
        message: `Error koneksi Supabase: ${vErr.message}`,
      };
    }

    const { count: rCount } = await client
      .from('referral_records')
      .select('*', { count: 'exact', head: true });

    return {
      success: true,
      message: 'Terhubung dengan sukses ke database Supabase!',
      visitsCount: vCount || 0,
      referralsCount: rCount || 0,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal menghubungkan ke Supabase: ${err.message || 'Error tidak diketahui'}`,
    };
  }
}
