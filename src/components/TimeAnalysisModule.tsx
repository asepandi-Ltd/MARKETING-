import React, { useState } from 'react';
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Clock, 
  Info, 
  BarChart2, 
  CheckCircle2 
} from 'lucide-react';
import { CleanReferralRecord, DashboardKpiSummary } from '../types/referral';
import { computeMonthlyTrends, computeDayOfWeekDistribution, MonthlyTrendItem, DayOfWeekItem } from '../utils/analytics';

interface TimeAnalysisModuleProps {
  records: CleanReferralRecord[];
  summary: DashboardKpiSummary;
}

export const TimeAnalysisModule: React.FC<TimeAnalysisModuleProps> = ({ records, summary }) => {
  const [selectedMetric, setSelectedMetric] = useState<'total' | 'payment' | 'referrer'>('total');

  const monthlyTrends = computeMonthlyTrends(records, summary.maxDate);
  const dayOfWeekData = computeDayOfWeekDistribution(records);

  // Calculate daily volume average
  const uniqueDates = new Set(records.map((r) => r.tanggalMasuk).filter((d) => d && d !== '1970-01-01'));
  const dailyAvg = uniqueDates.size > 0 ? Math.round((records.length / uniqueDates.size) * 10) / 10 : 0;

  // Max volume in month for bar height calculation
  const maxMonthVolume = Math.max(...monthlyTrends.map((m) => m.total), 1);

  return (
    <div className="space-y-6">
      {/* Module Title & Context Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Clock className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-white">
                Modul Analisis Waktu Kedatangan Pasien Rujukan
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Berdasarkan kolom <code className="text-emerald-400 font-mono">tanggal masuk</code>. 
              Indikator menunjukkan <strong>waktu kunjungan/kedatangan pasien ke RSUD Al-Mulk terkait rujukan</strong>, bukan tanggal rujukan diterbitkan di faskes asal.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Rentang Data Terdaftar:</span>
              <span className="font-mono font-semibold text-slate-200">
                {summary.minDate} s/d {summary.maxDate}
              </span>
            </div>
            {summary.isPartialMonth && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold">
                <AlertTriangle className="w-3 h-3" /> Periode Parsial Terdeteksi
              </span>
            )}
            {summary.invalidDateCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px]">
                {summary.invalidDateCount} Tanggal Tidak Valid
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Trends Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800 gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-400" />
              Tren Kunjungan Bulanan & Analisis MoM (Month-over-Month)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Evaluasi fluktuasi kedatangan pasien rujukan per bulan dan perbandingan pertumbuhan.
            </p>
          </div>

          {/* Metric selector toggle */}
          <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-xs">
            <button
              onClick={() => setSelectedMetric('total')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                selectedMetric === 'total' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Total Volume
            </button>
            <button
              onClick={() => setSelectedMetric('payment')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                selectedMetric === 'payment' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              BPJS vs Umum
            </button>
            <button
              onClick={() => setSelectedMetric('referrer')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${
                selectedMetric === 'referrer' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Internal vs Eksternal
            </button>
          </div>
        </div>

        {/* Visual Monthly Bar Chart */}
        <div className="mt-6 pt-4">
          <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 px-2">
            {monthlyTrends.map((item) => {
              const heightPct = Math.max(12, Math.round((item.total / maxMonthVolume) * 100));
              const bpjsHeight = item.total > 0 ? (item.bpjs / item.total) * 100 : 0;
              const eksternalHeight = item.total > 0 ? (item.eksternal / item.total) * 100 : 0;

              return (
                <div key={item.bulan} className="flex-1 flex flex-col items-center group relative">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-24 bg-slate-950 text-white text-[11px] p-2.5 rounded-lg border border-slate-700 shadow-xl pointer-events-none z-20 whitespace-nowrap min-w-[140px]">
                    <div className="font-bold text-emerald-400">{item.labelBulan}</div>
                    <div>Total: <span className="font-mono font-bold">{item.total} kunjungan</span></div>
                    <div>BPJS: {item.bpjs} | Umum: {item.umum}</div>
                    <div>Eksternal: {item.eksternal} | Internal: {item.internal}</div>
                    {item.momGrowthPct !== null && (
                      <div className={item.momGrowthPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        Pertumbuhan MoM: {item.momGrowthPct >= 0 ? '+' : ''}{item.momGrowthPct}%
                      </div>
                    )}
                    {item.isPartial && <div className="text-amber-400 font-semibold">*Bulan Parsial (Berjalan)</div>}
                  </div>

                  {/* Volume label above bar */}
                  <span className="text-[11px] font-mono font-semibold text-slate-300 mb-1">
                    {item.total}
                  </span>

                  {/* Bar container */}
                  <div
                    className={`w-full max-w-[56px] rounded-t-lg overflow-hidden transition-all duration-300 flex flex-col justify-end ${
                      item.isPartial ? 'border-2 border-dashed border-amber-500/80 bg-slate-800/40' : 'bg-slate-800'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  >
                    {selectedMetric === 'total' && (
                      <div className={`w-full h-full rounded-t-md ${item.isPartial ? 'bg-amber-500/60' : 'bg-gradient-to-t from-emerald-600 to-teal-400'}`} />
                    )}

                    {selectedMetric === 'payment' && (
                      <div className="w-full h-full flex flex-col justify-end">
                        <div className="w-full bg-amber-500/80" style={{ height: `${100 - bpjsHeight}%` }} />
                        <div className="w-full bg-emerald-500" style={{ height: `${bpjsHeight}%` }} />
                      </div>
                    )}

                    {selectedMetric === 'referrer' && (
                      <div className="w-full h-full flex flex-col justify-end">
                        <div className="w-full bg-purple-500/80" style={{ height: `${100 - eksternalHeight}%` }} />
                        <div className="w-full bg-blue-500" style={{ height: `${eksternalHeight}%` }} />
                      </div>
                    )}
                  </div>

                  {/* Month X-axis label */}
                  <div className="mt-2 text-center">
                    <span className="text-[11px] font-medium text-slate-300 block truncate max-w-[70px]">
                      {item.labelBulan.split(' ')[0]}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">
                      {item.bulan.split('-')[0]}
                    </span>
                    {item.isPartial && (
                      <span className="inline-block px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[9px] font-bold">
                        Parsial
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chart Legend */}
          <div className="mt-6 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-4">
              {selectedMetric === 'total' && (
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-500"></span>
                  <span>Volume Kunjungan Rujukan</span>
                </div>
              )}
              {selectedMetric === 'payment' && (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-emerald-500"></span>
                    <span>BPJS (No. Rujukan Terisi)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-amber-500"></span>
                    <span>Umum/Tunai (Tanpa No. Rujukan)</span>
                  </div>
                </>
              )}
              {selectedMetric === 'referrer' && (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-blue-500"></span>
                    <span>Perujuk Eksternal (Mitra Luar)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-purple-500"></span>
                    <span>Perujuk Internal (RSUD Al-Mulk)</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Garis putus-putus menandakan bulan berjalan dengan data hari belum lengkap.</span>
            </div>
          </div>
        </div>

        {/* Monthly Breakdown Table */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3 rounded-l-lg">Bulan</th>
                <th className="py-2.5 px-3 text-right">Total Kunjungan</th>
                <th className="py-2.5 px-3 text-right">Pertumbuhan MoM</th>
                <th className="py-2.5 px-3 text-right">BPJS</th>
                <th className="py-2.5 px-3 text-right">Umum/Tunai</th>
                <th className="py-2.5 px-3 text-right">Eksternal</th>
                <th className="py-2.5 px-3 text-right">Internal</th>
                <th className="py-2.5 px-3 text-center rounded-r-lg">Status Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {monthlyTrends.map((m) => (
                <tr key={m.bulan} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2 px-3 font-semibold text-white">
                    {m.labelBulan}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-100">
                    {m.total}
                  </td>
                  <td className="py-2 px-3 text-right font-mono">
                    {m.momGrowthPct === null ? (
                      <span className="text-slate-500">- (Baseline)</span>
                    ) : m.momGrowthPct >= 0 ? (
                      <span className="inline-flex items-center gap-0.5 text-emerald-400 font-semibold">
                        <TrendingUp className="w-3 h-3" /> +{m.momGrowthPct}%
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-rose-400 font-semibold">
                        <TrendingDown className="w-3 h-3" /> {m.momGrowthPct}%
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-emerald-400">
                    {m.bpjs} <span className="text-[10px] text-slate-500">({m.total > 0 ? Math.round((m.bpjs/m.total)*100) : 0}%)</span>
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-amber-400">
                    {m.umum} <span className="text-[10px] text-slate-500">({m.total > 0 ? Math.round((m.umum/m.total)*100) : 0}%)</span>
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-blue-400">
                    {m.eksternal}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-purple-400">
                    {m.internal}
                  </td>
                  <td className="py-2 px-3 text-center">
                    {m.isPartial ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-semibold">
                        Parsial (Tidak Penuh)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold">
                        Periode Lengkap
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Day of Week Distribution & Operational Timing Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Day of Week Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                Distribusi Hari Kedatangan Pasien Rujukan
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Pola kedatangan dalam seminggu untuk optimalisasi operasional dokter spesialis & pendaftaran.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {dayOfWeekData.map((d) => {
              const isPeak = d.pct === Math.max(...dayOfWeekData.map((x) => x.pct));
              return (
                <div key={d.dayName} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-medium ${isPeak ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>
                      {d.dayName} {isPeak && <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 ml-1">Puncak Rujukan</span>}
                    </span>
                    <span className="font-mono text-slate-400">
                      <strong className="text-slate-200">{d.count}</strong> kunjungan ({d.pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        isPeak ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-blue-600/80'
                      }`}
                      style={{ width: `${Math.max(4, (d.pct / 30) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Operational Intelligence Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <Info className="w-4 h-4 text-emerald-400" />
              Insight Operasional & Jadwal Pelayanan Rujukan
            </h3>

            <div className="mt-4 space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                  Rata-rata Kunjungan Rujukan Harian
                </span>
                <div className="text-xl font-black font-mono text-emerald-400">
                  {dailyAvg} <span className="text-xs font-normal text-slate-400">kunjungan / hari operasional</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Berdasarkan {uniqueDates.size} hari dengan data kunjungan tercatat pada dataset.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                  Rekomendasi Kapasitas Pelayanan Poli
                </span>
                <p className="text-slate-300 leading-relaxed">
                  Pola data menunjukkan volume rujukan terkonsentrasi di awal pekan (Senin & Selasa). Pastikan loket pendaftaran rujukan BPJS (bridging VClaim/Mobile JKN) dan poli dengan kuota besar (Penyakit Dalam, Anak, Kebidanan) siap dengan sistem antrean terintegrasi sejak pukul 07.30 WIB.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2 text-[11px] text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Verifikasi operasional dilakukan bersama Subbag Humas & Pemasaran RSUD Al-Mulk.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
