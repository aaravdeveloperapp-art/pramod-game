import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, ShieldCheck, HelpCircle, Star, ShoppingCart, Info, 
  Search, X, CheckCircle, AlertTriangle, ArrowRight, Wallet
} from 'lucide-react';
import { User, InvestmentPlan } from '../types';

interface InvestmentShopProps {
  user: User;
  plans: InvestmentPlan[];
  onBuyPlan: (planId: string) => Promise<void>;
  isProcessing: boolean;
}

export default function InvestmentShop({
  user,
  plans,
  onBuyPlan,
  isProcessing
}: InvestmentShopProps) {
  const [activeCategory, setActiveCategory] = useState<'normal' | 'vip'>('normal');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<InvestmentPlan | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const filteredPlans = plans.filter(p => {
    const matchesCategory = p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenBuy = (plan: InvestmentPlan) => {
    setSelectedPlan(plan);
    setErrorMsg('');
    setShowConfirmModal(true);
  };

  const handleConfirmBuy = async () => {
    if (!selectedPlan) return;
    
    // Quick local client validation
    const totalBalance = user.wallet.deposit_balance + user.wallet.bonus_balance + user.wallet.profit_balance;
    if (totalBalance < selectedPlan.price) {
      setErrorMsg(`Insufficient funds. This plan costs ₹${selectedPlan.price}, but your total wallet has ₹${totalBalance}. Please recharge first.`);
      return;
    }

    try {
      await onBuyPlan(selectedPlan.id);
      setShowConfirmModal(false);
      setSelectedPlan(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Purchase process failed. Try again.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* 1. SHOP HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-primary" />
            Energy Hardware Shop
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Rent high-performance green energy mining nodes. Profits are credited straight to your balance every 24 hours.
          </p>
        </div>

        {/* SEARCH BAR */}
        <div className="relative w-full md:w-64">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search miners..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 focus:border-primary focus:outline-none rounded-2xl py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500"
          />
        </div>
      </div>

      {/* 2. CATEGORY SELECTOR SUB-TABS */}
      <div className="flex gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-900 w-full md:w-80">
        <button
          onClick={() => setActiveCategory('normal')}
          className={`flex-1 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all cursor-pointer ${
            activeCategory === 'normal'
              ? 'bg-primary text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Normal Miner Nodes
        </button>
        <button
          onClick={() => setActiveCategory('vip')}
          className={`flex-1 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeCategory === 'vip'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Star className="w-3.5 h-3.5 fill-current" />
          VIP Premium Nodes
        </button>
      </div>

      {/* 3. MINING INVESTMENT CARDS GRID */}
      {filteredPlans.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center">
          <Info className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-slate-400 text-xs">No miner hardware modules found matching the criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredPlans.map(plan => (
            <motion.div
              key={plan.id}
              whileHover={{ y: -4 }}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl overflow-hidden flex flex-col justify-between"
            >
              {/* Card Image and ROI Badge */}
              <div className="relative h-44 overflow-hidden">
                <img 
                  src={plan.image} 
                  alt={plan.name}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                
                {/* ROI Badge */}
                <span className={`absolute top-4 right-4 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg ${
                  plan.category === 'vip'
                    ? 'bg-amber-500 text-slate-950 font-extrabold'
                    : 'bg-primary text-white'
                }`}>
                  ROI: {plan.roiPercentage}%
                </span>
                
                {/* Category Badge */}
                <span className="absolute bottom-4 left-4 bg-slate-950/80 text-slate-300 border border-slate-800 text-[10px] px-2.5 py-0.5 rounded-md backdrop-blur-xs font-mono">
                  {plan.category.toUpperCase()} SERVER
                </span>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-md font-display font-bold text-slate-100">{plan.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">{plan.description}</p>
                </div>

                {/* Grid Financial metrics */}
                <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/50 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 block">MINING PRICE</span>
                    <strong className="text-slate-200 text-sm">₹{plan.price.toLocaleString('en-IN')}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">DAILY HARVEST</span>
                    <strong className="text-emerald-500 text-sm">₹{plan.dailyIncome}/day</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">DIVIDEND TERM</span>
                    <strong className="text-slate-300 text-sm">{plan.durationDays} Days</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">TOTAL PAYOUT</span>
                    <strong className="text-indigo-400 text-sm">₹{plan.totalIncome}</strong>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-[10px] text-slate-500">
                    Purchase Limit: <strong className="text-slate-300">{plan.maxPurchase} units</strong>
                  </span>
                  
                  <button
                    onClick={() => handleOpenBuy(plan)}
                    className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl font-bold tracking-wide text-xs cursor-pointer transition-all ${
                      plan.category === 'vip'
                        ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 active:scale-95'
                        : 'bg-primary hover:bg-primary-dark text-white active:scale-95'
                    }`}
                  >
                    Deploy Node
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* 4. VERIFICATION BUY DIALOG MODAL */}
      <AnimatePresence>
        {showConfirmModal && selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative"
            >
              {/* Close */}
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <h3 className="text-md font-display font-bold text-slate-100">Confirm Node Lease</h3>
                <p className="text-xs text-slate-400">
                  You are about to lease and deploy the following mining hardware.
                </p>
              </div>

              {/* Plan Specs Overview */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Hardware Node:</span>
                  <span className="text-slate-200 font-semibold">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Rental Term:</span>
                  <span className="text-slate-200">{selectedPlan.durationDays} Days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Yield Output:</span>
                  <span className="text-emerald-500 font-bold">₹{selectedPlan.dailyIncome} / day</span>
                </div>
                <div className="border-t border-slate-800 my-2 pt-2 flex justify-between">
                  <span className="text-slate-500 font-bold">Lease Cost:</span>
                  <span className="text-primary font-bold text-sm">₹{selectedPlan.price}</span>
                </div>
              </div>

              {/* Wallet Specs */}
              <div className="flex justify-between items-center text-[10px] text-slate-500 px-1">
                <span>Your Available Funds:</span>
                <span className="flex items-center gap-1 font-semibold text-slate-300">
                  <Wallet className="w-3.5 h-3.5 text-slate-400" />
                  ₹{(user.wallet.deposit_balance + user.wallet.bonus_balance + user.wallet.profit_balance).toLocaleString('en-IN')}
                </span>
              </div>

              {/* Errors if any */}
              {errorMsg && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-xl flex gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-800 text-xs font-semibold hover:bg-slate-800 text-slate-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmBuy}
                  disabled={isProcessing}
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing ? 'Deploying...' : 'Approve Lease'}
                </button>
              </div>

              <p className="text-[10px] text-slate-500 text-center">
                🔒 Safe payments processed locally. Auto-returns accrue daily.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
