'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { 
  CheckCircle2, MapPin, X, Send, Lock,
  Share2, ArrowLeft, Activity, School, UserCircle2, 
  Clock, Star, ShieldCheck, AlertTriangle, Search, BookOpen, 
  Link as LinkIcon, FileText, GraduationCap, Medal, Target, RefreshCw, ChevronRight, MessageSquare,
  Video, Crown, Upload, Trash2, Sparkles
} from 'lucide-react';
import Link from 'next/link';

import { AvatarWithBorder } from '@/components/AnimatedBorders'; 

interface AthleteSport {
  id: string;
  athlete_id: string;
  sport_name: string;
  position: string | null;
  level_of_play: string | null;
  athleticism_tier: string | null;
  custom_fit_score: number;
  metrics: { name: string; value: string }[];
  meta_context: { accolades?: any[], schoolSize?: string } | null;
  is_active: boolean;
}

interface AthleteProfile {
  id: string;
  first_name: string;
  last_name: string;
  high_school: string;
  state: string;
  grad_year: number;
  trust_level: number;
  gender: string;
  avatar_url?: string;
  equipped_border?: string | null;
  equipped_card?: string | null;
  equipped_title?: string | null; 
  profile_views?: number; 
  search_appearances?: number;
  saved_resume?: string | null;
  custom_slug?: string | null;
  is_founder?: boolean;
  is_premium?: boolean;
}

interface SavedHighlightPost {
  postId: string;
  cloudflareUid: string;
  sport: string;
  caption: string;
  createdAt: string;
}

const EARNED_TITLES = [
  { id: 'legend', name: 'Legend', reqPercentile: 0.01, badgeClass: 'legend-badge', unlockText: 'Reach Top 1%' },
  { id: 'champion', name: 'Champion', reqPercentile: 0.05, badgeClass: 'champion-badge', unlockText: 'Reach Top 5%' },
  { id: 'elite', name: 'Elite', reqPercentile: 0.15, badgeClass: 'elite-badge', unlockText: 'Reach Top 15%' },
  { id: 'master', name: 'Master', reqPercentile: 0.30, badgeClass: 'bg-blue-100 text-blue-800 border border-blue-300', unlockText: 'Reach Top 30%' },
  { id: 'contender', name: 'Contender', reqPercentile: 0.50, badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300', unlockText: 'Reach Top 50%' },
  { id: 'challenger', name: 'Challenger', reqPercentile: 0.75, badgeClass: 'bg-orange-100 text-orange-800 border border-orange-300', unlockText: 'Reach Top 75%' },
  { id: 'prospect', name: 'Prospect', reqPercentile: 1.0, badgeClass: 'bg-slate-100 text-slate-600 border border-slate-300', unlockText: 'Standard Rank' },
];

const getOrdinal = (n: number | string) => {
  if (!n) return n;
  const num = Number(n);
  if (isNaN(num)) return n;
  const s = ["th", "st", "nd", "rd"];
  const v = num % 100;
  return num + (s[(v - 20) % 10] || s[v] || s[0]);
};

// 🚨 CLOUDFLARE STREAM PORTFOLIO VIDEO PLAYER 🚨
const CloudflareStreamVideo = ({ uid }: { uid: string }) => {
  const [isReady, setIsReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    let attempts = 0;
    let timeoutId: NodeJS.Timeout;
    let isMounted = true;

    const checkReady = async () => {
      if (!isMounted) return;
      attempts++;
      
      try {
        const response = await fetch(`https://customer-4lk9yxcqvek697fx.cloudflarestream.com/${uid}/manifest/video.m3u8`);
        if (response.ok) {
          setTimeout(() => {
            if (isMounted) setIsReady(true);
          }, 800);
        } else {
          throw new Error("Manifest not ready");
        }
      } catch (e) {
        if (attempts < 60) {
          timeoutId = setTimeout(checkReady, 2500);
        }
      }
    };

    checkReady();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [uid]);

  useEffect(() => {
    const handleFullscreenSync = () => {
      const activeFullscreen = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setIsFullscreen(activeFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenSync);
    document.addEventListener('webkitfullscreenchange', handleFullscreenSync);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenSync);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenSync);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-[99999] w-screen h-[100dvh] bg-black flex items-center justify-center rounded-none border-none'
          : 'w-full aspect-video rounded-2xl border border-white/15 bg-[#0B0F19] shadow-2xl'
      }`}
    >
      {!isReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-xl z-20">
          <div className="relative w-12 h-12 flex items-center justify-center mb-3">
            <div className="absolute inset-0 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin"></div>
            <Video className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <span className="text-[10px] font-black text-cyan-300 uppercase tracking-widest animate-pulse">
            Processing Highlight Film...
          </span>
          <p className="text-[11px] font-medium text-slate-400 mt-1.5 text-center px-4">
            Optimizing HD stream for college coaches. Usually ready in under 60 seconds.
          </p>
        </div>
      )}

      {isReady && (
        <iframe
          ref={iframeRef}
          src={`https://customer-4lk9yxcqvek697fx.cloudflarestream.com/${uid}/iframe?controls=true&autoplay=false&loop=true&preload=auto&letterboxColor=transparent`}
          className="border-none absolute inset-0 h-full w-full bg-transparent"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        ></iframe>
      )}
    </div>
  );
};

// 🚨 THEME ENGINE 🚨
const getThemeConfig = (cardType: string | null | undefined) => {
  const safeCardType = cardType === 'default' || !cardType ? 'base' : cardType;
  const isBase = safeCardType === 'base';

  if (isBase) {
    return {
      isDark: false,
      pageBg: 'bg-slate-50',
      pagePattern: 'opacity-[0.03]',
      
      heroCard: 'bg-white/80 backdrop-blur-2xl border-white shadow-[0_8px_30px_rgb(0,0,0,0.08)]',
      heroName: 'text-slate-900',
      heroMeta: 'text-slate-600 font-bold',
      heroDivider: 'text-slate-300',
      btnPrimary: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 border-transparent',
      btnSecondary: 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-sm',
      btnLogin: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm',
      badgeVerified: 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm',
      badgeUnverified: 'bg-slate-100 border-slate-200 text-slate-500 shadow-sm',
      btnSave: 'bg-white text-slate-700 border-slate-200 hover:border-yellow-400 hover:text-yellow-600 hover:bg-yellow-50',

      sectionBg: 'bg-white',
      sectionBorder: 'border-slate-200',
      sectionShadow: 'shadow-xl',
      subCardBg: 'bg-slate-50',
      subCardBorder: 'border-slate-100',
      textHeader: 'text-slate-900',
      textSub: 'text-slate-500',
      textMuted: 'text-slate-400',

      metricBg: 'bg-slate-50 hover:bg-white',
      metricBorder: 'border-slate-200 hover:border-blue-300',
      metricName: 'text-slate-400',
      metricValue: 'text-slate-900',

      accoladeBg: 'bg-slate-50',
      accoladeBorder: 'border-slate-200',
      accoladeText: 'text-slate-800',
      accoladeLabelBg: 'bg-slate-200',
      accoladeLabelText: 'text-slate-700',

      honorBg: 'bg-[#fffdf0]',
      honorBorder: 'border-[#fef08a]',
      honorLabelBg: 'bg-[#e0e7ff]',
      honorLabelText: 'text-[#4f46e5]',

      iconColor: 'text-blue-500',
      statBadge: 'bg-slate-100 border-slate-200 text-slate-700',
    };
  }

  const map: Record<string, any> = {
    obsidian: { glow: 'shadow-[0_0_30px_rgba(71,85,105,0.2)]', border: 'border-slate-600/50', accent: 'text-slate-400', borderHover: 'hover:border-slate-400', ring: 'focus:ring-slate-500' },
    crimson: { glow: 'shadow-[0_0_30px_rgba(239,68,68,0.2)]', border: 'border-red-500/50', accent: 'text-red-400', borderHover: 'hover:border-red-400', ring: 'focus:ring-red-500' },
    sapphire: { glow: 'shadow-[0_0_30px_rgba(59,130,246,0.2)]', border: 'border-blue-500/50', accent: 'text-blue-400', borderHover: 'hover:border-blue-400', ring: 'focus:ring-blue-500' },
    hype: { glow: 'shadow-[0_0_30px_rgba(99,102,241,0.2)]', border: 'border-indigo-500/50', accent: 'text-indigo-400', borderHover: 'hover:border-indigo-400', ring: 'focus:ring-indigo-500' },
    premium: { glow: 'shadow-[0_0_30px_rgba(245,158,11,0.2)]', border: 'border-amber-500/50', accent: 'text-amber-400', borderHover: 'hover:border-amber-400', ring: 'focus:ring-amber-500' },
    amethyst: { glow: 'shadow-[0_0_30px_rgba(217,70,239,0.2)]', border: 'border-fuchsia-500/50', accent: 'text-fuchsia-400', borderHover: 'hover:border-fuchsia-400', ring: 'focus:ring-fuchsia-500' },
    cyber: { glow: 'shadow-[0_0_30px_rgba(6,182,212,0.2)]', border: 'border-cyan-500/50', accent: 'text-cyan-400', borderHover: 'hover:border-cyan-400', ring: 'focus:ring-cyan-500' },
    'mythic-flare': { glow: 'shadow-[0_0_40px_rgba(244,63,94,0.3)]', border: 'border-rose-500/50', accent: 'text-rose-400', borderHover: 'hover:border-rose-400', ring: 'focus:ring-rose-500' },
  };

  const t = map[safeCardType] || map.obsidian;
  const isAnimated = ['hype', 'premium', 'crimson', 'sapphire', 'amethyst', 'cyber', 'mythic-flare'].includes(safeCardType);
  const animationClass = isAnimated ? 'animate-foil' : '';

  return {
    isDark: true,
    pageBg: 'bg-slate-950',
    pagePattern: 'opacity-10',

    heroCard: `holo-card-${safeCardType} border-white/20 shadow-2xl text-white ${animationClass}`,
    heroName: 'text-white drop-shadow-md',
    heroMeta: 'text-white/90 font-medium',
    heroDivider: 'text-white/40',
    btnPrimary: 'bg-white/10 hover:bg-white/20 text-white shadow-lg border border-white/20 backdrop-blur-md',
    btnSecondary: 'bg-black/20 hover:bg-black/30 border border-white/20 text-white shadow-sm backdrop-blur-md',
    btnLogin: 'bg-black/40 hover:bg-black/60 text-white border border-white/20 backdrop-blur-sm shadow-sm',
    badgeVerified: 'bg-black/30 border border-white/20 text-white backdrop-blur-sm shadow-sm',
    badgeUnverified: 'bg-black/30 border border-white/20 text-white/70 backdrop-blur-sm shadow-sm',
    btnSave: 'bg-black/20 text-white border border-white/20 hover:border-yellow-400 hover:text-yellow-400 backdrop-blur-md shadow-sm',

    sectionBg: 'bg-slate-900/60 backdrop-blur-xl',
    sectionBorder: t.border,
    sectionShadow: t.glow,
    subCardBg: 'bg-black/30',
    subCardBorder: 'border-white/10',
    textHeader: 'text-white drop-shadow-md',
    textSub: 'text-white/80',
    textMuted: 'text-white/50',

    metricBg: 'bg-black/40 hover:bg-black/60',
    metricBorder: `border-white/10 ${t.borderHover}`,
    metricName: `${t.accent} opacity-80`,
    metricValue: 'text-white drop-shadow-sm',

    accoladeBg: 'bg-black/40',
    accoladeBorder: `border-white/10 ${t.borderHover}`,
    accoladeText: 'text-white',
    accoladeLabelBg: 'bg-white/10',
    accoladeLabelText: 'text-white/90',

    honorBg: 'bg-black/40',
    honorBorder: t.border,
    honorLabelBg: 'bg-white/10',
    honorLabelText: t.accent,

    iconColor: t.accent,
    statBadge: `bg-black/40 ${t.border} text-white`,
  };
};

export default function AthleteClient() {
  const params = useParams();
  const router = useRouter();
  const rawIdParam = decodeURIComponent(params.id as string);
  const [supabase] = useState(() => createClient());
  
  const [athlete, setAthlete] = useState<AthleteProfile | null>(null);
  const [athleteSports, setAthleteSports] = useState<AthleteSport[]>([]);
  const [highlightPost, setHighlightPost] = useState<SavedHighlightPost | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [viewerRole, setViewerRole] = useState<'guest' | 'athlete' | 'coach'>('guest');
  const [coachType, setCoachType] = useState<string | null>(null);
  const [isVerifiedCoach, setIsVerifiedCoach] = useState(false);
  const [isVerifiedAthlete, setIsVerifiedAthlete] = useState(false);
  const [isSelf, setIsSelf] = useState(false);
  
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // PRO Direct Highlight Video Upload State
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [isDeletingVideo, setIsDeletingVideo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Message Modal State
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [showVerificationRequired, setShowVerificationRequired] = useState(false);
  const [modalMode, setModalMode] = useState<'pitch' | 'chat'>('pitch');
  const [senderName, setSenderName] = useState('');
  const [senderSchool, setSenderSchool] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const MAX_MESSAGE_LENGTH = 500;

  const [copySuccess, setCopySuccess] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const hasLoggedView = useRef(false);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    async function fetchProfileAndUser() {
      const isUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(rawIdParam);
      
      let query = supabase.from('athletes').select('*');
      if (isUUID) {
        query = query.eq('id', rawIdParam);
      } else {
        query = query.eq('custom_slug', rawIdParam);
      }
      
      const { data: athleteData } = await query.maybeSingle();

      if (athleteData) {
        setAthlete(athleteData as AthleteProfile);
        const resolvedAthleteId = athleteData.id;

        // 1. Fetch active sports
        const { data: sportsData } = await supabase
          .from('athlete_sports')
          .select('*')
          .eq('athlete_id', resolvedAthleteId)
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        if (sportsData) setAthleteSports(sportsData as AthleteSport[]);

        // 2. Fetch athlete's posts to find any saved Cloudflare Highlight Video
        const { data: athletePosts } = await supabase
          .from('posts')
          .select('id, content, created_at')
          .eq('athlete_id', resolvedAthleteId)
          .order('created_at', { ascending: false });

        if (athletePosts && athletePosts.length > 0) {
          for (const p of athletePosts) {
            try {
              const parsed = JSON.parse(p.content);
              if (parsed && parsed.cloudflareUid) {
                setHighlightPost({
                  postId: p.id,
                  cloudflareUid: String(parsed.cloudflareUid),
                  sport: parsed.sport || 'Highlight Film',
                  caption: parsed.text || '',
                  createdAt: p.created_at
                });
                break;
              }
            } catch (e) {
              // Ignore plain-text posts
            }
          }
        }

        // 3. Check current logged-in viewer
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setCurrentUserId(session.user.id);
          setCurrentUserEmail(session.user.email || '');

          if (session.user.id === resolvedAthleteId) setIsSelf(true);

          const { data: cData } = await supabase
            .from('coaches')
            .select('id, first_name, last_name, school_name, coach_type')
            .eq('id', session.user.id)
            .maybeSingle();

          if (cData) {
            setViewerRole('coach');
            const hasCompleteProfile = !!(cData.first_name && cData.last_name && cData.school_name);
            setIsVerifiedCoach(hasCompleteProfile);
            setCoachType(cData.coach_type);
            setSenderName(`${cData.first_name || 'Coach'} ${cData.last_name || ''}`.trim());
            setSenderSchool(cData.school_name || 'Unknown University');
            setSenderEmail(session.user.email || '');

            const { data: savedData } = await supabase
              .from('saved_recruits')
              .select('id')
              .eq('coach_id', session.user.id)
              .eq('athlete_id', resolvedAthleteId)
              .maybeSingle();
            if (savedData) setIsSaved(true);

            if (!hasLoggedView.current && session.user.id !== resolvedAthleteId) {
              hasLoggedView.current = true;
              const { error: rpcError } = await supabase.rpc('log_profile_view', {
                target_athlete_id: resolvedAthleteId,
                viewing_coach_id: session.user.id
              });
              if (rpcError) console.error("❌ RPC ERROR:", rpcError);
            }
          } else {
            const { data: aData } = await supabase
              .from('athletes')
              .select('id, trust_level, first_name, last_name, high_school')
              .eq('id', session.user.id)
              .maybeSingle();
            if (aData) {
              setViewerRole('athlete');
              setIsVerifiedAthlete(aData.trust_level === 1);
              setSenderName(`${aData.first_name} ${aData.last_name}`);
              setSenderSchool(aData.high_school || '');
              setSenderEmail(session.user.email || '');
            }
          }
        }
      }
      setLoading(false);
    }

    if (rawIdParam) fetchProfileAndUser();
  }, [rawIdParam, supabase]);

  // 🚨 DIRECT PRO PORTFOLIO HIGHLIGHT VIDEO UPLOADER (MAX 60S) 🚨
  const handlePortfolioVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !athlete || !isSelf || !athlete.is_premium) return;

    if (file.size > 50 * 1024 * 1024) {
      e.target.value = '';
      return showToast("Highlight video must be under 50MB.", "error");
    }

    const videoEl = document.createElement('video');
    videoEl.preload = 'metadata';
    videoEl.onloadedmetadata = async () => {
      window.URL.revokeObjectURL(videoEl.src);
      if (Math.ceil(videoEl.duration) > 60) {
        e.target.value = '';
        return showToast("Highlight video must be 60 seconds or less.", "error");
      }

      setIsUploadingVideo(true);
      setUploadProgressText('Securing stream channel...');

      try {
        const urlRes = await fetch('/api/stream/upload-url', { method: 'POST' });
        const { uploadURL, uid, error: streamErr } = await urlRes.json();
        if (streamErr || !uploadURL || !uid) {
          throw new Error(streamErr || 'Could not generate upload link.');
        }

        setUploadProgressText('Uploading HD highlight video...');
        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await fetch(uploadURL, {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error('Video upload to Cloudflare failed.');
        }

        setUploadProgressText('Pinning to PRO portfolio...');
        const defaultSport = athleteSports[0]?.sport_name || 'Track & Field';

        // If the athlete already has an active post, update its cloudflareUid; otherwise insert a portfolio highlight post
        if (highlightPost?.postId) {
          const { data: existingPost } = await supabase
            .from('posts')
            .select('content')
            .eq('id', highlightPost.postId)
            .maybeSingle();

          let updatedPayload: Record<string, any> = {
            text: highlightPost.caption || `Official ${defaultSport} Highlight Film`,
            sport: highlightPost.sport || defaultSport,
            cloudflareUid: uid
          };

          if (existingPost?.content) {
            try {
              const parsed = JSON.parse(existingPost.content);
              updatedPayload = { ...parsed, cloudflareUid: uid };
            } catch (err) {}
          }

          const { error: updateErr } = await supabase
            .from('posts')
            .update({ content: JSON.stringify(updatedPayload) })
            .eq('id', highlightPost.postId);

          if (updateErr) throw updateErr;

          setHighlightPost({
            ...highlightPost,
            cloudflareUid: uid,
            createdAt: new Date().toISOString()
          });
        } else {
          const payload = {
            text: `Official ${defaultSport} Highlight Film`,
            sport: defaultSport,
            honors: 'PRO Highlight Film',
            score: athleteSports[0]?.custom_fit_score || null,
            stats: athleteSports[0]?.metrics || [],
            gpa: null,
            otherSports: [],
            cloudflareUid: uid
          };

          const { data: newPost, error: insertErr } = await supabase
            .from('posts')
            .insert({
              athlete_id: athlete.id,
              content: JSON.stringify(payload),
              channel: 'highlight',
              is_boosted: false,
              boosted_until: new Date().toISOString()
            })
            .select('id, created_at')
            .single();

          if (insertErr) throw insertErr;

          setHighlightPost({
            postId: newPost.id,
            cloudflareUid: uid,
            sport: defaultSport,
            caption: payload.text,
            createdAt: newPost.created_at
          });
        }

        showToast("Highlight video pinned to your PRO portfolio!", "success");
      } catch (err: any) {
        showToast(err.message || "Failed to upload highlight video.", "error");
      } finally {
        setIsUploadingVideo(false);
        setUploadProgressText('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    videoEl.onerror = () => {
      e.target.value = '';
      showToast("Invalid or corrupted video file.", "error");
    };
    videoEl.src = URL.createObjectURL(file);
  };

  const handleRemoveHighlightVideo = async () => {
    if (!highlightPost || !isSelf || !athlete) return;
    setIsDeletingVideo(true);

    try {
      const { data: existingPost } = await supabase
        .from('posts')
        .select('channel, content')
        .eq('id', highlightPost.postId)
        .maybeSingle();

      if (existingPost?.channel === 'highlight') {
        const { error } = await supabase.from('posts').delete().eq('id', highlightPost.postId);
        if (error) throw error;
      } else if (existingPost?.content) {
        // If it's an active featured post on /feed, keep the post but remove the video UID
        const parsed = JSON.parse(existingPost.content);
        parsed.cloudflareUid = null;
        const { error } = await supabase
          .from('posts')
          .update({ content: JSON.stringify(parsed) })
          .eq('id', highlightPost.postId);
        if (error) throw error;
      }

      setHighlightPost(null);
      showToast("Highlight video removed from portfolio.", "success");
    } catch (err: any) {
      showToast("Failed to remove highlight video.", "error");
    } finally {
      setIsDeletingVideo(false);
    }
  };

  const handleBackNavigation = () => {
    if (typeof window !== 'undefined') {
      const fallbackRoute = viewerRole === 'coach' ? '/dashboard/coach' 
                          : viewerRole === 'athlete' ? '/dashboard/profile' 
                          : '/search';

      if (window.history.length > 2) {
        router.back();
      } else {
        router.push(fallbackRoute);
      }
    }
  };

  const handleToggleSave = async () => {
    if (!currentUserId || viewerRole !== 'coach' || !athlete) return;
    setIsSaving(true);
    try {
      if (isSaved) {
        await supabase.from('saved_recruits').delete().eq('coach_id', currentUserId).eq('athlete_id', athlete.id);
        setIsSaved(false);
      } else {
        await supabase.from('saved_recruits').insert({ coach_id: currentUserId, athlete_id: athlete.id });
        setIsSaved(true);
      }
    } catch (err: any) { 
      showToast(`Failed to update watchlist: ${err.message}`, 'error'); 
    } finally { 
      setIsSaving(false); 
    }
  };

  const handleContactClick = () => {
    if (viewerRole === 'guest' || !currentUserId) {
      showToast("Please log in to contact athletes.", 'error');
      router.push('/login');
      return;
    }
    if (viewerRole === 'coach' && !isVerifiedCoach) {
      showToast("Please complete your coach profile to send direct pitches.", 'error');
      return;
    }
    if (viewerRole === 'athlete' && !isVerifiedAthlete) {
      setShowVerificationRequired(true);
      return;
    }

    const mode = (viewerRole === 'coach' && coachType === 'college') ? 'pitch' : 'chat';
    setModalMode(mode);
    setIsMessageModalOpen(true);
    
    setTimeout(() => messageInputRef.current?.focus(), 100);
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= MAX_MESSAGE_LENGTH) {
      setMessageContent(val);
      setCharCount(val.length);
    }
  };

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!athlete) return;
    setIsSending(true);
    
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const checkEmail = currentUserEmail || senderEmail;
      
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('sender_email', checkEmail)
        .gte('created_at', twentyFourHoursAgo);

      if (count !== null && count >= 10) {
        showToast("Daily Limit Reached: Only 10 connection requests per day allowed.", 'error');
        setIsSending(false);
        return;
      }

      const { error } = await supabase.from('messages').insert({
        athlete_id: athlete.id,
        sender_name: senderName, 
        sender_school: senderSchool, 
        sender_email: senderEmail, 
        content: messageContent,
        status: 'pending' 
      });
      
      if (error) throw error;
      
      setSendSuccess(true);
      setTimeout(() => {
        setIsMessageModalOpen(false);
        setSendSuccess(false);
        setMessageContent('');
        setCharCount(0);
      }, 2000);
    } catch (error: any) { 
      showToast(`Failed to send message: ${error.message}`, 'error'); 
    } finally { 
      setIsSending(false); 
    }
  };

  const handleCopyLink = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${athlete?.first_name} ${athlete?.last_name} | Official Athletic Portfolio`,
          text: `Check out my verified stats and national rank on my ChasedSports Portfolio! 📈`,
          url: url,
        });
        return; 
      } catch (err) { console.log('Native share canceled or failed:', err); }
    } 
    navigator.clipboard.writeText(url);
    setCopySuccess(true);
    showToast("Portfolio link copied to clipboard!", "success");
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const renderAccoladeBadge = (acc: any, idx: number, theme: any) => {
    if (acc.type === 'Honor' || (!acc.placement && acc.text)) {
      return (
        <div key={idx} className={`inline-flex items-center ${theme.honorBg} border ${theme.honorBorder} rounded-xl pl-1.5 pr-3 py-1.5 gap-2 shadow-sm transition-all hover:shadow-md`}>
          <span className={`${theme.honorLabelBg} ${theme.honorLabelText} text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg`}>
            HONOR
          </span>
          <span className={`text-xs sm:text-sm font-bold ${theme.accoladeText}`}>{acc.text}</span>
        </div>
      );
    }
    
    const isHS = acc.type === 'HS_Team';
    const isClub = acc.type === 'Club_Team';
    const isInd = acc.type === 'Individual';
    const context = isHS ? 'HS' : isClub ? 'Club' : isInd ? 'Ind' : '';
    
    let placementText = acc.placement || acc.text;
    if (typeof placementText === 'number' || /^\d+$/.test(placementText)) {
      placementText = `${getOrdinal(placementText)} Place`;
    }
    
    const levelText = acc.level || 'Rank';
    const fullContext = context ? `${levelText} ${context}` : levelText;

    return (
      <div key={idx} className={`inline-flex items-center ${theme.accoladeBg} border ${theme.accoladeBorder} rounded-xl pl-1.5 pr-3 py-1.5 gap-2 shadow-sm transition-all hover:shadow-md`}>
        <span className={`${theme.accoladeLabelBg} ${theme.accoladeLabelText} text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg whitespace-nowrap`}>
          {fullContext}
        </span>
        <div className="flex flex-col">
          <span className={`text-xs sm:text-sm font-bold ${theme.accoladeText} leading-tight`}>
            {placementText}
          </span>
          {acc.contribution && (
            <span className={`text-[9px] font-bold ${theme.textMuted} uppercase tracking-widest mt-0.5 leading-none`}>
              {acc.contribution}
            </span>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="w-14 h-14 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold mt-4 animate-pulse tracking-widest uppercase text-xs">Loading Vault...</p>
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-400/10 blur-[120px] rounded-full pointer-events-none"></div>
        <Activity className="w-16 h-16 text-slate-300 mb-4 z-10" />
        <h1 className="text-3xl font-black text-slate-900 mb-2 z-10 tracking-tight">Portfolio Not Found</h1>
        <p className="text-slate-500 mb-6 z-10 font-medium">This athlete's portfolio may have been removed, or the link is incorrect.</p>
        <button onClick={() => router.push('/')} className="bg-blue-600 text-white font-black px-6 py-3 rounded-xl z-10 shadow-lg hover:scale-[1.02] transition-transform">Return Home</button>
      </div>
    );
  }

  const activeTitle = EARNED_TITLES.find(t => t.id === athlete.equipped_title) || EARNED_TITLES[6];
  const isVerified = athlete.trust_level > 0;
  const isProAthlete = Boolean(athlete.is_premium);
  
  const theme = getThemeConfig(athlete.equipped_card);

  let parsedResume = { gpa: '', accolades: [] as string[], schoolPrefs: '' };
  if (athlete.saved_resume) {
    try {
      const parsed = JSON.parse(athlete.saved_resume);
      parsedResume = {
        gpa: parsed.gpa || '',
        accolades: parsed.accolades || [],
        schoolPrefs: parsed.schoolPrefs || ''
      };
    } catch (e) {
      parsedResume.schoolPrefs = athlete.saved_resume;
    }
  }

  let backgroundEffects = <div className={`absolute top-0 right-0 w-[500px] h-[500px] ${theme.isDark ? 'bg-white/5' : 'bg-blue-500/10'} blur-[100px] rounded-full pointer-events-none z-0`}></div>;

  if (theme.isDark) {
    backgroundEffects = (
      <>
        {['hype', 'premium', 'mythic-flare'].includes(athlete.equipped_card || '') && <div className="holo-glare rounded-[2.5rem]"></div>}
        {['hype', 'premium', 'crimson', 'sapphire', 'amethyst', 'cyber', 'mythic-flare'].includes(athlete.equipped_card || '') && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] mix-blend-overlay pointer-events-none rounded-[2.5rem]"></div>}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 blur-[100px] rounded-full pointer-events-none z-0"></div>
      </>
    );
  }

  return (
    <main className={`min-h-screen ${theme.pageBg} font-sans pb-32 relative overflow-hidden transition-colors duration-500`} itemScope itemType="https://schema.org/ProfilePage">
      
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className={`absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] ${theme.pagePattern}`}></div>
        <div className={`absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] ${theme.isDark ? 'bg-blue-900/10' : 'bg-blue-400/10'} blur-[120px] rounded-full transition-colors duration-500`}></div>
        <div className={`absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] ${theme.isDark ? 'bg-indigo-900/10' : 'bg-indigo-400/10'} blur-[120px] rounded-full transition-colors duration-500`}></div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmerSlow { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes foilShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes shimmerGlare { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes cyberScan { 0% { transform: translateY(-100%); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(1000%); opacity: 0; } }
        @keyframes voidPulse { 0%, 100% { background-size: 100% 100%; filter: brightness(1); } 50% { background-size: 120% 120%; filter: brightness(1.2); } }
        
        .legend-badge { background: linear-gradient(90deg, #6b21a8 0%, #d946ef 20%, #6b21a8 40%, #d946ef 60%, #6b21a8 80%); background-size: 200% auto; animation: shimmerSlow 4s linear infinite; color: white; border: 1px solid #e879f9; box-shadow: 0 0 15px rgba(217, 70, 239, 0.5); font-weight: 900; }
        .champion-badge { background: linear-gradient(90deg, #991b1b 0%, #ef4444 20%, #991b1b 40%, #ef4444 60%, #991b1b 80%); background-size: 200% auto; animation: shimmerSlow 4s linear infinite; color: white; border: 1px solid #f87171; box-shadow: 0 0 15px rgba(239, 68, 68, 0.5); font-weight: 900; }
        .elite-badge { background: linear-gradient(90deg, #0f172a 0%, #475569 20%, #0f172a 40%, #475569 60%, #0f172a 80%); background-size: 200% auto; animation: shimmerSlow 4s linear infinite; color: white; border: 1px solid #94a3b8; box-shadow: 0 0 15px rgba(148, 163, 184, 0.3); font-weight: 900; }
        
        .holo-card-base { background: transparent; }
        .holo-card-obsidian { background: linear-gradient(135deg, #0f172a 0%, #334155 25%, #000000 50%, #0f172a 75%, #1e293b 100%); background-size: 300% 300%; }
        .holo-card-crimson { background: linear-gradient(135deg, #450a0a 0%, #dc2626 50%, #450a0a 100%); background-size: 300% 300%; }
        .holo-card-sapphire { background: linear-gradient(135deg, #172554 0%, #0ea5e9 50%, #172554 100%); background-size: 300% 300%; }
        
        .holo-card-hype { 
          background: 
            linear-gradient(135deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent 100%),
            linear-gradient(135deg, #4f46e5 0%, #9333ea 25%, #ec4899 50%, #3b82f6 75%, #4f46e5 100%); 
          background-size: 40px 40px, 300% 300%; 
        }

        .holo-card-premium { 
          background: 
            repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 6px),
            linear-gradient(135deg, #b45309 0%, #f59e0b 25%, #fef08a 50%, #d97706 75%, #78350f 100%); 
          background-size: 100% 100%, 300% 300%; 
        }

        .holo-card-amethyst { 
          background: radial-gradient(circle at 50% 50%, #c026d3 0%, #7e22ce 30%, #3b0764 80%, #000000 100%); 
          animation: voidPulse 6s ease-in-out infinite;
        }
        .holo-card-amethyst::before {
          content: ''; position: absolute; inset: 0; pointer-events: none; opacity: 0.1;
          background-image: repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 2px, #fff 3px, #fff 4px);
        }

        .holo-card-cyber { 
          background: 
            linear-gradient(rgba(16, 185, 129, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.15) 1px, transparent 1px),
            linear-gradient(135deg, #022c22 0%, #064e3b 50%, #083344 100%);
          background-size: 20px 20px, 20px 20px, 100% 100%;
          box-shadow: inset 0 0 40px rgba(6, 182, 212, 0.3);
        }
        .holo-card-cyber::after {
          content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 8px;
          background: rgba(34, 211, 238, 0.8); filter: blur(3px); box-shadow: 0 0 20px #22d3ee;
          animation: cyberScan 3s linear infinite;
        }

        .holo-card-mythic-flare {
          background: radial-gradient(circle at 50% 50%, #f43f5e 0%, #881337 40%, #000000 100%);
          animation: voidPulse 8s ease-in-out infinite;
        }

        .animate-foil { animation: foilShift 15s ease-in-out infinite; }
        .holo-glare { position: absolute; inset: 0; background: linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.4) 25%, transparent 30%); background-size: 200% auto; animation: shimmerGlare 8s infinite linear; pointer-events: none; z-index: 10; mix-blend-mode: overlay;}
      `}} />

      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-5 fade-in duration-300">
          <div className={`rounded-full px-6 py-3 shadow-2xl flex items-center gap-3 font-bold text-sm border ${toast.type === 'error' ? 'bg-red-900 text-white border-red-700' : 'bg-slate-900 text-white border-slate-700'}`}>
            {toast.type === 'error' ? <X className="w-4 h-4 text-red-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />} {toast.message}
          </div>
        </div>
      )}

      {showVerificationRequired && (
        <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-200 flex flex-col items-center relative">
            <button onClick={() => setShowVerificationRequired(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-5 border border-amber-200">
              <Lock className="w-7 h-7 text-amber-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Verification Required</h2>
            <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
              To protect the community from spam and maintain a trusted ecosystem, you must verify your identity before sending direct messages.
            </p>
            <Link href="/dashboard/profile" className="bg-slate-900 hover:bg-slate-800 text-white font-black py-3.5 px-6 rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 w-full">
              Verify My Account <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 relative z-10">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <button onClick={handleBackNavigation} className={`inline-flex items-center text-sm font-bold transition-colors px-4 py-2 rounded-xl border shadow-sm ${theme.isDark ? 'bg-white/10 text-white hover:bg-white/20 border-white/20 backdrop-blur-md' : 'bg-white text-slate-500 hover:text-slate-900 border-slate-200'}`} aria-label="Go Back">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </button>

          {isSelf && (
            <div className="flex flex-wrap items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border shadow-sm ${theme.isDark ? 'bg-white/10 text-white border-white/20 backdrop-blur-md' : 'bg-white text-slate-600 border-slate-200'}`}>
                <Search className={`w-4 h-4 ${theme.isDark ? 'text-blue-400' : 'text-blue-500'}`} />
                <span className="text-xs font-bold uppercase tracking-widest">{athlete.search_appearances || 0} <span className="hidden sm:inline">Search Views</span></span>
              </div>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border shadow-sm ${theme.isDark ? 'bg-white/10 text-white border-white/20 backdrop-blur-md' : 'bg-white text-slate-600 border-slate-200'}`}>
                <Activity className={`w-4 h-4 ${theme.isDark ? 'text-emerald-400' : 'text-emerald-500'}`} />
                <span className="text-xs font-bold uppercase tracking-widest">{athlete.profile_views || 0} <span className="hidden sm:inline">Profile Clicks</span></span>
              </div>
              <Link 
                href="/dashboard/profile"
                className={`font-black py-2 px-4 rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all flex items-center gap-2 text-xs uppercase tracking-widest ${theme.isDark ? 'bg-indigo-500 hover:bg-indigo-400 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
              >
                <LinkIcon className="w-4 h-4" /> Edit Public URL
              </Link>
            </div>
          )}
        </div>

        {/* HERO CARD */}
        <section itemScope itemProp="mainEntity" itemType="https://schema.org/Person" className={`rounded-[2.5rem] p-6 sm:p-8 md:p-12 border relative overflow-hidden mb-8 transition-all duration-500 ${theme.heroCard}`}>
          {backgroundEffects}
          
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
            
            <AvatarWithBorder 
              avatarUrl={athlete.avatar_url || null} 
              borderId={athlete.equipped_border} 
              sizeClasses="w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 shadow-xl"
            />

            <div className="flex-1 text-center md:text-left w-full flex flex-col">
              
              <div className="mb-2">
                <span className={`text-[10px] font-black uppercase tracking-widest flex items-center justify-center md:justify-start gap-1.5 opacity-80 ${theme.heroName}`}>
                  <BookOpen className="w-3.5 h-3.5" /> Athletic Portfolio
                </span>
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-2 justify-center md:justify-start">
                <h1 itemProp="name" className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tight ${theme.heroName}`}>
                  <span itemProp="givenName">{athlete.first_name}</span> <span itemProp="familyName">{athlete.last_name}</span>
                </h1>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  {isVerified ? (
                    <div className={`inline-flex items-center border px-3 py-1 rounded-full w-max ${theme.badgeVerified}`}>
                      <ShieldCheck className="w-4 h-4 mr-1.5" />
                      <span className="text-xs font-bold uppercase tracking-widest">Verified Indexed</span>
                    </div>
                  ) : (
                    <div className={`inline-flex items-center border px-3 py-1 rounded-full w-max ${theme.badgeUnverified}`}>
                      <span title="This profile's results are self-reported and not officially indexed.">
                        <AlertTriangle className="w-4 h-4 mr-1.5 inline" />
                      </span>
                      <span className="text-xs font-bold uppercase tracking-widest">Unverified</span>
                    </div>
                  )}

                  {isProAthlete && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                      <Crown className="w-3.5 h-3.5" /> PRO
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase text-white shadow-sm ${activeTitle.badgeClass}`}>
                  {activeTitle.name} Rank
                </span>
                {athlete.is_founder && (
                  <span className="ml-2 inline-block px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase text-amber-950 bg-gradient-to-r from-amber-300 to-yellow-400 shadow-sm border border-yellow-200">
                    Founder's Club
                  </span>
                )}
              </div>
              
              <p className={`text-sm sm:text-base md:text-lg mb-8 flex flex-col md:flex-row items-center gap-2 md:gap-4 justify-center md:justify-start text-balance ${theme.heroMeta}`}>
                <span className="flex items-center bg-black/5 rounded-lg px-3 py-1.5" itemProp="alumniOf" itemScope itemType="https://schema.org/EducationalOrganization">
                  <MapPin className="w-4 h-4 md:w-5 md:h-5 mr-2 shrink-0 opacity-70" /> 
                  <span itemProp="name" className="font-bold">{athlete.high_school}</span>
                  {athlete.state && <span itemProp="address" className="ml-1">, {athlete.state}</span>}
                </span>
                <span className={`hidden md:inline ${theme.heroDivider}`}>•</span>
                <span className="bg-black/5 rounded-lg px-3 py-1.5 font-bold">Class of {athlete.grad_year || '202X'}</span>
                <span className={`hidden md:inline ${theme.heroDivider}`}>•</span>
                <span className="bg-black/5 rounded-lg px-3 py-1.5 font-bold">{athlete.gender || 'Boys'} Division</span>
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full mt-auto">
                {!isSelf && (
                  <>
                    {viewerRole === 'guest' ? (
                      <Link href="/login" className={`w-full sm:w-auto font-bold py-3.5 px-8 rounded-xl transition-colors flex items-center justify-center gap-2 border ${theme.btnLogin}`}>
                        <Lock className="w-5 h-5" /> Log in to Connect
                      </Link>
                    ) : (viewerRole === 'coach' && !isVerifiedCoach) ? (
                      <div className={`w-full sm:w-auto font-bold py-3.5 px-8 rounded-xl flex items-center justify-center gap-2 border ${theme.btnLogin}`}>
                        <Lock className="w-5 h-5" /> Update Profile to Message
                      </div>
                    ) : (
                      <button onClick={handleContactClick} className={`w-full sm:w-auto font-black py-3.5 px-10 rounded-xl transition-transform active:scale-[0.98] flex items-center justify-center gap-2 ${theme.btnPrimary}`}>
                        <MessageSquare className="w-5 h-5" /> Message Athlete
                      </button>
                    )}

                    {viewerRole === 'coach' && (
                      <button 
                        onClick={handleToggleSave} 
                        disabled={isSaving} 
                        className={`w-full sm:w-auto py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 font-bold ${
                          isSaved 
                            ? 'bg-yellow-50 text-yellow-600 border-yellow-300 shadow-sm' 
                            : `${theme.btnSave} border shadow-sm`
                        }`}
                      >
                        <Star className={`w-5 h-5 transition-colors ${isSaved ? 'fill-yellow-500 text-yellow-500' : 'opacity-70 group-hover:text-yellow-500'}`} />
                        {isSaved ? 'Saved to Watchlist' : 'Save Recruit'}
                      </button>
                    )}
                  </>
                )}
                
                <button onClick={handleCopyLink} className={`w-full sm:w-auto font-black py-3.5 px-6 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 border ${theme.btnSecondary}`}>
                  {copySuccess ? <><CheckCircle2 className="w-5 h-5" /> Copied!</> : <><Share2 className="w-5 h-5" /> Share Portfolio</>}
                </button>
              </div>
            </div>
          </div>
        </section>

        {viewerRole === 'coach' && !isVerified && (
          <div className={`border p-5 rounded-2xl mb-8 flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-4 ${theme.isDark ? 'bg-amber-950/30 border-amber-500/50 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
            <AlertTriangle className={`w-6 h-6 shrink-0 mt-0.5 ${theme.isDark ? 'text-amber-400' : 'text-amber-500'}`} />
            <div>
              <h4 className="font-black text-sm">Unofficial Data Notice</h4>
              <p className="text-sm font-medium mt-1">This athlete has not yet linked their Athletic.net profile. The times listed below are self-reported and have not been indexed by our verified scraping engine.</p>
            </div>
          </div>
        )}

        {/* 🚨 HIGHLIGHT VIDEOS SECTION (PRO VS. NOT PRO) 🚨 */}
        <section className={`${theme.sectionBg} p-6 sm:p-8 rounded-[2rem] border ${theme.sectionBorder} ${theme.sectionShadow} mb-8 relative overflow-hidden transition-all duration-500`}>
          {/* Hidden file input for PRO self uploads */}
          {isSelf && isProAthlete && (
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              onChange={handlePortfolioVideoSelect}
              className="hidden"
            />
          )}

          {isProAthlete ? (
            /* ✅ PRO ATHLETE HIGHLIGHT VIDEO VIEW */
            <div>
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b ${theme.isDark ? 'border-white/10' : 'border-slate-100'} pb-4 mb-6`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md shrink-0">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className={`text-xl font-black ${theme.textHeader}`}>
                        Highlight Videos
                      </h2>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/40 text-cyan-400">
                        <Crown className="w-3 h-3" /> PRO Saved Film
                      </span>
                    </div>
                    <p className={`text-xs font-medium ${theme.textSub} mt-0.5`}>
                      Pinned to portfolio for college recruiting evaluation
                    </p>
                  </div>
                </div>

                {isSelf && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isUploadingVideo}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-purple-600 hover:opacity-95 text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isUploadingVideo ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>{uploadProgressText || 'Uploading...'}</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>{highlightPost ? 'Replace Video' : 'Upload Highlight'}</span>
                        </>
                      )}
                    </button>

                    {highlightPost && !isUploadingVideo && (
                      <button
                        type="button"
                        disabled={isDeletingVideo}
                        onClick={handleRemoveHighlightVideo}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 transition-colors cursor-pointer"
                        title="Remove Highlight Video"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {highlightPost ? (
                <div className="space-y-3">
                  <CloudflareStreamVideo uid={highlightPost.cloudflareUid} />
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-2">
                      <span className={`${theme.statBadge} px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider border`}>
                        {highlightPost.sport}
                      </span>
                      {highlightPost.caption && (
                        <p className={`text-xs font-semibold italic ${theme.textSub} truncate max-w-md`}>
                          "{highlightPost.caption}"
                        </p>
                      )}
                    </div>
                    <span className={`text-[11px] font-bold ${theme.textMuted}`}>
                      Pinned via ChasedSports PRO
                    </span>
                  </div>
                </div>
              ) : (
                <div className={`${theme.subCardBg} border ${theme.subCardBorder} border-dashed rounded-2xl p-8 text-center`}>
                  <Video className={`w-10 h-10 ${theme.textMuted} mx-auto mb-2.5 opacity-60`} />
                  <p className={`text-sm font-black ${theme.textHeader} mb-1`}>
                    No Highlight Video Uploaded Yet
                  </p>
                  <p className={`text-xs font-medium ${theme.textSub} max-w-md mx-auto`}>
                    {isSelf
                      ? 'Upload a 60-second race or game highlight above—or post a video on the Featured Feed—and it will stay pinned to your portfolio for your entire PRO membership.'
                      : `${athlete.first_name} has unlocked PRO Highlight Hosting but hasn't pinned a video clip yet.`}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* 🔒 NOT PRO ATHLETE VIEW ("Highlight Videos — Not PRO") */
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 text-center sm:text-left flex-col sm:flex-row">
                <div className={`w-12 h-12 rounded-2xl ${theme.subCardBg} border ${theme.subCardBorder} flex items-center justify-center shrink-0`}>
                  <Lock className={`w-5 h-5 ${theme.textMuted}`} />
                </div>
                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                    <h2 className={`text-lg font-black ${theme.textHeader}`}>
                      Highlight Videos
                    </h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${theme.isDark ? 'bg-white/5 border-white/15 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                      Not PRO
                    </span>
                  </div>
                  <p className={`text-xs font-medium ${theme.textSub} mt-0.5`}>
                    {isSelf
                      ? 'Upgrade to ChasedSports PRO to save highlight videos directly to your recruiting portfolio.'
                      : 'Highlight Videos — Not PRO. Permanent portfolio video hosting is only active for PRO athletes.'}
                  </p>
                </div>
              </div>

              {isSelf && (
                <Link
                  href="/pro"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.35)] hover:opacity-95 transition-all shrink-0 whitespace-nowrap"
                >
                  <Sparkles className="w-4 h-4" /> Unlock PRO Video Hosting
                </Link>
              )}
            </div>
          )}
        </section>

        <div className="animate-in fade-in duration-500 delay-150">
          
          {(parsedResume.gpa || parsedResume.accolades.length > 0 || parsedResume.schoolPrefs) && (
            <section className={`${theme.sectionBg} p-6 sm:p-8 md:p-10 rounded-[2rem] border ${theme.sectionBorder} ${theme.sectionShadow} mb-8 space-y-6 transition-all duration-500`}>
              <h2 className={`text-xl font-black ${theme.textHeader} flex items-center gap-2 border-b ${theme.isDark ? 'border-white/10' : 'border-slate-100'} pb-4`}>
                <FileText className={`w-5 h-5 ${theme.iconColor}`} /> Academic & Extracurricular Overview
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {parsedResume.gpa && (
                  <div className={`${theme.subCardBg} border ${theme.subCardBorder} rounded-2xl p-6`}>
                    <p className={`text-[10px] font-bold ${theme.textMuted} uppercase tracking-widest mb-2 flex items-center gap-1.5`}><GraduationCap className={`w-4 h-4 ${theme.isDark ? 'text-emerald-400' : 'text-emerald-500'}`} /> Unweighted GPA</p>
                    <p className={`text-4xl font-black ${theme.textHeader}`}>{parsedResume.gpa}</p>
                  </div>
                )}
                {parsedResume.accolades.length > 0 && (
                  <div>
                    <p className={`text-[10px] font-bold ${theme.textMuted} uppercase tracking-widest mb-3 flex items-center gap-1.5`}><Medal className={`w-4 h-4 ${theme.isDark ? 'text-amber-400' : 'text-amber-500'}`} /> Academic Honors</p>
                    <div className="flex flex-wrap gap-2.5">
                      {parsedResume.accolades.map((acc, i) => (
                        <span key={i} className={`${theme.isDark ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' : 'bg-blue-50 text-blue-700 border-blue-200'} border px-4 py-2 rounded-xl text-xs font-bold shadow-sm`}>{acc}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {parsedResume.schoolPrefs && (
                <div className={`pt-6 border-t ${theme.isDark ? 'border-white/10' : 'border-slate-100'} mt-2`}>
                  <p className={`text-[10px] font-bold ${theme.textMuted} uppercase tracking-widest mb-3 flex items-center gap-1.5`}><School className={`w-4 h-4 ${theme.isDark ? 'text-indigo-400' : 'text-indigo-500'}`} /> Culture Preferences</p>
                  <p className={`text-sm font-medium ${theme.textSub} leading-relaxed whitespace-pre-wrap ${theme.subCardBg} border ${theme.subCardBorder} p-5 rounded-2xl`}>{parsedResume.schoolPrefs}</p>
                </div>
              )}
            </section>
          )}

          {athleteSports && athleteSports.length > 0 ? (
            <div className="space-y-8">
              {athleteSports.map((sport) => {
                const isTrack = sport.sport_name === 'Track & Field';

                return (
                  <section key={sport.id} className={`${theme.sectionBg} p-6 sm:p-8 md:p-10 rounded-[2rem] border ${theme.sectionBorder} ${theme.sectionShadow} relative overflow-hidden group transition-all duration-500`}>
                    <div className={`absolute top-0 right-0 w-32 h-32 ${theme.isDark ? 'bg-white/5' : 'bg-slate-50/50'} rounded-full blur-[40px] pointer-events-none transition-colors`}></div>
                    
                    <header className={`flex flex-col sm:flex-row justify-between sm:items-center border-b ${theme.isDark ? 'border-white/10' : 'border-slate-100'} pb-6 mb-6 gap-4 relative z-10`}>
                      <div>
                        <h2 className={`text-3xl font-black ${theme.textHeader} flex items-center gap-3`}>
                          {sport.sport_name}
                          {isTrack && <span title="Managed by Track Portal"><CheckCircle2 className={`w-6 h-6 ${theme.iconColor}`} /></span>}
                        </h2>
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <span className={`${theme.statBadge} px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest shadow-sm border`}>{sport.position || 'Athlete'}</span>
                          <span className={`${theme.statBadge} px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest shadow-sm border`}>{sport.level_of_play || 'Varsity'}</span>
                        </div>
                      </div>
                      
                      {sport.athleticism_tier && (
                        <div className={`shrink-0 ${theme.isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-blue-50 border-blue-200 text-blue-700'} px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-center shadow-sm backdrop-blur-md`}>
                          Tier: <br/><span className="text-base">{sport.athleticism_tier}</span>
                        </div>
                      )}
                    </header>

                    {sport.meta_context?.accolades && sport.meta_context.accolades.length > 0 && (
                      <div className="mb-8 relative z-10">
                        <h3 className={`text-[10px] font-black uppercase tracking-widest ${theme.iconColor} mb-3 flex items-center gap-2`}>
                          <Medal className="w-4 h-4" /> Season Accolades
                        </h3>
                        <div className="flex flex-wrap gap-3">
                          {sport.meta_context.accolades.map((acc: any, i: number) => (
                            renderAccoladeBadge(acc, i, theme)
                          ))}
                        </div>
                      </div>
                    )}

                    {sport.metrics && sport.metrics.length > 0 ? (
                      <div className={`relative z-10 border-t ${theme.isDark ? 'border-white/10' : 'border-slate-100'} pt-6`}>
                        <h3 className={`text-[10px] font-black uppercase tracking-widest ${theme.textMuted} mb-4 flex items-center gap-2`}>
                          <Target className="w-4 h-4" /> Core Metrics
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {sport.metrics.map((m: any, i: number) => (
                            <div key={i} className={`${theme.metricBg} border ${theme.metricBorder} p-5 rounded-2xl flex flex-col justify-center items-center text-center shadow-sm hover:shadow-md transition-all duration-300`}>
                              <span className={`text-[10px] font-bold uppercase tracking-wider mb-2 truncate w-full ${theme.metricName}`} title={m.name}>{m.name}</span>
                              <span className={`font-black text-xl sm:text-2xl truncate w-full ${theme.metricValue}`} title={m.value}>{m.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className={`${theme.subCardBg} border ${theme.subCardBorder} border-dashed rounded-2xl p-6 text-center mt-6`}>
                        <p className={`text-sm font-bold ${theme.textSub}`}>No raw metrics logged for this sport.</p>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          ) : (
            <div className={`${theme.sectionBg} p-12 rounded-[2rem] border ${theme.sectionBorder} ${theme.sectionShadow} text-center`}>
              <div className={`w-20 h-20 ${theme.subCardBg} rounded-full flex items-center justify-center mx-auto mb-4 border ${theme.subCardBorder} shadow-sm`}>
                <Activity className={`w-10 h-10 ${theme.textMuted}`} />
              </div>
              <h3 className={`text-xl font-black ${theme.textHeader} mb-2`}>No active sports recorded</h3>
              <p className={`text-sm ${theme.textSub} font-medium`}>This athlete has not set up their Performance Hub metrics yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* 📱 ENHANCED MESSAGING MODAL / BOTTOM SHEET 📱 */}
      {isMessageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-300">
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" 
            onClick={() => !isSending && setIsMessageModalOpen(false)}
            aria-hidden="true"
          />

          <div 
            className="relative w-full sm:max-w-lg bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 ease-out" 
            role="dialog" 
            aria-modal="true"
          >
            <div className="w-full flex justify-center pt-3 pb-1 sm:hidden cursor-grab active:cursor-grabbing" onClick={() => setIsMessageModalOpen(false)}>
              <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
            </div>

            <div className="bg-white px-6 sm:px-8 py-4 sm:py-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-black text-xl sm:text-2xl text-slate-900 tracking-tight flex items-center gap-2">
                  {modalMode === 'pitch' ? `Message ${athlete.first_name}` : `Connect with ${athlete.first_name}`}
                </h3>
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Secure connection
                </p>
              </div>
              <button 
                onClick={() => setIsMessageModalOpen(false)} 
                className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors border border-slate-200 active:scale-95" 
                aria-label="Close Modal"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            {sendSuccess ? (
              <div className="p-12 flex flex-col items-center justify-center text-center overflow-y-auto animate-in zoom-in-95 duration-300">
                <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6 border border-emerald-100 shadow-inner">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                </div>
                <h4 className="text-2xl font-black text-slate-900 mb-2">Message Delivered!</h4>
                <p className="text-sm text-slate-500 font-medium">Your request has been securely delivered to their recruiting dashboard.</p>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="p-6 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar">
                <p className="text-[10px] sm:text-xs font-black text-amber-700 bg-amber-50 rounded-xl px-4 py-3 text-center uppercase tracking-widest border border-amber-200 flex items-center justify-center gap-2 shadow-sm">
                  <Clock className="w-4 h-4 shrink-0 text-amber-500" /> Daily Limit: 10 Pitches/Requests
                </p>

                <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 bg-white border border-slate-200 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                      {viewerRole === 'coach' ? <School className="w-6 h-6 text-blue-600" /> : <UserCircle2 className="w-6 h-6 text-blue-600" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-900 truncate">Sending as {senderName}</p>
                      <p className="text-xs font-bold text-slate-500 truncate">{senderSchool}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 group">
                  <div className="flex justify-between items-end">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-slate-400" /> Message
                    </label>
                    <span className={`text-[10px] font-bold ${charCount >= MAX_MESSAGE_LENGTH ? 'text-red-500' : 'text-slate-400'} uppercase tracking-widest`}>
                      {charCount} / {MAX_MESSAGE_LENGTH}
                    </span>
                  </div>
                  
                  <textarea 
                    ref={messageInputRef}
                    required 
                    value={messageContent} 
                    onChange={handleMessageChange} 
                    maxLength={MAX_MESSAGE_LENGTH}
                    rows={5} 
                    className="w-full text-base border border-slate-200 rounded-2xl p-5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 font-medium resize-none shadow-inner transition-all group-hover:border-blue-300" 
                    placeholder={modalMode === 'pitch' ? `Hi ${athlete.first_name}, I'm reaching out because...` : `Hey ${athlete.first_name}, let's connect...`}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isSending || charCount === 0} 
                  className={`w-full text-white font-black py-4 sm:py-4.5 rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed text-base transition-all active:scale-[0.98] ${
                    modalMode === 'pitch' 
                      ? 'bg-slate-900 hover:bg-slate-800 hover:shadow-slate-900/20' 
                      : 'bg-blue-600 hover:bg-blue-500 hover:shadow-blue-600/30'
                  }`}
                >
                  {isSending ? (
                    <><RefreshCw className="w-5 h-5 animate-spin" /> Sending Securely...</>
                  ) : (
                    <><Send className="w-5 h-5" /> Send {modalMode === 'pitch' ? 'Pitch' : 'Request'}</>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}