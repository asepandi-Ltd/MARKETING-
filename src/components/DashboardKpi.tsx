import React from 'react';
import { 
  Users, 
  Building2, 
  Share2, 
  CheckCircle2, 
  HelpCircle, 
  MapPin, 
  Building, 
  Stethoscope, 
  Calendar, 
  Activity,
  AlertTriangle,
  CreditCard
} from 'lucide-react';
import { DashboardKpiSummary } from '../types/referral';

interface DashboardKpiProps {
  summary: DashboardKpiSummary;
}

export const DashboardKpi: React.FC<DashboardKpiProps> = ({ summary }) => {
  return (
    <div className="space-y-4">
      {/* Disclaimer on patient count vs records */}
      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-950/40 border border-blue-800/40 text-xs text-blue-200">
        <HelpCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
        <span>
          <strong>Catatan Indikator:</strong> Metrik menggunakan istilah <em>"jumlah rekaman"</em> atau <em>"jumlah kunjungan"</em> terkait rujukan masuk, bukan jumlah pasien unik tanpa deduplikasi identitas RM.
        </span>
      </div>

      {/* Grid of the 10 Core KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* KPI 1: Total Rekaman Kunjungan Rujukan */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Rekaman Rujukan</span>
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {summary.totalRekaman.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Rentang: {summary.minDate} s/d {summary.maxDate}
          </div>
          {summary.isPartialMonth && (
            <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-400 font-medium">
              <AlertTriangle className="w-3 h-3" /> Periode parsial terdeteksi
            </div>
          )}
        </div>

        {/* KPI 2: Perujuk Internal */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md hover:border-purple-800/60 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Perujuk Internal</span>
            <Building2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300 font-mono">
            {summary.internalCount.toLocaleString('id-ID')}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
            <span>Porsi rujukan</span>
            <span className="font-semibold text-purple-400">{summary.internalPct}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1 mt-1.5 overflow-hidden">
            <div className="bg-purple-500 h-1 rounded-full" style={{ width: `${summary.internalPct}%` }}></div>
          </div>
        </div>

        {/* KPI 3: Perujuk Eksternal */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md hover:border-blue-800/60 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Perujuk Eksternal</span>
            <Share2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-300 font-mono">
            {summary.eksternalCount.toLocaleString('id-ID')}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
            <span>Porsi rujukan</span>
            <span className="font-semibold text-blue-400">{summary.eksternalPct}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1 mt-1.5 overflow-hidden">
            <div className="bg-blue-500 h-1 rounded-full" style={{ width: `${summary.eksternalPct}%` }}></div>
          </div>
        </div>

        {/* KPI 4: Nomor Rujukan Terisi (BPJS) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md hover:border-emerald-800/60 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">No. Rujukan Terisi (BPJS)</span>
            <CreditCard className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-300 font-mono">
            {summary.bpjsCount.toLocaleString('id-ID')}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
            <span>Kategori BPJS</span>
            <span className="font-semibold text-emerald-400">{summary.bpjsPct}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1 mt-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-1 rounded-full" style={{ width: `${summary.bpjsPct}%` }}></div>
          </div>
        </div>

        {/* KPI 5: Tanpa No Rujukan (Umum/Tunai) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md hover:border-amber-800/60 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Tanpa No. Rujukan (Umum)</span>
            <CreditCard className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono">
            {summary.umumCount.toLocaleString('id-ID')}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
            <span>Kategori Umum/Tunai</span>
            <span className="font-semibold text-amber-400">{summary.umumPct}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1 mt-1.5 overflow-hidden">
            <div className="bg-amber-500 h-1 rounded-full" style={{ width: `${summary.umumPct}%` }}></div>
          </div>
        </div>

        {/* KPI 6: Jumlah Wilayah Asal Pasien */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md hover:border-rose-800/60 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Wilayah Asal Pasien</span>
            <MapPin className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-300 font-mono">
            {summary.uniqueWilayahPasienCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Kecamatan/Wilayah tercatat
          </div>
        </div>

        {/* KPI 7: Jumlah Perujuk Eksternal Tercatat */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md hover:border-indigo-800/60 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Mitra Eksternal Aktif</span>
            <Building className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-300 font-mono">
            {summary.uniquePerujukEksternalCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Puskesmas, Klinik, Dokter
          </div>
        </div>

        {/* KPI 8: Poli Tujuan Tertinggi */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md hover:border-teal-800/60 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Poli Volume Tertinggi</span>
            <Stethoscope className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-base font-bold text-teal-300 truncate" title={summary.topPoli.nama}>
            {summary.topPoli.nama}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
            <span className="font-mono text-slate-300">{summary.topPoli.count.toLocaleString('id-ID')} kunjungan</span>
            <span className="font-semibold text-teal-400">{summary.topPoli.pct}%</span>
          </div>
        </div>

        {/* KPI 9: Kelompok Usia Tertinggi */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md hover:border-amber-800/60 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Usia Dominan</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-base font-bold text-amber-300 truncate" title={summary.topUsia.kelompok}>
            {summary.topUsia.kelompok}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
            <span className="font-mono text-slate-300">{summary.topUsia.count.toLocaleString('id-ID')} kunjungan</span>
            <span className="font-semibold text-amber-400">{summary.topUsia.pct}%</span>
          </div>
        </div>

        {/* KPI 10: Diagnosis Awal Terbanyak */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md hover:border-cyan-800/60 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Diagnosis Terbanyak</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xs font-bold text-cyan-300 line-clamp-2" title={summary.topDiagnosa.nama}>
            {summary.topDiagnosa.nama}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
            <span className="font-mono text-slate-300">{summary.topDiagnosa.count.toLocaleString('id-ID')} kunjungan</span>
            <span className="font-semibold text-cyan-400">{summary.topDiagnosa.pct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
