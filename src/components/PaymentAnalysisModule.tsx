import React, { useMemo } from 'react';
import { 
  CreditCard, 
  AlertCircle, 
  TrendingUp, 
  Building2, 
  MapPin, 
  Stethoscope, 
  Users, 
  Activity,
  FileCheck2,
  HelpCircle 
} from 'lucide-react';
import { CleanReferralRecord, DashboardKpiSummary } from '../types/referral';
import { computeMonthlyTrends } from '../utils/analytics';

interface PaymentAnalysisModuleProps {
  records: CleanReferralRecord[];
  summary: DashboardKpiSummary;
}

export const PaymentAnalysisModule: React.FC<PaymentAnalysisModuleProps> = ({ records, summary }) => {
  const monthlyTrends = useMemo(() => {
    return computeMonthlyTrends(records, summary.maxDate);
  }, [records, summary.maxDate]);

  // Breakdown by Poli
  const poliPaymentBreakdown = useMemo(() => {
    const map: Record<string, { bpjs: number; umum: number; total: number }> = {};
    for (const r of records) {
      const p = r.poliTujuan || 'Lainnya';
      if (!map[p]) map[p] = { bpjs: 0, umum: 0, total: 0 };
      map[p].total++;
      if (r.kategoriPembayaran === 'BPJS') map[p].bpjs++;
      else map[p].umum++;
    }
    return Object.entries(map)
      .map(([poli, d]) => ({
        poli,
        bpjs: d.bpjs,
        umum: d.umum,
        total: d.total,
        bpjsPct: Math.round((d.bpjs / d.total) * 100),
        umumPct: Math.round((d.umum / d.total) * 100),
      }))
      .sort((a, b) => b.total - a.total);
  }, [records]);

  // Breakdown by Age Group
  const agePaymentBreakdown = useMemo(() => {
    const map: Record<string, { bpjs: number; umum: number; total: number }> = {};
    for (const r of records) {
      const a = r.kelompokUsia;
      if (!map[a]) map[a] = { bpjs: 0, umum: 0, total: 0 };
      map[a].total++;
      if (r.kategoriPembayaran === 'BPJS') map[a].bpjs++;
      else map[a].umum++;
    }
    return Object.entries(map).map(([age, d]) => ({
      age,
      bpjs: d.bpjs,
      umum: d.umum,
      total: d.total,
      bpjsPct: Math.round((d.bpjs / d.total) * 100),
      umumPct: Math.round((d.umum / d.total) * 100),
    }));
  }, [records]);

  return (
    <div className="space-y-6">
      {/* Module Title & Mandatory Operational Disclaimer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CreditCard className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-white">
                Modul Klasifikasi Cara Pembayaran Rujukan
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Berdasarkan kolom turunan <code className="text-emerald-400 font-mono">kategori_pembayaran</code> yang diekstraksi dari keberadaan kolom <code className="text-emerald-400 font-mono">no rujukan</code>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold font-mono">
              BPJS: {summary.bpjsPct}%
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold font-mono">
              Umum/Tunai: {summary.umumPct}%
            </span>
          </div>
        </div>
      </div>

      {/* MANDATORY VISIBLE NOTICE CARD */}
      <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 shadow-lg text-amber-200 text-xs leading-relaxed">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-amber-300 text-sm block">
              Pemberitahuan Wajib: Dasar Klasifikasi Operasional Cara Pembayaran
            </strong>
            <p>
              Klasifikasi ini merupakan <strong>aturan operasional berdasarkan keberadaan nomor rujukan</strong> (kolom <code>no rujukan</code>), sesuai ketentuan pengguna sistem RSUD Al-Mulk:
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-amber-100 font-mono pl-2 text-[11px]">
              <li>Jika <strong>no rujukan</strong> terisi dan bukan hanya spasi &rarr; diklasifikasikan sebagai <strong>BPJS</strong>.</li>
              <li>Jika <strong>no rujukan</strong> kosong, null, atau hanya spasi &rarr; diklasifikasikan sebagai <strong>Umum/Tunai</strong>.</li>
            </ul>
            <p className="text-amber-300/90 text-[11px] pt-1">
              Catatan: Klasifikasi ini bukan merupakan verifikasi independen atas status kepesertaan atau penagihan klaim BPJS Kesehatan di dunia nyata, melainkan indikator proksi operasional pemasaran rujukan.
            </p>
          </div>
        </div>
      </div>

      {/* High Level 2-Column Split: BPJS vs Umum */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* BPJS Card */}
        <div className="bg-slate-900 border border-emerald-900/60 rounded-xl p-5 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Rujukan Peserta BPJS</h3>
                <span className="text-[10px] text-slate-400 font-mono">Nomor rujukan tercatat lengkap</span>
              </div>
            </div>
            <span className="text-2xl font-black font-mono text-emerald-400">
              {summary.bpjsPct}%
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Total Kunjungan</span>
              <span className="text-xl font-bold font-mono text-white">{summary.bpjsCount.toLocaleString('id-ID')}</span>
              <span className="text-[10px] text-slate-500 block">rekaman terdaftar</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Perujuk Eksternal BPJS</span>
              <span className="text-xl font-bold font-mono text-emerald-400">
                {records.filter(r => r.kategoriPembayaran === 'BPJS' && r.kategoriPerujuk === 'Eksternal').length}
              </span>
              <span className="text-[10px] text-slate-500 block">via Puskesmas/Klinik mitra</span>
            </div>
          </div>

          <p className="mt-3 text-[11px] text-slate-400 leading-normal">
            Mayoritas pasien BPJS memanfaatkan bridging rujukan dari FKTP (Puskesmas/Klinik Pratama) wilayah Kota dan Kabupaten Sukabumi menuju poli spesialis RSUD Al-Mulk.
          </p>
        </div>

        {/* Umum/Tunai Card */}
        <div className="bg-slate-900 border border-amber-900/60 rounded-xl p-5 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Rujukan Pasien Umum / Tunai</h3>
                <span className="text-[10px] text-slate-400 font-mono">Tanpa nomor rujukan tertera</span>
              </div>
            </div>
            <span className="text-2xl font-black font-mono text-amber-400">
              {summary.umumPct}%
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Total Kunjungan</span>
              <span className="text-xl font-bold font-mono text-white">{summary.umumCount.toLocaleString('id-ID')}</span>
              <span className="text-[10px] text-slate-500 block">rekaman terdaftar</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Program Kesehatan Daerah</span>
              <span className="text-xs font-semibold text-amber-300 block mt-1">
                KTP Kota Sukabumi
              </span>
              <span className="text-[10px] text-slate-500 block">layanan gratis pemkot</span>
            </div>
          </div>

          <p className="mt-3 text-[11px] text-slate-400 leading-normal">
            Pasien umum mencakup masyarakat yang menggunakan jaminan kesehatan daerah Kota Sukabumi ber-KTP (Al-Mulk Gratis KTP Kota), mandiri tunai, maupun asuransi komersial lain.
          </p>
        </div>
      </div>

      {/* Distribution by Poli: BPJS vs Umum */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
          <Stethoscope className="w-4 h-4 text-teal-400" />
          Komposisi BPJS vs Umum/Tunai Berdasarkan Poli Tujuan
        </h3>

        <div className="mt-4 space-y-3">
          {poliPaymentBreakdown.map((item) => (
            <div key={item.poli} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">{item.poli}</span>
                <span className="font-mono text-slate-400">
                  Total: <strong className="text-slate-200">{item.total}</strong> | BPJS: <span className="text-emerald-400">{item.bpjs} ({item.bpjsPct}%)</span> | Umum: <span className="text-amber-400">{item.umum} ({item.umumPct}%)</span>
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-2 transition-all duration-300"
                  style={{ width: `${item.bpjsPct}%` }}
                  title={`BPJS: ${item.bpjsPct}%`}
                />
                <div
                  className="bg-amber-500 h-2 transition-all duration-300"
                  style={{ width: `${item.umumPct}%` }}
                  title={`Umum: ${item.umumPct}%`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
