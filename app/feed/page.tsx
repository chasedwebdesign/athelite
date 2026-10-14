'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, usePathname } from 'next/navigation'; 
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Star, 
  Crown, 
  Send, 
  Target, 
  Award, 
  Clock, 
  Activity, 
  GraduationCap, 
  Dumbbell, 
  Eye, 
  Filter, 
  Heart, 
  Search, 
  Trash2, 
  ChevronDown, 
  BarChart3, 
  Video, 
  Shuffle, 
  X 
} from 'lucide-react';
import Link from 'next/link';
import { AvatarWithBorder } from '@/components/AnimatedBorders';
import { Points } from '@/components/Points';

// 🚨 FEATURE DURATION CONFIG (72H PRO vs 24H FREE) 🚨
const FEATURE_DAYS_PRO = 3;  // 72 Hours
const FEATURE_DAYS_FREE = 1; // 24 Hours

const ALL_SPORTS_LIST: string[] = [
  'Track & Field',
  'Cross Country',
  'Football',
  'Basketball',
  'Soccer',
  'Baseball',
  'Softball',
  'Volleyball',
  'Swimming & Diving',
  'Wrestling',
  'Lacrosse',
  'Tennis',
  'Golf',
  'Ice Hockey',
  'Field Hockey',
  'Gymnastics',
  'Water Polo',
  'Fencing',
  'Bowling'
];

interface PostPayload {
  text: string;
  sport: string;
  honors: any;
  score: number | null;
  gpa: string | null;
  otherSports: string[];
  stats: any[];
  cloudflareUid: string | null;
}

interface EnrichedPost {
  id: string;
  content: string;
  created_at: string;
  athlete_id: string;
  channel: string;
  is_boosted: boolean;
  boosted_until: string;
  likes: string[];
  athletes: {
    id: string;
    first_name: string;
    last_name: string;
    high_school?: string | null;
    state?: string | null;
    avatar_url?: string | null;
    equipped_border?: string | null;
    equipped_card?: string | null;
    is_premium?: boolean | null;
    grad_year?: number | null;
  } | null;
  parsedPayload: PostPayload;
}

// 🚨 UNBIASED FISHER-YATES SHUFFLE FOR RANDOMIZED FEED ORIENTATION 🚨
function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// 🚨 THEME ENGINE: DYNAMICALLY SKINS THE POST CARDS 🚨
const getThemeConfig = (cardType: string | null | undefined) => {
  const safeCardType = cardType === 'default' || !cardType ? 'base' : cardType;
  const isBase = safeCardType === 'base';

  if (isBase) {
    return {
      isDark: true,
      cardType: safeCardType,
      heroCard: 'bg-gradient-to-br from-white/[0.05] to-transparent backdrop-blur-3xl border-white/10 shadow-2xl',
      heroName: 'text-white drop-shadow-md',
      heroMeta: 'text-slate-400',
      statBadge: 'bg-black/40 border-white/10 text-white',
    };
  }

  const map: Record<string, { border: string; accent: string }> = {
    obsidian: { border: 'border-slate-600/50', accent: 'text-slate-400' },
    crimson: { border: 'border-red-500/50', accent: 'text-red-400' },
    sapphire: { border: 'border-blue-500/50', accent: 'text-blue-400' },
    hype: { border: 'border-indigo-500/50', accent: 'text-indigo-400' },
    premium: { border: 'border-amber-500/50', accent: 'text-amber-400' },
    amethyst: { border: 'border-fuchsia-500/50', accent: 'text-fuchsia-400' },
    cyber: { border: 'border-cyan-500/50', accent: 'text-cyan-400' },
    'mythic-flare': { border: 'border-rose-500/50', accent: 'text-rose-400' },
  };

  const t = map[safeCardType] || map.obsidian;
  const isAnimated = ['hype', 'premium', 'crimson', 'sapphire', 'amethyst', 'cyber', 'mythic-flare'].includes(safeCardType);
  const animationClass = isAnimated ? 'animate-foil' : '';

  return {
    isDark: true,
    cardType: safeCardType,
    heroCard: `holo-card-${safeCardType} border-white/20 shadow-2xl text-white ${animationClass}`,
    heroName: 'text-white drop-shadow-md',
    heroMeta: 'text-white/90',
    statBadge: `bg-black/40 ${t.border} text-white`,
  };
};

const parseHonors = (rawHonors: any): string[] => {
  if (!rawHonors) return ['Developing Prospect'];
  
  if (Array.isArray(rawHonors)) {
    const parsed = rawHonors.map((h: any): string => {
      if (typeof h === 'string') return h.trim();
      if (typeof h === 'object' && h !== null) {
        if (h.placement && h.level) return `${h.placement} ${h.level}`;
        if (h.level) return String(h.level);
        if (h.placement) return String(h.placement);
        return String(h.type || 'Accolade');
      }
      return '';
    }).filter((h: string) => h.length > 0);
    return parsed.length > 0 ? parsed : ['Developing Prospect'];
  } else if (typeof rawHonors === 'string') {
    const parsed = rawHonors.split(/[,•|]+/).map((h: string) => h.trim()).filter((h: string) => h.length > 0);
    return parsed.length > 0 ? parsed : ['Developing Prospect'];
  }
  
  return ['Developing Prospect'];
};

const getTimeRemaining = (endTime: string) => {
  const total = Date.parse(endTime) - Date.parse(new Date().toISOString());
  if (total <= 0) return 'Expired';
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

// 🚨 SMART POLLING & TIKTOK UX VIDEO COMPONENT 🚨
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
          }, 1000);
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
      
      if (!activeFullscreen && iframeRef.current) {
        try {
          iframeRef.current.contentWindow?.postMessage(JSON.stringify({method: 'muted', value: true}), '*');
        } catch(e) {}
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenSync);
    document.addEventListener('webkitfullscreenchange', handleFullscreenSync);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenSync);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenSync);
    };
  }, []);

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isFullscreen]);

  // 🚨 SMART VIEWPORT OBSERVER: ONLY PLAY WHEN VISIBLE 🚨
  useEffect(() => {
    if (!isReady || !iframeRef.current || !containerRef.current) return;
    if (isFullscreen) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          try {
            iframeRef.current?.contentWindow?.postMessage(JSON.stringify({method: 'play'}), '*');
          } catch(e) {}
        } else {
          try {
            iframeRef.current?.contentWindow?.postMessage(JSON.stringify({method: 'pause'}), '*');
          } catch(e) {}
        }
      });
    }, {
      threshold: 0.6
    });

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [isReady, isFullscreen]);

  const handleVideoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!iframeRef.current || !containerRef.current) return;

    if (!isFullscreen) {
      try {
        iframeRef.current.contentWindow?.postMessage(JSON.stringify({method: 'muted', value: false}), '*');
        iframeRef.current.contentWindow?.postMessage(JSON.stringify({method: 'play'}), '*');
      } catch(e) {}

      const target = containerRef.current;
      if (target.requestFullscreen) {
        target.requestFullscreen().catch(() => {});
      } else if ((target as any).webkitRequestFullscreen) {
        (target as any).webkitRequestFullscreen();
      } else {
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
      
      try {
        iframeRef.current.contentWindow?.postMessage(JSON.stringify({method: 'muted', value: true}), '*');
      } catch(e) {}
      
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={handleVideoClick}
      className={`relative overflow-hidden cursor-pointer group/video transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-[99999] w-screen h-[100dvh] bg-black flex items-center justify-center rounded-none border-none'
          : 'w-full aspect-video rounded-2xl border border-white/10 mb-4 bg-[#0B0F19] shadow-inner'
      }`}
    >
      {!isReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-xl z-20">
          <div className="relative w-12 h-12 flex items-center justify-center mb-3">
            <div className="absolute inset-0 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            <Video className="w-5 h-5 text-indigo-400 animate-pulse" />
          </div>
          <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest animate-pulse">
            Processing Video...
          </span>
          <p className="text-[10px] font-medium text-slate-400 mt-2 text-center px-4">
            Optimizing for feed playback.<br/>This usually takes about a minute.
          </p>
        </div>
      )}

      {isReady && (
        <iframe
          ref={iframeRef}
          src={`https://customer-4lk9yxcqvek697fx.cloudflarestream.com/${uid}/iframe?controls=false&autoplay=false&loop=true&muted=true&preload=auto&letterboxColor=transparent`}
          className={`border-none absolute h-full w-full bg-transparent pointer-events-none ${isFullscreen ? 'max-w-full max-h-full object-contain inset-0 m-auto' : 'top-0 left-0'}`}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
        ></iframe>
      )}
    </div>
  );
};

export default function FeaturedPage() {
  const supabase = createClient();
  const router = useRouter(); 
  const pathname = usePathname();
  
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [viewerRole, setViewerRole] = useState<'guest' | 'athlete' | 'coach'>('guest');
  const [lastPostStats, setLastPostStats] = useState<{likes: number, views: number}>({ likes: 0, views: 0 });

  const [isFeatureFormOpen, setIsFeatureFormOpen] = useState(false);
  const [featuredMsg, setFeaturedMsg] = useState('');
  const [featuredSport, setFeaturedSport] = useState('');
  const [selectedOtherSports, setSelectedOtherSports] = useState<string[]>([]);
  const [includeGpa, setIncludeGpa] = useState(false);
  
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);

  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(''); 
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const [animatingLikeId, setAnimatingLikeId] = useState<string | null>(null);

  // 🚨 COACH-ONLY SCOUTING & FILTER STATE 🚨
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGradYear, setSelectedGradYear] = useState<string>('All');
  const [selectedState, setSelectedState] = useState<string>('All');
  const [onlyWithVideo, setOnlyWithVideo] = useState<boolean>(false);
  const [showAllSportDropdown, setShowAllSportDropdown] = useState<boolean>(false);

  const trackedRefs = useRef<Set<string>>(new Set());

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => { 
    fetchFeaturedAndUser(); 
  }, []); 

  useEffect(() => {
    const draft = localStorage.getItem('chased_featured_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.featuredSport) setFeaturedSport(parsed.featuredSport);
        if (parsed.featuredMsg) setFeaturedMsg(parsed.featuredMsg);
        if (Array.isArray(parsed.selectedOtherSports)) setSelectedOtherSports(parsed.selectedOtherSports);
        if (parsed.includeGpa !== undefined) setIncludeGpa(parsed.includeGpa);
        if (parsed.featuredSport || parsed.featuredMsg) setIsFeatureFormOpen(true);
      } catch(e) {}
    }
    setIsDraftLoaded(true);
  }, []);

  useEffect(() => {
    if (isDraftLoaded) {
      localStorage.setItem('chased_featured_draft', JSON.stringify({
        featuredSport, featuredMsg, selectedOtherSports, includeGpa
      }));
    }
  }, [featuredSport, featuredMsg, selectedOtherSports, includeGpa, isDraftLoaded]);

  async function fetchFeaturedAndUser() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      setCurrentUserId(session.user.id);

      const { data: cData } = await supabase.from('coaches').select('*').eq('id', session.user.id).maybeSingle();
      if (cData) {
        setViewerRole('coach');
      } else {
        const { data: aData } = await supabase.from('athletes').select(`
          *,
          athlete_sports ( sport_name, custom_fit_score, is_active, metrics, meta_context )
        `).eq('id', session.user.id).maybeSingle();

        if (aData) {
          setViewerRole('athlete');
          setCurrentUserProfile(aData);
          if (aData.trust_level === 0) {
            setIsFeatureFormOpen(false);
          }

          if (!aData.is_premium) {
            supabase.from('posts')
              .delete()
              .eq('athlete_id', session.user.id)
              .eq('channel', 'featured')
              .lt('boosted_until', new Date().toISOString())
              .then();
          }
          
          const { data: userPostsData } = await supabase
            .from('posts')
            .select('likes')
            .eq('athlete_id', session.user.id)
            .order('created_at', { ascending: false });

          if (userPostsData && userPostsData.length > 0) {
            const totalLikesCount = userPostsData.reduce((acc: number, row: any) => {
              return acc + (Array.isArray(row.likes) ? row.likes.length : 0);
            }, 0);
            setLastPostStats({ likes: totalLikesCount, views: aData.profile_views || 0 });
          }
        }
      }
    }

    const { data: feedData } = await supabase
      .from('posts')
      .select(`
        id, content, created_at, athlete_id, channel, is_boosted, boosted_until, likes,
        athletes (id, first_name, last_name, high_school, state, avatar_url, equipped_border, equipped_card, is_premium, grad_year)
      `)
      .eq('channel', 'featured')
      .gte('boosted_until', new Date().toISOString());
      
    setPosts(shuffleArray(feedData || []));
    setLoading(false);
  }

  const handleReshuffle = () => {
    setPosts((prev: any[]) => shuffleArray(prev));
    showToast("Feed order randomized!", "success");
  };

  // 🚨 FEED IMPRESSION TRACKER (SECURE RPC UPDATE) 🚨
  const handleImpression = useCallback(async (athleteId: string) => {
    if (athleteId === currentUserId) return;
    
    try {
      await supabase.rpc('increment_search_appearances', { target_athlete_id: athleteId });
    } catch (e) {
      console.error("Failed to track feed impression");
    }
  }, [currentUserId, supabase]);

  // 🚨 EXTRACT DYNAMIC FILTER OPTIONS & PARSED POST PAYLOADS IN JS 🚨
  const enrichedPosts = useMemo<EnrichedPost[]>(() => {
    return posts.map((post: any): EnrichedPost => {
      let payload: PostPayload = {
        text: '',
        sport: '',
        honors: '',
        score: null,
        gpa: null,
        otherSports: [],
        stats: [],
        cloudflareUid: null
      };

      try {
        const parsed = JSON.parse(post.content);
        payload = {
          ...payload,
          ...parsed,
          otherSports: Array.isArray(parsed?.otherSports) ? parsed.otherSports.map((s: any) => String(s)) : [],
          stats: Array.isArray(parsed?.stats) ? parsed.stats : []
        };
      } catch (e) {
        payload.text = post.content || '';
      }

      const rawAthletes = Array.isArray(post.athletes) ? post.athletes[0] : post.athletes;

      return {
        ...post,
        athletes: rawAthletes || null,
        parsedPayload: payload
      };
    });
  }, [posts]);

  const sportCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    enrichedPosts.forEach((p: EnrichedPost) => {
      const primary = p.parsedPayload.sport?.trim();
      if (primary) {
        counts[primary] = (counts[primary] || 0) + 1;
      }
      if (Array.isArray(p.parsedPayload.otherSports)) {
        p.parsedPayload.otherSports.forEach((os: string) => {
          const clean = os?.trim();
          if (clean && clean !== primary) {
            counts[clean] = (counts[clean] || 0) + 1;
          }
        });
      }
    });
    return counts;
  }, [enrichedPosts]);

  const activeSportsInFeed = useMemo<string[]>(() => {
    return Object.keys(sportCounts).sort((a: string, b: string) => (sportCounts[b] || 0) - (sportCounts[a] || 0));
  }, [sportCounts]);

  const availableStates = useMemo<string[]>(() => {
    const states = new Set<string>();
    enrichedPosts.forEach((p: EnrichedPost) => {
      if (p.athletes?.state) states.add(p.athletes.state);
    });
    return Array.from(states).sort();
  }, [enrichedPosts]);

  const availableGradYears = useMemo<string[]>(() => {
    const years = new Set<string>();
    enrichedPosts.forEach((p: EnrichedPost) => {
      if (p.athletes?.grad_year) years.add(p.athletes.grad_year.toString());
    });
    return Array.from(years).sort();
  }, [enrichedPosts]);

  // 🚨 COACH-ONLY MULTI-CRITERIA FILTERING 🚨
  const filteredPosts = useMemo<EnrichedPost[]>(() => {
    if (viewerRole !== 'coach') return enrichedPosts;

    const q = searchQuery.trim().toLowerCase();

    return enrichedPosts.filter((post: EnrichedPost) => {
      if (!post.athletes) return false;
      const { parsedPayload } = post;
      const primarySport: string = (parsedPayload.sport || '').toLowerCase();
      const otherSportsLower: string[] = Array.isArray(parsedPayload.otherSports)
        ? parsedPayload.otherSports.map((s: string) => String(s).toLowerCase())
        : [];

      if (activeFilter !== 'All') {
        const targetSport = activeFilter.toLowerCase();
        const matchesPrimary = primarySport === targetSport || primarySport.includes(targetSport);
        const matchesSecondary = otherSportsLower.some((s: string) => s === targetSport || s.includes(targetSport));
        if (!matchesPrimary && !matchesSecondary) return false;
      }

      if (selectedGradYear !== 'All') {
        if (post.athletes.grad_year?.toString() !== selectedGradYear) return false;
      }

      if (selectedState !== 'All') {
        if (post.athletes.state !== selectedState) return false;
      }

      if (onlyWithVideo && !parsedPayload.cloudflareUid) {
        return false;
      }

      if (q.length > 0) {
        const fullName = `${post.athletes.first_name || ''} ${post.athletes.last_name || ''}`.toLowerCase();
        const school = (post.athletes.high_school || '').toLowerCase();
        const state = (post.athletes.state || '').toLowerCase();
        const pitch = (parsedPayload.text || '').toLowerCase();
        const honorsStr = parseHonors(parsedPayload.honors).join(' ').toLowerCase();
        const statsStr = Array.isArray(parsedPayload.stats)
          ? parsedPayload.stats
              .map((st: any) => `${st.label || st.name || st.event || ''} ${st.value || st.mark || st.time || ''}`)
              .join(' ')
              .toLowerCase()
          : '';

        const matchesQuery =
          fullName.includes(q) ||
          primarySport.includes(q) ||
          otherSportsLower.some((s: string) => s.includes(q)) ||
          statsStr.includes(q) ||
          honorsStr.includes(q) ||
          school.includes(q) ||
          state.includes(q) ||
          pitch.includes(q);

        if (!matchesQuery) return false;
      }

      return true;
    });
  }, [enrichedPosts, viewerRole, activeFilter, selectedGradYear, selectedState, onlyWithVideo, searchQuery]);

  const hasActiveFilters = viewerRole === 'coach' && (activeFilter !== 'All' || selectedGradYear !== 'All' || selectedState !== 'All' || onlyWithVideo || searchQuery.trim().length > 0);

  const clearAllFilters = () => {
    setActiveFilter('All');
    setSelectedGradYear('All');
    setSelectedState('All');
    setOnlyWithVideo(false);
    setSearchQuery('');
  };

  useEffect(() => {
    if (filteredPosts.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const athleteId = entry.target.getAttribute('data-athlete-id');
          const postId = entry.target.getAttribute('data-post-id');
          
          if (athleteId && postId && !trackedRefs.current.has(postId)) {
            trackedRefs.current.add(postId);
            handleImpression(athleteId);
            observer.unobserve(entry.target);
          }
        }
      });
    }, { threshold: 0.4 });

    const timer = setTimeout(() => {
      const cards = document.querySelectorAll('.feed-post-card');
      cards.forEach((card) => observer.observe(card));
    }, 100);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [filteredPosts, handleImpression]);

  // 🚨 STRICT 60S REQUIREMENT APPLIED HERE 🚨
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      return showToast("Video must be under 50MB.", "error");
    }

    const videoElement = document.createElement('video');
    videoElement.preload = 'metadata';
    videoElement.onloadedmetadata = () => {
      window.URL.revokeObjectURL(videoElement.src);
      if (Math.ceil(videoElement.duration) > 60) { 
        showToast("Highlight must be 60 seconds or less.", "error");
        e.target.value = ''; 
        setVideoFile(null);
        setVideoPreviewUrl(null);
      } else {
        setVideoFile(file);
        setVideoPreviewUrl(URL.createObjectURL(file));
      }
    };
    videoElement.onerror = () => {
      showToast("Invalid or corrupted video file.", "error");
      e.target.value = '';
    };
    videoElement.src = URL.createObjectURL(file);
  };

  const handleLike = async (postId: string, currentLikes: string[] = []) => {
    if (viewerRole === 'guest' || !currentUserId) {
      return showToast("Please log in to like posts.", "error");
    }

    const hasLiked = currentLikes.includes(currentUserId);
    const newLikes = hasLiked
      ? currentLikes.filter((id: string) => id !== currentUserId)
      : [...currentLikes, currentUserId];

    setPosts(posts.map((p: any) => p.id === postId ? { ...p, likes: newLikes } : p));

    if (!hasLiked) {
      setAnimatingLikeId(postId);
      setTimeout(() => setAnimatingLikeId(null), 1200); 
    }

    const { error } = await supabase.from('posts').update({ likes: newLikes }).eq('id', postId);
    if (error) {
      setPosts(posts.map((p: any) => p.id === postId ? { ...p, likes: currentLikes } : p));
      showToast("Failed to process like.", "error");
    }
  };

  const handleDeletePost = async (postId: string) => {
    setIsDeleting(postId);
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    
    if (error) {
      showToast("Failed to remove post.", "error");
      setIsDeleting(null);
    } else {
      setPosts(posts.filter((p: any) => p.id !== postId));
      showToast("Post successfully removed.", "success");
      setIsDeleting(null);
    }
  };

  let parsedGpa: string | null = null;
  let resumeHonorsFallback: any = null;

  if (currentUserProfile?.saved_resume) {
    try {
      const res = JSON.parse(currentUserProfile.saved_resume);
      parsedGpa = res.gpa || null;
      resumeHonorsFallback = res.honors || res.accolades || null;
    } catch (e) {}
  }

  const activeUserSports: string[] = currentUserProfile?.athlete_sports
    ?.filter((s: any) => s.is_active === true)
    .map((s: any) => String(s.sport_name)) || [];

  const availableOtherSports: string[] = activeUserSports.filter((s: string) => s !== featuredSport);

  const toggleOtherSport = (sport: string) => {
    setSelectedOtherSports((prev: string[]) => 
      prev.includes(sport) ? prev.filter((s: string) => s !== sport) : [...prev, sport]
    );
  };

  let liveScore: number | null = null;
  let liveStats: any[] = [];
  let rawLiveHonors: any = null;

  if (featuredSport && currentUserProfile?.athlete_sports) {
    const activeSport = currentUserProfile.athlete_sports.find((s: any) => s.sport_name === featuredSport);
    if (activeSport) {
      liveScore = activeSport.custom_fit_score > 0 ? activeSport.custom_fit_score : null;
      liveStats = activeSport.metrics || [];
      
      if (activeSport.meta_context && (activeSport.meta_context.honors || activeSport.meta_context.accolades)) {
        rawLiveHonors = activeSport.meta_context.honors || activeSport.meta_context.accolades;
      } else {
        rawLiveHonors = resumeHonorsFallback;
      }
    }
  }

  const liveHonorsArray = parseHonors(rawLiveHonors);
  const previewTheme = getThemeConfig(currentUserProfile?.equipped_card);

  const activePost = posts.find((p: any) => p.athlete_id === currentUserId);

  const handleCreateFeatured = async (e: React.FormEvent) => {
    e.preventDefault();
    if (viewerRole !== 'athlete' || !currentUserId || !currentUserProfile) return;
    if (currentUserProfile.trust_level === 0) return showToast("Verification required to post.", "error");
    if (currentUserProfile.coins < 100) return showToast("You need 100 Points to feature yourself.", "error");
    if (!featuredSport) return showToast("Please select a sport to promote.", "error");
    if (!featuredMsg.trim()) return showToast("A recruiting message is required to post.", "error");

    setIsSubmitting(true);
    setSubmitStatus('Preparing upload...');

    try {
      let streamUid = null;

      if (videoFile) {
        setSubmitStatus('Uploading highlight...');
        const urlRes = await fetch('/api/stream/upload-url', { method: 'POST' });
        const { uploadURL, uid } = await urlRes.json();

        if (!uploadURL) throw new Error("Failed to secure upload channel.");

        const formData = new FormData();
        formData.append('file', videoFile);

        const uploadRes = await fetch(uploadURL, {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) throw new Error("Video upload failed.");
        streamUid = uid; 
        setSubmitStatus('Finalizing post...');
      }

      if (activePost) {
        const { error: delErr } = await supabase.from('posts').delete().eq('id', activePost.id);
        if (delErr) throw new Error("Failed to clear previous active feature.");
      }

      const days = currentUserProfile.is_premium ? FEATURE_DAYS_PRO : FEATURE_DAYS_FREE;
      const boostedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

      const payload: PostPayload = { 
        text: featuredMsg.trim(), 
        sport: featuredSport, 
        honors: rawLiveHonors || 'Developing Prospect', 
        score: liveScore,
        stats: liveStats,
        gpa: includeGpa ? parsedGpa : null,
        otherSports: selectedOtherSports,
        cloudflareUid: streamUid 
      };

      const { error: coinErr } = await supabase.from('athletes').update({ coins: currentUserProfile.coins - 100 }).eq('id', currentUserId);
      if (coinErr) throw coinErr;

      const { data, error } = await supabase.from('posts').insert({
        athlete_id: currentUserId,
        content: JSON.stringify(payload),
        channel: 'featured',
        is_boosted: true,
        boosted_until: boostedUntil
      }).select(`
        id, content, created_at, athlete_id, channel, is_boosted, boosted_until, likes,
        athletes (id, first_name, last_name, high_school, state, avatar_url, equipped_border, equipped_card, is_premium, grad_year)
      `).single();

      if (error) throw error;

      setCurrentUserProfile((prev: any) => ({ ...prev, coins: prev.coins - 100 }));
      setPosts((prev: any[]) => [data, ...prev.filter((p: any) => p.id !== activePost?.id)]);
      
      setFeaturedMsg(''); 
      setFeaturedSport('');
      setSelectedOtherSports([]);
      setIncludeGpa(false);
      setVideoFile(null);
      setVideoPreviewUrl(null);
      setIsFeatureFormOpen(false);
      localStorage.removeItem('chased_featured_draft');
      
      showToast(
        currentUserProfile.is_premium
          ? "You are now featured for 72 Hours!"
          : "You are now featured for 24 Hours!",
        "success"
      );
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsSubmitting(false);
      setSubmitStatus('');
    }
  };

  return (
    <main className="min-h-screen bg-[#06090F] text-white font-sans pb-32 relative selection:bg-blue-500/30 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none z-0"></div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes foilShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes shimmerGlare { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes shimmer { 100% { transform: translateX(100%); } }
        
        @keyframes heartExplode {
          0% { transform: scale(1); filter: drop-shadow(0 0 0px rgba(244,63,94,0)); }
          15% { transform: scale(1.3) rotate(-8deg); filter: drop-shadow(0 0 25px rgba(244,63,94,0.9)); }
          30% { transform: scale(0.95) rotate(5deg); }
          50% { transform: scale(1.1) rotate(-3deg); }
          100% { transform: scale(1); filter: drop-shadow(0 0 10px rgba(244,63,94,0.5)); }
        }
        
        @keyframes floatFire1 {
          0% { transform: translate(0, 0) scale(0) rotate(0deg); opacity: 0; }
          20% { opacity: 1; transform: translate(-12px, -20px) scale(1.5) rotate(-15deg); }
          80% { opacity: 0.8; transform: translate(-20px, -60px) scale(1.2) rotate(-20deg); }
          100% { transform: translate(-25px, -80px) scale(0.8) rotate(-25deg); opacity: 0; }
        }
        @keyframes floatFire2 {
          0% { transform: translate(0, 0) scale(0) rotate(0deg); opacity: 0; }
          20% { opacity: 1; transform: translate(15px, -25px) scale(1.6) rotate(15deg); }
          80% { opacity: 0.8; transform: translate(25px, -70px) scale(1.3) rotate(20deg); }
          100% { transform: translate(30px, -90px) scale(0.9) rotate(25deg); opacity: 0; }
        }
        @keyframes floatFire3 {
          0% { transform: translate(0, 0) scale(0) rotate(0deg); opacity: 0; }
          20% { opacity: 1; transform: translate(0px, -35px) scale(1.8) rotate(0deg); }
          80% { opacity: 0.8; transform: translate(3px, -85px) scale(1.4) rotate(5deg); }
          100% { transform: translate(5px, -110px) scale(1) rotate(10deg); opacity: 0; }
        }

        .animate-heart-explode { animation: heartExplode 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }

        .holo-card-base { background: transparent; }
        .holo-card-obsidian { background: linear-gradient(135deg, #0f172a 0%, #334155 25%, #000000 50%, #0f172a 75%, #1e293b 100%); background-size: 300% 300%; }
        .holo-card-crimson { background: linear-gradient(135deg, #450a0a 0%, #dc2626 50%, #450a0a 100%); background-size: 300% 300%; }
        .holo-card-sapphire { background: linear-gradient(135deg, #172554 0%, #0ea5e9 50%, #172554 100%); background-size: 300% 300%; }
        .holo-card-hype { background: linear-gradient(135deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent 100%), linear-gradient(135deg, #4f46e5 0%, #9333ea 25%, #ec4899 50%, #3b82f6 75%, #4f46e5 100%); background-size: 40px 40px, 300% 300%; }
        .holo-card-premium { background: repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 6px), linear-gradient(135deg, #b45309 0%, #f59e0b 25%, #fef08a 50%, #d97706 75%, #78350f 100%); background-size: 100% 100%, 300% 300%; }
        .holo-card-amethyst { background: radial-gradient(circle at 50% 50%, #c026d3 0%, #7e22ce 30%, #3b0764 80%, #000000 100%); }
        .holo-card-cyber { background: linear-gradient(rgba(16, 185, 129, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.15) 1px, transparent 1px), linear-gradient(135deg, #022c22 0%, #064e3b 50%, #083344 100%); background-size: 20px 20px, 20px 20px, 100% 100%; box-shadow: inset 0 0 40px rgba(6, 182, 212, 0.3); }
        .holo-card-mythic-flare { background: radial-gradient(circle at 50% 50%, #f43f5e 0%, #881337 40%, #000000 100%); }
        
        .animate-foil { animation: foilShift 15s ease-in-out infinite; }
        .holo-glare { position: absolute; inset: 0; background: linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.4) 25%, transparent 30%); background-size: 200% auto; animation: shimmerGlare 8s infinite linear; pointer-events: none; mix-blend-mode: overlay;}
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.2); border-radius: 10px; }
      `}} />

      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-5 fade-in duration-300 w-[90%] max-w-md">
          <div className={`rounded-2xl p-4 shadow-2xl border flex items-start gap-3 backdrop-blur-xl ${toast.type === 'error' ? 'bg-rose-950/90 border-rose-900/50 text-rose-200' : 'bg-emerald-950/90 border-emerald-900/50 text-emerald-200'}`}>
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" /> : <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />}
            <p className="text-xs font-bold leading-tight">{toast.message}</p>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 md:pt-20 relative z-30">
        
        {/* 🚨 CENTERED HERO TEXT 🚨 */}
        <div className="flex flex-col items-center justify-center text-center gap-3 mb-8">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white flex items-center justify-center gap-3">
            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Network</span>
          </h1>
          <p className="text-slate-400 font-medium text-sm md:text-base flex items-center justify-center gap-2">
            Multi-Sport Hub & Recruiting Directory
          </p>
        </div>

        {/* 🚨 SMOOTH 2-TAB SEGMENTED NAV (MATCHES DIRECTORY STYLE, NO TRENDING) 🚨 */}
        <div className="flex justify-center mb-10 w-full z-40 relative">
          <div className="flex items-center justify-between w-full max-w-sm md:max-w-none md:w-auto p-1.5 bg-[#0B101A]/80 backdrop-blur-2xl border border-white/10 rounded-2xl md:rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <Link 
              href="/feed" 
              className={`flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-3 py-2 md:px-7 md:py-2.5 rounded-xl md:rounded-full text-[10px] md:text-sm transition-all whitespace-nowrap ${
                pathname === '/feed' 
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Star className={`w-5 h-5 md:w-4 md:h-4 ${pathname === '/feed' ? 'text-blue-400 fill-blue-400/20 animate-pulse' : ''}`} /> 
              <span className="font-black uppercase tracking-wide md:normal-case md:tracking-normal md:font-bold">
                <span className="md:hidden">Featured</span>
                <span className="hidden md:inline">Featured Athletes</span>
              </span>
            </Link>

            <Link 
              href="/feed/network" 
              className={`flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-3 py-2 md:px-7 md:py-2.5 rounded-xl md:rounded-full text-[10px] md:text-sm transition-all whitespace-nowrap ${
                pathname === '/feed/network' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Users className={`w-5 h-5 md:w-4 md:h-4 ${pathname === '/feed/network' ? 'text-emerald-400 fill-emerald-400/20 animate-pulse' : ''}`} /> 
              <span className="font-black uppercase tracking-wide md:normal-case md:tracking-normal md:font-bold">
                Directory
              </span>
            </Link>
          </div>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 space-y-6">
          
          {/* 🚨 ATHLETE "FEATURE YOURSELF" SECTION 🚨 */}
          {viewerRole === 'athlete' && currentUserProfile && (
            currentUserProfile?.trust_level === 0 ? (
              /* 🚨 COMPACT UNVERIFIED ATHLETE BANNER 🚨 */
              <div className="bg-[#0B101A]/90 backdrop-blur-2xl border border-rose-500/30 rounded-[1.75rem] p-4 sm:p-5 shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between gap-4 opacity-20 blur-[3px] pointer-events-none select-none" aria-hidden="true">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-500/20 p-3 rounded-2xl">
                      <Star className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <div className="h-5 w-40 bg-white/30 rounded-md mb-1.5"></div>
                      <div className="h-3.5 w-56 bg-white/20 rounded-md"></div>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="h-9 w-24 bg-white/20 rounded-xl"></div>
                    <div className="h-9 w-20 bg-emerald-500/30 rounded-xl"></div>
                  </div>
                </div>

                <div className="absolute inset-0 z-20 bg-[#0B101A]/75 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 rounded-[1.75rem]">
                  <div className="flex items-center gap-3 text-center sm:text-left">
                    <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 shrink-0 hidden sm:flex">
                      <ShieldCheck className="w-6 h-6 text-rose-400 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-white font-black text-sm sm:text-base flex items-center justify-center sm:justify-start gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-rose-400 sm:hidden shrink-0" />
                        Verification Required to Feature Yourself
                      </h4>
                      <p className="text-slate-400 text-xs font-medium mt-0.5">
                        Verify your athlete profile to unlock the Featured Recruiting Board.
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/dashboard/profile"
                    className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(244,63,94,0.35)] shrink-0 whitespace-nowrap active:scale-95"
                  >
                    Verify Profile Now
                  </Link>
                </div>
              </div>
            ) : (
              /* 🚨 VERIFIED ATHLETE FEATURE DRAWER (DECLUTTERED HEADER + CLICKABLE LIKES) 🚨 */
              <div className="bg-[#0B101A]/80 backdrop-blur-2xl border border-white/10 hover:border-white/20 rounded-[2rem] p-5 sm:p-6 shadow-2xl relative overflow-hidden transition-all duration-500 group/container">
                <div className="absolute -inset-20 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none group-hover/container:bg-indigo-500/10 transition-colors"></div>
                
                <div 
                  onClick={() => setIsFeatureFormOpen(!isFeatureFormOpen)}
                  className="cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-b from-amber-400 to-amber-600 p-0.5 rounded-2xl shadow-[0_0_20px_rgba(251,191,36,0.3)] group-hover/container:shadow-[0_0_30px_rgba(251,191,36,0.5)] transition-shadow duration-500 shrink-0">
                      <div className="bg-[#0B101A] p-3 rounded-[14px]">
                        <Star className="w-6 h-6 text-amber-400 fill-amber-400/20" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white tracking-tight">
                        Feature Yourself
                      </h3>
                      <p className="text-slate-400 text-sm font-medium mt-0.5">
                        Pin your profile to the Recruiting Feed for {currentUserProfile.is_premium ? '72 hours' : '24 hours'}.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
                    <Link
                      href="/dashboard?view=performance&tab=analytics"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-2xl transition-colors shrink-0"
                    >
                      <BarChart3 className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-widest">Analytics</span>
                    </Link>
                    
                    {/* ❤️ CLICKABLE INSTAGRAM-STYLE LIKES ACTIVITY BUTTON ❤️ */}
                    <Link
                      href="/notifications"
                      onClick={(e) => e.stopPropagation()}
                      title="See who liked your posts"
                      className="flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 hover:border-rose-500/40 px-4 py-2.5 rounded-2xl transition-all shrink-0"
                    >
                      <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-black text-rose-100">{lastPostStats.likes}</span>
                        <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest hidden sm:inline">Likes</span>
                      </div>
                    </Link>

                    <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-2xl shrink-0 ml-auto sm:ml-0">
                      <Points className="w-5 h-5 text-emerald-400" />
                      <span className="text-sm font-black text-emerald-400">{currentUserProfile.coins}</span>
                    </div>

                    <div className={`ml-1 p-2 rounded-full bg-white/5 border border-white/10 transition-transform duration-300 ${isFeatureFormOpen ? 'rotate-180 bg-white/10' : ''}`}>
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>
                </div>

                {isFeatureFormOpen && (
                  <div className="animate-in slide-in-from-top-4 fade-in duration-300 pt-6 mt-6 border-t border-white/10 space-y-6 relative z-10">
                    
                    {activePost && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 mb-6 shadow-inner">
                        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                        <div>
                          <h4 className="text-sm font-black text-amber-300">Active Feature Detected</h4>
                          <p className="text-xs font-medium text-amber-400/80 mt-1">You currently have a post active in the feed. Publishing a new feature will automatically overwrite and replace your existing post.</p>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleCreateFeatured} className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Target className="w-3 h-3" /> Step 1: Select Sport to Promote
                          </label>
                          <Link href="/dashboard?view=performance" className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest flex items-center gap-1 transition-colors bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20">
                            <Activity className="w-3 h-3" /> Edit PRs & Stats
                          </Link>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {activeUserSports.length === 0 ? (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-rose-500/10 border border-rose-500/20 px-4 py-3 rounded-xl gap-4 w-full">
                              <p className="text-sm font-bold text-rose-400 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" /> You have no active sports. Please update your profile to feature yourself.
                              </p>
                              <Link href="/dashboard?view=performance" className="shrink-0 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 px-4 py-2 rounded-lg text-xs font-bold transition-colors border border-rose-500/30">
                                Add Sports & Stats
                              </Link>
                            </div>
                          ) : (
                            activeUserSports.map((sport: string) => (
                              <button
                                key={sport}
                                type="button"
                                onClick={() => {
                                  setFeaturedSport(sport);
                                  setSelectedOtherSports([]); 
                                }}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                                  featuredSport === sport
                                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.5)]'
                                    : 'bg-black/40 text-slate-300 border-white/10 hover:bg-white/10 hover:border-white/30'
                                }`}
                              >
                                {sport}
                              </button>
                            ))
                          )}
                        </div>
                      </div>

                      {featuredSport && (
                        <div className="animate-in fade-in slide-in-from-top-4 duration-300 space-y-6 border-t border-white/10 pt-6">
                          
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 flex items-center gap-2">
                              <Send className="w-3 h-3" /> Step 2: Recruiting Message <span className="text-rose-400">*</span>
                            </label>
                            <textarea 
                              value={featuredMsg} 
                              onChange={(e) => setFeaturedMsg(e.target.value)} 
                              placeholder={`Write a short pitch to ${featuredSport} coaches...`} 
                              required
                              className="w-full bg-black/40 border border-white/10 text-white rounded-xl px-4 py-3 h-24 resize-none focus:outline-none focus:border-indigo-500/50 font-medium text-sm placeholder:text-slate-600" 
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 flex items-center gap-2">
                              <Video className="w-3 h-3" /> Step 3: Add Highlight Video (Max 60s)
                            </label>
                            <div className="bg-black/20 border border-white/10 rounded-xl p-4">
                              <input 
                                type="file" 
                                accept="video/mp4,video/quicktime,video/webm" 
                                onChange={handleVideoSelect}
                                className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                              />
                            </div>
                          </div>

                          <div className="flex flex-col md:flex-row gap-6">
                            {availableOtherSports.length > 0 && (
                              <div className="flex-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 flex items-center gap-2">
                                  <Dumbbell className="w-3 h-3" /> Include Other Active Sports?
                                </label>
                                <div className="flex flex-wrap gap-2">
                                  {availableOtherSports.map((sport: string) => {
                                    const isSelected = selectedOtherSports.includes(sport);
                                    return (
                                      <button
                                        key={sport}
                                        type="button"
                                        onClick={() => toggleOtherSport(sport)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                          isSelected
                                            ? 'bg-blue-600/20 text-blue-300 border-blue-500/50'
                                            : 'bg-black/40 text-slate-400 border-white/10 hover:border-white/30'
                                        }`}
                                      >
                                        {isSelected ? <CheckCircle2 className="w-3 h-3 inline mr-1" /> : '+'} {sport}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {parsedGpa && (
                              <div className="shrink-0">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 flex items-center gap-2">
                                  <Award className="w-3 h-3" /> Bonus Features
                                </label>
                                <button 
                                  type="button" 
                                  onClick={() => setIncludeGpa(!includeGpa)}
                                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all ${
                                    includeGpa 
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                                      : 'bg-black/40 text-slate-400 border border-white/10 hover:border-white/30 hover:bg-white/5'
                                  }`}
                                >
                                  <GraduationCap className="w-4 h-4" />
                                  {includeGpa ? 'GPA Included!' : 'Add GPA Bonus'} {parsedGpa && `(${parsedGpa})`}
                                </button>
                              </div>
                            )}
                          </div>

                          {/* LIVE PREVIEW */}
                          <div className="mt-8 pt-6 border-t border-white/10 relative">
                            <span className="absolute -top-3 left-6 bg-[#0B0F19] px-3 text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 border border-indigo-500/20 rounded-full">
                              <Eye className="w-3 h-3" /> Live Preview
                            </span>
                            
                            <div className="opacity-95 pointer-events-none scale-[0.97] origin-top">
                              <div className="relative group">
                                {previewTheme.isDark && previewTheme.cardType !== 'base' && (
                                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-[2rem] blur-2xl opacity-20 transition-opacity duration-700"></div>
                                )}
                                <div className={`${previewTheme.heroCard} rounded-[2rem] p-6 sm:p-8 text-white relative overflow-hidden border`}>

                                  {previewTheme.isDark && (
                                    <>
                                      {['hype', 'premium', 'mythic-flare'].includes(previewTheme.cardType) && <div className="holo-glare rounded-[2rem] z-10"></div>}
                                      {['hype', 'premium', 'crimson', 'sapphire', 'amethyst', 'cyber', 'mythic-flare'].includes(previewTheme.cardType) && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] mix-blend-overlay pointer-events-none z-10 rounded-[2rem]"></div>}
                                    </>
                                  )}
                                  
                                  <div className="relative z-20 flex flex-col md:flex-row items-start gap-6">
                                    <div className="shrink-0 mx-auto sm:mx-0">
                                      <div className="block shadow-2xl rounded-full border-2 border-white/40 bg-slate-900">
                                        <AvatarWithBorder avatarUrl={currentUserProfile.avatar_url || ''} sizeClasses="w-20 h-20 sm:w-24 sm:h-24" borderId={currentUserProfile.equipped_border || 'none'} />
                                      </div>
                                    </div>
                                    <div className="flex-1 w-full text-center sm:text-left">
                                      
                                      {/* Top Badges Row with Single Sleek PRO Verified Pill */}
                                      <div className="flex flex-wrap items-center justify-center sm:justify-start w-full gap-2 mb-2">
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 backdrop-blur-md shadow-sm">
                                          <Star className="w-3 h-3 animate-pulse" /> Featured Prospect
                                        </div>

                                        {currentUserProfile.is_premium && (
                                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-cyan-500/25 via-purple-500/25 to-pink-500/25 border border-cyan-400/50 text-cyan-200 backdrop-blur-md shadow-[0_0_15px_rgba(34,211,238,0.25)]">
                                            <Crown className="w-3 h-3 text-cyan-400" /> PRO Verified
                                          </div>
                                        )}
                                        
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-black/40 border border-white/10 text-white/80 backdrop-blur-md shadow-sm">
                                          <Clock className="w-3 h-3 text-indigo-400" />
                                          <span>Ends in {currentUserProfile.is_premium ? '3d 0h' : '24h 0m'}</span>
                                        </div>
                                      </div>

                                      <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2.5 mb-1 mt-2">
                                        <div className={`text-3xl sm:text-4xl font-black tracking-tight drop-shadow-md leading-none flex items-center gap-2 ${previewTheme.heroName}`}>
                                          <span>{currentUserProfile.first_name} {currentUserProfile.last_name}</span>
                                        </div>
                                      </div>
                                      
                                      <p className={`text-[11px] font-bold uppercase tracking-widest mb-4 ${previewTheme.heroMeta}`}>
                                        '{currentUserProfile.grad_year?.toString().slice(-2) || 'XX'} • {currentUserProfile.state}
                                      </p>

                                      {videoPreviewUrl && (
                                        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 mb-4 bg-black/50">
                                          <video src={videoPreviewUrl} controls className="w-full h-full object-contain" />
                                        </div>
                                      )}

                                      <div className="flex flex-wrap gap-3 mb-4">
                                        <div className="bg-black/30 border border-white/10 rounded-xl p-3 backdrop-blur-md shadow-inner flex flex-col justify-center items-center sm:items-start grow sm:grow-0 min-w-[130px]">
                                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1"><Target className="w-3 h-3" /> Target Sport</span>
                                          <span className="font-bold text-sm text-white truncate w-full text-center sm:text-left">{featuredSport}</span>
                                        </div>

                                        {liveStats.slice(0, 3).map((stat: any, i: number) => {
                                          const label = stat.label || stat.name || stat.event || 'Stat';
                                          const val = stat.value || stat.mark || stat.time || '--';
                                          return (
                                            <div key={`stat-${i}`} className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 backdrop-blur-md shadow-inner flex flex-col justify-center items-center sm:items-start grow sm:grow-0 min-w-[130px] relative overflow-hidden">
                                              <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-blue-500/20 to-transparent pointer-events-none"></div>
                                              <span className="text-[9px] font-black text-blue-300 uppercase tracking-widest flex items-center gap-1 mb-0.5 relative z-10">
                                                <Activity className="w-3 h-3" /> {label}
                                              </span>
                                              <span className="font-black text-2xl text-blue-400 leading-none drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] relative z-10">{val}</span>
                                            </div>
                                          );
                                        })}

                                        {includeGpa && parsedGpa && (
                                          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 backdrop-blur-md shadow-inner flex flex-col justify-center items-center sm:items-start grow sm:grow-0 min-w-[100px] relative overflow-hidden">
                                            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-emerald-500/20 to-transparent pointer-events-none"></div>
                                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1 mb-1 relative z-10"><GraduationCap className="w-3 h-3" /> GPA</span>
                                            <span className="font-black text-xl text-emerald-300 leading-none drop-shadow-sm relative z-10">{parsedGpa}</span>
                                          </div>
                                        )}

                                        {liveScore && (
                                          <div className="bg-black/30 border border-white/10 rounded-xl p-3 backdrop-blur-md shadow-inner flex flex-col justify-center items-center sm:items-start grow sm:grow-0 min-w-[100px]">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1"><Activity className="w-3 h-3" /> Ovr Score</span>
                                            <span className="font-bold text-sm text-white truncate block w-full text-center sm:text-left">{liveScore}</span>
                                          </div>
                                        )}
                                      </div>

                                      <div className="flex flex-wrap gap-2 mb-4">
                                        {liveHonorsArray.map((honor: string, i: number) => (
                                          <div key={`honor-${i}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-full text-xs font-bold shadow-sm backdrop-blur-md">
                                            <Award className="w-3 h-3 text-amber-400 shrink-0" />
                                            <span className="truncate max-w-[200px]" title={honor}>{honor}</span>
                                          </div>
                                        ))}
                                      </div>

                                      {selectedOtherSports.length > 0 && (
                                        <div className="mb-4 flex flex-wrap items-center justify-center sm:justify-start gap-3 bg-black/40 p-3 rounded-2xl border border-white/5 shadow-inner">
                                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 pl-1">
                                            <Dumbbell className="w-4 h-4 text-indigo-400" /> Multi-Sport Athlete:
                                          </span>
                                          <div className="flex flex-wrap gap-2">
                                            {selectedOtherSports.map((s: string, i: number) => (
                                              <span key={i} className="px-3 py-1.5 bg-indigo-950/50 border border-indigo-500/30 rounded-xl text-[11px] font-bold text-indigo-100 shadow-sm">
                                                {s}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      <p className="text-sm md:text-base font-medium italic text-white/90 whitespace-pre-wrap leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5 text-left">
                                        "{featuredMsg || 'Write a short pitch to coaches...'}"
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-white/10 mt-4 gap-4">
                            <div className="flex flex-col w-full sm:w-auto text-center sm:text-left">
                              <span className="text-sm font-bold text-white flex items-center justify-center sm:justify-start gap-2">
                                <Clock className="w-4 h-4 text-cyan-400" /> 
                                Duration:{' '}
                                <span className={currentUserProfile.is_premium ? 'text-cyan-300 font-black' : 'text-slate-300'}>
                                  {currentUserProfile.is_premium ? '72 Hours (3 Days)' : '24 Hours (1 Day)'}
                                </span>
                              </span>
                            </div>
                            <button type="submit" disabled={isSubmitting || currentUserProfile.coins < 100 || !featuredSport || !featuredMsg.trim()} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-xl font-black text-base transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)] disabled:opacity-50 disabled:hover:scale-100 hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer">
                              {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                  {submitStatus || 'Posting...'}
                                </span>
                              ) : <><Points className="w-5 h-5 text-yellow-400" /> Post for 100 Points</>}
                            </button>
                          </div>
                        </div>
                      )}
                    </form>
                  </div>
                )}
              </div>
            )
          )}

          {/* 🚨 COACH-ONLY SCOUT & FILTER COMMAND BAR 🚨 */}
          {!loading && posts.length > 0 && viewerRole === 'coach' && (
            <div className="bg-[#0B101A]/90 backdrop-blur-2xl border border-white/10 rounded-[1.75rem] p-4 sm:p-5 shadow-xl space-y-4">
              
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">
                    Coach Recruiting Radar & Sport Search
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    ({filteredPosts.length} {filteredPosts.length === 1 ? 'Athlete' : 'Athletes'})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" /> Reset Filters
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleReshuffle}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all active:scale-95 cursor-pointer"
                    title="Randomize Feed Order"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-cyan-400" /> Shuffle Order
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
                <div className="md:col-span-6 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search sport, event (e.g. 5k, 100m), name, school, state..."
                    className="w-full bg-black/50 border border-white/10 focus:border-cyan-500/50 rounded-xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 font-medium focus:outline-none transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="md:col-span-3 relative">
                  <select
                    value={activeFilter}
                    onChange={(e) => setActiveFilter(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 focus:border-cyan-500/50 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-200 font-bold focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="All" className="bg-[#0B101A] text-white">All Sports ({posts.length})</option>
                    {Array.from(new Set([...activeSportsInFeed, ...ALL_SPORTS_LIST])).map((sport: string) => {
                      const count = sportCounts[sport] || 0;
                      return (
                        <option key={sport} value={sport} className="bg-[#0B101A] text-white">
                          {sport} {count > 0 ? `(${count})` : ''}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="md:col-span-3 flex items-center gap-2">
                  <div className="relative flex-1">
                    <select
                      value={selectedGradYear}
                      onChange={(e) => setSelectedGradYear(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 focus:border-cyan-500/50 rounded-xl px-2.5 py-2.5 text-xs text-slate-200 font-bold focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="All" className="bg-[#0B101A]">Class: All</option>
                      {availableGradYears.map((yr: string) => (
                        <option key={yr} value={yr} className="bg-[#0B101A]">Class of {yr}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {availableStates.length > 1 && (
                    <div className="relative flex-1">
                      <select
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        className="w-full bg-black/50 border border-white/10 focus:border-cyan-500/50 rounded-xl px-2.5 py-2.5 text-xs text-slate-200 font-bold focus:outline-none appearance-none cursor-pointer"
                      >
                        <option value="All" className="bg-[#0B101A]">State: All</option>
                        {availableStates.map((st: string) => (
                          <option key={st} value={st} className="bg-[#0B101A]">{st}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setOnlyWithVideo(!onlyWithVideo)}
                    title="Filter athletes with Highlight Videos"
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      onlyWithVideo
                        ? 'bg-indigo-600/30 border-indigo-400 text-indigo-200 shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                        : 'bg-black/50 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Film</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 pt-0.5">
                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-500 shrink-0 mr-1">
                  <Filter className="w-3 h-3" /> Sports:
                </div>

                <button
                  type="button"
                  onClick={() => setActiveFilter('All')}
                  className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all border shrink-0 cursor-pointer ${
                    activeFilter === 'All'
                      ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                      : 'bg-black/40 text-slate-400 border-white/10 hover:border-white/30 hover:bg-white/5'
                  }`}
                >
                  All ({posts.length})
                </button>

                {(showAllSportDropdown ? Array.from(new Set([...activeSportsInFeed, ...ALL_SPORTS_LIST])) : activeSportsInFeed).map((sportOption: string) => {
                  const count = sportCounts[sportOption] || 0;
                  return (
                    <button
                      key={sportOption}
                      type="button"
                      onClick={() => setActiveFilter(sportOption)}
                      className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all border shrink-0 cursor-pointer flex items-center gap-1.5 ${
                        activeFilter === sportOption
                          ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                          : 'bg-black/40 text-slate-300 border-white/10 hover:border-white/30 hover:bg-white/5'
                      }`}
                    >
                      <span>{sportOption}</span>
                      {count > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeFilter === sportOption ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-400'}`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setShowAllSportDropdown(!showAllSportDropdown)}
                  className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/5 hover:bg-white/10 text-cyan-400 border border-cyan-500/20 shrink-0 cursor-pointer"
                >
                  {showAllSportDropdown ? 'Show Active Only' : '+ All Sports'}
                </button>
              </div>
            </div>
          )}

          {/* 🚨 FEED CONTENT / LOADING / EMPTY STATES 🚨 */}
          {loading ? (
            <div className="space-y-6 w-full animate-in fade-in duration-500">
              {[1, 2, 3].map((i: number) => (
                <div key={i} className="w-full bg-[#0B101A]/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 sm:p-8 relative overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/5 shrink-0 mx-auto sm:mx-0"></div>
                    <div className="flex-1 space-y-4 py-2 w-full">
                      <div className="h-4 bg-white/5 rounded-full w-24 mx-auto sm:mx-0"></div>
                      <div className="h-8 bg-white/5 rounded-full w-3/4 mx-auto sm:mx-0"></div>
                      <div className="h-3 bg-white/5 rounded-full w-1/2 mx-auto sm:mx-0"></div>
                      <div className="flex flex-wrap gap-3 mt-6 justify-center sm:justify-start">
                        <div className="h-20 bg-white/5 rounded-xl w-full sm:w-32 grow sm:grow-0"></div>
                        <div className="h-20 bg-white/5 rounded-xl w-full sm:w-32 grow sm:grow-0"></div>
                        <div className="h-20 bg-white/5 rounded-xl w-full sm:w-32 grow sm:grow-0 hidden sm:block"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="relative overflow-hidden flex flex-col items-center justify-center text-center py-20 px-4 bg-[#0B101A]/40 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] group w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] group-hover:bg-indigo-500/20 transition-colors duration-700 pointer-events-none"></div>

              <div className="bg-gradient-to-b from-indigo-500/10 to-transparent p-6 rounded-full border border-indigo-500/20 shadow-inner mb-6 relative z-10">
                <Star className="w-12 h-12 text-indigo-400 fill-indigo-400/20 group-hover:scale-110 transition-transform duration-500" />
              </div>

              <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3 relative z-10">
                {hasActiveFilters ? 'No Matching Recruits Found' : 'The Stage is Yours'}
              </h3>
              <p className="text-slate-400 font-medium text-sm sm:text-base max-w-md mb-8 relative z-10 leading-relaxed">
                {hasActiveFilters
                  ? `No currently featured athletes match "${activeFilter !== 'All' ? activeFilter : searchQuery || 'your selected filters'}". Try clearing your filters or searching another sport.`
                  : 'There are no active featured athletes right now. Be the first to claim the spotlight and get seen by college coaches nationwide.'}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 relative z-10">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white px-6 py-3.5 rounded-2xl font-black text-sm border border-white/15 transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" /> Show All Featured Athletes
                  </button>
                )}

                {viewerRole === 'athlete' && currentUserProfile?.trust_level > 0 && !isFeatureFormOpen && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsFeatureFormOpen(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex items-center gap-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white px-8 py-3.5 rounded-2xl font-black text-sm shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_30px_rgba(79,70,229,0.6)] transition-all hover:-translate-y-1 active:scale-95 cursor-pointer"
                  >
                    <Star className="w-4 h-4 fill-white/20" /> Feature My Profile Now
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6 w-full">
              {filteredPosts.map((post: EnrichedPost) => {
                if (!post.athletes) return null;
                const feedTheme = getThemeConfig(post.athletes.equipped_card);
                const payload = post.parsedPayload;
                const isProAthlete = Boolean(post.athletes.is_premium);

                const payloadHonorsArray = parseHonors(payload.honors);
                const likesArray: string[] = Array.isArray(post.likes) ? post.likes : [];
                const hasLiked = currentUserId ? likesArray.includes(currentUserId) : false;
                const isOwnPost = currentUserId === post.athlete_id;
                
                return (
                  <div 
                    key={post.id} 
                    data-post-id={post.id} 
                    data-athlete-id={post.athlete_id}
                    className="feed-post-card relative group hover:-translate-y-1 transition-transform duration-500 animate-in fade-in slide-in-from-bottom-2"
                  >
                    {feedTheme.isDark && feedTheme.cardType !== 'base' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-[2rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
                    )}
                    
                    {/* Like Button + Clickable Likes Count for Post Owner */}
                    <div className="absolute top-6 right-6 z-50 flex flex-col items-center">
                      <button 
                        onClick={() => handleLike(post.id, likesArray)} 
                        className={`group/like relative p-3 rounded-full backdrop-blur-xl border transition-all duration-300 ease-out active:scale-90 cursor-pointer ${hasLiked ? 'bg-rose-500/20 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 'bg-black/40 border-white/10 hover:bg-white/10 hover:border-white/30'} ${animatingLikeId === post.id ? 'animate-heart-explode' : ''}`}
                        aria-label="Like Post"
                      >
                        <Heart className={`w-5 h-5 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${hasLiked ? 'fill-rose-500 text-rose-500 scale-110' : 'text-white group-hover/like:scale-110'}`} />
                        
                        {animatingLikeId === post.id && (
                          <>
                            <span className="absolute pointer-events-none drop-shadow-md left-0 -top-2" style={{ animation: 'floatFire1 1s ease-out forwards', animationDelay: '0s', opacity: 0, fontSize: '1.5rem', zIndex: 100 }}>🔥</span>
                            <span className="absolute pointer-events-none drop-shadow-md right-0 -top-4" style={{ animation: 'floatFire2 1s ease-out forwards', animationDelay: '0.1s', opacity: 0, fontSize: '1.2rem', zIndex: 100 }}>🔥</span>
                            <span className="absolute pointer-events-none drop-shadow-md left-2 -top-6" style={{ animation: 'floatFire3 1.2s ease-out forwards', animationDelay: '0.2s', opacity: 0, fontSize: '1.8rem', zIndex: 100 }}>🔥</span>
                          </>
                        )}
                      </button>

                      {likesArray.length > 0 && (
                        isOwnPost ? (
                          <Link
                            href="/notifications"
                            title="View who liked your post"
                            className="mt-1.5 text-[10px] font-black text-rose-200 hover:text-white bg-rose-500/20 hover:bg-rose-500/35 px-2.5 py-0.5 rounded-full border border-rose-500/40 backdrop-blur-md transition-colors"
                          >
                            {likesArray.length} {likesArray.length === 1 ? 'Like' : 'Likes'}
                          </Link>
                        ) : (
                          <span className="mt-1.5 text-[10px] font-black text-white/80 bg-black/40 px-2.5 py-0.5 rounded-full border border-white/10 backdrop-blur-md">
                            {likesArray.length} {likesArray.length === 1 ? 'Like' : 'Likes'}
                          </span>
                        )
                      )}
                    </div>

                    <div className={`${feedTheme.heroCard} rounded-[2rem] p-6 sm:p-8 text-white relative overflow-hidden border`}>

                      {feedTheme.isDark && (
                        <>
                          {['hype', 'premium', 'mythic-flare'].includes(feedTheme.cardType) && <div className="holo-glare rounded-[2rem] z-10"></div>}
                          {['hype', 'premium', 'crimson', 'sapphire', 'amethyst', 'cyber', 'mythic-flare'].includes(feedTheme.cardType) && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] mix-blend-overlay pointer-events-none rounded-[2rem] z-10"></div>}
                        </>
                      )}
                      
                      <div className="relative z-20 flex flex-col md:flex-row items-start gap-6">
                        <div className="shrink-0 mx-auto sm:mx-0">
                          <Link href={`/athlete/${post.athlete_id}`} className="block shadow-2xl rounded-full border-2 border-white/40 bg-slate-900 group-hover:scale-105 transition-transform duration-300">
                            <AvatarWithBorder avatarUrl={post.athletes.avatar_url || ''} sizeClasses="w-20 h-20 sm:w-24 sm:h-24" borderId={post.athletes.equipped_border || 'none'} />
                          </Link>
                        </div>

                        <div className="flex-1 w-full text-center sm:text-left pr-0 sm:pr-20">
                          
                          {/* Top Status Pills Row: Featured Prospect + Single Clickable PRO Verified Pill + Countdown */}
                          <div className="flex flex-wrap items-center justify-center sm:justify-start w-full gap-2 mb-2">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 backdrop-blur-md shadow-sm">
                              <Star className="w-3 h-3 animate-pulse" /> Featured Prospect
                            </div>

                            {/* 🚨 SINGLE OBVIOUS CLICKABLE "PRO VERIFIED" PILL -> LINKS TO /PRO 🚨 */}
                            {isProAthlete && (
                              <Link
                                href="/pro"
                                title="ChasedSports PRO Verified — Click to view PRO benefits"
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-cyan-500/25 via-purple-500/25 to-pink-500/25 hover:from-cyan-500/40 hover:via-purple-500/40 hover:to-pink-500/40 border border-cyan-400/50 text-cyan-200 backdrop-blur-md shadow-[0_0_15px_rgba(34,211,238,0.25)] hover:scale-105 transition-all"
                              >
                                <Crown className="w-3 h-3 text-cyan-400" /> PRO Verified
                              </Link>
                            )}
                            
                            <div className="flex items-center gap-2">
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-black/40 border border-white/10 text-white/80 backdrop-blur-md shadow-sm">
                                <Clock className="w-3 h-3 text-indigo-400" />
                                <span>Ends in {getTimeRemaining(post.boosted_until)}</span>
                              </div>

                              {isOwnPost && (
                                <button 
                                  onClick={() => handleDeletePost(post.id)}
                                  disabled={isDeleting === post.id}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-500/20 hover:bg-rose-500/40 border border-rose-500/30 text-rose-300 transition-colors backdrop-blur-md shadow-sm cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" /> {isDeleting === post.id ? '...' : 'Delete'}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Athlete Name + Contact CTA */}
                          <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 mb-1 mt-2">
                            <Link href={`/athlete/${post.athlete_id}`} className={`text-3xl sm:text-4xl font-black tracking-tight drop-shadow-md leading-none flex items-center gap-2 ${feedTheme.heroName} hover:opacity-80 transition-opacity`}>
                              <span>{post.athletes.first_name} {post.athletes.last_name}</span>
                            </Link>

                            {!isOwnPost && (
                              <Link href={`/athlete/${post.athlete_id}`} className="bg-indigo-600/20 text-indigo-300 hover:bg-indigo-500 hover:text-white border border-indigo-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all text-xs font-black shadow-sm tracking-widest uppercase ml-1">
                                <Send className="w-3.5 h-3.5" /> {viewerRole === 'coach' ? 'Recruit / Contact' : 'View Profile'}
                              </Link>
                            )}
                          </div>

                          <p className={`text-[11px] font-bold uppercase tracking-widest mb-4 ${feedTheme.heroMeta}`}>
                            Class of '{post.athletes.grad_year?.toString().slice(-2) || 'XX'}
                            {post.athletes.high_school ? ` • ${post.athletes.high_school}` : ''}
                            {post.athletes.state ? ` • ${post.athletes.state}` : ''}
                          </p>

                          {/* 🚨 TIKTOK-STYLE CLOUDFLARE VIDEO COMPONENT WITH AUTO-PAUSE 🚨 */}
                          {payload.cloudflareUid && (
                            <CloudflareStreamVideo uid={payload.cloudflareUid} />
                          )}

                          {/* Target Sport & Key Metrics Row */}
                          <div className="flex flex-wrap gap-3 mb-4">
                            <div className="bg-black/30 border border-white/10 rounded-xl p-3 backdrop-blur-md shadow-inner flex flex-col justify-center items-center sm:items-start grow sm:grow-0 min-w-[130px] text-left">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                                <Target className="w-3 h-3 text-cyan-400" /> Target Sport
                              </span>
                              <span className="font-bold text-sm text-white truncate w-full text-center sm:text-left">
                                {payload.sport || 'Undecided'}
                              </span>
                            </div>
                            
                            {payload.stats && Array.isArray(payload.stats) && payload.stats.slice(0, 3).map((stat: any, i: number) => {
                              const label = stat.label || stat.name || stat.event || 'Stat';
                              const val = stat.value || stat.mark || stat.time || '--';
                              return (
                                <div key={`stat-${i}`} className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 backdrop-blur-md shadow-inner flex flex-col justify-center items-center sm:items-start grow sm:grow-0 min-w-[130px] relative overflow-hidden">
                                  <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-blue-500/20 to-transparent pointer-events-none"></div>
                                  <span className="text-[9px] font-black text-blue-300 uppercase tracking-widest flex items-center gap-1 mb-0.5 relative z-10">
                                    <Activity className="w-3 h-3" /> {label}
                                  </span>
                                  <span className="font-black text-2xl text-blue-400 leading-none drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] relative z-10">{val}</span>
                                </div>
                              );
                            })}

                            {payload.gpa && (
                              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 backdrop-blur-md shadow-inner flex flex-col justify-center items-center sm:items-start grow sm:grow-0 min-w-[100px] relative overflow-hidden">
                                <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-emerald-500/20 to-transparent pointer-events-none"></div>
                                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1 mb-1 relative z-10"><GraduationCap className="w-3 h-3" /> GPA</span>
                                <span className="font-black text-xl text-emerald-300 leading-none drop-shadow-sm relative z-10">{payload.gpa}</span>
                              </div>
                            )}

                            {payload.score && (
                              <div className="bg-black/30 border border-white/10 rounded-xl p-3 backdrop-blur-md shadow-inner flex flex-col justify-center items-center sm:items-start grow sm:grow-0 min-w-[100px]">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1"><Activity className="w-3 h-3" /> Ovr Score</span>
                                <span className="font-bold text-sm text-white truncate block w-full text-center sm:text-left">{payload.score}</span>
                              </div>
                            )}
                          </div>

                          {/* Honors Row */}
                          <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
                            {payloadHonorsArray.map((honor: string, i: number) => (
                              <div key={`honor-${i}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-full text-xs font-bold shadow-sm backdrop-blur-md">
                                <Award className="w-3 h-3 text-amber-400 shrink-0" />
                                <span className="truncate max-w-[220px]" title={honor}>{honor}</span>
                              </div>
                            ))}
                          </div>

                          {/* Multi-Sport Pills */}
                          {payload.otherSports && payload.otherSports.length > 0 && (
                            <div className="mb-4 flex flex-wrap items-center justify-center sm:justify-start gap-3 bg-black/40 p-3 rounded-2xl border border-white/5 shadow-inner">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 pl-1">
                                <Dumbbell className="w-4 h-4 text-indigo-400" /> Multi-Sport Athlete:
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {payload.otherSports.map((s: string, i: number) => (
                                  <span
                                    key={i}
                                    className="px-3 py-1.5 bg-indigo-950/50 border border-indigo-500/30 rounded-xl text-[11px] font-bold text-indigo-100 shadow-sm"
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <p className="text-sm md:text-base font-medium italic text-white/90 whitespace-pre-wrap leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5 text-left">
                            "{payload.text}"
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}