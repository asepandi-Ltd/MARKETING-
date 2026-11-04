import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  RefreshCw,
  Calendar,
  Stethoscope
} from 'lucide-react';
import { parseExcelOrCsvFile } from '../utils/dataParser';
import { CleanReferralRecord } from '../types/referral';
import { generateAlMulkSampleData } from '../utils/sampleData';

interface DataUploadModalProps {
  onClose: () => void;
  onDataLoaded: (
    records: CleanReferralRecord[], 
    isSample: boolean, 
    fileName?: string,
    detectedYears?: number[],
    detectedPoliList?: string[]
  ) => void;
}

export const DataUploadModal: React.FC<DataUploadModalProps> = ({ onClose, onDataLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ 
    count: number; 
    sheetName: string; 
    invalidDates: number;
    years: number[];
    poliList: string[];
    fileName: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    setIsProcessing(true);
    setErrorMsg(null);
    setSuccessInfo(null);

    try {
      const result = await parseExcelOrCsvFile(file);

      if (result.records.length === 0) {
        throw new Error('Tidak ada data rujukan valid yang berhasil dibaca dari lembar kerja.');
      }

      setSuccessInfo({
        count: result.records.length,
        sheetName: result.sheetName,
        invalidDates: result.invalidDateCount,
        years: result.detectedYears,
        poliList: result.detectedPoliList,
        fileName: file.name,
      });

      // Apply to application
      onDataLoaded(
        result.records, 
        false, 
        file.name,
        result.detectedYears,
        result.detectedPoliList
      );

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('File parsing error:', err);
      setErrorMsg(err.message || 'Gagal memproses file. Pastikan file adalah Excel (.xlsx) atau CSV yang valid.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleLoadSample = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const sample = generateAlMulkSampleData();
      onDataLoaded(sample, true, 'Data Model RSUD Al-Mulk', [2025, 2026], [
        'Poli Penyakit Dalam',
        'Poli Anak',
        'Poli Kebidanan & Kandungan (Obsgyn)',
        'Poli Bedah',
        'Poli Saraf',
        'Poli Umum'
      ]);
      setIsProcessing(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl text-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Unggah File Rujukan RSUD Al-Mulk (2025 - 2026)
              </h3>
              <p className="text-xs text-slate-400">
                Mendukung file Excel <code>perujuk(1).xlsx</code> atau format CSV kunjungan rujukan.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Privacy & Dynamic Mapping Notice */}
        <div className="my-4 p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-emerald-200 text-xs space-y-1.5">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block">Penerapan Data Dinamis & Perlindungan Privasi:</strong>
              <p className="text-[11px] text-emerald-300/90 leading-relaxed">
                1. <strong>Tahun Kunjungan:</strong> Mengambil tahun dari kolom <code>tanggal masuk</code> (misal 2025 dan 2026).<br />
                2. <strong>Poli Rujukan:</strong> Hanya poli yang <em>benar-benar ada</em> di file Anda yang akan ditampilkan. Jika di file tidak terdapat Poli Paru, Gigi, atau Mata, sistem tidak akan menampilkan poli tersebut.<br />
                3. <strong>Privasi:</strong> Kolom identitas (<code>no rawat</code>, <code>no rm</code>, <code>nama pasien</code>) otomatis dihapus saat proses impor.
              </p>
            </div>
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            isDragging
              ? 'border-emerald-400 bg-emerald-950/20'
              : 'border-slate-700 hover:border-emerald-500 hover:bg-slate-850'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />

          <div className="w-12 h-12 rounded-full bg-slate-800 text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <Upload className="w-6 h-6" />
          </div>

          <h4 className="text-sm font-semibold text-white">
            Pilih atau Tarik File Excel / CSV ke Sini
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Mendukung <code>perujuk(1).xlsx</code> (Lembar data / <code>Sheet1</code>)
          </p>

          <button
            type="button"
            className="mt-4 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs"
          >
            Pilih File dari Komputer
          </button>
        </div>

        {/* Processing State */}
        {isProcessing && (
          <div className="mt-4 p-3 rounded-lg bg-blue-950/40 border border-blue-800/40 flex items-center gap-2 text-xs text-blue-300">
            <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
            <span>Memproses dan menormalisasi data kunjungan 2025/2026...</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800/40 flex items-start gap-2 text-xs text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Alert */}
        {successInfo && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-200 space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Berhasil Membaca {successInfo.fileName}!</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                <span>Tahun Kunjungan: <strong>{successInfo.years.join(' & ')}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
                <span>Total: <strong>{successInfo.count} rekaman</strong></span>
              </div>
            </div>

            {successInfo.poliList.length > 0 && (
              <div className="pt-1 border-t border-emerald-900/60 text-[11px]">
                <span className="text-slate-400 block mb-1 flex items-center gap-1">
                  <Stethoscope className="w-3 h-3 text-teal-400" />
                  Poli Rujukan Terdeteksi ({successInfo.poliList.length} poli):
                </span>
                <div className="flex flex-wrap gap-1">
                  {successInfo.poliList.map((p) => (
                    <span key={p} className="px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 text-[10px] font-medium border border-emerald-700/50">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sample data fallback button */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleLoadSample}
            type="button"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Muat Data Model 2025-2026 RSUD Al-Mulk</span>
          </button>

          <button
            onClick={onClose}
            type="button"
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
