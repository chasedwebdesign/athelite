'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import AthleteDashboard from '@/components/dashboards/AthleteDashboard';
import CollegeCoachDashboard from '@/components/dashboards/CollegeCoachDashboard';
import HighSchoolCoachDashboard from '@/components/dashboards/HighSchoolCoachDashboard';

export default function DashboardRouter() {
  const supabase = createClient();
  const router = useRouter();
  const [role, setRole] = useState<'athlete' | 'college_coach' | 'hs_coach' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function determineRoute() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // 1. CHECK COACHES FIRST (High Priority)
      const { data: coach } = await supabase.from('coaches').select('coach_type').eq('id', session.user.id).maybeSingle();
      if (coach) {
        if (coach.coach_type === 'college') {
          setRole('college_coach');
        } else {
          setRole('hs_coach');
        }
        setLoading(false);
        return;
      }

      // 2. CHECK ATHLETES SECOND (Default Fallback)
      const { data: athlete } = await supabase.from('athletes').select('id').eq('id', session.user.id).maybeSingle();
      if (athlete) {
        setRole('athlete');
        setLoading(false);
        return;
      }

      // If they exist in neither table, something went wrong with signup. Send back to login.
      router.push('/login');
    }

    determineRoute();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold mt-4 animate-pulse">Loading Command Center...</p>
      </div>
    );
  }

  // TRAFFIC COP ROUTING
  if (role === 'athlete') return <AthleteDashboard />;
  if (role === 'college_coach') return <CollegeCoachDashboard />;
  if (role === 'hs_coach') return <HighSchoolCoachDashboard />;

  return null;
}