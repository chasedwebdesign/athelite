'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { 
  Trophy, User, MapPin, Mail, Lock, ArrowRight, 
  ChevronLeft, ShieldCheck, Zap, AlertCircle, Activity, CheckCircle2
} from 'lucide-react';

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

export default function OnboardingFlow() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Survey Data (Team and Major removed entirely)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [gradYear, setGradYear] = useState('20');
  const [gender, setGender] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  
  // UI & Validation States
  const [hasAttemptedNext, setHasAttemptedNext] = useState(false);
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  
  // Auth Data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Hydrate from Local Storage
  useEffect(() => {
    const data = localStorage.getItem('chasedSports_onboarding');
    if (!data) {
      router.replace('/');
      return;
    }
    try {
      const parsed = JSON.parse(data);
      setOnboardingData(parsed);
      if (parsed.gender) setGender(parsed.gender);
      setLoading(false);
    } catch (e) {
      router.replace('/');
    }
  }, [router]);

  // Username Base Name Sync
  useEffect(() => {
    if (firstName && lastName) {
      const baseName = getBaseUsername(firstName, lastName);
      if (customSlug && !customSlug.startsWith(baseName)) {
         setCustomSlug(baseName);
         setSlugStatus('checking');
      } else if (!customSlug && !isSlugManuallyEdited) {
         setCustomSlug(baseName);
         setSlugStatus('checking');
      }
    }
  }, [firstName, lastName, customSlug, isSlugManuallyEdited]);

  // Username Availability Debounce Check
  useEffect(() => {
    if (!customSlug) {
      setSlugStatus('idle');
      return;
    }
    const checkSlug = async () => {
      const { data } = await supabase.from('athletes').select('id').eq('custom_slug', customSlug).maybeSingle();
      setSlugStatus(data ? 'taken' : 'available');
    };
    if (slugStatus === 'checking') {
      const timeoutId = setTimeout(checkSlug, 600);
      return () => clearTimeout(timeoutId);
    }
  }, [customSlug, slugStatus, supabase]);

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

  // CORE VALIDATION STYLE CONTROLLER
  const getValidationClass = (value: string | number | null, customCondition: boolean = true) => {
    if (!hasAttemptedNext) return 'border-slate-700 bg-slate-800/80 focus-within:border-blue-500';
    return (value && customCondition) ? 'border-emerald-500 focus-within:border-emerald-600 bg-emerald-50/20' : 'border-red-500 focus-within:border-red-600 bg-red-50/20';
  };

  const isNameComplete = Boolean(firstName && lastName);
  
  let slugValidationClass = 'border-slate-700 bg-slate-800/80 focus-within:border-blue-500';
  if (!isNameComplete) {
    slugValidationClass = 'border-slate-700 bg-slate-800/80 cursor-not-allowed opacity-60';
  } else if (hasAttemptedNext) {
    if (customSlug && slugStatus === 'available') {
      slugValidationClass = 'border-emerald-500 focus-within:border-emerald-600 bg-emerald-50/20';
    } else {
      slugValidationClass = 'border-red-500 focus-within:border-red-600 bg-red-50/20';
    }
  }

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (step === 2) {
      setHasAttemptedNext(true); 
      
      const isComplete = firstName && lastName && city && state && 
                         gender && gradYear.length === 4 && customSlug && 
                         slugStatus === 'available';
                         
      if (!isComplete) {
        setError('Please complete all highlighted fields and ensure your username is available.');
        return;
      }
      setStep(3);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    if (!email.trim() || password.length < 6) {
      setError('Please provide a valid email and a password with at least 6 characters.');
      setIsSubmitting(false);
      return;
    }

    try {
      const isFounderEligible = new Date() < PRO_LAUNCH_DATE;

      // 1. Authenticate User
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            account_type: 'athlete',
            is_founder: isFounderEligible
          }
        }
      });

      if (authError) throw authError;

      // 2. Await Email Verification if required by Supabase settings
      if (authData.user && !authData.session) {
         setSuccessMsg("Profile secured! Please check your email inbox for a verification link to activate your account and view your dashboard.");
         setIsSubmitting(false);
         return;
      }

      if (authData.user && authData.session) {
        // 3. FORCE UPSERT (Solves Trigger Race Condition without team/major)
        const { error: dbUpdateError } = await supabase.from('athletes').upsert({
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

        if (dbUpdateError) {
          console.warn("DB Upsert Fallback Error:", dbUpdateError.message);
        }

        // 4. Setup Metrics into Athlete Sports
        if (onboardingData.metrics && onboardingData.metrics.length > 0) {
          const formattedPrs = onboardingData.metrics.map((m: any) => ({
            name: m.event || m.name || 'Unknown Event',
            value: m.mark || m.value?.toString() || '0'
          }));

          const { error: sportError } = await supabase.from('athlete_sports').insert({
             athlete_id: authData.user.id,
             sport_name: onboardingData.sport,
             metrics: formattedPrs,
             custom_fit_score: onboardingData.preCalculatedScore || 50,
             is_active: true
          });

          if (sportError) console.warn("Sport Setup Error:", sportError.message);
        }
        
        // 5. Cleanup & Redirect
        localStorage.removeItem('chasedSports_onboarding');
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during account creation.');
      setIsSubmitting(false);
    }
  };

  if (loading || !onboardingData) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <Activity className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#020617] font-sans selection:bg-blue-500/30 overflow-x-hidden relative flex flex-col justify-center py-12 px-4 sm:px-6 custom-scrollbar">
      
      {/* Parallax Background */}
      <div className="fixed inset-0 pointer-events-none opacity-20 z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full mix-blend-screen"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      <div className="w-full max-w-xl mx-auto relative z-10">
        
        {/* Navigation / Branding */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 font-bold text-sm">
            <ChevronLeft className="w-4 h-4" /> Cancel
          </Link>
          <div className="text-xl font-black tracking-tight text-white drop-shadow-md">
            Chased<span className="text-blue-400">Sports</span>
          </div>
        </div>

        {/* Dynamic Stepper */}
        {!successMsg && (
          <div className="flex items-center justify-between mb-8 px-2 relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800 -translate-y-1/2 z-0"></div>
            <div className={`absolute top-1/2 left-0 h-0.5 bg-blue-500 -translate-y-1/2 z-0 transition-all duration-500 ${step === 1 ? 'w-0' : step === 2 ? 'w-1/2' : 'w-full'}`}></div>
            
            {[1, 2, 3].map((num) => (
              <div key={num} className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all duration-300 ${step >= num ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                {step > num ? <CheckCircle2 className="w-4 h-4" /> : num}
              </div>
            ))}
          </div>
        )}

        {/* Main Glassmorphic Container */}
        <div className="bg-[#0a0f1e]/90 backdrop-blur-2xl border border-slate-700/60 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.6)] p-6 sm:p-10 transition-all duration-500">
          
          {error && (
            <div className="mb-6 flex items-center gap-2 text-rose-400 text-sm font-bold bg-rose-500/10 py-3 px-4 rounded-xl border border-rose-500/20 shadow-sm animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {successMsg ? (
            <div className="animate-in slide-in-from-bottom-8 fade-in duration-500 flex flex-col items-center text-center py-6">
              <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Mail className="w-10 h-10 text-emerald-400" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">Check Your Email</h1>
              <p className="text-slate-400 font-medium leading-relaxed max-w-sm mb-8">
                {successMsg}
              </p>
              <Link 
                href="/"
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-xl px-8 py-3 transition-colors border border-slate-700"
              >
                Return to Home
              </Link>
            </div>
          ) : (
            <>
              {/* STEP 1: VALIDATE RECRUIT SCORE */}
              {step === 1 && (
                <div className="animate-in slide-in-from-right-8 fade-in duration-500 flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <Trophy className="w-10 h-10 text-blue-400" />
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">Claim Your Rank</h1>
                  <p className="text-slate-400 font-medium mb-8">
                    Your performance in <span className="text-blue-400 font-bold">{onboardingData.sport}</span> has been analyzed. Claim your profile to see how you match with collegiate programs.
                  </p>
                  
                  <div className="w-full bg-slate-900/80 rounded-2xl border border-slate-700/50 p-6 mb-8 shadow-inner relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] group-hover:bg-emerald-500/20 transition-all duration-500"></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Base Recruit Score</p>
                    <div className="flex items-end justify-center gap-1">
                      <span className="text-6xl font-black text-emerald-400 leading-none">{onboardingData.preCalculatedScore || 50}</span>
                      <span className="text-lg font-bold text-slate-500 pb-1">/99</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => { setError(null); setStep(2); }}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-lg sm:text-xl rounded-2xl py-4 shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_40px_rgba(37,99,235,0.6)] transition-all hover:-translate-y-1 active:scale-[0.98] flex items-center justify-center gap-3"
                  >
                    Continue Setup <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* STEP 2: ATHLETIC DETAILS */}
              {step === 2 && (
                <form onSubmit={handleNext} className="animate-in slide-in-from-right-8 fade-in duration-500">
                  <div className="mb-8">
                    <h2 className="text-2xl font-black text-white tracking-tight mb-2">Athletic Details</h2>
                    <p className="text-slate-400 text-sm font-medium">Verify your identity so coaches can find you on the leaderboards.</p>
                  </div>

                  <div className="space-y-4">
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

                      <div className={`border-2 rounded-xl p-3 transition-colors ${getValidationClass(gradYear, gradYear.length === 4)}`}>
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Graduation Year</label>
                        <input 
                          type="text" inputMode="numeric" maxLength={4}
                          value={gradYear} 
                          onChange={handleGradYearChange} 
                          className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder-slate-500" 
                        />
                      </div>
                    </div>

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

                  </div>

                  <div className="mt-8 flex gap-3">
                    <button 
                      type="button" onClick={() => { setError(null); setStep(1); }}
                      className="px-6 py-4 rounded-xl font-bold text-slate-400 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 transition-all"
                    >
                      Back
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black text-lg rounded-xl py-4 shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      Next Step <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: SECURE VAULT */}
              {step === 3 && (
                <form onSubmit={handleCreateAccount} className="animate-in slide-in-from-right-8 fade-in duration-500">
                  <div className="mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-4">
                      <ShieldCheck className="w-3.5 h-3.5" /> Data Secured
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tight mb-2">Save Your Profile</h2>
                    <p className="text-slate-400 text-sm font-medium">Create an account to lock in your Recruit Score and unlock the Matchmaker database.</p>
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Email Address</label>
                      <div className="relative">
                        <input 
                          type="email" value={email} onChange={e => setEmail(e.target.value)}
                          className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl pl-10 pr-4 py-3.5 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-500"
                          placeholder="athlete@example.com"
                        />
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Secure Password</label>
                      <div className="relative">
                        <input 
                          type="password" value={password} onChange={e => setPassword(e.target.value)}
                          className="w-full bg-slate-800/80 border border-slate-700 focus:border-blue-500 rounded-xl pl-10 pr-4 py-3.5 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-500"
                          placeholder="Min. 6 characters"
                        />
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex gap-3">
                    <button 
                      type="button" onClick={() => { setError(null); setStep(2); }} disabled={isSubmitting}
                      className="px-6 py-4 rounded-xl font-bold text-slate-400 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 transition-all disabled:opacity-50"
                    >
                      Back
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-lg rounded-xl py-4 shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0 disabled:active:scale-100 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <Activity className="w-5 h-5 animate-spin" />
                      ) : (
                        <>Unlock Platform <Zap className="w-5 h-5" /></>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

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