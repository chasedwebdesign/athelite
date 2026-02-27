'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Activity, LogOut, Search, Mail, MailOpen, School, Send, Clock, ChevronLeft, UserCircle2 } from 'lucide-react';
import Link from 'next/link';

interface Message {
  id: string;
  sender_name: string;
  sender_school: string;
  sender_email: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export default function InboxPage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    async function loadMessages() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      // Fetch all messages belonging strictly to this authenticated athlete
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('athlete_id', session.user.id)
        .order('created_at', { ascending: false });

      if (data) {
        setMessages(data as Message[]);
      }
      setLoading(false);
    }

    loadMessages();
  }, [supabase, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // --- NEW: MARK AS READ FUNCTION ---
  const handleOpenMessage = async (message: Message) => {
    setSelectedMessage(message);

    // If it's already read, do nothing to the database
    if (message.is_read) return;

    // Otherwise, update the database to mark it as read!
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', message.id);

    if (!error) {
      // Update the local state instantly so the blue "Unread" dot disappears
      setMessages(prev => 
        prev.map(m => m.id === message.id ? { ...m, is_read: true } : m)
      );
    }
  };

  // Helper to format the timestamp
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

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans pb-32">
      
      {/* SECURE NAVBAR */}
      

      <div className="max-w-7xl mx-auto px-6 pt-10">
        
        {/* HEADER */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Recruiting Inbox</h1>
            <p className="text-slate-500 font-medium text-lg">Your direct messages from college programs.</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 px-4 py-2 rounded-2xl flex items-center gap-3">
            <Mail className="w-5 h-5 text-blue-600" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Unread</span>
              <span className="font-black text-blue-700 leading-none">{unreadCount}</span>
            </div>
          </div>
        </div>

        {/* TWO-COLUMN INBOX LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
          
          {/* COLUMN 1: MESSAGE LIST */}
          <div className="md:col-span-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-black text-slate-900">All Pitches</h3>
            </div>
            
            <div className="overflow-y-auto flex-1 p-3 space-y-2">
              {messages.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <MailOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-500">Your inbox is empty.</p>
                </div>
              ) : (
                messages.map((message) => (
                  <button
                    key={message.id}
                    onClick={() => handleOpenMessage(message)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedMessage?.id === message.id ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-500' : 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-sm'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`font-black truncate pr-2 ${!message.is_read ? 'text-slate-900' : 'text-slate-600'}`}>
                        {message.sender_school}
                      </span>
                      {!message.is_read && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full shrink-0 mt-1"></div>}
                    </div>
                    <div className="text-xs font-bold text-slate-500 truncate mb-2">
                      {message.sender_name}
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                      <Clock className="w-3 h-3 mr-1" /> {formatDate(message.created_at)}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* COLUMN 2: OPEN MESSAGE VIEW */}
          <div className="md:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            {selectedMessage ? (
              <div className="flex flex-col h-full">
                {/* Message Header */}
                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-white border border-slate-200 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                      <School className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900">{selectedMessage.sender_school}</h2>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm font-medium text-slate-500">
                        <span className="flex items-center"><UserCircle2 className="w-4 h-4 mr-1 text-slate-400" /> {selectedMessage.sender_name}</span>
                        <span className="text-slate-300">•</span>
                        <a href={`mailto:${selectedMessage.sender_email}`} className="flex items-center hover:text-blue-600 transition-colors">
                          <Send className="w-4 h-4 mr-1 text-slate-400" /> {selectedMessage.sender_email}
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                    {formatDate(selectedMessage.created_at)}
                  </div>
                </div>

                {/* Message Body */}
                <div className="p-8 overflow-y-auto flex-1">
                  <div className="prose prose-slate max-w-none">
                    <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                      {selectedMessage.content}
                    </p>
                  </div>
                </div>

                {/* Reply Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50 mt-auto">
                  <a 
                    href={`mailto:${selectedMessage.sender_email}?subject=Re: Recruiting Inquiry - ChasedSports`}
                    className="inline-flex items-center justify-center bg-slate-900 hover:bg-blue-600 text-white font-black px-6 py-3 rounded-xl transition-all shadow-sm gap-2"
                  >
                    <Send className="w-4 h-4" /> Reply via Email
                  </a>
                </div>
              </div>
            ) : (
              /* EMPTY STATE */
              <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                <div className="w-20 h-20 bg-slate-50 border-2 border-slate-100 border-dashed rounded-full flex items-center justify-center mb-6">
                  <Mail className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Select a message</h3>
                <p className="text-slate-500 font-medium max-w-xs">
                  Click on a pitch from the sidebar to read the full message from the coach.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}