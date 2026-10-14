'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Heart,
  ArrowLeft,
  Crown,
  School,
  ChevronRight,
  Star,
  Bell,
  Mail,
  Eye,
  Lock,
  Calendar,
  X,
  MessageSquare,
  GraduationCap,
  Layers
} from 'lucide-react';
import { AvatarWithBorder } from '@/components/AnimatedBorders';

interface LikerPerson {
  id: string;
  role: 'athlete' | 'coach';
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  equippedBorder: string | null;
  school: string;
  state: string;
  gradYear: number | null;
  isPremium: boolean;
  customSlug: string | null;
}

interface FeaturePostLikesGroup {
  postId: string;
  featureDateStr: string;
  createdAtTimestamp: number;
  likers: LikerPerson[];
}

interface UnreadMessageNotification {
  id: string;
  title: string;
  preview: string;
  createdAt: string;
  timestamp: number;
  isRecruiting: boolean;
  status: string;
}

interface CoachViewNotification {
  id: string;
  createdAt: string;
  dateStr: string;
  timestamp: number;
  coachId: string | null;
  coachName: string;
  schoolName: string;
  avatarUrl: string | null;
  email: string | null;
}

type UnifiedNotificationItem =
  | { kind: 'message'; key: string; timestamp: number; data: UnreadMessageNotification }
  | { kind: 'view'; key: string; timestamp: number; data: CoachViewNotification }
  | { kind: 'likes'; key: string; timestamp: number; data: FeaturePostLikesGroup };

const formatShortDate = (dateString: string) => {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(dateString));
  } catch (_e) {
    return 'Recent';
  }
};

const formatRelativeTime = (dateString: string) => {
  try {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return formatShortDate(dateString);
  } catch (_e) {
    return '';
  }
};

export default function NotificationsPage() {
  const [supabase] = useState(() => createClient());
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isProUnlocked, setIsProUnlocked] = useState(false);
  const [totalProfileClicks, setTotalProfileClicks] = useState(0);

  const [unreadMessages, setUnreadMessages] = useState<UnreadMessageNotification[]>([]);
  const [coachViews, setCoachViews] = useState<CoachViewNotification[]>([]);
  const [featureLikeGroups, setFeatureLikeGroups] = useState<FeaturePostLikesGroup[]>([]);

  const [activeTab, setActiveTab] = useState<'all' | 'messages' | 'views' | 'likes'>('all');
  const [modalPostGroup, setModalPostGroup] = useState<FeaturePostLikesGroup | null>(null);

  useEffect(() => {
    async function loadNotificationCenter() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      const currentUserId = session.user.id;

      // 1. Fetch Athlete Profile, Messages, Coach View Logs, and Featured Posts in parallel
      const [athleteRes, messagesRes, viewLogsRes, postsRes] = await Promise.all([
        supabase
          .from('athletes')
          .select('id, first_name, last_name, is_premium, is_founder, profile_views')
          .eq('id', currentUserId)
          .maybeSingle(),
        supabase
          .from('messages')
          .select('*, athletes(first_name, last_name, avatar_url, grad_year)')
          .or(`athlete_id.eq.${currentUserId},coach_id.eq.${currentUserId},sender_id.eq.${currentUserId}`),
        supabase
          .from('profile_view_logs')
          .select('id, created_at, coach_id, coaches(id, first_name, last_name, school_name, avatar_url, email)')
          .eq('athlete_id', currentUserId)
          .order('created_at', { ascending: false })
          .limit(30),
        supabase
          .from('posts')
          .select('id, created_at, likes')
          .eq('athlete_id', currentUserId)
          .order('created_at', { ascending: false })
      ]);

      let hasPro = false;
      let fallbackProfileViews = 0;

      if (athleteRes.data) {
        hasPro = Boolean(athleteRes.data.is_premium || athleteRes.data.is_founder);
        fallbackProfileViews = athleteRes.data.profile_views || 0;
        setIsProUnlocked(hasPro);
        setTotalProfileClicks(fallbackProfileViews);
      }

      // 2. Process Unread Messages
      if (messagesRes.data) {
        const unreadList: UnreadMessageNotification[] = [];

        messagesRes.data.forEach((msg: any) => {
          if (msg.is_read) return;
          if (msg.status === 'ended') return;

          const history = Array.isArray(msg.chat_history) ? msg.chat_history : [];
          const lastSenderId = history.length > 0 ? history[history.length - 1].sender_id : msg.sender_id;

          if (lastSenderId === currentUserId) return;

          const latestCreatedAt = history.length > 0 ? history[history.length - 1].created_at : msg.created_at;
          const latestPreview = history.length > 0 ? history[history.length - 1].content : msg.content;
          const isRecruiting = Boolean(
            msg.sender_school || (msg.sender_name && String(msg.sender_name).toLowerCase().includes('coach'))
          );

          let senderTitle = msg.sender_name || 'New Message';
          if (msg.sender_school) {
            senderTitle = `${msg.sender_name} • ${msg.sender_school}`;
          }

          unreadList.push({
            id: msg.id,
            title: senderTitle,
            preview: String(latestPreview || 'Sent you a message'),
            createdAt: latestCreatedAt,
            timestamp: new Date(latestCreatedAt).getTime(),
            isRecruiting,
            status: msg.status || 'pending'
          });
        });

        unreadList.sort((a, b) => b.timestamp - a.timestamp);
        setUnreadMessages(unreadList);
      }

      // 3. Process Coach Profile View Logs
      if (viewLogsRes.data && viewLogsRes.data.length > 0) {
        const parsedViews: CoachViewNotification[] = viewLogsRes.data.map((log: any, idx: number) => {
          const coachObj = Array.isArray(log.coaches) ? log.coaches[0] : log.coaches;
          return {
            id: log.id || `view-${idx}`,
            createdAt: log.created_at,
            dateStr: formatShortDate(log.created_at),
            timestamp: new Date(log.created_at).getTime(),
            coachId: coachObj?.id || log.coach_id || null,
            coachName: coachObj?.last_name ? `Coach ${coachObj.last_name}` : 'College Coach',
            schoolName: coachObj?.school_name || 'Verified College Program',
            avatarUrl: coachObj?.avatar_url || null,
            email: coachObj?.email || null
          };
        });
        setCoachViews(parsedViews);
      } else if (fallbackProfileViews > 0 && !hasPro) {
        // Fallback teaser item if athlete has profile_views > 0 so it appears in the combined stream
        const nowIso = new Date().toISOString();
        setCoachViews([
          {
            id: 'fallback-profile-views',
            createdAt: nowIso,
            dateStr: formatShortDate(nowIso),
            timestamp: Date.now() - 3600 * 1000,
            coachId: null,
            coachName: 'College Coach',
            schoolName: 'Verified College Program',
            avatarUrl: null,
            email: null
          }
        ]);
      }

      // 4. Process Feature Post Likes (Grouped by Feature Post like Instagram)
      const myPosts = postsRes.data || [];
      const uniqueLikerIds = new Set<string>();

      myPosts.forEach((post: any) => {
        if (Array.isArray(post.likes)) {
          post.likes.forEach((uid: any) => {
            if (typeof uid === 'string' && uid.trim().length > 0) {
              uniqueLikerIds.add(uid);
            }
          });
        }
      });

      const likerIdsArray = Array.from(uniqueLikerIds);
      const personMap = new Map<string, LikerPerson>();

      if (likerIdsArray.length > 0) {
        const [athletesLikersRes, coachesLikersRes] = await Promise.all([
          supabase
            .from('athletes')
            .select('id, first_name, last_name, high_school, state, grad_year, avatar_url, equipped_border, is_premium, custom_slug')
            .in('id', likerIdsArray),
          supabase
            .from('coaches')
            .select('id, first_name, last_name, school_name, avatar_url')
            .in('id', likerIdsArray)
        ]);

        if (athletesLikersRes.data) {
          athletesLikersRes.data.forEach((a: any) => {
            personMap.set(a.id, {
              id: a.id,
              role: 'athlete',
              firstName: a.first_name || 'Athlete',
              lastName: a.last_name || '',
              avatarUrl: a.avatar_url || null,
              equippedBorder: a.equipped_border || 'none',
              school: a.high_school || 'High School Athlete',
              state: a.state || '',
              gradYear: a.grad_year || null,
              isPremium: Boolean(a.is_premium),
              customSlug: a.custom_slug || null
            });
          });
        }

        if (coachesLikersRes.data) {
          coachesLikersRes.data.forEach((c: any) => {
            personMap.set(c.id, {
              id: c.id,
              role: 'coach',
              firstName: 'Coach',
              lastName: c.last_name || c.first_name || '',
              avatarUrl: c.avatar_url || null,
              equippedBorder: 'none',
              school: c.school_name || 'College Program',
              state: '',
              gradYear: null,
              isPremium: false,
              customSlug: null
            });
          });
        }
      }

      const builtGroups: FeaturePostLikesGroup[] = [];
      let totalLikesCount = 0;

      myPosts.forEach((post: any) => {
        const rawLikes: string[] = Array.isArray(post.likes) ? post.likes : [];
        if (rawLikes.length === 0) return;

        totalLikesCount += rawLikes.length;

        const resolvedLikers: LikerPerson[] = [...rawLikes].reverse().map((uid: string) => {
          return (
            personMap.get(uid) || {
              id: uid,
              role: 'athlete',
              firstName: 'ChasedSports',
              lastName: 'Member',
              avatarUrl: null,
              equippedBorder: 'none',
              school: 'Verified Member',
              state: '',
              gradYear: null,
              isPremium: false,
              customSlug: null
            }
          );
        });

        builtGroups.push({
          postId: post.id,
          featureDateStr: formatShortDate(post.created_at),
          createdAtTimestamp: new Date(post.created_at).getTime(),
          likers: resolvedLikers
        });
      });

      setFeatureLikeGroups(builtGroups);

      // Mark current likes and views as seen in localStorage so the Navbar badge clears
      if (typeof window !== 'undefined') {
        localStorage.setItem(`chased_seen_likes_${currentUserId}`, String(totalLikesCount));
        localStorage.setItem(
          `chased_seen_views_${currentUserId}`,
          String(Math.max(viewLogsRes.data?.length || 0, fallbackProfileViews))
        );
      }

      setLoading(false);
    }

    loadNotificationCenter();
  }, [supabase, router]);

  const totalLikesAcrossPosts = useMemo(
    () => featureLikeGroups.reduce((acc, g) => acc + g.likers.length, 0),
    [featureLikeGroups]
  );

  const coachViewCountDisplay = Math.max(coachViews.length, totalProfileClicks);

  // Combine all notifications into a single chronological feed, then filter when a top tab is clicked
  const unifiedFeedItems = useMemo<UnifiedNotificationItem[]>(() => {
    const items: UnifiedNotificationItem[] = [];

    if (activeTab === 'all' || activeTab === 'messages') {
      unreadMessages.forEach((msg) => {
        items.push({
          kind: 'message',
          key: `msg-${msg.id}`,
          timestamp: msg.timestamp,
          data: msg
        });
      });
    }

    if (activeTab === 'all' || activeTab === 'views') {
      coachViews.forEach((view) => {
        items.push({
          kind: 'view',
          key: `view-${view.id}`,
          timestamp: view.timestamp,
          data: view
        });
      });
    }

    if (activeTab === 'all' || activeTab === 'likes') {
      featureLikeGroups.forEach((group) => {
        items.push({
          kind: 'likes',
          key: `likes-${group.postId}`,
          timestamp: group.createdAtTimestamp,
          data: group
        });
      });
    }

    return items.sort((a, b) => b.timestamp - a.timestamp);
  }, [activeTab, unreadMessages, coachViews, featureLikeGroups]);

  const totalAllCount = unreadMessages.length + coachViews.length + featureLikeGroups.length;

  const getLikerDisplayName = (person: LikerPerson) => {
    if (person.role === 'coach') return `Coach ${person.lastName}`.trim();
    return `${person.firstName} ${person.lastName}`.trim();
  };

  const getLikerHref = (person: LikerPerson) => {
    if (person.role === 'coach') return `/coach/${person.id}`;
    return `/athlete/${person.customSlug || person.id}`;
  };

  return (
    <main className="min-h-screen bg-[#06090F] text-white font-sans pb-24 relative overflow-x-hidden selection:bg-blue-500/30">
      {/* Ambient Background Glows */}
      <div className="fixed top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[380px] bg-blue-600/10 blur-[140px] rounded-full pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 blur-[140px] rounded-full pointer-events-none z-0"></div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 md:pt-12 relative z-10">
        
        {/* Top Navigation Row */}
        <div className="flex items-center justify-between mb-5">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <Link
            href="/dashboard"
            className="text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors"
          >
            Go to Homebase
          </Link>
        </div>

        {/* Notification Center Header + Clean 4-Tab Mobile Segmented Bar */}
        <div className="bg-[#0B101A] border border-white/10 rounded-[2rem] p-5 sm:p-7 shadow-2xl mb-6 relative overflow-hidden isolate">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-[0_0_25px_rgba(59,130,246,0.4)] shrink-0">
                <Bell className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Notifications
                </h1>
                <p className="text-xs sm:text-sm font-medium text-slate-400 mt-0.5">
                  All your recruiting activity in one place
                </p>
              </div>
            </div>

            {!isProUnlocked && (
              <Link
                href="/pro"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.35)] hover:scale-105 transition-transform w-full sm:w-auto shrink-0"
              >
                <Crown className="w-3.5 h-3.5" /> Unlock PRO Radar
              </Link>
            )}
          </div>

          {/* 🚨 MOBILE-OPTIMIZED 4-COLUMN SEGMENTED FILTER BAR (ZERO SCROLLING OR CLIPPING) 🚨 */}
          <div className="grid grid-cols-4 gap-1.5 p-1.5 bg-[#06090F] border border-white/10 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 px-1 sm:px-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-blue-600/25 text-blue-300 border border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Layers className={`w-4 h-4 shrink-0 ${activeTab === 'all' ? 'text-blue-400' : ''}`} />
              <span>All</span>
              {totalAllCount > 0 && (
                <span className={`hidden sm:inline-flex text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'all' ? 'bg-blue-500/30 text-white' : 'bg-white/5 text-slate-400'}`}>
                  {totalAllCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('messages')}
              className={`relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 px-1 sm:px-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'messages'
                  ? 'bg-indigo-600/25 text-indigo-300 border border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Mail className={`w-4 h-4 shrink-0 ${activeTab === 'messages' ? 'text-indigo-400' : ''}`} />
              <span>Inbox</span>
              {unreadMessages.length > 0 && (
                <span className="absolute top-1.5 right-1.5 sm:static bg-rose-600 text-white text-[9px] sm:text-[10px] font-black min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center shadow">
                  {unreadMessages.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('views')}
              className={`relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 px-1 sm:px-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'views'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Eye className={`w-4 h-4 shrink-0 ${activeTab === 'views' ? 'text-cyan-400' : ''}`} />
              <span>Views</span>
              {coachViewCountDisplay > 0 && (
                <span className={`text-[9px] sm:text-[10px] px-1.5 rounded-full font-black ${
                  activeTab === 'views' ? 'bg-cyan-500/30 text-white' : 'bg-white/5 text-slate-400'
                }`}>
                  {coachViewCountDisplay}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('likes')}
              className={`relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 px-1 sm:px-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'likes'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Heart className={`w-4 h-4 shrink-0 ${activeTab === 'likes' ? 'text-rose-400 fill-rose-400/20' : ''}`} />
              <span>Likes</span>
              {totalLikesAcrossPosts > 0 && (
                <span className={`text-[9px] sm:text-[10px] px-1.5 rounded-full font-black ${
                  activeTab === 'likes' ? 'bg-rose-500/30 text-white' : 'bg-white/5 text-slate-400'
                }`}>
                  {totalLikesAcrossPosts}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* UNIFIED COMBINED NOTIFICATION FEED                                */}
        {/* ================================================================= */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="bg-[#0B101A] border border-white/5 rounded-2xl p-5 flex items-center justify-between animate-pulse"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-44 bg-white/10 rounded"></div>
                    <div className="h-3 w-60 bg-white/5 rounded"></div>
                  </div>
                </div>
                <div className="h-9 w-24 bg-white/10 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : unifiedFeedItems.length === 0 ? (
          <div className="bg-[#0B101A] border border-white/10 rounded-[2rem] p-12 text-center shadow-xl flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
              {activeTab === 'messages' ? (
                <Mail className="w-8 h-8 text-indigo-400" />
              ) : activeTab === 'views' ? (
                <Eye className="w-8 h-8 text-cyan-400" />
              ) : activeTab === 'likes' ? (
                <Heart className="w-8 h-8 text-rose-400" />
              ) : (
                <Bell className="w-8 h-8 text-blue-400" />
              )}
            </div>

            <h2 className="text-xl font-black text-white mb-2">
              {activeTab === 'messages'
                ? 'No Unread Messages'
                : activeTab === 'views'
                  ? 'No Coach Profile Clicks Yet'
                  : activeTab === 'likes'
                    ? 'No Feature Likes Yet'
                    : 'No New Activity Yet'}
            </h2>

            <p className="text-xs sm:text-sm font-medium text-slate-400 max-w-md mb-6 leading-relaxed">
              {activeTab === 'messages'
                ? "You're all caught up on your inbox! Open your Message Center to view past conversations."
                : 'Feature your profile on the Recruiting Feed to get discovered by college coaches and rack up profile views and likes.'}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {activeTab === 'messages' ? (
                <Link
                  href="/dashboard/messages"
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-all"
                >
                  <Mail className="w-4 h-4" /> Open Inbox
                </Link>
              ) : (
                <Link
                  href="/feed"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-xs uppercase tracking-wider px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.35)] transition-all"
                >
                  <Star className="w-4 h-4" /> Feature Yourself on Feed
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-[#0B101A] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden divide-y divide-white/5 isolate">
            {unifiedFeedItems.map((item) => {
              /* ------------------------------------------------------------- */
              /* 1. UNREAD INBOX MESSAGE ITEM                                  */
              /* ------------------------------------------------------------- */
              if (item.kind === 'message') {
                const msg = item.data;
                return (
                  <Link
                    key={item.key}
                    href={`/dashboard/messages?thread=${msg.id}`}
                    className="p-4 sm:p-5 flex items-center justify-between gap-3.5 hover:bg-white/[0.03] transition-colors group"
                  >
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border relative ${
                        msg.isRecruiting
                          ? 'bg-blue-500/15 border-blue-500/40 text-blue-400'
                          : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400'
                      }`}>
                        {msg.isRecruiting ? <GraduationCap className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-[#0B101A]"></span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] font-black uppercase tracking-widest bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-md">
                            {msg.isRecruiting ? 'Recruiting Pitch' : 'Unread Message'}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            {formatRelativeTime(msg.createdAt)}
                          </span>
                        </div>

                        <p className="text-sm font-black text-white truncate mt-1 group-hover:text-cyan-400 transition-colors">
                          {msg.title}
                        </p>

                        <p className="text-xs font-medium text-slate-400 truncate mt-0.5">
                          "{msg.preview}"
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 bg-indigo-600/20 group-hover:bg-indigo-600 text-indigo-300 group-hover:text-white border border-indigo-500/30 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1">
                      <span>Reply</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </Link>
                );
              }

              /* ------------------------------------------------------------- */
              /* 2. COACH PROFILE CLICK ITEM (PRO REVEAL OR FREE TEASER)       */
              /* ------------------------------------------------------------- */
              if (item.kind === 'view') {
                const view = item.data;
                return (
                  <div
                    key={item.key}
                    className="p-4 sm:p-5 flex items-center justify-between gap-3.5 hover:bg-white/[0.02] transition-colors"
                  >
                    {isProUnlocked ? (
                      <>
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <AvatarWithBorder
                            avatarUrl={view.avatarUrl || ''}
                            borderId="none"
                            sizeClasses="w-12 h-12 shrink-0"
                            userRole="coach"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
                                <Eye className="w-2.5 h-2.5" /> Coach Click
                              </span>
                              <span className="text-[10px] font-bold text-slate-500">
                                {view.dateStr}
                              </span>
                            </div>

                            <p className="text-sm font-black text-white truncate mt-1">
                              {view.coachName}{' '}
                              <span className="text-slate-400 font-medium">viewed your profile</span>
                            </p>

                            <p className="text-xs font-bold text-cyan-400 truncate mt-0.5">
                              {view.schoolName}
                            </p>
                          </div>
                        </div>

                        {view.coachId && (
                          <Link
                            href={`/dashboard/messages?compose=${view.coachId}`}
                            className="shrink-0 bg-cyan-500/15 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 border border-cyan-500/30 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Message</span>
                          </Link>
                        )}
                      </>
                    ) : (
                      /* 🔒 FREE USER TEASER ROW -> DRIVES PRO UPGRADES */
                      <>
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-cyan-500/30 flex items-center justify-center shrink-0 relative overflow-hidden">
                            <School className="w-5 h-5 text-cyan-400/40 blur-[1px]" />
                            <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                              <Lock className="w-4 h-4 text-cyan-300" />
                            </div>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                                <Eye className="w-2.5 h-2.5" /> Profile Click
                              </span>
                              <span className="text-[10px] font-bold text-slate-500">
                                {view.dateStr}
                              </span>
                            </div>

                            <p className="text-xs sm:text-sm font-black text-white mt-1">
                              {view.id === 'fallback-profile-views'
                                ? `Your profile was clicked ${totalProfileClicks} ${totalProfileClicks === 1 ? 'time' : 'times'}`
                                : 'A College Coach clicked on your profile'}
                            </p>

                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-black text-slate-400 select-none blur-[4px]">
                                Coach Anderson • Oregon State
                              </span>
                              <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded">
                                PRO Only
                              </span>
                            </div>
                          </div>
                        </div>

                        <Link
                          href="/pro"
                          className="shrink-0 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-white px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(168,85,247,0.35)] hover:scale-105 transition-transform flex items-center gap-1.5"
                        >
                          <Crown className="w-3.5 h-3.5" />
                          <span>Reveal</span>
                        </Link>
                      </>
                    )}
                  </div>
                );
              }

              /* ------------------------------------------------------------- */
              /* 3. INSTAGRAM-STYLE FEATURE POST LIKES ITEM                    */
              /* ------------------------------------------------------------- */
              const group = item.data;
              const firstLiker = group.likers[0];
              const secondLiker = group.likers.length > 1 ? group.likers[1] : null;
              const remainingCount = Math.max(0, group.likers.length - 2);

              return (
                <div
                  key={item.key}
                  className="p-4 sm:p-5 flex items-center justify-between gap-3.5 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Overlapping Avatar Stack */}
                    <button
                      type="button"
                      onClick={() => setModalPostGroup(group)}
                      className="relative flex items-center shrink-0 cursor-pointer group/avatars"
                      title="View everyone who liked this feature"
                    >
                      <div className="relative z-10 rounded-full ring-2 ring-[#0B101A]">
                        <AvatarWithBorder
                          avatarUrl={firstLiker.avatarUrl || ''}
                          borderId={firstLiker.equippedBorder || 'none'}
                          sizeClasses="w-11 h-11"
                          userRole={firstLiker.role}
                        />
                      </div>
                      {secondLiker && (
                        <div className="-ml-4 relative z-0 rounded-full ring-2 ring-[#0B101A] opacity-90 group-hover/avatars:translate-x-0.5 transition-transform">
                          <AvatarWithBorder
                            avatarUrl={secondLiker.avatarUrl || ''}
                            borderId={secondLiker.equippedBorder || 'none'}
                            sizeClasses="w-10 h-10"
                            userRole={secondLiker.role}
                          />
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 z-20 w-5 h-5 rounded-full bg-rose-500 border-2 border-[#0B101A] flex items-center justify-center shadow">
                        <Heart className="w-2.5 h-2.5 text-white fill-white" />
                      </div>
                    </button>

                    <div className="min-w-0 flex-1">
                      {/* Date of the Feature Badge */}
                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                        <Calendar className="w-3 h-3 text-rose-400 shrink-0" />
                        <span>Feature • {group.featureDateStr}</span>
                      </div>

                      {/* Instagram-Style Inline Liked By Sentence */}
                      <p className="text-xs sm:text-sm text-slate-300 font-medium leading-snug">
                        Liked by{' '}
                        <Link
                          href={getLikerHref(firstLiker)}
                          className="font-black text-white hover:text-cyan-400 transition-colors"
                        >
                          {getLikerDisplayName(firstLiker)}
                        </Link>
                        {secondLiker && (
                          <>
                            {remainingCount === 0 ? ' and ' : ', '}
                            <Link
                              href={getLikerHref(secondLiker)}
                              className="font-black text-white hover:text-cyan-400 transition-colors"
                            >
                              {getLikerDisplayName(secondLiker)}
                            </Link>
                          </>
                        )}
                        {remainingCount > 0 && (
                          <>
                            {' '}and{' '}
                            <button
                              type="button"
                              onClick={() => setModalPostGroup(group)}
                              className="font-black text-white hover:text-rose-400 underline decoration-white/30 underline-offset-2 transition-colors cursor-pointer"
                            >
                              {remainingCount} {remainingCount === 1 ? 'other' : 'others'}
                            </button>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Right: View Full List Button */}
                  <button
                    type="button"
                    onClick={() => setModalPostGroup(group)}
                    className="shrink-0 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>View ({group.likers.length})</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* INSTAGRAM-STYLE "LIKED BY" FULL LIST MODAL                        */}
      {/* ================================================================= */}
      {modalPostGroup && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setModalPostGroup(null)}
          />

          {/* Modal Container */}
          <div className="relative z-10 w-full sm:max-w-md bg-[#0B101A] border border-white/15 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    Liked By ({modalPostGroup.likers.length})
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Feature from {modalPostGroup.featureDateStr}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalPostGroup(null)}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Liker List */}
            <div className="overflow-y-auto divide-y divide-white/5 p-2 custom-scrollbar">
              {modalPostGroup.likers.map((person) => {
                const href = getLikerHref(person);
                return (
                  <div
                    key={person.id}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-white/[0.03] rounded-2xl transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Link href={href} onClick={() => setModalPostGroup(null)} className="shrink-0">
                        <AvatarWithBorder
                          avatarUrl={person.avatarUrl || ''}
                          borderId={person.equippedBorder || 'none'}
                          sizeClasses="w-11 h-11"
                          userRole={person.role}
                        />
                      </Link>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link
                            href={href}
                            onClick={() => setModalPostGroup(null)}
                            className="text-sm font-black text-white hover:text-cyan-400 transition-colors truncate"
                          >
                            {getLikerDisplayName(person)}
                          </Link>

                          {person.role === 'coach' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                              <School className="w-2.5 h-2.5" /> Coach
                            </span>
                          )}

                          {person.isPremium && (
                            <Link
                              href="/pro"
                              onClick={() => setModalPostGroup(null)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-gradient-to-r from-cyan-500/25 via-purple-500/25 to-pink-500/25 border border-cyan-400/50 text-cyan-200"
                            >
                              <Crown className="w-2.5 h-2.5 text-cyan-400" /> PRO Verified
                            </Link>
                          )}
                        </div>

                        <p className="text-[11px] font-bold text-slate-400 truncate mt-0.5">
                          {person.school}
                          {person.state ? `, ${person.state}` : ''}
                          {person.gradYear ? ` • '${String(person.gradYear).slice(-2)}` : ''}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={href}
                      onClick={() => setModalPostGroup(null)}
                      className="shrink-0 bg-white/5 hover:bg-white/15 border border-white/10 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all"
                    >
                      Profile
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}