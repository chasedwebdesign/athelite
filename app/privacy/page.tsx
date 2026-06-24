import Link from 'next/link';
import { Lock, ArrowLeft, ShieldCheck, EyeOff, Database } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-emerald-500/30 pb-24">
      {/* Header Banner */}
      <div className="bg-slate-900 border-b border-slate-800 pt-12 pb-8 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent pointer-events-none"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <Link href="/login" className="inline-flex items-center text-emerald-400 font-bold mb-6 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl border border-emerald-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <Lock className="w-6 h-6 text-emerald-400" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">Privacy Policy</h1>
          </div>
          <p className="text-slate-400 font-medium">Last Updated: August 2024</p>
        </div>
      </div>

      {/* Content Body */}
      <div className="max-w-4xl mx-auto px-6 mt-12 space-y-12">
        
        {/* THE PLEDGE */}
        <section className="bg-gradient-to-r from-emerald-900/40 to-slate-900 border-l-4 border-emerald-500 rounded-r-3xl p-8 shadow-lg relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center shrink-0 border border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white mb-2">Our "No Data Selling" Pledge</h2>
              <p className="text-emerald-100/80 font-medium leading-relaxed">
                Let's be completely clear: <strong className="text-white">We do not, and will never, sell your personal data to third-party brokers, advertisers, or outside entities.</strong> ChasedSports exists to connect athletes with college coaches on our platform. Your data is used exclusively to power your recruiting profile, leaderboards, and matchmaking within this ecosystem. Period.
              </p>
            </div>
          </div>
        </section>

        {/* 1. Information We Collect */}
        <section className="space-y-4">
          <h3 className="text-xl font-black text-white border-b border-slate-800 pb-2 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-400" /> 1. Information We Collect
          </h3>
          <p className="leading-relaxed mb-4">To provide our services, we collect the following information:</p>
          <ul className="space-y-3 list-disc list-outside ml-5 text-slate-400 marker:text-slate-600">
            <li><strong className="text-slate-300">Account Information:</strong> Name, email address, password, high school, graduation year, and state.</li>
            <li><strong className="text-slate-300">Athletic Data:</strong> URLs to external tracking sites (like Athletic.net), manually entered metrics, height, weight, and Personal Records (PRs).</li>
            <li><strong className="text-slate-300">Platform Activity:</strong> Saved colleges, equipped profile borders, messages sent within the platform, and virtual currency balances.</li>
          </ul>
        </section>

        {/* 2. How We Use Your Data */}
        <section className="space-y-4">
          <h3 className="text-xl font-black text-white border-b border-slate-800 pb-2">2. How We Use Your Information</h3>
          <p className="leading-relaxed text-slate-400">
            We use your data specifically to operate the ChasedSports platform:
          </p>
          <ul className="space-y-3 list-disc list-outside ml-5 text-slate-400 marker:text-slate-600">
            <li>To generate your "Base Recruiting Score" and match you with compatible university athletic programs.</li>
            <li>To display your public athletic profile to verified college and high school coaches.</li>
            <li>To power the state and national leaderboards.</li>
            <li>To process secure communications between athletes and coaches.</li>
          </ul>
        </section>

        {/* 3. Who Can See Your Data */}
        <section className="space-y-4">
          <h3 className="text-xl font-black text-white border-b border-slate-800 pb-2 flex items-center gap-2">
            <EyeOff className="w-5 h-5 text-slate-400" /> 3. Visibility and Sharing
          </h3>
          <p className="leading-relaxed text-slate-400">
            Your athletic profile (name, state, grad year, sports, and PRs) is visible to registered users and verified coaches on the platform to facilitate recruiting. Your private data (like direct messages, saved college lists, and exact email address) is kept strictly confidential and is only shared with a coach if you explicitly initiate or accept contact with them. 
          </p>
        </section>

        {/* 4. Your Rights & Data Deletion */}
        <section className="space-y-4">
          <h3 className="text-xl font-black text-white border-b border-slate-800 pb-2">4. Your Rights & Data Deletion</h3>
          <p className="leading-relaxed text-slate-400">
            You own your data. You have the right to access, modify, or completely delete your account and all associated data at any time through your dashboard settings. If you request account deletion, we will permanently wipe your athletic metrics, personal details, and messaging history from our active databases.
          </p>
        </section>

      </div>
    </main>
  );
}