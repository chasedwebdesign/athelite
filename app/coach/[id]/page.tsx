'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { School, MapPin, Mail, ArrowLeft, ShieldCheck, Activity } from 'lucide-react';
import Link from 'next/link';

export default function PublicCoachProfile() {
  const params = useParams();
  const router = useRouter();
  const coachId = params.id as string;
  const supabase = createClient();
  
  const [coach, setCoach] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCoach() {
      const { data } = await supabase
        .from('coaches')
        .select('*')
        .eq('id', coachId)
        .single();
      
      if (data) setCoach(data);
      setLoading(false);
    }
    if (coachId) fetchCoach();
  }, [coachId, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!coach) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-center p-6">
        <Activity className="w-16 h-16 text-slate-300 mb-4" />
        <h1 className="text-3xl font-black text-slate-900 mb-2">Coach Not Found</h1>
        <button onClick={() => router.push('/')} className="bg-purple-600 text-white font-bold px-6 py-3 rounded-xl mt-6">Return Home</button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans pb-32">
      <div className="max-w-4xl mx-auto px-6 pt-10">
        
        <button onClick={() => router.back()} className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-900 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </button>

        {/* COACH HERO CARD */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-slate-200 shadow-xl relative overflow-hidden mb-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
            
            <div className="w-32 h-32 md:w-40 md:h-40 bg-slate-100 rounded-full border-4 border-white shadow-lg flex items-center justify-center overflow-hidden shrink-0">
              {coach.avatar_url ? (
                <img src={coach.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <School className="w-16 h-16 text-slate-300" />
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center bg-purple-50 border border-purple-200 px-3 py-1 rounded-full mb-3">
                <span className="text-[10px] font-black text-purple-700 uppercase tracking-widest">
                  {coach.coach_type === 'college' ? 'College Coach' : 'High School Coach'}
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-2 flex flex-col md:flex-row md:items-center justify-center md:justify-start gap-2">
                {coach.first_name} {coach.last_name}
                {coach.is_verified && (
                  <span className="flex items-center text-sm bg-blue-50 text-blue-600 px-2 py-1 rounded-lg border border-blue-200 w-fit mx-auto md:mx-0">
                    <ShieldCheck className="w-4 h-4 mr-1" /> Verified Contact
                  </span>
                )}
              </h1>
              
              <p className="text-xl font-bold text-slate-500 mb-8 flex items-center justify-center md:justify-start">
                <MapPin className="w-5 h-5 mr-2 text-slate-400" /> {coach.school_name || 'Unknown University'}
              </p>

              {/* QUICK EMAIL BUTTON */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                {coach.email ? (
                  <a 
                    href={`mailto:${coach.email}?subject=ChasedSports:%20Connection%20Request`}
                    className="w-full sm:w-auto bg-slate-900 hover:bg-purple-600 text-white font-black py-4 px-8 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:scale-105 active:scale-95"
                  >
                    <Mail className="w-5 h-5" /> Email Coach Directly
                  </a>
                ) : (
                  <div className="w-full sm:w-auto bg-slate-100 text-slate-400 font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-2 border border-slate-200">
                    Email Hidden
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}