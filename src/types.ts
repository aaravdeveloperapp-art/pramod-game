export interface Wallet {
  deposit_balance: number;   // Balance from recharges, used to buy plans
  profit_balance: number;    // Balance earned from mining, can be withdrawn
  bonus_balance: number;     // Signup/Referral rewards
  referral_balance: number;  // Direct level commissions earned
  frozen_balance: number;    // Pending withdrawals or locked amounts
  total_balance: number;
}

export interface User {
  id: string;
  fullName: string;
  mobile: string;
  email: string;
  passwordHash: string;
  avatar: string;
  role: 'user' | 'admin';
  referralCode: string;
  referredBy?: string; // ID of referrer
  wallet: Wallet;
  status: 'active' | 'suspended';
  kycStatus: 'unverified' | 'pending' | 'verified';
  createdAt: string;
  lastLogin?: string;
}

export interface InvestmentPlan {
  id: string;
  name: string;
  category: 'normal' | 'vip';
  image: string;
  price: number;
  dailyIncome: number;
  durationDays: number;
  totalIncome: number;
  roiPercentage: number;
  maxPurchase: number;
  description: string;
  isActive: boolean;
}

export interface Investment {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  purchaseAmount: number;
  dailyIncome: number;
  totalIncome: number;
  earnedIncome: number;
  durationDays: number;
  startDate: string;
  endDate: string;
  lastClaimDate: string; // Dynamic tracking for daily earnings
  status: 'active' | 'completed' | 'cancelled';
}

export interface DailyEarning {
  id: string;
  userId: string;
  investmentId: string;
  planName: string;
  amount: number;
  date: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'investment' | 'mining_profit' | 'referral_commission' | 'signup_bonus';
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  remarks: string;
  createdAt: string;
  // Specific details
  upiId?: string;
  accountNumber?: string;
  bankName?: string;
  ifsc?: string;
  paymentReference?: string;
}

export interface ReferralLog {
  id: string;
  referrerId: string; // The person getting the commission
  referredUserId: string; // The person who joined/bought
  referredUserName: string;
  level: 1 | 2 | 3;
  investmentId?: string;
  commissionAmount: number;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  subject: string;
  category: string;
  message: string;
  status: 'open' | 'replied' | 'closed';
  replies: {
    sender: 'user' | 'admin';
    message: string;
    createdAt: string;
  }[];
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface AppBanner {
  id: string;
  title: string;
  image: string;
  link: string;
}
