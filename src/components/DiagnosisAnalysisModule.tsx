import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  Search, 
  Stethoscope, 
  Users, 
  CreditCard, 
  MapPin, 
  AlertCircle, 
  ShieldCheck,
  FileCode2
} from 'lucide-react';
import { CleanReferralRecord, DashboardKpiSummary } from '../types/referral';

interface DiagnosisAnalysisModuleProps {
  records: CleanReferralRecord[];
  summary: DashboardKpiSummary;
}

export const DiagnosisAnalysisModule: React.FC<DiagnosisAnalysisModuleProps> = ({ records, summary }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDiag, setSelectedDiag] = useState<string | null>(null);

  // Group by Diagnosis
  const diagnosisList = useMemo(() => {
    const map: Record<string, {
      name: string;
      icdCode: string;
      total: number;
      pct: number;
      bpjs: number;
      umum: number;
      poliMap: Record<string, number>;
      ageMap: Record<string, number>;
      wilayahMap: Record<string, number>;
      referrerMap: Record<string, number>;
    }> = {};

    const totalAll = records.length || 1;

    for (const r of records) {
      const diag = r.diagnosaAwal || 'Diagnosis tidak tercatat';
      if (!map[diag]) {
        map[diag] = {
          name: diag,
          icdCode: r.kodeIcd || '-',
          total: 0,
          pct: 0,
          bpjs: 0,
          umum: 0,
          poliMap: {},
          ageMap: {},
          wilayahMap: {},
          referrerMap: {},
        };
      }

      map[diag].total++;
      if (r.kategoriPembayaran === 'BPJS') map[diag].bpjs++;
      else map[diag].umum++;

      const p = r.poliTujuan || 'Lainnya';
      map[diag].poliMap[p] = (map[diag].poliMap[p] || 0) + 1;

      map[diag].ageMap[r.kelompokUsia] = (map[diag].ageMap[r.kelompokUsia] || 0) + 1;

      const w = r.wilayahPasienNormal || 'Perlu verifikasi';
      map[diag].wilayahMap[w] = (map[diag].wilayahMap[w] || 0) + 1;

      if (r.perujukClean) {
        map[diag].referrerMap[r.perujukClean] = (map[diag].referrerMap[r.perujukClean] || 0) + 1;
      }
    }

    const list = Object.values(map).map((item) => {
      item.pct = Math.round((item.total / totalAll) * 1000) / 10;
      return item;
    });

    return list.sort((a, b) => b.total - a.total);
  }, [records]);

  // Filtered by search
  const filteredDiagnoses = useMemo(() => {
    return diagnosisList.filter((d) => 
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.icdCode.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [diagnosisList, searchTerm]);

  const activeDiag = selectedDiag 
    ? diagnosisList.find((d) => d.name === selectedDiag) || diagnosisList[0] 
    : diagnosisList[0];

  return (
    <div className="space-y-6">
      {/* Title & Clinical Disclaimer Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Activity className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-white">
                Modul Analisis Diagnosis Awal Rujukan
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Berdasarkan kolom sumber <code className="text-cyan-400 font-mono">diagnosa awal</code> dengan mempertahankan kode ICD sumber tanpa menebak atau memodifikasi data klinis.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-blue-950/40 border border-blue-800/40 text-xs text-blue-200 max-w-md">
            <div className="flex items-start gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Tujuan Agregat:</strong> Modul ini murni untuk pemetaan kebutuhan kapasitas medis dan pengadaan obat/reagen di RSUD Al-Mulk, bukan panduan terapi pasien individual.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Diagnosis Master List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari diagnosis atau kode ICD (misal: I10, Diabetes, Gastritis)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <span className="text-xs text-slate-400">
            Ditemukan <strong className="text-cyan-400 font-mono">{filteredDiagnoses.length}</strong> jenis diagnosis awal
          </span>
        </div>

        {/* Top Diagnoses Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3 rounded-l-lg">Kode ICD</th>
                <th className="py-2.5 px-3">Diagnosis Awal Sumber</th>
                <th className="py-2.5 px-3 text-right">Total Kunjungan</th>
                <th className="py-2.5 px-3 text-right">Porsi (%)</th>
                <th className="py-2.5 px-3 text-right">BPJS</th>
                <th className="py-2.5 px-3 text-right">Umum</th>
                <th className="py-2.5 px-3 text-center rounded-r-lg">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredDiagnoses.slice(0, 15).map((d) => {
                const isSelected = activeDiag?.name === d.name;
                return (
                  <tr
                    key={d.name}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isSelected ? 'bg-cyan-950/20' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <span className="font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 text-[11px] font-semibold">
                        {d.icdCode}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-white truncate max-w-[280px]" title={d.name}>
                      {d.name}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-100">
                      {d.total}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                      {d.pct}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                      {d.bpjs}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-amber-400">
                      {d.umum}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => setSelectedDiag(d.name)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-medium transition-all"
                      >
                        Detail Sebaran
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Diagnosis Cross-Tabs Card */}
      {activeDiag && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800 gap-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                Audit Sebaran Diagnosis Terpilih
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                {activeDiag.name}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded bg-slate-800 text-cyan-300 font-mono text-xs">
                Kode: {activeDiag.icdCode}
              </span>
              <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 font-mono text-xs">
                Total: {activeDiag.total} rujukan ({activeDiag.pct}%)
              </span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Poli Distribution */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs font-bold text-teal-400 block mb-3">
                Diserap oleh Poli Rujukan:
              </span>
              <div className="space-y-2">
                {Object.entries(activeDiag.poliMap)
                  .sort(([, a], [, b]) => b - a)
                  .map(([poli, count]) => (
                    <div key={poli} className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 truncate max-w-[170px]">{poli}</span>
                      <span className="font-mono font-bold text-teal-400">{count}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Age Group Distribution */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs font-bold text-amber-400 block mb-3">
                Kelompok Usia Pasien:
              </span>
              <div className="space-y-2">
                {Object.entries(activeDiag.ageMap)
                  .sort(([, a], [, b]) => b - a)
                  .map(([age, count]) => (
                    <div key={age} className="flex justify-between items-center text-xs">
                      <span className="text-slate-300">{age}</span>
                      <span className="font-mono font-bold text-amber-400">{count}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Referrer Distribution */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs font-bold text-blue-400 block mb-3">
                Faskes Pengirim Rujukan Terbanyak:
              </span>
              <div className="space-y-2">
                {Object.entries(activeDiag.referrerMap)
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
          </div>
        </div>
      )}
    </div>
  );
};
