import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cpu, ShoppingCart, Wallet, Users, HelpCircle, User, ShieldAlert,
  Menu, X, Sparkles, LogOut, Bell, Play, ShieldCheck, ChevronRight
} from 'lucide-react';

import { api, getToken, removeToken } from './api';
import { User as UserType, InvestmentPlan, Investment, Transaction, SupportTicket, Announcement, AppBanner } from './types';

// Component Imports
import AuthModal from './components/AuthModal';
import DashboardHome from './components/DashboardHome';
import InvestmentShop from './components/InvestmentShop';
import WalletPanel from './components/WalletPanel';
import ReferralPanel from './components/ReferralPanel';
import SupportPanel from './components/SupportPanel';
import ProfilePanel from './components/ProfilePanel';
import AdminPanel from './components/AdminPanel';

export default function App() {
  const [user, setUser] = useState<UserType | null>(null);
  const [token, setToken] = useState<string | null>(getToken());
  
  // App data logs
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [banners, setBanners] = useState<AppBanner[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [teamData, setTeamData] = useState<any>({
    level1: [],
    level2: [],
    level3: [],
    commissionSummary: { totalEarned: 0, referralCode: 'ME0000', directInvites: 0 }
  });

  // UI state managers
  const [activeTab, setActiveTab] = useState<string>('home');
  const [appLoading, setAppLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Success alert states
  const [simulationHarvestAlert, setSimulationHarvestAlert] = useState<{
    show: boolean;
    amount: number;
  }>({ show: false, amount: 0 });

  // On mount and token changes
  useEffect(() => {
    if (token) {
      loadAllPortalData();
    } else {
      setAppLoading(false);
    }
  }, [token]);

  const loadAllPortalData = async () => {
    setAppLoading(true);
    try {
      // 1. Fetch user profile
      const profileRes = await api.getProfile();
      setUser(profileRes.user);

      // 2. Fetch all other structural data in parallel
      const [
        plansRes, investmentsRes, transactionsRes, 
        ticketsRes, teamRes, homeContentRes
      ] = await Promise.all([
        api.getPlans(),
        api.getInvestments(),
        api.getTransactions(),
        api.getTickets(),
        api.getTeamStats(),
        api.getHomeContent()
      ]);

      setPlans(plansRes.plans);
      setInvestments(investmentsRes.investments);
      setTransactions(transactionsRes.transactions);
      setTickets(ticketsRes.tickets);
      setTeamData(teamRes);
      setBanners(homeContentRes.banners);
      setAnnouncements(homeContentRes.announcements);
    } catch (err: any) {
      console.error('Error fetching data, logging out session...', err);
      handleLogout();
    } finally {
      setAppLoading(false);
    }
  };

  const handleAuthSuccess = (newToken: string, authedUser: UserType) => {
    setToken(newToken);
    setUser(authedUser);
    loadAllPortalData();
  };

  const handleLogout = () => {
    removeToken();
    setToken(null);
    setUser(null);
    setActiveTab('home');
  };

  // User lease purchase callback
  const handleBuyPlan = async (planId: string) => {
    setIsProcessing(true);
    try {
      const res = await api.buyPlan(planId);
      // Reload updated states
      await loadAllPortalData();
      alert(`Miner Node deployed successfully! ${res.investment.planName} is now live and harvesting.`);
    } catch (err: any) {
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  // Wallet recharge callback
  const handleRechargeWallet = async (amount: number, method: string, reference: string) => {
    setIsProcessing(true);
    try {
      await api.rechargeWallet(amount, method, reference);
      await loadAllPortalData();
    } catch (err: any) {
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  // Wallet withdrawal callback
  const handleWithdrawWallet = async (payload: any) => {
    setIsProcessing(true);
    try {
      await api.withdrawWallet(payload);
      await loadAllPortalData();
    } catch (err: any) {
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  // Support ticket creator callback
  const handleCreateTicket = async (payload: any) => {
    setIsProcessing(true);
    try {
      await api.createTicket(payload);
      const ticketsRes = await api.getTickets();
      setTickets(ticketsRes.tickets);
    } catch (err: any) {
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  // Support ticket reply callback
  const handleReplyTicket = async (ticketId: string, message: string) => {
    try {
      await api.replyTicket(ticketId, message);
      const ticketsRes = await api.getTickets();
      setTickets(ticketsRes.tickets);
    } catch (err: any) {
      throw err;
    }
  };

  // Fast-Forward daily returns simulation
  const handleSimulateDayMining = async () => {
    setIsSimulating(true);
    try {
      const res = await api.simulateMiningDay();
      
      // Calculate earnings accrued during this single fast-forward step
      const activeMiners = investments.filter(inv => inv.status === 'active');
      const yieldHarvested = activeMiners.reduce((sum, inv) => sum + inv.dailyIncome, 0);

      // Trigger visual alert
      setSimulationHarvestAlert({ show: true, amount: yieldHarvested });

      // Refresh all lists
      await loadAllPortalData();
    } catch (err: any) {
      alert(err.message || 'Simulation calibration error');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleUpdateProfileLocal = (updatedUser: UserType) => {
    setUser(updatedUser);
  };

  // Loading animation overlay
  if (appLoading) {
    return (
      <div className="min-h-screen bg-[#070A13] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="relative">
          <Cpu className="w-12 h-12 text-primary animate-spin" />
          <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full" />
        </div>
        <h2 className="text-md font-display font-bold text-slate-100 tracking-wide">
          Decrypting Financial Nodes...
        </h2>
        <p className="text-xs text-slate-500 font-mono">
          Securing safe mining handshakes. Please wait.
        </p>
      </div>
    );
  }

  // Not authed -> AuthModal
  if (!user) {
    return <AuthModal onAuthSuccess={handleAuthSuccess} />;
  }

  // Define shell layouts
  const NAV_ITEMS = [
    { id: 'home', label: 'Dashboard', icon: Cpu },
    { id: 'shop', label: 'Energy Shop', icon: ShoppingCart },
    { id: 'wallet', label: 'Wallet Node', icon: Wallet },
    { id: 'team', label: 'Referrals', icon: Users },
    { id: 'support', label: 'Help Desk', icon: HelpCircle },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  if (user.role === 'admin') {
    NAV_ITEMS.push({ id: 'admin', label: 'Mining Center', icon: ShieldAlert });
  }

  return (
    <div className="min-h-screen bg-[#070A13] text-slate-200 flex flex-col lg:flex-row">
      
      {/* 1. LEFT SIDEBAR NAVIGATION (DESKTOP) */}
      <aside className="hidden lg:flex flex-col justify-between w-64 bg-slate-950 border-r border-slate-900 p-5 shrink-0 select-none">
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-2 py-1">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-display font-extrabold tracking-tight text-slate-100 uppercase">
                Mining Energy
              </h1>
              <span className="text-[9px] uppercase tracking-wider font-mono text-slate-500 font-bold">
                Ledger Workspace
              </span>
            </div>
          </div>

          {/* User mini badge */}
          <div className="bg-slate-900 border border-slate-850 p-3 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-850 border border-slate-700 flex items-center justify-center font-bold text-primary">
              {user.fullName.charAt(0)}
            </div>
            <div className="truncate">
              <h4 className="text-xs font-bold text-slate-200 truncate">{user.fullName}</h4>
              <span className="text-[9px] text-slate-500 block truncate font-mono uppercase">
                {user.role} Account
              </span>
            </div>
          </div>

          {/* Nav List */}
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4.5 py-3.5 rounded-2xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                    isActive
                      ? 'bg-primary text-white shadow-lg shadow-primary/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  <IconComp className="w-4 h-4 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4.5 py-3.5 text-slate-500 hover:text-rose-400 rounded-2xl text-xs font-semibold cursor-pointer transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout Session
        </button>
      </aside>

      {/* 2. TOP NAVBAR (MOBILE ONLY) */}
      <header className="lg:hidden bg-slate-950 border-b border-slate-900 px-4 py-3 flex justify-between items-center z-40 sticky top-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
            <Cpu className="w-4.5 h-4.5" />
          </div>
          <h1 className="text-xs font-display font-extrabold tracking-tight text-slate-100 uppercase">
            MINING ENERGY
          </h1>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 bg-slate-900 hover:bg-slate-850 rounded-lg text-slate-300"
        >
          {mobileMenuOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
        </button>
      </header>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-slate-950 border-b border-slate-900 absolute top-14 left-0 right-0 z-30 overflow-hidden divide-y divide-slate-900 select-none shadow-2xl"
          >
            <div className="p-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const IconComp = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <IconComp className="w-4 h-4 shrink-0" />
                    {item.label}
                  </button>
                );
              })}
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-rose-500 text-xs font-semibold cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Logout Session
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. MAIN PORTAL WINDOW SHELL */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* Dynamic Simulation notification alert */}
        <AnimatePresence>
          {simulationHarvestAlert.show && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="bg-emerald-500/10 border-2 border-emerald-500/20 text-emerald-400 p-5 rounded-3xl text-xs max-w-lg mx-auto flex items-start gap-4 shadow-xl shadow-emerald-500/5 relative"
            >
              <div className="p-2 bg-emerald-500/15 text-emerald-500 rounded-2xl shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5 animate-bounce" />
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-accent animate-pulse" />
                  Mining Dividends Harvested!
                </h3>
                <p className="leading-relaxed text-[11px] text-slate-300">
                  Daily hardware simulations successful. Rigs accrued <strong className="text-emerald-400 font-extrabold font-mono text-sm">₹{simulationHarvestAlert.amount}</strong> in passive yields which were credited directly to your profit ledger.
                </p>
              </div>
              <button
                onClick={() => setSimulationHarvestAlert({ show: false, amount: 0 })}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Router Switch */}
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <DashboardHome
              user={user}
              investments={investments}
              announcements={announcements}
              banners={banners}
              onNavigate={setActiveTab}
              onSimulateDay={handleSimulateDayMining}
              isSimulating={isSimulating}
            />
          )}

          {activeTab === 'shop' && (
            <InvestmentShop
              user={user}
              plans={plans}
              onBuyPlan={handleBuyPlan}
              isProcessing={isProcessing}
            />
          )}

          {activeTab === 'wallet' && (
            <WalletPanel
              user={user}
              transactions={transactions}
              onRecharge={handleRechargeWallet}
              onWithdraw={handleWithdrawWallet}
              isProcessing={isProcessing}
              onRefresh={loadAllPortalData}
            />
          )}

          {activeTab === 'team' && (
            <ReferralPanel
              user={user}
              teamData={teamData}
            />
          )}

          {activeTab === 'support' && (
            <SupportPanel
              user={user}
              tickets={tickets}
              onCreateTicket={handleCreateTicket}
              onReplyTicket={handleReplyTicket}
              isProcessing={isProcessing}
            />
          )}

          {activeTab === 'profile' && (
            <ProfilePanel
              user={user}
              onLogout={handleLogout}
              onUpdateUser={handleUpdateProfileLocal}
            />
          )}

          {activeTab === 'admin' && user.role === 'admin' && (
            <AdminPanel
              currentUser={user}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
