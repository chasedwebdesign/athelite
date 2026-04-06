'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Search, Mail, MailOpen, School, Send, Clock, ChevronLeft, UserCircle2, CheckCircle2, AlertCircle, Ban, Bell, MessageSquare, Archive, SendHorizontal, GraduationCap, Users, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

interface ChatMessage {
  sender_id: string;
  content: string;
  created_at: string;
}

interface Message {
  id: string;
  athlete_id: string;
  sender_name: string;
  sender_school: string;
  sender_email: string;
  content: string;
  is_read: boolean;
  created_at: string;
  chat_history: ChatMessage[] | null;
  status: 'pending' | 'active' | 'ended' | 'delivered'; 
  athletes?: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    grad_year?: number | null;
  };
}

export default function InboxPage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [viewerRole, setViewerRole] = useState<'athlete' | 'coach'>('athlete');
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const [activeFolder, setActiveFolder] = useState<'inbox' | 'recruiting' | 'chats' | 'archived'>('inbox');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedMessage?.chat_history, selectedMessage]);

  // 🚨 DYNAMIC TIMESTAMP SORTER (Fixes the buried message glitch)
  const getLatestTimestamp = (msg: Message) => {
    if (msg.chat_history && msg.chat_history.length > 0) {
      return new Date(msg.chat_history[msg.chat_history.length - 1].created_at).getTime();
    }
    return new Date(msg.created_at).getTime();
  };

  // 🚨 NCAA COMPLIANCE ENGINE
  const canMessageAthlete = (gradYear: number | null | undefined) => {
    if (viewerRole !== 'coach') return true; 
    if (!gradYear) return true; 
    
    const today = new Date();
    const currentYear = today.getFullYear();
    const isPastJune15 = today.getMonth() > 5 || (today.getMonth() === 5 && today.getDate() >= 15);
    
    const sophomoreYear = gradYear - 2;
    if (currentYear > sophomoreYear || (currentYear === sophomoreYear && isPastJune15)) {
      return true;
    }
    return false;
  };

  useEffect(() => {
    let channel: any;

    async function loadMessages() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }
      
      setCurrentUserId(session.user.id);

      // Determine Role
      const { data: cData } = await supabase.from('coaches').select('id').eq('id', session.user.id).maybeSingle();
      if (cData) setViewerRole('coach');

      // Fetch all messages matching the user's ID or email
      const { data, error } = await supabase
        .from('messages')
        .select('*, athletes(first_name, last_name, avatar_url, grad_year)')
        .or(`athlete_id.eq.${session.user.id},sender_email.eq.${session.user.email}`);

      if (data) {
        // Sort explicitly by the most recent chat activity, NOT just initial created_at
        const sortedData = (data as Message[]).sort((a, b) => getLatestTimestamp(b) - getLatestTimestamp(a));
        setMessages(sortedData);
        
        // If a message is currently open, smoothly update it with the new data
        setSelectedMessage(prev => {
           if (!prev) return null;
           const updated = sortedData.find(m => m.id === prev.id);
           return updated || prev;
        });
      }
      setLoading(false);

      // 🚨 REALTIME SUBSCRIPTION: Auto-refreshes inbox when someone replies!
      if (!channel) {
        channel = supabase
          .channel('realtime_messages')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'messages' },
            () => {
               // When a database change is detected, silently reload the inbox
               loadMessages();
            }
          )
          .subscribe();
      }
    }

    loadMessages();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase, router]);

  const isUnreadForMe = (msg: Message) => {
    if (msg.is_read) return false;
    const history = msg.chat_history || [];
    if (history.length > 0) {
      return history[history.length - 1].sender_id !== currentUserId;
    }
    return msg.athlete_id === currentUserId;
  };

  const isExpired = (msg: Message) => {
    if (msg.status !== 'pending' && msg.status !== 'delivered') return false;
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    return new Date().getTime() - new Date(msg.created_at).getTime() > oneWeek;
  };

  const getConversationTitle = (msg: Message) => {
    if (msg.athlete_id === currentUserId) {
      return msg.sender_school ? `${msg.sender_school} (${msg.sender_name})` : msg.sender_name;
    } else {
      const athleteData = Array.isArray(msg.athletes) ? msg.athletes[0] : msg.athletes;
      return athleteData ? `${athleteData.first_name} ${athleteData.last_name}` : 'Athlete';
    }
  };

  const isRecruitingMessage = (msg: Message) => {
    if (viewerRole === 'coach') return true; 
    return !!msg.sender_school || msg.sender_name.toLowerCase().includes('coach');
  };

  const handleOpenMessage = async (message: Message) => {
    setSelectedMessage(message);

    if (isUnreadForMe(message)) {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', message.id);

      if (!error) {
        setMessages(prev => prev.map(m => m.id === message.id ? { ...m, is_read: true } : m));
        setSelectedMessage(prev => prev ? { ...prev, is_read: true } : null);
      }
    }
  };

  const handleUpdateStatus = async (newStatus: 'active' | 'ended') => {
    if (!selectedMessage) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .update({ status: newStatus, is_read: true })
        .eq('id', selectedMessage.id);

      if (error) throw error;

      setMessages(prev => prev.map(m => m.id === selectedMessage.id ? { ...m, status: newStatus, is_read: true } : m));
      setSelectedMessage(prev => prev ? { ...prev, status: newStatus, is_read: true } : null);
    } catch (err: any) {
      alert("Failed to update chat status: " + err.message);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedMessage || !currentUserId) return;

    setIsSending(true);

    const newReply: ChatMessage = {
      sender_id: currentUserId,
      content: replyText.trim(),
      created_at: new Date().toISOString()
    };

    const updatedHistory = [...(selectedMessage.chat_history || []), newReply];

    try {
      const { error } = await supabase
        .from('messages')
        .update({ chat_history: updatedHistory, is_read: false })
        .eq('id', selectedMessage.id);

      if (error) throw error;

      // Optimistically update UI so the user doesn't have to wait for the realtime reload
      setMessages(prev => {
        const updated = prev.map(m => m.id === selectedMessage.id ? { ...m, chat_history: updatedHistory, is_read: false } : m);
        return updated.sort((a, b) => getLatestTimestamp(b) - getLatestTimestamp(a));
      });
      
      setSelectedMessage(prev => prev ? { ...prev, chat_history: updatedHistory, is_read: false } : null);
      setReplyText('');
    } catch (err: any) {
      alert("Failed to send message: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold animate-pulse">Decrypting your inbox...</p>
      </div>
    );
  }

  const activeMessages = messages.filter(m => m.status !== 'ended' && !isExpired(m));
  
  let displayedMessages: Message[] = [];
  if (activeFolder === 'inbox') {
    displayedMessages = activeMessages;
  } else if (activeFolder === 'recruiting') {
    displayedMessages = activeMessages.filter(m => isRecruitingMessage(m));
  } else if (activeFolder === 'chats') {
    displayedMessages = activeMessages.filter(m => !isRecruitingMessage(m));
  } else if (activeFolder === 'archived') {
    displayedMessages = messages.filter(m => m.status === 'ended' || isExpired(m));
  }

  const unreadCount = messages.filter(m => isUnreadForMe(m)).length;
  const unreadRecruiting = activeMessages.filter(m => isUnreadForMe(m) && isRecruitingMessage(m)).length;

  const renderSidebarItem = (message: Message) => {
    const unread = isUnreadForMe(message);
    const isSelected = selectedMessage?.id === message.id;
    const isRecruit = isRecruitingMessage(message);
    
    // Display the date of the latest activity, not the original created_at
    const latestTime = getLatestTimestamp(message);
    
    return (
      <button
        key={message.id}
        onClick={() => handleOpenMessage(message)}
        className={`w-full text-left p-4 transition-all border-b border-slate-100 flex flex-col gap-1.5 ${
          isSelected 
            ? 'bg-blue-50/50 border-l-4 border-l-blue-500' 
            : 'border-l-4 border-l-transparent hover:bg-slate-50'
        }`}
      >
        <div className="flex justify-between items-start w-full">
          <div className="flex items-center gap-2 overflow-hidden pr-2">
            {isRecruit && <GraduationCap className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
            <span className={`font-bold text-sm truncate ${unread ? 'text-slate-900' : 'text-slate-700'}`}>
              {getConversationTitle(message)}
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap mt-0.5 shrink-0">
            {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(latestTime))}
          </span>
        </div>
        
        <div className="flex items-center gap-2 w-full pl-0.5">
          {unread && <div className="w-2 h-2 bg-blue-600 rounded-full shrink-0 shadow-sm shadow-blue-500/50"></div>}
          <div className={`text-xs truncate ${unread ? 'font-bold text-slate-800' : 'font-medium text-slate-500'}`}>
            {(message.status === 'pending' || message.status === 'delivered') && message.athlete_id === currentUserId && <span className="text-amber-500 font-bold mr-1">Action Needed:</span>}
            {message.chat_history && message.chat_history.length > 0 
              ? message.chat_history[message.chat_history.length - 1].content 
              : message.content}
          </div>
        </div>
      </button>
    );
  };

  const selectedAthleteData = Array.isArray(selectedMessage?.athletes) ? selectedMessage?.athletes[0] : selectedMessage?.athletes;
  const isNCAARestricted = viewerRole === 'coach' && selectedAthleteData?.grad_year && !canMessageAthlete(selectedAthleteData.grad_year);

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans pb-10">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 h-[calc(100vh-80px)] flex flex-col">
        
        {/* HEADER */}
        <div className="mb-6 flex items-center justify-between shrink-0">
          <div>
            <Link href={viewerRole === 'coach' ? "/dashboard/coach" : "/dashboard"} className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-900 mb-2 transition-colors">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Message Center</h1>
          </div>
          <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-2xl flex items-center gap-3 shadow-sm">
            <Mail className="w-5 h-5 text-blue-600" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Unread</span>
              <span className="font-black text-slate-800 leading-none">{unreadCount}</span>
            </div>
          </div>
        </div>

        {/* UNIFIED APP LAYOUT */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col lg:flex-row flex-1 min-h-[500px]">
          
          {/* ========================================== */}
          {/* COLUMN 1: SIDEBAR (FOLDERS & LIST)           */}
          {/* ========================================== */}
          <div className={`w-full lg:w-[340px] xl:w-[400px] bg-white border-r border-slate-200 flex flex-col h-full ${selectedMessage ? 'hidden lg:flex' : 'flex'}`}>
            
            {/* Folder Tabs */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 shrink-0">
              <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                <button onClick={() => setActiveFolder('inbox')} className={`px-4 py-2 rounded-xl text-xs font-black transition-colors whitespace-nowrap ${activeFolder === 'inbox' ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'}`}>
                  All
                </button>
                <button onClick={() => setActiveFolder('recruiting')} className={`px-4 py-2 rounded-xl text-xs font-black transition-colors whitespace-nowrap flex items-center gap-1.5 ${activeFolder === 'recruiting' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'}`}>
                  <GraduationCap className="w-3.5 h-3.5" /> Recruiting {unreadRecruiting > 0 && <span className="bg-red-500 text-white px-1.5 py-0.5 rounded-md text-[9px]">{unreadRecruiting}</span>}
                </button>
                <button onClick={() => setActiveFolder('chats')} className={`px-4 py-2 rounded-xl text-xs font-black transition-colors whitespace-nowrap flex items-center gap-1.5 ${activeFolder === 'chats' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'}`}>
                  <Users className="w-3.5 h-3.5" /> Chats
                </button>
                <button onClick={() => setActiveFolder('archived')} className={`px-4 py-2 rounded-xl text-xs font-black transition-colors whitespace-nowrap flex items-center gap-1.5 ${activeFolder === 'archived' ? 'bg-slate-300 text-slate-800' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'}`}>
                  <Archive className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto flex-1 pb-4">
              {displayedMessages.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <MailOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-500">No messages in this folder.</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {displayedMessages.map(renderSidebarItem)}
                </div>
              )}
            </div>
          </div>

          {/* ========================================== */}
          {/* COLUMN 2: ACTIVE CHAT THREAD                 */}
          {/* ========================================== */}
          <div className={`flex-1 bg-slate-50 flex flex-col h-full relative ${!selectedMessage ? 'hidden lg:flex' : 'flex'}`}>
            {selectedMessage ? (
              <>
                {/* Chat Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shadow-sm z-10 shrink-0 bg-white">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setSelectedMessage(null)} className="lg:hidden p-2 -ml-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors">
                      <ChevronLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${isRecruitingMessage(selectedMessage) ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                      {isRecruitingMessage(selectedMessage) ? <School className="w-5 h-5 text-blue-500" /> : <UserCircle2 className="w-5 h-5 text-slate-400" />}
                    </div>
                    <div>
                      <h2 className="text-base font-black text-slate-900 leading-tight">{getConversationTitle(selectedMessage)}</h2>
                      <p className="text-[11px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider flex items-center gap-1">
                        {(selectedMessage.status === 'pending' || selectedMessage.status === 'delivered') ? <span className="text-amber-500">Pending Request</span> : selectedMessage.status === 'ended' ? 'Archived' : 'Active Connection'}
                        {isRecruitingMessage(selectedMessage) && <span className="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-[4px] ml-1">RECRUITING</span>}
                      </p>
                    </div>
                  </div>
                  
                  {/* End Chat Button */}
                  {selectedMessage.status === 'active' && (
                    <button onClick={() => handleUpdateStatus('ended')} className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-50">
                      <Ban className="w-3.5 h-3.5" /> End Chat
                    </button>
                  )}
                </div>

                {/* 🚨 NCAA COMPLIANCE WARNING BANNER 🚨 */}
                {isNCAARestricted && selectedMessage.status === 'active' && (
                  <div className="bg-red-50 border-b border-red-200 p-4 flex items-start gap-3 shadow-inner shrink-0">
                    <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-black text-red-800">NCAA Compliance Notice</h4>
                      <p className="text-xs font-bold text-red-600 mt-0.5 leading-relaxed">
                        This athlete is prior to June 15th of their Sophomore year. If you are a Division I or II program, NCAA rules strictly prohibit you from returning contact or replying to this message at this time.
                      </p>
                    </div>
                  </div>
                )}

                {/* Chat Bubbles Area */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-slate-50">
                  
                  {/* Initial Pitch Card */}
                  <div className="flex flex-col w-full items-center mb-4">
                    <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Initial Outreach • {formatDate(selectedMessage.created_at)}</span>
                      </div>
                      <p className="text-[15px] font-medium text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {selectedMessage.content}
                      </p>
                    </div>
                  </div>

                  {/* Reply Bubbles */}
                  {selectedMessage.chat_history?.map((reply, idx) => {
                    const isMyMessage = reply.sender_id === currentUserId;
                    return (
                      <div key={idx} className={`flex flex-col max-w-[80%] ${isMyMessage ? 'items-end self-end' : 'items-start self-start'}`}>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 mx-1">{formatDate(reply.created_at)}</span>
                        <div className={`px-5 py-3.5 text-[15px] font-medium leading-relaxed whitespace-pre-wrap ${isMyMessage ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm shadow-md shadow-blue-500/20' : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm shadow-sm'}`}>
                          {reply.content}
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* DYNAMIC FOOTER CONTROLS */}
                <div className="shrink-0 bg-white border-t border-slate-200">
                  {isExpired(selectedMessage) ? (
                    <div className="p-5 flex items-center justify-center text-slate-400 font-bold gap-2 text-sm">
                      <AlertCircle className="w-4 h-4" /> This request expired after 7 days of inactivity.
                    </div>
                  ) : selectedMessage.status === 'ended' ? (
                    <div className="p-5 flex items-center justify-center text-slate-400 font-bold gap-2 text-sm">
                      <Ban className="w-4 h-4" /> This conversation has been ended.
                    </div>
                  ) : (selectedMessage.status === 'pending' || selectedMessage.status === 'delivered') ? (
                    selectedMessage.athlete_id === currentUserId ? (
                      // RECEIVER SEES: Accept / Decline
                      <div className="p-6 flex flex-col items-center justify-center gap-3">
                        <h4 className="font-black text-slate-900 text-base">Accept this connection request?</h4>
                        <div className="flex gap-3 w-full max-w-sm">
                          <button onClick={() => handleUpdateStatus('active')} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> Accept
                          </button>
                          <button onClick={() => handleUpdateStatus('ended')} className="flex-1 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 py-3 rounded-xl font-bold transition-all">Decline</button>
                        </div>
                      </div>
                    ) : (
                      // SENDER SEES: Waiting state for Sent Requests!
                      <div className="p-6 flex flex-col items-center justify-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200 mb-1">
                          <Clock className="w-5 h-5 text-slate-400 animate-pulse" />
                        </div>
                        <h4 className="font-black text-slate-900 text-base">Request Pending</h4>
                        <p className="text-sm font-medium text-slate-500 text-center max-w-sm">
                          Waiting for them to accept your pitch. This request will automatically expire in 7 days.
                        </p>
                      </div>
                    )
                  ) : (
                    // ACTIVE CHAT: Show Textbox
                    <div className="p-4">
                      <form onSubmit={handleSendReply} className="flex gap-3">
                        <textarea 
                          required 
                          value={replyText} 
                          onChange={(e) => setReplyText(e.target.value)} 
                          placeholder="Type a message..." 
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium resize-none h-[52px] leading-tight"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendReply(e as any);
                            }
                          }}
                        />
                        <button 
                          type="submit" 
                          disabled={isSending || !replyText.trim()} 
                          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white w-[52px] h-[52px] rounded-2xl flex items-center justify-center shrink-0 transition-all shadow-md shadow-blue-500/20"
                        >
                          <Send className="w-5 h-5 ml-0.5" />
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* NO MESSAGE SELECTED EMPTY STATE */
              <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-slate-50">
                <div className="w-24 h-24 bg-white border border-slate-200 shadow-sm rounded-full flex items-center justify-center mb-6">
                  <MailOpen className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">The Control Center</h3>
                <p className="text-slate-500 font-medium max-w-xs">
                  Select a folder on the left, then click a conversation to view the thread.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}