import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, 
  Settings, 
  MapPin, 
  Sun, 
  Sliders, 
  Check, 
  Sparkles,
  Layers,
  BarChart3,
  Users,
  Compass,
  X,
  RefreshCw,
  Film,
  Upload,
  Video,
  Image as ImageIcon,
  Type,
  Palette,
  Volume2,
  VolumeX,
  Link2,
  Trash2,
  CheckCircle2,
  Play
} from 'lucide-react';
import facadeImg from '../assets/images/rsud_al_mulk_facade_1793191055317.jpg';
import interiorImg from '../assets/images/rsud_al_mulk_interior_1793191073894.jpg';
import { RSUD_AL_MULK_INFO } from '../utils/geoSukabumi';
import { 
  saveMediaToIndexedDB, 
  loadMediaFromIndexedDB, 
  deleteMediaFromIndexedDB 
} from '../utils/indexedDbStorage';
import { getSupabaseClient, getStoredSupabaseCredentials } from '../utils/supabaseClient';

export type WelcomeMediaType = 
  | 'preset-slideshow' 
  | 'preset-facade' 
  | 'preset-interior' 
  | 'custom-image' 
  | 'custom-video' 
  | 'image-url' 
  | 'video-url';

export type AccentColorTheme = 'emerald' | 'teal' | 'blue' | 'amber' | 'rose' | 'violet';

export interface WelcomeCustomConfig {
  // Media & Background
  mediaType: WelcomeMediaType;
  customVideoUrl: string;
  customImageUrl: string;
  videoMuted: boolean;
  videoSpeed: number;

  // Visual Effects & Lighting
  brightness: number; // 70 to 140 (default: 102)
  contrast: number; // 80 to 130 (default: 105)
  overlayOpacity: number; // 10 to 80 (default: 35)
  enableCinematicMotion: boolean;
  motionDuration: number; // seconds
  accentColor: AccentColorTheme;

  // Branding & Text
  hospitalName: string;
  agencyName: string;
  appName: string;
  tagline: string;
  address: string;
  ctaText: string;
  logoType: 'default-crest' | 'custom-logo';

  // Behavior & Layout
  alwaysShowOnStartup: boolean;
  autoEnterSeconds: number;
  showQuickShortcuts: boolean;
  showFooterStats: boolean;
}

export const DEFAULT_WELCOME_CONFIG: WelcomeCustomConfig = {
  mediaType: 'preset-slideshow',
  customVideoUrl: '',
  customImageUrl: '',
  videoMuted: true,
  videoSpeed: 1,

  brightness: 102,
  contrast: 105,
  overlayOpacity: 35,
  enableCinematicMotion: true,
  motionDuration: 24,
  accentColor: 'emerald',

  hospitalName: 'RUMAH SAKIT UMUM DAERAH AL-MULK KOTA SUKABUMI',
  agencyName: 'PEMERINTAH KOTA SUKABUMI',
  appName: 'AL-MULK MARKET INTELLIGENCE',
  tagline: 'Platform terpadu pemetaan perujuk, monitoring efektivitas kunjungan lapangan tim marketing, dan evaluasi rekomendasi rujukan faskes di Kota & Kabupaten Sukabumi.',
  address: 'Jalan Pelabuhan II KM 6, Kec. Lembursitu, Kota Sukabumi',
  ctaText: 'Masuk ke Menu Utama',
  logoType: 'default-crest',

  alwaysShowOnStartup: true,
  autoEnterSeconds: 0,
  showQuickShortcuts: true,
  showFooterStats: true,
};

const STORAGE_KEY = 'al_mulk_welcome_config_v2';
const MEDIA_KEY_IMAGE = 'welcome_custom_image';
const MEDIA_KEY_VIDEO = 'welcome_custom_video';
const MEDIA_KEY_LOGO = 'welcome_custom_logo';

interface WelcomeScreenProps {
  onEnterApp: (targetTab?: string) => void;
  totalRecords?: number;
  detectedYears?: number[];
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onEnterApp,
  totalRecords = 2878,
  detectedYears = [2025, 2026],
}) => {
  // Load configuration from localStorage
  const [config, setConfig] = useState<WelcomeCustomConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_WELCOME_CONFIG, ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_WELCOME_CONFIG;
  });

  // Blob Object URLs for custom uploaded media
  const [customImageBlobUrl, setCustomImageBlobUrl] = useState<string | null>(null);
  const [customVideoBlobUrl, setCustomVideoBlobUrl] = useState<string | null>(null);

  // Studio modal state & tab
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [activeCustomizeTab, setActiveCustomizeTab] = useState<'media' | 'text' | 'effects' | 'behavior'>('media');

  // Slideshow and countdown timers
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileImageInputRef = useRef<HTMLInputElement>(null);
  const fileVideoInputRef = useRef<HTMLInputElement>(null);

  // Load custom media blobs from IndexedDB on initial mount
  useEffect(() => {
    let active = true;

    async function loadPersistedMedia() {
      try {
        const imgBlob = await loadMediaFromIndexedDB(MEDIA_KEY_IMAGE);
        if (imgBlob && active) {
          const url = typeof imgBlob === 'string' ? imgBlob : URL.createObjectURL(imgBlob);
          setCustomImageBlobUrl(url);
        }

        const vidBlob = await loadMediaFromIndexedDB(MEDIA_KEY_VIDEO);
        if (vidBlob && active) {
          const url = typeof vidBlob === 'string' ? vidBlob : URL.createObjectURL(vidBlob);
          setCustomVideoBlobUrl(url);
        }
      } catch (err) {
        console.warn('Gagal memuat media dari IndexedDB:', err);
      }
    }

    loadPersistedMedia();

    return () => {
      active = false;
    };
  }, []);

  // Sync video speed and playback
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = config.videoSpeed || 1;
      videoRef.current.muted = config.videoMuted;
    }
  }, [config.videoSpeed, config.videoMuted, config.mediaType]);

  // Slideshow alternating timer
  useEffect(() => {
    if (config.mediaType !== 'preset-slideshow') return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev === 0 ? 1 : 0));
    }, 7000);
    return () => clearInterval(interval);
  }, [config.mediaType]);

  // Optional auto-enter countdown
  useEffect(() => {
    if (config.autoEnterSeconds <= 0 || isCustomizeOpen) {
      setSecondsRemaining(null);
      return;
    }
    setSecondsRemaining(config.autoEnterSeconds);
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          onEnterApp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [config.autoEnterSeconds, isCustomizeOpen, onEnterApp]);

  // Load remote welcome screen config from Supabase on mount
  useEffect(() => {
    async function loadCloudWelcomeConfig() {
      // 1. Direct Supabase Client load (works immediately on Vercel without serverless)
      try {
        const client = getSupabaseClient();
        if (client) {
          const { data, error } = await client
            .from('app_settings')
            .select('value')
            .eq('key', 'welcome_config')
            .single();

          if (!error && data?.value) {
            setConfig((prev) => ({ ...prev, ...data.value }));
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(data.value));
            } catch (e) {
              // ignore
            }
            return;
          }
        }
      } catch (err) {
        console.warn('Direct load welcome config notice:', err);
      }

      // 2. Safe API fallback
      try {
        const { url: sUrl, key: sKey } = getStoredSupabaseCredentials();
        const res = await fetch('/api/supabase/get-welcome-config', {
          headers: {
            'x-supabase-url': sUrl || '',
            'x-supabase-key': sKey || '',
          },
        });
        const isJson = res.headers.get('content-type')?.includes('application/json');
        if (res.ok && isJson) {
          const data = await res.json();
          if (data.success && data.config) {
            setConfig((prev) => ({ ...prev, ...data.config }));
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(data.config));
            } catch (e) {}
          }
        }
      } catch (err) {
        // ignore
      }
    }
    loadCloudWelcomeConfig();
  }, []);

  // Save changes to localStorage & Supabase Cloud
  const updateConfig = (partial: Partial<WelcomeCustomConfig>) => {
    setConfig((prev) => {
      const updated = { ...prev, ...partial };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Gagal menyimpan config ke localStorage:', e);
      }

      // 1. Direct Supabase Client save (works immediately on Vercel)
      try {
        const client = getSupabaseClient();
        if (client) {
          client
            .from('app_settings')
            .upsert({ key: 'welcome_config', value: updated, updated_at: new Date().toISOString() }, { onConflict: 'key' })
            .then(({ error }) => {
              if (error) console.warn('Supabase app_settings save notice:', error.message);
            });
        }
      } catch (e) {
        console.warn('Direct cloud config save notice:', e);
      }

      // 2. Server API sync fallback
      const { url: sUrl, key: sKey } = getStoredSupabaseCredentials();
      fetch('/api/supabase/save-welcome-config', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-supabase-url': sUrl || '',
          'x-supabase-key': sKey || '',
        },
        body: JSON.stringify({ config: updated }),
      }).catch((e) => console.warn('Cloud config sync skipped:', e));

      return updated;
    });
  };

  // Upload Custom Photo handler
  const handleUploadImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await saveMediaToIndexedDB(MEDIA_KEY_IMAGE, file);
      if (customImageBlobUrl) URL.revokeObjectURL(customImageBlobUrl);
      const newUrl = URL.createObjectURL(file);
      setCustomImageBlobUrl(newUrl);
      updateConfig({ mediaType: 'custom-image' });
    } catch (err) {
      console.error('Gagal mengunggah foto:', err);
    }
  };

  // Upload Custom Video handler
  const handleUploadVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await saveMediaToIndexedDB(MEDIA_KEY_VIDEO, file);
      if (customVideoBlobUrl) URL.revokeObjectURL(customVideoBlobUrl);
      const newUrl = URL.createObjectURL(file);
      setCustomVideoBlobUrl(newUrl);
      updateConfig({ mediaType: 'custom-video' });
    } catch (err) {
      console.error('Gagal mengunggah video:', err);
    }
  };

  // Delete Custom Image handler
  const handleDeleteCustomImage = async () => {
    try {
      await deleteMediaFromIndexedDB(MEDIA_KEY_IMAGE);
      if (customImageBlobUrl) URL.revokeObjectURL(customImageBlobUrl);
      setCustomImageBlobUrl(null);
      if (config.mediaType === 'custom-image') {
        updateConfig({ mediaType: 'preset-slideshow' });
      }
    } catch (err) {
      console.warn('Gagal menghapus foto kustom:', err);
    }
  };

  // Delete Custom Video handler
  const handleDeleteCustomVideo = async () => {
    try {
      await deleteMediaFromIndexedDB(MEDIA_KEY_VIDEO);
      if (customVideoBlobUrl) URL.revokeObjectURL(customVideoBlobUrl);
      setCustomVideoBlobUrl(null);
      if (config.mediaType === 'custom-video') {
        updateConfig({ mediaType: 'preset-slideshow' });
      }
    } catch (err) {
      console.warn('Gagal menghapus video kustom:', err);
    }
  };

  // Reset to default configuration
  const handleResetToDefault = async () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      await deleteMediaFromIndexedDB(MEDIA_KEY_IMAGE);
      await deleteMediaFromIndexedDB(MEDIA_KEY_VIDEO);
      setCustomImageBlobUrl(null);
      setCustomVideoBlobUrl(null);
      setConfig(DEFAULT_WELCOME_CONFIG);
    } catch (err) {
      console.warn('Gagal reset default:', err);
    }
  };

  // Accent theme helper styling
  const getAccentStyles = () => {
    switch (config.accentColor) {
      case 'teal':
        return {
          btnGrad: 'from-teal-500 via-cyan-500 to-teal-600 hover:from-teal-400 hover:to-cyan-400',
          btnShadow: 'shadow-teal-500/30',
          textAccent: 'text-teal-400',
          badgeBg: 'bg-teal-500/20 border-teal-400/40 text-teal-300',
          borderAccent: 'border-teal-500',
          dot: 'bg-teal-400',
        };
      case 'blue':
        return {
          btnGrad: 'from-blue-600 via-sky-500 to-blue-700 hover:from-blue-500 hover:to-sky-400',
          btnShadow: 'shadow-blue-500/30',
          textAccent: 'text-blue-400',
          badgeBg: 'bg-blue-500/20 border-blue-400/40 text-blue-300',
          borderAccent: 'border-blue-500',
          dot: 'bg-blue-400',
        };
      case 'amber':
        return {
          btnGrad: 'from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400',
          btnShadow: 'shadow-amber-500/30',
          textAccent: 'text-amber-400',
          badgeBg: 'bg-amber-500/20 border-amber-400/40 text-amber-300',
          borderAccent: 'border-amber-500',
          dot: 'bg-amber-400',
        };
      case 'rose':
        return {
          btnGrad: 'from-rose-500 via-pink-500 to-rose-600 hover:from-rose-400 hover:to-pink-400',
          btnShadow: 'shadow-rose-500/30',
          textAccent: 'text-rose-400',
          badgeBg: 'bg-rose-500/20 border-rose-400/40 text-rose-300',
          borderAccent: 'border-rose-500',
          dot: 'bg-rose-400',
        };
      case 'violet':
        return {
          btnGrad: 'from-violet-600 via-purple-500 to-violet-700 hover:from-violet-500 hover:to-purple-400',
          btnShadow: 'shadow-violet-500/30',
          textAccent: 'text-purple-400',
          badgeBg: 'bg-purple-500/20 border-purple-400/40 text-purple-300',
          borderAccent: 'border-purple-500',
          dot: 'bg-purple-400',
        };
      case 'emerald':
      default:
        return {
          btnGrad: 'from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400',
          btnShadow: 'shadow-emerald-500/30',
          textAccent: 'text-emerald-400',
          badgeBg: 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300',
          borderAccent: 'border-emerald-500',
          dot: 'bg-emerald-400',
        };
    }
  };

  const accent = getAccentStyles();

  // Determine active media element
  const isVideoMode = config.mediaType === 'custom-video' || config.mediaType === 'video-url';
  
  const getActiveImageUrl = () => {
    if (config.mediaType === 'custom-image') {
      return customImageBlobUrl || facadeImg;
    }
    if (config.mediaType === 'image-url' && config.customImageUrl) {
      return config.customImageUrl;
    }
    if (config.mediaType === 'preset-facade') return facadeImg;
    if (config.mediaType === 'preset-interior') return interiorImg;
    return currentSlideIndex === 0 ? facadeImg : interiorImg;
  };

  const getActiveVideoSrc = () => {
    if (config.mediaType === 'custom-video') {
      return customVideoBlobUrl || '';
    }
    if (config.mediaType === 'video-url') {
      return config.customVideoUrl || '';
    }
    return '';
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-slate-950 font-['Plus_Jakarta_Sans',sans-serif] select-none">
      
      {/* Hidden File Upload Inputs */}
      <input 
        ref={fileImageInputRef} 
        type="file" 
        accept="image/*" 
        className="hidden" 
        onChange={handleUploadImageFile} 
      />
      <input 
        ref={fileVideoInputRef} 
        type="file" 
        accept="video/mp4,video/webm,video/ogg" 
        className="hidden" 
        onChange={handleUploadVideoFile} 
      />
      {/* Cinematic Background Layer */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        
        {/* If Video mode is active */}
        {isVideoMode && getActiveVideoSrc() ? (
          <video
            ref={videoRef}
            src={getActiveVideoSrc()}
            autoPlay
            loop
            playsInline
            muted={config.videoMuted}
            className="w-full h-full object-cover"
            style={{
              filter: `brightness(${config.brightness / 100}) contrast(${config.contrast / 100})`,
            }}
          />
        ) : (
          /* Image mode with optional smooth Ken-Burns pan/zoom */
          <div
            className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out ${
              config.enableCinematicMotion ? 'animate-kenburns scale-105' : 'scale-100'
            }`}
            style={{
              backgroundImage: `url(${getActiveImageUrl()})`,
              filter: `brightness(${config.brightness / 100}) contrast(${config.contrast / 100}) saturate(1.1)`,
            }}
          />
        )}

        {/* Ambient atmospheric lens bloom */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full bg-teal-400/15 blur-3xl pointer-events-none" />

        {/* Dynamic Vignette / Gradient Overlay with User's Opacity Setting */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, rgba(2, 6, 23, ${config.overlayOpacity * 0.4 / 100}) 0%, rgba(2, 6, 23, ${config.overlayOpacity / 100}) 100%)`,
          }}
        />

        {/* Subtle tech micro-grid pattern */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.25) 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* Top Bar: Official Hospital Identity & Customization Trigger */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-10 pt-6 sm:pt-8 flex items-center justify-between">
        
        {/* Hospital Official Crest Badge */}
        <div className="flex items-center gap-3.5 backdrop-blur-md bg-slate-900/50 border border-white/15 px-4 py-2 rounded-2xl shadow-lg shadow-black/25">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 p-0.5 shadow-md flex items-center justify-center overflow-hidden">
            <div className="w-full h-full rounded-[10px] bg-slate-950/80 flex items-center justify-center">
              <svg viewBox="0 0 48 48" fill="none" className="w-6 h-6 text-emerald-400">
                <path d="M24 4L8 10V22C8 32.5 14.8 42.2 24 44C33.2 42.2 40 32.5 40 22V10L24 4Z" fill="#065f46" stroke="#34d399" strokeWidth="2" />
                <path d="M21 16H27V21H32V27H27V32H21V27H16V21H21V16Z" fill="white" />
              </svg>
            </div>
          </div>
          <div>
            <div className={`text-[11px] font-extrabold uppercase tracking-widest ${accent.textAccent} drop-shadow`}>
              {config.agencyName || 'PEMERINTAH KOTA SUKABUMI'}
            </div>
            <div className="text-xs font-bold text-white tracking-tight">
              {config.hospitalName || 'RSUD AL-MULK'}
            </div>
          </div>
        </div>

        {/* Top Right Controls: Studio Customization Trigger */}
        <div className="flex items-center gap-2.5">
          {/* Quick Indicator of active background */}
          <div className="hidden md:flex items-center gap-1.5 backdrop-blur-md bg-slate-900/50 border border-white/15 px-3 py-1.5 rounded-xl text-xs text-slate-300">
            {isVideoMode ? (
              <>
                <Video className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                <span>Video Sinematik</span>
              </>
            ) : (
              <>
                <Film className="w-3.5 h-3.5 text-emerald-400" />
                <span>Foto Sinematik</span>
              </>
            )}
          </div>

          {/* Tombol Kustomisasi Sendiri */}
          <button
            type="button"
            onClick={() => setIsCustomizeOpen(true)}
            aria-label="Kustomisasi Welcome Screen Sendiri"
            title="Kustomisasi Latar, Teks, Efek & Video Welcome Screen"
            className="flex items-center gap-2 backdrop-blur-md bg-slate-900/60 hover:bg-slate-900/90 text-white border border-white/20 hover:border-emerald-400/60 px-4 py-2 rounded-xl transition-all shadow-xl shadow-black/30 hover:scale-105 active:scale-95 text-xs font-semibold group"
          >
            <Sliders className="w-4 h-4 text-emerald-400 group-hover:rotate-45 transition-transform duration-300" />
            <span>Kustomisasi Layar</span>
          </button>
        </div>
      </header>

      {/* Center Cinematic Hero Section */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-6 py-8 sm:py-12 flex flex-col items-center text-center">
        
        {/* Subtle Live Badge */}
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${accent.badgeBg} backdrop-blur-md border text-xs font-semibold tracking-wide uppercase shadow-lg mb-5 animate-fade-in`}>
          <span className={`w-2 h-2 rounded-full ${accent.dot} animate-ping`} />
          <span>Sistem Intelijen Pemasaran &amp; Jejaring Faskes</span>
        </div>

        {/* Hospital Official Title */}
        <h2 className={`text-sm sm:text-base md:text-lg font-black tracking-widest ${accent.textAccent} uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] max-w-3xl`}>
          {config.hospitalName}
        </h2>

        {/* Application Core Name */}
        <h1 className="mt-2 text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight uppercase drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] leading-tight">
          {config.appName}
        </h1>

        {/* Tagline / Subtitle */}
        {config.tagline && (
          <p className="mt-4 text-sm sm:text-base md:text-lg text-slate-200 font-medium max-w-2xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] leading-relaxed">
            {config.tagline}
          </p>
        )}

        {/* Address & Facility Info */}
        {config.address && (
          <div className="mt-3 flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-300 font-medium drop-shadow">
            <MapPin className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{config.address}</span>
          </div>
        )}

        {/* Action Button: Enter Application */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onEnterApp()}
            className={`w-full sm:w-auto group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r ${accent.btnGrad} text-slate-950 font-extrabold text-base tracking-wide shadow-xl ${accent.btnShadow} transition-all duration-200 hover:scale-105 active:scale-95 border border-white/20`}
          >
            <span>{config.ctaText || 'Masuk ke Menu Utama'}</span>
            <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
            
            {/* Auto enter countdown indicator if enabled */}
            {secondsRemaining !== null && secondsRemaining > 0 && (
              <span className="text-xs bg-slate-950/20 px-2 py-0.5 rounded-full font-mono">
                ({secondsRemaining}s)
              </span>
            )}
          </button>
        </div>

        {/* Quick Shortcut Buttons to Specific Modules */}
        {config.showQuickShortcuts && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs">
            <button
              onClick={() => onEnterApp('dashboard')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl backdrop-blur-md bg-slate-900/50 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 hover:border-emerald-500/40 transition-all"
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ringkasan KPI</span>
            </button>
            <button
              onClick={() => onEnterApp('kunjungan')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl backdrop-blur-md bg-slate-900/50 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 hover:border-emerald-500/40 transition-all"
            >
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>Kunjungan Marketing</span>
            </button>
            <button
              onClick={() => onEnterApp('wilayah')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl backdrop-blur-md bg-slate-900/50 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 hover:border-emerald-500/40 transition-all"
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Peta Wilayah Sukabumi</span>
            </button>
          </div>
        )}
      </main>

      {/* Footer Info & Statistics Bar */}
      {config.showFooterStats && (
        <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-10 pb-6 sm:pb-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-300 border-t border-white/10 pt-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-white">Status Data:</span>
            <span>{totalRecords.toLocaleString('id-ID')} Total Rekaman Kunjungan</span>
            <span className="text-white/40">·</span>
            <span>Tahun {detectedYears.join(' & ')}</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>RSUD Kelas D Pemerintah Kota Sukabumi</span>
            <span className="text-white/40">·</span>
            <button
              onClick={() => setIsCustomizeOpen(true)}
              className={`${accent.textAccent} hover:underline underline-offset-2 flex items-center gap-1`}
            >
              <Sliders className="w-3 h-3" />
              <span>Kustomisasi Tampilan Sendiri</span>
            </button>
          </div>
        </footer>
      )}

      {/* ============================================================ */}
      {/* STUDIO KUSTOMISASI MODAL: PENGATURAN SENDIRI LENGKAP        */}
      {/* ============================================================ */}
      {isCustomizeOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsCustomizeOpen(false)}
        >
          <div 
            className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${accent.badgeBg} border`}>
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Kustomisasi Layar Sinematik</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase font-mono">
                      Personal Studio
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Atur foto, video, teks, warna, kecerahan, dan perilaku sesuai keinginan Anda</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomizeOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs inside Customization Studio */}
            <div className="flex items-center border-b border-slate-800 bg-slate-950/40 px-6 gap-1 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveCustomizeTab('media')}
                className={`py-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
                  activeCustomizeTab === 'media'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Media (Foto / Video)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCustomizeTab('text')}
                className={`py-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
                  activeCustomizeTab === 'text'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>Teks &amp; Branding</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCustomizeTab('effects')}
                className={`py-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
                  activeCustomizeTab === 'effects'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Visual, Kecerahan &amp; Warna</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCustomizeTab('behavior')}
                className={`py-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
                  activeCustomizeTab === 'behavior'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Perilaku &amp; Navigasi</span>
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              
              {/* ======================================================== */}
              {/* TAB 1: MEDIA (FOTO & VIDEO)                              */}
              {/* ======================================================== */}
              {activeCustomizeTab === 'media' && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="font-bold text-slate-200 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Pilihan Sumber Media Latar Belakang</span>
                      </span>
                      <span className="text-[11px] font-normal text-slate-400">
                        Pilih foto bawaan, unggah foto/video sendiri, atau URL video
                      </span>
                    </label>

                    {/* Mode Grid Selector */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => updateConfig({ mediaType: 'preset-slideshow' })}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          config.mediaType === 'preset-slideshow'
                            ? 'bg-emerald-500/20 border-emerald-500 text-white font-semibold'
                            : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold">
                          <Film className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Slideshow Al-Mulk</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">Gedung &amp; Atrium bergantian</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateConfig({ mediaType: 'preset-facade' })}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          config.mediaType === 'preset-facade'
                            ? 'bg-emerald-500/20 border-emerald-500 text-white font-semibold'
                            : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold">
                          <Sun className="w-3.5 h-3.5 text-amber-400" />
                          <span>Fasad Gedung Cerah</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">Eksterior Daylight Sunny</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateConfig({ mediaType: 'preset-interior' })}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          config.mediaType === 'preset-interior'
                            ? 'bg-emerald-500/20 border-emerald-500 text-white font-semibold'
                            : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold">
                          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                          <span>Lobby Atrium</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">Interior Modern Al-Mulk</div>
                      </button>

                      {/* Custom Image Upload */}
                      <button
                        type="button"
                        onClick={() => {
                          if (customImageBlobUrl) {
                            updateConfig({ mediaType: 'custom-image' });
                          } else {
                            fileImageInputRef.current?.click();
                          }
                        }}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          config.mediaType === 'custom-image'
                            ? 'bg-emerald-500/20 border-emerald-500 text-white font-semibold'
                            : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold">
                          <Upload className="w-3.5 h-3.5 text-blue-400" />
                          <span>Unggah Foto Sendiri</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {customImageBlobUrl ? 'Foto kustom aktif' : 'Pilih file dari laptop'}
                        </div>
                      </button>

                      {/* Custom Video Upload */}
                      <button
                        type="button"
                        onClick={() => {
                          if (customVideoBlobUrl) {
                            updateConfig({ mediaType: 'custom-video' });
                          } else {
                            fileVideoInputRef.current?.click();
                          }
                        }}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          config.mediaType === 'custom-video'
                            ? 'bg-emerald-500/20 border-emerald-500 text-white font-semibold'
                            : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold">
                          <Video className="w-3.5 h-3.5 text-purple-400" />
                          <span>Unggah Video Sendiri</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {customVideoBlobUrl ? 'Video kustom aktif' : 'MP4/WebM dari laptop'}
                        </div>
                      </button>

                      {/* Direct Video URL */}
                      <button
                        type="button"
                        onClick={() => updateConfig({ mediaType: 'video-url' })}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          config.mediaType === 'video-url'
                            ? 'bg-emerald-500/20 border-emerald-500 text-white font-semibold'
                            : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold">
                          <Link2 className="w-3.5 h-3.5 text-cyan-400" />
                          <span>URL Video Online</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">Link MP4 / Video Stream</div>
                      </button>
                    </div>
                  </div>

                  {/* Actions for custom uploaded image */}
                  {config.mediaType === 'custom-image' && (
                    <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {customImageBlobUrl && (
                          <img 
                            src={customImageBlobUrl} 
                            alt="Custom Background" 
                            className="w-16 h-10 object-cover rounded-lg border border-slate-600 shadow" 
                          />
                        )}
                        <div>
                          <div className="font-semibold text-slate-200">Foto Kustom Pengguna</div>
                          <div className="text-[10px] text-slate-400">Foto tersimpan aman di penyimpanan peramban (IndexedDB)</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileImageInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1.5"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Ganti Foto</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Actions for custom uploaded video */}
                  {config.mediaType === 'custom-video' && (
                    <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-200 flex items-center gap-2">
                            <Video className="w-4 h-4 text-purple-400" />
                            <span>Video Bergerak Kustom</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Video berjalan berulang (*loop*) otomatis di latar belakang layar</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => fileVideoInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium flex items-center gap-1.5"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Ganti Video</span>
                        </button>
                      </div>

                      {/* Video Controls */}
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700/60">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60">
                          <span className="text-slate-300">Suara Video</span>
                          <button
                            type="button"
                            onClick={() => updateConfig({ videoMuted: !config.videoMuted })}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 ${
                              config.videoMuted ? 'bg-slate-700 text-slate-300' : 'bg-emerald-600 text-white'
                            }`}
                          >
                            {config.videoMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                            <span>{config.videoMuted ? 'Muted (Bisu)' : 'Bersuara'}</span>
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60">
                          <span className="text-slate-300">Kecepatan Putar</span>
                          <div className="flex items-center gap-1">
                            {[0.75, 1, 1.25].map((speed) => (
                              <button
                                key={speed}
                                type="button"
                                onClick={() => updateConfig({ videoSpeed: speed })}
                                className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                                  config.videoSpeed === speed
                                    ? 'bg-purple-600 text-white font-bold'
                                    : 'bg-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                {speed}x
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Input for direct video URL */}
                  {config.mediaType === 'video-url' && (
                    <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 space-y-2">
                      <label className="font-semibold text-slate-200">Tautan / URL Berkas Video (MP4 / WebM)</label>
                      <input
                        type="url"
                        value={config.customVideoUrl}
                        onChange={(e) => updateConfig({ customVideoUrl: e.target.value })}
                        placeholder="https://example.com/hospital_drone_footage.mp4"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                      />
                      <p className="text-[10px] text-slate-400">
                        Masukkan tautan video langsung (direct video file link) dengan ekstensi .mp4 atau .webm
                      </p>
                    </div>
                  )}

                  {/* Fitur Pengunggahan Foto / Video Sinematik Latar Belakang */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-700/80 shadow-xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                      <div>
                        <div className="font-bold text-slate-100 flex items-center gap-2 text-sm">
                          <Film className="w-4 h-4 text-emerald-400" />
                          <span>Pengunggahan Foto &amp; Video Sinematik Welcome Screen</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Unggah berkas foto resolusi tinggi atau rekaman video sinematik (drone/gedung) untuk latar belakang layar pembuka RSUD Al-Mulk.
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 text-[10px]">
                        <span className="text-slate-400">Status Latar:</span>
                        <span className="font-semibold text-emerald-300">
                          {config.mediaType === 'custom-image' && 'Foto Kustom Aktif'}
                          {config.mediaType === 'custom-video' && 'Video Kustom Aktif'}
                          {config.mediaType === 'video-url' && 'Video URL Aktif'}
                          {config.mediaType === 'preset-slideshow' && 'Slideshow Bawaan'}
                          {config.mediaType === 'preset-facade' && 'Fasad Siang Bawaan'}
                          {config.mediaType === 'preset-interior' && 'Lobby Atrium Bawaan'}
                        </span>
                      </div>
                    </div>

                    {/* Dual Cards: Pengunggahan Foto & Pengunggahan Video */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      
                      {/* CARD 1: Foto Sinematik */}
                      <div className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                        config.mediaType === 'custom-image' 
                          ? 'bg-emerald-950/20 border-emerald-500/50 shadow-emerald-900/20 shadow-md' 
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}>
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-200 flex items-center gap-1.5 text-xs">
                              <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                              <span>Foto Sinematik (Latar Tetap)</span>
                            </span>
                            {customImageBlobUrl && (
                              <span className="text-[10px] bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded-md border border-blue-500/20">
                                Berkas Siap
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Foto lanskap resolusi tinggi (JPG/PNG/WebP, disarankan 1920×1080 atau 4K).
                          </p>

                          {customImageBlobUrl ? (
                            <div className="mt-3 flex items-center gap-3 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                              <img 
                                src={customImageBlobUrl} 
                                alt="Pratinjau Foto Sinematik" 
                                className="w-16 h-11 object-cover rounded-md border border-slate-700 flex-shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="text-[11px] font-medium text-slate-200 truncate">Foto Kustom Tersimpan</div>
                                <div className="text-[9px] text-emerald-400 flex items-center gap-1 mt-0.5">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Tersimpan di IndexedDB browser</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-3 p-3 rounded-lg border border-dashed border-slate-700/80 bg-slate-950/40 text-center">
                              <p className="text-[10px] text-slate-400">Belum ada foto yang diunggah.</p>
                            </div>
                          )}
                        </div>

                        <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center gap-2">
                          {customImageBlobUrl ? (
                            <>
                              <button
                                type="button"
                                onClick={() => updateConfig({ mediaType: 'custom-image' })}
                                className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                                  config.mediaType === 'custom-image'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                                }`}
                              >
                                {config.mediaType === 'custom-image' ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Sedang Digunakan</span>
                                  </>
                                ) : (
                                  <span>Gunakan Sebagai Latar</span>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => fileImageInputRef.current?.click()}
                                title="Ganti foto dengan berkas lain"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
                              >
                                <Upload className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={handleDeleteCustomImage}
                                title="Hapus foto kustom"
                                className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => fileImageInputRef.current?.click()}
                              className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Pilih &amp; Unggah Foto Sinematik</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* CARD 2: Video Sinematik */}
                      <div className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                        config.mediaType === 'custom-video' 
                          ? 'bg-purple-950/20 border-purple-500/50 shadow-purple-900/20 shadow-md' 
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}>
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-200 flex items-center gap-1.5 text-xs">
                              <Video className="w-3.5 h-3.5 text-purple-400" />
                              <span>Video Sinematik (Latar Bergerak)</span>
                            </span>
                            {customVideoBlobUrl && (
                              <span className="text-[10px] bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded-md border border-purple-500/20">
                                Berkas Siap
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Video berputar otomatis (looping MP4/WebM, disarankan durasi 10–60 detik).
                          </p>

                          {customVideoBlobUrl ? (
                            <div className="mt-3 flex items-center gap-3 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                              <video 
                                src={customVideoBlobUrl} 
                                muted 
                                autoPlay 
                                loop 
                                playsInline 
                                className="w-16 h-11 object-cover rounded-md border border-slate-700 flex-shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="text-[11px] font-medium text-slate-200 truncate">Video Kustom Tersimpan</div>
                                <div className="text-[9px] text-purple-300 flex items-center gap-1 mt-0.5">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Tersimpan di IndexedDB browser</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-3 p-3 rounded-lg border border-dashed border-slate-700/80 bg-slate-950/40 text-center">
                              <p className="text-[10px] text-slate-400">Belum ada video yang diunggah.</p>
                            </div>
                          )}
                        </div>

                        <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center gap-2">
                          {customVideoBlobUrl ? (
                            <>
                              <button
                                type="button"
                                onClick={() => updateConfig({ mediaType: 'custom-video' })}
                                className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                                  config.mediaType === 'custom-video'
                                    ? 'bg-purple-600 text-white shadow-sm'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                                }`}
                              >
                                {config.mediaType === 'custom-video' ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Sedang Digunakan</span>
                                  </>
                                ) : (
                                  <span>Gunakan Sebagai Latar</span>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => fileVideoInputRef.current?.click()}
                                title="Ganti video dengan berkas lain"
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
                              >
                                <Upload className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={handleDeleteCustomVideo}
                                title="Hapus video kustom"
                                className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => fileVideoInputRef.current?.click()}
                              className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>Pilih &amp; Unggah Video Sinematik</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Kontrol Tambahan Video jika Video Aktif */}
                    {(config.mediaType === 'custom-video' || config.mediaType === 'video-url') && (
                      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-slate-300 text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Audio Latar:</span>
                          <button
                            type="button"
                            onClick={() => updateConfig({ videoMuted: !config.videoMuted })}
                            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                              config.videoMuted
                                ? 'bg-slate-800 text-slate-400 border border-slate-700'
                                : 'bg-emerald-600 text-white shadow-sm'
                            }`}
                          >
                            {config.videoMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                            <span>{config.videoMuted ? 'Muted (Bisu)' : 'Suara Aktif'}</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">Kecepatan Putar:</span>
                          {[0.5, 0.75, 1, 1.25].map((speed) => (
                            <button
                              key={speed}
                              type="button"
                              onClick={() => updateConfig({ videoSpeed: speed })}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                                config.videoSpeed === speed
                                  ? 'bg-purple-600 text-white font-bold'
                                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60'
                              }`}
                            >
                              {speed}x
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 2: TEKS & BRANDING (KUSTOM NAMA, SUBJUDUL, ALAMAT)   */}
              {/* ======================================================== */}
              {activeCustomizeTab === 'text' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300">Nama Rumah Sakit</label>
                    <input
                      type="text"
                      value={config.hospitalName}
                      onChange={(e) => updateConfig({ hospitalName: e.target.value })}
                      placeholder="Contoh: RUMAH SAKIT UMUM DAERAH AL-MULK KOTA SUKABUMI"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300">Instansi / Label Header Atas</label>
                    <input
                      type="text"
                      value={config.agencyName}
                      onChange={(e) => updateConfig({ agencyName: e.target.value })}
                      placeholder="Contoh: PEMERINTAH KOTA SUKABUMI"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300">Nama Aplikasi Utama</label>
                    <input
                      type="text"
                      value={config.appName}
                      onChange={(e) => updateConfig({ appName: e.target.value })}
                      placeholder="Contoh: AL-MULK MARKET INTELLIGENCE"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 font-extrabold uppercase"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300">Tagline / Deskripsi Sistem</label>
                    <textarea
                      rows={3}
                      value={config.tagline}
                      onChange={(e) => updateConfig({ tagline: e.target.value })}
                      placeholder="Deskripsi singkat fungsi aplikasi..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-300">Alamat / Lokasi</label>
                      <input
                        type="text"
                        value={config.address}
                        onChange={(e) => updateConfig({ address: e.target.value })}
                        placeholder="Alamat RS..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-300">Teks Tombol Masuk</label>
                      <input
                        type="text"
                        value={config.ctaText}
                        onChange={(e) => updateConfig({ ctaText: e.target.value })}
                        placeholder="Contoh: Masuk ke Menu Utama"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 3: VISUAL, KECERAHAN & EFEK SINEMATIK                */}
              {/* ======================================================== */}
              {activeCustomizeTab === 'effects' && (
                <div className="space-y-5">
                  {/* Warna Aksen Tema */}
                  <div className="space-y-2">
                    <label className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Warna Aksen Tema Antarmuka</span>
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {[
                        { id: 'emerald', label: 'Zamrud', color: 'bg-emerald-500' },
                        { id: 'teal', label: 'Teal', color: 'bg-teal-500' },
                        { id: 'blue', label: 'Biru', color: 'bg-blue-500' },
                        { id: 'amber', label: 'Emas/Amber', color: 'bg-amber-500' },
                        { id: 'rose', label: 'Rose/Merah', color: 'bg-rose-500' },
                        { id: 'violet', label: 'Violet', color: 'bg-purple-500' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => updateConfig({ accentColor: item.id as AccentColorTheme })}
                          className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                            config.accentColor === item.id
                              ? 'border-white bg-slate-800 shadow-lg scale-105'
                              : 'border-slate-700 bg-slate-900/60 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-full ${item.color}`} />
                          <span className="text-[10px] font-semibold">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Kecerahan Latar Slider */}
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <Sun className="w-3.5 h-3.5 text-amber-400" />
                        <span>Tingkat Kecerahan Latar (Brightness)</span>
                      </span>
                      <span className="font-mono text-emerald-400 font-bold">{config.brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min={70}
                      max={140}
                      value={config.brightness}
                      onChange={(e) => updateConfig({ brightness: Number(e.target.value) })}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>70% (Teduh)</span>
                      <span>102% (Default Cerah)</span>
                      <span>140% (Maksimal Terang)</span>
                    </div>
                  </div>

                  {/* Kontras Slider */}
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">Ketajaman &amp; Kontras (Contrast)</span>
                      <span className="font-mono text-emerald-400 font-bold">{config.contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min={80}
                      max={130}
                      value={config.contrast}
                      onChange={(e) => updateConfig({ contrast: Number(e.target.value) })}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>80% (Soft)</span>
                      <span>105% (Natural)</span>
                      <span>130% (Tajam)</span>
                    </div>
                  </div>

                  {/* Lapisan Bayangan Transparansi (Overlay) */}
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">Intensitas Bayangan Layar (Overlay Dimmer)</span>
                      <span className="font-mono text-emerald-400 font-bold">{config.overlayOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={75}
                      value={config.overlayOpacity}
                      onChange={(e) => updateConfig({ overlayOpacity: Number(e.target.value) })}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>10% (Sangat Jernih Transparan)</span>
                      <span>35% (Optimal)</span>
                      <span>75% (Lebih Gelap)</span>
                    </div>
                  </div>

                  {/* Gerak Sinematik Ken-Burns */}
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-200">Gerakan Kamera Sinematik (Ken-Burns)</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Animasi *slow-zoom* halus dan dinamis pada foto latar belakang</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateConfig({ enableCinematicMotion: !config.enableCinematicMotion })}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                        config.enableCinematicMotion ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                      }`}
                    >
                      <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                    </button>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 4: PERILAKU & NAVIGASI                              */}
              {/* ======================================================== */}
              {activeCustomizeTab === 'behavior' && (
                <div className="space-y-4">
                  {/* Selalu Tampilkan Welcome Screen */}
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-200">Tampilkan Setiap Buka Aplikasi</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Jika dimatikan, sistem akan langsung membuka menu utama dashboard
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateConfig({ alwaysShowOnStartup: !config.alwaysShowOnStartup })}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                        config.alwaysShowOnStartup ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                      }`}
                    >
                      <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                    </button>
                  </div>

                  {/* Hitung Mundur Otomatis */}
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 space-y-2">
                    <label className="font-semibold text-slate-200">Otomatis Masuk Menu Utama (Timer)</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'Manual (Klik)', val: 0 },
                        { label: '3 Detik', val: 3 },
                        { label: '5 Detik', val: 5 },
                        { label: '10 Detik', val: 10 },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => updateConfig({ autoEnterSeconds: item.val })}
                          className={`py-2 px-2 rounded-xl border text-center transition-all ${
                            config.autoEnterSeconds === item.val
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tampilkan Tombol Pintasan Cepat */}
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-200">Tombol Pintasan Modul Cepat</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Tampilkan tombol langsung ke KPI, Kunjungan Marketing, dan Peta Wilayah
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateConfig({ showQuickShortcuts: !config.showQuickShortcuts })}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                        config.showQuickShortcuts ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                      }`}
                    >
                      <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                    </button>
                  </div>

                  {/* Tampilkan Bar Status Bawah */}
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-200">Bar Info &amp; Statistik di Bawah Layar</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Tampilkan jumlah data rekaman dan tahun kunjungan di bagian bawah
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateConfig({ showFooterStats: !config.showFooterStats })}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                        config.showFooterStats ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                      }`}
                    >
                      <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer with Actions */}
            <div className="px-6 py-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetToDefault}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition-colors"
                title="Kembalikan semua teks, foto, dan efek ke bawaan awal"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset ke Standar Al-Mulk</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCustomizeOpen(false)}
                className={`px-5 py-2 rounded-xl bg-gradient-to-r ${accent.btnGrad} text-slate-950 font-bold text-xs transition-all shadow-md hover:scale-105 active:scale-95`}
              >
                Simpan &amp; Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
