export interface SubDistrictInfo {
  nama: string;
  kotaKab: 'Kota Sukabumi' | 'Kabupaten Sukabumi';
  ringJarak: 'Ring 1 (< 5 km)' | 'Ring 2 (5-15 km)' | 'Ring 3 (> 15 km)';
  estimasiJarakKm: number;
  deskripsi: string;
  prioritasPemasaran: 'Tinggi (Zona Inti)' | 'Sedang (Ekspansi)' | 'Potensial (Evaluasi)';
}

export const RSUD_AL_MULK_INFO = {
  nama: 'RSUD Al-Mulk Kota Sukabumi',
  alamat: 'Jalan Pelabuhan II KM 6, Kec. Lembursitu, Kota Sukabumi',
  tipe: 'Rumah Sakit Umum Daerah Kelas D',
  koordinat: [-6.9536, 106.9142], // Lembursitu
  layananUnggulan: ['Poli Penyakit Dalam', 'Poli Anak', 'Poli Bedah', 'Poli Kebidanan & Kandungan', 'Poli Saraf', 'IGD 24 Jam']
};

export const SUKABUMI_DISTRICTS: Record<string, SubDistrictInfo> = {
  'Lembursitu': {
    nama: 'Lembursitu',
    kotaKab: 'Kota Sukabumi',
    ringJarak: 'Ring 1 (< 5 km)',
    estimasiJarakKm: 0.5,
    deskripsi: 'Lokasi RSUD Al-Mulk, zona basis primer pasien Kota Sukabumi Selatan.',
    prioritasPemasaran: 'Tinggi (Zona Inti)'
  },
  'Baros': {
    nama: 'Baros',
    kotaKab: 'Kota Sukabumi',
    ringJarak: 'Ring 1 (< 5 km)',
    estimasiJarakKm: 3.2,
    deskripsi: 'Berbatasan langsung di koridor Jalan Pelabuhan II / Jalur Lingkar Selatan.',
    prioritasPemasaran: 'Tinggi (Zona Inti)'
  },
  'Citamiang': {
    nama: 'Citamiang',
    kotaKab: 'Kota Sukabumi',
    ringJarak: 'Ring 2 (5-15 km)',
    estimasiJarakKm: 5.5,
    deskripsi: 'Wilayah padat penduduk tengah kota, aksesibilitas lancar ke Jl. Pelabuhan II.',
    prioritasPemasaran: 'Tinggi (Zona Inti)'
  },
  'Warudoyong': {
    nama: 'Warudoyong',
    kotaKab: 'Kota Sukabumi',
    ringJarak: 'Ring 2 (5-15 km)',
    estimasiJarakKm: 6.0,
    deskripsi: 'Kawasan pemukiman dan perdagangan sentral Kota Sukabumi.',
    prioritasPemasaran: 'Sedang (Ekspansi)'
  },
  'Gunungpuyuh': {
    nama: 'Gunungpuyuh',
    kotaKab: 'Kota Sukabumi',
    ringJarak: 'Ring 2 (5-15 km)',
    estimasiJarakKm: 7.5,
    deskripsi: 'Wilayah barat laut Kota Sukabumi, kompetisi dengan faskes pusat.',
    prioritasPemasaran: 'Sedang (Ekspansi)'
  },
  'Cikole': {
    nama: 'Cikole',
    kotaKab: 'Kota Sukabumi',
    ringJarak: 'Ring 2 (5-15 km)',
    estimasiJarakKm: 7.8,
    deskripsi: 'Pusat pemerintahan dan RS Rujukan Utama (RSUD Syamsudin SH / Bunut).',
    prioritasPemasaran: 'Sedang (Ekspansi)'
  },
  'Cibeureum': {
    nama: 'Cibeureum',
    kotaKab: 'Kota Sukabumi',
    ringJarak: 'Ring 2 (5-15 km)',
    estimasiJarakKm: 6.8,
    deskripsi: 'Kawasan timur Kota Sukabumi, terkoneksi via Jalur Lingkar Selatan Sukabumi.',
    prioritasPemasaran: 'Sedang (Ekspansi)'
  },

  // Kabupaten Sukabumi - Bordering / Strategic Corridor
  'Gunungguruh': {
    nama: 'Gunungguruh',
    kotaKab: 'Kabupaten Sukabumi',
    ringJarak: 'Ring 1 (< 5 km)',
    estimasiJarakKm: 4.5,
    deskripsi: 'Kecamatan Kabupaten Sukabumi yang menempel langsung dengan Lembursitu.',
    prioritasPemasaran: 'Tinggi (Zona Inti)'
  },
  'Nyalindung': {
    nama: 'Nyalindung',
    kotaKab: 'Kabupaten Sukabumi',
    ringJarak: 'Ring 2 (5-15 km)',
    estimasiJarakKm: 12.0,
    deskripsi: 'Akses langsung jalur Jl. Pelabuhan II ke arah Sukabumi Selatan (Jampang). Faskes terbatas.',
    prioritasPemasaran: 'Potensial (Evaluasi)'
  },
  'Cikembar': {
    nama: 'Cikembar',
    kotaKab: 'Kabupaten Sukabumi',
    ringJarak: 'Ring 2 (5-15 km)',
    estimasiJarakKm: 14.5,
    deskripsi: 'Kawasan industri pabrik & padat pekerja. Berpotensi untuk rujukan rawat jalan/bedah.',
    prioritasPemasaran: 'Potensial (Evaluasi)'
  },
  'Cisaat': {
    nama: 'Cisaat',
    kotaKab: 'Kabupaten Sukabumi',
    ringJarak: 'Ring 2 (5-15 km)',
    estimasiJarakKm: 8.5,
    deskripsi: 'Kawasan satelit utara terpadat Kabupaten Sukabumi.',
    prioritasPemasaran: 'Sedang (Ekspansi)'
  },
  'Sukaraja': {
    nama: 'Sukaraja',
    kotaKab: 'Kabupaten Sukabumi',
    ringJarak: 'Ring 2 (5-15 km)',
    estimasiJarakKm: 8.2,
    deskripsi: 'Kawasan timur perbatasan Kota/Kabupaten Sukabumi.',
    prioritasPemasaran: 'Sedang (Ekspansi)'
  },
  'Kebonpedes': {
    nama: 'Kebonpedes',
    kotaKab: 'Kabupaten Sukabumi',
    ringJarak: 'Ring 2 (5-15 km)',
    estimasiJarakKm: 9.0,
    deskripsi: 'Kawasan agraris timur berdekatan dengan Cibeureum dan Baros.',
    prioritasPemasaran: 'Potensial (Evaluasi)'
  },
  'Jampangtengah': {
    nama: 'Jampangtengah',
    kotaKab: 'Kabupaten Sukabumi',
    ringJarak: 'Ring 3 (> 15 km)',
    estimasiJarakKm: 24.0,
    deskripsi: 'Wilayah selatan dengan RSUD terdekat adalah RSUD Al-Mulk via Jalan Pelabuhan II.',
    prioritasPemasaran: 'Potensial (Evaluasi)'
  }
};

// Normalization lookup mapping table
export const TERRITORY_NORMALIZATION_MAP: Record<string, { standardKecamatan: string; kotaKab: 'Kota Sukabumi' | 'Kabupaten Sukabumi' | 'Luar Sukabumi' }> = {
  // Lembursitu & Kelurahannya (Sindangsari, Cikundul, Lembursitu, Cipanengah)
  'lembursitu': { standardKecamatan: 'Lembursitu', kotaKab: 'Kota Sukabumi' },
  'lembur situ': { standardKecamatan: 'Lembursitu', kotaKab: 'Kota Sukabumi' },
  'lbrsitu': { standardKecamatan: 'Lembursitu', kotaKab: 'Kota Sukabumi' },
  'cikundul': { standardKecamatan: 'Lembursitu', kotaKab: 'Kota Sukabumi' },
  'sindangsari': { standardKecamatan: 'Lembursitu', kotaKab: 'Kota Sukabumi' },
  'cipanengah': { standardKecamatan: 'Lembursitu', kotaKab: 'Kota Sukabumi' },
  'pelabuhan ii': { standardKecamatan: 'Lembursitu', kotaKab: 'Kota Sukabumi' },
  'jl pelabuhan': { standardKecamatan: 'Lembursitu', kotaKab: 'Kota Sukabumi' },
  'jl. pelabuhan': { standardKecamatan: 'Lembursitu', kotaKab: 'Kota Sukabumi' },

  // Baros & Kelurahannya (Baros, Jayaraksa, Jayamekar)
  'baros': { standardKecamatan: 'Baros', kotaKab: 'Kota Sukabumi' },
  'jayaraksa': { standardKecamatan: 'Baros', kotaKab: 'Kota Sukabumi' },
  'jayamekar': { standardKecamatan: 'Baros', kotaKab: 'Kota Sukabumi' },

  // Citamiang & Kelurahannya (Gedongpanjang, Citamiang, Cikondang, Tipar, Nanggeleng)
  'citamiang': { standardKecamatan: 'Citamiang', kotaKab: 'Kota Sukabumi' },
  'gedongpanjang': { standardKecamatan: 'Citamiang', kotaKab: 'Kota Sukabumi' },
  'gedong panjang': { standardKecamatan: 'Citamiang', kotaKab: 'Kota Sukabumi' },
  'cikondang': { standardKecamatan: 'Citamiang', kotaKab: 'Kota Sukabumi' },
  'tipar': { standardKecamatan: 'Citamiang', kotaKab: 'Kota Sukabumi' },
  'nanggeleng': { standardKecamatan: 'Citamiang', kotaKab: 'Kota Sukabumi' },

  // Warudoyong & Kelurahannya (Warudoyong, Nyomplong, Sukakarya, Benteng, Dayeuhluhur)
  'warudoyong': { standardKecamatan: 'Warudoyong', kotaKab: 'Kota Sukabumi' },
  'waru doyong': { standardKecamatan: 'Warudoyong', kotaKab: 'Kota Sukabumi' },
  'nyomplong': { standardKecamatan: 'Warudoyong', kotaKab: 'Kota Sukabumi' },
  'sukakarya': { standardKecamatan: 'Warudoyong', kotaKab: 'Kota Sukabumi' },
  'benteng': { standardKecamatan: 'Warudoyong', kotaKab: 'Kota Sukabumi' },
  'dayeuhluhur': { standardKecamatan: 'Warudoyong', kotaKab: 'Kota Sukabumi' },

  // Cikole & Kelurahannya (Cikole, Selabatu, Subangjaya, Cisarua, Kebonjati)
  'cikole': { standardKecamatan: 'Cikole', kotaKab: 'Kota Sukabumi' },
  'selabatu': { standardKecamatan: 'Cikole', kotaKab: 'Kota Sukabumi' },
  'subangjaya': { standardKecamatan: 'Cikole', kotaKab: 'Kota Sukabumi' },
  'subang jaya': { standardKecamatan: 'Cikole', kotaKab: 'Kota Sukabumi' },
  'cisarua': { standardKecamatan: 'Cikole', kotaKab: 'Kota Sukabumi' },
  'kebonjati': { standardKecamatan: 'Cikole', kotaKab: 'Kota Sukabumi' },

  // Gunungpuyuh & Kelurahannya (Gunungpuyuh, Sriwidari, Karangtengah, Karamat)
  'gunungpuyuh': { standardKecamatan: 'Gunungpuyuh', kotaKab: 'Kota Sukabumi' },
  'gunung puyuh': { standardKecamatan: 'Gunungpuyuh', kotaKab: 'Kota Sukabumi' },
  'gn puyuh': { standardKecamatan: 'Gunungpuyuh', kotaKab: 'Kota Sukabumi' },
  'sriwidari': { standardKecamatan: 'Gunungpuyuh', kotaKab: 'Kota Sukabumi' },
  'karangtengah': { standardKecamatan: 'Gunungpuyuh', kotaKab: 'Kota Sukabumi' },
  'karamat': { standardKecamatan: 'Gunungpuyuh', kotaKab: 'Kota Sukabumi' },

  // Cibeureum & Kelurahannya (Cibeureum Hilir, Babakan, Limusnunggal, Sindangpalay)
  'cibeureum': { standardKecamatan: 'Cibeureum', kotaKab: 'Kota Sukabumi' },
  'cibeureum hilir': { standardKecamatan: 'Cibeureum', kotaKab: 'Kota Sukabumi' },
  'limusnunggal': { standardKecamatan: 'Cibeureum', kotaKab: 'Kota Sukabumi' },
  'babakan': { standardKecamatan: 'Cibeureum', kotaKab: 'Kota Sukabumi' },
  'sindangpalay': { standardKecamatan: 'Cibeureum', kotaKab: 'Kota Sukabumi' },

  // Kabupaten Sukabumi
  'gunungguruh': { standardKecamatan: 'Gunungguruh', kotaKab: 'Kabupaten Sukabumi' },
  'gunung guruh': { standardKecamatan: 'Gunungguruh', kotaKab: 'Kabupaten Sukabumi' },
  'cibolang': { standardKecamatan: 'Gunungguruh', kotaKab: 'Kabupaten Sukabumi' },
  'nyalindung': { standardKecamatan: 'Nyalindung', kotaKab: 'Kabupaten Sukabumi' },
  'sukamaju': { standardKecamatan: 'Nyalindung', kotaKab: 'Kabupaten Sukabumi' },
  'cikembar': { standardKecamatan: 'Cikembar', kotaKab: 'Kabupaten Sukabumi' },
  'cisaat': { standardKecamatan: 'Cisaat', kotaKab: 'Kabupaten Sukabumi' },
  'sukaraja': { standardKecamatan: 'Sukaraja', kotaKab: 'Kabupaten Sukabumi' },
  'kebonpedes': { standardKecamatan: 'Kebonpedes', kotaKab: 'Kabupaten Sukabumi' },
  'kebon pedes': { standardKecamatan: 'Kebonpedes', kotaKab: 'Kabupaten Sukabumi' },
  'jampangtengah': { standardKecamatan: 'Jampangtengah', kotaKab: 'Kabupaten Sukabumi' },
  'jampang tengah': { standardKecamatan: 'Jampangtengah', kotaKab: 'Kabupaten Sukabumi' },
  'sukalarang': { standardKecamatan: 'Sukalarang', kotaKab: 'Kabupaten Sukabumi' },
  'parungkuda': { standardKecamatan: 'Parungkuda', kotaKab: 'Kabupaten Sukabumi' },
  'cibadak': { standardKecamatan: 'Cibadak', kotaKab: 'Kabupaten Sukabumi' },
  'cicurug': { standardKecamatan: 'Cicurug', kotaKab: 'Kabupaten Sukabumi' },
  'simpenan': { standardKecamatan: 'Simpenan', kotaKab: 'Kabupaten Sukabumi' },
  'pelabuhanratu': { standardKecamatan: 'Pelabuhanratu', kotaKab: 'Kabupaten Sukabumi' },
  'palabuhanratu': { standardKecamatan: 'Pelabuhanratu', kotaKab: 'Kabupaten Sukabumi' },
};

export function normalizeTerritory(rawText: string | undefined | null): {
  wilayahNormal: string;
  kecamatan: string;
  kotaKab: 'Kota Sukabumi' | 'Kabupaten Sukabumi' | 'Luar Sukabumi' | 'Perlu verifikasi';
} {
  if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
    return {
      wilayahNormal: 'Perlu verifikasi',
      kecamatan: 'Tidak teridentifikasi',
      kotaKab: 'Perlu verifikasi',
    };
  }

  const clean = rawText.toLowerCase().replace(/[\r\n\t]/g, ' ').replace(/\s+/g, ' ').trim();

  // Search through lookup table
  for (const [key, val] of Object.entries(TERRITORY_NORMALIZATION_MAP)) {
    if (clean.includes(key)) {
      return {
        wilayahNormal: `${val.standardKecamatan} (${val.kotaKab})`,
        kecamatan: val.standardKecamatan,
        kotaKab: val.kotaKab,
      };
    }
  }

  // Check explicit mention of Kota / Kab
  if (clean.includes('kota sukabumi') || clean.includes('sukabumi kota')) {
    return {
      wilayahNormal: 'Kota Sukabumi (Kecamatan Lain/Perlu Verifikasi)',
      kecamatan: 'Perlu verifikasi',
      kotaKab: 'Kota Sukabumi',
    };
  }

  if (clean.includes('kab') || clean.includes('kabupaten')) {
    return {
      wilayahNormal: 'Kabupaten Sukabumi (Kecamatan Lain/Perlu Verifikasi)',
      kecamatan: 'Perlu verifikasi',
      kotaKab: 'Kabupaten Sukabumi',
    };
  }

  return {
    wilayahNormal: 'Perlu verifikasi',
    kecamatan: 'Perlu verifikasi',
    kotaKab: 'Perlu verifikasi',
  };
}
