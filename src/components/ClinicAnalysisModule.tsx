import React, { useState, useMemo } from 'react';
import { 
  Stethoscope, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Users, 
  MapPin, 
  CreditCard, 
  CheckCircle2, 
  Eye 
} from 'lucide-react';
import { CleanReferralRecord, DashboardKpiSummary } from '../types/referral';

interface ClinicAnalysisModuleProps {
  records: CleanReferralRecord[];
  summary: DashboardKpiSummary;
}

export const ClinicAnalysisModule: React.FC<ClinicAnalysisModuleProps> = ({ records, summary }) => {
  const [selectedPoli, setSelectedPoli] = useState<string | null>(null);

  // Group by Poli
  const poliList = useMemo(() => {
    const map: Record<string, {
      name: string;
      total: number;
      pct: number;
      bpjs: number;
      umum: number;
      referrerMap: Record<string, number>;
      wilayahMap: Record<string, number>;
      diagMap: Record<string, number>;
      ageMap: Record<string, number>;
      monthMap: Record<string, number>;
    }> = {};

    const totalAll = records.length || 1;

    for (const r of records) {
      const p = r.poliTujuan || 'Lainnya';
      if (!map[p]) {
        map[p] = {
          name: p,
          total: 0,
          pct: 0,
          bpjs: 0,
          umum: 0,
          referrerMap: {},
          wilayahMap: {},
          diagMap: {},
          ageMap: {},
          monthMap: {},
        };
      }

      map[p].total++;
      if (r.kategoriPembayaran === 'BPJS') map[p].bpjs++;
      else map[p].umum++;

      if (r.perujukClean) {
        map[p].referrerMap[r.perujukClean] = (map[p].referrerMap[r.perujukClean] || 0) + 1;
      }

      const w = r.wilayahPasienNormal || 'Perlu verifikasi';
      map[p].wilayahMap[w] = (map[p].wilayahMap[w] || 0) + 1;

      const d = r.diagnosaAwal || 'Lainnya';
      map[p].diagMap[d] = (map[p].diagMap[d] || 0) + 1;

      map[p].ageMap[r.kelompokUsia] = (map[p].ageMap[r.kelompokUsia] || 0) + 1;

      if (r.bulan) {
        map[p].monthMap[r.bulan] = (map[p].monthMap[r.bulan] || 0) + 1;
      }
    }

    const list = Object.values(map).map((item) => {
      item.pct = Math.round((item.total / totalAll) * 1000) / 10;
      return item;
    });

    return list.sort((a, b) => b.total - a.total);
  }, [records]);

  // Selected Poli details
  const activeDetail = selectedPoli 
    ? poliList.find((p) => p.name === selectedPoli) || poliList[0] 
    : poliList[0];

  return (
    <div className="space-y-6">
      {/* Title & Capacity Disclaimer Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <Stethoscope className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-white">
                Modul Analisis Poli Tujuan Rujukan
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Berdasarkan kolom <code className="text-teal-400 font-mono">Poli rujukan</code> untuk memetakan serapan layanan spesialis di RSUD Al-Mulk.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200 max-w-md">
            <div className="flex items-start gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Prinsip Kapasitas Medis:</strong> Promosi layanan poli spesialis wajib diselaraskan dengan jadwal Surat Izin Praktik (SIP) dokter spesialis, ketersediaan perawat, dan daya tampung antrean ruang tunggu.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Clinics with % share and volume */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {poliList.map((item, idx) => {
          const isSelected = activeDetail?.name === item.name;
          return (
            <div
              key={item.name}
              onClick={() => setSelectedPoli(item.name)}
              className={`cursor-pointer rounded-xl p-4 border transition-all ${
                isSelected
                  ? 'bg-teal-950/30 border-teal-500 shadow-md ring-1 ring-teal-500'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-1.5 font-bold text-white truncate">
                  <span className="w-5 h-5 rounded-md bg-slate-800 text-teal-400 flex items-center justify-center text-[10px] font-mono">
                    {idx + 1}
                  </span>
                  <span className="truncate" title={item.name}>{item.name}</span>
                </div>
                <span className="font-mono text-teal-400 font-bold">{item.pct}%</span>
              </div>

              <div className="text-2xl font-black text-white font-mono mt-1">
                {item.total.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-400">kunjungan</span>
              </div>

              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-teal-500 to-emerald-400 h-1.5 rounded-full"
                  style={{ width: `${Math.max(5, (item.pct / 35) * 100)}%` }}
                />
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>BPJS: <strong className="text-emerald-400">{item.bpjs}</strong></span>
                <span>Umum: <strong className="text-amber-400">{item.umum}</strong></span>
                <span className="text-teal-300 font-medium">Klik rincian &rarr;</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Poli Deep-Dive Drawer */}
      {activeDetail && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800 gap-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">
                Audit Rincian Layanan Spesialis
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">
                {activeDetail.name}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-mono">
                BPJS: {activeDetail.bpjs} ({Math.round((activeDetail.bpjs/activeDetail.total)*100)}%)
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-mono">
                Umum/Tunai: {activeDetail.umum} ({Math.round((activeDetail.umum/activeDetail.total)*100)}%)
              </span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Top Diagnoses in this Poli */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs font-bold text-cyan-400 block mb-3">
                Diagnosis Awal Terbanyak di Poli Ini
              </span>
              <div className="space-y-2">
                {Object.entries(activeDetail.diagMap)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([diag, count]) => (
                    <div key={diag} className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 truncate max-w-[170px]" title={diag}>{diag}</span>
                      <span className="font-mono font-bold text-cyan-400">{count}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Top Referrers for this Poli */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs font-bold text-blue-400 block mb-3">
                Faskes Pengirim Terbanyak
              </span>
              <div className="space-y-2">
                {Object.entries(activeDetail.referrerMap)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([ref, count]) => (
                    <div key={ref} className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 truncate max-w-[170px]" title={ref}>{ref}</span>
                      <span className="font-mono font-bold text-blue-400">{count}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Top Patient Origin for this Poli */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs font-bold text-rose-400 block mb-3">
                Sebaran Wilayah Pasien
              </span>
              <div className="space-y-2">
                {Object.entries(activeDetail.wilayahMap)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([wil, count]) => (
                    <div key={wil} className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 truncate max-w-[170px]" title={wil}>{wil}</span>
                      <span className="font-mono font-bold text-rose-400">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
