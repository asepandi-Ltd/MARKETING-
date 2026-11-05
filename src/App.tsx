/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { CleanReferralRecord, FilterState } from './types/referral';
import { generateAlMulkSampleData } from './utils/sampleData';
import { computeDashboardKpis } from './utils/analytics';
import { saveRecordsToIndexedDB, loadRecordsFromIndexedDB, clearRecordsFromIndexedDB } from './utils/indexedDbStorage';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { DashboardKpi } from './components/DashboardKpi';
import { TimeAnalysisModule } from './components/TimeAnalysisModule';
import { ReferrerAnalysisModule } from './components/ReferrerAnalysisModule';
import { TerritoryAnalysisModule } from './components/TerritoryAnalysisModule';
import { AgeAnalysisModule } from './components/AgeAnalysisModule';
import { ClinicAnalysisModule } from './components/ClinicAnalysisModule';
import { DiagnosisAnalysisModule } from './components/DiagnosisAnalysisModule';
import { PaymentAnalysisModule } from './components/PaymentAnalysisModule';
import { AiMarketingStrategist } from './components/AiMarketingStrategist';
import { MarketingVisitsModule } from './components/MarketingVisitsModule';
import { ReportExportModal } from './components/ReportExportModal';
import { DataUploadModal } from './components/DataUploadModal';
import { SupabaseSyncModal } from './components/SupabaseSyncModal';
import { MarketingVisitRecord } from './types/marketingVisit';
import { generateAlMulkMarketingVisits, correlateVisitsWithReferrals } from './utils/marketingVisitParser';
import { WelcomeScreen } from './components/WelcomeScreen';
import { getStoredSupabaseCredentials } from './utils/supabaseClient';

const INITIAL_FILTERS: FilterState = {
  startDate: '',
  endDate: '',
  kategoriPerujuk: 'ALL',
  namaPerujuk: '',
  wilayahPasien: '',
  kotaKabPasien: 'ALL',
  wilayahPerujuk: '',
  kelompokUsia: 'ALL',
  poliTujuan: '',
  diagnosaAwal: '',
  kategoriPembayaran: 'ALL',
};

export default function App() {
  const [records, setRecords] = useState<CleanReferralRecord[]>(() => {
    // Check if user previously uploaded data to local storage or fallback to 2025-2026 sample data
    try {
      const saved = localStorage.getItem('al_mulk_referral_records');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read cached records from localStorage:', e);
    }
    return generateAlMulkSampleData();
  });

  // Marketing Visits state (Field outreach log)
  const [marketingVisits, setMarketingVisits] = useState<MarketingVisitRecord[]>(() => {
    try {
      const saved = localStorage.getItem('al_mulk_marketing_visits');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read cached marketing visits:', e);
    }
    return generateAlMulkMarketingVisits([]);
  });

  const [isSampleData, setIsSampleData] = useState<boolean>(() => {
    return !localStorage.getItem('al_mulk_is_user_uploaded');
  });

  const [uploadedFileName, setUploadedFileName] = useState<string>(() => {
    return localStorage.getItem('al_mulk_uploaded_filename') || 'perujuk(1).xlsx';
  });

  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSupabaseOpen, setIsSupabaseOpen] = useState(false);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState<boolean>(() => {
    try {
      const savedV2 = localStorage.getItem('al_mulk_welcome_config_v2');
      if (savedV2) {
        const parsed = JSON.parse(savedV2);
        if (parsed && parsed.alwaysShowOnStartup === false) {
          return false;
        }
      }
      const saved = localStorage.getItem('al_mulk_welcome_config_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.alwaysShowOnStartup === false) {
          return false;
        }
      }
    } catch {
      // ignore
    }
    return true;
  });

  // Restore from IndexedDB on initial mount if available
  useEffect(() => {
    async function restoreFromIndexedDB() {
      try {
        const dbRecords = await loadRecordsFromIndexedDB();
        if (dbRecords && dbRecords.length > 0) {
          setRecords(dbRecords);
          setIsSampleData(false);
          const savedFileName = localStorage.getItem('al_mulk_uploaded_filename');
          if (savedFileName) setUploadedFileName(savedFileName);
        }
      } catch (err) {
        console.warn('Failed restoring from IndexedDB:', err);
      }
    }
    restoreFromIndexedDB();
  }, []);

  // Keep marketing visits correlated whenever referral records change
  useEffect(() => {
    setMarketingVisits((prev) => correlateVisitsWithReferrals(prev, records));
  }, [records]);

  const handleUpdateMarketingVisits = (newVisits: MarketingVisitRecord[]) => {
    const correlated = correlateVisitsWithReferrals(newVisits, records);
    setMarketingVisits(correlated);
    try {
      localStorage.setItem('al_mulk_marketing_visits', JSON.stringify(correlated));
    } catch (e) {
      console.warn('Failed saving marketing visits to localStorage:', e);
    }
  };

  // Filter options lists extracted strictly & dynamically from active records
  const availableReferrers = useMemo(() => {
    const set = new Set<string>();
    for (const r of records) {
      if (r.perujukClean) set.add(r.perujukClean);
    }
    return Array.from(set).sort();
  }, [records]);

  // Detected Clinics list from active file
  const availableClinics = useMemo(() => {
    const set = new Set<string>();
    for (const r of records) {
      if (r.poliTujuan) set.add(r.poliTujuan);
    }
    return Array.from(set).sort();
  }, [records]);

  // Detected Years list from active file
  const detectedYears = useMemo(() => {
    const set = new Set<number>();
    for (const r of records) {
      if (r.tahun && r.tahun > 1900) set.add(r.tahun);
    }
    return Array.from(set).sort();
  }, [records]);

  const availableDiagnoses = useMemo(() => {
    const set = new Set<string>();
    for (const r of records) {
      if (r.diagnosaAwal) set.add(r.diagnosaAwal);
    }
    return Array.from(set).sort();
  }, [records]);

  const availablePatientRegions = useMemo(() => {
    const set = new Set<string>();
    for (const r of records) {
      if (r.kecamatanPasien && r.kecamatanPasien !== 'Tidak teridentifikasi') {
        set.add(r.kecamatanPasien);
      }
    }
    return Array.from(set).sort();
  }, [records]);

  const availableReferrerRegions = useMemo(() => {
    const set = new Set<string>();
    for (const r of records) {
      if (r.wilayahPerujuk && r.wilayahPerujuk !== 'Perlu verifikasi') {
        set.add(r.wilayahPerujuk);
      }
    }
    return Array.from(set).sort();
  }, [records]);

  // Apply filters simultaneously
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Date range filter
      if (filters.startDate && r.tanggalMasuk < filters.startDate) return false;
      if (filters.endDate && r.tanggalMasuk > filters.endDate) return false;

      // Referrer category
      if (filters.kategoriPerujuk !== 'ALL' && r.kategoriPerujuk !== filters.kategoriPerujuk) {
        return false;
      }

      // Referrer Name
      if (filters.namaPerujuk && r.perujukClean !== filters.namaPerujuk) {
        return false;
      }

      // Patient Territory (Kecamatan)
      if (filters.wilayahPasien && r.kecamatanPasien !== filters.wilayahPasien) {
        return false;
      }

      // Patient Kota / Kabupaten
      if (filters.kotaKabPasien !== 'ALL' && r.kotaKabPasien !== filters.kotaKabPasien) {
        return false;
      }

      // Referrer Territory
      if (filters.wilayahPerujuk && r.wilayahPerujuk !== filters.wilayahPerujuk) {
        return false;
      }

      // Age Group
      if (filters.kelompokUsia !== 'ALL' && r.kelompokUsia !== filters.kelompokUsia) {
        return false;
      }

      // Poli Tujuan
      if (filters.poliTujuan && r.poliTujuan !== filters.poliTujuan) {
        return false;
      }

      // Diagnosis Awal
      if (filters.diagnosaAwal && r.diagnosaAwal !== filters.diagnosaAwal) {
        return false;
      }

      // Payment Category (BPJS vs Umum/Tunai)
      if (filters.kategoriPembayaran !== 'ALL' && r.kategoriPembayaran !== filters.kategoriPembayaran) {
        return false;
      }

      return true;
    });
  }, [records, filters]);

  // Compute live KPIs for filtered dataset
  const kpiSummary = useMemo(() => {
    return computeDashboardKpis(filteredRecords);
  }, [filteredRecords]);

  // Reset filter handler
  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  // Handle uploaded data from file
  const handleDataLoaded = (
    newRecords: CleanReferralRecord[], 
    isSample: boolean, 
    fileName?: string,
    detectedYearsList?: number[],
    detectedPoliList?: string[]
  ) => {
    setRecords(newRecords);
    setIsSampleData(isSample);
    setFilters(INITIAL_FILTERS);

    const fName = fileName || (isSample ? 'Data Model RSUD Al-Mulk' : 'perujuk(1).xlsx');
    setUploadedFileName(fName);

    try {
      if (!isSample) {
        // Save to IndexedDB for large reliable storage
        saveRecordsToIndexedDB(newRecords);
        localStorage.setItem('al_mulk_is_user_uploaded', 'true');
        localStorage.setItem('al_mulk_uploaded_filename', fName);

        // Auto Sync to Supabase if enabled
        if (localStorage.getItem('al_mulk_auto_sync_supabase') === 'true') {
          const creds = getStoredSupabaseCredentials();
          fetch('/api/supabase/sync-referrals', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-supabase-url': creds.url || '',
              'x-supabase-key': creds.key || '',
            },
            body: JSON.stringify({ records: newRecords }),
          }).catch((e) => console.warn('Auto sync referral failed:', e));
        }
      } else {
        clearRecordsFromIndexedDB();
        localStorage.removeItem('al_mulk_referral_records');
        localStorage.removeItem('al_mulk_is_user_uploaded');
        localStorage.removeItem('al_mulk_uploaded_filename');
      }
    } catch (e) {
      console.warn('Storage sync warning:', e);
    }
  };

  const handleResetToSample = () => {
    const sample = generateAlMulkSampleData();
    handleDataLoaded(sample, true, 'Data Model RSUD Al-Mulk', [2025, 2026]);
  };

  // Welcome Screen view before entering main application
  if (showWelcomeScreen) {
    return (
      <WelcomeScreen
        onEnterApp={(targetTab) => {
          if (targetTab) {
            setActiveTab(targetTab);
          }
          setShowWelcomeScreen(false);
        }}
        totalRecords={records.length}
        detectedYears={detectedYears}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header & Navigation */}
      <Header
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenSupabase={() => setIsSupabaseOpen(true)}
        onResetData={handleResetToSample}
        onOpenWelcome={() => setShowWelcomeScreen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalRecords={filteredRecords.length}
        dateRangeStr={`${kpiSummary.minDate} s/d ${kpiSummary.maxDate}`}
        isSampleData={isSampleData}
        hasGeminiKey={true}
        detectedYears={detectedYears}
        activePoliList={availableClinics}
        uploadedFileName={uploadedFileName}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filter Bar (Active on all tabs) */}
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          onReset={handleResetFilters}
          totalFiltered={filteredRecords.length}
          totalRaw={records.length}
          availableReferrers={availableReferrers}
          availableClinics={availableClinics}
          availableDiagnoses={availableDiagnoses}
          availablePatientRegions={availablePatientRegions}
          availableReferrerRegions={availableReferrerRegions}
        />

        {/* Tab 1: Ringkasan KPI & Dashboard Utama */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <DashboardKpi summary={kpiSummary} />
            <div className="pt-2">
              <TimeAnalysisModule records={filteredRecords} summary={kpiSummary} />
            </div>
          </div>
        )}

        {/* Tab 2: Modul Analisis Waktu */}
        {activeTab === 'waktu' && (
          <TimeAnalysisModule records={filteredRecords} summary={kpiSummary} />
        )}

        {/* Tab 3: Modul Analisis Perujuk */}
        {activeTab === 'perujuk' && (
          <ReferrerAnalysisModule records={filteredRecords} summary={kpiSummary} />
        )}

        {/* Tab Kunjungan Tim Marketing & Sandingan Rujukan */}
        {activeTab === 'kunjungan' && (
          <MarketingVisitsModule
            visits={marketingVisits}
            onUpdateVisits={handleUpdateMarketingVisits}
            referrals={filteredRecords}
            summary={kpiSummary}
            onOpenSupabase={() => setIsSupabaseOpen(true)}
          />
        )}

        {/* Tab 4: Modul Analisis Wilayah */}
        {activeTab === 'wilayah' && (
          <TerritoryAnalysisModule records={filteredRecords} summary={kpiSummary} />
        )}

        {/* Tab 5: Modul Rentang Usia */}
        {activeTab === 'usia' && (
          <AgeAnalysisModule records={filteredRecords} summary={kpiSummary} />
        )}

        {/* Tab 6: Modul Poli Rujukan */}
        {activeTab === 'poli' && (
          <ClinicAnalysisModule records={filteredRecords} summary={kpiSummary} />
        )}

        {/* Tab 7: Modul Diagnosis Awal */}
        {activeTab === 'diagnosa' && (
          <DiagnosisAnalysisModule records={filteredRecords} summary={kpiSummary} />
        )}

        {/* Tab 8: Modul Cara Pembayaran */}
        {activeTab === 'pembayaran' && (
          <PaymentAnalysisModule records={filteredRecords} summary={kpiSummary} />
        )}

        {/* Tab 9: AI Marketing Strategist */}
        {activeTab === 'ai-strategist' && (
          <AiMarketingStrategist 
            records={filteredRecords} 
            summary={kpiSummary} 
            marketingVisits={marketingVisits}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © {new Date().getFullYear()} RSUD Al-Mulk Kota Sukabumi • Subbag Humas, Pemasaran & Rekam Medis
          </span>
          <span className="text-[11px] text-slate-600">
            Jalan Pelabuhan II KM 6, Kec. Lembursitu, Kota Sukabumi • AL-MULK MARKET INTELLIGENCE
          </span>
        </div>
      </footer>

      {/* Modals */}
      {isUploadOpen && (
        <DataUploadModal
          onClose={() => setIsUploadOpen(false)}
          onDataLoaded={handleDataLoaded}
        />
      )}

      {isReportOpen && (
        <ReportExportModal
          onClose={() => setIsReportOpen(false)}
          records={filteredRecords}
          summary={kpiSummary}
          marketingVisits={marketingVisits}
        />
      )}

      {isSupabaseOpen && (
        <SupabaseSyncModal
          isOpen={isSupabaseOpen}
          onClose={() => setIsSupabaseOpen(false)}
          visits={marketingVisits}
          onVisitsLoaded={handleUpdateMarketingVisits}
          referrals={filteredRecords}
          onReferralsLoaded={(newReferrals) => setRecords(newReferrals)}
        />
      )}
    </div>
  );
}
