import { CleanReferralRecord, DashboardKpiSummary, AgeGroup } from '../types/referral';

export function computeDashboardKpis(records: CleanReferralRecord[]): DashboardKpiSummary {
  const total = records.length;

  if (total === 0) {
    return {
      totalRekaman: 0,
      internalCount: 0,
      internalPct: 0,
      eksternalCount: 0,
      eksternalPct: 0,
      bpjsCount: 0,
      bpjsPct: 0,
      umumCount: 0,
      umumPct: 0,
      uniqueWilayahPasienCount: 0,
      uniquePerujukEksternalCount: 0,
      topPoli: { nama: '-', count: 0, pct: 0 },
      topUsia: { kelompok: 'Tidak diketahui/tidak valid', count: 0, pct: 0 },
      topDiagnosa: { nama: '-', count: 0, pct: 0 },
      minDate: '-',
      maxDate: '-',
      isPartialMonth: false,
      invalidDateCount: 0,
    };
  }

  let internalCount = 0;
  let eksternalCount = 0;
  let bpjsCount = 0;
  let umumCount = 0;
  let invalidDateCount = 0;

  const wilayahPasienSet = new Set<string>();
  const perujukEksternalSet = new Set<string>();

  const poliCounts: Record<string, number> = {};
  const usiaCounts: Record<AgeGroup, number> = {
    '< 1 tahun': 0,
    '1–4 tahun': 0,
    '5–14 tahun': 0,
    '15–24 tahun': 0,
    '25–44 tahun': 0,
    '45–59 tahun': 0,
    '60 tahun atau lebih': 0,
    'Tidak diketahui/tidak valid': 0,
  };
  const diagCounts: Record<string, number> = {};

  let minDate = '9999-99-99';
  let maxDate = '0000-00-00';

  for (const r of records) {
    // Referrer
    if (r.kategoriPerujuk === 'Internal') {
      internalCount++;
    } else if (r.kategoriPerujuk === 'Eksternal') {
      eksternalCount++;
      if (r.perujukClean) perujukEksternalSet.add(r.perujukClean);
    }

    // Payment
    if (r.kategoriPembayaran === 'BPJS') {
      bpjsCount++;
    } else {
      umumCount++;
    }

    // Territory
    if (r.wilayahPasienNormal && r.wilayahPasienNormal !== 'Perlu verifikasi') {
      wilayahPasienSet.add(r.wilayahPasienNormal);
    }

    // Clinic
    const p = r.poliTujuan || 'Lainnya';
    poliCounts[p] = (poliCounts[p] || 0) + 1;

    // Age
    usiaCounts[r.kelompokUsia] = (usiaCounts[r.kelompokUsia] || 0) + 1;

    // Diagnosis
    const d = r.diagnosaAwal || 'Lainnya';
    diagCounts[d] = (diagCounts[d] || 0) + 1;

    // Date
    if (r.tanggalMasuk && r.tanggalMasuk !== '1970-01-01') {
      if (r.tanggalMasuk < minDate) minDate = r.tanggalMasuk;
      if (r.tanggalMasuk > maxDate) maxDate = r.tanggalMasuk;
    } else {
      invalidDateCount++;
    }
  }

  // Find top clinic
  let topPoli = { nama: '-', count: 0, pct: 0 };
  for (const [nama, count] of Object.entries(poliCounts)) {
    if (count > topPoli.count) {
      topPoli = { nama, count, pct: Math.round((count / total) * 1000) / 10 };
    }
  }

  // Find top age
  let topUsia: { kelompok: AgeGroup; count: number; pct: number } = {
    kelompok: 'Tidak diketahui/tidak valid',
    count: 0,
    pct: 0,
  };
  for (const [kelompok, count] of Object.entries(usiaCounts)) {
    if (count > topUsia.count) {
      topUsia = {
        kelompok: kelompok as AgeGroup,
        count,
        pct: Math.round((count / total) * 1000) / 10,
      };
    }
  }

  // Find top diag
  let topDiagnosa = { nama: '-', count: 0, pct: 0 };
  for (const [nama, count] of Object.entries(diagCounts)) {
    if (count > topDiagnosa.count) {
      topDiagnosa = { nama, count, pct: Math.round((count / total) * 1000) / 10 };
    }
  }

  // Check if latest month is partial
  let isPartialMonth = false;
  if (maxDate !== '0000-00-00') {
    const lastDay = parseInt(maxDate.split('-')[2], 10);
    // If the latest date in the dataset ends before day 27 of that month
    if (lastDay < 27) {
      isPartialMonth = true;
    }
  }

  return {
    totalRekaman: total,
    internalCount,
    internalPct: Math.round((internalCount / total) * 1000) / 10,
    eksternalCount,
    eksternalPct: Math.round((eksternalCount / total) * 1000) / 10,
    bpjsCount,
    bpjsPct: Math.round((bpjsCount / total) * 1000) / 10,
    umumCount,
    umumPct: Math.round((umumCount / total) * 1000) / 10,
    uniqueWilayahPasienCount: wilayahPasienSet.size,
    uniquePerujukEksternalCount: perujukEksternalSet.size,
    topPoli,
    topUsia,
    topDiagnosa,
    minDate: minDate !== '9999-99-99' ? minDate : '-',
    maxDate: maxDate !== '0000-00-00' ? maxDate : '-',
    isPartialMonth,
    invalidDateCount,
  };
}

export interface MonthlyTrendItem {
  bulan: string; // YYYY-MM
  labelBulan: string; // Mei 2024
  total: number;
  bpjs: number;
  umum: number;
  internal: number;
  eksternal: number;
  momGrowthPct: number | null; // % change vs previous month
  isPartial: boolean;
}

const INDONESIA_MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function formatMonthLabel(yyyyMm: string): string {
  if (!yyyyMm || !yyyyMm.includes('-')) return yyyyMm;
  const [y, m] = yyyyMm.split('-');
  const mIdx = parseInt(m, 10) - 1;
  return `${INDONESIA_MONTH_NAMES[mIdx] || m} ${y}`;
}

export function computeMonthlyTrends(records: CleanReferralRecord[], maxDateStr: string): MonthlyTrendItem[] {
  const map: Record<string, { total: number; bpjs: number; umum: number; internal: number; eksternal: number }> = {};

  for (const r of records) {
    if (!r.bulan || r.bulan === 'Tidak Valid') continue;
    if (!map[r.bulan]) {
      map[r.bulan] = { total: 0, bpjs: 0, umum: 0, internal: 0, eksternal: 0 };
    }
    map[r.bulan].total++;
    if (r.kategoriPembayaran === 'BPJS') map[r.bulan].bpjs++;
    else map[r.bulan].umum++;

    if (r.kategoriPerujuk === 'Internal') map[r.bulan].internal++;
    else if (r.kategoriPerujuk === 'Eksternal') map[r.bulan].eksternal++;
  }

  const sortedMonths = Object.keys(map).sort();
  const result: MonthlyTrendItem[] = [];

  for (let i = 0; i < sortedMonths.length; i++) {
    const m = sortedMonths[i];
    const data = map[m];
    let momGrowthPct: number | null = null;

    if (i > 0) {
      const prevTotal = map[sortedMonths[i - 1]].total;
      if (prevTotal > 0) {
        momGrowthPct = Math.round(((data.total - prevTotal) / prevTotal) * 1000) / 10;
      }
    }

    // Check if partial month (if month is the latest month and maxDate day < 27)
    let isPartial = false;
    if (i === sortedMonths.length - 1 && maxDateStr && maxDateStr.startsWith(m)) {
      const day = parseInt(maxDateStr.split('-')[2], 10);
      if (day < 27) isPartial = true;
    }

    result.push({
      bulan: m,
      labelBulan: formatMonthLabel(m),
      total: data.total,
      bpjs: data.bpjs,
      umum: data.umum,
      internal: data.internal,
      eksternal: data.eksternal,
      momGrowthPct,
      isPartial,
    });
  }

  return result;
}

export interface DayOfWeekItem {
  dayName: string;
  dayIndex: number;
  count: number;
  pct: number;
}

export function computeDayOfWeekDistribution(records: CleanReferralRecord[]): DayOfWeekItem[] {
  // 1: Senin, 2: Selasa, 3: Rabu, 4: Kamis, 5: Jumat, 6: Sabtu, 0: Minggu
  const order = [1, 2, 3, 4, 5, 6, 0];
  const dayNames: Record<number, string> = {
    1: 'Senin',
    2: 'Selasa',
    3: 'Rabu',
    4: 'Kamis',
    5: 'Jumat',
    6: 'Sabtu',
    0: 'Minggu',
  };

  const counts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  let validDaysTotal = 0;

  for (const r of records) {
    if (r.hariIndex >= 0 && r.hariIndex <= 6) {
      counts[r.hariIndex]++;
      validDaysTotal++;
    }
  }

  return order.map((idx) => ({
    dayIndex: idx,
    dayName: dayNames[idx],
    count: counts[idx],
    pct: validDaysTotal > 0 ? Math.round((counts[idx] / validDaysTotal) * 1000) / 10 : 0,
  }));
}

export interface ReferrerDetailSummary {
  name: string;
  category: string;
  address: string;
  totalKunjungan: number;
  pctOfTotal: number;
  bpjsCount: number;
  umumCount: number;
  topPoli: string;
  topDiagnosis: string;
  primaryAgeGroup: string;
  recentMonthCount: number;
  prevMonthCount: number;
  growthPct: number | null;
  statusBadge: 'Top Volume' | 'Tren Meningkat' | 'Tren Menurun' | 'Perujuk Baru' | 'Perlu Tindak Lanjut' | 'Stabil';
  monthlyMap: Record<string, number>;
  poliMap: Record<string, number>;
}

export function computeExternalReferrers(
  records: CleanReferralRecord[],
  months: string[]
): ReferrerDetailSummary[] {
  const externalRecords = records.filter((r) => r.kategoriPerujuk === 'Eksternal');
  const totalExt = externalRecords.length;

  if (totalExt === 0) return [];

  const map: Record<string, {
    address: string;
    total: number;
    bpjs: number;
    umum: number;
    monthlyMap: Record<string, number>;
    poliMap: Record<string, number>;
    diagMap: Record<string, number>;
    ageMap: Record<AgeGroup, number>;
  }> = {};

  for (const r of externalRecords) {
    const name = r.perujukClean || 'Tidak Disebutkan';
    if (!map[name]) {
      map[name] = {
        address: r.alamatPerujukRaw || r.wilayahPerujuk,
        total: 0,
        bpjs: 0,
        umum: 0,
        monthlyMap: {},
        poliMap: {},
        diagMap: {},
        ageMap: {
          '< 1 tahun': 0,
          '1–4 tahun': 0,
          '5–14 tahun': 0,
          '15–24 tahun': 0,
          '25–44 tahun': 0,
          '45–59 tahun': 0,
          '60 tahun atau lebih': 0,
          'Tidak diketahui/tidak valid': 0,
        },
      };
    }

    map[name].total++;
    if (r.kategoriPembayaran === 'BPJS') map[name].bpjs++;
    else map[name].umum++;

    if (r.bulan) {
      map[name].monthlyMap[r.bulan] = (map[name].monthlyMap[r.bulan] || 0) + 1;
    }

    const p = r.poliTujuan || 'Lainnya';
    map[name].poliMap[p] = (map[name].poliMap[p] || 0) + 1;

    const d = r.diagnosaAwal || 'Lainnya';
    map[name].diagMap[d] = (map[name].diagMap[d] || 0) + 1;

    map[name].ageMap[r.kelompokUsia]++;
  }

  const latestMonth = months.length > 0 ? months[months.length - 1] : '';
  const prevMonth = months.length > 1 ? months[months.length - 2] : '';

  const list: ReferrerDetailSummary[] = Object.entries(map).map(([name, d]) => {
    // find top poli
    let topPoli = '-';
    let maxP = 0;
    for (const [p, c] of Object.entries(d.poliMap)) {
      if (c > maxP) {
        maxP = c;
        topPoli = p;
      }
    }

    // find top diag
    let topDiagnosis = '-';
    let maxD = 0;
    for (const [dg, c] of Object.entries(d.diagMap)) {
      if (c > maxD) {
        maxD = c;
        topDiagnosis = dg;
      }
    }

    // find primary age
    let primaryAgeGroup = '-';
    let maxA = 0;
    for (const [ag, c] of Object.entries(d.ageMap)) {
      if (c > maxA) {
        maxA = c;
        primaryAgeGroup = ag;
      }
    }

    const recentMonthCount = latestMonth ? (d.monthlyMap[latestMonth] || 0) : 0;
    const prevMonthCount = prevMonth ? (d.monthlyMap[prevMonth] || 0) : 0;

    let growthPct: number | null = null;
    if (prevMonthCount > 0) {
      growthPct = Math.round(((recentMonthCount - prevMonthCount) / prevMonthCount) * 1000) / 10;
    }

    // Status badge determination rules
    let statusBadge: ReferrerDetailSummary['statusBadge'] = 'Stabil';
    if (d.total >= totalExt * 0.12) {
      statusBadge = 'Top Volume';
    } else if (prevMonthCount === 0 && recentMonthCount >= 3) {
      statusBadge = 'Perujuk Baru';
    } else if (growthPct !== null && growthPct > 20 && recentMonthCount >= 5) {
      statusBadge = 'Tren Meningkat';
    } else if (growthPct !== null && growthPct < -25 && prevMonthCount >= 5) {
      statusBadge = 'Perlu Tindak Lanjut';
    } else if (growthPct !== null && growthPct < -10) {
      statusBadge = 'Tren Menurun';
    }

    return {
      name,
      category: 'Eksternal',
      address: d.address,
      totalKunjungan: d.total,
      pctOfTotal: Math.round((d.total / totalExt) * 1000) / 10,
      bpjsCount: d.bpjs,
      umumCount: d.umum,
      topPoli,
      topDiagnosis,
      primaryAgeGroup,
      recentMonthCount,
      prevMonthCount,
      growthPct,
      statusBadge,
      monthlyMap: d.monthlyMap,
      poliMap: d.poliMap,
    };
  });

  return list.sort((a, b) => b.totalKunjungan - a.totalKunjungan);
}
