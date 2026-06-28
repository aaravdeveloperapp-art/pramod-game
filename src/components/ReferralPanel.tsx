import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Copy, Check, QrCode, TrendingUp, Award, HelpCircle, 
  ChevronRight, Sparkles, UserCheck, ShieldAlert
} from 'lucide-react';
import { User } from '../types';

interface ReferralPanelProps {
  user: User;
  teamData: {
    level1: any[];
    level2: any[];
    level3: any[];
    commissionSummary: {
      totalEarned: number;
      referralCode: string;
      directInvites: number;
    };
  };
}

export default function ReferralPanel({
  user,
  teamData
}: ReferralPanelProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTierTab, setActiveTierTab] = useState<1 | 2 | 3>(1);

  const inviteLink = `${window.location.origin}/?ref=${teamData.commissionSummary.referralCode}`;

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(teamData.commissionSummary.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const currentTierUsers = 
    activeTierTab === 1 ? teamData.level1 :
    activeTierTab === 2 ? teamData.level2 :
    teamData.level3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* 1. COMMISSION STATS BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-b from-indigo-950/40 to-slate-950 border border-indigo-500/20 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="flex items-center gap-1.5 text-xs text-indigo-400 font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-accent animate-pulse" />
            3-Tier Commission Network
          </span>
          <h1 className="text-2xl font-display font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" />
            Invite Friends & Earn
          </h1>
          <p className="text-slate-400 text-xs mt-1 max-w-md">
            Earn instant hash bonuses when your direct friends or downline teams lease energy miners.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl w-full md:w-auto text-center md:text-right">
          <span className="text-[10px] text-slate-500 block font-mono">TOTAL REFERRAL EARNINGS</span>
          <span className="text-2xl font-display font-extrabold text-indigo-400 tracking-tight block mt-0.5">
            ₹{teamData.commissionSummary.totalEarned.toLocaleString('en-IN')}
          </span>
          <span className="text-[9px] text-emerald-500 font-semibold block mt-1">
            ✓ Credited instantly to referral wallet
          </span>
        </div>
      </div>

      {/* 2. CORE REFERRAL LINK COPY CARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-slate-900 border border-slate-850 rounded-3xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-200">Your Invitation Credentials</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Link Box */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-500 block font-semibold">Invite Link</label>
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-mono truncate mr-2 w-36">
                  {inviteLink}
                </span>
                <button
                  onClick={copyInviteLink}
                  className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Code Box */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-500 block font-semibold">Referral Code</label>
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 flex justify-between items-center">
                <span className="text-xs text-indigo-400 font-extrabold font-mono tracking-wider">
                  {teamData.commissionSummary.referralCode}
                </span>
                <button
                  onClick={copyInviteCode}
                  className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Rates Infobox */}
          <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-850 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <span className="text-[10px] text-slate-500 block">TIER 1 INVITES</span>
              <span className="text-indigo-400 font-bold block mt-1">10% Returns</span>
              <span className="text-[9px] text-slate-500 block mt-0.5">Direct referral purchase</span>
            </div>
            <div className="border-x border-slate-850">
              <span className="text-[10px] text-slate-500 block">TIER 2 INVITES</span>
              <span className="text-indigo-400 font-bold block mt-1">5% Returns</span>
              <span className="text-[9px] text-slate-500 block mt-0.5">Teammate refers friends</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">TIER 3 INVITES</span>
              <span className="text-indigo-400 font-bold block mt-1">2% Returns</span>
              <span className="text-[9px] text-slate-500 block mt-0.5">Teammates of Level 2</span>
            </div>
          </div>
        </div>

        {/* QR CODE CARD */}
        <div className="bg-slate-900 border border-slate-850 rounded-3xl p-5 flex flex-col items-center justify-center text-center space-y-3">
          <QrCode className="w-6 h-6 text-indigo-400" />
          <div className="bg-white p-2 rounded-xl">
            <div className="w-24 h-24 bg-slate-100 flex flex-col items-center justify-center border border-slate-200 rounded-lg p-1">
              <div className="grid grid-cols-4 grid-rows-4 gap-1 w-full h-full opacity-80">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className={`rounded-xs ${i % 3 === 0 ? 'bg-slate-900' : 'bg-transparent'}`} />
                ))}
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200">Teammate QR invite</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">Scan to join your Mining Tree</p>
          </div>
        </div>
      </div>

      {/* 3. MULTI-LEVEL DOWNLINE NETWORK VIEW */}
      <div className="space-y-4">
        <h2 className="text-lg font-display font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Your Teammates Tree
        </h2>

        {/* Tier sub-tabs */}
        <div className="flex gap-2 bg-slate-950 p-1 border border-slate-900 rounded-2xl">
          <button
            onClick={() => setActiveTierTab(1)}
            className={`flex-1 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
              activeTierTab === 1
                ? 'bg-slate-800 text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            Level 1 ({teamData.level1.length})
          </button>
          <button
            onClick={() => setActiveTierTab(2)}
            className={`flex-1 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
              activeTierTab === 2
                ? 'bg-slate-800 text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            Level 2 ({teamData.level2.length})
          </button>
          <button
            onClick={() => setActiveTierTab(3)}
            className={`flex-1 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
              activeTierTab === 3
                ? 'bg-slate-800 text-slate-100 shadow-xs'
                : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            Level 3 ({teamData.level3.length})
          </button>
        </div>

        {/* Teammates List */}
        {currentTierUsers.length === 0 ? (
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-8 text-center text-slate-500 text-xs">
            No teammates registered at Level {activeTierTab} yet.
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden divide-y divide-slate-850">
            {currentTierUsers.map((member: any) => (
              <div key={member.id} className="p-4 flex justify-between items-center text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300">
                    {member.fullName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-200">{member.fullName}</h4>
                    <span className="text-[10px] text-slate-500 block font-mono mt-0.5">
                      ID: {member.id.toUpperCase()} • Joined: {new Date(member.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="flex items-center gap-1.5 text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                    <UserCheck className="w-3 h-3" />
                    Active Node
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. DOWNLINE SECURITY TIPS */}
      <div className="bg-slate-950 border border-slate-900 rounded-2xl p-4 flex gap-3 text-xs text-slate-500">
        <ShieldAlert className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Referral earnings are processed instantaneously. Members are strictly forbidden from creating self-referred accounts or fake identities to game commissions. Violating networks will suffer immediate suspension.
        </p>
      </div>
    </motion.div>
  );
}
