'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Send, Copy, CheckCircle2, ChevronLeft, Mail, School, 
  Search, PenTool, CheckSquare, Square, Clock, ArrowUpRight, Trophy
} from 'lucide-react';

interface SavedCollege {
  id: string;
  universities: {
    id: string;
    name: string;
    division: string;
  };
}

interface PR {
  event: string;
  mark: string;
}

const TEMPLATES = [
  {
    id: 'general_intro',
    name: 'General Introduction',
    subject: 'Recruit Prospect: {{FIRST_NAME}} {{LAST_NAME}} - Class of {{GRAD_YEAR}}',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}} and I am a class of {{GRAD_YEAR}} {{SPORT}} athlete at {{HIGH_SCHOOL}}. I am reaching out because {{COLLEGE_NAME}} is one of my top target schools.\n\n{{WHY_THIS_SCHOOL}}\n\nCurrently, my top marks are:\n{{SELECTED_PRS}}\n\nI am carrying a {{GPA}} GPA and plan to pursue a degree in {{MAJOR}}. I take my academics just as seriously as my training.\n\nI have linked my official Athletic.net profile below for you to review my full race history and progression. {{UPCOMING_MEET}}\n\nI would love to learn more about your recruiting standards and see if I might be a good fit for the team.\n\nThank you for your time,\n\n{{FIRST_NAME}} {{LAST_NAME}}\n{{HIGH_SCHOOL}} | Class of {{GRAD_YEAR}}\nAthletic.net: {{ATHLETIC_NET_LINK}}`
  },
  {
    id: 'off_season',
    name: 'Off-Season Intro',
    subject: 'Off-Season Intro: {{FIRST_NAME}} {{LAST_NAME}} - Class of {{GRAD_YEAR}} {{SPORT}}',
    body: `Coach,\n\nMy name is {{FIRST_NAME}} {{LAST_NAME}}, a class of {{GRAD_YEAR}} prospect from {{HIGH_SCHOOL}}. As I head into my off-season training for {{SPORT}}, I am looking closely at programs that fit my academic and athletic goals. \n\n{{WHY_THIS_SCHOOL}}\n\nHeading into next season, my current personal bests are:\n{{SELECTED_PRS}}\n\nI currently maintain a {{GPA}} GPA and am interested in studying {{MAJOR}}. \n\nYou can view my complete official race history on my Athletic.net profile below. {{UPCOMING_MEET}}\n\nI would appreciate any feedback you might have on my times and would love to know what you look for in a recruit.\n\nThank you,\n\n{{FIRST_NAME}} {{LAST_NAME}}\n{{HIGH_SCHOOL}} | Class of {{GRAD_YEAR}}\nAthletic.net: {{ATHLETIC_NET_LINK}}`
  },
  {
    id: 'in_season',
    name: 'In-Season Update',
    subject: 'Season Update & New Marks: {{FIRST_NAME}} {{LAST_NAME}} (Class of {{GRAD_YEAR}})',
    body: `Coach,\n\nI wanted to reach out and provide a quick update on my current {{SPORT}} season at {{HIGH_SCHOOL}}.\n\nI recently competed and hit new marks, including:\n{{SELECTED_PRS}}\n\n{{WHY_THIS_SCHOOL}}\n\nI am maintaining a {{GPA}} GPA and am focused on continuing to drop my times as we approach the postseason. My updated stats are officially recorded on my Athletic.net profile here:\n{{ATHLETIC_NET_LINK}}\n\n{{UPCOMING_MEET}}\n\nI remain very interested in {{COLLEGE_NAME}} and would love the opportunity to connect with you to discuss your program.\n\nBest regards,\n\n{{FIRST_NAME}} {{LAST_NAME}}\n{{HIGH_SCHOOL}} | Class of {{GRAD_YEAR}}`
  },
  {
    id: 'end_season',
    name: 'End of Season Recap',
    subject: 'End of Season Update: {{FIRST_NAME}} {{LAST_NAME}} - Class of {{GRAD_YEAR}}',
    body: `Coach,\n\nWith my high school {{SPORT}} season officially coming to a close, I wanted to reach out to the coaching staff at {{COLLEGE_NAME}}. \n\n{{WHY_THIS_SCHOOL}}\n\nI am very proud of the progress I made this year. I finished the season with the following top marks:\n{{SELECTED_PRS}}\n\nAlongside my athletic progress, I maintained a {{GPA}} GPA. \n\nI have linked my Athletic.net profile below for my complete season overview. I plan to keep working hard in the off-season to hit your program's standards.\n\nThank you,\n\n{{FIRST_NAME}} {{LAST_NAME}}\n{{HIGH_SCHOOL}} | Class of {{GRAD_YEAR}}\nAthletic.net: {{ATHLETIC_NET_LINK}}`
  }
];

export default function EmailBuilder() {
  const supabase = createClient();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [athlete, setAthlete] = useState<any>(null);
  const [savedColleges, setSavedColleges] = useState<SavedCollege[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form States
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedSport, setSelectedSport] = useState('Track & Field');
  const [selectedTemplate, setSelectedTemplate] = useState('general_intro');
  const [customReason, setCustomReason] = useState('');
  const [upcomingMeet, setUpcomingMeet] = useState('');
  const [selectedPRs, setSelectedPRs] = useState<PR[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  
  // UI Focus State for Live Highlighting
  const [activeField, setActiveField] = useState<'college' | 'sport' | 'reason' | 'meet' | 'prs' | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ==========================================
  // STATE HYDRATION (SESSION STORAGE)
  // ==========================================
  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      // 1. Load string states from Session Storage to persist through navigation
      if (typeof window !== 'undefined') {
        const sr = sessionStorage.getItem('eb_reason');
        if (sr) setCustomReason(sr);

        const sm = sessionStorage.getItem('eb_meet');
        if (sm) setUpcomingMeet(sm);

        const st = sessionStorage.getItem('eb_template');
        if (st) setSelectedTemplate(st);
        
        const ss = sessionStorage.getItem('eb_sport');
        if (ss) setSelectedSport(ss);
      }

      // 2. Fetch Athlete Data
      const { data: athleteData } = await supabase.from('athletes').select('*').eq('id', session.user.id).single();
      if (athleteData) {
        setAthlete(athleteData);
        
        // Hydrate Sport if none in session storage but exists in DB
        if (typeof window !== 'undefined' && !sessionStorage.getItem('eb_sport') && athleteData.sports?.length > 0) {
          setSelectedSport(athleteData.sports[0]);
        }
        
        // 3. Hydrate PRs from session storage OR default to top 2
        if (typeof window !== 'undefined') {
          const savedPRsStr = sessionStorage.getItem('eb_prs');
          if (savedPRsStr) {
            try { setSelectedPRs(JSON.parse(savedPRsStr)); } catch (e) {}
          } else if (athleteData.prs && athleteData.prs.length > 0) {
            setSelectedPRs(athleteData.prs.slice(0, 2));
          }
        }
      }

      // 4. Fetch Colleges & Hydrate Selection
      const { data: collegesData } = await supabase
        .from('saved_colleges')
        .select(`id, universities (id, name, division)`)
        .eq('athlete_id', session.user.id);
        
      if (collegesData) {
        const castedColleges = collegesData as any;
        setSavedColleges(castedColleges);
        
        if (typeof window !== 'undefined') {
          const sc = sessionStorage.getItem('eb_college');
          if (sc && castedColleges.some((c: any) => c.universities.name === sc)) {
            setSelectedCollege(sc);
          } else if (castedColleges.length > 0) {
            setSelectedCollege(castedColleges[0].universities.name);
          }
        }
      }
      setLoading(false);
    }
    loadData();
  }, [supabase, router]);

  // Save states automatically as they change
  useEffect(() => { if (typeof window !== 'undefined') sessionStorage.setItem('eb_reason', customReason); }, [customReason]);
  useEffect(() => { if (typeof window !== 'undefined') sessionStorage.setItem('eb_meet', upcomingMeet); }, [upcomingMeet]);
  useEffect(() => { if (typeof window !== 'undefined') sessionStorage.setItem('eb_template', selectedTemplate); }, [selectedTemplate]);
  useEffect(() => { if (typeof window !== 'undefined') sessionStorage.setItem('eb_college', selectedCollege); }, [selectedCollege]);
  useEffect(() => { if (typeof window !== 'undefined') sessionStorage.setItem('eb_sport', selectedSport); }, [selectedSport]);
  useEffect(() => { if (typeof window !== 'undefined') sessionStorage.setItem('eb_prs', JSON.stringify(selectedPRs)); }, [selectedPRs]);

  const currentTemplate = TEMPLATES.find(t => t.id === selectedTemplate) || TEMPLATES[0];

  let gpa = '[Your GPA]'; 
  let major = '[Intended Major]';
  if (athlete?.saved_resume) {
    try { 
      const parsed = JSON.parse(athlete.saved_resume);
      if (parsed.gpa) gpa = parsed.gpa;
      if (parsed.intendedMajor) major = parsed.intendedMajor;
    } catch (e) {}
  }

  const athleticNetLink = (!athlete?.athletic_net_url || athlete.athletic_net_url === 'skipped') 
    ? '[Insert Your Athletic.net Link Here]' 
    : athlete.athletic_net_url;

  const defaultReason = `Your program's recent success and the academic opportunities at ${selectedCollege || 'your university'} really stand out to me.`;

  const availableSports = Array.from(new Set([...(athlete?.sports || []), 'Track & Field', 'Cross Country']));

  const handleTogglePR = (pr: PR) => {
    const exists = selectedPRs.some(p => p.event === pr.event);
    if (exists) {
      setSelectedPRs(selectedPRs.filter(p => p.event !== pr.event));
    } else {
      setSelectedPRs([...selectedPRs, pr]);
    }
  };

  // RAW STRINGS for the Clipboard
  const generateRawEmail = (text: string) => {
    if (!athlete) return '';
    const prBulletList = selectedPRs.length > 0 
      ? selectedPRs.map(pr => `  • ${pr.event}: ${pr.mark}`).join('\n')
      : `  • [Select PRs to include]`;

    return text
      .replace(/{{FIRST_NAME}}/g, athlete.first_name || '')
      .replace(/{{LAST_NAME}}/g, athlete.last_name || '')
      .replace(/{{GRAD_YEAR}}/g, athlete.grad_year || '')
      .replace(/{{HIGH_SCHOOL}}/g, athlete.high_school || '')
      .replace(/{{COLLEGE_NAME}}/g, selectedCollege || '[College Name]')
      .replace(/{{SPORT}}/g, selectedSport)
      .replace(/{{WHY_THIS_SCHOOL}}/g, customReason.trim() ? customReason : defaultReason)
      .replace(/{{SELECTED_PRS}}/g, prBulletList)
      .replace(/{{GPA}}/g, gpa)
      .replace(/{{MAJOR}}/g, major)
      .replace(/{{UPCOMING_MEET}}/g, upcomingMeet.trim() ? `I will be competing next at ${upcomingMeet}, and I would love it if you or an assistant coach could follow my results.` : '')
      .replace(/{{ATHLETIC_NET_LINK}}/g, athleticNetLink);
  };

  // LIVE HIGHLIGHTED JSX for the UI
  const renderHighlightedEmail = (text: string) => {
    if (!athlete) return <span/>;
    
    // Split the text by exactly the tokens we want to match
    const parts = text.split(/(\{\{[A-Z_]+\}\})/g);
    
    return parts.map((part, index) => {
      let replacement = part;
      let isHighlighted = false;

      if (part === '{{FIRST_NAME}}') replacement = athlete.first_name || '[First Name]';
      else if (part === '{{LAST_NAME}}') replacement = athlete.last_name || '[Last Name]';
      else if (part === '{{GRAD_YEAR}}') replacement = athlete.grad_year || '[Year]';
      else if (part === '{{HIGH_SCHOOL}}') replacement = athlete.high_school || '[High School]';
      else if (part === '{{GPA}}') replacement = gpa;
      else if (part === '{{MAJOR}}') replacement = major;
      else if (part === '{{ATHLETIC_NET_LINK}}') replacement = athleticNetLink;
      
      else if (part === '{{COLLEGE_NAME}}') {
        replacement = selectedCollege || '[College Name]';
        isHighlighted = activeField === 'college';
      }
      else if (part === '{{SPORT}}') {
        replacement = selectedSport;
        isHighlighted = activeField === 'sport';
      }
      else if (part === '{{WHY_THIS_SCHOOL}}') {
        replacement = customReason.trim() ? customReason : defaultReason;
        isHighlighted = activeField === 'reason';
      }
      else if (part === '{{SELECTED_PRS}}') {
        replacement = selectedPRs.length > 0 
          ? selectedPRs.map(pr => `  • ${pr.event}: ${pr.mark}`).join('\n') 
          : `  • [Select PRs to include]`;
        isHighlighted = activeField === 'prs';
      }
      else if (part === '{{UPCOMING_MEET}}') {
        replacement = upcomingMeet.trim() 
          ? `I will be competing next at ${upcomingMeet}, and I would love it if you or an assistant coach could follow my results.` 
          : '';
        isHighlighted = activeField === 'meet';
      }

      if (isHighlighted) {
        return (
          <span 
            key={index} 
            className="bg-blue-400/20 text-blue-700 font-bold px-1.5 py-0.5 rounded-md shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300"
          >
            {replacement}
          </span>
        );
      }
      return <span key={index}>{replacement}</span>;
    });
  };

  const emailSubjectRaw = generateRawEmail(currentTemplate.subject);
  const emailBodyRaw = generateRawEmail(currentTemplate.body);
  
  // Formatting standard mailto link
  const mailtoLink = `mailto:?subject=${encodeURIComponent(emailSubjectRaw)}&body=${encodeURIComponent(emailBodyRaw)}`;

  // Formatting Google search dynamically based on college & athlete gender
  const searchGender = athlete?.gender ? `${athlete.gender.toLowerCase()}'s ` : '';
  const searchQuery = `${selectedCollege || 'University'} ${searchGender}${selectedSport} coach directory`;
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`${emailSubjectRaw}\n\n${emailBodyRaw}`);
    setIsCopied(true);
    showToast("Email copied to clipboard!", "success");
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (loading) return null;

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans pb-32">
      
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-5 fade-in duration-300">
          <div className="rounded-full px-6 py-3 shadow-2xl flex items-center gap-3 font-bold text-sm border bg-slate-900 text-white border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {toast.message}
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-slate-900 pt-12 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <Link href="/dashboard" className="inline-flex items-center text-sm font-bold text-slate-400 hover:text-white transition-colors mb-6">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-500/20 border border-blue-500/30 rounded-xl flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Recruiting Email Studio</h1>
          </div>
          <p className="text-slate-400 font-medium max-w-xl">Generate highly personalized, human-sounding emails to college coaches. We format your PRs and link your official profile automatically.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 -mt-12 relative z-20">
        
        {/* MOTIVATIONAL CALL TO ACTION */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-1 mb-8 shadow-xl">
           <div className="bg-slate-900 rounded-xl p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-500/20 blur-3xl rounded-full pointer-events-none"></div>
              
              <div className="flex items-start gap-4">
                 <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center shrink-0 border border-amber-500/30">
                    <Clock className="w-6 h-6 text-amber-400" />
                 </div>
                 <div>
                    <h3 className="text-lg font-black text-white mb-1">Strike while the iron is hot.</h3>
                    <p className="text-slate-300 text-sm font-medium">
                       With district and state finals fresh in their minds, college coaches are actively building their watchlists for the next recruiting class. Reaching out right now puts you directly on their radar.
                    </p>
                 </div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: INPUTS (40%) */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-white/80 backdrop-blur-3xl rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 relative overflow-hidden transition-all">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                <PenTool className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-black text-slate-900">Email Parameters</h2>
              </div>

              <div className="space-y-5">
                {/* Target College */}
                <div>
                  <div className="flex items-end justify-between mb-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Target Program</label>
                    <Link href="/search" className="text-[10px] font-bold text-blue-600 hover:text-blue-500 flex items-center gap-1">
                      Find more colleges <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                  
                  {savedColleges.length > 0 ? (
                    <div className="relative">
                      <select 
                        value={selectedCollege}
                        onChange={(e) => setSelectedCollege(e.target.value)}
                        onFocus={() => setActiveField('college')}
                        onBlur={() => setActiveField(null)}
                        className={`w-full appearance-none border rounded-xl px-4 py-3.5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${activeField === 'college' ? 'bg-white border-blue-300' : 'bg-slate-50 border-slate-200'}`}
                      >
                        <option value="" disabled>Select a saved college...</option>
                        {savedColleges.map(c => (
                          <option key={c.id} value={c.universities.name}>{c.universities.name} ({c.universities.division})</option>
                        ))}
                      </select>
                      <School className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 text-slate-600 p-6 rounded-xl text-center flex flex-col items-center gap-3">
                      <Search className="w-8 h-8 text-blue-500" />
                      <div>
                        <p className="text-sm font-bold text-slate-900">No Target Colleges Saved</p>
                        <p className="text-xs font-medium mt-1">To use the Email Builder, you must save colleges from the College Finder to automatically link them to your emails.</p>
                      </div>
                      <Link href="/search" className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2 rounded-lg text-sm transition-colors mt-2">
                        Go to College Finder
                      </Link>
                    </div>
                  )}
                </div>

                {/* Target Sport */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2 pl-1">Target Sport</label>
                  <div className="relative">
                    <select 
                      value={selectedSport}
                      onChange={(e) => setSelectedSport(e.target.value)}
                      onFocus={() => setActiveField('sport')}
                      onBlur={() => setActiveField(null)}
                      className={`w-full appearance-none border rounded-xl px-4 py-3.5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${activeField === 'sport' ? 'bg-white border-blue-300' : 'bg-slate-50 border-slate-200'}`}
                    >
                      {availableSports.map((sport, index) => (
                        <option key={index} value={sport}>{sport}</option>
                      ))}
                    </select>
                    <Trophy className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Template Selection */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2 pl-1">Email Strategy</label>
                  <div className="grid grid-cols-2 gap-2">
                    {TEMPLATES.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTemplate(t.id)}
                        className={`p-3 rounded-xl text-xs font-black border transition-all text-center ${selectedTemplate === t.id ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'}`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selective PR Picker */}
                <div 
                  onMouseEnter={() => setActiveField('prs')} 
                  onMouseLeave={() => setActiveField(null)}
                  className="transition-all"
                >
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2 pl-1">Select PRs to Include</label>
                   <div className={`bg-slate-50 border rounded-xl p-2 space-y-1 transition-colors ${activeField === 'prs' ? 'border-blue-300 ring-2 ring-blue-500/10' : 'border-slate-200'}`}>
                     {athlete?.prs && athlete.prs.length > 0 ? (
                       athlete.prs.map((pr: any, i: number) => {
                         const isSelected = selectedPRs.some(p => p.event === pr.event);
                         return (
                           <button 
                             key={i} 
                             onClick={() => handleTogglePR(pr)}
                             className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${isSelected ? 'bg-white border-blue-200 shadow-sm' : 'bg-transparent border-transparent hover:bg-slate-100'}`}
                           >
                             <span className={`font-bold text-sm ${isSelected ? 'text-blue-700' : 'text-slate-600'}`}>{pr.event} <span className="text-slate-400 ml-1">({pr.mark})</span></span>
                             {isSelected ? <CheckSquare className="w-4 h-4 text-blue-500" /> : <Square className="w-4 h-4 text-slate-300" />}
                           </button>
                         )
                       })
                     ) : (
                       <p className="text-xs text-slate-500 font-medium italic p-2">No PRs saved to your profile yet.</p>
                     )}
                   </div>
                </div>

                {/* Custom Context */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2 pl-1">Why this school? (Optional)</label>
                  <textarea 
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    onFocus={() => setActiveField('reason')}
                    onBlur={() => setActiveField(null)}
                    placeholder="e.g., I watched your team win the conference championship and love the culture you've built."
                    className={`w-full border rounded-xl px-4 py-3 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none h-24 transition-colors ${activeField === 'reason' ? 'bg-white border-blue-300' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2 pl-1">Upcoming Event (Optional)</label>
                  <input 
                    type="text"
                    value={upcomingMeet}
                    onChange={(e) => setUpcomingMeet(e.target.value)}
                    onFocus={() => setActiveField('meet')}
                    onBlur={() => setActiveField(null)}
                    placeholder="e.g., the State Championships next Friday"
                    className={`w-full border rounded-xl px-4 py-3 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors ${activeField === 'meet' ? 'bg-white border-blue-300' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>

              </div>
            </div>
          </div>

          {/* RIGHT: LIVE PREVIEW (60%) */}
          <div className="lg:col-span-7">
            <div className="bg-white/60 backdrop-blur-2xl rounded-[2rem] p-2 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] border border-white/60 sticky top-28 transition-all duration-300">
              
              {/* Fake Email Client Header */}
              <div className="bg-slate-100/50 rounded-[1.5rem] p-4 sm:p-6 mb-2 border border-slate-200/50">
                <div className="flex items-center gap-3 mb-4 text-slate-400 pb-4 border-b border-slate-200/50">
                  <span className="text-xs font-bold w-12">To:</span>
                  <span className={`bg-white px-3 py-1 rounded-full text-xs font-bold border transition-all duration-300 ${activeField === 'college' ? 'border-blue-400 text-blue-700 shadow-[0_0_10px_rgba(59,130,246,0.2)] scale-105' : 'text-slate-600 border-slate-200'}`}>
                    Coach @ {selectedCollege || 'Target School'}
                  </span>
                </div>
                <div className="flex items-center gap-3 mb-4 text-slate-400 pb-4 border-b border-slate-200/50">
                  <span className="text-xs font-bold w-12">Sport:</span>
                  <span className={`bg-white px-3 py-1 rounded-full text-xs font-bold border transition-all duration-300 ${activeField === 'sport' ? 'border-blue-400 text-blue-700 shadow-[0_0_10px_rgba(59,130,246,0.2)] scale-105' : 'text-slate-600 border-slate-200'}`}>
                    {selectedSport}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold w-12 text-slate-400">Subject:</span>
                  <span className="text-sm font-black text-slate-900">
                    {renderHighlightedEmail(currentTemplate.subject)}
                  </span>
                </div>
              </div>

              {/* Email Body */}
              <div className="bg-white rounded-[1.5rem] p-6 sm:p-8 min-h-[400px] border border-slate-100 shadow-sm relative">
                <div className="whitespace-pre-wrap text-slate-700 font-medium leading-relaxed text-[15px]">
                  {renderHighlightedEmail(currentTemplate.body)}
                </div>
              </div>

              {/* Responsive Actions: 3 columns on sm screens, stacked on mobile */}
              <div className="flex flex-col sm:flex-row gap-3 mt-4 p-2">
                <a 
                  href={searchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black py-4 px-2 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] text-sm text-center"
                >
                  <Search className="w-5 h-5 shrink-0" /> Find Coach Email
                </a>
                
                <button 
                  onClick={handleCopy}
                  className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-black py-4 px-2 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] text-sm text-center"
                >
                  {isCopied ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> : <Copy className="w-5 h-5 shrink-0" />}
                  {isCopied ? 'Copied!' : 'Copy'}
                </button>
                
                {/* Standard anchor tag replacing window.location for much cleaner mailto handling */}
                <a 
                  href={mailtoLink}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-4 px-2 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] text-sm text-center"
                >
                  <Send className="w-5 h-5 shrink-0" /> Open Mail
                </a>
              </div>

            </div>
          </div>

        </div>
      </div>
    </main>
  );
}