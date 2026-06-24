import Link from 'next/link';
import { Shield, ArrowLeft, Zap, Scale, AlertTriangle, Coins, Users } from 'lucide-react';

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-indigo-500/30 pb-24">
      {/* Header Banner */}
      <div className="bg-slate-900 border-b border-slate-800 pt-12 pb-8 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent pointer-events-none"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <Link href="/login" className="inline-flex items-center text-indigo-400 font-bold mb-6 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl border border-indigo-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.2)]">
              <Scale className="w-6 h-6 text-indigo-400" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">Terms of Service</h1>
          </div>
          <p className="text-slate-400 font-medium">Last Updated: August 2024</p>
        </div>
      </div>

      {/* Content Body */}
      <div className="max-w-4xl mx-auto px-6 mt-12 space-y-12">
        
        {/* Introduction */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 shadow-inner relative overflow-hidden">
          <h2 className="text-2xl font-black text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" /> Welcome to ChasedSports
          </h2>
          <p className="leading-relaxed mb-4 text-slate-400">
            By creating an account, accessing, or using the ChasedSports platform ("Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use our services. 
          </p>
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 flex items-start gap-3 mt-6">
            <AlertTriangle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-sm font-bold text-indigo-200">
              IMPORTANT: Please read these terms carefully as they govern your use of the platform, virtual currencies, and user-generated content.
            </p>
          </div>
        </section>

        {/* 1. Age Eligibility (COPPA) */}
        <section className="space-y-4">
          <h3 className="text-xl font-black text-white border-b border-slate-800 pb-2">1. Eligibility and Age Requirements</h3>
          <p className="leading-relaxed">
            You must be at least 13 years of age to create an account on ChasedSports. By creating an account, you represent and warrant that you meet this age requirement. If you are under the age of 18, you represent that you have your parent or legal guardian's permission to use the Platform. We reserve the right to terminate accounts that violate this policy.
          </p>
        </section>

        {/* 2. Virtual Currency (CRITICAL PROTECTIONS) */}
        <section className="space-y-4">
          <h3 className="text-xl font-black text-white border-b border-slate-800 pb-2 flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-500" /> 2. ChasedCash, Boosts, and Virtual Items
          </h3>
          <ul className="space-y-3 list-disc list-outside ml-5 text-slate-400 marker:text-slate-600">
            <li><strong className="text-slate-300">No Real-World Value:</strong> The platform features virtual currency ("ChasedCash") and virtual items ("Boosts", "Profile Borders"). These are purely digital items intended for gamified engagement on the Platform. They have no real-world monetary value, cannot be exchanged for fiat currency, and are not your private property.</li>
            <li><strong className="text-slate-300">Purchases and Refunds:</strong> All purchases of Premium subscriptions, ChasedCash, or Boosts are final and non-refundable. We do not guarantee that virtual items will be available at all times.</li>
            <li><strong className="text-slate-300">Account Termination:</strong> If your account is suspended, terminated, or deleted (either voluntarily or due to a violation of these Terms), all ChasedCash and unlocked virtual items associated with your account will be immediately forfeit without compensation.</li>
          </ul>
        </section>

        {/* 3. User Conduct */}
        <section className="space-y-4">
          <h3 className="text-xl font-black text-white border-b border-slate-800 pb-2 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" /> 3. User Conduct and Content
          </h3>
          <p className="leading-relaxed">
            ChasedSports is designed to connect dedicated athletes with college programs. You are entirely responsible for the content, metrics, and PRs (Personal Records) you sync or manually post to the Platform.
          </p>
          <ul className="space-y-3 list-disc list-outside ml-5 text-slate-400 marker:text-slate-600">
            <li><strong className="text-slate-300">Prohibited Actions:</strong> You agree not to harass, abuse, or spam other users (including coaches). You will not post falsified athletic metrics, fake Athletic.net URLs, or inappropriate media.</li>
            <li><strong className="text-slate-300">Our Rights:</strong> We reserve the right to review, flag, modify, or remove any user-generated content (including posts, messages, and profile data) at our sole discretion. We reserve the right to unilaterally ban users who degrade the platform's integrity.</li>
          </ul>
        </section>

        {/* 4. Limitation of Liability */}
        <section className="space-y-4">
          <h3 className="text-xl font-black text-white border-b border-slate-800 pb-2">4. Limitation of Liability</h3>
          <p className="leading-relaxed text-sm text-slate-500 uppercase tracking-wider font-bold">
            To the maximum extent permitted by law, ChasedSports and its founders shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from (a) your access to or use of or inability to access or use the platform; (b) any conduct or content of any third party on the platform.
          </p>
        </section>

      </div>
    </main>
  );
}