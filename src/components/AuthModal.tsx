import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, Mail, Smartphone, UserPlus, LogIn, Sparkles, 
  ChevronRight, AlertTriangle, Cpu, ShieldCheck, KeyRound
} from 'lucide-react';
import { api } from '../api';

interface AuthModalProps {
  onAuthSuccess: (token: string, user: any) => void;
}

export default function AuthModal({ onAuthSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');

  // OTP Verification Stage
  const [otpStage, setOtpStage] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);
  const [pendingRegisterPayload, setPendingRegisterPayload] = useState<any>(null);

  // OTP countdown effect
  useEffect(() => {
    let timer: any;
    if (otpStage && otpTimer > 0) {
      timer = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpStage, otpTimer]);

  // Handle URL Referral params automatically!
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setReferralCode(ref);
      setIsLogin(false); // Direct referred people to Registration flow
    }
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isLogin) {
        // LOGIN FLOW
        const res = await api.login({ email, password });
        onAuthSuccess(res.token, res.user);
      } else {
        // REGISTRATION FLOW (with dynamic OTP stage trigger)
        const payload = {
          fullName,
          email,
          mobile,
          password,
          referralCode: referralCode || undefined
        };
        setPendingRegisterPayload(payload);
        setOtpStage(true);
        setOtpTimer(60);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 4) {
      setErrorMsg('Please enter a valid 4-digit verification code.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // Create user on backend
      const res = await api.register({
        ...pendingRegisterPayload,
        otp: otpCode
      });
      onAuthSuccess(res.token, res.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = () => {
    setOtpTimer(60);
    setOtpCode('');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-[#070A13] flex items-center justify-center p-4 grid-dots">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl shadow-primary/5 flex flex-col justify-between relative"
      >
        {/* Top Glow bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-indigo-500" />

        {/* 1. BRAND HEADER */}
        <div className="p-6 pb-4 text-center border-b border-slate-850 bg-slate-950/40 relative">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/25 mb-3">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-xl font-display font-extrabold text-slate-100 tracking-tight">
            MINING ENERGY
          </h2>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-mono font-bold">
            Clean Energy Crypto Investments
          </p>
        </div>

        {/* 2. CORE PANE MOUNT */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3.5 rounded-2xl flex gap-2"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {otpStage ? (
              /* OTP VERIFICATION VIEW */
              <motion.form
                key="otp-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleVerifyOtpSubmit}
                className="space-y-4"
              >
                <div className="text-center space-y-1">
                  <KeyRound className="w-8 h-8 text-accent mx-auto" />
                  <h3 className="text-sm font-bold text-slate-200">Verify SMS OTP</h3>
                  <p className="text-xs text-slate-500 leading-normal">
                    We sent a mock 4-digit SMS verification passcode to your mobile phone <strong className="text-slate-300 font-semibold">{mobile}</strong>.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-500 block">Verification Passcode</label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter 4-digit OTP (e.g. 1234)"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-primary focus:outline-none rounded-2xl py-3.5 px-4 text-center font-bold tracking-widest text-lg font-mono text-primary"
                  />
                </div>

                {/* Submit OTP */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-2xl text-xs tracking-wide transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Authenticating...' : 'Verify & Launch Portal'}
                </button>

                {/* Countdown / Resend */}
                <div className="text-center text-xs">
                  {otpTimer > 0 ? (
                    <span className="text-slate-500 font-mono">
                      Resend OTP in {otpTimer}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="text-primary hover:text-primary-dark font-semibold font-mono cursor-pointer"
                    >
                      Resend OTP Code
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setOtpStage(false)}
                  className="w-full text-center text-[10px] text-slate-500 hover:text-slate-400 font-medium cursor-pointer"
                >
                  Change Account Details
                </button>
              </motion.form>
            ) : (
              /* LOGIN OR REGISTER CARD */
              <motion.form
                key="auth-fields"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleAuthSubmit}
                className="space-y-4"
              >
                {/* LOGIN VS REGISTER TABS */}
                <div className="grid grid-cols-2 bg-slate-950 p-1 border border-slate-850 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(true);
                      setErrorMsg('');
                    }}
                    className={`py-2 rounded-xl font-bold text-xs tracking-wide transition-all cursor-pointer ${
                      isLogin ? 'bg-primary text-white shadow-xs' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Login Handle
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(false);
                      setErrorMsg('');
                    }}
                    className={`py-2 rounded-xl font-bold text-xs tracking-wide transition-all cursor-pointer ${
                      !isLogin ? 'bg-primary text-white shadow-xs' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                {/* Full name (register only) */}
                {!isLogin && (
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-500 block">Full Name</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-primary focus:outline-none rounded-2xl py-2.5 px-4 text-xs text-slate-200"
                      placeholder="e.g. Ramesh Kumar"
                    />
                  </div>
                )}

                {/* Email (both) */}
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500 block">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-primary focus:outline-none rounded-2xl py-2.5 px-4 text-xs text-slate-200"
                    placeholder="name@domain.com"
                  />
                </div>

                {/* Mobile (register only) */}
                {!isLogin && (
                  <div className="space-y-1">
                    <label className="text-[11px] text-slate-500 block">Mobile Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-primary focus:outline-none rounded-2xl py-2.5 px-4 text-xs text-slate-200"
                      placeholder="e.g. 9876543210"
                    />
                  </div>
                )}

                {/* Password (both) */}
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500 block">Secure Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-primary focus:outline-none rounded-2xl py-2.5 px-4 text-xs text-slate-200"
                    placeholder="••••••••"
                  />
                </div>

                {/* Referral (register optional) */}
                {!isLogin && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] text-slate-500 block">Referral Code</label>
                      <span className="text-[9px] text-slate-600 font-semibold uppercase">Optional</span>
                    </div>
                    <input
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-primary focus:outline-none rounded-2xl py-2.5 px-4 text-xs text-primary font-mono uppercase tracking-widest font-extrabold"
                      placeholder="e.g. ME1234"
                    />
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-2xl text-xs tracking-wide transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1"
                >
                  {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  {loading ? 'Processing...' : isLogin ? 'Sign-In to Workspace' : 'Send Verification OTP'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* 3. TRUST EMBLEM FOOTER */}
        <div className="p-4 bg-slate-950/40 border-t border-slate-850 flex items-center justify-center gap-2 text-[10px] text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>AES-256 Bit Secured Financial Node Encryptions Active</span>
        </div>
      </motion.div>
    </div>
  );
}
