import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  FileText, 
  Building2, 
  CheckCircle2, 
  Table, 
  Calendar,
  Share2,
  MapPin,
  CreditCard 
} from 'lucide-react';
import { CleanReferralRecord, DashboardKpiSummary } from '../types/referral';
import { RSUD_AL_MULK_INFO } from '../utils/geoSukabumi';
import { computeMonthlyTrends, computeExternalReferrers } from '../utils/analytics';

import { MarketingVisitRecord } from '../types/marketingVisit';

interface ReportExportModalProps {
  onClose: () => void;
  records: CleanReferralRecord[];
  summary: DashboardKpiSummary;
  marketingVisits?: MarketingVisitRecord[];
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({
  onClose,
  records,
  summary,
  marketingVisits = [],
}) => {
  const [reportType, setReportType] = useState<
    'monthly' | 'referrer' | 'territory' | 'demographics' | 'diagnosis' | 'payment' | 'action_plan' | 'visits'
  >('monthly');

  const monthlyTrends = computeMonthlyTrends(records, summary.maxDate);
  const externalReferrers = computeExternalReferrers(records, monthlyTrends.map((m) => m.bulan));

  // Export CSV handler
  const handleExportCsv = () => {
    let csvContent = '';
    const dateStr = new Date().toISOString().split('T')[0];
    let fileName = `Laporan_Marketing_RSUD_Al_Mulk_${reportType}_${dateStr}.csv`;

    if (reportType === 'monthly') {
      csvContent = 'Bulan,Label Bulan,Total Kunjungan,BPJS,Umum_Tunai,Eksternal,Internal,Pertumbuhan_MoM_Pct,Status_Periode\n';
      monthlyTrends.forEach((m) => {
        csvContent += `"${m.bulan}","${m.labelBulan}",${m.total},${m.bpjs},${m.umum},${m.eksternal},${m.internal},"${m.momGrowthPct ?? '-'}",${m.isPartial ? 'Parsial' : 'Lengkap'}\n`;
      });
    } else if (reportType === 'referrer') {
      csvContent = 'Nama Faskes Perujuk,Kategori,Alamat_Wilayah,Total Kunjungan,Porsi_Pct,BPJS,Umum_Tunai,Status_Strategis\n';
      externalReferrers.forEach((r) => {
        csvContent += `"${r.name}","${r.category}","${r.address}",${r.totalKunjungan},${r.pctOfTotal},${r.bpjsCount},${r.umumCount},"${r.statusBadge}"\n`;
      });
    } else if (reportType === 'visits') {
      csvContent = 'Tanggal_Kunjungan,Lokasi_Tujuan,Segmen,Alamat_Wilayah,Maksud_Kunjungan,Rujukan_Tercatat,Evaluasi_Strategis\n';
      marketingVisits.forEach((v) => {
        csvContent += `"${v.tanggalKunjungan}","${v.lokasiTujuan}","${v.jenisSegmen}","${v.alamat}","${v.maksudKunjungan}",${v.totalRujukanTercatat || 0},"${v.statusKesesuaian}"\n`;
      });
    } else {
      // General sanitized records export (PRIVACY PRESERVED: ZERO PII)
      csvContent = 'Tanggal_Kunjungan,Bulan,Kategori_Perujuk,Nama_Perujuk,Wilayah_Perujuk,Kategori_Pembayaran,Wilayah_Pasien,Kelompok_Usia,Poli_Tujuan,Diagnosis_Awal,Kode_ICD\n';
      records.forEach((r) => {
        csvContent += `"${r.tanggalMasuk}","${r.bulan}","${r.kategoriPerujuk}","${r.perujukClean}","${r.wilayahPerujuk}","${r.kategoriPembayaran}","${r.wilayahPasienNormal}","${r.kelompokUsia}","${r.poliTujuan}","${r.diagnosaAwal}","${r.kodeIcd}"\n`;
      });
    }

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl text-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/40">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Pusat Cetak & Ekspor Laporan Marketing RSUD Al-Mulk
              </h3>
              <p className="text-xs text-slate-400">
                Laporan eksekutif siap cetak dan file CSV berstandar analitik rumah sakit (Bebas PII).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Report Type Selector Tabs */}
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex flex-wrap gap-2 text-xs">
          {[
            { id: 'monthly', label: '1. Laporan Bulanan & Tren' },
            { id: 'referrer', label: '2. Evaluasi Mitra Perujuk' },
            { id: 'visits', label: '3. Log Kunjungan Tim Marketing' },
            { id: 'territory', label: '4. Evaluasi Wilayah Pemasaran' },
            { id: 'demographics', label: '5. Kelompok Usia & Poli' },
            { id: 'diagnosis', label: '6. Analisis Diagnosis Awal' },
            { id: 'payment', label: '7. Kategori Pembayaran' },
            { id: 'action_plan', label: '8. Rencana Tindak Lanjut' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setReportType(item.id as any)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                reportType === item.id
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Modal Printable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs bg-slate-950/50 print:bg-white print:text-black print:p-0">
          {/* Hospital Official Header for Print */}
          <div className="border-b-2 border-slate-700 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-700 flex items-center justify-center text-white font-bold text-xl print:border print:border-black">
                AM
              </div>
              <div>
                <h1 className="text-base font-extrabold text-white print:text-black">
                  {RSUD_AL_MULK_INFO.nama}
                </h1>
                <p className="text-slate-400 print:text-slate-700 text-[11px]">
                  {RSUD_AL_MULK_INFO.alamat}
                </p>
                <p className="text-slate-500 print:text-slate-600 text-[10px]">
                  Sistem Informasi Market Intelligence • Modul Marketing Rujukan
                </p>
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-400 print:text-slate-800">
              <div>Tanggal Laporan: <strong>{new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</strong></div>
              <div>Rentang Data: <strong>{summary.minDate} s/d {summary.maxDate}</strong></div>
              <div>Total Kunjungan: <strong>{summary.totalRekaman} rekaman</strong></div>
            </div>
          </div>

          {/* Quick Summary KPIs for this Report */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-slate-900 print:bg-slate-100 border border-slate-800 print:border-slate-300">
              <span className="text-[10px] text-slate-400 print:text-slate-600 block">Total Kunjungan</span>
              <span className="text-lg font-bold font-mono text-white print:text-black">{summary.totalRekaman}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 print:bg-slate-100 border border-slate-800 print:border-slate-300">
              <span className="text-[10px] text-slate-400 print:text-slate-600 block">BPJS (No. Rujukan Terisi)</span>
              <span className="text-lg font-bold font-mono text-emerald-400 print:text-black">{summary.bpjsCount} ({summary.bpjsPct}%)</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 print:bg-slate-100 border border-slate-800 print:border-slate-300">
              <span className="text-[10px] text-slate-400 print:text-slate-600 block">Umum/Tunai</span>
              <span className="text-lg font-bold font-mono text-amber-400 print:text-black">{summary.umumCount} ({summary.umumPct}%)</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 print:bg-slate-100 border border-slate-800 print:border-slate-300">
              <span className="text-[10px] text-slate-400 print:text-slate-600 block">Mitra Eksternal Aktif</span>
              <span className="text-lg font-bold font-mono text-blue-400 print:text-black">{summary.uniquePerujukEksternalCount} faskes</span>
            </div>
          </div>

          {/* Report Tables Depending on Selected Tab */}
          {reportType === 'monthly' && (
            <div className="space-y-3">
              <h3 className="font-bold text-white print:text-black text-sm">
                Tabel Kinerja Bulanan & Tren Pertumbuhan (MoM)
              </h3>
              <table className="w-full text-left text-xs border border-slate-800 print:border-slate-400">
                <thead className="bg-slate-900 print:bg-slate-200 text-slate-300 print:text-black">
                  <tr>
                    <th className="p-2 border-b border-slate-800 print:border-slate-400">Bulan</th>
                    <th className="p-2 text-right border-b border-slate-800 print:border-slate-400">Total Kunjungan</th>
                    <th className="p-2 text-right border-b border-slate-800 print:border-slate-400">Pertumbuhan MoM</th>
                    <th className="p-2 text-right border-b border-slate-800 print:border-slate-400">BPJS</th>
                    <th className="p-2 text-right border-b border-slate-800 print:border-slate-400">Umum/Tunai</th>
                    <th className="p-2 text-right border-b border-slate-800 print:border-slate-400">Eksternal</th>
                    <th className="p-2 text-right border-b border-slate-800 print:border-slate-400">Internal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-slate-300">
                  {monthlyTrends.map((m) => (
                    <tr key={m.bulan}>
                      <td className="p-2 font-medium">{m.labelBulan} {m.isPartial ? '(Parsial)' : ''}</td>
                      <td className="p-2 text-right font-mono font-bold">{m.total}</td>
                      <td className="p-2 text-right font-mono">{m.momGrowthPct !== null ? `${m.momGrowthPct}%` : '-'}</td>
                      <td className="p-2 text-right font-mono">{m.bpjs}</td>
                      <td className="p-2 text-right font-mono">{m.umum}</td>
                      <td className="p-2 text-right font-mono">{m.eksternal}</td>
                      <td className="p-2 text-right font-mono">{m.internal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportType === 'referrer' && (
            <div className="space-y-3">
              <h3 className="font-bold text-white print:text-black text-sm">
                Daftar Evaluasi Kinerja Mitra Faskes Perujuk Eksternal
              </h3>
              <table className="w-full text-left text-xs border border-slate-800 print:border-slate-400">
                <thead className="bg-slate-900 print:bg-slate-200 text-slate-300 print:text-black">
                  <tr>
                    <th className="p-2 border-b border-slate-800 print:border-slate-400">Nama Faskes</th>
                    <th className="p-2 border-b border-slate-800 print:border-slate-400">Alamat / Wilayah</th>
                    <th className="p-2 text-right border-b border-slate-800 print:border-slate-400">Kunjungan</th>
                    <th className="p-2 text-right border-b border-slate-800 print:border-slate-400">BPJS</th>
                    <th className="p-2 text-right border-b border-slate-800 print:border-slate-400">Umum</th>
                    <th className="p-2 border-b border-slate-800 print:border-slate-400">Poli Terbanyak</th>
                    <th className="p-2 text-center border-b border-slate-800 print:border-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-slate-300">
                  {externalReferrers.slice(0, 15).map((r) => (
                    <tr key={r.name}>
                      <td className="p-2 font-medium">{r.name}</td>
                      <td className="p-2 text-slate-400 print:text-slate-700">{r.address}</td>
                      <td className="p-2 text-right font-mono font-bold">{r.totalKunjungan}</td>
                      <td className="p-2 text-right font-mono">{r.bpjsCount}</td>
                      <td className="p-2 text-right font-mono">{r.umumCount}</td>
                      <td className="p-2">{r.topPoli}</td>
                      <td className="p-2 text-center font-semibold">{r.statusBadge}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportType === 'visits' && (
            <div className="space-y-3">
              <h3 className="font-bold text-white print:text-black text-sm">
                Log Kunjungan Tim Marketing & Sandingan Data Rujukan Masuk
              </h3>
              <table className="w-full text-left text-xs border border-slate-800 print:border-slate-400">
                <thead className="bg-slate-900 print:bg-slate-200 text-slate-300 print:text-black">
                  <tr>
                    <th className="p-2 border-b border-slate-800 print:border-slate-400">Tanggal</th>
                    <th className="p-2 border-b border-slate-800 print:border-slate-400">Lokasi / Faskes</th>
                    <th className="p-2 border-b border-slate-800 print:border-slate-400">Segmen</th>
                    <th className="p-2 border-b border-slate-800 print:border-slate-400">Maksud Kunjungan</th>
                    <th className="p-2 text-right border-b border-slate-800 print:border-slate-400">Rujukan Masuk</th>
                    <th className="p-2 text-center border-b border-slate-800 print:border-slate-400">Evaluasi Strategis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-slate-300">
                  {marketingVisits.map((v) => (
                    <tr key={v.id}>
                      <td className="p-2 font-mono whitespace-nowrap">{v.tanggalKunjungan}</td>
                      <td className="p-2 font-medium">{v.lokasiTujuan}</td>
                      <td className="p-2">{v.jenisSegmen}</td>
                      <td className="p-2 text-slate-300 print:text-slate-700">{v.maksudKunjungan}</td>
                      <td className="p-2 text-right font-mono font-bold text-emerald-400 print:text-black">
                        {v.totalRujukanTercatat || 0} rujukan
                      </td>
                      <td className="p-2 text-center font-semibold">{v.statusKesesuaian}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportType === 'action_plan' && (
            <div className="space-y-4">
              <h3 className="font-bold text-white print:text-black text-sm">
                Rencana Tindak Lanjut Pemasaran Rujukan (30 - 60 - 90 Hari)
              </h3>
              <div className="space-y-3">
                <div className="p-3.5 rounded-lg bg-slate-900 print:bg-slate-100 border border-slate-800 print:border-slate-300">
                  <h4 className="font-bold text-emerald-400 print:text-black mb-1">
                    Tahap 1 (30 Hari Pertama): Penguatan Hubungan Faskes Penyangga Inti
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 print:text-slate-800">
                    <li>Kunjungan koordinasi ke Puskesmas Lembursitu, Baros, dan Cikundul (Zona Ring 1).</li>
                    <li>Evaluasi rujukan balik (Program Rujuk Balik / PRB) untuk pasien Hipertensi dan Diabetes tipe 2.</li>
                    <li>Sinkronisasi kuota pendaftaran antrean online / Mobile JKN bersama PIC faskes primer.</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-900 print:bg-slate-100 border border-slate-800 print:border-slate-300">
                  <h4 className="font-bold text-blue-400 print:text-black mb-1">
                    Tahap 2 (60 Hari): Penetrasi Koridor Nyalindung & Gunungguruh (Kabupaten Sukabumi)
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 print:text-slate-800">
                    <li>Sosialisasi layanan dokter spesialis baru ke Puskesmas Nyalindung dan jejaring klinik pratama di Gunungguruh.</li>
                    <li>Penyebaran materi edukasi jadwal poli spesialis di koridor Jalan Pelabuhan II.</li>
                    <li>Penyelarasan fasilitas penunjang radiologi rujukan rawat jalan.</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-900 print:bg-slate-100 border border-slate-800 print:border-slate-300">
                  <h4 className="font-bold text-purple-400 print:text-black mb-1">
                    Tahap 3 (90 Hari): Ekspansi Kemitraan Korporasi & Kawasan Industri Cikembar
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 print:text-slate-800">
                    <li>Penjajakan kerjasama pelayanan trauma center & bedah minor untuk faskes klinik industri di Cikembar.</li>
                    <li>Audit kepuasan dokter perujuk eksternal triwulanan.</li>
                    <li>Laporan evaluasi komprehensif kepada Direktur RSUD Al-Mulk.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Legal sign-off footer for printed reports */}
          <div className="pt-6 border-t border-slate-800 print:border-slate-400 grid grid-cols-2 text-center text-xs text-slate-400 print:text-slate-700">
            <div>
              <p>Mengetahui,</p>
              <p className="font-semibold text-white print:text-black mt-1">Kepala Subbag Humas & Pemasaran</p>
              <div className="h-16"></div>
              <p className="underline font-bold text-white print:text-black">( _______________________ )</p>
              <p className="text-[10px]">NIP. ........................................</p>
            </div>
            <div>
              <p>Sukabumi, {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
              <p className="font-semibold text-white print:text-black mt-1">Analis Pemasaran & Rujukan RSUD Al-Mulk</p>
              <div className="h-16"></div>
              <p className="underline font-bold text-white print:text-black">( _______________________ )</p>
              <p className="text-[10px]">Petugas Pelaksana</p>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950">
          <span className="text-xs text-slate-500 hidden sm:inline">
            Semua data diekspor secara agregat tanpa PII pasien.
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Laporan</span>
            </button>

            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
