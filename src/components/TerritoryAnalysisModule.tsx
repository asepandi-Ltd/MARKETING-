import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  Compass, 
  Navigation, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  ShieldCheck, 
  TrendingUp,
  Building,
  Target
} from 'lucide-react';
import { CleanReferralRecord, DashboardKpiSummary } from '../types/referral';
import { SUKABUMI_DISTRICTS, RSUD_AL_MULK_INFO } from '../utils/geoSukabumi';

interface TerritoryAnalysisModuleProps {
  records: CleanReferralRecord[];
  summary: DashboardKpiSummary;
}

export const TerritoryAnalysisModule: React.FC<TerritoryAnalysisModuleProps> = ({ records, summary }) => {
  const [activeView, setActiveView] = useState<'patient' | 'referrer' | 'comparison'>('patient');
  const [selectedKecamatan, setSelectedKecamatan] = useState<string | null>(null);

  // Group by Patient Territory
  const patientTerritories = useMemo(() => {
    const map: Record<string, {
      name: string;
      kecamatan: string;
      kotaKab: string;
      count: number;
      bpjs: number;
      umum: number;
      poliMap: Record<string, number>;
    }> = {};

    for (const r of records) {
      const key = r.wilayahPasienNormal || 'Perlu verifikasi';
      if (!map[key]) {
        map[key] = {
          name: key,
          kecamatan: r.kecamatanPasien,
          kotaKab: r.kotaKabPasien,
          count: 0,
          bpjs: 0,
          umum: 0,
          poliMap: {},
        };
      }
      map[key].count++;
      if (r.kategoriPembayaran === 'BPJS') map[key].bpjs++;
      else map[key].umum++;

      const p = r.poliTujuan || 'Lainnya';
      map[key].poliMap[p] = (map[key].poliMap[p] || 0) + 1;
    }

    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [records]);

  // Group by Referrer Territory
  const referrerTerritories = useMemo(() => {
    const map: Record<string, {
      name: string;
      kotaKab: string;
      count: number;
      bpjs: number;
      umum: number;
    }> = {};

    for (const r of records) {
      const key = r.wilayahPerujuk || 'Perlu verifikasi';
      if (!map[key]) {
        map[key] = {
          name: key,
          kotaKab: r.kotaKabPerujuk,
          count: 0,
          bpjs: 0,
          umum: 0,
        };
      }
      map[key].count++;
      if (r.kategoriPembayaran === 'BPJS') map[key].bpjs++;
      else map[key].umum++;
    }

    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [records]);

  // Kota Sukabumi vs Kabupaten Sukabumi split
  const administrativeSplit = useMemo(() => {
    let kota = 0;
    let kab = 0;
    let luar = 0;
    let unverified = 0;

    for (const r of records) {
      if (r.kotaKabPasien === 'Kota Sukabumi') kota++;
      else if (r.kotaKabPasien === 'Kabupaten Sukabumi') kab++;
      else if (r.kotaKabPasien === 'Luar Sukabumi') luar++;
      else unverified++;
    }

    const total = records.length || 1;
    return {
      kota,
      kotaPct: Math.round((kota / total) * 1000) / 10,
      kab,
      kabPct: Math.round((kab / total) * 1000) / 10,
      luar,
      luarPct: Math.round((luar / total) * 1000) / 10,
      unverified,
      unverifiedPct: Math.round((unverified / total) * 1000) / 10,
    };
  }, [records]);

  // Unverified territory count
  const unverifiedRecords = patientTerritories.find((t) => t.name === 'Perlu verifikasi')?.count || 0;

  return (
    <div className="space-y-6">
      {/* Title & Privacy Policy Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Compass className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-white">
                Modul Pemetaan Wilayah Pemasaran Rujukan
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Berdasarkan pemetaan administratif kolom <code className="text-rose-400 font-mono">alamat</code> (pasien) dan <code className="text-rose-400 font-mono">alamat perujuk</code>.
            </p>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              <strong>Kepatuhan Privasi:</strong> Alamat presisi & nama jalan pasien diabaikan demi privasi; visualisasi menggunakan agregat wilayah administratif.
            </span>
          </div>
        </div>
      </div>

      {/* Kota Sukabumi vs Kabupaten Sukabumi Split Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md hover:border-emerald-800/60 transition-all">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Kota Sukabumi (Domisili Inti)
          </span>
          <div className="text-2xl font-black text-emerald-300 font-mono">
            {administrativeSplit.kota}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
            <span>Pangsa Pasien</span>
            <span className="font-semibold text-emerald-400">{administrativeSplit.kotaPct}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${administrativeSplit.kotaPct}%` }} />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md hover:border-blue-800/60 transition-all">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Kabupaten Sukabumi (Perbatasan)
          </span>
          <div className="text-2xl font-black text-blue-300 font-mono">
            {administrativeSplit.kab}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
            <span>Pangsa Pasien</span>
            <span className="font-semibold text-blue-400">{administrativeSplit.kabPct}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${administrativeSplit.kabPct}%` }} />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md hover:border-purple-800/60 transition-all">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Luar Sukabumi / Lainnya
          </span>
          <div className="text-2xl font-black text-purple-300 font-mono">
            {administrativeSplit.luar}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
            <span>Pangsa Pasien</span>
            <span className="font-semibold text-purple-400">{administrativeSplit.luarPct}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${administrativeSplit.luarPct}%` }} />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md hover:border-amber-800/60 transition-all">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Perlu Verifikasi (Alamat Ambigu)
          </span>
          <div className="text-2xl font-black text-amber-300 font-mono">
            {administrativeSplit.unverified}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
            <span>Format Tidak Lengkap</span>
            <span className="font-semibold text-amber-400">{administrativeSplit.unverifiedPct}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${administrativeSplit.unverifiedPct}%` }} />
          </div>
        </div>
      </div>

      {/* Interactive Sukabumi Distance Rings & Cluster Map */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800 gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Navigation className="w-4 h-4 text-emerald-400" />
              Zonasi Jarak Rujukan Berbasis RSUD Al-Mulk Lembursitu (KM 6)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Analisis penetrasi koridor Jl. Pelabuhan II & sebaran zona Ring 1 (&lt; 5 km), Ring 2 (5-15 km), dan Ring 3 (&gt; 15 km).
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              Ring 1: &lt; 5 km
            </span>
            <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
              Ring 2: 5-15 km
            </span>
            <span className="px-2 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">
              Ring 3: &gt; 15 km
            </span>
          </div>
        </div>

        {/* Geographic Zones & Opportunity Grid */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Ring 1 - Core Basis */}
          <div className="p-4 rounded-xl bg-slate-950 border border-emerald-800/40">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" /> Ring 1: Zona Inti (&lt; 5 KM)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                Prioritas Tinggi
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 mb-3">
              Wilayah tetangga langsung RSUD Al-Mulk di koridor Jl. Pelabuhan II.
            </p>
            <div className="space-y-2">
              {['Lembursitu', 'Baros', 'Gunungguruh'].map((kec) => {
                const info = SUKABUMI_DISTRICTS[kec];
                const count = records.filter((r) => r.kecamatanPasien === kec).length;
                return (
                  <div key={kec} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-semibold text-white block">{kec}</span>
                      <span className="text-[10px] text-slate-400">{info?.deskripsi}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-400">{count}</span>
                      <span className="text-[10px] text-slate-500 block">kunjungan</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ring 2 - Expansion Zone */}
          <div className="p-4 rounded-xl bg-slate-950 border border-blue-800/40">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" /> Ring 2: Zona Ekspansi (5-15 KM)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold">
                Potensi Menengah
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 mb-3">
              Kecamatan tengah kota & perbatasan Kabupaten dengan akses jalan langsung.
            </p>
            <div className="space-y-2">
              {['Citamiang', 'Warudoyong', 'Cikole', 'Cibeureum', 'Nyalindung', 'Cikembar', 'Cisaat'].slice(0, 4).map((kec) => {
                const count = records.filter((r) => r.kecamatanPasien === kec).length;
                return (
                  <div key={kec} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-semibold text-white block">{kec}</span>
                      <span className="text-[10px] text-slate-400">{SUKABUMI_DISTRICTS[kec]?.deskripsi}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-blue-400">{count}</span>
                      <span className="text-[10px] text-slate-500 block">kunjungan</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Marketing Opportunities Highlight */}
          <div className="p-4 rounded-xl bg-slate-950 border border-purple-800/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" /> Evaluasi Pasar & Peluang Ekspansi
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold">
                  Tindakan Humas
                </span>
              </div>
              <div className="mt-3 space-y-3 text-xs text-slate-300">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <strong className="text-emerald-300 block mb-1">Koridor Nyalindung & Jampang:</strong>
                  Pasien dari Nyalindung dan Jampang Tengah yang menuju Kota Sukabumi pertama kali melewati RSUD Al-Mulk di KM 6 Lembursitu sebelum menjangkau rumah sakit di pusat kota. Evaluasi kemitraan rujukan rawat inap dan IGD dengan Puskesmas Nyalindung.
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <strong className="text-blue-300 block mb-1">Kawasan Industri Cikembar:</strong>
                  Potensi rujukan kasus bedah ringan, kecelakaan kerja, dan pemeriksaan berkala pekerja pabrik melalui pendekatan BPJS Ketenagakerjaan & Puskesmas Cikembar.
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>Prioritaskan alokasi ambulans jemputan dan kemudahan kuota BPJS.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top 10 Tables: Patient Origin vs Referrer Origin */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top 10 Patient Territories */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                Top 10 Wilayah Asal Pasien
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Kecamatan dengan volume kunjungan rujukan terbanyak ke RSUD Al-Mulk.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {patientTerritories.slice(0, 10).map((t, idx) => {
              const pct = records.length > 0 ? Math.round((t.count / records.length) * 1000) / 10 : 0;
              return (
                <div key={t.name} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-mono">
                        {idx + 1}
                      </span>
                      <span className="truncate max-w-[200px]" title={t.name}>{t.name}</span>
                    </span>
                    <span className="font-mono text-slate-300">
                      <strong className="text-emerald-400">{t.count}</strong> kunjungan ({pct}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>BPJS: <strong className="text-slate-300">{t.bpjs}</strong> | Umum: <strong className="text-slate-300">{t.umum}</strong></span>
                    <span className="text-[10px] text-slate-500">{t.kotaKab}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 10 Referrer Origin Territories */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-400" />
                Top 10 Wilayah Asal Perujuk (Faskes)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Lokasi faskes mitra perujuk eksternal yang paling aktif mengirim pasien.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {referrerTerritories.slice(0, 10).map((t, idx) => {
              const pct = records.length > 0 ? Math.round((t.count / records.length) * 1000) / 10 : 0;
              return (
                <div key={t.name} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-mono">
                        {idx + 1}
                      </span>
                      <span className="truncate max-w-[200px]" title={t.name}>{t.name}</span>
                    </span>
                    <span className="font-mono text-slate-300">
                      <strong className="text-blue-400">{t.count}</strong> kunjungan ({pct}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>BPJS: <strong className="text-slate-300">{t.bpjs}</strong> | Umum: <strong className="text-slate-300">{t.umum}</strong></span>
                    <span className="text-[10px] text-slate-500">{t.kotaKab}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
