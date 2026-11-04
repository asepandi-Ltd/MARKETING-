import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Baby, 
  HeartHandshake, 
  Activity, 
  Calendar, 
  Stethoscope, 
  MapPin, 
  CreditCard,
  ShieldCheck 
} from 'lucide-react';
import { CleanReferralRecord, AgeGroup, DashboardKpiSummary } from '../types/referral';

interface AgeAnalysisModuleProps {
  records: CleanReferralRecord[];
  summary: DashboardKpiSummary;
}

const ORDERED_AGE_GROUPS: AgeGroup[] = [
  '< 1 tahun',
  '1–4 tahun',
  '5–14 tahun',
  '15–24 tahun',
  '25–44 tahun',
  '45–59 tahun',
  '60 tahun atau lebih',
  'Tidak diketahui/tidak valid',
];

export const AgeAnalysisModule: React.FC<AgeAnalysisModuleProps> = ({ records, summary }) => {
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<AgeGroup | null>(null);

  // Aggregated data per age group
  const ageGroupData = useMemo(() => {
    const map: Record<AgeGroup, {
      group: AgeGroup;
      count: number;
      pct: number;
      bpjsCount: number;
      umumCount: number;
      poliMap: Record<string, number>;
      diagMap: Record<string, number>;
      wilayahMap: Record<string, number>;
    }> = {
      '< 1 tahun': { group: '< 1 tahun', count: 0, pct: 0, bpjsCount: 0, umumCount: 0, poliMap: {}, diagMap: {}, wilayahMap: {} },
      '1–4 tahun': { group: '1–4 tahun', count: 0, pct: 0, bpjsCount: 0, umumCount: 0, poliMap: {}, diagMap: {}, wilayahMap: {} },
      '5–14 tahun': { group: '5–14 tahun', count: 0, pct: 0, bpjsCount: 0, umumCount: 0, poliMap: {}, diagMap: {}, wilayahMap: {} },
      '15–24 tahun': { group: '15–24 tahun', count: 0, pct: 0, bpjsCount: 0, umumCount: 0, poliMap: {}, diagMap: {}, wilayahMap: {} },
      '25–44 tahun': { group: '25–44 tahun', count: 0, pct: 0, bpjsCount: 0, umumCount: 0, poliMap: {}, diagMap: {}, wilayahMap: {} },
      '45–59 tahun': { group: '45–59 tahun', count: 0, pct: 0, bpjsCount: 0, umumCount: 0, poliMap: {}, diagMap: {}, wilayahMap: {} },
      '60 tahun atau lebih': { group: '60 tahun atau lebih', count: 0, pct: 0, bpjsCount: 0, umumCount: 0, poliMap: {}, diagMap: {}, wilayahMap: {} },
      'Tidak diketahui/tidak valid': { group: 'Tidak diketahui/tidak valid', count: 0, pct: 0, bpjsCount: 0, umumCount: 0, poliMap: {}, diagMap: {}, wilayahMap: {} },
    };

    const total = records.length || 1;

    for (const r of records) {
      const g = r.kelompokUsia;
      if (map[g]) {
        map[g].count++;
        if (r.kategoriPembayaran === 'BPJS') map[g].bpjsCount++;
        else map[g].umumCount++;

        const p = r.poliTujuan || 'Lainnya';
        map[g].poliMap[p] = (map[g].poliMap[p] || 0) + 1;

        const d = r.diagnosaAwal || 'Lainnya';
        map[g].diagMap[d] = (map[g].diagMap[d] || 0) + 1;

        const w = r.wilayahPasienNormal || 'Perlu verifikasi';
        map[g].wilayahMap[w] = (map[g].wilayahMap[w] || 0) + 1;
      }
    }

    // Compute percentages
    for (const g of ORDERED_AGE_GROUPS) {
      map[g].pct = Math.round((map[g].count / total) * 1000) / 10;
    }

    return map;
  }, [records]);

  // Selected group details
  const activeDetail = selectedAgeGroup ? ageGroupData[selectedAgeGroup] : null;

  return (
    <div className="space-y-6">
      {/* Title & Privacy Policy Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Users className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-white">
                Modul Analisis Kelompok & Rentang Usia Pasien Rujukan
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Berdasarkan normalisasi kolom <code className="text-amber-400 font-mono">umur pasien</code> ke dalam 8 kategori kelompok usia standar pelayanan kesehatan.
            </p>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              <strong>Penyajian Agregat:</strong> Seluruh demografi usia disajikan tanpa menampilkan identitas individual pasien.
            </span>
          </div>
        </div>
      </div>

      {/* 8 Age Groups Visual Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ORDERED_AGE_GROUPS.map((group) => {
          const data = ageGroupData[group];
          const isSelected = selectedAgeGroup === group;
          const isTop = data.count > 0 && data.count === Math.max(...ORDERED_AGE_GROUPS.map((g) => ageGroupData[g].count));

          return (
            <div
              key={group}
              onClick={() => setSelectedAgeGroup(isSelected ? null : group)}
              className={`cursor-pointer rounded-xl p-3.5 border transition-all ${
                isSelected
                  ? 'bg-amber-950/30 border-amber-500 shadow-md shadow-amber-950/40 ring-1 ring-amber-500'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-white truncate">{group}</span>
                {isTop && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                    Tertinggi
                  </span>
                )}
              </div>

              <div className="text-xl font-mono font-bold text-amber-300">
                {data.count.toLocaleString('id-ID')}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                <span>Porsi Populasi</span>
                <span className="font-semibold text-amber-400">{data.pct}%</span>
              </div>

              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-yellow-400 h-1.5 rounded-full"
                  style={{ width: `${Math.max(4, (data.pct / 40) * 100)}%` }}
                />
              </div>

              <div className="mt-2 text-[10px] text-slate-500 flex justify-between">
                <span>BPJS: {data.bpjsCount}</span>
                <span>Umum: {data.umumCount}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cross-Tabulation Breakdown for Selected Age Group */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Distribusi Layanan, Diagnosis & Wilayah {selectedAgeGroup ? `untuk Usia: ${selectedAgeGroup}` : '(Seluruh Usia)'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedAgeGroup 
                ? 'Klik kembali kartu usia di atas untuk melihat seluruh kelompok usia.' 
                : 'Pilih salah satu kartu usia di atas untuk menyaring rincian poli dan diagnosis.'}
            </p>
          </div>
          {selectedAgeGroup && (
            <button
              onClick={() => setSelectedAgeGroup(null)}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium"
            >
              Reset Pilihan Usia
            </button>
          )}
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Top Poli for this age group */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-xs font-bold text-teal-400 flex items-center gap-1.5 mb-3">
              <Stethoscope className="w-3.5 h-3.5" /> Poli Tujuan Rujukan Utama
            </span>
            <div className="space-y-2">
              {Object.entries(
                selectedAgeGroup ? ageGroupData[selectedAgeGroup].poliMap : 
                records.reduce((acc, r) => {
                  acc[r.poliTujuan] = (acc[r.poliTujuan] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              )
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([poli, count]) => (
                  <div key={poli} className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 truncate max-w-[160px]">{poli}</span>
                    <span className="font-mono font-bold text-teal-400">{count} kunjungan</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Top Diagnoses for this age group */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 mb-3">
              <Activity className="w-3.5 h-3.5" /> Diagnosis Awal Terbanyak
            </span>
            <div className="space-y-2">
              {Object.entries(
                selectedAgeGroup ? ageGroupData[selectedAgeGroup].diagMap : 
                records.reduce((acc, r) => {
                  acc[r.diagnosaAwal] = (acc[r.diagnosaAwal] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              )
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

          {/* Top Region for this age group */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5 mb-3">
              <MapPin className="w-3.5 h-3.5" /> Wilayah Asal Pasien Dominan
            </span>
            <div className="space-y-2">
              {Object.entries(
                selectedAgeGroup ? ageGroupData[selectedAgeGroup].wilayahMap : 
                records.reduce((acc, r) => {
                  acc[r.wilayahPasienNormal] = (acc[r.wilayahPasienNormal] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              )
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([wil, count]) => (
                  <div key={wil} className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 truncate max-w-[160px]" title={wil}>{wil}</span>
                    <span className="font-mono font-bold text-rose-400">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
