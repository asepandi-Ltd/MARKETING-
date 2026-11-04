export type PaymentCategory = 'BPJS' | 'Umum/Tunai';

export type ReferrerCategory = 'Internal' | 'Eksternal' | 'Belum Diketahui';

export type AgeGroup =
  | '< 1 tahun'
  | '1–4 tahun'
  | '5–14 tahun'
  | '15–24 tahun'
  | '25–44 tahun'
  | '45–59 tahun'
  | '60 tahun atau lebih'
  | 'Tidak diketahui/tidak valid';

export interface CleanReferralRecord {
  id: string;
  tanggalMasuk: string; // YYYY-MM-DD
  bulan: string; // YYYY-MM
  tahun: number;
  hariNama: string; // Senin, Selasa, dll
  hariIndex: number; // 0-6

  // Referrer
  perujukRaw: string;
  perujukClean: string;
  kategoriPerujuk: ReferrerCategory;
  alamatPerujukRaw: string;
  wilayahPerujuk: string;
  kotaKabPerujuk: 'Kota Sukabumi' | 'Kabupaten Sukabumi' | 'Luar Sukabumi' | 'Perlu verifikasi';

  // Payment
  noRujukanRaw: string;
  kategoriPembayaran: PaymentCategory;

  // Patient Geography (Aggregated only - NO full address)
  alamatPasienRaw: string;
  kelurahanPasien: string;
  kecamatanPasien: string;
  kotaKabPasien: 'Kota Sukabumi' | 'Kabupaten Sukabumi' | 'Luar Sukabumi' | 'Perlu verifikasi';
  wilayahPasienNormal: string; // e.g. "Lembursitu, Kota Sukabumi"

  // Patient Demographics (Aggregated only - NO PII)
  umurRaw: string;
  umurTahun: number | null;
  kelompokUsia: AgeGroup;

  // Clinical Target
  poliTujuan: string;
  diagnosaAwal: string;
  kodeIcd: string;
}

export interface FilterState {
  startDate: string;
  endDate: string;
  kategoriPerujuk: 'ALL' | ReferrerCategory;
  namaPerujuk: string;
  wilayahPasien: string;
  kotaKabPasien: 'ALL' | 'Kota Sukabumi' | 'Kabupaten Sukabumi' | 'Luar Sukabumi' | 'Perlu verifikasi';
  wilayahPerujuk: string;
  kelompokUsia: 'ALL' | AgeGroup;
  poliTujuan: string;
  diagnosaAwal: string;
  kategoriPembayaran: 'ALL' | PaymentCategory;
}

export interface DashboardKpiSummary {
  totalRekaman: number;
  internalCount: number;
  internalPct: number;
  eksternalCount: number;
  eksternalPct: number;
  bpjsCount: number;
  bpjsPct: number;
  umumCount: number;
  umumPct: number;
  uniqueWilayahPasienCount: number;
  uniquePerujukEksternalCount: number;
  topPoli: { nama: string; count: number; pct: number };
  topUsia: { kelompok: AgeGroup; count: number; pct: number };
  topDiagnosa: { nama: string; count: number; pct: number };
  minDate: string;
  maxDate: string;
  isPartialMonth: boolean;
  invalidDateCount: number;
}
