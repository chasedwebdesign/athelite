'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Send, Copy, CheckCircle2, ChevronLeft, Mail, School, 
  Search, PenTool, CheckSquare, Square, ArrowUpRight, Trophy, 
  Lock, Crown, Activity, Edit3, Wand2, Video, VideoOff, Type, X, RefreshCcw
} from 'lucide-react';
import { getTemplatesForSport, EmailTemplate } from '@/utils/email-templates';

interface SavedCollege {
  id: string;
  universities: {
    id: string;
    name: string;
    division: string;
  };
}

interface Metric {
  name: string;
  value: string;
}

interface AthleteSportContext {
  id: string;
  sport_name: string;
  position: string | null;
  level_of_play: string | null;
  metrics: Metric[];
  is_active: boolean;
}

export default function EmailBuilder() {
  const supabase = createClient();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [athlete, setAthlete] = useState<any>(null);
  const [athleteSports, setAthleteSports] = useState<AthleteSportContext[]>([]);
  const [savedColleges, setSavedColleges] = useState<SavedCollege[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Auto-Generator Form States
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  const [localPosition, setLocalPosition] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [upcomingMeet, setUpcomingMeet] = useState('');
  const [selectedMetrics, setSelectedMetrics] = useState<Metric[]>([]);
  const [includeVideo, setIncludeVideo] = useState(true);
  
  // Local Overrides for Inline Blank Filling
  const [localGpa, setLocalGpa] = useState('');
  const [localMajor, setLocalMajor] = useState('');
  const [localVideo, setLocalVideo] = useState('');
  const [localAthleticNet, setLocalAthleticNet] = useState('');

  // Editor Modes
  const [activeField, setActiveField] = useState<'college' | 'sport' | 'position' | 'reason' | 'meet' | 'metrics' | null>(null);
  const [highlightBlanks, setHighlightBlanks] = useState(false);
  const [isManualEdit, setIsManualEdit] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualSubject, setManualSubject] = useState('');
  const [manualBody, setManualBody] = useState('');
  
  // Copy States
  const [isCopiedBody, setIsCopiedBody] = useState(false);
  const [isCopiedSubject, setIsCopiedSubject] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const currentSportContext = athleteSports.find(s => s.sport_name.toLowerCase() === selectedSport.toLowerCase());

  const availableTemplates = getTemplatesForSport(selectedSport || 'Track & Field');
  const currentTemplate = availableTemplates.find(t => t.id === selectedTemplateId) || availableTemplates[0];

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      if (typeof window !== 'undefined') {
        const sr = sessionStorage.getItem('eb_reason');
        if (sr) setCustomReason(sr);
        const sm = sessionStorage.getItem('eb_meet');
        if (sm) setUpcomingMeet(sm);
        const st = sessionStorage.getItem('eb_template');
        if (st) setSelectedTemplateId(st);
        const iv = sessionStorage.getItem('eb_video');
        if (iv !== null) setIncludeVideo(iv === 'true');
      }

      const { data: athleteData, error: athleteError } = await supabase
        .from('athletes')
        .select(`*, athlete_sports (id, sport_name, position, level_of_play, metrics, is_active)`)
        .eq('id', session.user.id)
        .single();

      if (athleteData && !athleteError) {
        setAthlete(athleteData);
        
        let parsedResume: any = {};
        try { if (athleteData.saved_resume) parsedResume = JSON.parse(athleteData.saved_resume); } catch (e) {}
        setLocalGpa(parsedResume.gpa || '');
        setLocalMajor(parsedResume.intendedMajor || '');
        setLocalVideo(athleteData.highlight_video_url || '');
        setLocalAthleticNet(athleteData.athletic_net_url && athleteData.athletic_net_url !== 'skipped' ? athleteData.athletic_net_url : '');
        
        const activeSports: AthleteSportContext[] = (athleteData.athlete_sports || [])
          .filter((sport: any) => sport.is_active === true)
          .map((sport: any) => ({ ...sport, metrics: Array.isArray(sport.metrics) ? sport.metrics : [] }));
          
        setAthleteSports(activeSports);
        
        let initialSport = '';
        if (typeof window !== 'undefined') {
          const ss = sessionStorage.getItem('eb_sport');
          if (ss && activeSports.some(s => s.sport_name === ss)) initialSport = ss;
          else if (activeSports.length > 0) initialSport = activeSports[0].sport_name;
        }
        setSelectedSport(initialSport);

        const initialContext = activeSports.find(s => s.sport_name === initialSport);
        if (typeof window !== 'undefined') {
          const savedPos = sessionStorage.getItem('eb_position');
          if (savedPos !== null) {
            setLocalPosition(savedPos);
          } else {
            setLocalPosition(initialContext?.position || '');
          }
        } else {
          setLocalPosition(initialContext?.position || '');
        }
        
        if (typeof window !== 'undefined') {
          const savedMetricsStr = sessionStorage.getItem('eb_metrics');
          if (savedMetricsStr) {
            try { setSelectedMetrics(JSON.parse(savedMetricsStr)); } catch (e) {}
          } else {
            if (initialContext && initialContext.metrics.length > 0) {
              setSelectedMetrics(initialContext.metrics.slice(0, 2));
            } else if (athleteData.prs && Array.isArray(athleteData.prs) && athleteData.prs.length > 0) {
              setSelectedMetrics(athleteData.prs.slice(0, 2).map((pr: any) => ({ name: pr.event, value: pr.mark })));
            }
          }
        }
      }

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

  useEffect(() => { if (typeof window !== 'undefined') sessionStorage.setItem('eb_reason', customReason); }, [customReason]);
  useEffect(() => { if (typeof window !== 'undefined') sessionStorage.setItem('eb_meet', upcomingMeet); }, [upcomingMeet]);
  useEffect(() => { if (typeof window !== 'undefined') sessionStorage.setItem('eb_template', selectedTemplateId); }, [selectedTemplateId]);
  useEffect(() => { if (typeof window !== 'undefined') sessionStorage.setItem('eb_college', selectedCollege); }, [selectedCollege]);
  useEffect(() => { if (typeof window !== 'undefined') sessionStorage.setItem('eb_sport', selectedSport); }, [selectedSport]);
  useEffect(() => { if (typeof window !== 'undefined') sessionStorage.setItem('eb_position', localPosition); }, [localPosition]);
  useEffect(() => { if (typeof window !== 'undefined') sessionStorage.setItem('eb_metrics', JSON.stringify(selectedMetrics)); }, [selectedMetrics]);
  useEffect(() => { if (typeof window !== 'undefined') sessionStorage.setItem('eb_video', includeVideo.toString()); }, [includeVideo]);

  const availableSportsList = athleteSports.map(s => s.sport_name);
  let availableMetricsToSelect: Metric[] = currentSportContext?.metrics || [];
  
  const isTrack = selectedSport.toLowerCase().includes('track') || selectedSport.toLowerCase().includes('cross country') || selectedSport.toLowerCase().includes('xc');
  if (isTrack && availableMetricsToSelect.length === 0 && athlete?.prs && Array.isArray(athlete.prs)) {
    availableMetricsToSelect = athlete.prs.map((pr: any) => ({ name: pr.event, value: pr.mark }));
  }

  const handleToggleMetric = (metric: Metric) => {
    const exists = selectedMetrics.some(m => m.name === metric.name);
    if (exists) setSelectedMetrics(selectedMetrics.filter(m => m.name !== metric.name));
    else setSelectedMetrics([...selectedMetrics, metric]);
  };

  const handleSportChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSport = e.target.value;
    setSelectedSport(newSport);
    setSelectedTemplateId('');
    const newSportContext = athleteSports.find(s => s.sport_name === newSport);
    
    // Auto-update the position field to the new sport's default position
    setLocalPosition(newSportContext?.position || '');
    
    if (newSportContext && newSportContext.metrics.length > 0) setSelectedMetrics(newSportContext.metrics.slice(0, 2));
    else setSelectedMetrics([]);
  };

  const handleTemplateSelect = (t: EmailTemplate) => {
    if (t.isPremium && !athlete?.is_premium) {
      showToast("This template requires ChasedSports Premium.", "error");
      return;
    }
    setSelectedTemplateId(t.id);
  };

  const toggleManualEditModal = () => {
    if (!isManualEdit) {
      setManualSubject(generateRawEmail(currentTemplate?.subject || ''));
      setManualBody(generateRawEmail(currentTemplate?.body || ''));
      setIsManualEdit(true);
      setHighlightBlanks(false);
    }
    setShowManualModal(true);
  };

  const revertToAutoGenerated = () => {
    setIsManualEdit(false);
    setManualSubject('');
    setManualBody('');
    showToast("Reverted to auto-generated email", "success");
  };

  const generateRawEmail = (text: string) => {
    if (!athlete || !text) return '';
    const metricBulletList = selectedMetrics.length > 0 
      ? selectedMetrics.map(m => `  • ${m.name}: ${m.value}`).join('\n')
      : `  • [Select Metrics to include]`;

    let processedText = text;
    if (!includeVideo) {
      processedText = processedText.replace(/.*\n.*\{\{HIGHLIGHT_VIDEO_LINK\}\}.*\n?/g, '');
      processedText = processedText.replace(/.*\{\{HIGHLIGHT_VIDEO_LINK\}\}.*\n?/g, ''); 
    }

    return processedText
      .replace(/{{FIRST_NAME}}/g, athlete.first_name || '')
      .replace(/{{LAST_NAME}}/g, athlete.last_name || '')
      .replace(/{{GRAD_YEAR}}/g, athlete.grad_year || '')
      .replace(/{{HIGH_SCHOOL}}/g, athlete.high_school || '')
      .replace(/{{COLLEGE_NAME}}/g, selectedCollege || '[College Name]')
      .replace(/{{SPORT}}/g, selectedSport)
      .replace(/{{POSITION}}/g, localPosition || '[Your Position]')
      .replace(/{{WHY_THIS_SCHOOL}}/g, customReason.trim() ? customReason : `Your program's recent success and the academic opportunities at ${selectedCollege || 'your university'} really stand out to me.`)
      .replace(/{{SELECTED_PRS}}/g, metricBulletList)
      .replace(/{{GPA}}/g, localGpa || '[Your GPA]')
      .replace(/{{MAJOR}}/g, localMajor || '[Intended Major]')
      .replace(/{{HIGHLIGHT_VIDEO_LINK}}/g, localVideo || '[Insert Link]')
      .replace(/{{UPCOMING_MEET}}/g, upcomingMeet.trim() ? `I will be competing next at ${upcomingMeet}, and I would love it if you or an assistant coach could follow my results.` : '')
      .replace(/{{ATHLETIC_NET_LINK}}/g, localAthleticNet || '[Insert Athletic.net Link]')
      .replace(/{{PROFILE_LINK}}/g, `https://chasedsports.com/athlete/${athlete.id}`);
  };

  const renderHighlightedEmail = (text: string) => {
    if (!athlete || !text) return null;
    let processedText = text;
    if (!includeVideo) {
      processedText = processedText.replace(/.*\n.*\{\{HIGHLIGHT_VIDEO_LINK\}\}.*\n?/g, '');
      processedText = processedText.replace(/.*\{\{HIGHLIGHT_VIDEO_LINK\}\}.*\n?/g, ''); 
    }
    const parts = processedText.split(/(\{\{[A-Z_]+\}\})/g);
    
    return parts.map((part, index) => {
      let replacement: React.ReactNode = part;
      let isHighlighted = false;

      if (part === '{{FIRST_NAME}}') replacement = athlete.first_name || '[First Name]';
      else if (part === '{{LAST_NAME}}') replacement = athlete.last_name || '[Last Name]';
      else if (part === '{{GRAD_YEAR}}') replacement = athlete.grad_year || '[Year]';
      else if (part === '{{HIGH_SCHOOL}}') replacement = athlete.high_school || '[High School]';
      else if (part === '{{PROFILE_LINK}}') replacement = `chasedsports.com/athlete/${athlete.id}`;
      else if (part === '{{GPA}}') {
        if (highlightBlanks && !localGpa) return <input key={index} value={localGpa} onChange={(e) => setLocalGpa(e.target.value)} placeholder="GPA" className="bg-amber-400/20 text-amber-700 placeholder-amber-700/50 font-bold px-2 py-0.5 rounded-md border-b-2 border-amber-500 focus:outline-none focus:bg-amber-400/30 w-16 text-center transition-all" />;
        replacement = localGpa || '[Your GPA]';
        isHighlighted = highlightBlanks && !localGpa;
      }
      else if (part === '{{MAJOR}}') {
        if (highlightBlanks && !localMajor) return <input key={index} value={localMajor} onChange={(e) => setLocalMajor(e.target.value)} placeholder="Major" className="bg-amber-400/20 text-amber-700 placeholder-amber-700/50 font-bold px-2 py-0.5 rounded-md border-b-2 border-amber-500 focus:outline-none focus:bg-amber-400/30 w-32 transition-all" />;
        replacement = localMajor || '[Intended Major]';
        isHighlighted = highlightBlanks && !localMajor;
      }
      else if (part === '{{HIGHLIGHT_VIDEO_LINK}}') {
        if (highlightBlanks && !localVideo) return <input key={index} value={localVideo} onChange={(e) => setLocalVideo(e.target.value)} placeholder="Paste Hudl/YouTube Link" className="bg-amber-400/20 text-amber-700 placeholder-amber-700/50 font-bold px-2 py-0.5 rounded-md border-b-2 border-amber-500 focus:outline-none focus:bg-amber-400/30 w-48 transition-all" />;
        replacement = localVideo || '[Insert Link]';
        isHighlighted = highlightBlanks && !localVideo;
      }
      else if (part === '{{ATHLETIC_NET_LINK}}') {
        if (highlightBlanks && !localAthleticNet) return <input key={index} value={localAthleticNet} onChange={(e) => setLocalAthleticNet(e.target.value)} placeholder="Athletic.net Link" className="bg-amber-400/20 text-amber-700 placeholder-amber-700/50 font-bold px-2 py-0.5 rounded-md border-b-2 border-amber-500 focus:outline-none focus:bg-amber-400/30 w-40 transition-all" />;
        replacement = localAthleticNet || '[Insert Athletic.net Link]';
        isHighlighted = highlightBlanks && !localAthleticNet;
      }
      else if (part === '{{COLLEGE_NAME}}') { replacement = selectedCollege || '[College Name]'; isHighlighted = activeField === 'college'; }
      else if (part === '{{SPORT}}') { replacement = selectedSport; isHighlighted = activeField === 'sport'; }
      else if (part === '{{POSITION}}') { replacement = localPosition || '[Your Position]'; isHighlighted = activeField === 'position'; }
      else if (part === '{{WHY_THIS_SCHOOL}}') { replacement = customReason.trim() ? customReason : `Your program's recent success and the academic opportunities at ${selectedCollege || 'your university'} really stand out to me.`; isHighlighted = activeField === 'reason'; }
      else if (part === '{{SELECTED_PRS}}') { replacement = selectedMetrics.length > 0 ? selectedMetrics.map(m => `  • ${m.name}: ${m.value}`).join('\n') : `  • [Select metrics to include]`; isHighlighted = activeField === 'metrics'; }
      else if (part === '{{UPCOMING_MEET}}') { replacement = upcomingMeet.trim() ? `I will be competing next at ${upcomingMeet}, and I would love it if you or an assistant coach could follow my results.` : ''; isHighlighted = activeField === 'meet'; }

      if (isHighlighted) return <span key={index} className={`font-bold px-1.5 py-0.5 rounded-md transition-all duration-300 ${highlightBlanks ? 'bg-amber-400/20 text-amber-700 shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'bg-blue-400/20 text-blue-700 shadow-[0_0_15px_rgba(59,130,246,0.3)]'}`}>{replacement}</span>;
      return <span key={index}>{replacement}</span>;
    });
  };

  const finalSubject = isManualEdit ? manualSubject : generateRawEmail(currentTemplate?.subject || '');
  const finalBody = isManualEdit ? manualBody : generateRawEmail(currentTemplate?.body || '');

  const convertToRichText = (text: string) => {
    let html = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" style="color: #2563eb; text-decoration: underline;">$1</a>');
    const lines = html.split('\n');
    let inList = false;
    const processedLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isBullet = line.trim().startsWith('•');
      if (isBullet) {
        if (!inList) { processedLines.push('<ul style="margin-top: 8px; margin-bottom: 8px; padding-left: 24px; font-family: sans-serif;">'); inList = true; }
        processedLines.push(`<li style="margin-bottom: 4px;"><strong>${line.replace(/^\s*•\s*/, '')}</strong></li>`);
      } else {
        if (inList) { processedLines.push('</ul>'); inList = false; }
        processedLines.push(line);
      }
    }
    if (inList) processedLines.push('</ul>');
    html = processedLines.join('<br />').replace(/<br \/><ul/g, '<ul').replace(/<\/ul><br \/>/g, '</ul>');

    return `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #1f2937; line-height: 1.6;">${html}</div>`;
  };

  const handleCopyBody = async () => {
    const htmlText = convertToRichText(finalBody);
    const textBlob = new Blob([finalBody], { type: 'text/plain' });
    const htmlBlob = new Blob([htmlText], { type: 'text/html' });
    
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const item = new ClipboardItem({ 'text/plain': textBlob, 'text/html': htmlBlob });
        await navigator.clipboard.write([item]);
      } else {
        await navigator.clipboard.writeText(finalBody); 
      }
      setIsCopiedBody(true);
      showToast("Email body copied with formatting!", "success");
      setTimeout(() => setIsCopiedBody(false), 2000);
    } catch (err) {
      showToast("Failed to copy body to clipboard.", "error");
    }
  };

  const handleCopySubject = async () => {
    try {
      await navigator.clipboard.writeText(finalSubject);
      setIsCopiedSubject(true);
      showToast("Subject line copied!", "success");
      setTimeout(() => setIsCopiedSubject(false), 2000);
    } catch (err) {
      showToast("Failed to copy subject.", "error");
    }
  };

  const mailtoLink = `mailto:?subject=${encodeURIComponent(finalSubject)}&body=${encodeURIComponent(finalBody)}`;
  const searchGender = athlete?.gender ? `${athlete.gender.toLowerCase()}'s ` : '';
  const searchQuery = `${selectedCollege || 'University'} ${searchGender}${selectedSport} coach directory`;
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;

  if (loading) return null;

  return (
    <main className="min-h-screen bg-[#F8FAFC] font-sans pb-32 sm:pb-12">
      
      {/* MANUAL OVERRIDE FULL-SCREEN MODAL */}
      {showManualModal && (
        <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-4xl h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-slate-900" />
                  <h2 className="text-lg font-black text-slate-900">Manual Override Editor</h2>
                </div>
                <button onClick={() => setShowManualModal(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto bg-slate-50">
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shrink-0 shadow-sm">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest w-16">Subject:</span>
                  <input
                    type="text"
                    value={manualSubject}
                    onChange={(e) => setManualSubject(e.target.value)}
                    className="flex-1 bg-transparent text-sm font-bold text-slate-900 focus:outline-none"
                  />
                </div>
                <textarea
                  value={manualBody}
                  onChange={(e) => setManualBody(e.target.value)}
                  className="flex-1 w-full bg-white border border-slate-200 rounded-xl p-5 text-[15px] font-medium text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm custom-scrollbar"
                  placeholder="Start typing your email..."
                />
              </div>
              <div className="p-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <span className="text-xs font-bold text-slate-400 text-center sm:text-left">
                  Editing manually will detach the output from the template parameters.
                </span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setShowManualModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                    Save & Close
                  </button>
                  <button onClick={handleCopyBody} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md transition-all">
                    {isCopiedBody ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {isCopiedBody ? 'Copied!' : 'Copy Email'}
                  </button>
                </div>
              </div>
           </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-5 fade-in duration-300">
          <div className={`rounded-full px-6 py-3 shadow-2xl flex items-center gap-3 font-bold text-sm border ${toast.type === 'error' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-900 text-white border-slate-700'}`}>
            {toast.type === 'error' ? <Lock className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />} 
            {toast.message}
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
            {athlete?.is_premium && (
               <div className="bg-amber-500/20 border border-amber-500/50 text-amber-400 px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase flex items-center gap-1 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <Crown className="w-3 h-3" /> Pro
               </div>
            )}
          </div>
          <p className="text-slate-400 font-medium max-w-xl">Generate highly personalized, human-sounding emails to college coaches tailored exactly to your sport and metrics.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 -mt-12 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: INPUTS (40%) */}
          <div className="lg:col-span-5 space-y-6">
            <div className={`bg-white/80 backdrop-blur-3xl rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border relative overflow-hidden transition-all duration-300 ${isManualEdit ? 'opacity-60 pointer-events-none border-slate-200' : 'border-slate-200/60'}`}>
              <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <PenTool className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-black text-slate-900">Email Parameters</h2>
                </div>
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
                        <p className="text-xs font-medium mt-1">Save colleges from the College Finder to auto-link them here.</p>
                      </div>
                      <Link href="/search" className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2 rounded-lg text-sm transition-colors mt-2">
                        Go to College Finder
                      </Link>
                    </div>
                  )}
                </div>

                {/* Target Sport & Position */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2 pl-1">Sport Context</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    {availableSportsList.length > 0 ? (
                      <div className="relative flex-1">
                        <select 
                          value={selectedSport}
                          onChange={handleSportChange}
                          onFocus={() => setActiveField('sport')}
                          onBlur={() => setActiveField(null)}
                          className={`w-full appearance-none border rounded-xl px-4 py-3.5 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${activeField === 'sport' ? 'bg-white border-blue-300' : 'bg-slate-50 border-slate-200'}`}
                        >
                          <option value="" disabled>Select an active sport...</option>
                          {availableSportsList.map((sport, index) => (
                            <option key={index} value={sport}>{sport}</option>
                          ))}
                        </select>
                        <Trophy className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 text-slate-600 p-4 rounded-xl text-center flex-1">
                        <p className="text-xs font-bold text-slate-900 mb-1">No Active Sports</p>
                        <Link href="/dashboard" className="text-xs text-blue-600 hover:underline">Go to Dashboard to add</Link>
                      </div>
                    )}
                    
                    <div className="relative flex-1">
                      <input 
                        type="text"
                        value={localPosition}
                        onChange={(e) => setLocalPosition(e.target.value)}
                        onFocus={() => setActiveField('position')}
                        onBlur={() => setActiveField(null)}
                        placeholder="Position (e.g. 800m)"
                        className={`w-full border rounded-xl px-4 py-3.5 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${activeField === 'position' ? 'bg-white border-blue-300' : 'bg-slate-50 border-slate-200'}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Template Selection */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2 pl-1">Email Strategy</label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableTemplates.map(t => {
                      const isLocked = t.isPremium && !athlete?.is_premium;
                      const isSelected = currentTemplate?.id === t.id;

                      return (
                        <button
                          key={t.id}
                          onClick={() => handleTemplateSelect(t)}
                          className={`
                            p-3 rounded-xl text-xs font-black border transition-all text-center flex flex-col items-center justify-center gap-1 relative overflow-hidden
                            ${isSelected ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-sm ring-1 ring-blue-400/50' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}
                            ${isLocked ? 'opacity-90' : ''}
                          `}
                        >
                          {isLocked && (
                             <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[1px] flex items-center justify-center z-10">
                                <Lock className="w-4 h-4 text-slate-500/80" />
                             </div>
                          )}
                          <span className={isLocked ? 'text-slate-400 blur-[0.5px]' : ''}>{t.name}</span>
                          {t.isPremium && (
                             <span className={`text-[9px] uppercase tracking-widest ${isSelected ? 'text-amber-500' : 'text-amber-400'} flex items-center gap-1`}>
                               <Crown className="w-3 h-3" /> Premium
                             </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selective Metrics Picker */}
                <div 
                  onMouseEnter={() => setActiveField('metrics')} 
                  onMouseLeave={() => setActiveField(null)}
                  className="transition-all"
                >
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-2 pl-1">
                    <Activity className="w-3 h-3" /> Include Recorded Stats
                  </label>
                  <div className={`bg-slate-50 border rounded-xl p-2 space-y-1 transition-colors ${activeField === 'metrics' ? 'border-blue-300 ring-2 ring-blue-500/10' : 'border-slate-200'}`}>
                    {availableMetricsToSelect.length > 0 ? (
                      availableMetricsToSelect.map((metric: Metric, i: number) => {
                        const isSelected = selectedMetrics.some(m => m.name === metric.name);
                        return (
                          <button 
                            key={i} 
                            onClick={() => handleToggleMetric(metric)}
                            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${isSelected ? 'bg-white border-blue-200 shadow-sm' : 'bg-transparent border-transparent hover:bg-slate-100'}`}
                          >
                            <span className={`font-bold text-sm ${isSelected ? 'text-blue-700' : 'text-slate-600'}`}>
                              {metric.name} <span className="text-slate-400 ml-1">({metric.value})</span>
                            </span>
                            {isSelected ? <CheckSquare className="w-4 h-4 text-blue-500" /> : <Square className="w-4 h-4 text-slate-300" />}
                          </button>
                        )
                      })
                    ) : (
                      <p className="text-xs text-slate-500 font-medium italic p-2 text-center">No metrics logged for {selectedSport || 'this sport'}. Update your stats in the dashboard.</p>
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
                    placeholder="e.g., I watched your team win the conference championship..."
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
                    className={`w-full border rounded-xl px-4 py-3 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors mb-4 ${activeField === 'meet' ? 'bg-white border-blue-300' : 'bg-slate-50 border-slate-200'}`}
                  />
                  
                  {/* Smart Video Toggle & Link Input */}
                  <div className={`border rounded-xl p-3 transition-colors ${includeVideo ? 'bg-blue-50/30 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                        {includeVideo ? <Video className="w-4 h-4 text-blue-500" /> : <VideoOff className="w-4 h-4 text-slate-400" />}
                        Include Highlight Video Link
                      </span>
                      <button 
                        onClick={() => setIncludeVideo(!includeVideo)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${includeVideo ? 'bg-blue-600' : 'bg-slate-300'}`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${includeVideo ? 'translate-x-4.5' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    {includeVideo && (
                      <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                        <input
                          type="url"
                          value={localVideo}
                          onChange={(e) => setLocalVideo(e.target.value)}
                          placeholder="https://hudl.com/... or YouTube link"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* RIGHT: LIVE PREVIEW (60%) */}
          <div className="lg:col-span-7">
            
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" /> Live Preview
              </h2>
              <a
                href={searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 text-[10px] font-black uppercase tracking-widest py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Search className="w-3 h-3" /> Find Coach Email
              </a>
            </div>

            <div className="bg-white/60 backdrop-blur-2xl rounded-[2rem] p-2 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] border border-white/60 sticky top-28 transition-all duration-300 flex flex-col min-h-[600px]">
              
              {/* EDIT MODE TOOLBAR */}
              <div className="flex items-center gap-2 px-2 pb-3 mb-2 pt-2 border-b border-slate-200/50 shrink-0">
                {!isManualEdit ? (
                  <>
                    <button 
                      onClick={() => setHighlightBlanks(!highlightBlanks)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${highlightBlanks ? 'bg-amber-100 text-amber-700 border border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.2)]' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
                    >
                      <Wand2 className={`w-4 h-4 ${highlightBlanks ? 'text-amber-500' : ''}`} /> Review Blanks
                    </button>
                    <button 
                      onClick={toggleManualEditModal}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
                    >
                      <Edit3 className="w-4 h-4" /> Manual Override
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={toggleManualEditModal}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all bg-slate-900 text-white border border-slate-800 shadow-md"
                    >
                      <Edit3 className="w-4 h-4 text-white" /> Edit Override
                    </button>
                    <button 
                      onClick={revertToAutoGenerated}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all bg-white text-red-500 border border-red-200 hover:bg-red-50"
                    >
                      <RefreshCcw className="w-4 h-4" /> Revert to Auto
                    </button>
                  </>
                )}
              </div>

              {/* EDITOR CANVAS */}
              <div className="flex-1 flex flex-col min-h-0 bg-white rounded-[1.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                  <div className="flex flex-col h-full animate-in fade-in duration-200 overflow-y-auto custom-scrollbar p-6">
                    <div className="bg-slate-50 rounded-2xl p-5 mb-6 border border-slate-200/60 shrink-0">
                      <div className="flex flex-col gap-3 pb-3 border-b border-slate-200/60 mb-3">
                         <div className="flex items-center gap-3 text-slate-400">
                           <span className="text-xs font-black uppercase tracking-widest w-16">To:</span>
                           <span className={`bg-white px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-300 ${!isManualEdit && activeField === 'college' ? 'border-blue-400 text-blue-700 shadow-[0_0_10px_rgba(59,130,246,0.2)] scale-[1.02]' : 'text-slate-600 border-slate-200'}`}>
                             Coach @ {selectedCollege || 'Target School'}
                           </span>
                         </div>
                         <div className="flex items-center gap-3 text-slate-400">
                           <span className="text-xs font-black uppercase tracking-widest w-16">Context:</span>
                           <span className={`bg-white px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-300 ${!isManualEdit && (activeField === 'sport' || activeField === 'position') ? 'border-blue-400 text-blue-700 shadow-[0_0_10px_rgba(59,130,246,0.2)] scale-[1.02]' : 'text-slate-600 border-slate-200'}`}>
                             {selectedSport} {localPosition ? `- ${localPosition}` : ''}
                           </span>
                         </div>
                      </div>
                      <div className="flex items-start sm:items-center gap-3">
                        <span className="text-xs font-black uppercase tracking-widest w-16 text-slate-400 mt-1 sm:mt-0 shrink-0">Subject:</span>
                        <span className="text-sm font-black text-slate-900 leading-snug">
                          {isManualEdit ? manualSubject : renderHighlightedEmail(currentTemplate?.subject || '')}
                        </span>
                      </div>
                    </div>

                    <div className="whitespace-pre-wrap text-slate-700 font-medium leading-relaxed text-[15px] pb-6">
                      {isManualEdit ? manualBody : renderHighlightedEmail(currentTemplate?.body || '')}
                    </div>
                  </div>
              </div>

              {/* DESKTOP ACTIONS */}
              <div className="hidden sm:grid grid-cols-3 gap-2 mt-3 p-2 shrink-0">
                <button 
                  onClick={handleCopySubject}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-black py-3 px-2 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98] text-[11px] uppercase tracking-widest"
                >
                  {isCopiedSubject ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Type className="w-4 h-4" />}
                  {isCopiedSubject ? 'Copied!' : 'Copy Subject'}
                </button>
                <button 
                  onClick={handleCopyBody}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-black py-3 px-2 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98] text-[11px] uppercase tracking-widest group"
                >
                  {isCopiedBody ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {isCopiedBody ? 'Copied!' : 'Copy Body'}
                </button>
                <a 
                  href={mailtoLink}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-black py-3 px-2 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] text-[11px] uppercase tracking-widest"
                >
                  <Send className="w-4 h-4" /> Open Mail App
                </a>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* MOBILE STICKY ACTION BAR */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 p-4 pb-safe z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="grid grid-cols-2 gap-2 mb-2">
           <button 
             onClick={handleCopySubject}
             className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-3 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all text-[11px] uppercase tracking-widest"
           >
             {isCopiedSubject ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Type className="w-4 h-4" />}
             {isCopiedSubject ? 'Copied!' : 'Copy Subject'}
           </button>
           <button 
             onClick={handleCopyBody}
             className="bg-slate-900 hover:bg-slate-800 text-white font-black py-3 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all text-[11px] uppercase tracking-widest"
           >
             {isCopiedBody ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
             {isCopiedBody ? 'Copied!' : 'Copy Body'}
           </button>
        </div>
        <a 
          href={mailtoLink}
          className="w-full bg-blue-600 text-white font-black py-3 px-2 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/20 transition-all text-[11px] uppercase tracking-widest"
        >
          <Send className="w-4 h-4" /> Open Mail App
        </a>
      </div>
      
    </main>
  );
}