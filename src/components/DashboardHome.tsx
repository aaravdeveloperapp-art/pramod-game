import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, Wallet, Cpu, Zap, Bell, ArrowRight, CheckCircle, 
  HelpCircle, Sparkles, Award, Shield, ChevronRight, Play
} from 'lucide-react';
import { User, Investment, Announcement, AppBanner } from '../types';

interface DashboardHomeProps {
  user: User;
  investments: Investment[];
  announcements: Announcement[];
  banners: AppBanner[];
  onNavigate: (tab: string) => void;
  onSimulateDay: () => Promise<void>;
  isSimulating: boolean;
}

export default function DashboardHome({
  user,
  investments,
  announcements,
  banners,
  onNavigate,
  onSimulateDay,
  isSimulating
}: DashboardHomeProps) {
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInReward, setCheckInReward] = useState<number | null>(null);

  const activeNodes = investments.filter(inv => inv.status === 'active');
  const totalInvestmentAmount = investments.reduce((sum, inv) => sum + inv.purchaseAmount, 0);
  
  // Calculate today's passive income (sum of daily income of all active nodes)
  const todaysPassiveIncome = activeNodes.reduce((sum, inv) => sum + inv.dailyIncome, 0);
  
  // Calculate total earnings accrued so far
  const totalEarningsEarned = investments.reduce((sum, inv) => sum + inv.earnedIncome, 0);

  const handleDailyCheckIn = () => {
    if (checkedIn) return;
    // Generate a secure simulated reward between ₹10 and ₹35
    const reward = Math.floor(10 + Math.random() * 25);
    setCheckInReward(reward);
    setCheckedIn(true);
    
    // Add bonus reward directly to user local state (we can simulate it locally for instant satisfaction,
    // and tell them it is credited to their bonus wallet)
    user.wallet.bonus_balance += reward;
    user.wallet.total_balance += reward;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* 1. TOP HERO WELCOME */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-900 to-slate-950 p-6 border border-slate-800 grid-dots">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary font-display text-xs font-semibold tracking-wider uppercase mb-1">
              <Sparkles className="w-4 h-4 text-accent animate-pulse" />
              Dynamic Mining Node Active
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-100 tracking-tight">
              Hello, <span className="text-primary">{user.fullName}</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-md">
              Your decentralized clean energy mining rig is operating at full capacity. Check your daily hash outputs below.
            </p>
          </div>

          {/* SIMULATE FAST FORWARD BUTTON */}
          <div className="flex flex-col items-stretch sm:items-end gap-2 w-full md:w-auto">
            <button
              onClick={onSimulateDay}
              disabled={isSimulating || activeNodes.length === 0}
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-semibold tracking-wide text-sm shadow-lg transition-all ${
                activeNodes.length === 0
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-primary hover:bg-primary-dark text-white cursor-pointer active:scale-95 shadow-primary/20'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              {isSimulating ? 'Calibrating Mining Node...' : 'Simulate 1 Day Mining'}
            </button>
            {activeNodes.length === 0 ? (
              <p className="text-xs text-amber-500 text-center sm:text-right mt-1 font-medium">
                ⚠️ Buy an energy plan first to enable simulation
              </p>
            ) : (
              <p className="text-xs text-slate-500 text-center sm:text-right">
                Click to instantly accrue 1 day of passive crypto mining dividends!
              </p>
            )}
          </div>
        </div>
        <div className="absolute right-0 bottom-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
      </div>

      {/* 2. STATS BENTO GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* STAT 1: WALLET TOTAL */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-slate-800 text-primary rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider font-mono">Wallet</span>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Total Account Balance</p>
            <p className="text-xl md:text-2xl font-display font-bold text-slate-100 tracking-tight mt-1">
              ₹{user.wallet.total_balance.toLocaleString('en-IN')}
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-[10px]">
              <span className="text-emerald-500 font-bold font-mono">₹{user.wallet.deposit_balance}</span>
              <span className="text-slate-500">deposit</span>
              <span className="text-slate-500">•</span>
              <span className="text-amber-500 font-bold font-mono">₹{user.wallet.profit_balance}</span>
              <span className="text-slate-500">profits</span>
            </div>
          </div>
        </div>

        {/* STAT 2: TOTAL INVESTMENT */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-slate-800 text-emerald-500 rounded-xl">
              <Cpu className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider font-mono">Nodes</span>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Total Power Invested</p>
            <p className="text-xl md:text-2xl font-display font-bold text-slate-100 tracking-tight mt-1">
              ₹{totalInvestmentAmount.toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-emerald-500 mt-2 font-medium flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {activeNodes.length} mining units online
            </p>
          </div>
        </div>

        {/* STAT 3: DAILY PASSIVE INCOME */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-slate-800 text-amber-500 rounded-xl">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider font-mono">Yield</span>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Daily Passive Return</p>
            <p className="text-xl md:text-2xl font-display font-bold text-amber-400 tracking-tight mt-1">
              ₹{todaysPassiveIncome.toLocaleString('en-IN')}/day
            </p>
            <p className="text-[10px] text-slate-500 mt-2">
              ROI generated every 24 hours
            </p>
          </div>
        </div>

        {/* STAT 4: TOTAL REVENUE ACCRUED */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-slate-800 text-indigo-400 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider font-mono">Dividends</span>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Total Dividends Credited</p>
            <p className="text-xl md:text-2xl font-display font-bold text-indigo-400 tracking-tight mt-1">
              ₹{totalEarningsEarned.toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-indigo-400 mt-2 font-medium">
              Transferred directly to Profit wallet
            </p>
          </div>
        </div>
      </div>

      {/* 3. QUICK ACTIONS */}
      <div className="grid grid-cols-4 gap-3">
        {/* CHECK IN */}
        <button
          onClick={handleDailyCheckIn}
          disabled={checkedIn}
          className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
            checkedIn
              ? 'bg-slate-950 border-slate-900 text-slate-500 cursor-default'
              : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-100 hover:border-slate-700 active:scale-95 cursor-pointer'
          }`}
        >
          <div className={`p-2 rounded-xl mb-1.5 ${checkedIn ? 'bg-slate-900 text-slate-600' : 'bg-primary/10 text-primary'}`}>
            <Award className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold tracking-wide block">Check-In</span>
          <span className="text-[9px] text-slate-500 block mt-0.5">
            {checkedIn ? `Claimed +₹${checkInReward}` : 'Daily Free ₹'}
          </span>
        </button>

        {/* RECHARGE */}
        <button
          onClick={() => onNavigate('wallet')}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-100 active:scale-95 transition-all cursor-pointer"
        >
          <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl mb-1.5">
            <Zap className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold tracking-wide block">Recharge</span>
          <span className="text-[9px] text-emerald-500 block mt-0.5">Deposit Funds</span>
        </button>

        {/* WITHDRAW */}
        <button
          onClick={() => onNavigate('wallet')}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-100 active:scale-95 transition-all cursor-pointer"
        >
          <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl mb-1.5">
            <Wallet className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold tracking-wide block">Withdraw</span>
          <span className="text-[9px] text-amber-500 block mt-0.5">Disburse profits</span>
        </button>

        {/* REFERRAL */}
        <button
          onClick={() => onNavigate('team')}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-100 active:scale-95 transition-all cursor-pointer"
        >
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl mb-1.5">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold tracking-wide block">Invite</span>
          <span className="text-[9px] text-indigo-400 block mt-0.5">Earn commissions</span>
        </button>
      </div>

      {/* 4. PROMOTIONAL BANNER CAROUSEL */}
      {banners.length > 0 && (
        <div className="relative overflow-hidden rounded-3xl h-36 md:h-44 border border-slate-800 bg-slate-900">
          <img 
            src={banners[activeBannerIndex].image} 
            alt={banners[activeBannerIndex].title}
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
          <div className="absolute bottom-0 left-0 p-5 right-0 flex justify-between items-end">
            <div>
              <span className="bg-primary/20 text-primary border border-primary/30 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">
                Promotion
              </span>
              <h3 className="text-md md:text-lg font-display font-bold text-slate-100 mt-1">
                {banners[activeBannerIndex].title}
              </h3>
            </div>
            
            {/* Banner Dots */}
            <div className="flex gap-1.5 mb-1">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveBannerIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all ${activeBannerIndex === i ? 'bg-primary w-4' : 'bg-slate-700'}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. CURRENT MINING HARWARE RIGS */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-display font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" />
            Your Energy Hardware
          </h2>
          <button 
            onClick={() => onNavigate('shop')} 
            className="text-xs font-semibold text-primary hover:text-primary-dark flex items-center gap-1"
          >
            Deploy New Nodes
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeNodes.length === 0 ? (
          <div className="bg-slate-900 border border-dashed border-slate-800 rounded-3xl p-8 text-center flex flex-col items-center justify-center">
            <div className="p-3 bg-slate-800 text-slate-500 rounded-full mb-3">
              <Cpu className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-semibold text-slate-300">No energy hardware active</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              You haven't rented any hashing miners yet. Buy plans in the Investment Shop to start earning automated returns!
            </p>
            <button
              onClick={() => onNavigate('shop')}
              className="mt-4 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-semibold"
            >
              Go to Investment Shop
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {activeNodes.map(inv => {
              const totalDays = inv.durationDays;
              const earnedDays = Math.floor(inv.earnedIncome / inv.dailyIncome);
              const remainingDays = Math.max(0, totalDays - earnedDays);
              const progressPercentage = Math.min(100, (inv.earnedIncome / inv.totalIncome) * 100);

              return (
                <div key={inv.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className="p-2.5 bg-slate-950 text-emerald-500 border border-emerald-500/20 rounded-xl h-fit">
                        <Zap className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-200">{inv.planName}</h4>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          ID: {inv.id.toUpperCase()} • Rate: ₹{inv.dailyIncome}/day
                        </p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Mining Live
                    </span>
                  </div>

                  {/* Progress Line */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400">Dividends: ₹{inv.earnedIncome} / ₹{inv.totalIncome}</span>
                      <span className="text-slate-500 font-bold">{progressPercentage.toFixed(0)}% Completed</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className="bg-gradient-to-r from-primary to-amber-500 h-full rounded-full" 
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
                      <span>Purchased: {new Date(inv.startDate).toLocaleDateString()}</span>
                      <span>Remaining: <strong className="text-slate-300 font-semibold">{remainingDays} days</strong></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. RECENT ANNOUNCEMENTS */}
      {announcements.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-display font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Bell className="w-5 h-5 text-accent" />
            Latest Announcements
          </h2>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 divide-y divide-slate-800">
            {announcements.map((ann, i) => (
              <div key={ann.id} className={`py-3 first:pt-0 last:pb-0`}>
                <div className="flex justify-between items-center mb-1">
                  <h4 className="text-xs font-bold text-slate-200">{ann.title}</h4>
                  <span className="text-[9px] font-mono text-slate-500">
                    {new Date(ann.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{ann.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. TRUST SECURITY SIGN */}
      <div className="bg-slate-950 border border-slate-900 rounded-2xl p-4 text-center flex items-center justify-center gap-3">
        <Shield className="w-5 h-5 text-emerald-500" />
        <p className="text-xs text-slate-500">
          Mining Energy operates on zero-emission decentralized hydro & geothermal nodes. Secure SSL encryptions active.
        </p>
      </div>
    </motion.div>
  );
}
