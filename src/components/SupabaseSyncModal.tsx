import React, { useState, useEffect } from 'react';
import { 
  Database, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  CloudUpload, 
  CloudDownload, 
  Copy, 
  Check, 
  Terminal, 
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Key,
  Globe,
  Sliders
} from 'lucide-react';
import { MarketingVisitRecord, SegmentType } from '../types/marketingVisit';
import { CleanReferralRecord, PaymentCategory, AgeGroup } from '../types/referral';
import { 
  getStoredSupabaseCredentials, 
  saveStoredSupabaseCredentials, 
  testSupabaseConnection, 
  getSupabaseClient 
} from '../utils/supabaseClient';
import { saveRecordsToIndexedDB } from '../utils/indexedDbStorage';

function cleanIsoDate(val: any): string | null {
  if (!val) return null;
  if (typeof val !== 'string') return null;
  const trimmed = val.trim();
  if (!trimmed || trimmed === 'Invalid Date') return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.includes('T')) {
    const part = trimmed.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(part)) return part;
  }

  if (/^\d{1,2}[\/-]\d{1,2}[\/-]\d{4}$/.test(trimmed)) {
    const parts = trimmed.split(/[\/-]/);
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return null;
}

interface SupabaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  visits: MarketingVisitRecord[];
  onVisitsLoaded: (visits: MarketingVisitRecord[]) => void;
  referrals: CleanReferralRecord[];
  onReferralsLoaded?: (referrals: CleanReferralRecord[]) => void;
}

interface SupabaseStatus {
  configured: boolean;
  connected: boolean;
  projectUrl: string | null;
  visitsCount: number;
  referralsCount: number;
  errorDetail: string | null;
  message: string;
}

export const SupabaseSyncModal: React.FC<SupabaseSyncModalProps> = ({
  isOpen,
  onClose,
  visits,
  onVisitsLoaded,
  referrals,
  onReferralsLoaded,
}) => {
  const [status, setStatus] = useState<SupabaseStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncingVisits, setSyncingVisits] = useState(false);
  const [fetchingVisits, setFetchingVisits] = useState(false);
  const [syncingReferrals, setSyncingReferrals] = useState(false);
  const [fetchingReferrals, setFetchingReferrals] = useState(false);
  const [sqlSchema, setSqlSchema] = useState<string>('');
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'sync' | 'credentials' | 'sql' | 'vercel'>('sync');

  // Input states for direct UI credentials
  const [inputUrl, setInputUrl] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [testingCustom, setTestingCustom] = useState(false);

  // Auto sync preference
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(() => {
    return localStorage.getItem('al_mulk_auto_sync_supabase') === 'true';
  });

  const toggleAutoSync = () => {
    const nextVal = !autoSyncEnabled;
    setAutoSyncEnabled(nextVal);
    localStorage.setItem('al_mulk_auto_sync_supabase', String(nextVal));
    setFeedback({
      type: 'info',
      message: nextVal
        ? 'Sinkronisasi otomatis diaktifkan. Setiap impor berkas baru akan otomatis dikirim ke Supabase.'
        : 'Sinkronisasi otomatis dinonaktifkan.',
    });
  };

  // Fetch Supabase status & SQL schema
  const fetchStatus = async () => {
    setLoading(true);
    setFeedback(null);

    const saved = getStoredSupabaseCredentials();
    if (saved.url && !inputUrl) setInputUrl(saved.url);
    if (saved.key && !inputKey) setInputKey(saved.key);

    try {
      const res = await fetch('/api/supabase/status');
      if (res.ok) {
        const data = await res.json();
        
        if (data.connected) {
          setStatus(data);
        } else {
          const clientTest = await testSupabaseConnection(saved.url, saved.key);
          setStatus({
            configured: clientTest.success || !!saved.url,
            connected: clientTest.success,
            projectUrl: saved.url || data.projectUrl,
            visitsCount: clientTest.visitsCount || data.visitsCount || 0,
            referralsCount: clientTest.referralsCount || data.referralsCount || 0,
            errorDetail: clientTest.success ? null : clientTest.message,
            message: clientTest.success
              ? 'Terhubung langsung melalui Supabase Client SDK (Browser Direct & Vercel Ready).'
              : (data.message || clientTest.message),
          });
        }
      } else {
        const clientTest = await testSupabaseConnection(saved.url, saved.key);
        setStatus({
          configured: clientTest.success || !!saved.url,
          connected: clientTest.success,
          projectUrl: saved.url || null,
          visitsCount: clientTest.visitsCount || 0,
          referralsCount: clientTest.referralsCount || 0,
          errorDetail: clientTest.success ? null : clientTest.message,
          message: clientTest.message,
        });
      }

      const schemaRes = await fetch('/api/supabase/schema');
      if (schemaRes.ok) {
        const schemaData = await schemaRes.json();
        setSqlSchema(schemaData.sql || '');
      } else {
        setSqlSchema(FALLBACK_SQL_SCHEMA);
      }
    } catch (err: any) {
      const clientTest = await testSupabaseConnection(saved.url, saved.key);
      setStatus({
        configured: clientTest.success || !!saved.url,
        connected: clientTest.success,
        projectUrl: saved.url || null,
        visitsCount: clientTest.visitsCount || 0,
        referralsCount: clientTest.referralsCount || 0,
        errorDetail: clientTest.success ? null : clientTest.message,
        message: clientTest.message,
      });
      setSqlSchema(FALLBACK_SQL_SCHEMA);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  const handleSaveAndTestCredentials = async () => {
    if (!inputUrl || !inputKey) {
      setFeedback({ type: 'error', message: 'Silakan isi URL Supabase dan Anon API Key terlebih dahulu.' });
      return;
    }

    setTestingCustom(true);
    setFeedback(null);

    const testRes = await testSupabaseConnection(inputUrl.trim(), inputKey.trim());
    if (testRes.success) {
      saveStoredSupabaseCredentials(inputUrl.trim(), inputKey.trim());
      setFeedback({
        type: 'success',
        message: 'Koneksi Supabase berhasil diverifikasi dan disimpan ke memori aplikasi! Kredensial ini siap digunakan.',
      });
      fetchStatus();
    } else {
      setFeedback({
        type: 'error',
        message: `Gagal menghubungkan: ${testRes.message}`,
      });
    }
    setTestingCustom(false);
  };

  const handleCopySql = () => {
    const textToCopy = sqlSchema || FALLBACK_SQL_SCHEMA;
    navigator.clipboard.writeText(textToCopy);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleCopyVercelEnv = () => {
    const urlVal = inputUrl || status?.projectUrl || 'https://your-project.supabase.co';
    const keyVal = inputKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
    
    const envString = `# ========================================================
# VARIABLE ENVIRONMENT UNTUK DEPLOYMENT VERCEL & AI STUDIO
# RSUD AL-MULK MARKET INTELLIGENCE
# ========================================================
VITE_SUPABASE_URL="${urlVal}"
VITE_SUPABASE_ANON_KEY="${keyVal}"

SUPABASE_URL="${urlVal}"
SUPABASE_ANON_KEY="${keyVal}"

# GEMINI_API_KEY (Untuk AI Strategist)
GEMINI_API_KEY="${import.meta.env.VITE_GEMINI_API_KEY || ''}"
`;

    navigator.clipboard.writeText(envString);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2500);
  };

  // Sync current visits to Supabase
  const handleSyncVisits = async () => {
    if (!visits || visits.length === 0) {
      setFeedback({ type: 'error', message: 'Tidak ada data kunjungan untuk disinkronkan.' });
      return;
    }
    setSyncingVisits(true);
    setFeedback(null);

    const { url: sUrl, key: sKey } = getStoredSupabaseCredentials();

    try {
      const res = await fetch('/api/supabase/sync-visits', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-supabase-url': sUrl || '',
          'x-supabase-key': sKey || '',
        },
        body: JSON.stringify({ visits }),
      });
      const data = await res.json();
      if (data && data.success) {
        setFeedback({ 
          type: 'success', 
          message: data.message || `Berhasil menyinkronkan ${visits.length} data kunjungan ke Supabase!` 
        });
        fetchStatus();
      } else {
        const client = getSupabaseClient();
        if (client) {
          const seenIds = new Set<string>();
          const rows: any[] = [];
          for (let i = 0; i < visits.length; i++) {
            const v = visits[i];
            let rowId = v.id ? String(v.id).trim() : '';
            if (!rowId || seenIds.has(rowId)) {
              rowId = `visit-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`;
            }
            seenIds.add(rowId);

            rows.push({
              id: rowId,
              visit_date: cleanIsoDate(v.tanggalKunjungan),
              target_location: String(v.lokasiTujuan || 'Lokasi Kunjungan').trim(),
              segment_type: String(v.jenisSegmen || 'Lainnya').trim(),
              address: String(v.alamat || '').trim(),
              purpose: String(v.maksudKunjungan || '').trim(),
              notes: String(v.catatanHasil || '').trim(),
              updated_at: new Date().toISOString(),
            });
          }

          let directSuccess = true;
          let count = 0;
          const CHUNK = 100;
          for (let i = 0; i < rows.length; i += CHUNK) {
            const chunk = rows.slice(i, i + CHUNK);
            const { error } = await client.from('marketing_visits').upsert(chunk, { onConflict: 'id' });
            if (error) {
              directSuccess = false;
              const isMissing = error.code === '42P01' || error.message?.includes('does not exist');
              setFeedback({ 
                type: 'error', 
                message: isMissing 
                  ? "Tabel 'marketing_visits' belum dibuat di Supabase. Salin dan jalankan skrip di tab 'Pensalinan Skrip SQL DDL'." 
                  : `Supabase: ${error.message}` 
              });
              break;
            }
            count += chunk.length;
          }

          if (directSuccess) {
            setFeedback({
              type: 'success',
              message: `Berhasil menyinkronkan ${count} data kunjungan langsung via Supabase Client!`,
            });
            fetchStatus();
          }
        } else {
          setFeedback({ type: 'error', message: data?.error || 'Gagal menyinkronkan data kunjungan ke Supabase.' });
        }
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Koneksi gagal saat menyinkronkan kunjungan.' });
    } finally {
      setSyncingVisits(false);
    }
  };

  // Fetch visits from Supabase
  const handleFetchVisits = async () => {
    setFetchingVisits(true);
    setFeedback(null);
    const { url: sUrl, key: sKey } = getStoredSupabaseCredentials();

    try {
      const res = await fetch('/api/supabase/fetch-visits', {
        headers: {
          'x-supabase-url': sUrl || '',
          'x-supabase-key': sKey || '',
        },
      });
      const data = await res.json();
      if (data && data.success && data.visits && data.visits.length > 0) {
        const mappedVisits: MarketingVisitRecord[] = data.visits.map((v: any) => ({
          id: v.id,
          tanggalKunjungan: v.visitDate || v.tanggalKunjungan,
          lokasiTujuan: v.targetLocation || v.lokasiTujuan,
          jenisSegmen: (v.segmentType || v.jenisSegmen || 'Lainnya') as SegmentType,
          alamat: v.address || v.alamat || '',
          wilayah: v.address ? v.address.split(',')[0] : 'Kota Sukabumi',
          maksudKunjungan: v.purpose || v.maksudKunjungan || '',
          catatanHasil: v.notes || v.catatanHasil || '',
        }));
        onVisitsLoaded(mappedVisits);
        setFeedback({
          type: 'success',
          message: `Berhasil memuat ${mappedVisits.length} data kunjungan dari Supabase ke aplikasi!`,
        });
        fetchStatus();
      } else {
        const client = getSupabaseClient();
        if (client) {
          const { data: dbData, error } = await client
            .from('marketing_visits')
            .select('*')
            .order('visit_date', { ascending: false });

          if (!error && dbData && dbData.length > 0) {
            const mapped: MarketingVisitRecord[] = dbData.map((r: any) => ({
              id: r.id,
              tanggalKunjungan: r.visit_date,
              lokasiTujuan: r.target_location,
              jenisSegmen: (r.segment_type as SegmentType) || 'Lainnya',
              alamat: r.address || '',
              wilayah: r.address ? r.address.split(',')[0] : 'Kota Sukabumi',
              maksudKunjungan: r.purpose || '',
              catatanHasil: r.notes || '',
            }));
            onVisitsLoaded(mapped);
            setFeedback({
              type: 'success',
              message: `Berhasil memuat ${mapped.length} data kunjungan langsung dari Supabase Client!`,
            });
            fetchStatus();
          } else {
            setFeedback({
              type: 'info',
              message: error ? `Supabase: ${error.message}` : 'Tabel marketing_visits di Supabase masih kosong.',
            });
          }
        } else {
          setFeedback({ type: 'error', message: data?.error || 'Gagal memuat data dari Supabase.' });
        }
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Koneksi gagal saat membaca data kunjungan.' });
    } finally {
      setFetchingVisits(false);
    }
  };

  // Sync referrals records to Supabase
  const handleSyncReferrals = async () => {
    if (!referrals || referrals.length === 0) {
      setFeedback({ type: 'error', message: 'Tidak ada data rujukan untuk disinkronkan.' });
      return;
    }
    setSyncingReferrals(true);
    setFeedback(null);

    const { url: sUrl, key: sKey } = getStoredSupabaseCredentials();

    try {
      const res = await fetch('/api/supabase/sync-referrals', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-supabase-url': sUrl || '',
          'x-supabase-key': sKey || '',
        },
        body: JSON.stringify({ records: referrals }),
      });
      const data = await res.json();
      if (data && data.success) {
        setFeedback({
          type: 'success',
          message: data.message || `Berhasil menyinkronkan rujukan ke Supabase!`,
        });
        fetchStatus();
      } else {
        const client = getSupabaseClient();
        if (client) {
          const seenIds = new Set<string>();
          const rows: any[] = [];
          for (let idx = 0; idx < referrals.length; idx++) {
            const r = referrals[idx];
            let rowId = r.id ? String(r.id).trim() : '';
            if (!rowId || seenIds.has(rowId)) {
              rowId = `ref-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
            }
            seenIds.add(rowId);

            rows.push({
              id: rowId,
              entry_date: cleanIsoDate(r.tanggalMasuk),
              referrer_name: String(r.perujukClean || r.perujukRaw || 'Perujuk Tidak Tercatat').trim(),
              referrer_type: String(r.kategoriPerujuk === 'Internal' ? 'internal' : 'eksternal'),
              referrer_address: String(r.alamatPerujukRaw || '').trim(),
              target_poli: String(r.poliTujuan || '').trim(),
              diagnosis: String(r.diagnosaAwal || '').trim(),
              payment_method: String(r.kategoriPembayaran || 'Umum/Tunai').trim(),
              patient_age_group: String(r.kelompokUsia || '').trim(),
              patient_address: String(r.alamatPasienRaw || r.wilayahPasienNormal || '').trim(),
              created_at: new Date().toISOString(),
            });
          }

          let directSuccess = true;
          const CHUNK = 100;
          let count = 0;
          for (let i = 0; i < rows.length; i += CHUNK) {
            const chunk = rows.slice(i, i + CHUNK);
            const { error } = await client.from('referral_records').upsert(chunk, { onConflict: 'id' });
            if (error) {
              directSuccess = false;
              const isMissing = error.code === '42P01' || error.message?.includes('does not exist');
              setFeedback({ 
                type: 'error', 
                message: isMissing 
                  ? "Tabel 'referral_records' belum dibuat di Supabase. Salin dan jalankan skrip di tab 'Pensalinan Skrip SQL DDL'." 
                  : `Supabase: ${error.message}` 
              });
              break;
            }
            count += chunk.length;
          }

          if (directSuccess) {
            setFeedback({
              type: 'success',
              message: `Berhasil menyinkronkan ${count} data rujukan via Supabase Client!`,
            });
            fetchStatus();
          }
        } else {
          setFeedback({
            type: 'error',
            message: data?.error || 'Gagal menyinkronkan data rujukan ke Supabase.',
          });
        }
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Koneksi gagal saat menyinkronkan rujukan.' });
    } finally {
      setSyncingReferrals(false);
    }
  };

  // Fetch Referral Records from Supabase
  const handleFetchReferrals = async () => {
    setFetchingReferrals(true);
    setFeedback(null);
    const { url: sUrl, key: sKey } = getStoredSupabaseCredentials();
    try {
      const res = await fetch('/api/supabase/fetch-referrals', {
        headers: {
          'x-supabase-url': sUrl || '',
          'x-supabase-key': sKey || '',
        },
      });
      const data = await res.json();
      if (res.ok && data.success && data.records && data.records.length > 0) {
        if (onReferralsLoaded) onReferralsLoaded(data.records);
        await saveRecordsToIndexedDB(data.records);
        setFeedback({
          type: 'success',
          message: `Berhasil menarik ${data.records.length} data rujukan pasien dari Supabase dan disimpan ke IndexedDB local!`,
        });
        fetchStatus();
      } else {
        const client = getSupabaseClient();
        if (client) {
          const { data: dbData, error } = await client
            .from('referral_records')
            .select('*')
            .order('entry_date', { ascending: false })
            .limit(5000);

          if (!error && dbData && dbData.length > 0) {
            const mapped: CleanReferralRecord[] = dbData.map((r: any) => {
              const d = r.entry_date ? new Date(r.entry_date) : new Date();
              const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
              return {
                id: r.id,
                tanggalMasuk: r.entry_date || new Date().toISOString().split('T')[0],
                bulan: r.entry_date ? r.entry_date.substring(0, 7) : '2026-01',
                tahun: d.getFullYear(),
                hariNama: dayNames[d.getDay()],
                hariIndex: d.getDay(),
                perujukRaw: r.referrer_name || '',
                perujukClean: r.referrer_name || '',
                kategoriPerujuk: r.referrer_type === 'internal' ? 'Internal' : 'Eksternal',
                alamatPerujukRaw: r.referrer_address || '',
                wilayahPerujuk: 'Kota/Kab Sukabumi',
                kotaKabPerujuk: 'Kota Sukabumi',
                noRujukanRaw: r.payment_method === 'BPJS' ? 'BPJS-REF' : '',
                kategoriPembayaran: (r.payment_method === 'BPJS' ? 'BPJS' : 'Umum/Tunai') as PaymentCategory,
                alamatPasienRaw: r.patient_address || '',
                kelurahanPasien: 'Sukabumi',
                kecamatanPasien: 'Lembursitu',
                kotaKabPasien: 'Kota Sukabumi',
                wilayahPasienNormal: r.patient_address || 'Sukabumi',
                umurRaw: r.patient_age_group || '',
                umurTahun: null,
                kelompokUsia: (r.patient_age_group as AgeGroup) || '25–44 tahun',
                poliTujuan: r.target_poli || 'Poli Umum',
                diagnosaAwal: r.diagnosis || 'Pemeriksaan Umum',
                kodeIcd: '',
              };
            });
            if (onReferralsLoaded) onReferralsLoaded(mapped);
            await saveRecordsToIndexedDB(mapped);
            setFeedback({
              type: 'success',
              message: `Berhasil memuat ${mapped.length} data rujukan pasien langsung dari Supabase Client!`,
            });
            fetchStatus();
          } else {
            setFeedback({
              type: 'info',
              message: error ? `Supabase: ${error.message}` : 'Tabel referral_records di Supabase masih kosong.',
            });
          }
        } else {
          setFeedback({ type: 'error', message: data?.error || 'Gagal memuat rujukan dari Supabase.' });
        }
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Koneksi gagal saat membaca data rujukan.' });
    } finally {
      setFetchingReferrals(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-950/60 border border-emerald-400/40">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Integrasi Database Supabase &amp; Vercel Deployment</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Vercel Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Penyimpanan cloud persisten PostgreSQL untuk data rujukan pasien &amp; log kunjungan marketing RSUD Al-Mulk
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub Navigation */}
        <div className="px-6 pt-2.5 border-b border-slate-800 flex gap-2 bg-slate-950/50 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveSubTab('sync')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all flex items-center gap-2 ${
              activeSubTab === 'sync'
                ? 'bg-slate-800 text-emerald-400 border-t-2 border-emerald-500 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CloudUpload className="w-4 h-4" />
            <span>Sinkronisasi Data Persisten</span>
          </button>
          <button
            onClick={() => setActiveSubTab('credentials')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all flex items-center gap-2 ${
              activeSubTab === 'credentials'
                ? 'bg-slate-800 text-emerald-400 border-t-2 border-emerald-500 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Kredensial Supabase UI</span>
          </button>
          <button
            onClick={() => setActiveSubTab('sql')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all flex items-center gap-2 ${
              activeSubTab === 'sql'
                ? 'bg-slate-800 text-emerald-400 border-t-2 border-emerald-500 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Pensalinan Skrip SQL DDL</span>
          </button>
          <button
            onClick={() => setActiveSubTab('vercel')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all flex items-center gap-2 ${
              activeSubTab === 'vercel'
                ? 'bg-slate-800 text-emerald-400 border-t-2 border-emerald-500 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Deploy Vercel &amp; ENV</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* Realtime Status Banner */}
          <div className="p-4 rounded-2xl border bg-slate-800/60 border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-start gap-3.5">
              {loading ? (
                <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin mt-0.5" />
              ) : status?.connected ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
              ) : status?.configured ? (
                <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
              )}

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-white">Status Koneksi Cloud Supabase:</span>
                  {status?.connected ? (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      Terhubung Aktif
                    </span>
                  ) : status?.configured ? (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                      Kredensial Siap (Tabel Belum Dibuat)
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                      Belum Terhubung
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {status?.message || 'Memeriksa status konfigurasi server & client SDK...'}
                </p>
                {status?.projectUrl && (
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Project URL: <span className="text-emerald-400">{status.projectUrl}</span>
                  </p>
                )}
                {status?.connected && (
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-xs font-mono text-emerald-400 font-semibold">
                    <span>Data Kunjungan: <strong>{status.visitsCount}</strong> baris</span>
                    <span>•</span>
                    <span>Data Rujukan Pasien: <strong>{status.referralsCount}</strong> baris</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={fetchStatus}
                disabled={loading}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center gap-2 border border-slate-700 shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Uji Ulang Koneksi</span>
              </button>
            </div>
          </div>

          {/* Feedback alerts */}
          {feedback && (
            <div
              className={`p-4 rounded-xl border text-xs flex items-start gap-3 transition-all animate-fade-in ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                  : feedback.type === 'error'
                  ? 'bg-rose-950/60 border-rose-500/50 text-rose-200'
                  : 'bg-blue-950/60 border-blue-500/50 text-blue-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 leading-relaxed">{feedback.message}</div>
            </div>
          )}

          {/* TAB 1: SINKRONISASI DATA PERSISTEN */}
          {activeSubTab === 'sync' && (
            <div className="space-y-5">
              
              {/* Auto Sync Toggle Banner */}
              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-slate-200">Sinkronisasi Otomatis saat Impor Berkas</div>
                    <div className="text-[11px] text-slate-400">Setiap impor Excel/CSV baru akan langsung di-upsert ke Supabase</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggleAutoSync}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    autoSyncEnabled ? 'bg-emerald-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      autoSyncEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Card 1: Data Kunjungan Marketing */}
                <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/70 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <CloudUpload className="w-3.5 h-3.5" />
                        <span>1. Log Kunjungan Tim Marketing</span>
                      </span>
                      <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        {visits.length} Kunjungan
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Menyinkronkan log kunjungan marketing lapangan ke tabel <code className="text-emerald-400 font-mono">marketing_visits</code> di Supabase cloud.
                    </p>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-slate-700/60">
                    <button
                      onClick={handleSyncVisits}
                      disabled={syncingVisits}
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md active:scale-95"
                    >
                      {syncingVisits ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Menyinkronkan {visits.length} Baris...</span>
                        </>
                      ) : (
                        <>
                          <CloudUpload className="w-4 h-4" />
                          <span>Kirim {visits.length} Kunjungan ke Supabase</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleFetchVisits}
                      disabled={fetchingVisits}
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:bg-slate-850 disabled:text-slate-500 text-slate-200 text-xs font-semibold transition-all flex items-center justify-center gap-2 border border-slate-700"
                    >
                      {fetchingVisits ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Memuat Data Cloud...</span>
                        </>
                      ) : (
                        <>
                          <CloudDownload className="w-4 h-4 text-blue-400" />
                          <span>Tarik Kunjungan dari Supabase</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Card 2: Data Rujukan Pasien */}
                <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/70 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                        <CloudUpload className="w-3.5 h-3.5" />
                        <span>2. Rekapitulasi Rujukan Pasien</span>
                      </span>
                      <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
                        {referrals.length} Rujukan
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Menyinkronkan rekap rujukan pasien RSUD Al-Mulk ke tabel <code className="text-teal-400 font-mono">referral_records</code> di Supabase.
                    </p>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-slate-700/60">
                    <button
                      onClick={handleSyncReferrals}
                      disabled={syncingReferrals}
                      className="w-full py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md active:scale-95"
                    >
                      {syncingReferrals ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Menyinkronkan {referrals.length} Rujukan...</span>
                        </>
                      ) : (
                        <>
                          <CloudUpload className="w-4 h-4" />
                          <span>Kirim {referrals.length} Rujukan ke Supabase</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleFetchReferrals}
                      disabled={fetchingReferrals}
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:bg-slate-850 disabled:text-slate-500 text-slate-200 text-xs font-semibold transition-all flex items-center justify-center gap-2 border border-slate-700"
                    >
                      {fetchingReferrals ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Memuat Rujukan Cloud...</span>
                        </>
                      ) : (
                        <>
                          <CloudDownload className="w-4 h-4 text-emerald-400" />
                          <span>Tarik Rujukan dari Supabase</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INPUT & KREDENSIAL SUPABASE */}
          {activeSubTab === 'credentials' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/80 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Key className="w-4 h-4 text-emerald-400" />
                  <span>Input Langsung Kredensial Supabase (UI Interactive)</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Masukkan parameter Supabase Anda di sini untuk langsung menguji dan menghubungkan database Supabase tanpa perlu me-restart server:
                </p>

                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-200 flex items-center justify-between">
                      <span>SUPABASE_URL / VITE_SUPABASE_URL</span>
                      <span className="text-[10px] text-slate-400">Contoh: https://xyz.supabase.co</span>
                    </label>
                    <input
                      type="url"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      placeholder="https://your-project-id.supabase.co"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-200 flex items-center justify-between">
                      <span>SUPABASE_ANON_KEY / VITE_SUPABASE_ANON_KEY</span>
                      <span className="text-[10px] text-slate-400">Public anon key dari Project Settings &gt; API</span>
                    </label>
                    <input
                      type="text"
                      value={inputKey}
                      onChange={(e) => setInputKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveAndTestCredentials}
                    disabled={testingCustom}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition-all shadow-md flex items-center gap-2 active:scale-95"
                  >
                    {testingCustom ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Menguji Koneksi...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Uji &amp; Simpan Kredensial di Aplikasi</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PENSALINAN SKRIP SQL SCHEMA */}
          {activeSubTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span>Pensalinan Skrip SQL DDL Supabase (Schema Engine)</span>
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Salin skrip DDL berikut dan jalankan di: <strong>Supabase Dashboard &gt; SQL Editor &gt; New query &gt; Run</strong>.
                  </p>
                </div>
                <button
                  onClick={handleCopySql}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-md active:scale-95"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Skrip Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Salin Skrip SQL DDL</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative rounded-2xl border border-slate-700 bg-slate-950 p-4 font-mono text-[11px] text-emerald-300 overflow-x-auto max-h-[380px] leading-relaxed shadow-inner">
                <pre>{sqlSchema || FALLBACK_SQL_SCHEMA}</pre>
              </div>
            </div>
          )}

          {/* TAB 4: PANDUAN VERCEL DEPLOYMENT & ENV */}
          {activeSubTab === 'vercel' && (
            <div className="space-y-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/40 border border-slate-700 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <span>Panduan Deploy Vercel &amp; Environment Variables</span>
                  </div>
                  <button
                    onClick={handleCopyVercelEnv}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-emerald-300 font-semibold text-xs transition-all flex items-center gap-1.5 border border-slate-600 shadow-sm"
                  >
                    {copiedEnv ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Format .env Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Blok .env Vercel</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-3 text-slate-300 leading-relaxed">
                  <p>
                    Aplikasi <strong>AL-MULK MARKET INTELLIGENCE</strong> sudah dilengkapi konfigurasi <code className="text-emerald-400 font-mono">vercel.json</code> dan backend serverless handler <code className="text-emerald-400 font-mono">api/index.ts</code> sehingga siap langsung di-deploy ke Vercel secara utuh.
                  </p>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-[11px]">
                    <div className="text-slate-400 font-sans font-bold text-xs text-emerald-400">
                      Tabel Environment Variables Wajib di Vercel:
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between border-b border-slate-800/60 pb-1">
                        <span className="text-slate-200">VITE_SUPABASE_URL</span>
                        <span className="text-emerald-400">https://xyz.supabase.co</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800/60 pb-1">
                        <span className="text-slate-200">VITE_SUPABASE_ANON_KEY</span>
                        <span className="text-emerald-400">eyJhbGciOiJIUzI1Ni...</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800/60 pb-1">
                        <span className="text-slate-200">SUPABASE_URL</span>
                        <span className="text-emerald-400">https://xyz.supabase.co</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800/60 pb-1">
                        <span className="text-slate-200">SUPABASE_ANON_KEY</span>
                        <span className="text-emerald-400">eyJhbGciOiJIUzI1Ni...</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-200">GEMINI_API_KEY</span>
                        <span className="text-emerald-400">AIzaSy...</span>
                      </div>
                    </div>
                  </div>

                  <ol className="list-decimal list-inside space-y-2 text-slate-300 text-xs">
                    <li>
                      Dorong (push) repositori ini ke GitHub / GitLab.
                    </li>
                    <li>
                      Buka dashboard <a href="https://vercel.com/new" target="_blank" rel="noreferrer" className="text-emerald-400 font-semibold underline inline-flex items-center gap-0.5">Vercel New Project <ExternalLink className="w-3 h-3" /></a> lalu impor repositori Anda.
                    </li>
                    <li>
                      Pada langkah <strong>Environment Variables</strong>, tempelkan nilai <code className="text-emerald-400 font-mono">VITE_SUPABASE_URL</code>, <code className="text-emerald-400 font-mono">VITE_SUPABASE_ANON_KEY</code>, dan <code className="text-emerald-400 font-mono">GEMINI_API_KEY</code>.
                    </li>
                    <li>
                      Klik <strong>Deploy</strong>. Vercel akan otomatis membangun static Vite frontend dan mendaftarkan serverless API secara terintegrasi!
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Koneksi Supabase &amp; Vercel aman tersinkronisasi secara otomatis.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

const FALLBACK_SQL_SCHEMA = `-- ========================================================
-- SKRIP SQL DDL SUPABASE - RSUD AL-MULK MARKET INTELLIGENCE
-- Salin skrip ini dan jalankan di: 
-- Supabase Dashboard > SQL Editor > New query > Run
-- ========================================================

-- 1. TABEL KUNJUNGAN TIM MARKETING LAPANGAN
CREATE TABLE IF NOT EXISTS marketing_visits (
  id TEXT PRIMARY KEY,
  visit_date DATE NOT NULL,
  target_location TEXT NOT NULL,
  segment_type TEXT NOT NULL,
  address TEXT DEFAULT '',
  purpose TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketing_visits_date ON marketing_visits(visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_visits_segment ON marketing_visits(segment_type);
CREATE INDEX IF NOT EXISTS idx_marketing_visits_location ON marketing_visits(target_location);

ALTER TABLE marketing_visits ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'marketing_visits' AND policyname = 'Allow all access to marketing_visits'
  ) THEN
    CREATE POLICY "Allow all access to marketing_visits" ON marketing_visits FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 2. TABEL REKAPITULASI RUJUKAN PASIEN RSUD AL-MULK
CREATE TABLE IF NOT EXISTS referral_records (
  id TEXT PRIMARY KEY,
  entry_date DATE,
  referrer_name TEXT NOT NULL,
  referrer_type TEXT NOT NULL,
  referrer_address TEXT DEFAULT '',
  target_poli TEXT DEFAULT '',
  diagnosis TEXT DEFAULT '',
  payment_method TEXT DEFAULT '',
  patient_age_group TEXT DEFAULT '',
  patient_address TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_records_date ON referral_records(entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_referral_records_referrer ON referral_records(referrer_name);
CREATE INDEX IF NOT EXISTS idx_referral_records_poli ON referral_records(target_poli);

ALTER TABLE referral_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'referral_records' AND policyname = 'Allow all access to referral_records'
  ) THEN
    CREATE POLICY "Allow all access to referral_records" ON referral_records FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
`;
