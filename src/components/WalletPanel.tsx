import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, Plus, ArrowUpRight, ArrowDownLeft, Shield, CheckCircle2, 
  HelpCircle, AlertCircle, Copy, Check, QrCode, CreditCard, Landmark, ArrowRight
} from 'lucide-react';
import { User, Transaction } from '../types';

interface WalletPanelProps {
  user: User;
  transactions: Transaction[];
  onRecharge: (amount: number, method: string, reference: string) => Promise<void>;
  onWithdraw: (payload: any) => Promise<void>;
  isProcessing: boolean;
  onRefresh: () => Promise<void>;
}

export default function WalletPanel({
  user,
  transactions,
  onRecharge,
  onWithdraw,
  isProcessing,
  onRefresh
}: WalletPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'recharge' | 'withdraw' | 'history'>('recharge');
  
  // Recharge form state
  const [rechargeAmount, setRechargeAmount] = useState<string>('700');
  const [rechargeMethod, setRechargeMethod] = useState<'upi' | 'card' | 'bank'>('upi');
  const [showGateway, setShowGateway] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [rechargeSuccess, setRechargeSuccess] = useState(false);

  // Withdrawal form state
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawMethod, setWithdrawMethod] = useState<'upi' | 'bank'>('upi');
  const [upiId, setUpiId] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  // History states
  const [filterType, setFilterType] = useState<'all' | 'deposit' | 'withdrawal' | 'mining_profit'>('all');

  const availableProfit = user.wallet.profit_balance + user.wallet.referral_balance;

  const handleSelectQuickAmount = (val: number) => {
    setRechargeAmount(val.toString());
  };

  const handleOpenGateway = () => {
    const amt = Number(rechargeAmount);
    if (!amt || amt <= 0) {
      alert('Please enter a valid amount to recharge');
      return;
    }
    setUtrNumber('');
    setRechargeSuccess(false);
    setShowGateway(true);
  };

  const handleConfirmRecharge = async () => {
    if (!utrNumber || utrNumber.trim().length < 6) {
      alert('Please enter a valid payment Transaction Reference / UTR number (minimum 6 digits).');
      return;
    }
    
    try {
      await onRecharge(Number(rechargeAmount), rechargeMethod.toUpperCase(), utrNumber);
      setRechargeSuccess(true);
      setTimeout(() => {
        setShowGateway(false);
        setRechargeSuccess(false);
        setActiveSubTab('history');
      }, 3500);
    } catch (err: any) {
      alert(err.message || 'Payment submission failed.');
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(withdrawAmount);
    if (!amt || amt < 300) {
      alert('Minimum withdrawal threshold is ₹300.');
      return;
    }

    if (amt > availableProfit) {
      alert('Requested amount exceeds your withdrawable Profit balance.');
      return;
    }

    if (withdrawMethod === 'upi' && !upiId) {
      alert('Please enter your UPI ID.');
      return;
    }

    if (withdrawMethod === 'bank' && (!bankName || !accountNumber || !ifscCode)) {
      alert('Please complete all Bank Account Details.');
      return;
    }

    try {
      const payload = {
        amount: amt,
        paymentMethod: withdrawMethod.toUpperCase(),
        upiId: withdrawMethod === 'upi' ? upiId : undefined,
        bankName: withdrawMethod === 'bank' ? bankName : undefined,
        accountNumber: withdrawMethod === 'bank' ? accountNumber : undefined,
        ifsc: withdrawMethod === 'bank' ? ifscCode : undefined
      };

      await onWithdraw(payload);
      setWithdrawSuccess(true);
      setWithdrawAmount('');
      setUpiId('');
      setBankName('');
      setAccountNumber('');
      setIfscCode('');
      
      setTimeout(() => {
        setWithdrawSuccess(false);
        setActiveSubTab('history');
      }, 3500);
    } catch (err: any) {
      alert(err.message || 'Withdrawal request failed.');
    }
  };

  const copyUpiToClipboard = () => {
    navigator.clipboard.writeText('8144553816@ybl');
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const filteredTransactions = transactions.filter(tx => {
    if (filterType === 'all') return true;
    return tx.type === filterType;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* 1. COMPREHENSIVE BALANCES HEADER CARD */}
      <div className="bg-linear-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 relative overflow-hidden grid-dots">
        <div className="absolute right-0 top-0 w-44 h-44 bg-primary/5 rounded-full blur-2xl" />
        
        <p className="text-xs text-slate-500 uppercase font-bold tracking-widest font-mono">Ledger Node Wallet</p>
        <h2 className="text-3xl font-display font-bold text-slate-100 tracking-tight mt-1.5">
          ₹{user.wallet.total_balance.toLocaleString('en-IN')}
        </h2>
        
        <div className="grid grid-cols-3 gap-3 border-t border-slate-800/80 mt-5 pt-5 text-xs">
          <div>
            <span className="text-slate-500 block text-[10px]">DEPOSIT BASE</span>
            <span className="text-emerald-400 font-bold font-mono text-sm">₹{user.wallet.deposit_balance}</span>
            <span className="text-[9px] text-slate-500 block mt-0.5">For buying energy plans</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">WITHDRAWABLE</span>
            <span className="text-amber-400 font-bold font-mono text-sm">₹{user.wallet.profit_balance}</span>
            <span className="text-[9px] text-slate-500 block mt-0.5">Mining profit yields</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">BONUS & REWARDS</span>
            <span className="text-indigo-400 font-bold font-mono text-sm">₹{user.wallet.bonus_balance + user.wallet.referral_balance}</span>
            <span className="text-[9px] text-slate-500 block mt-0.5">Referred commissions</span>
          </div>
        </div>

        {user.wallet.frozen_balance > 0 && (
          <div className="mt-4 bg-slate-950 p-3 rounded-2xl border border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Processing Withdrawals (Frozen):
            </span>
            <span className="text-amber-500 font-mono font-bold">₹{user.wallet.frozen_balance}</span>
          </div>
        )}
      </div>

      {/* 2. SUB-PANE CONTROL BAR */}
      <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-900">
        <button
          onClick={() => setActiveSubTab('recharge')}
          className={`flex-1 py-3 rounded-xl font-semibold text-xs tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'recharge'
              ? 'bg-primary text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Plus className="w-4 h-4" />
          Recharge
        </button>
        <button
          onClick={() => setActiveSubTab('withdraw')}
          className={`flex-1 py-3 rounded-xl font-semibold text-xs tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'withdraw'
              ? 'bg-primary text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4" />
          Withdraw
        </button>
        <button
          onClick={() => setActiveSubTab('history')}
          className={`flex-1 py-3 rounded-xl font-semibold text-xs tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'history'
              ? 'bg-primary text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Landmark className="w-4 h-4" />
          Ledger History
        </button>
      </div>

      {/* 3. SUB-PANES MOUNT */}
      <AnimatePresence mode="wait">
        {/* RECHARGE PANEL */}
        {activeSubTab === 'recharge' && (
          <motion.div
            key="recharge"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-5"
          >
            <div>
              <h3 className="text-sm font-bold text-slate-200">Recharge Balance</h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter your desired deposit amount to load your Deposit Wallet base.
              </p>
            </div>

            {/* Quick buttons */}
            <div className="grid grid-cols-5 gap-2">
              {[300, 700, 1500, 3000, 5000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleSelectQuickAmount(val)}
                  className={`py-2 rounded-xl border font-mono font-bold text-xs transition-all cursor-pointer ${
                    rechargeAmount === val.toString()
                      ? 'bg-primary/25 text-primary border-primary'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  ₹{val}
                </button>
              ))}
            </div>

            {/* Amount Input */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400">Custom Amount (₹)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 font-bold font-mono">
                  ₹
                </span>
                <input
                  type="number"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-primary focus:outline-none rounded-2xl py-3 pl-8 pr-4 text-sm font-bold font-mono text-slate-200"
                  placeholder="Enter amount"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 block">Select Gateway Channel</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRechargeMethod('upi')}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer transition-all ${
                    rechargeMethod === 'upi'
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <QrCode className="w-5 h-5" />
                  <span className="text-[10px] font-semibold">UPI Direct</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRechargeMethod('card')}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer transition-all ${
                    rechargeMethod === 'card'
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="text-[10px] font-semibold">Credit/Debit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRechargeMethod('bank')}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer transition-all ${
                    rechargeMethod === 'bank'
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Landmark className="w-5 h-5" />
                  <span className="text-[10px] font-semibold">Net Banking</span>
                </button>
              </div>
            </div>

            <button
              onClick={handleOpenGateway}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-2xl text-xs tracking-wide shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              Proceed to Deposit Gateway
            </button>
          </motion.div>
        )}

        {/* WITHDRAW PANEL */}
        {activeSubTab === 'withdraw' && (
          <motion.div
            key="withdraw"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-5"
          >
            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-200">Withdraw Profit Dividends</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Disburse profits directly to your Bank Account or UPI handle.
                </p>
              </div>

              {withdrawSuccess ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-5 rounded-2xl text-center space-y-2"
                >
                  <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 animate-bounce" />
                  <h4 className="font-bold text-sm">Withdrawal Request Logged!</h4>
                  <p className="text-[11px] leading-relaxed">
                    We have received your withdrawal request. Our team will verify and process the transaction. Payouts complete within 1-3 hours.
                  </p>
                </motion.div>
              ) : (
                <>
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex justify-between items-center text-xs">
                    <span className="text-slate-500">Withdrawable Profits:</span>
                    <strong className="text-amber-400 font-bold font-mono text-sm">₹{availableProfit}</strong>
                  </div>

                  {/* Amount Field */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400">Withdrawal Amount (₹)</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 font-bold font-mono">
                        ₹
                      </span>
                      <input
                        type="number"
                        required
                        min="300"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-primary focus:outline-none rounded-2xl py-3 pl-8 pr-4 text-xs font-mono font-bold text-slate-200"
                        placeholder="Minimum ₹300"
                      />
                    </div>
                  </div>

                  {/* Payout Channel Option */}
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 block">Payout Destination</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setWithdrawMethod('upi')}
                        className={`py-2 rounded-xl border text-center text-xs font-semibold cursor-pointer transition-all ${
                          withdrawMethod === 'upi'
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-slate-950 border-slate-850 text-slate-400'
                        }`}
                      >
                        UPI ID Handle
                      </button>
                      <button
                        type="button"
                        onClick={() => setWithdrawMethod('bank')}
                        className={`py-2 rounded-xl border text-center text-xs font-semibold cursor-pointer transition-all ${
                          withdrawMethod === 'bank'
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-slate-950 border-slate-850 text-slate-400'
                        }`}
                      >
                        Bank Account
                      </button>
                    </div>
                  </div>

                  {/* DYNAMIC FORMS BASED ON CHOSEN PAYOUT */}
                  {withdrawMethod === 'upi' ? (
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400">Your UPI ID</label>
                      <input
                        type="text"
                        required
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-primary focus:outline-none rounded-2xl py-3 px-4 text-xs text-slate-200 font-mono"
                        placeholder="e.g. mobile@upi"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3 p-3 bg-slate-950/60 rounded-2xl border border-slate-850">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500">Bank Name</label>
                          <input
                            type="text"
                            required
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-primary focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-200"
                            placeholder="State Bank of India"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500">IFSC Code</label>
                          <input
                            type="text"
                            required
                            value={ifscCode}
                            onChange={(e) => setIfscCode(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-primary focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-200 font-mono uppercase"
                            placeholder="SBIN0001234"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500">Account Number</label>
                        <input
                          type="text"
                          required
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-primary focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-200 font-mono"
                          placeholder="3029108310321"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-2xl text-xs tracking-wide shadow-lg active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isProcessing ? 'Submitting...' : 'Confirm Disbursal'}
                  </button>
                </>
              )}
            </form>
          </motion.div>
        )}

        {/* LEDGER HISTORY PANEL */}
        {activeSubTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3 animate-fade-in"
          >
            {/* Filter buttons */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {[
                { label: 'All', val: 'all' },
                { label: 'Deposits', val: 'deposit' },
                { label: 'Withdrawals', val: 'withdrawal' },
                { label: 'Mining', val: 'mining_profit' }
              ].map(tab => (
                <button
                  key={tab.val}
                  onClick={() => setFilterType(tab.val as any)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide border shrink-0 transition-all cursor-pointer ${
                    filterType === tab.val
                      ? 'bg-slate-800 text-slate-100 border-slate-700'
                      : 'bg-slate-900/50 text-slate-500 border-slate-850'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-500 text-xs">
                No transactions logged in this category.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTransactions.map(tx => {
                  const isPositive = ['deposit', 'mining_profit', 'referral_commission', 'signup_bonus'].includes(tx.type);
                  
                  return (
                    <div key={tx.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex justify-between items-center text-xs">
                      <div className="flex gap-3">
                        <div className={`p-2 rounded-xl border ${
                          isPositive 
                            ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10' 
                            : 'bg-rose-500/5 text-rose-500 border-rose-500/10'
                        }`}>
                          {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-200 uppercase text-[11px]">
                            {tx.type.replace('_', ' ')}
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">{tx.remarks}</p>
                          <span className="text-[9px] text-slate-500 block font-mono mt-1">
                            {new Date(tx.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`font-mono font-bold text-sm ${isPositive ? 'text-emerald-400' : 'text-slate-300'}`}>
                          {isPositive ? '+' : '-'}₹{tx.amount}
                        </span>
                        
                        {/* Status badge */}
                        <span className={`block text-[9px] font-bold font-mono mt-1 uppercase ${
                          tx.status === 'completed' || tx.status === 'approved'
                            ? 'text-emerald-500'
                            : tx.status === 'pending'
                            ? 'text-amber-500'
                            : 'text-rose-500'
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. PAYMENT GATEWAY POPUP DRAWER (FOR UPI DEPOSIT SPECIFICATION) */}
      <AnimatePresence>
        {showGateway && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowGateway(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
              >
                <LAND_X className="w-4 h-4" />
              </button>

              <div className="text-center space-y-1.5">
                <Shield className="w-8 h-8 text-emerald-500 mx-auto animate-pulse" />
                <h3 className="text-md font-display font-bold text-slate-100">Secure UPI Gateway</h3>
                <p className="text-[11px] text-slate-400">
                  Scan QR code or copy the UPI handle below to deposit <strong className="text-primary font-bold">₹{rechargeAmount}</strong>
                </p>
              </div>

              {rechargeSuccess ? (
                <div className="py-6 text-center space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
                  <h4 className="font-bold text-sm text-slate-200">Recharge Request Logged</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    UTR logged successfully. Your deposit balance will update once verified on the blockchain and banking network ledger.
                  </p>
                </div>
              ) : (
                <>
                  {/* Real QR code via QR Server API */}
                  <div className="bg-white p-3 rounded-2xl w-44 h-44 mx-auto flex items-center justify-center shadow-lg border border-slate-800">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=8144553816@ybl&pn=Mining Energy&am=${rechargeAmount}&cu=INR`)}`}
                      alt="UPI QR Code"
                      className="w-full h-full rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Copy Handle Box */}
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">UPI MERCHANT</span>
                      <strong className="text-slate-200 font-mono">8144553816@ybl</strong>
                    </div>
                    <button
                      onClick={copyUpiToClipboard}
                      className="p-2 bg-slate-900 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-200"
                    >
                      {copiedUpi ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* UTR reference input code */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <label className="text-xs text-slate-400">Transaction Reference UTR / TXID</label>
                      <span className="text-[9px] text-amber-500 font-semibold">Required</span>
                    </div>
                    <input
                      type="text"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      placeholder="Enter 12-digit UPI UTR / Reference No."
                      className="w-full bg-slate-950 border border-slate-800 focus:border-primary focus:outline-none rounded-2xl py-3 px-4 text-xs font-mono tracking-wider text-slate-100"
                    />
                    <span className="text-[9px] text-slate-500 leading-normal block">
                      ⚠️ Payment cannot be processed without pasting the correct UTR from your bank transaction receipt.
                    </span>
                  </div>

                  {/* Submit UTR */}
                  <button
                    onClick={handleConfirmRecharge}
                    disabled={isProcessing}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-2xl text-xs tracking-wide active:scale-95 transition-all cursor-pointer"
                  >
                    {isProcessing ? 'Verifying payment...' : 'Confirm Transaction'}
                  </button>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Inline fallback for close icon
function LAND_X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
