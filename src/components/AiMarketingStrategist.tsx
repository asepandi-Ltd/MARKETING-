import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  HelpCircle, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Target, 
  UserCheck, 
  FileText, 
  Copy, 
  Check 
} from 'lucide-react';
import { CleanReferralRecord, DashboardKpiSummary } from '../types/referral';
import { computeMonthlyTrends, computeExternalReferrers } from '../utils/analytics';

import { MarketingVisitRecord } from '../types/marketingVisit';

interface AiMarketingStrategistProps {
  records: CleanReferralRecord[];
  summary: DashboardKpiSummary;
  marketingVisits?: MarketingVisitRecord[];
}

const STRATEGIC_QUESTIONS = [
  'Audit efektivitas kunjungan tim marketing lapangan: mana faskes yang sudah tepat sasaran dan mana yang perlu dikaji ulang?',
  'Perujuk eksternal mana yang perlu diprioritaskan untuk pendekatan kemitraan?',
  'Wilayah mana yang memberikan volume kunjungan rujukan tertinggi?',
  'Poli spesialis mana yang memiliki pertumbuhan atau serapan rujukan terbesar?',
  'Kelompok usia mana yang paling banyak tercatat pada setiap poli rujukan?',
  'Bagaimana pola diagnosis awal yang dirujuk ke masing-masing poli?',
  'Bagaimana perbandingan pola rujukan kategori BPJS vs Umum/Tunai?',
  'Wilayah perbatasan atau hinterland mana yang layak dievaluasi lebih lanjut?',
  'Program pemasaran dan advokasi rujukan apa yang disarankan untuk 30, 60, dan 90 hari mendatang?',
];

export const AiMarketingStrategist: React.FC<AiMarketingStrategistProps> = ({ records, summary, marketingVisits = [] }) => {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Generate Aggregate Data Package (STRICT PRIVACY: NO PATIENT IDENTITIES)
  const buildAggregateSummary = () => {
    const monthly = computeMonthlyTrends(records, summary.maxDate);
    const months = monthly.map((m) => m.bulan);
    const external = computeExternalReferrers(records, months).slice(0, 10);

    // Group top patient territories
    const patientTerritoryCounts: Record<string, number> = {};
    for (const r of records) {
      const w = r.wilayahPasienNormal || 'Perlu verifikasi';
      patientTerritoryCounts[w] = (patientTerritoryCounts[w] || 0) + 1;
    }
    const topPatientTerritories = Object.entries(patientTerritoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([wil, cnt]) => ({ wilayah: wil, count: cnt }));

    // Group top clinics
    const clinicCounts: Record<string, { total: number; bpjs: number; umum: number }> = {};
    for (const r of records) {
      const p = r.poliTujuan || 'Lainnya';
      if (!clinicCounts[p]) clinicCounts[p] = { total: 0, bpjs: 0, umum: 0 };
      clinicCounts[p].total++;
      if (r.kategoriPembayaran === 'BPJS') clinicCounts[p].bpjs++;
      else clinicCounts[p].umum++;
    }

    // Top diagnoses
    const diagCounts: Record<string, number> = {};
    for (const r of records) {
      const d = r.diagnosaAwal || 'Lainnya';
      diagCounts[d] = (diagCounts[d] || 0) + 1;
    }
    const topDiagnoses = Object.entries(diagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([diag, cnt]) => ({ diagnosis: diag, count: cnt }));

    // Age groups
    const ageCounts: Record<string, number> = {};
    for (const r of records) {
      ageCounts[r.kelompokUsia] = (ageCounts[r.kelompokUsia] || 0) + 1;
    }

    return {
      metadata: {
        rumahSakit: 'RSUD Al-Mulk Kota Sukabumi (Kelas D)',
        lokasi: 'Jl. Pelabuhan II KM 6, Kec. Lembursitu, Kota Sukabumi',
        periodeData: `${summary.minDate} s/d ${summary.maxDate}`,
        isPartialMonth: summary.isPartialMonth,
        totalRekamanKunjungan: summary.totalRekaman,
      },
      kpiSummary: {
        internalCount: summary.internalCount,
        internalPct: summary.internalPct,
        eksternalCount: summary.eksternalCount,
        eksternalPct: summary.eksternalPct,
        bpjsCount: summary.bpjsCount,
        bpjsPct: summary.bpjsPct,
        umumCount: summary.umumCount,
        umumPct: summary.umumPct,
        uniqueWilayahPasienCount: summary.uniqueWilayahPasienCount,
        uniqueMitraEksternalCount: summary.uniquePerujukEksternalCount,
      },
      trenBulanan: monthly.map((m) => ({
        bulan: m.bulan,
        label: m.labelBulan,
        total: m.total,
        bpjs: m.bpjs,
        umum: m.umum,
        momGrowthPct: m.momGrowthPct,
        isPartial: m.isPartial,
      })),
      topMitraEksternal: external.map((e) => ({
        nama: e.name,
        alamat: e.address,
        totalKunjungan: e.totalKunjungan,
        pct: e.pctOfTotal,
        bpjs: e.bpjsCount,
        umum: e.umumCount,
        status: e.statusBadge,
      })),
      topWilayahPasien: topPatientTerritories,
      distribusiPoli: clinicCounts,
      topDiagnosisAwal: topDiagnoses,
      distribusiUsia: ageCounts,
      dataKunjunganMarketing: marketingVisits.map((v) => ({
        tanggal: v.tanggalKunjungan,
        lokasi: v.lokasiTujuan,
        segmen: v.jenisSegmen,
        alamat: v.alamat,
        maksud: v.maksudKunjungan,
        rujukanTercatat: v.totalRujukanTercatat || 0,
        evaluasi: v.statusKesesuaian,
      })),
    };
  };

  const handleAsk = async (queryText?: string) => {
    const q = queryText || question;
    if (!q.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);
    setAnalysisResult(null);

    try {
      const summaryData = buildAggregateSummary();

      const response = await fetch('/api/gemini/ask-strategist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          summaryData,
          customContext: 'Fasilitas RSUD Al-Mulk: Rawat Jalan Spesialis (Penyakit Dalam, Anak, Bedah, Obsgyn, Saraf, Mata, Gigi, Paru), IGD 24 Jam, Kamar Operasi, Laboratorium, Radiologi, Program Al-Mulk KTP Kota Sukabumi Gratis, Kerjasama BPJS Kesehatan aktif.',
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Terjadi kesalahan saat memproses data di server.');
      }

      setAnalysisResult(data.analysis);
    } catch (err: any) {
      console.error('Failed to get AI strategy:', err);
      setErrorMsg(err.message || 'Gagal menghubungi asisten AI pemasaran.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(analysisResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Strategic Header Banner */}
      <div className="bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border border-purple-800/60 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40">
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                  Business Intelligence & Healthcare Strategy
                </span>
                <h2 className="text-lg font-extrabold text-white">
                  AI Marketing Strategist RSUD Al-Mulk
                </h2>
              </div>
            </div>
            <p className="text-xs text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Didukung model <strong>Gemini 3.8 Flash</strong> untuk menganalisis data rujukan agregat rumah sakit. Setiap rekomendasi diformulasikan sesuai 7 standar tata kelola rumah sakit: Temuan Data, Periode, Dasar Perhitungan, Rekomendasi Aksi, Target KPI, PIC, dan Batasan Verifikasi.
            </p>
          </div>

          <div className="flex flex-col gap-1.5 bg-slate-950/80 p-3 rounded-lg border border-purple-900/60 text-xs">
            <span className="text-emerald-400 font-semibold flex items-center gap-1.5 text-[11px]">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              100% Bebas Data Identitas Pasien
            </span>
            <span className="text-slate-400 text-[10px]">
              Hanya data agregat statistik yang diproses oleh AI.
            </span>
          </div>
        </div>
      </div>

      {/* 8 Strategic Core Questions Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-3">
          <HelpCircle className="w-4 h-4 text-purple-400" />
          Pilih Pertanyaan Strategis Direksi & Manajemen:
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {STRATEGIC_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuestion(q);
                handleAsk(q);
              }}
              disabled={isLoading}
              className="text-left p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-purple-600/60 hover:bg-purple-950/20 text-xs text-slate-300 hover:text-white transition-all flex items-start gap-2.5 group disabled:opacity-50"
            >
              <span className="w-5 h-5 rounded-full bg-purple-900/50 text-purple-300 flex items-center justify-center text-[10px] font-mono flex-shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                {idx + 1}
              </span>
              <span className="leading-snug">{q}</span>
            </button>
          ))}
        </div>

        {/* Custom Query Input Box */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Atau Ajukan Pertanyaan / Permintaan Analisis Khusus:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Contoh: Buatkan program promosi Poli Penyakit Dalam untuk Puskesmas di koridor Baros dan Lembursitu..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isLoading) handleAsk();
              }}
              disabled={isLoading}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={() => handleAsk()}
              disabled={isLoading || !question.trim()}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-purple-950/40"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Menganalisis...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Analisis</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error state */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-200 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-white block mb-0.5">Kendala Analisis AI:</strong>
            <p>{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Loading state indicator */}
      {isLoading && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center shadow-md">
          <div className="w-10 h-10 border-3 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-3" />
          <h4 className="text-sm font-bold text-white">Memproses Data Agregat Marketing RSUD Al-Mulk...</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Model Gemini sedang mengaudit pola rujukan, menghitung tren MoM, mengevaluasi potensi faskes mitra, dan menyusun rekomendasi 7 komponen.
          </p>
        </div>
      )}

      {/* Analysis Output Section */}
      {analysisResult && !isLoading && (
        <div className="bg-slate-900 border border-purple-800/50 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="text-sm font-bold text-white">
                  Laporan Hasil Analisis Strategis AI Marketing
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  RSUD Al-Mulk Kota Sukabumi • {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all"
                title="Salin hasil teks rekomendasi"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
              </button>
            </div>
          </div>

          {/* Formatted Markdown Analysis Body */}
          <div className="mt-5 prose prose-invert max-w-none text-xs text-slate-200 leading-relaxed space-y-3 whitespace-pre-wrap font-sans">
            {analysisResult}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Analisis mematuhi 7 komponen standar rekomendasi bisnis rumah sakit.</span>
            </div>
            <span className="text-slate-500">
              Pengambilan keputusan tetap berada pada Direktur & Manajemen RSUD Al-Mulk.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
