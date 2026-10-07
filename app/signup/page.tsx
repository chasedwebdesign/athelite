'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { 
  Mail, Lock, ArrowRight, ArrowLeft, Zap, Eye, EyeOff, 
  ShieldCheck, Check, Trophy, Target, Activity, AlertCircle 
} from 'lucide-react';
import Link from 'next/link';

// Centralized Launch Date for Founder Status
const PRO_LAUNCH_DATE = new Date('2026-08-08T00:00:00Z');

const US_STATES_MAP = [
  { abbr: 'AL', name: 'Alabama' }, { abbr: 'AK', name: 'Alaska' }, { abbr: 'AZ', name: 'Arizona' },
  { abbr: 'AR', name: 'Arkansas' }, { abbr: 'CA', name: 'California' }, { abbr: 'CO', name: 'Colorado' },
  { abbr: 'CT', name: 'Connecticut' }, { abbr: 'DE', name: 'Delaware' }, { abbr: 'FL', name: 'Florida' },
  { abbr: 'GA', name: 'Georgia' }, { abbr: 'HI', name: 'Hawaii' }, { abbr: 'ID', name: 'Idaho' },
  { abbr: 'IL', name: 'Illinois' }, { abbr: 'IN', name: 'Indiana' }, { abbr: 'IA', name: 'Iowa' },
  { abbr: 'KS', name: 'Kansas' }, { abbr: 'KY', name: 'Kentucky' }, { abbr: 'LA', name: 'Louisiana' },
  { abbr: 'ME', name: 'Maine' }, { abbr: 'MD', name: 'Maryland' }, { abbr: 'MA', name: 'Massachusetts' },
  { abbr: 'MI', name: 'Michigan' }, { abbr: 'MN', name: 'Minnesota' }, { abbr: 'MS', name: 'Mississippi' },
  { abbr: 'MO', name: 'Missouri' }, { abbr: 'MT', name: 'Montana' }, { abbr: 'NE', name: 'Nebraska' },
  { abbr: 'NV', name: 'Nevada' }, { abbr: 'NH', name: 'New Hampshire' }, { abbr: 'NJ', name: 'New Jersey' },
  { abbr: 'NM', name: 'New Mexico' }, { abbr: 'NY', name: 'New York' }, { abbr: 'NC', name: 'North Carolina' },
  { abbr: 'ND', name: 'North Dakota' }, { abbr: 'OH', name: 'Ohio' }, { abbr: 'OK', name: 'Oklahoma' },
  { abbr: 'OR', name: 'Oregon' }, { abbr: 'PA', name: 'Pennsylvania' }, { abbr: 'RI', name: 'Rhode Island' },
  { abbr: 'SC', name: 'South Carolina' }, { abbr: 'SD', name: 'South Dakota' }, { abbr: 'TN', name: 'Tennessee' },
  { abbr: 'TX', name: 'Texas' }, { abbr: 'UT', name: 'Utah' }, { abbr: 'VT', name: 'Vermont' },
  { abbr: 'VA', name: 'Virginia' }, { abbr: 'WA', name: 'Washington' }, { abbr: 'WV', name: 'West Virginia' },
  { abbr: 'WI', name: 'Wisconsin' }, { abbr: 'WY', name: 'Wyoming' }
];

const getBaseUsername = (first: string, last: string) => {
  if (!first || !last) return '';
  let base = `${first}-${last}`.toLowerCase();
  base = base.replace(/[^a-z0-9-]/g, ''); 
  base = base.replace(/-+/g, '-'); 
  return base;
};

export default function SignUpPage() {
  const router = useRouter();
  const supabase = createClient();

  // Multi-step form state
  const [step, setStep] = useState<1 | 2>(1);

  // Base Auth States (Step 2)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Dual-sided marketplace state (Step 1)
  const [userType, setUserType] = useState<'athlete' | 'coach'>('athlete');
  const [coachType, setCoachType] = useState<'high_school' | 'college'>('college');

  // Expanded Onboarding States (Step 1)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [highSchool, setHighSchool] = useState(''); // Used exclusively for coaches now
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [gradYear, setGradYear] = useState('20');
  const [gender, setGender] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  
  // Validation States
  const [hasAttemptedStep1, setHasAttemptedStep1] = useState(false);
  const [hasAttemptedStep2, setHasAttemptedStep2] = useState(false);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  // Handle User Type changes (resets validation)
  const handleUserTypeChange = (type: 'athlete' | 'coach') => {
    setUserType(type);
    setHasAttemptedStep1(false);
    setError(null);
  };

  // Username Base Name Sync
  useEffect(() => {
    if (firstName && lastName && userType === 'athlete') {
      const baseName = getBaseUsername(firstName, lastName);
      if (customSlug && !customSlug.startsWith(baseName)) {
         setCustomSlug(baseName);
         setSlugStatus('checking');
      } else if (!customSlug && !isSlugManuallyEdited) {
         setCustomSlug(baseName);
         setSlugStatus('checking');
      }
    }
  }, [firstName, lastName, userType, customSlug, isSlugManuallyEdited]);

  // Username Availability Debounce Check
  useEffect(() => {
    if (!customSlug || userType !== 'athlete') return;

    const checkSlug = async () => {
      const { data } = await supabase.from('athletes').select('id').eq('custom_slug', customSlug).maybeSingle();
      setSlugStatus(data ? 'taken' : 'available');
    };
    if (slugStatus === 'checking') {
      const timeoutId = setTimeout(checkSlug, 600);
      return () => clearTimeout(timeoutId);
    }
  }, [customSlug, slugStatus, supabase, userType]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.toLowerCase();
    val = val.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
    const baseName = getBaseUsername(firstName, lastName);
    
    if (baseName && !val.startsWith(baseName)) val = baseName;
    if (val === customSlug) return; 

    setCustomSlug(val);
    setIsSlugManuallyEdited(true);
    setSlugStatus('checking');
  };

  const handleGradYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ''); 
    if (!val.startsWith('20')) val = '20' + val.replace(/^20/, ''); 
    if (val.length < 2) val = '20'; 
    if (val.length > 4) val = val.substring(0, 4); 
    setGradYear(val);
  };

  // Core Validation Stylings 
  const getValidationClass = (value: string | number | null, customCondition: boolean = true, isStep2Field: boolean = false) => {
    const hasAttempted = isStep2Field ? hasAttemptedStep2 : hasAttemptedStep1;
    if (!hasAttempted) return 'border-slate-700 bg-slate-800/80 focus-within:border-blue-500';
    return (value && customCondition) ? 'border-emerald-500 focus-within:border-emerald-600 bg-emerald-50/20' : 'border-red-500 focus-within:border-red-600 bg-red-50/20';
  };

  const isNameComplete = Boolean(firstName && lastName);
  
  let slugValidationClass = 'border-slate-700 bg-slate-800/80 focus-within:border-blue-500';
  if (!isNameComplete) {
    slugValidationClass = 'border-slate-700 bg-slate-800/80 cursor-not-allowed opacity-60';
  } else if (hasAttemptedStep1) {
    if (customSlug && slugStatus === 'available') {
      slugValidationClass = 'border-emerald-500 focus-within:border-emerald-600 bg-emerald-50/20';
    } else {
      slugValidationClass = 'border-red-500 focus-within:border-red-600 bg-red-50/20';
    }
  }

  // Next Step Logic (Validates Step 1)
  const handleNextStep = () => {
    setHasAttemptedStep1(true);
    setError(null);

    if (userType === 'athlete') {
      // HS Name removed from Athlete Validation
      const isComplete = firstName && lastName && city && state && gender && gradYear.length === 4 && customSlug && slugStatus === 'available';
      if (!isComplete) {
        setError('Please complete all highlighted fields and ensure your username is available.');
        return;
      }
    } else if (userType === 'coach') {
      const isComplete = firstName && lastName && highSchool;
      if (!isComplete) {
        setError('Please provide your name and the school you coach for.');
        return;
      }
    }

    setStep(2);
    setHasAttemptedStep2(false); 
  };

  // Final Submit Logic (Validates Step 2 & Creates Account)
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedStep2(true);
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    if (!acceptedTerms) {
      setError("You must accept the Terms of Service and Privacy Policy to create an account.");
      setLoading(false);
      return;
    }

    if (userType === 'coach' && coachType === 'college' && !email.toLowerCase().endsWith('.edu')) {
      setError("NCAA/College coaches must register with a valid .edu university email address to verify their identity.");
      setLoading(false);
      return;
    }

    try {
      const isFounderEligible = new Date() < PRO_LAUNCH_DATE;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            account_type: userType,
            coach_type: userType === 'coach' ? coachType : null,
            is_founder: isFounderEligible,
            first_name: firstName,
            last_name: lastName,
            // High School is passed only for coaches, athletes are null
            school_name: userType === 'coach' ? highSchool : null,
            city: userType === 'athlete' ? city : null,
            state: userType === 'athlete' ? state : null,
            grad_year: userType === 'athlete' ? parseInt(gradYear, 10) : null,
            gender: userType === 'athlete' ? gender : null,
            custom_slug: userType === 'athlete' ? customSlug : null
          }
        }
      });
      
      if (authError) throw authError;

      // Email Verification Check
      if (authData.user && !authData.session) {
          setSuccessMsg("Profile secured! Please check your email inbox for a verification link to activate your account.");
          setLoading(false);
          return;
      }

      // Fallback Upserts (if session exists right away)
      if (authData.user && authData.session) {
        if (userType === 'athlete') {
          const { error: athleteErr } = await supabase.from('athletes').upsert({ 
            id: authData.user.id,
            first_name: firstName,
            last_name: lastName,
            city: city,
            state: state,
            grad_year: parseInt(gradYear, 10),
            gender: gender,
            custom_slug: customSlug,
            is_founder: isFounderEligible 
          }, { onConflict: 'id' });
          
          if (athleteErr) console.warn(`Fallback athlete creation error: ${athleteErr.message}`);
        } else {
          const { error: coachErr } = await supabase.from('coaches').upsert({ 
            id: authData.user.id,
            first_name: firstName,
            last_name: lastName,
            school_name: highSchool,
            coach_type: coachType,
            is_founder: isFounderEligible
          }, { onConflict: 'id' });
          
          if (coachErr) console.warn(`Fallback coach creation error: ${coachErr.message}`);
        }
      }
      
      router.push('/dashboard');
      router.refresh();

    } catch (err: any) {
      setError(err.message || "An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#020617] flex flex-col md:flex-row font-sans selection:bg-blue-500/30 overflow-hidden relative">
      
      {/* ========================================================= */}
      {/* LEFT SIDE - THE GAMIFIED SHOWCASE                         */}
      {/* ========================================================= */}
      <div className="hidden md:flex md:w-[45%] lg:w-1/2 relative overflow-hidden flex-col justify-between p-12 lg:p-24 border-r border-slate-800/60 z-10 shadow-2xl">
        
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
        <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>
        
        <div className="relative z-10 flex justify-between items-center w-full">
          <Link href="/" className="inline-flex items-center text-slate-400 text-sm font-bold hover:text-white transition-colors bg-slate-900/50 backdrop-blur-md px-4 py-2 rounded-full border border-slate-800 shadow-sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Link>
          <div className="flex items-center gap-2 bg-slate-900/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Systems Online</span>
          </div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center mt-12">
          <div className="mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-white leading-[1.1] mb-4 drop-shadow-lg">
              {userType === 'athlete' ? 'Stop guessing about your recruitment.' : 'Find verified talent in seconds.'}
            </h1>
            <p className="text-lg text-slate-400 font-medium leading-relaxed max-w-md">
              {userType === 'athlete' 
                ? 'Sync your times, track your progress against college standards, and dominate the state leaderboards.'
                : 'Access the Discovery Engine, message verified athletes securely, and build your championship roster.'}
            </p>
          </div>

          <div className="relative w-full max-w-md h-64 select-none animate-in fade-in slide-in-from-bottom-12 duration-700 delay-300" style={{ animationFillMode: 'backwards' }}>
            <div className="absolute top-0 left-4 bg-[#0a0f1e]/90 backdrop-blur-xl border border-slate-700/60 p-5 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] transform -rotate-6 hover:rotate-0 hover:scale-105 transition-all duration-500 w-64 z-20 group">
               <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-3xl pointer-events-none"></div>
               <div className="flex items-center justify-between mb-3 relative z-10">
                 <div className="flex items-center gap-1.5 text-blue-400">
                   <ShieldCheck className="w-4 h-4 group-hover:text-blue-300 transition-colors" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Verified PR</span>
                 </div>
                 <div className="bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-400 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest shadow-[0_0_10px_rgba(217,70,239,0.2)]">
                   Elite Tier
                 </div>
               </div>
               <div className="flex items-end gap-2 relative z-10">
                 <span className="text-4xl font-black text-white leading-none">10.42</span>
                 <span className="text-sm font-bold text-slate-500 mb-1">100m Dash</span>
               </div>
            </div>

            <div className="absolute top-24 right-0 bg-[#0a0f1e]/90 backdrop-blur-xl border border-slate-700/60 p-6 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] transform rotate-3 hover:rotate-0 hover:scale-105 transition-all duration-500 w-72 z-10">
               <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-3xl pointer-events-none"></div>
               <div className="flex items-center gap-4 mb-4 relative z-10">
                 <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-inner border border-blue-400/30">
                   <Target className="w-6 h-6 text-white" />
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Matchmaker</p>
                   <p className="text-sm font-bold text-white">Base Recruiting Score</p>
                 </div>
               </div>
               <div className="w-full bg-slate-950 rounded-full h-3 mb-2 overflow-hidden border border-slate-800 shadow-inner relative z-10">
                 <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-fuchsia-500 h-full w-[92%] rounded-full relative">
                    <div className="absolute top-0 right-0 bottom-0 w-6 bg-white/30 blur-[3px] animate-pulse"></div>
                 </div>
               </div>
               <div className="flex justify-between text-[10px] font-bold text-slate-500 relative z-10 uppercase tracking-widest">
                 <span>D2 Prospect</span>
                 <span className="text-fuchsia-400 font-black drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]">Power 4 D1</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* RIGHT SIDE - THE FORM (Mobile First)                      */}
      {/* ========================================================= */}
      <div className="w-full md:w-[55%] lg:w-1/2 flex flex-col relative overflow-y-auto custom-scrollbar bg-[#020617] z-20">
        
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none md:hidden"></div>

        <div className="md:hidden px-6 pt-10 pb-6 relative z-20">
           <Link href="/" className="inline-flex items-center text-slate-400 text-xs font-bold hover:text-white transition-colors mb-6 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800">
             <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
           </Link>
           <h2 className="text-3xl font-black text-white flex items-center gap-2">
             <Activity className="w-8 h-8 text-blue-500" />
             Chased<span className="text-blue-400">Sports</span>
           </h2>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-24 relative z-10">
          
          <div className="w-full max-w-2xl bg-[#0a0f1e]/80 md:bg-transparent backdrop-blur-2xl md:backdrop-blur-none border border-slate-800/80 md:border-none p-8 md:p-0 rounded-[2.5rem] shadow-2xl md:shadow-none transition-all">
            
            {/* Gamified Step Progress Indicator */}
            <div className="flex items-center gap-4 mb-8 max-w-[420px] mx-auto md:mx-0 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg transition-all ${step === 1 ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] scale-110' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'}`}>
                  {step === 2 ? <Check className="w-3.5 h-3.5" /> : '1'}
                </div>
                <span className={`text-xs font-bold tracking-wide transition-colors ${step === 1 ? 'text-white' : 'text-slate-500'}`}>Profile</span>
              </div>
              <div className={`flex-1 h-0.5 rounded-full transition-colors ${step === 2 ? 'bg-emerald-500/50' : 'bg-slate-800'}`}></div>
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg transition-all ${step === 2 ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] scale-110' : 'bg-slate-800 border border-slate-700 text-slate-500'}`}>
                  2
                </div>
                <span className={`text-xs font-bold tracking-wide transition-colors ${step === 2 ? 'text-white' : 'text-slate-500'}`}>Security</span>
              </div>
            </div>

            <div className="text-center md:text-left space-y-2 mb-8">
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                {step === 1 ? 'Create account' : 'Secure your account'}
              </h2>
              <p className="text-slate-400 font-medium">
                {step === 1 ? 'Join the gamified recruiting network.' : 'Set up your login credentials.'}
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 backdrop-blur-sm text-red-400 border border-red-500/20 p-4 rounded-2xl text-sm font-bold flex items-start gap-3 mb-6 animate-in fade-in duration-300 shadow-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                <p className="leading-relaxed">{error}</p>
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-500/10 backdrop-blur-sm text-emerald-400 border border-emerald-500/20 p-4 rounded-2xl text-sm font-bold flex items-start gap-3 animate-in fade-in duration-300 shadow-sm">
                <Mail className="w-5 h-5 shrink-0 mt-0.5 text-emerald-500" />
                <p className="leading-relaxed">{successMsg}</p>
              </div>
            )}

            {!successMsg && (
              <div className="relative">
                
                {/* ========================================= */}
                {/* STEP 1: PROFILE INFO                      */}
                {/* ========================================= */}
                {step === 1 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-left-8 duration-500">
                    
                    {/* DUAL SIGN-UP TOGGLE - Staggered */}
                    <div 
                      className="max-w-[420px] mx-auto md:mx-0 animate-in fade-in slide-in-from-bottom-4 duration-500"
                      style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}
                    >
                      <div className="flex bg-slate-900/80 p-1.5 rounded-2xl mb-4 border border-slate-800 shadow-inner">
                        <button 
                          type="button"
                          onClick={() => handleUserTypeChange('athlete')}
                          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center ${userType === 'athlete' ? 'bg-slate-800 text-blue-400 shadow-md border border-slate-700' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                          <Zap className={`w-4 h-4 mr-2 ${userType === 'athlete' ? 'text-blue-500' : 'text-slate-500'}`} /> 
                          Athlete
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleUserTypeChange('coach')}
                          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center ${userType === 'coach' ? 'bg-slate-800 text-purple-400 shadow-md border border-slate-700' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                          <Trophy className={`w-4 h-4 mr-2 ${userType === 'coach' ? 'text-purple-500' : 'text-slate-500'}`} /> 
                          Coach
                        </button>
                      </div>

                      {userType === 'coach' && (
                        <div className="grid grid-cols-2 gap-3 mb-6 animate-in zoom-in-95 duration-200">
                          <button 
                            type="button"
                            onClick={() => setCoachType('high_school')}
                            className={`px-4 py-3.5 rounded-xl border-2 text-sm font-bold transition-all text-center flex flex-col items-center gap-1 ${coachType === 'high_school' ? 'border-purple-500 bg-purple-500/10 text-purple-400 shadow-sm' : 'border-slate-800 bg-slate-900/50 text-slate-500 hover:bg-slate-800 hover:border-slate-700'}`}
                          >
                            High School
                          </button>
                          <button 
                            type="button"
                            onClick={() => setCoachType('college')}
                            className={`px-4 py-3.5 rounded-xl border-2 text-sm font-bold transition-all text-center flex flex-col items-center gap-1 ${coachType === 'college' ? 'border-purple-500 bg-purple-500/10 text-purple-400 shadow-sm' : 'border-slate-800 bg-slate-900/50 text-slate-500 hover:bg-slate-800 hover:border-slate-700'}`}
                          >
                            College
                          </button>
                        </div>
                      )}
                    </div>

                    {/* EXPANDED SIGN UP FIELDS - Staggered */}
                    <div 
                      className="space-y-4 pt-2 pb-4 animate-in fade-in slide-in-from-bottom-6 duration-500"
                      style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className={`border-2 rounded-xl p-3 transition-colors ${getValidationClass(firstName)}`}>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">First Name</label>
                          <input 
                            type="text" value={firstName} 
                            onChange={(e) => setFirstName(e.target.value)} 
                            className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder-slate-500" 
                            placeholder="e.g. Noah"
                          />
                        </div>

                        <div className={`border-2 rounded-xl p-3 transition-colors ${getValidationClass(lastName)}`}>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Last Name</label>
                          <input 
                            type="text" value={lastName} 
                            onChange={(e) => setLastName(e.target.value)} 
                            className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder-slate-500" 
                            placeholder="e.g. Lyles"
                          />
                        </div>

                        {userType === 'athlete' && (
                          <>
                            <div className={`border-2 rounded-xl p-3 transition-colors ${getValidationClass(city)}`}>
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">City</label>
                              <input 
                                type="text" value={city} 
                                onChange={(e) => setCity(e.target.value)} 
                                className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder-slate-500" 
                                placeholder="e.g. Millersburg"
                              />
                            </div>

                            <div className={`border-2 rounded-xl px-3 py-1.5 transition-colors ${getValidationClass(state)}`}>
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">State</label>
                              <select
                                value={state}
                                onChange={(e) => setState(e.target.value)}
                                className="w-full bg-transparent text-sm font-bold text-white outline-none appearance-none cursor-pointer pb-1"
                              >
                                <option value="" className="text-slate-800">Select State...</option>
                                {US_STATES_MAP.map(s => <option key={s.abbr} value={s.name} className="text-slate-800">{s.abbr} - {s.name}</option>)}
                              </select>
                            </div>

                            <div className={`border-2 rounded-xl p-3 transition-colors ${getValidationClass(gradYear, gradYear.length === 4)} sm:col-span-2`}>
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Graduation Year</label>
                              <input 
                                type="text" inputMode="numeric" maxLength={4}
                                value={gradYear} 
                                onChange={handleGradYearChange} 
                                className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder-slate-500" 
                              />
                            </div>
                          </>
                        )}

                        {userType === 'coach' && (
                          <div className={`border-2 rounded-xl p-3 transition-colors ${getValidationClass(highSchool)} sm:col-span-2`}>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                              School / University Name
                            </label>
                            <input 
                              type="text" value={highSchool} 
                              onChange={(e) => setHighSchool(e.target.value)} 
                              className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder-slate-500" 
                              placeholder={coachType === 'college' ? "e.g. Oregon State University" : "e.g. South Albany HS"}
                            />
                          </div>
                        )}
                      </div>

                      {userType === 'athlete' && (
                        <>
                          <div className={`border-2 rounded-xl p-3 transition-colors ${getValidationClass(gender)}`}>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Athletic Division</label>
                            <div className="flex gap-2">
                              <button
                                type="button" onClick={() => setGender('Boys')}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all border ${gender === 'Boys' ? 'bg-blue-600 border-blue-500 text-white shadow-md' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                              >
                                Boys
                              </button>
                              <button
                                type="button" onClick={() => setGender('Girls')}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all border ${gender === 'Girls' ? 'bg-fuchsia-600 border-fuchsia-500 text-white shadow-md' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                              >
                                Girls
                              </button>
                            </div>
                          </div>

                          <div className={`border-2 rounded-xl p-3 transition-colors ${slugValidationClass}`}>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                                Profile Username
                              </label>
                              {isNameComplete && (
                                <span className={`text-[10px] font-black uppercase tracking-widest ${
                                  slugStatus === 'checking' ? 'text-blue-500 animate-pulse' :
                                  slugStatus === 'available' ? 'text-emerald-500' :
                                  slugStatus === 'taken' ? 'text-red-500' : 'text-slate-400'
                                }`}>
                                  {slugStatus === 'checking' ? 'Checking...' :
                                   slugStatus === 'available' ? 'Available' :
                                   slugStatus === 'taken' ? 'Taken' : ''}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center">
                              <span className="text-slate-500 font-bold text-sm mr-1 hidden sm:inline">chasedsports.com/athlete/</span>
                              <span className="text-slate-500 font-bold text-sm mr-1 sm:hidden">.../</span>
                              <input 
                                type="text" 
                                value={customSlug}
                                disabled={!isNameComplete}
                                onChange={handleUsernameChange}
                                className="flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder-slate-600 disabled:text-slate-600" 
                                placeholder={isNameComplete ? "e.g. chase-fulleton" : "Complete name first"}
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <button 
                      type="button"
                      onClick={handleNextStep}
                      className={`w-full max-w-[420px] mx-auto md:mx-0 group text-white px-8 py-4 rounded-2xl font-black text-lg transition-all flex justify-center items-center mt-6 bg-slate-800 hover:bg-slate-700 border border-slate-700 shadow-md active:scale-[0.98] animate-in fade-in slide-in-from-bottom-6 duration-500`}
                      style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}
                    >
                      Continue
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                )}


                {/* ========================================= */}
                {/* STEP 2: SECURE LOGIN DETAILS              */}
                {/* ========================================= */}
                {step === 2 && (
                  <form onSubmit={handleSignUp} className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                    <div className="grid grid-cols-1 gap-5">
                      
                      {/* Email Input */}
                      <div className="space-y-1.5 group max-w-[420px]">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 group-focus-within:text-blue-500 transition-colors">Email Address</label>
                        <div className="relative flex items-center">
                          <div className="absolute left-4 pointer-events-none">
                            <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                          </div>
                          <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={userType === 'coach' && coachType === 'college' ? "coach@university.edu" : userType === 'coach' ? "coach@school.org" : "athlete@example.com"}
                            className={`w-full bg-slate-800/80 border text-white rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-4 font-bold shadow-sm placeholder:font-medium placeholder:text-slate-500 transition-all ${getValidationClass(email, true, true).includes('border-red') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-700 focus:border-blue-500 focus:ring-blue-500/20'}`}
                          />
                        </div>
                      </div>

                      {/* Password Input */}
                      <div className="space-y-1.5 group max-w-[420px]">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 group-focus-within:text-blue-500 transition-colors">Password</label>
                        <div className="relative flex items-center">
                          <div className="absolute left-4 pointer-events-none">
                            <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                          </div>
                          <input 
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className={`w-full bg-slate-800/80 border text-white rounded-2xl pl-12 pr-12 py-4 focus:outline-none focus:ring-4 font-bold shadow-sm placeholder:font-medium placeholder:text-slate-500 transition-all ${getValidationClass(password, password.length >= 6, true).includes('border-red') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-700 focus:border-blue-500 focus:ring-blue-500/20'}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 text-slate-500 hover:text-white transition-colors focus:outline-none flex items-center justify-center p-2 bg-slate-700/50 hover:bg-slate-700 rounded-xl"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <label className="flex items-start gap-3 p-3 cursor-pointer group mt-4 bg-slate-900/50 rounded-2xl border border-slate-800 hover:bg-slate-800 transition-colors max-w-[420px]">
                      <div className="relative flex items-center justify-center mt-0.5 shrink-0 ml-1">
                        <input
                          type="checkbox"
                          required
                          checked={acceptedTerms}
                          onChange={(e) => setAcceptedTerms(e.target.checked)}
                          className="peer sr-only"
                        />
                        <div className="w-5 h-5 rounded-lg border-2 border-slate-600 bg-slate-950 peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all shadow-sm group-hover:border-blue-500 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none stroke-[3]" />
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400 leading-relaxed pr-2">
                        I agree to the{' '}
                        <Link href="/terms" target="_blank" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">Terms of Service</Link>
                        {' '}and{' '}
                        <Link href="/privacy" target="_blank" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">Privacy Policy</Link>, 
                        and confirm I am at least 13 years old.
                      </span>
                    </label>

                    <div className="flex gap-4 max-w-[420px]">
                      <button 
                        type="button"
                        onClick={() => { setStep(1); setError(null); }}
                        className="px-6 py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/50 hover:border-slate-700 active:scale-[0.98]"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      
                      <button 
                        type="submit"
                        disabled={loading}
                        className={`flex-1 group text-white px-8 py-4 rounded-2xl font-black text-lg transition-all flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed
                          ${userType === 'coach' 
                            ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 shadow-[0_0_30px_rgba(147,51,234,0.3)] hover:shadow-[0_0_40px_rgba(147,51,234,0.5)] active:scale-[0.98]' 
                            : 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:shadow-[0_0_40px_rgba(37,99,235,0.6)] active:scale-[0.98]'
                          }`}
                      >
                        {loading ? <Activity className="w-6 h-6 animate-spin" /> : 'Create Profile'}
                        {!loading && <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            <div className="text-center pt-8 border-t border-slate-800/80 mt-8 max-w-[420px]">
              <p className="text-sm font-bold text-slate-500 inline-block px-4 relative z-10">
                Already a member?{' '}
                <Link 
                  href="/login"
                  className="text-white font-black hover:text-blue-400 transition-colors ml-1 border-b-2 border-white/30 hover:border-blue-400 pb-0.5"
                >
                  Sign In
                </Link>
              </p>
            </div>

          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #334155; border-radius: 10px; }
      `}} />
    </main>
  );
}