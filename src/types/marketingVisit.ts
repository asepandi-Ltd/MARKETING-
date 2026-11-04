export type SegmentType = 
  | 'Puskesmas'
  | 'Klinik Pratama'
  | 'Dokter Praktek Mandiri'
  | 'Perusahaan / Pabrik'
  | 'Instansi / Kelurahan'
  | 'Komunitas / Posyandu'
  | 'Travel'
  | 'Pendidikan'
  | 'Lainnya';

export type VisitEvaluationStatus = 
  | 'Tepat Sasaran'
  | 'Perlu Dikaji Ulang'
  | 'Potensial / Prospek Baru'
  | 'Belum Dinilai';

export interface MarketingVisitRecord {
  id: string;
  tanggalKunjungan: string; // YYYY-MM-DD
  lokasiTujuan: string;
  jenisSegmen: SegmentType;
  alamat: string;
  wilayah: string;
  maksudKunjungan: string;
  petugas?: string;
  catatanHasil?: string;
  statusKesesuaian?: VisitEvaluationStatus;
  // Cross-reference metrics with referral data
  totalRujukanTercatat?: number;
  trenRujukan?: 'Meningkat' | 'Stabil' | 'Menurun' | 'Nihil / Belum Ada';
}

export interface MarketingVisitAuditSummary {
  totalKunjungan: number;
  kunjunganTepatSasaran: number;
  kunjunganPerluKajiUlang: number;
  kunjunganPotensial: number;
  faskesUnikDikunjungi: number;
  segmenCounts: Record<SegmentType, number>;
  wilayahCounts: Record<string, number>;
  korelasiRujukanTinggi: string[];
  korelasiRujukanRendah: string[];
  peluangBelumDikunjungi: string[];
}
