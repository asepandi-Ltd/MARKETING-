import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Share2, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  AlertCircle, 
  ArrowUpDown, 
  Eye, 
  X, 
  ExternalLink, 
  PhoneCall,
  MapPin,
  CheckCircle2,
  Info
} from 'lucide-react';
import { CleanReferralRecord, DashboardKpiSummary } from '../types/referral';
import { computeExternalReferrers, ReferrerDetailSummary } from '../utils/analytics';

interface ReferrerAnalysisModuleProps {
  records: CleanReferralRecord[];
  summary: DashboardKpiSummary;
}

export const ReferrerAnalysisModule: React.FC<ReferrerAnalysisModuleProps> = ({ records, summary }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBadge, setFilterBadge] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'total' | 'growth' | 'recent' | 'bpjs'>('total');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedReferrer, setSelectedReferrer] = useState<ReferrerDetailSummary | null>(null);

  // Distinct months in records for columns
  const months = useMemo(() => {
    const set = new Set<string>();
    for (const r of records) {
      if (r.bulan && r.bulan !== 'Tidak Valid') set.add(r.bulan);
    }
    return Array.from(set).sort();
  }, [records]);

  // Compute external referrers
  const externalReferrers = useMemo(() => {
    return computeExternalReferrers(records, months);
  }, [records, months]);

  // Internal referrers count & details
  const internalRecords = useMemo(() => {
    return records.filter((r) => r.kategoriPerujuk === 'Internal');
  }, [records]);

  // Filtered and sorted list
  const filteredList = useMemo(() => {
    return externalReferrers
      .filter((r) => {
        const matchSearch =
          r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.address.toLowerCase().includes(searchTerm.toLowerCase());
        const matchBadge = filterBadge === 'ALL' || r.statusBadge === filterBadge;
        return matchSearch && matchBadge;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === 'total') diff = a.totalKunjungan - b.totalKunjungan;
        else if (sortField === 'growth') diff = (a.growthPct ?? -999) - (b.growthPct ?? -999);
        else if (sortField === 'recent') diff = a.recentMonthCount - b.recentMonthCount;
        else if (sortField === 'bpjs') diff = a.bpjsCount - b.bpjsCount;
        return sortAsc ? diff : -diff;
      });
  }, [externalReferrers, searchTerm, filterBadge, sortField, sortAsc]);

  // Badges count summary
  const badgeCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'Top Volume': 0,
      'Tren Meningkat': 0,
      'Tren Menurun': 0,
      'Perujuk Baru': 0,
      'Perlu Tindak Lanjut': 0,
    };
    for (const r of externalReferrers) {
      if (counts[r.statusBadge] !== undefined) counts[r.statusBadge]++;
    }
    return counts;
  }, [externalReferrers]);

  return (
    <div className="space-y-6">
      {/* Title & Classification Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Share2 className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-white">
                Modul Analisis Perujuk & Kemitraan Faskes
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Berdasarkan kolom <code className="text-blue-400 font-mono">Perujuk Internal / Eksternal</code> dan <code className="text-blue-400 font-mono">alamat perujuk</code>. 
              Sistem memisahkan secara ketat rujukan internal RSUD Al-Mulk dari fasilitas kesehatan eksternal mitra.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-semibold">
              Internal: {internalRecords.length} ({summary.internalPct}%)
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs font-semibold">
              Eksternal: {externalReferrers.length} Mitra ({summary.eksternalPct}%)
            </span>
          </div>
        </div>
      </div>

      {/* Mandatory Analysis Caveats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-2.5 text-slate-300">
          <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-white block mb-0.5">Aturan Klasifikasi Internal Al-Mulk:</strong>
            Setiap pencatatan dengan nama <em>RSUD Al-Mulk / Poli Internal / IGD Al-Mulk</em> dikelompokkan sebagai perujuk internal dan tidak dihitung sebagai mitra jejaring eksternal.
          </div>
        </div>

        <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 flex items-start gap-2.5 text-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-300 block mb-0.5">Pedoman Penilaian Kualitas & Tren:</strong>
            Volume kunjungan yang tinggi tidak serta merta mencerminkan kualitas klinis rujukan. Analisis kenaikan/penurunan hanya berlaku apabila periode pembanding setara dan volume mencukupi.
          </div>
        </div>
      </div>

      {/* Strategic Indicator Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilterBadge('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            filterBadge === 'ALL'
              ? 'bg-slate-700 text-white font-semibold'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
          }`}
        >
          Semua Mitra ({externalReferrers.length})
        </button>

        <button
          onClick={() => setFilterBadge('Top Volume')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            filterBadge === 'Top Volume'
              ? 'bg-emerald-600 text-white font-semibold'
              : 'bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-900/40'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Top Volume ({badgeCounts['Top Volume']})
        </button>

        <button
          onClick={() => setFilterBadge('Tren Meningkat')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            filterBadge === 'Tren Meningkat'
              ? 'bg-blue-600 text-white font-semibold'
              : 'bg-slate-900 hover:bg-slate-800 text-blue-300 border border-blue-900/40'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
          Tren Meningkat ({badgeCounts['Tren Meningkat']})
        </button>

        <button
          onClick={() => setFilterBadge('Tren Menurun')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            filterBadge === 'Tren Menurun'
              ? 'bg-rose-600 text-white font-semibold'
              : 'bg-slate-900 hover:bg-slate-800 text-rose-300 border border-rose-900/40'
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
          Tren Menurun ({badgeCounts['Tren Menurun']})
        </button>

        <button
          onClick={() => setFilterBadge('Perujuk Baru')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            filterBadge === 'Perujuk Baru'
              ? 'bg-purple-600 text-white font-semibold'
              : 'bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-900/40'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          Perujuk Baru ({badgeCounts['Perujuk Baru']})
        </button>

        <button
          onClick={() => setFilterBadge('Perlu Tindak Lanjut')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            filterBadge === 'Perlu Tindak Lanjut'
              ? 'bg-amber-600 text-white font-semibold'
              : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-900/40'
          }`}
        >
          <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
          Perlu Tindak Lanjut ({badgeCounts['Perlu Tindak Lanjut']})
        </button>
      </div>

      {/* Search & Sort Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama perujuk atau alamat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Urutkan:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="total">Total Kunjungan</option>
              <option value="recent">Kunjungan Bulan Terkini</option>
              <option value="growth">Pertumbuhan (%)</option>
              <option value="bpjs">Volume BPJS</option>
            </select>
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white"
              title="Balik urutan"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Table of External Referrers */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3 rounded-l-lg">Nama Faskes Perujuk</th>
                <th className="py-2.5 px-3">Alamat / Wilayah</th>
                <th className="py-2.5 px-3 text-right">Total Kunjungan</th>
                <th className="py-2.5 px-3 text-right">Porsi (%)</th>
                <th className="py-2.5 px-3 text-right">BPJS</th>
                <th className="py-2.5 px-3 text-right">Umum</th>
                <th className="py-2.5 px-3 text-right">Bulan Terkini</th>
                <th className="py-2.5 px-3 text-center">Status Strategis</th>
                <th className="py-2.5 px-3 text-center rounded-r-lg">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredList.map((ref) => {
                let badgeClass = 'bg-slate-800 text-slate-300';
                if (ref.statusBadge === 'Top Volume') badgeClass = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
                else if (ref.statusBadge === 'Tren Meningkat') badgeClass = 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
                else if (ref.statusBadge === 'Tren Menurun') badgeClass = 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
                else if (ref.statusBadge === 'Perujuk Baru') badgeClass = 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
                else if (ref.statusBadge === 'Perlu Tindak Lanjut') badgeClass = 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold';

                return (
                  <tr key={ref.name} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-white">
                      <div className="flex items-center gap-1.5">
                        <Share2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                        <span className="truncate max-w-[220px]" title={ref.name}>{ref.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 truncate max-w-[200px]" title={ref.address}>
                      {ref.address || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                      {ref.totalKunjungan}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                      {ref.pctOfTotal}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                      {ref.bpjsCount}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-amber-400">
                      {ref.umumCount}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      <span className="font-semibold text-slate-200">{ref.recentMonthCount}</span>
                      {ref.growthPct !== null && (
                        <span className={`block text-[10px] ${ref.growthPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {ref.growthPct >= 0 ? '+' : ''}{ref.growthPct}% MoM
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${badgeClass}`}>
                        {ref.statusBadge}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => setSelectedReferrer(ref)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-300 text-[11px] font-medium transition-all"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Detail</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredList.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-xs">
              Tidak ada mitra perujuk eksternal yang cocok dengan kriteria filter atau pencarian.
            </div>
          )}
        </div>
      </div>

      {/* Referrer Detail Modal Drawer */}
      {selectedReferrer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-xs text-slate-300">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase tracking-wider">
                  Profil Rujukan Mitra Eksternal
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  {selectedReferrer.name}
                </h3>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  {selectedReferrer.address}
                </p>
              </div>

              <button
                onClick={() => setSelectedReferrer(null)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Total Kunjungan</span>
                <span className="text-xl font-bold font-mono text-white">{selectedReferrer.totalKunjungan}</span>
                <span className="text-[10px] text-slate-500 block">{selectedReferrer.pctOfTotal}% dari total eksternal</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">BPJS (No Rujukan)</span>
                <span className="text-xl font-bold font-mono text-emerald-400">{selectedReferrer.bpjsCount}</span>
                <span className="text-[10px] text-slate-500 block">
                  {Math.round((selectedReferrer.bpjsCount / selectedReferrer.totalKunjungan) * 100)}%
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Umum/Tunai</span>
                <span className="text-xl font-bold font-mono text-amber-400">{selectedReferrer.umumCount}</span>
                <span className="text-[10px] text-slate-500 block">
                  {Math.round((selectedReferrer.umumCount / selectedReferrer.totalKunjungan) * 100)}%
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Status Strategis</span>
                <span className="text-xs font-bold text-blue-300 block mt-1">{selectedReferrer.statusBadge}</span>
              </div>
            </div>

            {/* Monthly Trend breakdown for this specific referrer */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 my-4">
              <h4 className="text-xs font-bold text-white mb-2">Tren Kunjungan Bulanan</h4>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                {months.map((m) => {
                  const count = selectedReferrer.monthlyMap[m] || 0;
                  return (
                    <div key={m} className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-mono">{m}</span>
                      <span className="text-sm font-bold font-mono text-emerald-400">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Target Poli and Top Diagnoses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <h4 className="text-xs font-bold text-white mb-2">Distribusi Poli Tujuan</h4>
                <div className="space-y-1.5">
                  {Object.entries(selectedReferrer.poliMap)
                    .sort(([, a], [, b]) => b - a)
                    .map(([poli, count]) => (
                      <div key={poli} className="flex justify-between items-center text-xs">
                        <span className="text-slate-300 truncate max-w-[170px]">{poli}</span>
                        <span className="font-mono font-bold text-teal-400">{count} rujukan</span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <h4 className="text-xs font-bold text-white mb-2">Diagnosis & Profil Pasien</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Diagnosis Terbanyak:</span>
                    <span className="font-semibold text-cyan-300">{selectedReferrer.topDiagnosis}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Kelompok Usia Dominan:</span>
                    <span className="font-semibold text-amber-300">{selectedReferrer.primaryAgeGroup}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action plan recommendation */}
            <div className="mt-4 p-3 rounded-lg bg-blue-950/30 border border-blue-800/40 text-blue-200">
              <strong className="block text-white mb-1">Rekomendasi Tindak Lanjut Pemasaran RSUD Al-Mulk:</strong>
              {selectedReferrer.statusBadge === 'Perlu Tindak Lanjut' ? (
                <p>
                  Volume rujukan dari {selectedReferrer.name} mengalami penurunan signifikan pada bulan terakhir. Disarankan kunjungan silaturahmi kemitraan oleh tim Humas & Pemasaran untuk evaluasi kendala pelayanan atau rujukan balik (PRB).
                </p>
              ) : selectedReferrer.statusBadge === 'Top Volume' ? (
                <p>
                  Pertahankan loyalitas faskes primer ini melalui workshop klinis berkala, kemudahan koordinasi kuota rujukan bridging BPJS, dan apresiasi kemitraan tahunan.
                </p>
              ) : (
                <p>
                  Perluas sosialisasi jadwal dokter spesialis baru RSUD Al-Mulk dan fasilitas penunjang (Laboratorium, Rontgen, USG 4D) ke dokter pengirim di faskes ini.
                </p>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedReferrer(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
