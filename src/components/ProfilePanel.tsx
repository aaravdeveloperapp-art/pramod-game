import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User as UserIcon, ShieldCheck, ShieldAlert, Award, Landmark, 
  ChevronRight, Lock, LogOut, Check, AlertCircle, Copy, FileText
} from 'lucide-react';
import { User } from '../types';
import { api } from '../api';

interface ProfilePanelProps {
  user: User;
  onLogout: () => void;
  onUpdateUser: (updatedUser: User) => void;
}

export default function ProfilePanel({
  user,
  onLogout,
  onUpdateUser
}: ProfilePanelProps) {
  const [showKycDrawer, setShowKycDrawer] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // KYC form states
  const [docType, setDocType] = useState('aadhaar');
  const [docNumber, setDocNumber] = useState('');
  const [docName, setDocName] = useState('');
  const [kycSubmitted, setKycSubmitted] = useState(false);

  // Password reset states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const copyUserId = () => {
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNumber || !docName) {
      alert('Please fill in your document details.');
      return;
    }

    try {
      // Simulate KYC upload by modifying client state and submitting update to user profile
      const updatedUser = { ...user, kycStatus: 'pending' as const };
      
      // Update in local state
      onUpdateUser(updatedUser);
      setKycSubmitted(true);
      setShowKycDrawer(false);
      
      // Send adjustment request through admin route to simulate KYC logging
      await api.updateAdminUser(user.id, { kycStatus: 'pending' });
    } catch (err: any) {
      alert(err.message || 'KYC submission failed');
    }
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;

    // Simulate password reset
    setResetSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setTimeout(() => {
      setResetSuccess(false);
    }, 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* 1. PROFILE AVATAR CARD */}
      <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-850 border border-slate-700 flex items-center justify-center font-display font-bold text-2xl text-primary ring-4 ring-primary/5">
            {user.fullName.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-slate-100">{user.fullName}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
            
            <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-2">
              <span className="text-[10px] text-slate-500 font-mono">ID: {user.id.toUpperCase()}</span>
              <button
                onClick={copyUserId}
                className="p-1 bg-slate-950 hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                {copiedId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        <div className="shrink-0">
          <button
            onClick={onLogout}
            className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Logout Account
          </button>
        </div>
      </div>

      {/* 2. KYC STATUS BANNER */}
      <div className="bg-slate-900 border border-slate-850 rounded-3xl p-5 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Identity Verification (KYC)
          </h3>
          
          <span className={`text-[9px] uppercase font-bold tracking-wider font-mono px-3 py-1 rounded-full ${
            user.kycStatus === 'verified'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : user.kycStatus === 'pending'
              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}>
            KYC: {user.kycStatus}
          </span>
        </div>

        {user.kycStatus === 'verified' ? (
          <p className="text-xs text-slate-400 leading-relaxed">
            Congratulations! Your identity document portfolio is verified and active. Daily withdrawal limitations raised to ₹10,000,000.
          </p>
        ) : user.kycStatus === 'pending' || kycSubmitted ? (
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl text-xs text-amber-400 leading-relaxed space-y-1">
            <h4 className="font-bold flex items-center gap-1">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Documents Uploaded & Pending Approvals
            </h4>
            <p>
              Your KYC request has been uploaded to administrative ledgers. Customer verification teams process standard approvals within 1 hour.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-400 leading-relaxed">
              Unlock maximum high-performance financial limits. Unverified user accounts are subject to withdrawal caps of ₹1,500. Securely log your ID to elevate tier profiles.
            </p>
            <button
              onClick={() => setShowKycDrawer(true)}
              className="px-4.5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              Verify KYC Account
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 3. SECURITY CREDENTIALS UPDATE */}
      <div className="bg-slate-900 border border-slate-850 rounded-3xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" />
          Update Account Password
        </h3>

        {resetSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-2xl text-emerald-400 text-xs text-center">
            ✓ Password reset simulation completed! Changes saved.
          </div>
        )}

        <form onSubmit={handlePasswordReset} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 focus:border-primary focus:outline-none rounded-xl py-2 px-3 text-slate-200"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500">New Secure Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 focus:border-primary focus:outline-none rounded-xl py-2 px-3 text-slate-200"
                placeholder="Minimum 6 characters"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-4.5 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-850 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Save Password changes
          </button>
        </form>
      </div>

      {/* 4. KYC DOCUMENT SIMULATION POPUP DRAWER */}
      <AnimatePresence>
        {showKycDrawer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowKycDrawer(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
              >
                <X_CLOSE className="w-4 h-4" />
              </button>

              <div className="text-center space-y-1.5">
                <FileText className="w-8 h-8 text-primary mx-auto" />
                <h3 className="text-md font-display font-bold text-slate-100">National KYC Upload</h3>
                <p className="text-[11px] text-slate-400">
                  Please specify your national verification documentation. Only JPG/PNG images and documents.
                </p>
              </div>

              <form onSubmit={handleKycSubmit} className="space-y-4 text-xs">
                {/* Doc selection */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500">Select Document Type</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-primary focus:outline-none rounded-xl py-2.5 px-3 text-slate-200"
                  >
                    <option value="aadhaar">Aadhaar National Card (UIDAI)</option>
                    <option value="pan">PAN Card (Income Tax Dept)</option>
                    <option value="voter">Voter Election ID</option>
                    <option value="passport">International Passport</option>
                  </select>
                </div>

                {/* Name on document */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500">Legal Name on Document</label>
                  <input
                    type="text"
                    required
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    placeholder="Enter full name exactly as printed"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-primary focus:outline-none rounded-xl py-2 px-3 text-slate-200"
                  />
                </div>

                {/* Document Number */}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500">Document / Identity ID Number</label>
                  <input
                    type="text"
                    required
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder="e.g. 12-digit Aadhaar / 10-digit PAN"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-primary focus:outline-none rounded-xl py-2 px-3 text-slate-200 font-mono uppercase"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-2xl tracking-wide transition-all cursor-pointer"
                >
                  Submit Identity Documents
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function X_CLOSE({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
