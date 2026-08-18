'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, usePathname } from 'next/navigation'; 
import { ShieldCheck, CheckCircle2, AlertCircle, Flame, Users, Star, Crown, Send, Target, Award, Info, Clock, Activity, GraduationCap, Dumbbell, Eye, Filter, Heart, Search, Trash2, ChevronDown, BarChart3, Video, Maximize2 } from 'lucide-react';
import Link from 'next/link';
import { AvatarWithBorder } from '@/components/AnimatedBorders';
import { Points } from '@/components/Points';

// 🚨 THEME ENGINE: DYNAMICALLY SKINS THE POST CARDS 🚨
const getThemeConfig = (cardType: string | null | undefined) => {
  const safeCardType = cardType === 'default' || !cardType ? 'base' : cardType;
  const isBase = safeCardType === 'base';

  if (isBase) {
    return {
      isDark: false,
      cardType: safeCardType,
      heroCard: 'bg-white/90 backdrop-blur-xl border-white/50 shadow-xl',
      heroName: 'text-slate-900',
      heroMeta: 'text-slate-600',
      statBadge: 'bg-slate-100 border-slate-200 text-slate-700',
    };
  }

  const map: Record<string, any> = {
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
        const parsed = rawHonors.map((h: any) => {
            if (typeof h === 'string') return h.trim();
            if (typeof h === 'object' && h !== null) {
                if (h.placement && h.level) return `${h.placement} ${h.level}`;
                if (h.level) return h.level;
                if (h.placement) return h.placement;
                return h.type || 'Accolade';
            }
            return '';
        }).filter(h => h.length > 0);
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
    
    // Disable auto-pausing mechanics if the user explicitly launched full screen
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
      threshold: 0.6 // Requires 60% of the video container to be visible
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
        <>
          <iframe
            ref={iframeRef}
            src={`https://customer-4lk9yxcqvek697fx.cloudflarestream.com/${uid}/iframe?controls=false&autoplay=false&loop=true&muted=true&preload=auto&letterboxColor=transparent`}
            className={`border-none absolute h-full w-full bg-transparent pointer-events-none ${isFullscreen ? 'max-w-full max-h-full object-contain inset-0 m-auto' : 'top-0 left-0'}`}
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
          ></iframe>
        </>
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
  const [lastPostStats, setLastPostStats] = useState<{likes: number, views: number} | null>(null);

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

  const [activeFilter, setActiveFilter] = useState<string>('All');
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
        if (parsed.selectedOtherSports) setSelectedOtherSports(parsed.selectedOtherSports);
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
      
      supabase.from('posts')
        .delete()
        .eq('athlete_id', session.user.id)
        .eq('channel', 'featured')
        .lt('boosted_until', new Date().toISOString())
        .then();

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
          
          const { data: lpData } = await supabase.from('posts').select('likes').eq('athlete_id', session.user.id).eq('channel', 'featured').order('created_at', { ascending: false }).limit(1).maybeSingle();
          if (lpData) {
              setLastPostStats({ likes: lpData.likes?.length || 0, views: aData.profile_views || 0 });
          }
        }
      }
    }

    const { data: feedData } = await supabase
      .from('posts')
      .select(`
        id, content, created_at, athlete_id, channel, is_boosted, boosted_until, likes,
        athletes (id, first_name, last_name, state, avatar_url, equipped_border, equipped_card, is_premium, grad_year)
      `)
      .eq('channel', 'featured')
      .gte('boosted_until', new Date().toISOString())
      .order('created_at', { ascending: false });
      
    setPosts(feedData || []);
    setLoading(false);
  }

  // 🚨 FEED IMPRESSION TRACKER (SECURE RPC UPDATE) 🚨
  const handleImpression = useCallback(async (athleteId: string) => {
    // Avoid incrementing analytics when viewing your own post
    if (athleteId === currentUserId) return;
    
    try {
        // Trigger the Supabase RPC atomic increment to safely bypass RLS
        await supabase.rpc('increment_search_appearances', { target_athlete_id: athleteId });
    } catch (e) {
        console.error("Failed to track feed impression");
    }
  }, [currentUserId]);

  useEffect(() => {
    if (posts.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
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
    }, { threshold: 0.4 }); // Trigger when 40% of the post is visible

    // Ensure DOM layout is fully painted before querying for cards
    setTimeout(() => {
       const cards = document.querySelectorAll('.feed-post-card');
       cards.forEach(card => observer.observe(card));
    }, 100);

    return () => observer.disconnect();
  }, [posts, activeFilter, handleImpression]);

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
            showToast("Highlight must be exactly 60 seconds or less.", "error");
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
    }
    videoElement.src = URL.createObjectURL(file);
  };

  const handleLike = async (postId: string, currentLikes: string[] = []) => {
      if (viewerRole === 'guest' || !currentUserId) {
          return showToast("Please log in to like posts.", "error");
      }

      const hasLiked = currentLikes.includes(currentUserId);
      const newLikes = hasLiked
          ? currentLikes.filter(id => id !== currentUserId)
          : [...currentLikes, currentUserId];

      setPosts(posts.map(p => p.id === postId ? { ...p, likes: newLikes } : p));

      if (!hasLiked) {
          setAnimatingLikeId(postId);
          setTimeout(() => setAnimatingLikeId(null), 1200); 
      }

      const { error } = await supabase.from('posts').update({ likes: newLikes }).eq('id', postId);
      if (error) {
          setPosts(posts.map(p => p.id === postId ? { ...p, likes: currentLikes } : p));
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
          setPosts(posts.filter(p => p.id !== postId));
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

  const activeUserSports = currentUserProfile?.athlete_sports
    ?.filter((s: any) => s.is_active === true)
    .map((s: any) => s.sport_name) || [];

  const availableOtherSports = activeUserSports.filter((s: string) => s !== featuredSport);

  const toggleOtherSport = (sport: string) => {
      setSelectedOtherSports(prev => 
          prev.includes(sport) ? prev.filter(s => s !== sport) : [...prev, sport]
      );
  };

  let liveScore = null;
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

  const activePost = posts.find(p => p.athlete_id === currentUserId);

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

      const days = currentUserProfile.is_premium ? 6 : 3;
      const boostedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

      const payload = { 
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
      }).select(`id, content, created_at, athlete_id, channel, is_boosted, boosted_until, likes, athletes (id, first_name, last_name, state, avatar_url, equipped_border, equipped_card, is_premium, grad_year)`).single();

      if (error) throw error;

      setCurrentUserProfile((prev: any) => ({ ...prev, coins: prev.coins - 100 }));
      setPosts((prev) => [data, ...prev.filter(p => p.id !== activePost?.id)]);
      
      setFeaturedMsg(''); 
      setFeaturedSport('');
      setSelectedOtherSports([]);
      setIncludeGpa(false);
      setVideoFile(null);
      setVideoPreviewUrl(null);
      setIsFeatureFormOpen(false);
      localStorage.removeItem('chased_featured_draft');
      
      showToast("You are now featured!", "success");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsSubmitting(false);
      setSubmitStatus('');
    }
  };

  const availableFilters = ['All', ...Array.from(new Set(posts.map(post => {
      try { return JSON.parse(post.content).sport; } catch(e) { return null; }
  })))].filter(Boolean) as string[];

  const filteredPosts = activeFilter === 'All' 
      ? posts 
      : posts.filter(post => {
          try { return JSON.parse(post.content).sport === activeFilter; } catch(e) { return false; }
      });

  return (
    <main className="min-h-screen bg-[#06090F] text-white font-sans pb-32 relative selection:bg-blue-500/30 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none z-0"></div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes foilShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes shimmerGlare { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        
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
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-2 text-white flex items-center gap-3">
                  The <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Network</span>
                </h1>
                <p className="text-slate-400 font-medium text-sm md:text-base flex items-center gap-2">
                    Multi-Sport Hub & Recruiting Directory
                </p>
            </div>
        </div>

        <div className="flex gap-4 mb-8 overflow-x-auto custom-scrollbar pb-1 border-b border-white/5 relative">
          <Link href="/feed" className={`pb-4 text-sm font-bold transition-all relative flex items-center gap-2 ${pathname === '/feed' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
            <Star className="w-4 h-4" /> Featured Athletes 
            {pathname === '/feed' && <><div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /><div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full" /></>}
          </Link>
          <Link href="/feed/discussions" className={`pb-4 text-sm font-bold transition-all relative flex items-center gap-2 ${pathname === '/feed/discussions' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
            <Flame className="w-4 h-4" /> Trending Discussions
          </Link>
          <Link href="/feed/network" className={`pb-4 text-sm font-bold transition-all relative flex items-center gap-2 ${pathname === '/feed/network' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
            <Users className="w-4 h-4" /> Directory
          </Link>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 space-y-8">
            
            {viewerRole === 'athlete' && currentUserProfile && (
              <div className="bg-[#0B101A]/80 backdrop-blur-2xl border border-white/10 hover:border-white/20 rounded-[2rem] p-5 sm:p-6 shadow-2xl relative overflow-hidden transition-all duration-500 group/container">
                <div className="absolute -inset-20 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none group-hover/container:bg-indigo-500/10 transition-colors"></div>
                
                <div 
                    onClick={() => setIsFeatureFormOpen(!isFeatureFormOpen)}
                    className="cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-b from-amber-400 to-amber-600 p-0.5 rounded-2xl shadow-[0_0_20px_rgba(251,191,36,0.3)] group-hover/container:shadow-[0_0_30px_rgba(251,191,36,0.5)] transition-shadow duration-500 shrink-0">
                            <div className="bg-[#0B101A] p-3 rounded-[14px]">
                                <Star className="w-6 h-6 text-amber-400 fill-amber-400/20" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                                Feature Yourself
                            </h3>
                            <p className="text-slate-400 text-sm font-medium mt-0.5">Pin your profile to the top of the directory.</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                        <Link href="/dashboard?view=performance&tab=analytics" onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-2xl transition-colors shrink-0">
                            <BarChart3 className="w-4 h-4 text-blue-400" />
                            <span className="text-xs font-bold text-white uppercase tracking-widest">Analytics</span>
                        </Link>
                        
                        {lastPostStats !== null && (
                            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 rounded-2xl shrink-0">
                                <Heart className="w-4 h-4 text-rose-500" />
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-sm font-black text-rose-100">{lastPostStats.likes}</span>
                                    <span className="text-[10px] font-black text-rose-500/80 uppercase tracking-widest hidden sm:inline">Likes</span>
                                </div>
                            </div>
                        )}

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
                                          onChange={e => setFeaturedMsg(e.target.value)} 
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

                                  <div className="mt-8 pt-6 border-t border-white/10 relative">
                                      <span className="absolute -top-3 left-6 bg-[#0B0F19] px-3 text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 border border-indigo-500/20 rounded-full">
                                          <Eye className="w-3 h-3" /> Live Preview
                                      </span>
                                      
                                      <div className="opacity-90 pointer-events-none scale-[0.95] origin-top">
                                          <div className="relative group">
                                              {previewTheme.isDark && previewTheme.cardType !== 'base' && <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-[2rem] blur-2xl opacity-20 transition-opacity duration-700"></div>}
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
                                                        
                                                        <div className="flex flex-wrap items-center justify-between sm:justify-start w-full gap-2 mb-2">
                                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 backdrop-blur-md shadow-sm">
                                                                <Star className="w-3 h-3 animate-pulse" /> Featured Prospect
                                                            </div>
                                                            
                                                            <div className="flex items-center gap-2 mx-auto sm:mx-0">
                                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-black/40 border border-white/10 text-white/80 backdrop-blur-md shadow-sm">
                                                                    <Clock className="w-3 h-3 text-indigo-400" /> Ends in {currentUserProfile.is_premium ? '6d 0h' : '3d 0h'}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 mb-1 mt-2">
                                                            <div className={`text-3xl sm:text-4xl font-black tracking-tight drop-shadow-md leading-none flex items-center gap-2 ${previewTheme.heroName}`}>
                                                                <span>{currentUserProfile.first_name} {currentUserProfile.last_name}</span>
                                                                {currentUserProfile.is_premium && <Crown className="w-5 h-5 text-yellow-400 drop-shadow-sm shrink-0" />}
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
                                                               )
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
                                           <Clock className="w-4 h-4 text-indigo-400" /> 
                                           Duration: {currentUserProfile.is_premium ? '6 Days (Premium Boost)' : '3 Days'}
                                        </span>
                                        {!currentUserProfile.is_premium && (
                                           <Link href="/pro" className="mt-2.5 sm:mt-2 inline-flex items-center justify-center gap-1.5 text-[10px] font-black text-amber-950 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 px-4 py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(251,191,36,0.3)] hover:-translate-y-0.5 active:scale-95 w-full sm:w-auto uppercase tracking-widest border border-amber-300/50">
                                              <Crown className="w-3.5 h-3.5" /> Upgrade to Premium for 6 Days
                                           </Link>
                                        )}
                                     </div>
                                     <button type="submit" disabled={isSubmitting || currentUserProfile.coins < 100 || !featuredSport || !featuredMsg.trim()} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-xl font-black text-base transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)] disabled:opacity-50 disabled:hover:scale-100 hover:-translate-y-0.5 flex items-center justify-center gap-2">
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
            )}

            {!loading && posts.length > 0 && availableFilters.length > 1 && (
                <div className="flex flex-wrap items-center gap-2 mb-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 mr-2">
                        <Filter className="w-3 h-3" /> Filter:
                    </div>
                    {availableFilters.map(filterOption => (
                        <button
                            key={filterOption}
                            onClick={() => setActiveFilter(filterOption)}
                            className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all border ${
                                activeFilter === filterOption
                                    ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                                    : 'bg-black/40 text-slate-400 border-white/10 hover:border-white/30 hover:bg-white/5'
                            }`}
                        >
                            {filterOption}
                        </button>
                    ))}
                </div>
            )}

            {loading ? (
               <div className="text-center py-20 animate-pulse"><Star className="w-8 h-8 text-white/20 mx-auto" /></div>
            ) : filteredPosts.length === 0 ? (
               <div className="text-center py-20 bg-white/[0.01] rounded-[2rem] border border-white/5 border-dashed">
                  <Star className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">No active featured athletes found</h3>
                  <p className="text-slate-500 text-sm">Adjust your filters or be the first to feature yourself.</p>
               </div>
            ) : (
               filteredPosts.map(post => {
                  if (!post.athletes) return null;
                  const feedTheme = getThemeConfig(post.athletes.equipped_card);
                  
                  let payload = { text: '', sport: '', honors: '', score: null, gpa: null, otherSports: [], stats: [], cloudflareUid: null };
                  try { 
                    const parsed = JSON.parse(post.content); 
                    payload = { ...payload, ...parsed };
                  } catch (e) { 
                    payload.text = post.content; 
                  }

                  const payloadHonorsArray = parseHonors(payload.honors);
                  const likesArray = post.likes || [];
                  const hasLiked = currentUserId ? likesArray.includes(currentUserId) : false;
                  
                  return (
                    <div 
                      key={post.id} 
                      data-post-id={post.id} 
                      data-athlete-id={post.athlete_id}
                      className="feed-post-card relative group hover:-translate-y-1 transition-transform duration-500 animate-in fade-in slide-in-from-bottom-2"
                    >
                        {feedTheme.isDark && feedTheme.cardType !== 'base' && <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-[2rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>}
                        
                        <div className="absolute top-6 right-6 z-50 flex flex-col items-center">
                            <button 
                                onClick={() => handleLike(post.id, likesArray)} 
                                className={`group/like relative p-3 rounded-full backdrop-blur-xl border transition-all duration-300 ease-out active:scale-90 ${hasLiked ? 'bg-rose-500/20 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 'bg-black/40 border-white/10 hover:bg-white/10 hover:border-white/30'} ${animatingLikeId === post.id ? 'animate-heart-explode' : ''}`}
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
                                <span className="mt-1.5 text-[10px] font-black text-white/80 bg-black/40 px-2.5 py-0.5 rounded-full border border-white/10 backdrop-blur-md">
                                    {likesArray.length} {likesArray.length === 1 ? 'Like' : 'Likes'}
                                </span>
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
                               <div className="flex-1 w-full text-center sm:text-left pr-12 sm:pr-20">
                                  
                                  <div className="flex flex-wrap items-center justify-between sm:justify-start w-full gap-2 mb-2">
                                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 backdrop-blur-md shadow-sm">
                                          <Star className="w-3 h-3 animate-pulse" /> Featured Prospect
                                      </div>
                                      
                                      <div className="flex items-center gap-2 mx-auto sm:mx-0">
                                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-black/40 border border-white/10 text-white/80 backdrop-blur-md shadow-sm">
                                              <Clock className="w-3 h-3 text-indigo-400" /> Ends in {getTimeRemaining(post.boosted_until)}
                                          </div>

                                          {currentUserId === post.athlete_id && (
                                              <button 
                                                  onClick={() => handleDeletePost(post.id)}
                                                  disabled={isDeleting === post.id}
                                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-500/20 hover:bg-rose-500/40 border border-rose-500/30 text-rose-300 transition-colors backdrop-blur-md shadow-sm"
                                              >
                                                  <Trash2 className="w-3 h-3" /> {isDeleting === post.id ? '...' : 'Delete'}
                                              </button>
                                          )}
                                      </div>
                                  </div>

                                  <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 mb-1 mt-2">
                                      <Link href={`/athlete/${post.athlete_id}`} className={`text-3xl sm:text-4xl font-black tracking-tight drop-shadow-md leading-none flex items-center gap-2 ${feedTheme.heroName} hover:opacity-80 transition-opacity`}>
                                          <span>{post.athletes.first_name} {post.athletes.last_name}</span>
                                          {post.athletes.is_premium && <Crown className="w-5 h-5 text-yellow-400 drop-shadow-sm shrink-0" />}
                                      </Link>

                                      {currentUserId !== post.athlete_id && (
                                          <Link href={`/athlete/${post.athlete_id}`} className="bg-indigo-600/20 text-indigo-300 hover:bg-indigo-500 hover:text-white border border-indigo-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all text-xs font-black shadow-sm tracking-widest uppercase ml-1">
                                              <Send className="w-3.5 h-3.5" /> Contact
                                          </Link>
                                      )}
                                  </div>

                                  <p className={`text-[11px] font-bold uppercase tracking-widest mb-4 ${feedTheme.heroMeta}`}>
                                      '{post.athletes.grad_year?.toString().slice(-2) || 'XX'} • {post.athletes.state}
                                  </p>

                                  {/* 🚨 THE NEW TIKTOK-STYLE CLOUDFLARE VIDEO COMPONENT WITH AUTO-PAUSE 🚨 */}
                                  {payload.cloudflareUid && (
                                      <CloudflareStreamVideo uid={payload.cloudflareUid} />
                                  )}

                                  <div className="flex flex-wrap gap-3 mb-4">
                                     <div className="bg-black/30 border border-white/10 rounded-xl p-3 backdrop-blur-md shadow-inner flex flex-col justify-center items-center sm:items-start grow sm:grow-0 min-w-[130px]">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1"><Target className="w-3 h-3" /> Target Sport</span>
                                        <span className="font-bold text-sm text-white truncate w-full text-center sm:text-left">{payload.sport || 'Undecided'}</span>
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
                                         )
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

                                  <div className="flex flex-wrap gap-2 mb-4">
                                      {payloadHonorsArray.map((honor: string, i: number) => (
                                          <div key={`honor-${i}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-full text-xs font-bold shadow-sm backdrop-blur-md">
                                              <Award className="w-3 h-3 text-amber-400 shrink-0" />
                                              <span className="truncate max-w-[200px]" title={honor}>{honor}</span>
                                          </div>
                                      ))}
                                  </div>

                                  {payload.otherSports && payload.otherSports.length > 0 && (
                                      <div className="mb-4 flex flex-wrap items-center justify-center sm:justify-start gap-3 bg-black/40 p-3 rounded-2xl border border-white/5 shadow-inner">
                                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 pl-1">
                                              <Dumbbell className="w-4 h-4 text-indigo-400" /> Multi-Sport Athlete:
                                          </span>
                                          <div className="flex flex-wrap gap-2">
                                              {payload.otherSports.map((s: string, i: number) => (
                                                  <span key={i} className="px-3 py-1.5 bg-indigo-950/50 border border-indigo-500/30 rounded-xl text-[11px] font-bold text-indigo-100 shadow-sm">
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
               })
            )}
        </div>
      </div>
    </main>
  );
}