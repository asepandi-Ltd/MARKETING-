import React, { useState, useMemo, useRef } from 'react';
import { 
  Briefcase, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Plus, 
  Upload, 
  Search, 
  Filter, 
  Building2, 
  Eye, 
  X, 
  Bot, 
  Copy, 
  Check, 
  Compass,
  SlidersHorizontal,
  RotateCcw,
  Trash2,
  Table as TableIcon,
  HelpCircle,
  ArrowRight,
  Database
} from 'lucide-react';
import { MarketingVisitRecord, SegmentType, VisitEvaluationStatus } from '../types/marketingVisit';
import { CleanReferralRecord, DashboardKpiSummary } from '../types/referral';
import { 
  inspectMarketingVisitWorkbook, 
  getSheetInspectionData, 
  transform2DRowsWithMapping, 
  generateAlMulkMarketingVisits, 
  correlateVisitsWithReferrals,
  InspectedWorkbookInfo,
  VisitColumnMapping
} from '../utils/marketingVisitParser';

interface MarketingVisitsModuleProps {
  visits: MarketingVisitRecord[];
  onUpdateVisits: (newVisits: MarketingVisitRecord[]) => void;
  referrals: CleanReferralRecord[];
  summary: DashboardKpiSummary;
  onOpenSupabase?: () => void;
}

export const MarketingVisitsModule: React.FC<MarketingVisitsModuleProps> = ({
  visits,
  onUpdateVisits,
  referrals,
  summary,
  onOpenSupabase,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSegment, setFilterSegment] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedVisit, setSelectedVisit] = useState<MarketingVisitRecord | null>(null);

  // AI Audit state
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditReport, setAuditReport] = useState<string | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [copiedAudit, setCopiedAudit] = useState(false);

  // New Visit modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTanggal, setNewTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [newLokasi, setNewLokasi] = useState('');
  const [newSegmen, setNewSegmen] = useState<SegmentType>('Puskesmas');
  const [newAlamat, setNewAlamat] = useState('');
  const [newMaksud, setNewMaksud] = useState('');
  const [newPetugas, setNewPetugas] = useState('Tim Marketing RSUD Al-Mulk');
  const [newCatatan, setNewCatatan] = useState('');

  // File upload & Column Mapping modal state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [workbookInfo, setWorkbookInfo] = useState<InspectedWorkbookInfo | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [selectedHeaderRow, setSelectedHeaderRow] = useState<number>(0);
  const [activeColumns, setActiveColumns] = useState<string[]>([]);
  const [rawRows2D, setRawRows2D] = useState<any[][]>([]);
  const [columnMapping, setColumnMapping] = useState<VisitColumnMapping>({
    tanggalCol: '',
    lokasiCol: '',
    segmenCol: '__AUTO_DETECT__',
    alamatCol: '',
    maksudCol: '',
    petugasCol: '',
    catatanCol: '',
  });

  // Filtered visits list
  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
      const matchSearch =
        v.lokasiTujuan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.alamat.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.maksudKunjungan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.petugas && v.petugas.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (v.catatanHasil && v.catatanHasil.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchSegment = filterSegment === 'ALL' || v.jenisSegmen === filterSegment;
      const matchStatus = filterStatus === 'ALL' || v.statusKesesuaian === filterStatus;

      return matchSearch && matchSegment && matchStatus;
    });
  }, [visits, searchTerm, filterSegment, filterStatus]);

  // Summary counts
  const visitStats = useMemo(() => {
    let tepatCount = 0;
    let kajiUlangCount = 0;
    let potensialCount = 0;
    const segmenCounts: Record<string, number> = {};

    for (const v of visits) {
      if (v.statusKesesuaian === 'Tepat Sasaran') tepatCount++;
      else if (v.statusKesesuaian === 'Perlu Dikaji Ulang') kajiUlangCount++;
      else potensialCount++;

      segmenCounts[v.jenisSegmen] = (segmenCounts[v.jenisSegmen] || 0) + 1;
    }

    const uniqueLocations = new Set(visits.map((v) => v.lokasiTujuan.toLowerCase().trim())).size;

    return {
      total: visits.length,
      tepatCount,
      kajiUlangCount,
      potensialCount,
      uniqueLocations,
      segmenCounts,
    };
  }, [visits]);

  // Execute AI Strategic Audit
  const handleRunAiAudit = async () => {
    setIsAuditing(true);
    setAuditError(null);
    setAuditReport(null);

    try {
      const referrerList = referrals
        .filter((r) => r.kategoriPerujuk === 'Eksternal')
        .reduce((acc, r) => {
          const name = r.perujukClean;
          if (!acc[name]) acc[name] = { total: 0, bpjs: 0, umum: 0, poli: r.poliTujuan };
          acc[name].total++;
          if (r.kategoriPembayaran === 'BPJS') acc[name].bpjs++;
          else acc[name].umum++;
          return acc;
        }, {} as Record<string, any>);

      const topRefArr = Object.entries(referrerList)
        .sort(([, a], [, b]) => b.total - a.total)
        .slice(0, 15)
        .map(([name, d]) => ({ nama: name, ...d }));

      const response = await fetch('/api/gemini/audit-marketing-visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitsData: visits.map((v) => ({
            tanggal: v.tanggalKunjungan,
            lokasi: v.lokasiTujuan,
            segmen: v.jenisSegmen,
            alamat: v.alamat,
            maksud: v.maksudKunjungan,
            rujukanTercatat: v.totalRujukanTercatat || 0,
            status: v.statusKesesuaian,
            catatan: v.catatanHasil || '',
          })),
          referralSummary: {
            periodeDataRujukan: `${summary.minDate} s/d ${summary.maxDate}`,
            totalRujukanMasuk: summary.totalRekaman,
            rujukanEksternal: summary.eksternalCount,
            topFaskesPengirim: topRefArr,
            topPoli: summary.topPoli,
            topDiagnosa: summary.topDiagnosa,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Gagal memproses audit strategi kunjungan.');
      }

      setAuditReport(data.auditReport);
    } catch (err: any) {
      console.error('Audit failed:', err);
      setAuditError(err.message || 'Terjadi kesalahan saat memproses audit AI.');
    } finally {
      setIsAuditing(false);
    }
  };

  // Upload file of visits: Trigger inspection & open Mapping Modal
  const handleSelectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploadedFileName(file.name);
    setIsReadingFile(true);

    try {
      const inspected = await inspectMarketingVisitWorkbook(file);
      setWorkbookInfo(inspected);
      setSelectedSheet(inspected.activeSheet);
      setSelectedHeaderRow(inspected.headerRowIndex);
      setActiveColumns(inspected.availableColumns);
      setRawRows2D(inspected.rawRows2D);
      setColumnMapping(inspected.suggestedMapping);
      setIsMappingModalOpen(true);
    } catch (err: any) {
      alert('Gagal membaca berkas Excel: ' + (err.message || 'Pastikan file Excel/CSV valid.'));
    } finally {
      setIsReadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Sheet Change in Mapping Modal
  const handleSheetChange = (sheetName: string) => {
    if (!workbookInfo) return;
    try {
      const data = getSheetInspectionData(workbookInfo.workbook, sheetName);
      setSelectedSheet(sheetName);
      setSelectedHeaderRow(data.headerRowIndex);
      setActiveColumns(data.availableColumns);
      setRawRows2D(data.rawRows2D);
      setColumnMapping(data.suggestedMapping);
    } catch (err: any) {
      alert('Gagal membuka sheet: ' + err.message);
    }
  };

  // Handle Header Row Change in Mapping Modal
  const handleHeaderRowChange = (rowIndex: number) => {
    if (!workbookInfo) return;
    try {
      const data = getSheetInspectionData(workbookInfo.workbook, selectedSheet, rowIndex);
      setSelectedHeaderRow(rowIndex);
      setActiveColumns(data.availableColumns);
      setColumnMapping(data.suggestedMapping);
    } catch (err: any) {
      alert('Gagal mengatur baris header: ' + err.message);
    }
  };

  // Live preview rows generated based on active mapping
  const livePreviewRecords = useMemo(() => {
    if (!rawRows2D || rawRows2D.length === 0 || activeColumns.length === 0) return [];
    // Transform up to 5 rows for fast live preview
    const sampleRows = rawRows2D.slice(0, selectedHeaderRow + 6);
    return transform2DRowsWithMapping(
      sampleRows,
      selectedHeaderRow,
      activeColumns,
      columnMapping,
      referrals
    ).slice(0, 5);
  }, [rawRows2D, selectedHeaderRow, activeColumns, columnMapping, referrals]);

  // Apply Mapping & Commit Records
  const handleApplyMapping = () => {
    if (!columnMapping.tanggalCol && !columnMapping.lokasiCol && !columnMapping.maksudCol) {
      alert('Harap pilih minimal kolom Tanggal Kunjungan, Lokasi Tujuan, dan Maksud Kunjungan.');
      return;
    }

    const cleanRecords = transform2DRowsWithMapping(
      rawRows2D,
      selectedHeaderRow,
      activeColumns,
      columnMapping,
      referrals
    );

    if (cleanRecords.length === 0) {
      alert('Tidak ada baris data valid yang berhasil diekstrak dengan pemetaan kolom yang dipilih. Silakan periksa kembali pemetaan kolom dan baris judul.');
      return;
    }

    onUpdateVisits(cleanRecords);
    setIsMappingModalOpen(false);
  };

  // Add new visit manually
  const handleAddVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLokasi.trim() || !newMaksud.trim()) {
      alert('Harap isi lokasi tujuan dan maksud kunjungan.');
      return;
    }

    const newRec: MarketingVisitRecord = {
      id: `mvisit-custom-${Date.now()}`,
      tanggalKunjungan: newTanggal,
      lokasiTujuan: newLokasi.trim(),
      jenisSegmen: newSegmen,
      alamat: newAlamat.trim() || 'Kota Sukabumi',
      wilayah: newAlamat.trim() || 'Kota Sukabumi',
      maksudKunjungan: newMaksud.trim(),
      petugas: newPetugas.trim(),
      catatanHasil: newCatatan.trim(),
    };

    const updated = correlateVisitsWithReferrals([newRec, ...visits], referrals);
    onUpdateVisits(updated);
    setIsAddModalOpen(false);

    // Reset form
    setNewLokasi('');
    setNewAlamat('');
    setNewMaksud('');
    setNewCatatan('');
  };

  // Delete an individual visit
  const handleDeleteVisit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Hapus rekaman kunjungan ini?')) {
      const updated = visits.filter((v) => v.id !== id);
      onUpdateVisits(updated);
    }
  };

  // Reset to default sample visits
  const handleResetDefaultVisits = () => {
    if (confirm('Kembalikan ke data log kunjungan bawaan RSUD Al-Mulk (2025–2026)?')) {
      const defaultVisits = generateAlMulkMarketingVisits(referrals);
      onUpdateVisits(defaultVisits);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Title & Introduction Banner */}
      <div className="bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/70 border border-blue-800/60 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30">
                <Briefcase className="w-5 h-5 text-blue-400" />
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                  Field Outreach & CRM Marketing RSUD Al-Mulk
                </span>
                <h2 className="text-lg font-extrabold text-white">
                  Kunjungan Tim Marketing & Audit Efektivitas Rujukan
                </h2>
              </div>
            </div>
            <p className="text-xs text-slate-300 mt-2 max-w-3xl leading-relaxed">
              Modul ini mencatat data kunjungan lapangan tim marketing (tanggal, lokasi tujuan, jenis segmen, alamat, maksud kunjungan) dan <strong>menyandingkannya secara langsung dengan data rujukan riil</strong> yang masuk ke RSUD Al-Mulk. Dilengkapi fitur audit AI untuk mengevaluasi kunjungan mana yang <em>sudah tepat sasaran</em> dan mana yang <em>perlu dikaji ulang</em>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleSelectFile}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isReadingFile}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold transition-all shadow-md shadow-blue-950/40"
              title="Unggah berkas log kunjungan marketing (Excel/CSV)"
            >
              <Upload className="w-3.5 h-3.5 text-blue-200" />
              <span>{isReadingFile ? 'Membaca Berkas...' : 'Unggah Excel Kunjungan'}</span>
            </button>

            {workbookInfo && (
              <button
                onClick={() => setIsMappingModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-all"
                title="Buka kembali pengaturan pemetaan kolom berkas yang diunggah"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Pemetaan Kolom</span>
              </button>
            )}

            {onOpenSupabase && (
              <button
                onClick={onOpenSupabase}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-950/70 hover:bg-teal-900/90 text-teal-300 border border-teal-500/40 text-xs font-semibold transition-all shadow-md"
                title="Sinkronkan data kunjungan marketing ke Supabase Cloud"
              >
                <Database className="w-3.5 h-3.5 text-teal-400" />
                <span>Supabase Sync</span>
              </button>
            )}

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-md shadow-emerald-950/40"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Kunjungan</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. KPI Cards: Marketing Outreach Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* KPI 1: Total Kunjungan */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Kunjungan</span>
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {visitStats.total}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Di <strong className="text-slate-200 font-mono">{visitStats.uniqueLocations}</strong> faskes/lokasi berbeda
          </div>
        </div>

        {/* KPI 2: Kunjungan Tepat Sasaran */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md hover:border-emerald-800/60 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Tepat Sasaran</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-300 font-mono">
            {visitStats.tepatCount}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
            <span>Rujukan &ge; 5 Pasien</span>
            <span className="font-semibold text-emerald-400">
              {visitStats.total > 0 ? Math.round((visitStats.tepatCount / visitStats.total) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* KPI 3: Kunjungan Perlu Dikaji Ulang */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md hover:border-rose-800/60 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Perlu Dikaji Ulang</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-300 font-mono">
            {visitStats.kajiUlangCount}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
            <span>Rujukan Nihil (0 Pasien)</span>
            <span className="font-semibold text-rose-400">
              {visitStats.total > 0 ? Math.round((visitStats.kajiUlangCount / visitStats.total) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* KPI 4: Potensial / Prospek Baru */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md hover:border-amber-800/60 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Potensial / Prospek</span>
            <Compass className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono">
            {visitStats.potensialCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Kemitraan baru & perusahaan
          </div>
        </div>
      </div>

      {/* 3. AI STRATEGIC AUDIT TRIGGER SECTION */}
      <div className="bg-slate-900 border border-purple-800/60 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
              <h3 className="text-sm font-bold text-white">
                Audit Efektivitas Kunjungan via AI Marketing Strategist (Gemini 3.8 Flash)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Model AI akan membandingkan maksud kunjungan marketing dengan data rujukan aktual: mendeteksi kunjungan yang <strong>sudah tepat sasaran</strong>, yang <strong>perlu dikaji ulang</strong>, serta merekomendasikan target faskes rujukan baru.
            </p>
          </div>

          <button
            onClick={handleRunAiAudit}
            disabled={isAuditing}
            className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-purple-950/50 transition-all whitespace-nowrap"
          >
            {isAuditing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Menganalisis Kunjungan vs Rujukan...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Jalankan Audit AI Kunjungan</span>
              </>
            )}
          </button>
        </div>

        {/* Audit error */}
        {auditError && (
          <div className="mt-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{auditError}</span>
          </div>
        )}

        {/* Audit Result Display */}
        {auditReport && (
          <div className="mt-4 pt-2">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
              <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                <Bot className="w-4 h-4" /> Hasil Evaluasi & Sandingan Strategis Kunjungan
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(auditReport);
                  setCopiedAudit(true);
                  setTimeout(() => setCopiedAudit(false), 2000);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                {copiedAudit ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAudit ? 'Tersalin' : 'Salin Laporan'}</span>
              </button>
            </div>

            <div className="mt-3 p-4 rounded-xl bg-slate-950 border border-purple-900/40 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans space-y-3">
              {auditReport}
            </div>
          </div>
        )}
      </div>

      {/* 4. FILTER & VISITS TABLE WITH ALIGNMENT MATRIX (Target of focus mode) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari lokasi tujuan, alamat, petugas, atau maksud..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Quick Segment, Status Filters & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Segment filter */}
            <select
              value={filterSegment}
              onChange={(e) => setFilterSegment(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Semua Segmen Lokasi</option>
              <option value="Puskesmas">Puskesmas</option>
              <option value="Klinik Pratama">Klinik Pratama</option>
              <option value="Dokter Praktek Mandiri">Dokter Mandiri</option>
              <option value="Perusahaan / Pabrik">Perusahaan / Pabrik</option>
              <option value="Instansi / Kelurahan">Instansi / Kelurahan</option>
              <option value="Komunitas / Posyandu">Komunitas / Posyandu</option>
              <option value="Travel">Travel</option>
              <option value="Pendidikan">Pendidikan</option>
              <option value="Lainnya">Lainnya</option>
            </select>

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Semua Status Evaluasi</option>
              <option value="Tepat Sasaran">Tepat Sasaran (Rujukan Tinggi)</option>
              <option value="Perlu Dikaji Ulang">Perlu Dikaji Ulang (0 Rujukan)</option>
              <option value="Potensial / Prospek Baru">Potensial / Prospek Baru</option>
            </select>

            {/* Reset button */}
            <button
              onClick={handleResetDefaultVisits}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-all"
              title="Kembalikan data kunjungan bawaan RSUD Al-Mulk"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Informational banner about active mapping */}
        {workbookInfo && (
          <div className="mt-3 p-2.5 rounded-lg bg-blue-950/40 border border-blue-800/40 flex flex-wrap items-center justify-between text-xs text-blue-200">
            <div className="flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span>
                Berkas aktif: <strong>{uploadedFileName}</strong> (Sheet: <em>{selectedSheet}</em>) &bull; Kolom Terpetakan: Tgl [<strong>{columnMapping.tanggalCol || '-'}</strong>], Lokasi [<strong>{columnMapping.lokasiCol || '-'}</strong>], Maksud [<strong>{columnMapping.maksudCol || '-'}</strong>]
              </span>
            </div>
            <button
              onClick={() => setIsMappingModalOpen(true)}
              className="text-[11px] font-semibold text-amber-300 hover:underline flex items-center gap-1"
            >
              <span>Ubah Pemetaan Kolom</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Visits & Sandingan Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3 rounded-l-lg">Tanggal Kunjungan</th>
                <th className="py-2.5 px-3">Lokasi Tujuan Kunjungan</th>
                <th className="py-2.5 px-3">Jenis Segmen</th>
                <th className="py-2.5 px-3">Alamat / Wilayah</th>
                <th className="py-2.5 px-3">Maksud / Agenda Kunjungan</th>
                <th className="py-2.5 px-3 text-right">Rujukan Aktual</th>
                <th className="py-2.5 px-3 text-center">Evaluasi Strategis</th>
                <th className="py-2.5 px-3 text-center rounded-r-lg">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredVisits.map((v) => {
                let badgeClass = 'bg-slate-800 text-slate-300';
                if (v.statusKesesuaian === 'Tepat Sasaran') {
                  badgeClass = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold';
                } else if (v.statusKesesuaian === 'Perlu Dikaji Ulang') {
                  badgeClass = 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold';
                } else {
                  badgeClass = 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
                }

                return (
                  <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* 1. Tanggal */}
                    <td className="py-3 px-3 font-mono text-slate-300 whitespace-nowrap">
                      {v.tanggalKunjungan}
                    </td>

                    {/* 2. Lokasi Tujuan */}
                    <td className="py-3 px-3 font-semibold text-white">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                        <span className="truncate max-w-[200px]" title={v.lokasiTujuan}>
                          {v.lokasiTujuan}
                        </span>
                      </div>
                      {v.petugas && (
                        <span className="text-[10px] text-slate-400 block font-normal truncate max-w-[200px]">
                          PIC: {v.petugas}
                        </span>
                      )}
                    </td>

                    {/* 3. Jenis Segmen */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                        v.jenisSegmen === 'Travel'
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-semibold'
                          : v.jenisSegmen === 'Pendidikan'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold'
                          : v.jenisSegmen === 'Puskesmas'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                          : v.jenisSegmen === 'Klinik Pratama'
                          ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                          : v.jenisSegmen === 'Dokter Praktek Mandiri'
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                          : v.jenisSegmen === 'Perusahaan / Pabrik'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {v.jenisSegmen}
                      </span>
                    </td>

                    {/* 4. Alamat / Wilayah */}
                    <td className="py-3 px-3 text-slate-300 max-w-[180px]">
                      <span className="truncate block" title={v.alamat}>
                        {v.alamat}
                      </span>
                      {v.wilayah && v.wilayah !== v.alamat && (
                        <span className="text-[10px] text-slate-500 block truncate">
                          {v.wilayah}
                        </span>
                      )}
                    </td>

                    {/* 5. Maksud / Agenda Kunjungan */}
                    <td className="py-3 px-3 text-slate-300 max-w-[260px]">
                      <span className="line-clamp-2 text-[11px] leading-snug" title={v.maksudKunjungan}>
                        {v.maksudKunjungan}
                      </span>
                    </td>

                    {/* 6. Rujukan Aktual */}
                    <td className="py-3 px-3 text-right font-mono font-bold whitespace-nowrap">
                      {v.totalRujukanTercatat !== undefined && v.totalRujukanTercatat > 0 ? (
                        <span className="text-emerald-400">
                          {v.totalRujukanTercatat} rujukan
                        </span>
                      ) : (
                        <span className="text-slate-500">0 rujukan</span>
                      )}
                    </td>

                    {/* 7. Evaluasi Strategis */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] ${badgeClass}`}>
                        {v.statusKesesuaian}
                      </span>
                    </td>

                    {/* 8. Aksi */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedVisit(v)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-300 text-[11px] font-medium transition-all"
                          title="Lihat detail lengkap kunjungan"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Detail</span>
                        </button>
                        <button
                          onClick={(e) => handleDeleteVisit(v.id, e)}
                          className="p-1 rounded bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-all"
                          title="Hapus rekaman kunjungan ini"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredVisits.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-xs">
              <Building2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-300">Tidak ada data kunjungan yang sesuai.</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Coba sesuaikan kata kunci pencarian, filter segmen, atau klik "Unggah Excel Kunjungan" untuk memuat berkas baru.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* INTERACTIVE COLUMN MAPPING & LIVE PREVIEW MODAL */}
      {isMappingModalOpen && workbookInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-6 shadow-2xl text-xs text-slate-200 my-8">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase tracking-wider">
                  Verifikasi & Pemetaan Kolom Excel
                </span>
                <h3 className="text-base font-bold text-white mt-1 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-blue-400" />
                  Sesuaikan Kolom Data Kunjungan Marketing
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Berkas: <strong>{uploadedFileName}</strong> &bull; Total terbaca: {rawRows2D.length - selectedHeaderRow - 1} baris data
                </p>
              </div>

              <button
                onClick={() => setIsMappingModalOpen(false)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sheet & Header row controls */}
            <div className="mt-4 p-3.5 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Pilih Lembar Kerja (Sheet):
                </label>
                <select
                  value={selectedSheet}
                  onChange={(e) => handleSheetChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  {workbookInfo.sheetNames.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Letak Baris Judul Kolom (Header):
                </label>
                <select
                  value={selectedHeaderRow}
                  onChange={(e) => handleHeaderRowChange(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  {Array.from({ length: Math.min(10, rawRows2D.length) }, (_, i) => (
                    <option key={i} value={i}>
                      Baris ke-{i + 1} ({rawRows2D[i] ? rawRows2D[i].filter(Boolean).slice(0, 3).join(', ') : 'Kosong'}...)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Explicit Column Selectors Grid */}
            <div className="mt-4">
              <div className="flex items-center gap-1.5 mb-2 text-slate-300 font-semibold">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span>Pilih Kolom Excel yang Sesuai untuk Setiap Parameter:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* 1. Tanggal Kunjungan */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <label className="block text-[11px] font-bold text-blue-300 mb-1">
                    1. Tanggal Kunjungan *
                  </label>
                  <select
                    value={columnMapping.tanggalCol}
                    onChange={(e) => setColumnMapping({ ...columnMapping, tanggalCol: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-white focus:border-blue-500"
                  >
                    <option value="">-- Pilih Kolom Tanggal --</option>
                    {activeColumns.map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-400 mt-1 block">Contoh: 12/10/2025 atau 2026-01-14</span>
                </div>

                {/* 2. Lokasi Tujuan */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <label className="block text-[11px] font-bold text-blue-300 mb-1">
                    2. Lokasi / Faskes Tujuan *
                  </label>
                  <select
                    value={columnMapping.lokasiCol}
                    onChange={(e) => setColumnMapping({ ...columnMapping, lokasiCol: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-white focus:border-blue-500"
                  >
                    <option value="">-- Pilih Kolom Lokasi Tujuan --</option>
                    {activeColumns.map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-400 mt-1 block">Nama Puskesmas / Klinik / Pabrik</span>
                </div>

                {/* 3. Jenis Segmen */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <label className="block text-[11px] font-bold text-blue-300 mb-1">
                    3. Jenis Segmen Lokasi *
                  </label>
                  <select
                    value={columnMapping.segmenCol}
                    onChange={(e) => setColumnMapping({ ...columnMapping, segmenCol: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-white focus:border-blue-500"
                  >
                    <option value="__AUTO_DETECT__">[ Otomatis Deteksi dari Nama Faskes ]</option>
                    {activeColumns.map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-400 mt-1 block">Puskesmas, Klinik, Dokter, Pabrik, Travel, Pendidikan</span>
                </div>

                {/* 4. Alamat */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <label className="block text-[11px] font-bold text-blue-300 mb-1">
                    4. Alamat / Wilayah *
                  </label>
                  <select
                    value={columnMapping.alamatCol}
                    onChange={(e) => setColumnMapping({ ...columnMapping, alamatCol: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-white focus:border-blue-500"
                  >
                    <option value="">-- Pilih Kolom Alamat --</option>
                    {activeColumns.map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-400 mt-1 block">Alamat lengkap atau nama kecamatan</span>
                </div>

                {/* 5. Maksud Kunjungan */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <label className="block text-[11px] font-bold text-blue-300 mb-1">
                    5. Maksud / Agenda Kunjungan *
                  </label>
                  <select
                    value={columnMapping.maksudCol}
                    onChange={(e) => setColumnMapping({ ...columnMapping, maksudCol: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-white focus:border-blue-500"
                  >
                    <option value="">-- Pilih Kolom Maksud/Agenda --</option>
                    {activeColumns.map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-400 mt-1 block">Tujuan promosi, PKS, alur rujukan</span>
                </div>

                {/* 6. Petugas PIC (Opsional) */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    6. Petugas / PIC (Opsional)
                  </label>
                  <select
                    value={columnMapping.petugasCol || ''}
                    onChange={(e) => setColumnMapping({ ...columnMapping, petugasCol: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-white focus:border-blue-500"
                  >
                    <option value="">[ Tidak Ada / Bawaan Tim Marketing ]</option>
                    {activeColumns.map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-400 mt-1 block">Nama personil humas/marketing</span>
                </div>
              </div>
            </div>

            {/* LIVE PREVIEW TABLE ACCORDING TO SELECTED MAPPING */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Eye className="w-4 h-4" /> Live Pratinjau Data (Hasil Ekstraksi dari Kolom yang Dipilih)
                </span>
                <span className="text-[10px] text-slate-400">Menampilkan 5 baris pertama</span>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase font-semibold">
                    <tr>
                      <th className="py-2 px-2.5">Tanggal</th>
                      <th className="py-2 px-2.5">Lokasi Tujuan</th>
                      <th className="py-2 px-2.5">Segmen</th>
                      <th className="py-2 px-2.5">Alamat</th>
                      <th className="py-2 px-2.5">Maksud Kunjungan</th>
                      <th className="py-2 px-2.5 text-right">Rujukan Masuk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {livePreviewRecords.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-900/60">
                        <td className="py-2 px-2.5 font-mono text-slate-300 whitespace-nowrap">{r.tanggalKunjungan}</td>
                        <td className="py-2 px-2.5 font-semibold text-white whitespace-nowrap">{r.lokasiTujuan}</td>
                        <td className="py-2 px-2.5 whitespace-nowrap">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                            {r.jenisSegmen}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 truncate max-w-[150px]">{r.alamat}</td>
                        <td className="py-2 px-2.5 max-w-[200px] truncate">{r.maksudKunjungan}</td>
                        <td className="py-2 px-2.5 text-right font-mono text-emerald-400 whitespace-nowrap">
                          {r.totalRujukanTercatat || 0} rujukan
                        </td>
                      </tr>
                    ))}
                    {livePreviewRecords.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-slate-500 italic">
                          Belum ada data pratinjau. Pastikan kolom telah dipilih dengan benar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsMappingModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApplyMapping}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Terapkan & Impor Data Kunjungan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL DRAWER FOR SELECTED VISIT */}
      {selectedVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl text-xs text-slate-300">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase">
                  Rincian Kunjungan Tim Marketing
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  {selectedVisit.lokasiTujuan}
                </h3>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  {selectedVisit.alamat}
                </p>
              </div>

              <button
                onClick={() => setSelectedVisit(null)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Tanggal Kunjungan</span>
                  <span className="text-sm font-bold font-mono text-white">{selectedVisit.tanggalKunjungan}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Jenis Segmen</span>
                  <span className="text-sm font-bold text-blue-300">{selectedVisit.jenisSegmen}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Maksud & Agenda Kunjungan:</span>
                  <p className="text-slate-200 mt-0.5 leading-relaxed font-medium">
                    {selectedVisit.maksudKunjungan}
                  </p>
                </div>

                {selectedVisit.petugas && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block uppercase">Petugas / Tim Marketing:</span>
                    <p className="text-slate-300 mt-0.5 font-medium">
                      {selectedVisit.petugas}
                    </p>
                  </div>
                )}

                {selectedVisit.catatanHasil && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block uppercase">Catatan Hasil Pertemuan:</span>
                    <p className="text-slate-300 mt-0.5 leading-relaxed italic">
                      "{selectedVisit.catatanHasil}"
                    </p>
                  </div>
                )}
              </div>

              {/* Sandingan rujukan masuk */}
              <div className="p-3.5 rounded-lg bg-blue-950/30 border border-blue-800/40 space-y-2">
                <span className="text-[10px] text-blue-300 font-bold block uppercase">
                  Sandingan Korelasi Rujukan Masuk di RSUD Al-Mulk:
                </span>
                <div className="flex items-center justify-between">
                  <span>Total Kunjungan Rujukan Tercatat:</span>
                  <span className="font-mono font-bold text-base text-emerald-400">
                    {selectedVisit.totalRujukanTercatat || 0} kunjungan
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Status Efektivitas:</span>
                  <span className="font-bold text-white">
                    {selectedVisit.statusKesesuaian}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedVisit(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADD NEW VISIT */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-xs text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Catat Kunjungan Tim Marketing Baru
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddVisit} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Tanggal Kunjungan
                  </label>
                  <input
                    type="date"
                    required
                    value={newTanggal}
                    onChange={(e) => setNewTanggal(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Jenis Segmen Lokasi
                  </label>
                  <select
                    value={newSegmen}
                    onChange={(e) => setNewSegmen(e.target.value as SegmentType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Puskesmas">Puskesmas</option>
                    <option value="Klinik Pratama">Klinik Pratama</option>
                    <option value="Dokter Praktek Mandiri">Dokter Mandiri</option>
                    <option value="Perusahaan / Pabrik">Perusahaan / Pabrik</option>
                    <option value="Instansi / Kelurahan">Instansi / Kelurahan</option>
                    <option value="Komunitas / Posyandu">Komunitas / Posyandu</option>
                    <option value="Travel">Travel</option>
                    <option value="Pendidikan">Pendidikan</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Nama Lokasi / Faskes Tujuan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Puskesmas Baros, Klinik Citra Medika, PT GSI Cikembar..."
                  value={newLokasi}
                  onChange={(e) => setNewLokasi(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Alamat / Wilayah
                </label>
                <input
                  type="text"
                  placeholder="Misal: Jl. Pelabuhan II KM 8, Kec. Gunungguruh, Kab. Sukabumi"
                  value={newAlamat}
                  onChange={(e) => setNewAlamat(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Maksud / Agenda Kunjungan
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Misal: Sosialisasi jadwal poli spesialis bedah dan obsgyn, koordinasi antrean rujukan BPJS..."
                  value={newMaksud}
                  onChange={(e) => setNewMaksud(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Petugas / Tim Marketing
                </label>
                <input
                  type="text"
                  value={newPetugas}
                  onChange={(e) => setNewPetugas(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Catatan Hasil / Respons Pertemuan (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan hasil diskusi atau kebutuhan tindak lanjut..."
                  value={newCatatan}
                  onChange={(e) => setNewCatatan(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs"
                >
                  Simpan Kunjungan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
