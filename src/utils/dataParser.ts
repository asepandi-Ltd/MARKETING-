import * as XLSX from 'xlsx';
import { CleanReferralRecord, AgeGroup, ReferrerCategory, PaymentCategory } from '../types/referral';
import { normalizeTerritory } from './geoSukabumi';

// Age parsing function
export function parseAge(raw: any): { ageYears: number | null; group: AgeGroup } {
  if (raw === undefined || raw === null) {
    return { ageYears: null, group: 'Tidak diketahui/tidak valid' };
  }

  const str = String(raw).toLowerCase().trim();
  if (!str || str === '-' || (str === '0 th' && !str.includes('bl') && !str.includes('hr'))) {
    if (str === '0' || str === '0 th') {
      return { ageYears: 0, group: '< 1 tahun' };
    }
  }

  // Check months (e.g. "5 bln", "6 bulan", "3 bl", "0 th 5 bl")
  const monthMatch = str.match(/(\d+)\s*(bulan|bln|bl)/i);
  const dayMatch = str.match(/(\d+)\s*(hari|hr)/i);
  const yearMatch = str.match(/(\d+)\s*(thn|th|tahun)?/i);

  let years = 0;
  let hasParsed = false;

  if (monthMatch && (!yearMatch || str.includes('0 th') || str.includes('0th') || !str.match(/\d+\s*(th|tahun)/))) {
    const months = parseInt(monthMatch[1], 10);
    years = months / 12;
    hasParsed = true;
  } else if (dayMatch && (!yearMatch || str.includes('0 th') || !str.match(/\d+\s*(th|tahun)/))) {
    const days = parseInt(dayMatch[1], 10);
    years = days / 365;
    hasParsed = true;
  } else if (yearMatch) {
    // If format like "45 Th 3 Bln"
    const parsedYears = parseInt(yearMatch[1], 10);
    if (!isNaN(parsedYears)) {
      years = parsedYears;
      if (monthMatch) {
        years += parseInt(monthMatch[1], 10) / 12;
      }
      hasParsed = true;
    }
  }

  // Fallback to pure numeric parse
  if (!hasParsed) {
    const num = parseFloat(str);
    if (!isNaN(num) && num >= 0 && num <= 125) {
      years = num;
      hasParsed = true;
    }
  }

  if (!hasParsed || isNaN(years) || years < 0 || years > 125) {
    return { ageYears: null, group: 'Tidak diketahui/tidak valid' };
  }

  let group: AgeGroup = 'Tidak diketahui/tidak valid';
  if (years < 1) {
    group = '< 1 tahun';
  } else if (years >= 1 && years < 5) {
    group = '1–4 tahun';
  } else if (years >= 5 && years < 15) {
    group = '5–14 tahun';
  } else if (years >= 15 && years < 25) {
    group = '15–24 tahun';
  } else if (years >= 25 && years < 45) {
    group = '25–44 tahun';
  } else if (years >= 45 && years < 60) {
    group = '45–59 tahun';
  } else if (years >= 60) {
    group = '60 tahun atau lebih';
  }

  return { ageYears: Math.round(years * 10) / 10, group };
}

// Payment method determination: Strict user rule
// If no rujukan is filled and not just whitespace => BPJS
// If no rujukan is empty, null, or whitespace => Umum/Tunai
export function determinePaymentCategory(noRujukan: any): { category: PaymentCategory; rawValue: string } {
  if (noRujukan === undefined || noRujukan === null) {
    return { category: 'Umum/Tunai', rawValue: '' };
  }

  const rawStr = String(noRujukan).trim();
  if (rawStr.length === 0 || rawStr === '-' || rawStr.toLowerCase() === 'null') {
    return { category: 'Umum/Tunai', rawValue: rawStr };
  }

  return { category: 'BPJS', rawValue: rawStr };
}

// Referrer classification
export function classifyReferrer(rawReferrer: any): {
  cleanName: string;
  category: ReferrerCategory;
} {
  if (!rawReferrer || typeof rawReferrer !== 'string' || !rawReferrer.trim()) {
    return {
      cleanName: 'Tidak Terisi / Belum Diketahui',
      category: 'Belum Diketahui',
    };
  }

  const clean = rawReferrer.trim();
  const lower = clean.toLowerCase();

  // Check if RSUD Al-Mulk internal
  if (
    lower.includes('al-mulk') ||
    lower.includes('al mulk') ||
    lower.includes('almulk') ||
    lower.includes('internal') ||
    lower.includes('rsud al')
  ) {
    return {
      cleanName: clean,
      category: 'Internal',
    };
  }

  return {
    cleanName: clean,
    category: 'Eksternal',
  };
}

// Date normalization
const INDONESIA_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const MONTH_MAP_INDONESIA: Record<string, number> = {
  jan: 0, januari: 0,
  feb: 1, februari: 1,
  mar: 2, maret: 2,
  apr: 3, april: 3,
  mei: 4, may: 4,
  jun: 5, juni: 5,
  jul: 6, juli: 6,
  agu: 7, agustus: 7, aug: 7,
  sep: 8, september: 8,
  okt: 9, oktober: 9, oct: 9,
  nov: 10, november: 10,
  des: 11, desember: 11, dec: 11,
};

export function parseDate(raw: any): {
  isoDate: string;
  bulan: string;
  tahun: number;
  hariNama: string;
  hariIndex: number;
  isValid: boolean;
} {
  if (!raw) {
    return {
      isoDate: '',
      bulan: '',
      tahun: 0,
      hariNama: '',
      hariIndex: -1,
      isValid: false,
    };
  }

  let dateObj: Date | null = null;

  // 1. Check if Excel serial number (e.g. 45678 for 2025)
  if (typeof raw === 'number') {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    dateObj = new Date(excelEpoch.getTime() + raw * 86400000);
  } else if (raw instanceof Date) {
    dateObj = raw;
  } else if (typeof raw === 'string') {
    const str = raw.trim();

    // Match YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD (with optional time)
    const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (ymdMatch) {
      dateObj = new Date(parseInt(ymdMatch[1], 10), parseInt(ymdMatch[2], 10) - 1, parseInt(ymdMatch[3], 10));
    }

    // Match DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY (with optional time)
    if (!dateObj || isNaN(dateObj.getTime())) {
      const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
      if (dmyMatch) {
        dateObj = new Date(parseInt(dmyMatch[3], 10), parseInt(dmyMatch[2], 10) - 1, parseInt(dmyMatch[1], 10));
      }
    }

    // Match textual date like "15 Januari 2025" or "15 Jan 2026"
    if (!dateObj || isNaN(dateObj.getTime())) {
      const textMatch = str.match(/(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
      if (textMatch) {
        const d = parseInt(textMatch[1], 10);
        const mStr = textMatch[2].toLowerCase();
        const y = parseInt(textMatch[3], 10);
        if (MONTH_MAP_INDONESIA[mStr] !== undefined) {
          dateObj = new Date(y, MONTH_MAP_INDONESIA[mStr], d);
        }
      }
    }

    // Native Date parse fallback
    if (!dateObj || isNaN(dateObj.getTime())) {
      const parsed = Date.parse(str);
      if (!isNaN(parsed)) {
        dateObj = new Date(parsed);
      }
    }
  }

  if (!dateObj || isNaN(dateObj.getTime())) {
    return {
      isoDate: '',
      bulan: '',
      tahun: 0,
      hariNama: '',
      hariIndex: -1,
      isValid: false,
    };
  }

  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  const isoDate = `${y}-${m}-${d}`;
  const bulan = `${y}-${m}`;
  const dayIndex = dateObj.getDay();

  return {
    isoDate,
    bulan,
    tahun: y,
    hariNama: INDONESIA_DAYS[dayIndex] || 'Lainnya',
    hariIndex: dayIndex,
    isValid: true,
  };
}

// Comprehensive candidate keys matching to handle any Excel header variation
function findColumnValue(row: Record<string, any>, candidateKeys: string[]): any {
  const rowKeys = Object.keys(row);

  // Exact normalized match first
  for (const candidate of candidateKeys) {
    const normalizedCandidate = candidate.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const key of rowKeys) {
      const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (normalizedKey === normalizedCandidate) {
        return row[key];
      }
    }
  }

  // Partial includes match fallback
  for (const candidate of candidateKeys) {
    const normalizedCandidate = candidate.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalizedCandidate.length < 4) continue;
    for (const key of rowKeys) {
      const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (normalizedKey.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedKey)) {
        return row[key];
      }
    }
  }

  return undefined;
}

// Primary parser for raw rows
export function transformRawRowsToCleanRecords(rawRows: Record<string, any>[]): {
  records: CleanReferralRecord[];
  skippedCount: number;
  invalidDateCount: number;
  detectedPoliList: string[];
  detectedYears: number[];
} {
  const records: CleanReferralRecord[] = [];
  let skippedCount = 0;
  let invalidDateCount = 0;

  const detectedPoliSet = new Set<string>();
  const detectedYearsSet = new Set<number>();

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];

    // Extract columns according to specification with exhaustive synonyms
    const rawTanggalMasuk = findColumnValue(row, [
      'tanggal masuk', 'tgl masuk', 'tglmasuk', 'tanggalmasuk',
      'tanggal kunjungan', 'tgl kunjungan', 'tglkunjungan',
      'tanggal periksa', 'tgl periksa', 'tglperiksa',
      'tanggal registrasi', 'tgl registrasi', 'tglregistrasi',
      'tanggal rujukan', 'tgl rujukan', 'tglrujukan',
      'tanggal', 'tgl', 'waktu masuk', 'tgl_masuk', 'tanggal_masuk'
    ]);

    const rawPerujuk = findColumnValue(row, [
      'perujuk internal / eksternal', 'perujuk internal/eksternal', 'perujuk internal eksternal',
      'perujuk', 'nama perujuk', 'faskes perujuk', 'asal perujuk', 'instansi perujuk',
      'nama faskes', 'faskes', 'perujuk internal', 'perujuk eksternal', 'nama instansi perujuk'
    ]);

    const rawAlamatPerujuk = findColumnValue(row, [
      'alamat perujuk', 'alamat_perujuk', 'wilayah perujuk', 'alamat faskes',
      'alamat instansi perujuk', 'wilayah faskes', 'lokasi perujuk', 'alamat faskes perujuk'
    ]);

    const rawNoRujukan = findColumnValue(row, [
      'no rujukan', 'norujukan', 'nomor rujukan', 'no_rujukan', 'no. rujukan',
      'no.rujukan', 'nomorrujukan', 'nokartu rujukan', 'no rujukan pcare',
      'no sep', 'no rujukan bpjs', 'norujukanbpjs'
    ]);

    const rawAlamatPasien = findColumnValue(row, [
      'alamat', 'alamat pasien', 'alamat_pasien', 'domisili', 'alamat domisili',
      'kelurahan', 'kecamatan', 'wilayah', 'alamat tempat tinggal'
    ]);

    const rawUmur = findColumnValue(row, [
      'umur pasien', 'umur', 'usia', 'umur_pasien', 'usia pasien',
      'usia_pasien', 'umur (th)', 'umur th', 'usia th'
    ]);

    const rawDiagnosaAwal = findColumnValue(row, [
      'diagnosa awal', 'diagnosaawal', 'diagnosis awal', 'diagnosa_awal',
      'diagnosis_awal', 'diagnosa', 'diagnosis', 'diagnosa rujukan',
      'diagnosis rujukan', 'icd 10', 'icd10', 'diagnosa masuk', 'diagnosis masuk'
    ]);

    const rawPoliRujukan = findColumnValue(row, [
      'poli rujukan', 'polirujukan', 'poli tujuan', 'politujuan',
      'poli', 'namapoli', 'nama poli', 'poliklinik', 'nama poliklinik',
      'poli dituju', 'unit', 'unit poli', 'nama unit', 'klinik', 'tujuan poli'
    ]);

    // Parse date
    const dateInfo = parseDate(rawTanggalMasuk);
    if (!dateInfo.isValid) {
      invalidDateCount++;
    } else {
      if (dateInfo.tahun > 1900) {
        detectedYearsSet.add(dateInfo.tahun);
      }
    }

    // Classify referrer
    const referrerInfo = classifyReferrer(rawPerujuk);
    const referrerTerritory = normalizeTerritory(rawAlamatPerujuk);

    // Classify payment strictly: filled -> BPJS, empty/spaces -> Umum/Tunai
    const paymentInfo = determinePaymentCategory(rawNoRujukan);

    // Patient territory
    const patientTerritory = normalizeTerritory(rawAlamatPasien);

    // Patient age
    const ageInfo = parseAge(rawUmur);

    // Initial diagnosis & ICD extraction
    const diagRaw = rawDiagnosaAwal ? String(rawDiagnosaAwal).trim() : 'Diagnosis tidak tercatat';
    let icdCode = '';
    const icdMatch = diagRaw.match(/^([A-Z]\d{2}(\.\d+)?)/i);
    if (icdMatch) {
      icdCode = icdMatch[1].toUpperCase();
    }

    // Clinic: dynamic from file, ONLY what is in file!
    const poliRaw = rawPoliRujukan && String(rawPoliRujukan).trim().length > 0 
      ? String(rawPoliRujukan).trim() 
      : 'Poli Tidak Tercatat';
    
    detectedPoliSet.add(poliRaw);

    // PRIVACY ENFORCEMENT: Never store no rawat, no rm, or nama pasien!
    const cleanRecord: CleanReferralRecord = {
      id: `rec-${i + 1}-${Date.now() % 100000}-${Math.random().toString(36).substring(2, 6)}`,
      tanggalMasuk: dateInfo.isoDate || '1970-01-01',
      bulan: dateInfo.bulan || 'Tidak Valid',
      tahun: dateInfo.tahun || 0,
      hariNama: dateInfo.hariNama || 'Tidak Valid',
      hariIndex: dateInfo.hariIndex,

      perujukRaw: rawPerujuk ? String(rawPerujuk).trim() : '',
      perujukClean: referrerInfo.cleanName,
      kategoriPerujuk: referrerInfo.category,
      alamatPerujukRaw: rawAlamatPerujuk ? String(rawAlamatPerujuk).trim() : '',
      wilayahPerujuk: referrerTerritory.wilayahNormal,
      kotaKabPerujuk: referrerTerritory.kotaKab,

      noRujukanRaw: paymentInfo.rawValue,
      kategoriPembayaran: paymentInfo.category,

      alamatPasienRaw: rawAlamatPasien ? String(rawAlamatPasien).trim() : '',
      kelurahanPasien: patientTerritory.kecamatan,
      kecamatanPasien: patientTerritory.kecamatan,
      kotaKabPasien: patientTerritory.kotaKab,
      wilayahPasienNormal: patientTerritory.wilayahNormal,

      umurRaw: rawUmur !== undefined ? String(rawUmur) : '',
      umurTahun: ageInfo.ageYears,
      kelompokUsia: ageInfo.group,

      poliTujuan: poliRaw,
      diagnosaAwal: diagRaw,
      kodeIcd: icdCode,
    };

    records.push(cleanRecord);
  }

  return {
    records,
    skippedCount,
    invalidDateCount,
    detectedPoliList: Array.from(detectedPoliSet).sort(),
    detectedYears: Array.from(detectedYearsSet).sort(),
  };
}

// Parse uploaded Excel (.xlsx, .xls) or CSV with intelligent Sheet discovery
export async function parseExcelOrCsvFile(file: File): Promise<{
  records: CleanReferralRecord[];
  sheetName: string;
  totalRows: number;
  invalidDateCount: number;
  detectedPoliList: string[];
  detectedYears: number[];
}> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

  // Intelligent Sheet Detection:
  // 1. Look for sheet named 'Sheet1' (case-insensitive)
  // 2. Or search for sheet with keywords like 'perujuk', 'rujukan', 'data', 'kunjungan'
  // 3. Or choose whichever sheet has the most populated rows!
  let targetSheetName = workbook.SheetNames[0];

  const sheet1Match = workbook.SheetNames.find(
    (name) => name.toLowerCase().replace(/\s+/g, '') === 'sheet1'
  );
  if (sheet1Match) {
    targetSheetName = sheet1Match;
  } else {
    const keywordMatch = workbook.SheetNames.find((name) => {
      const lower = name.toLowerCase();
      return lower.includes('perujuk') || lower.includes('rujukan') || lower.includes('data');
    });
    if (keywordMatch) {
      targetSheetName = keywordMatch;
    } else {
      // Find sheet with maximum rows
      let maxRows = 0;
      for (const name of workbook.SheetNames) {
        const s = workbook.Sheets[name];
        if (s && s['!ref']) {
          const range = XLSX.utils.decode_range(s['!ref']);
          const rowCount = range.e.r - range.s.r + 1;
          if (rowCount > maxRows) {
            maxRows = rowCount;
            targetSheetName = name;
          }
        }
      }
    }
  }

  const sheet = workbook.Sheets[targetSheetName];
  if (!sheet) {
    throw new Error(`Lembar kerja (sheet) tidak ditemukan dalam file.`);
  }

  const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });
  const result = transformRawRowsToCleanRecords(jsonRows);

  return {
    records: result.records,
    sheetName: targetSheetName,
    totalRows: jsonRows.length,
    invalidDateCount: result.invalidDateCount,
    detectedPoliList: result.detectedPoliList,
    detectedYears: result.detectedYears,
  };
}
