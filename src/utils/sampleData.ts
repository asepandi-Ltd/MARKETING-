import { CleanReferralRecord } from '../types/referral';
import { transformRawRowsToCleanRecords } from './dataParser';

// Generator to build realistic referral records for RSUD Al-Mulk Kota Sukabumi for 2025 & 2026
export function generateAlMulkSampleData(): CleanReferralRecord[] {
  const referrers = [
    { name: 'Puskesmas Lembursitu', category: 'Eksternal', addr: 'Jl. Pelabuhan II KM 6.5, Lembursitu, Kota Sukabumi', weight: 28 },
    { name: 'Puskesmas Baros', category: 'Eksternal', addr: 'Jl. Raya Baros No. 12, Baros, Kota Sukabumi', weight: 20 },
    { name: 'Puskesmas Cikundul', category: 'Eksternal', addr: 'Jl. Merdeka Cikundul, Lembursitu, Kota Sukabumi', weight: 14 },
    { name: 'Puskesmas Gunungguruh', category: 'Eksternal', addr: 'Jl. Pelabuhan II KM 8, Kec. Gunungguruh, Kab. Sukabumi', weight: 16 },
    { name: 'Puskesmas Tipar', category: 'Eksternal', addr: 'Jl. Tipar No. 45, Citamiang, Kota Sukabumi', weight: 10 },
    { name: 'Puskesmas Gedongpanjang', category: 'Eksternal', addr: 'Jl. Gedong Panjang, Citamiang, Kota Sukabumi', weight: 8 },
    { name: 'Puskesmas Nyalindung', category: 'Eksternal', addr: 'Jl. Raya Nyalindung, Kab. Sukabumi', weight: 7 },
    { name: 'Klinik Pratama Citra Medika', category: 'Eksternal', addr: 'Jl. Pelabuhan II KM 5, Lembursitu, Kota Sukabumi', weight: 9 },
    { name: 'Klinik Baros Medika Sehat', category: 'Eksternal', addr: 'Jl. Baros No. 88, Baros, Kota Sukabumi', weight: 6 },
    { name: 'Puskesmas Benteng', category: 'Eksternal', addr: 'Jl. Benteng No. 19, Warudoyong, Kota Sukabumi', weight: 5 },
    { name: 'Puskesmas Cikembar', category: 'Eksternal', addr: 'Jl. Pelabuhan II Cikembar, Kab. Sukabumi', weight: 5 },
    { name: 'Puskesmas Cibeureum Hilir', category: 'Eksternal', addr: 'Jl. Cibeureum Hilir, Kota Sukabumi', weight: 5 },
    { name: 'Praktek Mandiri dr. H. Ridwan', category: 'Eksternal', addr: 'Sindangsari, Lembursitu, Kota Sukabumi', weight: 4 },
    { name: 'RSUD Al-Mulk (Internal Rujukan Poli/IGD)', category: 'Internal', addr: 'Jl. Pelabuhan II KM 6, Lembursitu, Kota Sukabumi', weight: 18 },
  ];

  // REAL RSUD AL-MULK SPECIALTY CLINICS ONLY (No Poli Paru, Gigi, or Mata)
  const clinicsAndDiagnoses = [
    {
      poli: 'Poli Penyakit Dalam',
      diagnoses: [
        'I10 - Hipertensi Esensial (Primer)',
        'E11 - Diabetes Melitus Tipe 2',
        'K29.7 - Gastritis Kronis',
        'N18 - Penyakit Ginjal Kronis',
      ],
      ageRange: [35, 75],
    },
    {
      poli: 'Poli Anak',
      diagnoses: [
        'J06.9 - Infeksi Saluran Pernapasan Akut (ISPA)',
        'A09 - Diare dan Gastroenteritis',
        'J45 - Asma Bronkial Anak',
        'R50.9 - Demam Tanpa Sebab Jelas',
      ],
      ageRange: [0.2, 12],
    },
    {
      poli: 'Poli Kebidanan & Kandungan (Obsgyn)',
      diagnoses: [
        'O80 - Persalinan Tunggal Spontan',
        'Z34 - Pengawasan Kehamilan Risiko Tinggi',
        'O24 - Diabetes Gestasional',
        'N80 - Endometriosis',
      ],
      ageRange: [18, 42],
    },
    {
      poli: 'Poli Bedah',
      diagnoses: [
        'K35.8 - Apendisitis Akut',
        'K40 - Hernia Inguinalis',
        'L02 - Abses Kulit & Furunkel',
        'D17 - Lipoma Regio Punggung',
      ],
      ageRange: [16, 68],
    },
    {
      poli: 'Poli Saraf',
      diagnoses: [
        'M54.5 - Nyeri Punggung Bawah (Low Back Pain)',
        'G43 - Migrain dan Nyeri Kepala Vaskular',
        'I69.3 - Pasca Stroke Infark (Rehabilitasi)',
        'G40 - Epilepsi Terkontrol',
      ],
      ageRange: [30, 78],
    },
    {
      poli: 'Poli Umum',
      diagnoses: [
        'R50 - Febris Observasi',
        'K29 - Dispepsia Fungsional',
        'M79.1 - Mialgia',
      ],
      ageRange: [10, 60],
    },
  ];

  const patientAddresses = [
    'Kp. Cikundul Girang RT 02/05, Kel. Cikundul, Kec. Lembursitu, Kota Sukabumi',
    'Jl. Pelabuhan II KM 6 No. 45, Sindangsari, Kec. Lembursitu, Kota Sukabumi',
    'Kp. Lembursitu Hilir RT 01/02, Lembursitu, Kota Sukabumi',
    'Jl. Baros KM 4, Jayaraksa, Kec. Baros, Kota Sukabumi',
    'Kp. Subangjaya RT 03/01, Cikole, Kota Sukabumi',
    'Jl. Tipar RT 04/02, Kec. Citamiang, Kota Sukabumi',
    'Kp. Gedongpanjang RT 02/03, Citamiang, Kota Sukabumi',
    'Kp. Nyomplong, Warudoyong, Kota Sukabumi',
    'Kp. Benteng RT 01/04, Kec. Warudoyong, Kota Sukabumi',
    'Kp. Cibolang Kaler, Kec. Gunungguruh, Kab. Sukabumi',
    'Kp. Sirnagalih, Kec. Gunungguruh, Kab. Sukabumi',
    'Jl. Raya Nyalindung KM 10, Kec. Nyalindung, Kab. Sukabumi',
    'Kp. Cikembar RT 05/02, Kec. Cikembar, Kab. Sukabumi',
    'Jl. Raya Cisaat No. 70, Cisaat, Kab. Sukabumi',
    'Kp. Babakan RT 02/04, Cibeureum, Kota Sukabumi',
    'Kp. Limusnunggal RT 01/03, Cibeureum, Kota Sukabumi',
    'Jl. Karamat No. 20, Gunungpuyuh, Kota Sukabumi',
    'Kp. Kebonpedes RT 03/02, Kebonpedes, Kab. Sukabumi',
  ];

  const rawRows: Record<string, any>[] = [];

  // Data spans 2025 and 2026 (Oct 2025 to Mar 2026)
  const monthConfigs = [
    { year: 2025, month: 10, maxDays: 31, count: 90 },
    { year: 2025, month: 11, maxDays: 30, count: 95 },
    { year: 2025, month: 12, maxDays: 31, count: 102 },
    { year: 2026, month: 1, maxDays: 31, count: 110 },
    { year: 2026, month: 2, maxDays: 28, count: 100 },
    { year: 2026, month: 3, maxDays: 24, count: 75 }, // Partial month in 2026
  ];

  for (const mCfg of monthConfigs) {
    for (let c = 0; c < mCfg.count; c++) {
      // Pick day
      const day = Math.floor(Math.random() * mCfg.maxDays) + 1;
      const dayStr = String(day).padStart(2, '0');
      const monthStr = String(mCfg.month).padStart(2, '0');
      const dateStr = `${mCfg.year}-${monthStr}-${dayStr}`;

      // Pick referrer weighted
      const randRef = Math.random() * 100;
      let cumWeight = 0;
      let selectedRef = referrers[0];
      for (const r of referrers) {
        cumWeight += (r.weight / 155) * 100;
        if (randRef <= cumWeight) {
          selectedRef = r;
          break;
        }
      }

      // Pick clinic & diagnosis
      const clinicObj = clinicsAndDiagnoses[Math.floor(Math.random() * clinicsAndDiagnoses.length)];
      const diag = clinicObj.diagnoses[Math.floor(Math.random() * clinicObj.diagnoses.length)];

      // Pick age within clinic range
      let age: number;
      if (clinicObj.poli === 'Poli Anak') {
        const isInfant = Math.random() < 0.25;
        age = isInfant ? Math.round(Math.random() * 11 + 1) / 12 : Math.floor(Math.random() * 12 + 1);
      } else {
        const minA = clinicObj.ageRange[0];
        const maxA = clinicObj.ageRange[1];
        age = Math.floor(Math.random() * (maxA - minA) + minA);
      }

      let umurRaw = '';
      if (age < 1) {
        const months = Math.max(1, Math.round(age * 12));
        umurRaw = `${months} Bln`;
      } else {
        umurRaw = `${age} Th`;
      }

      // Payment category: ~79% BPJS (has no rujukan), ~21% Umum (empty no rujukan)
      const isBpjs = Math.random() < 0.79;
      let noRujukan = '';
      if (isBpjs) {
        const pcareCode = String(Math.floor(Math.random() * 900000) + 100000);
        noRujukan = `0123R001${monthStr}25B${pcareCode}`;
      } else {
        noRujukan = ''; // Empty / whitespace
      }

      // Pick patient address
      const addr = patientAddresses[Math.floor(Math.random() * patientAddresses.length)];

      rawRows.push({
        'tanggal masuk': dateStr,
        'Perujuk Internal / Eksternal': selectedRef.name,
        'alamat perujuk': selectedRef.addr,
        'no rujukan': noRujukan,
        'alamat': addr,
        'umur pasien': umurRaw,
        'diagnosa awal': diag,
        'Poli rujukan': clinicObj.poli,
      });
    }
  }

  const { records } = transformRawRowsToCleanRecords(rawRows);
  return records;
}
