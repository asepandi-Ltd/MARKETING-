import * as XLSX from 'xlsx';
import { MarketingVisitRecord, SegmentType, VisitEvaluationStatus } from '../types/marketingVisit';
import { CleanReferralRecord } from '../types/referral';
import { parseDate } from './dataParser';
import { normalizeTerritory } from './geoSukabumi';

export interface VisitColumnMapping {
  tanggalCol: string;
  lokasiCol: string;
  segmenCol: string; // can be '__AUTO_DETECT__' or a column name
  alamatCol: string;
  maksudCol: string;
  petugasCol?: string;
  catatanCol?: string;
}

export interface InspectedWorkbookInfo {
  workbook: XLSX.WorkBook;
  sheetNames: string[];
  activeSheet: string;
  headerRowIndex: number; // 0-based
  availableColumns: string[];
  rawRows2D: any[][];
  suggestedMapping: VisitColumnMapping;
}

// Helper to determine segment type from text
export function normalizeSegmentType(raw: any): SegmentType {
  if (!raw || typeof raw !== 'string') return 'Lainnya';
  const str = raw.toLowerCase().trim();

  if (str.includes('puskesmas') || str.includes('pkm')) return 'Puskesmas';
  if (str.includes('klinik') || str.includes('pratama') || str.includes('fktp')) return 'Klinik Pratama';
  if (str.includes('dokter') || str.includes('dr.') || str.includes('mandiri') || str.includes('praktek') || str.includes('praktik')) return 'Dokter Praktek Mandiri';
  if (str.includes('travel') || str.includes('tour') || str.includes('wisata') || str.includes('biro perjalanan') || str.includes('agen perjalanan')) return 'Travel';
  if (str.includes('pendidikan') || str.includes('sekolah') || str.includes('smk') || str.includes('sma') || str.includes('smp') || str.includes('sd') || str.includes('kampus') || str.includes('universitas') || str.includes('akademi') || str.includes('pesantren') || str.includes('politeknik')) return 'Pendidikan';
  if (str.includes('pt') || str.includes('pabrik') || str.includes('industri') || str.includes('perusahaan') || str.includes('corp')) return 'Perusahaan / Pabrik';
  if (str.includes('kelurahan') || str.includes('kecamatan') || str.includes('dinas') || str.includes('instansi') || str.includes('kantor')) return 'Instansi / Kelurahan';
  if (str.includes('posyandu') || str.includes('kader') || str.includes('komunitas') || str.includes('pkk') || str.includes('warga')) return 'Komunitas / Posyandu';

  return 'Lainnya';
}

// Correlate visit records with referral data to compute objective status
export function correlateVisitsWithReferrals(
  visits: MarketingVisitRecord[],
  referrals: CleanReferralRecord[]
): MarketingVisitRecord[] {
  // Aggregate referrals by referrer name & territory
  const referrerCounts: Record<string, number> = {};
  const territoryCounts: Record<string, number> = {};

  for (const r of referrals) {
    if (r.perujukClean) {
      const cleanKey = r.perujukClean.toLowerCase().trim();
      referrerCounts[cleanKey] = (referrerCounts[cleanKey] || 0) + 1;
    }
    if (r.kecamatanPasien) {
      const kecKey = r.kecamatanPasien.toLowerCase().trim();
      territoryCounts[kecKey] = (territoryCounts[kecKey] || 0) + 1;
    }
  }

  return visits.map((v) => {
    const locLower = v.lokasiTujuan.toLowerCase().trim();
    let referralCount = 0;

    // Direct name match or substring match
    for (const [refName, count] of Object.entries(referrerCounts)) {
      if (
        locLower.includes(refName) ||
        refName.includes(locLower) ||
        (locLower.includes('lembursitu') && refName.includes('lembursitu')) ||
        (locLower.includes('baros') && refName.includes('baros')) ||
        (locLower.includes('cikundul') && refName.includes('cikundul')) ||
        (locLower.includes('gunungguruh') && refName.includes('gunungguruh')) ||
        (locLower.includes('tipar') && refName.includes('tipar')) ||
        (locLower.includes('gedongpanjang') && refName.includes('gedongpanjang')) ||
        (locLower.includes('nyalindung') && refName.includes('nyalindung')) ||
        (locLower.includes('citra medika') && refName.includes('citra medika')) ||
        (locLower.includes('cikembar') && refName.includes('cikembar'))
      ) {
        referralCount += count;
      }
    }

    let status: VisitEvaluationStatus = 'Belum Dinilai';
    let tren: MarketingVisitRecord['trenRujukan'] = 'Nihil / Belum Ada';

    if (referralCount >= 15) {
      status = 'Tepat Sasaran';
      tren = 'Meningkat';
    } else if (referralCount >= 5) {
      status = 'Tepat Sasaran';
      tren = 'Stabil';
    } else if (referralCount > 0) {
      status = 'Potensial / Prospek Baru';
      tren = 'Stabil';
    } else {
      // 0 referral recorded
      if (v.jenisSegmen === 'Puskesmas' || v.jenisSegmen === 'Klinik Pratama') {
        status = 'Perlu Dikaji Ulang';
        tren = 'Nihil / Belum Ada';
      } else {
        status = 'Potensial / Prospek Baru';
        tren = 'Nihil / Belum Ada';
      }
    }

    return {
      ...v,
      totalRujukanTercatat: referralCount,
      trenRujukan: tren,
      statusKesesuaian: status,
    };
  });
}

// Auto-suggest best column matching based on list of detected column names
export function autoSuggestColumnMapping(columns: string[]): VisitColumnMapping {
  const findMatch = (candidates: string[]) => {
    // 1. Exact match
    for (const cand of candidates) {
      const normCand = cand.toLowerCase().replace(/[^a-z0-9]/g, '');
      const exact = columns.find((col) => col.toLowerCase().replace(/[^a-z0-9]/g, '') === normCand);
      if (exact) return exact;
    }

    // 2. Contains match
    for (const cand of candidates) {
      const normCand = cand.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (normCand.length < 3) continue;
      const found = columns.find((col) => {
        const normCol = col.toLowerCase().replace(/[^a-z0-9]/g, '');
        return normCol.includes(normCand) || (normCand.length >= 4 && normCand.includes(normCol));
      });
      if (found) return found;
    }
    return '';
  };

  const tanggal = findMatch([
    'tanggal kunjungan', 'tgl kunjungan', 'tglkunjungan', 'tanggal', 'tgl', 'waktu kunjungan', 'waktu', 'date'
  ]);

  const lokasi = findMatch([
    'lokasi tujuan kunjungan', 'lokasi tujuan', 'tujuan kunjungan', 'nama lokasi', 'lokasi',
    'nama faskes', 'faskes tujuan', 'faskes', 'instansi tujuan', 'instansi', 'perujuk', 'nama tempat'
  ]);

  const segmen = findMatch([
    'jenis segmen lokasi yang dikunjungi', 'jenis segmen lokasi', 'jenis segmen', 'segmen lokasi',
    'segmen', 'kategori segmen', 'kategori faskes', 'tipe lokasi', 'jenis lokasi', 'kategori'
  ]);

  const alamat = findMatch([
    'alamat', 'alamat lokasi', 'alamat tujuan', 'wilayah', 'lokasi alamat', 'kecamatan', 'kelurahan', 'domisili'
  ]);

  const maksud = findMatch([
    'maksud kunjungan', 'tujuan kunjungan', 'agenda kunjungan', 'agenda', 'kegiatan', 'maksud',
    'keperluan', 'uraian kegiatan', 'keterangan'
  ]);

  const petugas = findMatch([
    'petugas', 'tim marketing', 'nama petugas', 'pic', 'nama pic', 'tim humas', 'pelaksana'
  ]);

  const catatan = findMatch([
    'catatan hasil', 'hasil kunjungan', 'hasil pertemuan', 'hasil', 'catatan', 'keterangan hasil',
    'tindak lanjut', 'evaluasi', 'respons', 'feedback'
  ]);

  return {
    tanggalCol: tanggal || columns[0] || '',
    lokasiCol: lokasi || (columns.length > 1 ? columns[1] : ''),
    segmenCol: segmen || '__AUTO_DETECT__',
    alamatCol: alamat || (columns.length > 2 ? columns[2] : ''),
    maksudCol: maksud || (columns.length > 3 ? columns[3] : ''),
    petugasCol: petugas || '',
    catatanCol: catatan || '',
  };
}

// Find header row index in raw 2D array by scanning first 10 rows
export function detectHeaderRowIndex(rawRows2D: any[][]): number {
  if (!rawRows2D || rawRows2D.length === 0) return 0;

  const headerKeywords = [
    'tanggal', 'tgl', 'date', 'waktu',
    'lokasi', 'tujuan', 'faskes', 'instansi', 'nama',
    'segmen', 'kategori', 'tipe', 'jenis',
    'alamat', 'wilayah', 'kecamatan',
    'maksud', 'agenda', 'kegiatan', 'keperluan',
    'petugas', 'pic', 'marketing', 'tim',
    'hasil', 'catatan', 'keterangan', 'tindak', 'no'
  ];

  let bestRowIndex = 0;
  let maxScore = -1;

  const scanLimit = Math.min(10, rawRows2D.length);
  for (let r = 0; r < scanLimit; r++) {
    const row = rawRows2D[r];
    if (!Array.isArray(row)) continue;

    let score = 0;
    let nonBlankCount = 0;

    for (const cell of row) {
      if (cell !== undefined && cell !== null && String(cell).trim() !== '') {
        nonBlankCount++;
        const str = String(cell).toLowerCase().trim();
        for (const kw of headerKeywords) {
          if (str.includes(kw)) {
            score += 2;
            break;
          }
        }
      }
    }

    // Give bonus to rows with multiple non-blank text cells
    score += nonBlankCount;

    if (score > maxScore) {
      maxScore = score;
      bestRowIndex = r;
    }
  }

  return bestRowIndex;
}

// Extract available column names from 2D row
export function extractColumnsFromHeaderRow(headerRow: any[] = []): string[] {
  const result: string[] = [];
  const counts: Record<string, number> = {};

  for (let i = 0; i < headerRow.length; i++) {
    const val = headerRow[i];
    let name = val !== undefined && val !== null ? String(val).trim() : '';
    if (!name) {
      const colLetter = String.fromCharCode(65 + (i % 26));
      name = `Kolom ${i >= 26 ? `${Math.floor(i / 26)}${colLetter}` : colLetter}`;
    }

    // Deduplicate
    if (counts[name]) {
      counts[name]++;
      result.push(`${name} (${counts[name]})`);
    } else {
      counts[name] = 1;
      result.push(name);
    }
  }

  return result;
}

// Inspect workbook without immediately parsing to let user configure mapping
export async function inspectMarketingVisitWorkbook(file: File): Promise<InspectedWorkbookInfo> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

  const sheetNames = workbook.SheetNames;
  if (!sheetNames || sheetNames.length === 0) {
    throw new Error('Berkas Excel tidak memiliki lembar kerja (sheet).');
  }

  // Find preferred sheet
  let activeSheet = sheetNames[0];
  const visitMatch = sheetNames.find((name) => {
    const l = name.toLowerCase();
    return l.includes('kunjungan') || l.includes('marketing') || l.includes('visit') || l.includes('sheet1');
  });
  if (visitMatch) activeSheet = visitMatch;

  const worksheet = workbook.Sheets[activeSheet];
  const rawRows2D: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  const headerRowIndex = detectHeaderRowIndex(rawRows2D);
  const headerRow = rawRows2D[headerRowIndex] || [];
  const availableColumns = extractColumnsFromHeaderRow(headerRow);
  const suggestedMapping = autoSuggestColumnMapping(availableColumns);

  return {
    workbook,
    sheetNames,
    activeSheet,
    headerRowIndex,
    availableColumns,
    rawRows2D,
    suggestedMapping,
  };
}

// Switch active sheet and get its 2D rows & columns
export function getSheetInspectionData(
  workbook: XLSX.WorkBook,
  sheetName: string,
  preferredHeaderRowIndex?: number
): {
  headerRowIndex: number;
  availableColumns: string[];
  rawRows2D: any[][];
  suggestedMapping: VisitColumnMapping;
} {
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new Error(`Lembar kerja "${sheetName}" tidak ditemukan.`);
  }

  const rawRows2D: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  const headerRowIndex = preferredHeaderRowIndex !== undefined 
    ? preferredHeaderRowIndex 
    : detectHeaderRowIndex(rawRows2D);

  const headerRow = rawRows2D[headerRowIndex] || [];
  const availableColumns = extractColumnsFromHeaderRow(headerRow);
  const suggestedMapping = autoSuggestColumnMapping(availableColumns);

  return {
    headerRowIndex,
    availableColumns,
    rawRows2D,
    suggestedMapping,
  };
}

// Transform 2D rows using explicit column mapping chosen by user
export function transform2DRowsWithMapping(
  rawRows2D: any[][],
  headerRowIndex: number,
  availableColumns: string[],
  mapping: VisitColumnMapping,
  referrals: CleanReferralRecord[] = []
): MarketingVisitRecord[] {
  const records: MarketingVisitRecord[] = [];

  // Map column name to column index
  const getColIndex = (colName?: string): number => {
    if (!colName || colName === '__AUTO_DETECT__' || colName === '__EMPTY__') return -1;
    return availableColumns.indexOf(colName);
  };

  const idxTanggal = getColIndex(mapping.tanggalCol);
  const idxLokasi = getColIndex(mapping.lokasiCol);
  const idxSegmen = getColIndex(mapping.segmenCol);
  const idxAlamat = getColIndex(mapping.alamatCol);
  const idxMaksud = getColIndex(mapping.maksudCol);
  const idxPetugas = getColIndex(mapping.petugasCol);
  const idxCatatan = getColIndex(mapping.catatanCol);

  const dataRows = rawRows2D.slice(headerRowIndex + 1);

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    if (!Array.isArray(row) || row.length === 0) continue;

    // Check if entire row is empty
    const hasAnyValue = row.some((c) => c !== undefined && c !== null && String(c).trim() !== '');
    if (!hasAnyValue) continue;

    const rawTanggal = idxTanggal >= 0 ? row[idxTanggal] : '';
    const rawLokasi = idxLokasi >= 0 ? row[idxLokasi] : '';
    const rawSegmen = idxSegmen >= 0 ? row[idxSegmen] : '';
    const rawAlamat = idxAlamat >= 0 ? row[idxAlamat] : '';
    const rawMaksud = idxMaksud >= 0 ? row[idxMaksud] : '';
    const rawPetugas = idxPetugas >= 0 ? row[idxPetugas] : '';
    const rawCatatan = idxCatatan >= 0 ? row[idxCatatan] : '';

    // Ignore row if both location and purpose/date are empty
    if (!rawLokasi && !rawMaksud && !rawTanggal) continue;

    const dateInfo = parseDate(rawTanggal);
    const terr = normalizeTerritory(rawAlamat || rawLokasi);
    const segmen = normalizeSegmentType(rawSegmen || rawLokasi);

    records.push({
      id: `mvisit-mapped-${i + 1}-${Date.now() % 100000}`,
      tanggalKunjungan: dateInfo.isoDate || (rawTanggal ? String(rawTanggal).trim() : new Date().toISOString().split('T')[0]),
      lokasiTujuan: rawLokasi ? String(rawLokasi).trim() : 'Lokasi Tidak Tercatat',
      jenisSegmen: segmen,
      alamat: rawAlamat ? String(rawAlamat).trim() : terr.wilayahNormal,
      wilayah: terr.kecamatan && terr.kecamatan !== 'Tidak teridentifikasi' ? `${terr.kecamatan} (${terr.kotaKab})` : terr.wilayahNormal,
      maksudKunjungan: rawMaksud ? String(rawMaksud).trim() : 'Kunjungan Lapangan & Edukasi Pelayanan',
      petugas: rawPetugas ? String(rawPetugas).trim() : 'Tim Marketing & Humas RSUD Al-Mulk',
      catatanHasil: rawCatatan ? String(rawCatatan).trim() : '',
    });
  }

  return correlateVisitsWithReferrals(records, referrals);
}

// Generate high-fidelity realistic marketing visit logs for RSUD Al-Mulk (2025 - 2026)
export function generateAlMulkMarketingVisits(referrals: CleanReferralRecord[] = []): MarketingVisitRecord[] {
  const sampleVisits: Record<string, any>[] = [
    {
      'tanggal kunjungan': '2025-10-12',
      'lokasi tujuan kunjungan': 'Puskesmas Lembursitu',
      'jenis segmen lokasi yang dikunjungi': 'Puskesmas',
      'alamat': 'Jl. Pelabuhan II KM 6.5, Lembursitu, Kota Sukabumi',
      'maksud kunjungan': 'Koordinasi alur rujukan Program Rujuk Balik (PRB) Penyakit Dalam & kuota bridging antrean Mobile JKN',
      'petugas': 'Rina S., S.KM (Humas) & dr. Aris',
      'catatan hasil': 'Dokter faskes primer menyambut baik, meminta sosialisasi jadwal dokter spesialis penyakit dalam terkini.',
    },
    {
      'tanggal kunjungan': '2025-10-25',
      'lokasi tujuan kunjungan': 'Puskesmas Baros',
      'jenis segmen lokasi yang dikunjungi': 'Puskesmas',
      'alamat': 'Jl. Raya Baros No. 12, Baros, Kota Sukabumi',
      'maksud kunjungan': 'Penyelarasan rujukan kasus Bedah Umum & Obstetri Ginekologi berisiko tinggi',
      'petugas': 'Tim Pemasaran RSUD Al-Mulk',
      'catatan hasil': 'Bidan desa dan dokter umum meminta kepastian respon cepat ambulans rujukan maternal.',
    },
    {
      'tanggal kunjungan': '2025-11-08',
      'lokasi tujuan kunjungan': 'Puskesmas Gunungguruh (Kab. Sukabumi)',
      'jenis segmen lokasi yang dikunjungi': 'Puskesmas',
      'alamat': 'Jl. Pelabuhan II KM 8, Kec. Gunungguruh, Kab. Sukabumi',
      'maksud kunjungan': 'Edukasi kedekatan akses RSUD Al-Mulk bagi warga perbatasan Kabupaten Sukabumi',
      'petugas': 'Tim Kemitraan Eksternal',
      'catatan hasil': 'Masyarakat sering bingung beda RSUD Bunut dan RSUD Al-Mulk; disepakati pemasangan standing banner edukasi faskes di loket PKM.',
    },
    {
      'tanggal kunjungan': '2025-11-20',
      'lokasi tujuan kunjungan': 'Klinik Pratama Citra Medika',
      'jenis segmen lokasi yang dikunjungi': 'Klinik Pratama',
      'alamat': 'Jl. Pelabuhan II KM 5, Lembursitu, Kota Sukabumi',
      'maksud kunjungan': 'Sosialisasi ketersediaan poli saraf & fisioterapi pasca-stroke bagi pasien rujukan klinik',
      'petugas': 'Subbag Humas & Pemasaran',
      'catatan hasil': 'Klinik menyepakati transfer rujukan pasien kronis hipertensi dengan kecurigaan neuropati.',
    },
    {
      'tanggal kunjungan': '2025-12-05',
      'lokasi tujuan kunjungan': 'Puskesmas Cikundul',
      'jenis segmen lokasi yang dikunjungi': 'Puskesmas',
      'alamat': 'Jl. Merdeka Cikundul, Lembursitu, Kota Sukabumi',
      'maksud kunjungan': 'Advokasi program pemeriksaan kehamilan USG & pelayanan rawat inap anak',
      'petugas': 'Tim Marketing & Pelayanan Medis',
      'catatan hasil': 'Puskesmas meminta jadwal pasti poli obsgyn agar tidak bentrok dengan jadwal USG keliling posyandu.',
    },
    {
      'tanggal kunjungan': '2025-12-18',
      'lokasi tujuan kunjungan': 'PT Glostar Indonesia (GSI) Cikembar',
      'jenis segmen lokasi yang dikunjungi': 'Perusahaan / Pabrik',
      'alamat': 'Jl. Pelabuhan II Cikembar, Kab. Sukabumi',
      'maksud kunjungan': 'Penjajakan kerjasama Trauma Center, MCU Karyawan & Penanganan Kecelakaan Kerja BPJS TK',
      'petugas': 'Kaur Kerjasama & Pemasaran',
      'catatan hasil': 'Perusahaan memiliki > 15.000 karyawan. Membutuhkan koordinasi lanjutan dengan manajemen HRD pusat.',
    },
    {
      'tanggal kunjungan': '2026-01-14',
      'lokasi tujuan kunjungan': 'Puskesmas Nyalindung (Kab. Sukabumi)',
      'jenis segmen lokasi yang dikunjungi': 'Puskesmas',
      'alamat': 'Jl. Raya Nyalindung KM 10, Kab. Sukabumi',
      'maksud kunjungan': 'Evaluasi kendala geografis rujukan pasien Sukabumi Selatan menuju Jl. Pelabuhan II KM 6',
      'petugas': 'Tim Humas RSUD Al-Mulk',
      'catatan hasil': 'Akses tercepat warga Nyalindung adalah RSUD Al-Mulk, tetapi kuota rujukan bridging BPJS sering penuh di faskes tingkat lanjut.',
    },
    {
      'tanggal kunjungan': '2026-01-26',
      'lokasi tujuan kunjungan': 'Praktek Mandiri dr. H. Ridwan',
      'jenis segmen lokasi yang dikunjungi': 'Dokter Praktek Mandiri',
      'alamat': 'Sindangsari, Lembursitu, Kota Sukabumi',
      'maksud kunjungan': 'Silaturahmi kemitraan dokter praktik swasta & kemudahan konsultasi telemedicine rujukan',
      'petugas': 'Tim Kerjasama Medis',
      'catatan hasil': 'Dokter siap merujuk pasien lansia dengan komplikasi diabetes & hipertensi.',
    },
    {
      'tanggal kunjungan': '2026-02-09',
      'lokasi tujuan kunjungan': 'Kelurahan Lembursitu & Kader Posyandu',
      'jenis segmen lokasi yang dikunjungi': 'Komunitas / Posyandu',
      'alamat': 'Jl. Pelabuhan II, Kec. Lembursitu, Kota Sukabumi',
      'maksud kunjungan': 'Sosialisasi program Gratis Pelayanan Kesehatan ber-KTP Kota Sukabumi di RSUD Al-Mulk',
      'petugas': 'Tim Promkes & Humas',
      'catatan hasil': 'Kader posyandu antusias menyampaikan info rawat inap dan IGD gratis kepada warga ber-KTP Kota.',
    },
    {
      'tanggal kunjungan': '2026-02-22',
      'lokasi tujuan kunjungan': 'Puskesmas Benteng',
      'jenis segmen lokasi yang dikunjungi': 'Puskesmas',
      'alamat': 'Jl. Benteng No. 19, Warudoyong, Kota Sukabumi',
      'maksud kunjungan': 'Sosialisasi ketersediaan kamar rawat inap bedah & ruang perinatologi',
      'petugas': 'Tim Pemasaran RSUD Al-Mulk',
      'catatan hasil': 'PKM Benteng lebih dekat ke RSUD Syamsudin SH (Bunut), butuh program pembeda seperti kemudahan antrean di Al-Mulk.',
    },
    {
      'tanggal kunjungan': '2026-03-05',
      'lokasi tujuan kunjungan': 'Klinik Pratama Baros Medika Sehat',
      'jenis segmen lokasi yang dikunjungi': 'Klinik Pratama',
      'alamat': 'Jl. Baros No. 88, Baros, Kota Sukabumi',
      'maksud kunjungan': 'Promosi fasilitas laboratorium & radiologi canggih bagi rujukan rawat jalan',
      'petugas': 'Tim Humas & Promosi',
      'catatan hasil': 'Disepakati pembuatan grup WhatsApp koordinasi rujukan cepat antara dokter jaga klinik dan IGD Al-Mulk.',
    },
    {
      'tanggal kunjungan': '2026-03-18',
      'lokasi tujuan kunjungan': 'Kantor Kecamatan Gunungguruh',
      'jenis segmen lokasi yang dikunjungi': 'Instansi / Kelurahan',
      'alamat': 'Kec. Gunungguruh, Kab. Sukabumi',
      'maksud kunjungan': 'Sosialisasi keberadaan RSUD Al-Mulk sebagai RSUD terdekat bagi warga Gunungguruh',
      'petugas': 'Subbag Humas & Pemasaran',
      'catatan hasil': 'Pihak kecamatan mengizinkan penempatan brosur di ruang pelayanan terpadu kecamatan.',
    },
    {
      'tanggal kunjungan': '2026-03-24',
      'lokasi tujuan kunjungan': 'SMK Kesehatan Citra Madani Sukabumi',
      'jenis segmen lokasi yang dikunjungi': 'Pendidikan',
      'alamat': 'Jl. Pelabuhan II, Lembursitu, Kota Sukabumi',
      'maksud kunjungan': 'Edukasi kesehatan remaja, sosialisasi program skrining UKS, kemitraan PKL siswa, dan promosi RSUD Al-Mulk',
      'petugas': 'Tim Promkes & Marketing RSUD Al-Mulk',
      'catatan hasil': 'Pihak sekolah antusias menjalin MoU skrining berkala dan penyuluhan gizi bagi 350 siswa.',
    },
    {
      'tanggal kunjungan': '2026-03-28',
      'lokasi tujuan kunjungan': 'Biro Perjalanan & Travel Sukabumi Trans Wisata',
      'jenis segmen lokasi yang dikunjungi': 'Travel',
      'alamat': 'Jl. Raya Cisaat, Sukabumi',
      'maksud kunjungan': 'Sosialisasi kesiapsiagaan layanan IGD 24 Jam Trauma Center & penawaran paket MCU supir/crew angkutan wisata',
      'petugas': 'Kaur Kemitraan Eksternal',
      'catatan hasil': 'Pengelola menyambut baik kemitraan penanganan emergency kecelakaan wisata dan pemeriksaan kesehatan berkala driver.',
    },
  ];

  const cols = [
    'tanggal kunjungan', 'lokasi tujuan kunjungan', 'jenis segmen lokasi yang dikunjungi',
    'alamat', 'maksud kunjungan', 'petugas', 'catatan hasil'
  ];

  const rows2D = [
    cols,
    ...sampleVisits.map((v) => cols.map((c) => v[c]))
  ];

  const mapping: VisitColumnMapping = {
    tanggalCol: 'tanggal kunjungan',
    lokasiCol: 'lokasi tujuan kunjungan',
    segmenCol: 'jenis segmen lokasi yang dikunjungi',
    alamatCol: 'alamat',
    maksudCol: 'maksud kunjungan',
    petugasCol: 'petugas',
    catatanCol: 'catatan hasil',
  };

  return transform2DRowsWithMapping(rows2D, 0, cols, mapping, referrals);
}
