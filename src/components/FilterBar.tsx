import React, { useState } from 'react';
import { 
  Filter, 
  RotateCcw, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Users, 
  Stethoscope, 
  CreditCard, 
  MapPin, 
  Activity 
} from 'lucide-react';
import { FilterState, AgeGroup } from '../types/referral';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onReset: () => void;
  totalFiltered: number;
  totalRaw: number;
  availableReferrers: string[];
  availableClinics: string[];
  availableDiagnoses: string[];
  availablePatientRegions: string[];
  availableReferrerRegions: string[];
}

const AGE_GROUPS: AgeGroup[] = [
  '< 1 tahun',
  '1–4 tahun',
  '5–14 tahun',
  '15–24 tahun',
  '25–44 tahun',
  '45–59 tahun',
  '60 tahun atau lebih',
  'Tidak diketahui/tidak valid',
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  totalFiltered,
  totalRaw,
  availableReferrers,
  availableClinics,
  availableDiagnoses,
  availablePatientRegions,
  availableReferrerRegions,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Count active filters
  let activeFilterCount = 0;
  if (filters.startDate) activeFilterCount++;
  if (filters.endDate) activeFilterCount++;
  if (filters.kategoriPerujuk !== 'ALL') activeFilterCount++;
  if (filters.namaPerujuk) activeFilterCount++;
  if (filters.wilayahPasien) activeFilterCount++;
  if (filters.kotaKabPasien !== 'ALL') activeFilterCount++;
  if (filters.wilayahPerujuk) activeFilterCount++;
  if (filters.kelompokUsia !== 'ALL') activeFilterCount++;
  if (filters.poliTujuan) activeFilterCount++;
  if (filters.diagnosaAwal) activeFilterCount++;
  if (filters.kategoriPembayaran !== 'ALL') activeFilterCount++;

  const handleFieldChange = (field: keyof FilterState, value: any) => {
    onFilterChange({
      ...filters,
      [field]: value,
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md mb-6">
      {/* Primary compact filter row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Filter Terpadu
            </span>
            <div className="text-[11px] text-slate-400">
              Menampilkan <span className="font-semibold text-emerald-400 font-mono">{totalFiltered.toLocaleString('id-ID')}</span> dari{' '}
              <span className="font-semibold text-slate-300 font-mono">{totalRaw.toLocaleString('id-ID')}</span> rekaman
              {activeFilterCount > 0 && (
                <span className="ml-2 px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-semibold border border-blue-500/30">
                  {activeFilterCount} filter aktif
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Payment filter */}
          <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
            <button
              onClick={() => handleFieldChange('kategoriPembayaran', 'ALL')}
              className={`px-2 py-1 text-xs rounded-md font-medium transition-all ${
                filters.kategoriPembayaran === 'ALL'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Semua Bayar
            </button>
            <button
              onClick={() => handleFieldChange('kategoriPembayaran', 'BPJS')}
              className={`px-2 py-1 text-xs rounded-md font-medium transition-all ${
                filters.kategoriPembayaran === 'BPJS'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              BPJS
            </button>
            <button
              onClick={() => handleFieldChange('kategoriPembayaran', 'Umum/Tunai')}
              className={`px-2 py-1 text-xs rounded-md font-medium transition-all ${
                filters.kategoriPembayaran === 'Umum/Tunai'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Umum/Tunai
            </button>
          </div>

          {/* Quick Internal/External filter */}
          <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
            <button
              onClick={() => handleFieldChange('kategoriPerujuk', 'ALL')}
              className={`px-2 py-1 text-xs rounded-md font-medium transition-all ${
                filters.kategoriPerujuk === 'ALL'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Semua Perujuk
            </button>
            <button
              onClick={() => handleFieldChange('kategoriPerujuk', 'Eksternal')}
              className={`px-2 py-1 text-xs rounded-md font-medium transition-all ${
                filters.kategoriPerujuk === 'Eksternal'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Eksternal
            </button>
            <button
              onClick={() => handleFieldChange('kategoriPerujuk', 'Internal')}
              className={`px-2 py-1 text-xs rounded-md font-medium transition-all ${
                filters.kategoriPerujuk === 'Internal'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Internal
            </button>
          </div>

          {/* Toggle expand button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
          >
            <span>{isExpanded ? 'Tutup Filter Lengkap' : 'Buka Filter Lengkap'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all"
              title="Reset seluruh filter"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Expanded detailed multi-filter controls */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Tanggal Awal & Akhir */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-emerald-400" />
              Rentang Tanggal Kunjungan
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFieldChange('startDate', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
              />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFieldChange('endDate', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Nama Faskes Perujuk */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
              <Users className="w-3 h-3 text-blue-400" />
              Nama Faskes Perujuk
            </label>
            <select
              value={filters.namaPerujuk}
              onChange={(e) => handleFieldChange('namaPerujuk', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-blue-500 truncate"
            >
              <option value="">Semua Faskes Perujuk</option>
              {availableReferrers.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Poli Tujuan Rujukan */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
              <Stethoscope className="w-3 h-3 text-teal-400" />
              Poli Tujuan
            </label>
            <select
              value={filters.poliTujuan}
              onChange={(e) => handleFieldChange('poliTujuan', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-teal-500 truncate"
            >
              <option value="">Semua Poli Rujukan</option>
              {availableClinics.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Rentang Usia */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
              <Activity className="w-3 h-3 text-amber-400" />
              Kelompok Usia Pasien
            </label>
            <select
              value={filters.kelompokUsia}
              onChange={(e) => handleFieldChange('kelompokUsia', e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Semua Kelompok Usia</option>
              {AGE_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Wilayah Pasien (Kota/Kab & Kecamatan) */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-rose-400" />
              Wilayah Asal Pasien
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <select
                value={filters.kotaKabPasien}
                onChange={(e) => handleFieldChange('kotaKabPasien', e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-1.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-rose-500"
              >
                <option value="ALL">Semua Kota/Kab</option>
                <option value="Kota Sukabumi">Kota Sukabumi</option>
                <option value="Kabupaten Sukabumi">Kab. Sukabumi</option>
                <option value="Perlu verifikasi">Perlu Verifikasi</option>
              </select>
              <select
                value={filters.wilayahPasien}
                onChange={(e) => handleFieldChange('wilayahPasien', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-1.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-rose-500 truncate"
              >
                <option value="">Semua Kecamatan</option>
                {availablePatientRegions.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Wilayah Asal Perujuk */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-indigo-400" />
              Wilayah Faskes Perujuk
            </label>
            <select
              value={filters.wilayahPerujuk}
              onChange={(e) => handleFieldChange('wilayahPerujuk', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 truncate"
            >
              <option value="">Semua Wilayah Perujuk</option>
              {availableReferrerRegions.map((wp) => (
                <option key={wp} value={wp}>
                  {wp}
                </option>
              ))}
            </select>
          </div>

          {/* Diagnosis Awal */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
              <Activity className="w-3 h-3 text-cyan-400" />
              Diagnosis Awal
            </label>
            <select
              value={filters.diagnosaAwal}
              onChange={(e) => handleFieldChange('diagnosaAwal', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-500 truncate"
            >
              <option value="">Semua Diagnosis Awal</option>
              {availableDiagnoses.slice(0, 40).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Cara Pembayaran Detail */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
              <CreditCard className="w-3 h-3 text-emerald-400" />
              Kategori Pembayaran (no rujukan)
            </label>
            <select
              value={filters.kategoriPembayaran}
              onChange={(e) => handleFieldChange('kategoriPembayaran', e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">Semua Kategori (BPJS & Umum)</option>
              <option value="BPJS">BPJS (no rujukan terisi)</option>
              <option value="Umum/Tunai">Umum/Tunai (no rujukan kosong)</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
