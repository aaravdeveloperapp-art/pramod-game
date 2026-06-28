import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HelpCircle, MessageSquare, ChevronDown, Plus, Send, Landmark, 
  Clock, CheckCircle, ArrowLeft, AlertCircle, PhoneCall
} from 'lucide-react';
import { User, SupportTicket } from '../types';

interface SupportPanelProps {
  user: User;
  tickets: SupportTicket[];
  onCreateTicket: (payload: any) => Promise<void>;
  onReplyTicket: (ticketId: string, message: string) => Promise<void>;
  isProcessing: boolean;
}

const FAQS = [
  {
    q: 'How does Mining Energy passive income work?',
    a: 'When you lease a mining node (like Solar S1 or Hydro H1), we configure dedicated ASIC and GPU cloud servers operated with clean energy grids. The returns are calculated automatically based on mining yields and credited straight to your Withdrawable balance every 24 hours.'
  },
  {
    q: 'What is the difference between Normal and VIP Miner Plans?',
    a: 'Normal plans are general entry-level rigs available to everyone. VIP plans offer much higher daily yields and ROI percentages, but are subject to lower purchase limits (max 1 unit) and require higher lease capital.'
  },
  {
    q: 'How long do recharges and withdrawals take to settle?',
    a: 'Recharge requests are verified within 10-20 minutes after you submit the bank Transaction Reference / UTR receipt. Withdrawal requests are processed by bank settlement teams on the same day, taking usually less than 1-3 hours.'
  },
  {
    q: 'What is the minimum deposit and withdrawal limit?',
    a: 'The minimum recharge amount is ₹300, and the minimum withdrawal limit is ₹300. Payouts can be disbursed to Bank Accounts or UPI IDs.'
  },
  {
    q: 'Are multi-level referral commissions active?',
    a: 'Yes! We support a 3-tier commission payout: Level 1 direct invite yields 10%, Level 2 yields 5%, and Level 3 yields 2% on their mining plan purchases. Commissions credit instantly.'
  }
];

export default function SupportPanel({
  user,
  tickets,
  onCreateTicket,
  onReplyTicket,
  isProcessing
}: SupportPanelProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // Create form fields
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');

  // Reply fields
  const [replyMessage, setReplyMessage] = useState('');

  const toggleFaq = (idx: number) => {
    setActiveFaq(activeFaq === idx ? null : idx);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) {
      alert('Please fill in both the subject and the support message.');
      return;
    }

    try {
      await onCreateTicket({ subject, category, message });
      setSubject('');
      setMessage('');
      setShowCreateForm(false);
    } catch (err: any) {
      alert(err.message || 'Could not submit ticket.');
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;

    try {
      await onReplyTicket(selectedTicket.id, replyMessage);
      
      // Update local state ticket replies instantly
      const updatedTicket = { ...selectedTicket };
      updatedTicket.replies.push({
        sender: 'user',
        message: replyMessage,
        createdAt: new Date().toISOString()
      });
      setSelectedTicket(updatedTicket);
      setReplyMessage('');
    } catch (err: any) {
      alert(err.message || 'Could not reply.');
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
      {/* 1. SOCIAL SHORTCUTS HEADER */}
      <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-primary" />
            24/7 Help Center
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Need assist with transactions or hardware configurations? Reach out to support channels directly.
          </p>
        </div>

        {/* Telegram WhatsApp floating links */}
        <div className="flex gap-2 w-full md:w-auto">
          <a
            href="https://t.me/miningenergy_support"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#229ED9]/10 hover:bg-[#229ED9]/20 text-[#229ED9] border border-[#229ED9]/25 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" />
            Telegram Support
          </a>
          <a
            href="https://wa.me/919999999999"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/25 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            WhatsApp Chat
          </a>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {selectedTicket ? (
          /* TICKET CONVERSATION CHAT VIEW */
          <motion.div
            key="chat"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden flex flex-col justify-between"
          >
            {/* Chat header */}
            <div className="bg-slate-950 p-4 border-b border-slate-850 flex justify-between items-center">
              <button
                onClick={() => setSelectedTicket(null)}
                className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Tickets
              </button>
              
              <div className="text-right">
                <span className={`text-[9px] uppercase font-bold font-mono px-2 py-0.5 rounded-md ${
                  selectedTicket.status === 'open' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                }`}>
                  Status: {selectedTicket.status}
                </span>
              </div>
            </div>

            {/* Chat Messages scroll area */}
            <div className="p-5 h-80 overflow-y-auto space-y-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-1">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">TICKET DETAIL</span>
                <h4 className="text-xs font-bold text-slate-200">Subject: {selectedTicket.subject}</h4>
                <p className="text-xs text-slate-400 mt-1">{selectedTicket.message}</p>
                <span className="text-[8px] text-slate-500 block font-mono pt-1">
                  Opened: {new Date(selectedTicket.createdAt).toLocaleString()}
                </span>
              </div>

              {/* Thread Messages */}
              {selectedTicket.replies.slice(1).map((reply, idx) => {
                const isAdmin = reply.sender === 'admin';
                return (
                  <div 
                    key={idx} 
                    className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                  >
                    <div className={`max-w-[80%] rounded-2xl p-3.5 text-xs border ${
                      isAdmin 
                        ? 'bg-slate-850 border-slate-800 text-slate-200 rounded-tl-none' 
                        : 'bg-primary/10 border-primary/20 text-slate-100 rounded-tr-none'
                    }`}>
                      <span className={`text-[8px] uppercase tracking-widest font-bold font-mono block mb-1 ${
                        isAdmin ? 'text-primary' : 'text-slate-500'
                      }`}>
                        {isAdmin ? '🛡️ Customer Care Support' : 'Me (You)'}
                      </span>
                      <p className="leading-relaxed">{reply.message}</p>
                      <span className="text-[8px] font-mono text-slate-500 block text-right mt-1.5">
                        {new Date(reply.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chat inputs */}
            <form onSubmit={handleReplySubmit} className="bg-slate-950 p-4 border-t border-slate-850 flex gap-2">
              <input
                type="text"
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your message reply..."
                className="flex-1 bg-slate-900 border border-slate-800 focus:border-primary focus:outline-none rounded-2xl py-3 px-4 text-xs text-slate-200"
              />
              <button
                type="submit"
                disabled={isProcessing || !replyMessage.trim()}
                className="p-3.5 bg-primary hover:bg-primary-dark text-white rounded-2xl cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <Send className="w-4 h-4 fill-current" />
              </button>
            </form>
          </motion.div>
        ) : (
          /* SUPPORT TICKET LIST & FAQS */
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* LEFT 2 COLS: TICKET CENTER */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-md font-display font-bold text-slate-100 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-400" />
                  Your Active Support Tickets
                </h3>
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="px-3.5 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  New Ticket
                </button>
              </div>

              {/* Dynamic Support Ticket Form */}
              <AnimatePresence>
                {showCreateForm && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl"
                  >
                    <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500">Subject / Query Title</label>
                          <input
                            type="text"
                            required
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 focus:border-primary focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-200"
                            placeholder="e.g. My UPI Recharge Pending"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500">Query Category</label>
                          <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-850 focus:border-primary focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-200"
                          >
                            <option value="recharge">Recharge Deposit Issue</option>
                            <option value="withdraw">Withdrawal Disbursal Query</option>
                            <option value="hardware">Mining Node Hardware</option>
                            <option value="general">General Account Help</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500">Support Message</label>
                        <textarea
                          required
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          rows={3}
                          className="w-full bg-slate-950 border border-slate-850 focus:border-primary focus:outline-none rounded-xl py-2 px-3 text-xs text-slate-200 leading-normal"
                          placeholder="Describe your issue with transaction IDs, dates or hardware name..."
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowCreateForm(false)}
                          className="flex-1 py-2 rounded-xl border border-slate-800 text-xs font-semibold text-slate-500 hover:bg-slate-800 cursor-pointer"
                        >
                          Discard
                        </button>
                        <button
                          type="submit"
                          disabled={isProcessing}
                          className="flex-1 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-all cursor-pointer"
                        >
                          {isProcessing ? 'Submitting...' : 'Submit Support Ticket'}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tickets list */}
              {tickets.length === 0 ? (
                <div className="bg-slate-900 border border-slate-850 rounded-3xl p-10 text-center flex flex-col items-center justify-center">
                  <div className="p-3 bg-slate-800 text-slate-600 rounded-full mb-3">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-300">No support tickets logged</h4>
                  <p className="text-[10px] text-slate-500 mt-1 max-w-xs">
                    All support queries are logged as secure bank tickets. Create a new ticket if you have any issues!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tickets.map(ticket => (
                    <button
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-850 hover:border-slate-700 p-4 rounded-2xl flex justify-between items-center text-left text-xs transition-all cursor-pointer"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200">{ticket.subject}</span>
                          <span className="text-[9px] uppercase bg-slate-950 px-2 py-0.5 rounded-md text-slate-400 font-mono">
                            {ticket.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate w-60 sm:w-80">{ticket.message}</p>
                        <span className="text-[9px] text-slate-500 block font-mono">
                          Ticket ID: {ticket.id.toUpperCase()} • Created: {new Date(ticket.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="text-right flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-[9px] uppercase font-bold font-mono px-2.5 py-0.5 rounded-full ${
                          ticket.status === 'open' 
                            ? 'bg-amber-500/10 text-amber-500' 
                            : ticket.status === 'replied'
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            : 'bg-slate-950 text-slate-500'
                        }`}>
                          {ticket.status}
                        </span>
                        <span className="text-[9px] text-slate-500 font-bold block mt-1">
                          {ticket.replies.length} messages
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT 1 COL: FAQS ACCORDION */}
            <div className="space-y-4">
              <h3 className="text-md font-display font-bold text-slate-100 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-accent" />
                Frequently Asked FAQs
              </h3>

              <div className="space-y-2.5">
                {FAQS.map((faq, idx) => {
                  const isOpen = activeFaq === idx;
                  return (
                    <div 
                      key={idx} 
                      className="bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden"
                    >
                      <button
                        onClick={() => toggleFaq(idx)}
                        className="w-full p-4 flex justify-between items-center text-left text-xs font-bold text-slate-200 cursor-pointer"
                      >
                        <span className="mr-3 leading-relaxed">{faq.q}</span>
                        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 pt-0 border-t border-slate-850/40 text-xs text-slate-400 leading-relaxed font-normal">
                              {faq.a}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
