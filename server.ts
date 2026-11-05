import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));

// Helper to initialize Google GenAI
function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build-al-mulk',
      },
    },
  });
}

// Helper to initialize Supabase Client dynamically
function getSupabaseBackendClient(): { client: SupabaseClient | null; url: string } {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = 
    process.env.SUPABASE_SERVICE_ROLE_KEY || 
    process.env.SUPABASE_ANON_KEY || 
    process.env.VITE_SUPABASE_ANON_KEY || 
    '';

  if (!supabaseUrl || !supabaseKey) {
    return { client: null, url: '' };
  }

  try {
    const client = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
    return { client, url: supabaseUrl };
  } catch (err) {
    console.error('Failed to initialize Supabase backend client:', err);
    return { client: null, url: supabaseUrl };
  }
}

// Health check
app.get('/api/health', (req, res) => {
  const { client, url } = getSupabaseBackendClient();
  const aiClient = getGenAIClient();
  res.json({ 
    status: 'ok', 
    supabaseConfigured: !!client,
    supabaseUrl: url ? url.replace(/^(https:\/\/[^.]+).*/, '$1.supabase.co') : null,
    geminiConfigured: !!aiClient,
    time: new Date().toISOString() 
  });
});

// AI Marketing Strategist Endpoint
app.post('/api/gemini/ask-strategist', async (req, res) => {
  try {
    const { question, summaryData, customContext } = req.body;
    const aiClient = getGenAIClient();

    if (!summaryData) {
      return res.status(400).json({ error: 'Data ringkasan agregat diperlukan.' });
    }

    if (!aiClient) {
      return res.status(500).json({ 
        error: 'GEMINI_API_KEY belum dikonfigurasi di server. Silakan hubungkan API key di panel Environment Variables (GEMINI_API_KEY).' 
      });
    }

    const systemPrompt = `Anda adalah "Hospital Business Strategist & Healthcare Marketing Analyst" senior untuk RSUD Al-Mulk Kota Sukabumi (Alamat: Jl. Pelabuhan II KM 6, Kec. Lembursitu, Kota Sukabumi).
RSUD Al-Mulk adalah rumah sakit daerah milik Pemerintah Kota Sukabumi tipe D/C yang strategis di jalur selatan Sukabumi, memiliki program layanan unggulan dan bermitra dengan Puskesmas, Klinik, dan Dokter Praktek Mandiri baik di Kota Sukabumi maupun Kabupaten Sukabumi.

PRINSIP WAJIB:
1. Analisis HANYA menggunakan data agregat yang diberikan. JANGAN mengarang data populasi, pangsa pasar, biaya, pendapatan, atau efektivitas pemasaran.
2. Jika data hanya menunjukkan korelasi, JANGAN menyatakan hubungan sebab-akibat.
3. Volume tinggi TIDAK otomatis berarti kualitas rujukan lebih baik.
4. Jangan menyarankan promosi layanan medis tanpa mempertimbangkan kapasitas realistis RSUD tipe D/C Al-Mulk.
5. Format respon dalam Bahasa Indonesia formal, terstruktur, tajam, dan dapat dieksekusi oleh manajemen rumah sakit.

Setiap rekomendasi program/tindakan marketing HARUS memuat 7 komponen wajib:
1. Temuan berdasarkan data
2. Periode yang dianalisis
3. Dasar perhitungan
4. Rekomendasi tindakan (spesifik)
5. Target KPI yang dapat diukur (kuantitatif)
6. PIC yang disarankan (misal: Subbag Humas & Pemasaran, Tim Kerjasama Rujukan, Pelayanan Medis)
7. Batasan dan kebutuhan verifikasi internal`;

    const userPrompt = `KONTEKS DATA AGREGAT MARKETING RUJUKAN RSUD AL-MULK:
${JSON.stringify(summaryData, null, 2)}

${customContext ? `INFORMASI TAMBAHAN / KONTEKS:\n${customContext}\n` : ''}

PERTANYAAN / FOKUS ANALISIS STRATEGIS:
${question || 'Berikan audit strategis komprehensif atas rujukan perujuk, wilayah, poli tujuan, diagnosis awal, dan kategori pembayaran serta rencana aksi 30-60-90 hari.'}`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3,
      },
    });

    res.json({
      success: true,
      analysis: response.text,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error generating strategy:', error);
    res.status(500).json({ 
      error: error.message || 'Gagal memproses analisis AI' 
    });
  }
});

// Dedicated AI Audit Endpoint for Marketing Field Visits vs Actual Referrals
app.post('/api/gemini/audit-marketing-visits', async (req, res) => {
  try {
    const { visitsData, referralSummary, customFocus } = req.body;
    const aiClient = getGenAIClient();

    if (!visitsData || !referralSummary) {
      return res.status(400).json({ error: 'Data kunjungan dan data rujukan diperlukan untuk audit.' });
    }

    if (!aiClient) {
      return res.status(500).json({ 
        error: 'GEMINI_API_KEY belum dikonfigurasi di server. Silakan hubungkan API key di panel Environment Variables (GEMINI_API_KEY).' 
      });
    }

    const systemPrompt = `Anda adalah "Senior Healthcare Marketing Strategist & Field Audit Specialist" untuk RSUD Al-Mulk Kota Sukabumi (Jl. Pelabuhan II KM 6, Kec. Lembursitu, Kota Sukabumi).
Tugas Anda adalah melakukan audit komparatif mendalam antara:
1. DATA KUNJUNGAN TIM MARKETING LAPANGAN (Tanggal, Lokasi Tujuan, Jenis Segmen, Alamat/Wilayah, Maksud Kunjungan, Catatan Hasil).
2. DATA RUJUKAN PASIEN AKTUAL yang masuk ke RSUD Al-Mulk dari faskes dan wilayah tersebut.

FORMAT WAJIB LAPORAN AUDIT STRATEGIS (Bahasa Indonesia Formal, Tajam, Terstruktur):
### 1. RINGKASAN AUDIT KESELARASAN (ALIGNMENT OVERVIEW)
Sebutkan rasio kunjungan efektif vs kunjungan kurang produktif berdasarkan data rujukan riil.

### 2. KUNJUNGAN YANG SUDAH TEPAT SASARAN (HIGH ROI & PRODUKTIF)
- Sebutkan nama-nama lokasi/faskes yang dikunjungi yang terbukti menghasilkan rujukan tinggi atau bertumbuh.
- Jelaskan faktor kunci keberhasilan (misal: kesesuaian maksud kunjungan dengan poli rujukan yang dituju, faktor zonasi Ring 1 koridor Pelabuhan II/Lembursitu/Baros).
- Rekomendasi pemeliharaan kemitraan (retensi & loyalty).

### 3. KUNJUNGAN YANG PERLU DIKAJI ULANG (LOW CONVERSION / BUTUH EVALUASI)
- Sebutkan lokasi/faskes yang telah dikunjungi namun data rujukan aktualnya masih nihil atau sangat rendah.
- Analisis akar penyebab: apakah maksud kunjungan kurang spesifik, kendala kompetisi rujukan (misal lebih dekat ke RSUD Syamsudin SH Bunut), atau masalah kuota bridging BPJS/jadwal dokter.
- Rekomendasi tindakan korektif: apakah perlu ganti pendekatan agenda, ganti sasaran poli, atau kurangi frekuensi kunjungan fisik.

### 4. PELUANG FASKES POTENSIAL YANG BELUM TERJAMAH KUNJUNGAN (UNTAPPED POTENTIAL)
- Analisis faskes atau wilayah yang tercatat mengirimkan rujukan spontan ke RSUD Al-Mulk tetapi belum ada catatan kunjungan tim marketing.

### 5. RENCANA AKSI KOREKTIF & JADWAL KUNJUNGAN REKOMENDASI (30-60 HARI)
Format tabel atau poin terstruktur: Target Lokasi, Segmen, Maksud Kunjungan Terarah, Target Poli yang Dipromosikan, PIC, dan Target KPI Kuantitatif.`;

    const userPrompt = `DATA KUNJUNGAN TIM MARKETING LAPANGAN RSUD AL-MULK:
${JSON.stringify(visitsData, null, 2)}

DATA RUJUKAN AKTUAL PASIEN MASUK (KORELASI MITRA & WILAYAH):
${JSON.stringify(referralSummary, null, 2)}

${customFocus ? `FOKUS TAMBAHAN PENGGUNA:\n${customFocus}\n` : ''}

Lakukan audit strategis dan sandingan komprehensif sekarang.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.25,
      },
    });

    res.json({
      success: true,
      auditReport: response.text,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in marketing visit audit:', error);
    res.status(500).json({ 
      error: error.message || 'Gagal memproses audit kunjungan marketing' 
    });
  }
});

// ==========================================
// SUPABASE INTEGRATION ENDPOINTS
// ==========================================

const SUPABASE_DDL_SCHEMA = `-- ========================================================
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

-- 3. TABEL PENGATURAN TAMPILAN WELCOME SCREEN & BRANDING
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'app_settings' AND policyname = 'Allow all access to app_settings'
  ) THEN
    CREATE POLICY "Allow all access to app_settings" ON app_settings FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
`;

// Get Supabase Status
app.get('/api/supabase/status', async (req, res) => {
  const { client, url } = getSupabaseBackendClient();
  const isConfigured = !!client;
  let connectionValid = false;
  let visitsCount = 0;
  let referralsCount = 0;
  let errorDetail: string | null = null;

  if (client) {
    try {
      const { count: vCount, error: vErr } = await client
        .from('marketing_visits')
        .select('*', { count: 'exact', head: true });
      
      if (!vErr) {
        connectionValid = true;
        visitsCount = vCount || 0;

        const { count: rCount } = await client
          .from('referral_records')
          .select('*', { count: 'exact', head: true });
        referralsCount = rCount || 0;
      } else {
        errorDetail = vErr.message;
      }
    } catch (err: any) {
      errorDetail = err.message;
    }
  }

  res.json({
    configured: isConfigured,
    connected: connectionValid,
    projectUrl: url ? url.replace(/^(https:\/\/[^.]+).*/, '$1.supabase.co') : null,
    visitsCount,
    referralsCount,
    errorDetail,
    message: isConfigured
      ? (connectionValid ? 'Terhubung dengan database Supabase' : `Kredensial ditemukan, namun tabel Supabase belum siap (${errorDetail || 'Tabel belum dibuat'}).`)
      : 'VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY (atau SUPABASE_URL & SUPABASE_ANON_KEY) belum dikonfigurasi di Environment Variables.',
  });
});

// Get SQL Schema DDL
app.get('/api/supabase/schema', (req, res) => {
  res.json({ sql: SUPABASE_DDL_SCHEMA });
});

// Sync Marketing Visits to Supabase with chunk batching
app.post('/api/supabase/sync-visits', async (req, res) => {
  const { client } = getSupabaseBackendClient();
  if (!client) {
    return res.status(400).json({
      success: false,
      error: 'Supabase belum dikonfigurasi. Mohon tambahkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di Environment Variables Vercel / AI Studio.',
    });
  }

  try {
    const { visits } = req.body;
    if (!Array.isArray(visits) || visits.length === 0) {
      return res.status(400).json({ success: false, error: 'Data kunjungan kosong atau tidak valid.' });
    }

    const rows = visits.map((v: any, index: number) => ({
      id: v.id || `visit-${Date.now()}-${index}`,
      visit_date: v.visitDate || new Date().toISOString().split('T')[0],
      target_location: v.targetLocation || 'Tanpa Nama',
      segment_type: v.segmentType || 'Lainnya',
      address: v.address || '',
      purpose: v.purpose || '',
      notes: v.notes || '',
      updated_at: new Date().toISOString(),
    }));

    // Process in chunks of 500
    const CHUNK_SIZE = 500;
    let syncedTotal = 0;

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      const { error } = await client
        .from('marketing_visits')
        .upsert(chunk, { onConflict: 'id' });

      if (error) {
        console.error('Supabase upsert error in chunk:', error);
        return res.status(500).json({
          success: false,
          error: `Supabase Error pada baris ${i + 1}: ${error.message}. Pastikan skrip tabel 'marketing_visits' sudah dijalankan di Supabase SQL Editor.`,
        });
      }
      syncedTotal += chunk.length;
    }

    res.json({
      success: true,
      syncedCount: syncedTotal,
      message: `Berhasil menyinkronkan total ${syncedTotal} data kunjungan marketing ke Supabase.`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error syncing visits to Supabase:', error);
    res.status(500).json({ success: false, error: error.message || 'Gagal menyinkronkan ke Supabase' });
  }
});

// Fetch Marketing Visits from Supabase
app.get('/api/supabase/fetch-visits', async (req, res) => {
  const { client } = getSupabaseBackendClient();
  if (!client) {
    return res.status(400).json({
      success: false,
      error: 'Supabase belum dikonfigurasi di server.',
    });
  }

  try {
    const { data, error } = await client
      .from('marketing_visits')
      .select('*')
      .order('visit_date', { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        error: `Gagal membaca dari Supabase: ${error.message}. Pastikan tabel 'marketing_visits' sudah ada di Supabase.`,
      });
    }

    const visits = (data || []).map((r: any) => ({
      id: r.id,
      visitDate: r.visit_date,
      targetLocation: r.target_location,
      segmentType: r.segment_type,
      address: r.address || '',
      purpose: r.purpose || '',
      notes: r.notes || '',
    }));

    res.json({
      success: true,
      visits,
      count: visits.length,
    });
  } catch (error: any) {
    console.error('Error fetching visits from Supabase:', error);
    res.status(500).json({ success: false, error: error.message || 'Gagal memuat dari Supabase' });
  }
});

// Sync Referral Records to Supabase with chunk batching
app.post('/api/supabase/sync-referrals', async (req, res) => {
  const { client } = getSupabaseBackendClient();
  if (!client) {
    return res.status(400).json({
      success: false,
      error: 'Supabase belum dikonfigurasi di server.',
    });
  }

  try {
    const { records } = req.body;
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, error: 'Data rujukan kosong atau tidak valid.' });
    }

    const safeRecords = records.map((r: any, idx: number) => ({
      id: r.id || `ref-${Date.now()}-${idx}`,
      entry_date: r.tanggalMasuk || null,
      referrer_name: r.perujuk || r.perujukClean || 'Perujuk Tidak Tercatat',
      referrer_type: r.tipePerujuk || 'eksternal',
      referrer_address: r.alamatPerujuk || '',
      target_poli: r.poliTujuan || r.poli || '',
      diagnosis: r.diagnosaAwal || r.diagnosa || '',
      payment_method: r.kategoriPembayaran || r.caraBayar || '',
      patient_age_group: r.kelompokUmur || '',
      patient_address: r.alamatPasien || '',
      created_at: new Date().toISOString(),
    }));

    // Process in chunks of 500 for safety and speed
    const CHUNK_SIZE = 500;
    let syncedTotal = 0;

    for (let i = 0; i < safeRecords.length; i += CHUNK_SIZE) {
      const chunk = safeRecords.slice(i, i + CHUNK_SIZE);
      const { error } = await client
        .from('referral_records')
        .upsert(chunk, { onConflict: 'id' });

      if (error) {
        console.error('Supabase referral upsert error:', error);
        return res.status(500).json({
          success: false,
          error: `Supabase Error pada batch ${i + 1}: ${error.message}. Pastikan skrip tabel 'referral_records' telah dijalankan di Supabase.`,
        });
      }
      syncedTotal += chunk.length;
    }

    res.json({
      success: true,
      syncedCount: syncedTotal,
      message: `Berhasil menyinkronkan total ${syncedTotal} data rujukan pasien ke Supabase.`,
    });
  } catch (error: any) {
    console.error('Error syncing referrals to Supabase:', error);
    res.status(500).json({ success: false, error: error.message || 'Gagal menyinkronkan data rujukan' });
  }
});

// Fetch Referral Records from Supabase
app.get('/api/supabase/fetch-referrals', async (req, res) => {
  const { client } = getSupabaseBackendClient();
  if (!client) {
    return res.status(400).json({
      success: false,
      error: 'Supabase belum dikonfigurasi di server.',
    });
  }

  try {
    const { data, error } = await client
      .from('referral_records')
      .select('*')
      .order('entry_date', { ascending: false })
      .limit(5000);

    if (error) {
      return res.status(500).json({
        success: false,
        error: `Gagal membaca rujukan: ${error.message}`,
      });
    }

    const records = (data || []).map((r: any) => ({
      id: r.id,
      tanggalMasuk: r.entry_date,
      perujuk: r.referrer_name,
      perujukClean: r.referrer_name,
      tipePerujuk: r.referrer_type || 'eksternal',
      alamatPerujuk: r.referrer_address || '',
      poliTujuan: r.target_poli || '',
      diagnosaAwal: r.diagnosis || '',
      kategoriPembayaran: r.payment_method || 'Umum/Tunai',
      kelompokUmur: r.patient_age_group || '',
      alamatPasien: r.patient_address || '',
      noRujukan: r.payment_method === 'BPJS' ? 'BPJS-REF-SUPABASE' : '',
    }));

    res.json({
      success: true,
      records,
      count: records.length,
    });
  } catch (error: any) {
    console.error('Error fetching referrals from Supabase:', error);
    res.status(500).json({ success: false, error: error.message || 'Gagal memuat rujukan dari Supabase' });
  }
});

// Save Welcome Screen Configuration
app.post('/api/supabase/save-welcome-config', async (req, res) => {
  const { client } = getSupabaseBackendClient();
  if (!client) {
    return res.status(400).json({ success: false, error: 'Supabase belum dikonfigurasi di server.' });
  }

  try {
    const { config } = req.body;
    if (!config) return res.status(400).json({ success: false, error: 'Konfigurasi tidak valid.' });

    const { error } = await client
      .from('app_settings')
      .upsert({ key: 'welcome_config', value: config, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, message: 'Konfigurasi Welcome Screen berhasil disimpan ke Supabase cloud.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Welcome Screen Configuration
app.get('/api/supabase/get-welcome-config', async (req, res) => {
  const { client } = getSupabaseBackendClient();
  if (!client) {
    return res.status(400).json({ success: false, error: 'Supabase belum dikonfigurasi di server.' });
  }

  try {
    const { data, error } = await client
      .from('app_settings')
      .select('value')
      .eq('key', 'welcome_config')
      .single();

    if (error || !data) {
      return res.json({ success: false, config: null });
    }

    res.json({ success: true, config: data.value });
  } catch (err: any) {
    res.json({ success: false, config: null });
  }
});

// Setup Vite middleware in dev or serve static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server RSUD Al-Mulk Market Intelligence running on port ${PORT}`);
  });
}

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  startServer();
}

export default app;
