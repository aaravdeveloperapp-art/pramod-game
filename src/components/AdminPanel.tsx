import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, Users, Landmark, Landmark as Bank, QrCode, Cpu, Plus, 
  HelpCircle, CheckCircle, XCircle, Search, Save, MessageSquare, 
  ChevronRight, ArrowLeft, RefreshCw, AlertTriangle, Sparkles, TrendingUp
} from 'lucide-react';
import { User, Transaction, SupportTicket, InvestmentPlan } from '../types';
import { api } from '../api';

interface AdminPanelProps {
  currentUser: User;
}

export default function AdminPanel({ currentUser }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'kpis' | 'users' | 'recharges' | 'withdrawals' | 'tickets' | 'plans'>('kpis');
  const [kpis, setKpis] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [recharges, setRecharges] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  
  // Loading & refresh states
  const [loading, setLoading] = useState(false);
  
  // User edit state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserForm, setEditUserForm] = useState({
    status: 'active' as 'active' | 'suspended',
    kycStatus: 'unverified' as 'unverified' | 'pending' | 'verified',
    deposit_balance: 0,
    profit_balance: 0,
    bonus_balance: 0
  });

  // Ticket answer state
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [adminReplyMsg, setAdminReplyMsg] = useState('');

  // Plan creation state
  const [planForm, setPlanForm] = useState({
    name: '',
    category: 'normal' as 'normal' | 'vip',
    price: '',
    dailyIncome: '',
    durationDays: '45',
    maxPurchase: '2',
    description: '',
    image: ''
  });
  const [planSuccess, setPlanSuccess] = useState(false);

  // Search filter states
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'kpis') {
        const statsData = await api.getAdminStats();
        setKpis(statsData.stats);
      } else if (activeTab === 'users') {
        const usersData = await api.getAdminUsers();
        setUsers(usersData.users);
      } else if (activeTab === 'recharges') {
        const rechargesData = await api.getAdminRecharges();
        setRecharges(rechargesData.recharges);
      } else if (activeTab === 'withdrawals') {
        const withdrawalsData = await api.getAdminWithdrawals();
        setWithdrawals(withdrawalsData.withdrawals);
      } else if (activeTab === 'tickets') {
        const ticketsData = await api.getAdminTickets();
        setTickets(ticketsData.tickets);
      }
    } catch (err: any) {
      console.error('Error fetching admin data', err);
    } finally {
      setLoading(false);
    }
  };

  // Resolve recharges
  const handleResolveRecharge = async (txId: string, action: 'approve' | 'reject') => {
    if (!window.confirm(`Are you sure you want to ${action} this recharge request?`)) return;
    try {
      await api.resolveAdminRecharge(txId, action);
      alert(`Recharge request successfully ${action}d!`);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  // Resolve withdrawals
  const handleResolveWithdrawal = async (txId: string, action: 'approve' | 'reject') => {
    if (!window.confirm(`Are you sure you want to ${action} this withdrawal?`)) return;
    try {
      await api.resolveAdminWithdrawal(txId, action);
      alert(`Withdrawal request successfully ${action}d!`);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  // Edit user save
  const handleSelectUserEdit = (user: User) => {
    setEditingUser(user);
    setEditUserForm({
      status: user.status,
      kycStatus: user.kycStatus,
      deposit_balance: user.wallet.deposit_balance,
      profit_balance: user.wallet.profit_balance,
      bonus_balance: user.wallet.bonus_balance
    });
  };

  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      await api.updateAdminUser(editingUser.id, editUserForm);
      alert('User wallet balances and settings adjusted successfully!');
      setEditingUser(null);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Adjustment failed.');
    }
  };

  // Reply ticket admin
  const handleAdminReplyTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !adminReplyMsg.trim()) return;

    try {
      await api.replyAdminTicket(selectedTicket.id, adminReplyMsg);
      alert('Support reply dispatched successfully!');
      
      const updatedReplies = [...selectedTicket.replies];
      updatedReplies.push({
        sender: 'admin',
        message: adminReplyMsg,
        createdAt: new Date().toISOString()
      });
      
      setSelectedTicket({
        ...selectedTicket,
        status: 'replied',
        replies: updatedReplies
      });
      setAdminReplyMsg('');
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Could not reply.');
    }
  };

  // Plan creation submit
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, category, price, dailyIncome, durationDays, maxPurchase, description, image } = planForm;

    if (!name || !price || !dailyIncome || !durationDays) {
      alert('Please fill in all core plan configurations.');
      return;
    }

    try {
      await api.createAdminPlan({
        name,
        category,
        price: Number(price),
        dailyIncome: Number(dailyIncome),
        durationDays: Number(durationDays),
        maxPurchase: Number(maxPurchase),
        description,
        image
      });

      setPlanSuccess(true);
      setPlanForm({
        name: '',
        category: 'normal',
        price: '',
        dailyIncome: '',
        durationDays: '45',
        maxPurchase: '2',
        description: '',
        image: ''
      });

      setTimeout(() => {
        setPlanSuccess(false);
      }, 3500);
    } catch (err: any) {
      alert(err.message || 'Plan creation failed.');
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
      {/* HEADER BANNER */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full">
              System Admin
            </span>
            <h1 className="text-2xl font-display font-extrabold text-slate-100 tracking-tight flex items-center gap-2 mt-1">
              <ShieldAlert className="w-6 h-6 text-rose-500" />
              Mining Control Center
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Manage accounts, verify payments, approve bank withdrawals, and deploy custom plans.
            </p>
          </div>

          <button
            onClick={fetchAdminData}
            className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-850 hover:border-slate-700 text-slate-300 rounded-xl flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* ADMIN PANEL NAVIGATION */}
      <div className="flex gap-1.5 overflow-x-auto bg-slate-950 p-1 border border-slate-900 rounded-2xl">
        {[
          { id: 'kpis', label: 'Dashboard Stats' },
          { id: 'users', label: 'User Records' },
          { id: 'recharges', label: 'Deposits Verification' },
          { id: 'withdrawals', label: 'Withdrawal Settlements' },
          { id: 'tickets', label: 'Support Tickets' },
          { id: 'plans', label: 'Miner Architect' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4.5 py-2.5 rounded-xl font-bold text-xs tracking-wide shrink-0 transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-rose-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT MOUNT */}
      <AnimatePresence mode="wait">
        {/* TAB 1: KPIS STATS */}
        {activeTab === 'kpis' && kpis && (
          <motion.div
            key="kpis"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1 */}
              <div className="bg-slate-900 border border-slate-850 p-4 rounded-3xl">
                <span className="text-[10px] text-slate-500 block uppercase font-mono font-bold">Teammate Users</span>
                <strong className="text-2xl font-display font-extrabold text-slate-100 block mt-1">{kpis.totalUsers}</strong>
                <p className="text-[9px] text-slate-500 mt-2">Active accounts excluding admins</p>
              </div>
              {/* Card 2 */}
              <div className="bg-slate-900 border border-slate-850 p-4 rounded-3xl">
                <span className="text-[10px] text-slate-500 block uppercase font-mono font-bold">Deployed Nodes</span>
                <strong className="text-2xl font-display font-extrabold text-rose-400 block mt-1">{kpis.activeInvestments}</strong>
                <p className="text-[9px] text-slate-500 mt-2">Active running energy plans</p>
              </div>
              {/* Card 3 */}
              <div className="bg-slate-900 border border-slate-850 p-4 rounded-3xl">
                <span className="text-[10px] text-slate-500 block uppercase font-mono font-bold">Total Deposited</span>
                <strong className="text-2xl font-display font-extrabold text-emerald-400 block mt-1">₹{kpis.totalDeposits}</strong>
                <p className="text-[9px] text-emerald-500 mt-2">Verified bank inflows</p>
              </div>
              {/* Card 4 */}
              <div className="bg-slate-900 border border-slate-850 p-4 rounded-3xl">
                <span className="text-[10px] text-slate-500 block uppercase font-mono font-bold">Total Disbursed</span>
                <strong className="text-2xl font-display font-extrabold text-indigo-400 block mt-1">₹{kpis.totalWithdrawals}</strong>
                <p className="text-[9px] text-indigo-400 mt-2">Verified completed payouts</p>
              </div>
            </div>

            {/* Verification Queues Alert banner */}
            <div className="bg-slate-900 border border-slate-850 rounded-3xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-200">Pending System Queues</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div 
                  onClick={() => setActiveTab('recharges')} 
                  className="bg-slate-950 hover:bg-slate-850 hover:border-slate-750 border border-slate-850 p-4 rounded-2xl cursor-pointer text-center space-y-1"
                >
                  <span className="text-2xl font-extrabold font-mono text-amber-500 block">{kpis.pendingRechargesCount}</span>
                  <span className="text-xs font-semibold text-slate-300 block">Pending Recharges</span>
                  <span className="text-[10px] text-slate-500 block">Verify deposited UTR logs</span>
                </div>
                <div 
                  onClick={() => setActiveTab('withdrawals')} 
                  className="bg-slate-950 hover:bg-slate-850 hover:border-slate-750 border border-slate-850 p-4 rounded-2xl cursor-pointer text-center space-y-1"
                >
                  <span className="text-2xl font-extrabold font-mono text-rose-500 block">{kpis.pendingWithdrawalsCount}</span>
                  <span className="text-xs font-semibold text-slate-300 block">Pending Withdrawals</span>
                  <span className="text-[10px] text-slate-500 block">Payout requests awaiting disburse</span>
                </div>
                <div 
                  onClick={() => setActiveTab('tickets')} 
                  className="bg-slate-950 hover:bg-slate-850 hover:border-slate-750 border border-slate-850 p-4 rounded-2xl cursor-pointer text-center space-y-1"
                >
                  <span className="text-2xl font-extrabold font-mono text-indigo-400 block">{kpis.openTicketsCount}</span>
                  <span className="text-xs font-semibold text-slate-300 block">Open Tickets</span>
                  <span className="text-[10px] text-slate-500 block">Unresolved support chats</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: USER RECORDS DATABASE */}
        {activeTab === 'users' && (
          <motion.div
            key="users"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {editingUser ? (
              /* USER EDITOR FORM */
              <div className="bg-slate-900 border border-slate-850 p-5 rounded-3xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-200">Adjust Account: {editingUser.fullName}</h3>
                  <button 
                    onClick={() => setEditingUser(null)}
                    className="text-xs font-bold text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" /> Cancel
                  </button>
                </div>

                <form onSubmit={handleSaveUserEdit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Status selection */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500">Account status</label>
                      <select
                        value={editUserForm.status}
                        onChange={(e) => setEditUserForm({ ...editUserForm, status: e.target.value as any })}
                        className="w-full bg-slate-950 border border-slate-850 focus:border-rose-500 focus:outline-none rounded-xl py-2 px-3 text-slate-200"
                      >
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>

                    {/* KYC status selection */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500">KYC verification</label>
                      <select
                        value={editUserForm.kycStatus}
                        onChange={(e) => setEditUserForm({ ...editUserForm, kycStatus: e.target.value as any })}
                        className="w-full bg-slate-950 border border-slate-850 focus:border-rose-500 focus:outline-none rounded-xl py-2 px-3 text-slate-200"
                      >
                        <option value="unverified">Unverified</option>
                        <option value="pending">Verification Pending</option>
                        <option value="verified">Verified Profile</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {/* Deposit */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold">Deposit Wallet balance</label>
                      <input
                        type="number"
                        value={editUserForm.deposit_balance}
                        onChange={(e) => setEditUserForm({ ...editUserForm, deposit_balance: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-850 focus:border-rose-500 focus:outline-none rounded-xl py-2 px-3 text-slate-200 font-mono"
                      />
                    </div>

                    {/* Profit */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold font-mono">Profit Wallet balance</label>
                      <input
                        type="number"
                        value={editUserForm.profit_balance}
                        onChange={(e) => setEditUserForm({ ...editUserForm, profit_balance: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-850 focus:border-rose-500 focus:outline-none rounded-xl py-2 px-3 text-slate-200 font-mono"
                      />
                    </div>

                    {/* Bonus */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold">Bonus Wallet balance</label>
                      <input
                        type="number"
                        value={editUserForm.bonus_balance}
                        onChange={(e) => setEditUserForm({ ...editUserForm, bonus_balance: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-850 focus:border-rose-500 focus:outline-none rounded-xl py-2 px-3 text-slate-200 font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-lg shadow-rose-500/20"
                  >
                    <Save className="w-4 h-4" /> Save Adjustments
                  </button>
                </form>
              </div>
            ) : (
              /* USER RECORDS TABLE LIST */
              <>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search users by name, email or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-850 focus:border-rose-500 focus:outline-none rounded-2xl py-2.5 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500"
                  />
                </div>

                <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden divide-y divide-slate-850/60">
                  {users
                    .filter(u => u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()) || u.mobile.includes(searchQuery))
                    .map(u => (
                      <div key={u.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-200 text-sm">{u.fullName}</h4>
                            <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-sm ${u.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                              {u.status.toUpperCase()}
                            </span>
                            <span className="text-[9px] text-slate-500 font-semibold uppercase">KYC: {u.kycStatus}</span>
                          </div>
                          
                          <p className="text-slate-400 mt-1">
                            Email: {u.email} • Mobile: {u.mobile}
                          </p>
                          
                          {/* Mini ledger display */}
                          <div className="flex gap-2.5 mt-2 text-[10px] font-mono text-slate-500">
                            <span>Dep: <strong className="text-slate-300">₹{u.wallet.deposit_balance}</strong></span>
                            <span>|</span>
                            <span>Prof: <strong className="text-slate-300">₹{u.wallet.profit_balance}</strong></span>
                            <span>|</span>
                            <span>Bonus: <strong className="text-slate-300">₹{u.wallet.bonus_balance}</strong></span>
                            <span>|</span>
                            <span>Referral: <strong className="text-slate-300">₹{u.wallet.referral_balance}</strong></span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleSelectUserEdit(u)}
                          className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-850 rounded-xl font-bold hover:text-rose-400 transition-all shrink-0 self-start sm:self-center cursor-pointer"
                        >
                          Adjust User
                        </button>
                      </div>
                    ))}
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* TAB 3: DEPOSIT APPROVALS QUEUE */}
        {activeTab === 'recharges' && (
          <motion.div
            key="recharges"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden divide-y divide-slate-850">
              {recharges.length === 0 ? (
                <p className="p-8 text-center text-slate-500 text-xs">No deposits logged.</p>
              ) : (
                recharges.map(tx => (
                  <div key={tx.id} className="p-4 flex flex-col md:flex-row justify-between md:items-center gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-sm text-slate-200">₹{tx.amount}</strong>
                        <span className={`text-[8px] uppercase font-bold font-mono px-2 py-0.5 rounded-full ${
                          tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : tx.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-950 text-slate-600'
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                      <p className="text-slate-400">
                        Teammate: <strong className="text-slate-300">{tx.userName}</strong> ({tx.userEmail})
                      </p>
                      <p className="text-slate-400 font-mono">
                        UTR Ref: <strong className="text-indigo-400 font-semibold">{tx.paymentReference || 'N/A'}</strong>
                      </p>
                      <span className="text-[9px] text-slate-500 block font-mono">
                        UTR Submited: {new Date(tx.createdAt).toLocaleString()}
                      </span>
                    </div>

                    {tx.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleResolveRecharge(tx.id, 'reject')}
                          className="px-3 py-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                        <button
                          onClick={() => handleResolveRecharge(tx.id, 'approve')}
                          className="px-3 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Verify & Approve
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 4: WITHDRAWAL SETTLEMENTS */}
        {activeTab === 'withdrawals' && (
          <motion.div
            key="withdrawals"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden divide-y divide-slate-850">
              {withdrawals.length === 0 ? (
                <p className="p-8 text-center text-slate-500 text-xs">No withdrawals requested.</p>
              ) : (
                withdrawals.map(tx => (
                  <div key={tx.id} className="p-4 flex flex-col md:flex-row justify-between md:items-center gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-sm text-slate-200">₹{tx.amount}</strong>
                        <span className={`text-[8px] uppercase font-bold font-mono px-2 py-0.5 rounded-full ${
                          tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : tx.status === 'pending' ? 'bg-amber-500/10 text-amber-500 animate-pulse' : 'bg-slate-950 text-slate-600'
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                      <p className="text-slate-400">
                        Teammate: <strong className="text-slate-300">{tx.userName}</strong> ({tx.userEmail})
                      </p>
                      
                      {/* Bank / UPI Details */}
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850/40 text-[11px] space-y-1 font-mono">
                        {tx.upiId ? (
                          <p className="text-slate-300">UPI Destination: <strong className="text-indigo-400">{tx.upiId}</strong></p>
                        ) : (
                          <>
                            <p className="text-slate-300">Bank Destination: <strong className="text-indigo-400">{tx.bankName}</strong></p>
                            <p className="text-slate-300">Account No: <strong className="text-indigo-400">{tx.accountNumber}</strong></p>
                            <p className="text-slate-300">IFSC Code: <strong className="text-indigo-400 uppercase">{tx.ifsc}</strong></p>
                          </>
                        )}
                      </div>

                      <span className="text-[9px] text-slate-500 block font-mono">
                        Requested: {new Date(tx.createdAt).toLocaleString()}
                      </span>
                    </div>

                    {tx.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleResolveWithdrawal(tx.id, 'reject')}
                          className="px-3 py-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject & Return
                        </button>
                        <button
                          onClick={() => handleResolveWithdrawal(tx.id, 'approve')}
                          className="px-3 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Approve & Payout
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 5: SUPPORT TICKETS LIST */}
        {activeTab === 'tickets' && (
          <motion.div
            key="tickets"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {selectedTicket ? (
              /* ADMIN CHAT DIALOG */
              <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden flex flex-col justify-between">
                <div className="bg-slate-950 p-4 border-b border-slate-850 flex justify-between items-center text-xs">
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="flex items-center gap-2 font-bold text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Ticket Feed
                  </button>
                  <span className="text-[10px] uppercase font-bold font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                    Ticket ID: {selectedTicket.id.toUpperCase()}
                  </span>
                </div>

                <div className="p-5 h-72 overflow-y-auto space-y-4 text-xs">
                  <div className="bg-slate-950 p-4 border border-slate-850 rounded-2xl">
                    <span className="text-[9px] uppercase font-bold text-rose-400">User Query Subject</span>
                    <h4 className="font-bold text-slate-200 mt-1">{selectedTicket.subject}</h4>
                    <p className="text-slate-400 mt-1 leading-normal">{selectedTicket.message}</p>
                    <span className="text-[8px] text-slate-500 block font-mono mt-2">
                      Submitter Email: {selectedTicket.userEmail}
                    </span>
                  </div>

                  {/* Thread message logs */}
                  {selectedTicket.replies.slice(1).map((reply, idx) => {
                    const isSystem = reply.sender === 'admin';
                    return (
                      <div 
                        key={idx} 
                        className={`flex flex-col ${isSystem ? 'items-end' : 'items-start'}`}
                      >
                        <div className={`max-w-[80%] rounded-2xl p-3 border ${
                          isSystem 
                            ? 'bg-rose-500/10 border-rose-500/20 text-slate-100 rounded-tr-none' 
                            : 'bg-slate-850 border-slate-800 text-slate-200 rounded-tl-none'
                        }`}>
                          <span className="text-[8px] uppercase tracking-widest font-mono font-bold block mb-1 text-slate-500">
                            {isSystem ? 'Admin System reply' : 'Teammate user'}
                          </span>
                          <p>{reply.message}</p>
                          <span className="text-[8px] text-slate-500 font-mono block text-right mt-1.5">
                            {new Date(reply.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <form onSubmit={handleAdminReplyTicket} className="bg-slate-950 p-3 border-t border-slate-850 flex gap-2">
                  <input
                    type="text"
                    required
                    value={adminReplyMsg}
                    onChange={(e) => setAdminReplyMsg(e.target.value)}
                    placeholder="Type your official administrative support response..."
                    className="flex-1 bg-slate-900 border border-slate-800 focus:border-rose-500 focus:outline-none rounded-2xl py-3 px-4 text-xs text-slate-200"
                  />
                  <button
                    type="submit"
                    disabled={!adminReplyMsg.trim()}
                    className="px-5 py-3 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer"
                  >
                    Reply
                  </button>
                </form>
              </div>
            ) : (
              /* TICKETS LIST */
              <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden divide-y divide-slate-850">
                {tickets.length === 0 ? (
                  <p className="p-8 text-center text-slate-500 text-xs">No active tickets.</p>
                ) : (
                  tickets.map(ticket => (
                    <button
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className="w-full p-4 hover:bg-slate-850 text-left text-xs flex justify-between items-center transition-all cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <strong className="text-slate-200 text-sm">{ticket.subject}</strong>
                          <span className="text-[8px] uppercase font-mono bg-slate-950 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded-sm">
                            {ticket.category}
                          </span>
                        </div>
                        <p className="text-slate-400 truncate w-60 sm:w-80">{ticket.message}</p>
                        <span className="text-[9px] text-slate-500 font-mono block mt-1">
                          Opened by: {ticket.userEmail} • Total repls: {ticket.replies.length}
                        </span>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className={`text-[9px] font-bold font-mono uppercase px-2 py-0.5 rounded-full ${
                          ticket.status === 'open' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {ticket.status}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 6: MINING PLAN ARCHITECT */}
        {activeTab === 'plans' && (
          <motion.div
            key="plans"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-slate-900 border border-slate-850 p-5 rounded-3xl space-y-4"
          >
            <div>
              <h3 className="text-sm font-bold text-slate-200">Deploy New Mining Plan</h3>
              <p className="text-xs text-slate-500 mt-1">
                Configure energy hardware miners to release directly into the User Shop.
              </p>
            </div>

            {planSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-emerald-400 text-xs text-center flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span>New mining plan compiled and deployed successfully! Visible in hardware shop instantly.</span>
              </div>
            )}

            <form onSubmit={handleCreatePlan} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Plan name */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500">Plan Name</label>
                  <input
                    type="text"
                    required
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-rose-500 focus:outline-none rounded-xl py-2 px-3 text-slate-200"
                    placeholder="e.g. Geothermal Core G2"
                  />
                </div>

                {/* category */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500">Mining Class (Normal / VIP)</label>
                  <select
                    value={planForm.category}
                    onChange={(e) => setPlanForm({ ...planForm, category: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-rose-500 focus:outline-none rounded-xl py-2 px-3 text-slate-200"
                  >
                    <option value="normal">Normal Miner Node</option>
                    <option value="vip">VIP Premium Node</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Price */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold">Lease Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-rose-500 focus:outline-none rounded-xl py-2 px-3 text-slate-200 font-mono"
                    placeholder="1500"
                  />
                </div>

                {/* Daily return */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold">Daily Return (₹)</label>
                  <input
                    type="number"
                    required
                    value={planForm.dailyIncome}
                    onChange={(e) => setPlanForm({ ...planForm, dailyIncome: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-rose-500 focus:outline-none rounded-xl py-2 px-3 text-slate-200 font-mono"
                    placeholder="68"
                  />
                </div>

                {/* Duration */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500">Rental Term (Days)</label>
                  <input
                    type="number"
                    required
                    value={planForm.durationDays}
                    onChange={(e) => setPlanForm({ ...planForm, durationDays: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-rose-500 focus:outline-none rounded-xl py-2 px-3 text-slate-200 font-mono"
                  />
                </div>

                {/* Max Purchase */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500">Purchase Limit</label>
                  <input
                    type="number"
                    required
                    value={planForm.maxPurchase}
                    onChange={(e) => setPlanForm({ ...planForm, maxPurchase: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-rose-500 focus:outline-none rounded-xl py-2 px-3 text-slate-200 font-mono"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500">Description</label>
                <textarea
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-rose-500 focus:outline-none rounded-xl py-2 px-3 text-slate-200 leading-normal"
                  placeholder="e.g. Utilizes volcanic geothermal thermal core ASIC clusters."
                />
              </div>

              {/* Image URL */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500">Node Banner Image URL (Optional)</label>
                <input
                  type="url"
                  value={planForm.image}
                  onChange={(e) => setPlanForm({ ...planForm, image: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-rose-500 focus:outline-none rounded-xl py-2 px-3 text-slate-200"
                  placeholder="https://images.unsplash.com/photo-..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-lg shadow-rose-500/20"
              >
                <Plus className="w-4 h-4" /> Deploy Plan to Storefront
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
