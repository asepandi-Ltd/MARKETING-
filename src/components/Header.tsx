import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Upload, 
  FileText, 
  Database,
  Settings,
  X,
  Calendar,
  Layers,
  DatabaseZap,
  RefreshCw,
  Stethoscope,
  Info,
  CheckCircle2,
  Film
} from 'lucide-react';
import { RSUD_AL_MULK_INFO } from '../utils/geoSukabumi';

interface HeaderProps {
  onOpenUpload: () => void;
  onOpenReport: () => void;
  onOpenSupabase: () => void;
  onResetData: () => void;
  onOpenWelcome?: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  totalRecords: number;
  dateRangeStr: string;
  isSampleData: boolean;
  hasGeminiKey: boolean;
  detectedYears?: number[];
  activePoliList?: string[];
  uploadedFileName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenUpload,
  onOpenReport,
  onOpenSupabase,
  onResetData,
  onOpenWelcome,
  activeTab,
  setActiveTab,
  totalRecords,
  dateRangeStr,
  isSampleData,
  detectedYears = [2025, 2026],
  activePoliList = [],
  uploadedFileName = 'perujuk(1).xlsx',
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const navTabs = [
    { id: 'dashboard', label: 'Ringkasan KPI' },
    { id: 'waktu', label: 'Analisis Waktu' },
    { id: 'perujuk', label: 'Perujuk & Mitra' },
    { id: 'kunjungan', label: 'Kunjungan Marketing' },
    { id: 'wilayah', label: 'Wilayah & Peta' },
    { id: 'usia', label: 'Rentang Usia' },
    { id: 'poli', label: 'Poli Rujukan' },
    { id: 'diagnosa', label: 'Diagnosis Awal' },
    { id: 'pembayaran', label: 'Cara Pembayaran' },
    { id: 'ai-strategist', label: 'AI Strategist', isAi: true },
  ];

  const yearDisplay = detectedYears.length > 0 
    ? detectedYears.join(' & ') 
    : '2025 & 2026';

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
        {/* Minimalist hospital top bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center justify-between gap-4">
            
            {/* Identity: Large Logo spot on left + Hospital Name and Address */}
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Prominent Hospital Logo Container */}
              <div 
                className="relative flex-shrink-0 w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 p-0.5 shadow-lg shadow-emerald-950/60 border border-emerald-400/40 flex items-center justify-center group transition-transform duration-200 hover:scale-105"
                title="RSUD Al-Mulk Kota Sukabumi"
              >
                <div className="w-full h-full rounded-[14px] bg-slate-950/80 flex items-center justify-center p-2 backdrop-blur-sm">
                  {/* Stylized Medical Shield Crest */}
                  <svg 
                    viewBox="0 0 48 48" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="w-full h-full text-emerald-400 filter drop-shadow-[0_2px_4px_rgba(16,185,129,0.3)]"
                  >
                    {/* Shield outline */}
                    <path 
                      d="M24 4L8 10V22C8 32.5 14.8 42.2 24 44C33.2 42.2 40 32.5 40 22V10L24 4Z" 
                      fill="url(#crest-grad)" 
                      stroke="#34d399" 
                      strokeWidth="2" 
                      strokeLinejoin="round"
                    />
                    {/* Medical Cross */}
                    <path 
                      d="M21 16H27V21H32V27H27V32H21V27H16V21H21V16Z" 
                      fill="white" 
                      stroke="#059669"
                      strokeWidth="1"
                    />
                    {/* Subtle crescent star detail */}
                    <circle cx="24" cy="24" r="2" fill="#10b981" />
                    <defs>
                      <linearGradient id="crest-grad" x1="8" y1="4" x2="40" y2="44" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#065f46" stopOpacity="0.85" />
                        <stop stopColor="#0f766e" stopOpacity="0.6" />
                        <stop stopColor="#022c22" stopOpacity="0.95" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                {/* Active indicator dot */}
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-950"></span>
                </span>
              </div>

              {/* Strict Name and Address Only */}
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg md:text-xl font-black text-white tracking-tight uppercase truncate">
                  RUMAH SAKIT UMUM DAERAH AL-MULK KOTA SUKABUMI
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                  <span className="truncate">Jalan Pelabuhan II KM 6, Kec. Lembursitu, Kota Sukabumi</span>
                </p>
              </div>
            </div>

            {/* Minimalist Action Buttons (Icon Only with tooltips) */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Unggah Berkas Icon */}
              <button
                type="button"
                onClick={onOpenUpload}
                aria-label="Unggah Berkas Excel atau CSV"
                title="Unggah Data Excel / CSV Kunjungan (2025-2026)"
                className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-950/40 hover:scale-105 active:scale-95 border border-emerald-400/40 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <Upload className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>

              {/* Cetak / Ekspor Laporan Icon */}
              <button
                type="button"
                onClick={onOpenReport}
                aria-label="Cetak dan Ekspor Laporan"
                title="Cetak / Ekspor Laporan Marketing"
                className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/80 transition-all shadow-sm hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <FileText className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-blue-400" />
              </button>

              {/* Supabase Cloud & Vercel Sync Button */}
              <button
                type="button"
                onClick={onOpenSupabase}
                aria-label="Integrasi Supabase Cloud & Vercel"
                title="Kelola Database Supabase, Salin Skrip SQL, dan Konfigurasi Vercel ENV"
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-teal-950/80 to-emerald-950/80 hover:from-teal-900 hover:to-emerald-900 text-teal-300 hover:text-white border border-teal-500/40 transition-all shadow-md shadow-teal-950/50 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-teal-400 group"
              >
                <Database className="w-4 h-4 text-teal-400 group-hover:rotate-12 transition-transform" />
                <span className="hidden md:inline-block text-xs font-bold text-teal-200">
                  Database &amp; Vercel Sync
                </span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
              </button>

              {/* Menu Pengaturan Icon */}
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                aria-label="Buka Menu Pengaturan & Info Data"
                title="Menu Pengaturan & Informasi Data Sistem"
                className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-all shadow-sm hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-400 relative"
              >
                <Settings className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-300" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60 overflow-x-auto scrollbar-none">
          <nav className="flex space-x-1 py-1.5" aria-label="Tabs">
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? tab.isAi
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/30 font-semibold'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : tab.isAi
                      ? 'text-purple-300 hover:bg-purple-950/40 border border-purple-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Menu Pengaturan Modal (Relocated Info Modul, Tahun Kunjungan, Data Aktif, & System Stats) */}
      {isSettingsOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsSettingsOpen(false)}
        >
          <div 
            className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Menu Pengaturan & Informasi Sistem</h3>
                  <p className="text-xs text-slate-400">RSUD Al-Mulk Kota Sukabumi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Section 1: Info Modul Marketing Rujukan */}
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  <Layers className="w-4 h-4" />
                  <span>Info Modul Marketing Rujukan</span>
                </div>
                <div className="text-sm font-bold text-slate-100">
                  AL-MULK MARKET INTELLIGENCE & MARKETING RUJUKAN
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Modul digital untuk pemetaan perujuk, monitoring efektivitas kunjungan lapangan tim marketing, analisis demografi pasien, dan rekomendasi strategi penetrasi fasilitas kesehatan di wilayah Kota &amp; Kabupaten Sukabumi.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                    RSUD Kelas D Pemerintah Kota Sukabumi
                  </span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20">
                    Integrasi Marketing &amp; Rujukan Faskes
                  </span>
                </div>
              </div>

              {/* Section 2: Tahun Kunjungan Terdeteksi */}
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400">
                    <Calendar className="w-4 h-4" />
                    <span>Tahun Kunjungan Terdeteksi</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded">
                    {yearDisplay}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Sistem otomatis mengekstrak dan memfilter data kunjungan rujukan berdasarkan rentang tahun di dalam berkas aktif:
                </p>
                <div className="flex flex-wrap gap-2">
                  {detectedYears.map((yr) => (
                    <span 
                      key={yr} 
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-500/40 text-purple-200 text-xs font-semibold font-mono"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                      Tahun {yr}
                    </span>
                  ))}
                </div>
              </div>

              {/* Section 3: Data Aktif & Status Dataset */}
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
                    <DatabaseZap className="w-4 h-4" />
                    <span>Status Data Aktif</span>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                    isSampleData 
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' 
                      : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {isSampleData ? 'Data Model Al-Mulk' : 'Berkas Diunggah Pengguna'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                    <div className="text-slate-400">Total Rekaman Kunjungan</div>
                    <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
                      {totalRecords.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                    <div className="text-slate-400">Rentang Tanggal</div>
                    <div className="text-xs font-semibold text-slate-200 font-mono mt-1">
                      {dateRangeStr || 'Periode 2025 - 2026'}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs space-y-1">
                  <div className="text-slate-400">Nama Sumber File:</div>
                  <div className="font-mono text-slate-200 break-all font-medium">
                    {uploadedFileName || 'perujuk(1).xlsx'}
                  </div>
                </div>

                {activePoliList.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center gap-1.5 text-xs text-teal-400 font-medium">
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>{activePoliList.length} Poli Tujuan Teridentifikasi:</span>
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                      {activePoliList.slice(0, 10).map((poli, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-teal-950/60 text-teal-300 border border-teal-500/30">
                          {poli}
                        </span>
                      ))}
                      {activePoliList.length > 10 && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                          +{activePoliList.length - 10} lainnya
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Section 4: Welcome Screen Sinematik */}
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between gap-3">
                <div className="text-xs text-slate-300">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <Film className="w-4 h-4 text-emerald-400" />
                    <span>Layar Pembuka (Welcome Screen)</span>
                  </div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Tampilan foto/video sinematik jernih dan cerah RSUD Al-Mulk.
                  </div>
                </div>
                {onOpenWelcome && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSettingsOpen(false);
                      onOpenWelcome();
                    }}
                    className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-sm"
                  >
                    <Film className="w-3.5 h-3.5" />
                    <span>Buka Layar Sinematik</span>
                  </button>
                )}
              </div>

              {/* Section 5: Data Reset & Actions */}
              {!isSampleData && (
                <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40 flex items-center justify-between gap-3">
                  <div className="text-xs text-rose-200">
                    <div className="font-semibold">Reset ke Data Model Al-Mulk</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      Hapus data yang diunggah dan kembalikan ke dataset default RSUD Al-Mulk.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onResetData();
                      setIsSettingsOpen(false);
                    }}
                    className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset Data</span>
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-900/95 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-slate-500" />
                Data tersimpan lokal di peramban &amp; siap disinkronkan ke Supabase.
              </span>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
