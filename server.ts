import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { readDb, writeDb, DatabaseState, initializeFirestoreDb } from './server/db';
import { 
  User, Investment, DailyEarning, Transaction, 
  ReferralLog, SupportTicket, InvestmentPlan, Announcement 
} from './src/types';

// Extend Express Request type to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

async function startServer() {
  // Initialize cloud database connection in background (non-blocking)
  initializeFirestoreDb()
    .then(() => {
      console.log('[Firestore] Cloud database initialization completed.');
    })
    .catch(err => {
      console.error('[Firestore] Background cloud database initialization failed:', err);
    });

  const app = express();
  const PORT = 3000;

  // JSON and URL parsing body middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Helper function to extract user from bearer token (token structure is simple "session_userId")
  const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.substring(7);
    if (!token.startsWith('session_')) {
      return next();
    }
    
    const userId = token.replace('session_', '');
    const db = readDb();
    const user = db.users.find(u => u.id === userId);
    
    if (user && user.status === 'active') {
      req.user = user;
    }
    next();
  };

  app.use(authenticateUser);

  // Require Auth middleware
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    next();
  };

  // Require Admin middleware
  const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: Administrator privileges required' });
    }
    next();
  };

  // 1. HEALTHCHECK
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // 2. AUTHENTICATION ENDPOINTS
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { fullName, mobile, email, password, referralCode } = req.body;
    
    if (!fullName || !mobile || !email || !password) {
      return res.status(400).json({ error: 'Missing required registration details' });
    }

    const db = readDb();
    
    // Check if email or mobile exists
    if (db.users.find(u => u.email.toLowerCase() === email.toLowerCase() || u.mobile === mobile)) {
      return res.status(400).json({ error: 'Account with this email or mobile number already exists' });
    }

    // Process referral if any
    let referrer: User | undefined;
    if (referralCode) {
      referrer = db.users.find(u => u.referralCode.toLowerCase() === referralCode.toLowerCase());
      if (!referrer) {
        return res.status(400).json({ error: 'Invalid referral code' });
      }
    }

    const userId = 'user_' + Math.random().toString(36).substring(2, 9);
    const newReferralCode = 'MINE' + Math.floor(100000 + Math.random() * 900000);

    const newUser: User = {
      id: userId,
      fullName,
      mobile,
      email,
      passwordHash: password, // Cleartext password for simplicity in mock/preview environment
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`,
      role: 'user',
      referralCode: newReferralCode,
      referredBy: referrer?.id,
      wallet: {
        deposit_balance: 0,
        profit_balance: 0,
        bonus_balance: 100, // ₹100 Welcome Signup Bonus
        referral_balance: 0,
        frozen_balance: 0,
        total_balance: 100
      },
      status: 'active',
      kycStatus: 'unverified',
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);

    // Record welcome bonus transaction
    const welcomeTx: Transaction = {
      id: 'tx_' + Math.random().toString(36).substring(2, 9),
      userId,
      type: 'signup_bonus',
      amount: 100,
      status: 'completed',
      remarks: 'Welcome Signup Reward',
      createdAt: new Date().toISOString()
    };
    db.transactions.push(welcomeTx);

    // If referred, log referral relation
    if (referrer) {
      const referralLog: ReferralLog = {
        id: 'ref_' + Math.random().toString(36).substring(2, 9),
        referrerId: referrer.id,
        referredUserId: userId,
        referredUserName: fullName,
        level: 1,
        commissionAmount: 0, // Commission awarded when they make their first purchase
        createdAt: new Date().toISOString()
      };
      db.referrals.push(referralLog);
    }

    writeDb(db);
    res.json({ token: 'session_' + userId, user: newUser });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { loginKey, password } = req.body; // loginKey can be email or mobile
    
    if (!loginKey || !password) {
      return res.status(400).json({ error: 'Please enter both login credentials and password' });
    }

    const db = readDb();
    const user = db.users.find(u => 
      (u.email.toLowerCase() === loginKey.toLowerCase() || u.mobile === loginKey) && 
      u.passwordHash === password
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid login credentials or password' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'This account has been suspended. Please contact customer support.' });
    }

    // Update last login
    user.lastLogin = new Date().toISOString();
    writeDb(db);

    res.json({ token: 'session_' + user.id, user });
  });

  app.get('/api/auth/me', requireAuth, (req: Request, res: Response) => {
    // Return latest user object
    res.json({ user: req.user });
  });


  // 3. MINING PLANS
  app.get('/api/plans', (req: Request, res: Response) => {
    const db = readDb();
    res.json({ plans: db.plans.filter(p => p.isActive) });
  });

  // 4. USER INVESTMENTS (AND EARNINGS SIMULATION / UPDATE ON PAGE LOAD)
  app.get('/api/investments', requireAuth, (req: Request, res: Response) => {
    const db = readDb();
    const userId = req.user!.id;
    
    // Get user investments
    let userInvestments = db.investments.filter(inv => inv.userId === userId);
    
    // Dynamic claim cycle: If an investment has accrued daily return since lastClaimDate
    // we credit it in real-time. This ensures that even if background cron didn't run, 
    // loading the investments page correctly catches up and credits earnings!
    let updated = false;
    const now = new Date();
    
    userInvestments.forEach(inv => {
      if (inv.status === 'active') {
        const lastClaim = new Date(inv.lastClaimDate);
        const diffMs = now.getTime() - lastClaim.getTime();
        const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000)); // standard 24 hours
        
        if (diffDays > 0) {
          // Accrue profit for each day passed
          const daysToCredit = Math.min(diffDays, inv.durationDays - Math.floor(inv.earnedIncome / inv.dailyIncome));
          
          if (daysToCredit > 0) {
            const amountToCredit = daysToCredit * inv.dailyIncome;
            inv.earnedIncome += amountToCredit;
            inv.lastClaimDate = now.toISOString();
            
            if (inv.earnedIncome >= inv.totalIncome) {
              inv.status = 'completed';
            }

            // Create earnings records
            for (let i = 0; i < daysToCredit; i++) {
              const earnDate = new Date(lastClaim.getTime() + (i + 1) * 24 * 60 * 60 * 1000).toISOString();
              db.earnings.push({
                id: 'earn_' + Math.random().toString(36).substring(2, 9),
                userId,
                investmentId: inv.id,
                planName: inv.planName,
                amount: inv.dailyIncome,
                date: earnDate
              });
            }

            // Add mining profit transaction
            db.transactions.push({
              id: 'tx_' + Math.random().toString(36).substring(2, 9),
              userId,
              type: 'mining_profit',
              amount: amountToCredit,
              status: 'completed',
              remarks: `Mining profit accrued: ${inv.planName}`,
              createdAt: now.toISOString()
            });

            // Credit user wallet
            const userInDb = db.users.find(u => u.id === userId);
            if (userInDb) {
              userInDb.wallet.profit_balance += amountToCredit;
              userInDb.wallet.total_balance = 
                userInDb.wallet.deposit_balance + 
                userInDb.wallet.profit_balance + 
                userInDb.wallet.bonus_balance + 
                userInDb.wallet.referral_balance;
            }
            
            updated = true;
          }
        }
      }
    });

    if (updated) {
      writeDb(db);
      // Fetch latest profile state
      req.user = db.users.find(u => u.id === userId);
    }

    const earnings = db.earnings.filter(e => e.userId === userId).sort((a,b) => b.date.localeCompare(a.date));

    res.json({ 
      investments: userInvestments, 
      earnings,
      user: req.user
    });
  });

  // PURCHASE INVESTMENT PLAN
  app.post('/api/investments/buy', requireAuth, (req: Request, res: Response) => {
    const { planId } = req.body;
    if (!planId) {
      return res.status(400).json({ error: 'Please select a valid mining plan' });
    }

    const db = readDb();
    const plan = db.plans.find(p => p.id === planId && p.isActive);
    if (!plan) {
      return res.status(404).json({ error: 'Mining plan not found or inactive' });
    }

    const userId = req.user!.id;
    const userInDb = db.users.find(u => u.id === userId)!;

    // Check purchase limit
    const existingPurchases = db.investments.filter(inv => inv.userId === userId && inv.planId === planId);
    if (existingPurchases.length >= plan.maxPurchase) {
      return res.status(400).json({ error: `Maximum purchase limit reached. You can buy up to ${plan.maxPurchase} units of this plan.` });
    }

    // Check balance (first use deposit_balance, then bonus_balance, then profit_balance if needed)
    let amountNeeded = plan.price;
    const wallet = userInDb.wallet;
    const totalAvailable = wallet.deposit_balance + wallet.bonus_balance + wallet.profit_balance;

    if (totalAvailable < amountNeeded) {
      return res.status(400).json({ error: `Insufficient wallet balance. This plan costs ₹${plan.price}, but you only have ₹${totalAvailable}. Please recharge.` });
    }

    // Deduct balances systematically
    if (wallet.deposit_balance >= amountNeeded) {
      wallet.deposit_balance -= amountNeeded;
    } else {
      amountNeeded -= wallet.deposit_balance;
      wallet.deposit_balance = 0;

      if (wallet.bonus_balance >= amountNeeded) {
        wallet.bonus_balance -= amountNeeded;
      } else {
        amountNeeded -= wallet.bonus_balance;
        wallet.bonus_balance = 0;
        wallet.profit_balance -= amountNeeded;
      }
    }

    wallet.total_balance = wallet.deposit_balance + wallet.profit_balance + wallet.bonus_balance + wallet.referral_balance;

    // Create Active Investment
    const investmentId = 'inv_' + Math.random().toString(36).substring(2, 9);
    const now = new Date();
    const endDate = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    const newInvestment: Investment = {
      id: investmentId,
      userId,
      planId,
      planName: plan.name,
      purchaseAmount: plan.price,
      dailyIncome: plan.dailyIncome,
      totalIncome: plan.totalIncome,
      earnedIncome: 0,
      durationDays: plan.durationDays,
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      lastClaimDate: now.toISOString(),
      status: 'active'
    };

    db.investments.push(newInvestment);

    // Record Transaction
    db.transactions.push({
      id: 'tx_' + Math.random().toString(36).substring(2, 9),
      userId,
      type: 'investment',
      amount: plan.price,
      status: 'completed',
      remarks: `Purchased mining node: ${plan.name}`,
      createdAt: now.toISOString()
    });

    // Handle Referral Commissions
    // LEVEL 1: 10% on purchase price
    // LEVEL 2: 5% on purchase price
    // LEVEL 3: 2% on purchase price
    let currentReferrerId = userInDb.referredBy;
    let level: 1 | 2 | 3 = 1;

    while (currentReferrerId && level <= 3) {
      const commissionRates = { 1: 0.10, 2: 0.05, 3: 0.02 };
      const rate = commissionRates[level];
      const commissionAmt = Math.round(plan.price * rate);

      const referrer = db.users.find(u => u.id === currentReferrerId);
      if (referrer) {
        // Credit commission
        referrer.wallet.referral_balance += commissionAmt;
        referrer.wallet.total_balance = 
          referrer.wallet.deposit_balance + 
          referrer.wallet.profit_balance + 
          referrer.wallet.bonus_balance + 
          referrer.wallet.referral_balance;

        // Log referral commission log
        db.referrals.push({
          id: 'ref_' + Math.random().toString(36).substring(2, 9),
          referrerId: referrer.id,
          referredUserId: userId,
          referredUserName: userInDb.fullName,
          level,
          investmentId,
          commissionAmount: commissionAmt,
          createdAt: now.toISOString()
        });

        // Add transaction entry for referrer
        db.transactions.push({
          id: 'tx_' + Math.random().toString(36).substring(2, 9),
          userId: referrer.id,
          type: 'referral_commission',
          amount: commissionAmt,
          status: 'completed',
          remarks: `L${level} commission from ${userInDb.fullName}'s ${plan.name} purchase`,
          createdAt: now.toISOString()
        });

        currentReferrerId = referrer.referredBy;
        level = (level + 1) as 1 | 2 | 3;
      } else {
        break;
      }
    }

    writeDb(db);
    res.json({ message: 'Mining Node activated successfully!', user: userInDb, investment: newInvestment });
  });

  // TEST FUNCTION: SIMULATE 1 DAY ACCRUAL FAST-FORWARD (DEMO BUTTON)
  app.post('/api/investments/simulate-day', requireAuth, (req: Request, res: Response) => {
    const db = readDb();
    const userId = req.user!.id;
    const userInDb = db.users.find(u => u.id === userId)!;
    const userInvestments = db.investments.filter(inv => inv.userId === userId && inv.status === 'active');

    if (userInvestments.length === 0) {
      return res.status(400).json({ error: 'You have no active mining investments to simulate!' });
    }

    const now = new Date();
    let totalEarningsSimulated = 0;

    userInvestments.forEach(inv => {
      // Simulate 1 day worth of progress
      const daysEarned = Math.floor(inv.earnedIncome / inv.dailyIncome);
      if (daysEarned < inv.durationDays) {
        inv.earnedIncome += inv.dailyIncome;
        totalEarningsSimulated += inv.dailyIncome;
        
        // Push earning history log
        const simulatedDate = new Date(now.getTime() - Math.random() * 60000).toISOString();
        db.earnings.push({
          id: 'earn_' + Math.random().toString(36).substring(2, 9),
          userId,
          investmentId: inv.id,
          planName: inv.planName,
          amount: inv.dailyIncome,
          date: simulatedDate
        });

        // Add individual mining transaction
        db.transactions.push({
          id: 'tx_' + Math.random().toString(36).substring(2, 9),
          userId,
          type: 'mining_profit',
          amount: inv.dailyIncome,
          status: 'completed',
          remarks: `Simulated mining return: ${inv.planName}`,
          createdAt: simulatedDate
        });

        // Set status to complete if reached duration
        if (inv.earnedIncome >= inv.totalIncome) {
          inv.status = 'completed';
        }
        
        // Fast forward the last claim date
        inv.lastClaimDate = now.toISOString();
      }
    });

    if (totalEarningsSimulated > 0) {
      userInDb.wallet.profit_balance += totalEarningsSimulated;
      userInDb.wallet.total_balance = 
        userInDb.wallet.deposit_balance + 
        userInDb.wallet.profit_balance + 
        userInDb.wallet.bonus_balance + 
        userInDb.wallet.referral_balance;
      
      writeDb(db);
    }

    res.json({ 
      message: `Fast-Forward Successful! Accrued ₹${totalEarningsSimulated} from ${userInvestments.length} active nodes!`,
      user: userInDb,
      investments: db.investments.filter(inv => inv.userId === userId)
    });
  });


  // 5. RECHARGE WALLET (UPI OR CARD SLATE)
  app.post('/api/wallet/recharge', requireAuth, (req: Request, res: Response) => {
    const { amount, paymentMethod, paymentReference } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Please enter a valid recharge amount' });
    }

    if (!paymentReference) {
      return res.status(400).json({ error: 'Payment transaction reference/UTR is required' });
    }

    const db = readDb();
    const userId = req.user!.id;

    // Create a pending recharge request transaction
    const newRechargeTx: Transaction = {
      id: 'tx_' + Math.random().toString(36).substring(2, 9),
      userId,
      type: 'deposit',
      amount: Number(amount),
      status: 'pending',
      remarks: `Recharge wallet request via ${paymentMethod || 'UPI'}`,
      createdAt: new Date().toISOString(),
      paymentReference
    };

    db.transactions.push(newRechargeTx);
    writeDb(db);

    res.json({ 
      message: 'Recharge submitted successfully! Our administrators will verify your payment and credit your wallet within 10-30 minutes.',
      transaction: newRechargeTx 
    });
  });

  // WITHDRAW PROFITS
  app.post('/api/wallet/withdraw', requireAuth, (req: Request, res: Response) => {
    const { amount, paymentMethod, upiId, accountNumber, bankName, ifsc } = req.body;

    if (!amount || amount < 300) {
      return res.status(400).json({ error: 'Minimum withdrawal amount is ₹300' });
    }

    const db = readDb();
    const userId = req.user!.id;
    const userInDb = db.users.find(u => u.id === userId)!;

    // Check withdrawal balance (can withdraw from profit_balance or referral_balance)
    const availableToWithdraw = userInDb.wallet.profit_balance + userInDb.wallet.referral_balance;
    if (availableToWithdraw < amount) {
      return res.status(400).json({ error: `Insufficient profit balance. Available for withdrawal: ₹${availableToWithdraw}` });
    }

    // Deduct balance, add to frozen_balance during pending
    let amountToDeduct = amount;
    if (userInDb.wallet.profit_balance >= amountToDeduct) {
      userInDb.wallet.profit_balance -= amountToDeduct;
    } else {
      amountToDeduct -= userInDb.wallet.profit_balance;
      userInDb.wallet.profit_balance = 0;
      userInDb.wallet.referral_balance -= amountToDeduct;
    }

    userInDb.wallet.frozen_balance += Number(amount);
    userInDb.wallet.total_balance = 
      userInDb.wallet.deposit_balance + 
      userInDb.wallet.profit_balance + 
      userInDb.wallet.bonus_balance + 
      userInDb.wallet.referral_balance +
      userInDb.wallet.frozen_balance;

    // Create withdrawal request
    const withdrawTx: Transaction = {
      id: 'tx_' + Math.random().toString(36).substring(2, 9),
      userId,
      type: 'withdrawal',
      amount: Number(amount),
      status: 'pending',
      remarks: `Withdraw profits via ${paymentMethod}`,
      createdAt: new Date().toISOString(),
      upiId,
      accountNumber,
      bankName,
      ifsc
    };

    db.transactions.push(withdrawTx);
    writeDb(db);

    res.json({ 
      message: 'Withdrawal request submitted! Verification takes up to 1-3 hours, after which funds will hit your account.',
      user: userInDb,
      transaction: withdrawTx
    });
  });

  // TRANSACTIONS HISTORY
  app.get('/api/wallet/transactions', requireAuth, (req: Request, res: Response) => {
    const db = readDb();
    const userTxs = db.transactions
      .filter(tx => tx.userId === req.user!.id)
      .sort((a,b) => b.createdAt.localeCompare(a.createdAt));
    res.json({ transactions: userTxs });
  });


  // 6. REFERRAL / TEAM DATA
  app.get('/api/team', requireAuth, (req: Request, res: Response) => {
    const db = readDb();
    const userId = req.user!.id;

    // Multi-level team search
    // Level 1: Users referred directly by this user
    // Level 2: Users referred by Level 1 users
    // Level 3: Users referred by Level 2 users

    const level1Users = db.users.filter(u => u.referredBy === userId);
    const level1Ids = level1Users.map(u => u.id);

    const level2Users = db.users.filter(u => u.referredBy && level1Ids.includes(u.referredBy));
    const level2Ids = level2Users.map(u => u.id);

    const level3Users = db.users.filter(u => u.referredBy && level2Ids.includes(u.referredBy));

    // Calculate commissions generated
    const directCommissions = db.referrals.filter(r => r.referrerId === userId);
    const totalEarnedCommissions = directCommissions.reduce((sum, r) => sum + r.commissionAmount, 0);

    res.json({
      level1: level1Users.map(u => ({ id: u.id, fullName: u.fullName, createdAt: u.createdAt, status: u.status })),
      level2: level2Users.map(u => ({ id: u.id, fullName: u.fullName, createdAt: u.createdAt, status: u.status })),
      level3: level3Users.map(u => ({ id: u.id, fullName: u.fullName, createdAt: u.createdAt, status: u.status })),
      commissionSummary: {
        totalEarned: totalEarnedCommissions,
        referralCode: req.user!.referralCode,
        directInvites: level1Users.length
      }
    });
  });


  // 7. SUPPORT TICKETS
  app.get('/api/support/tickets', requireAuth, (req: Request, res: Response) => {
    const db = readDb();
    const userTickets = db.tickets.filter(t => t.userId === req.user!.id).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
    res.json({ tickets: userTickets });
  });

  app.post('/api/support/tickets', requireAuth, (req: Request, res: Response) => {
    const { subject, category, message } = req.body;
    if (!subject || !category || !message) {
      return res.status(400).json({ error: 'Please enter all support ticket details' });
    }

    const db = readDb();
    const ticketId = 'ticket_' + Math.random().toString(36).substring(2, 9);
    
    const newTicket: SupportTicket = {
      id: ticketId,
      userId: req.user!.id,
      userEmail: req.user!.email,
      subject,
      category,
      message,
      status: 'open',
      replies: [
        {
          sender: 'user',
          message,
          createdAt: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString()
    };

    db.tickets.push(newTicket);
    writeDb(db);

    res.json({ message: 'Support ticket submitted successfully! A support agent will respond shortly.', ticket: newTicket });
  });

  app.post('/api/support/tickets/:id/reply', requireAuth, (req: Request, res: Response) => {
    const { message } = req.body;
    const ticketId = req.params.id;

    if (!message) {
      return res.status(400).json({ error: 'Message content cannot be blank' });
    }

    const db = readDb();
    const ticket = db.tickets.find(t => t.id === ticketId && t.userId === req.user!.id);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Support ticket not found' });
    }

    ticket.status = 'open';
    ticket.replies.push({
      sender: 'user',
      message,
      createdAt: new Date().toISOString()
    });

    writeDb(db);
    res.json({ ticket });
  });


  // 8. SYSTEM HOME STATIC CONTENT (BANNERS & ANNOUNCEMENTS)
  app.get('/api/home/content', (req: Request, res: Response) => {
    const db = readDb();
    res.json({
      banners: db.banners,
      announcements: db.announcements
    });
  });


  // 9. ADMINISTRATOR APIS
  app.get('/api/admin/stats', requireAuth, requireAdmin, (req: Request, res: Response) => {
    const db = readDb();
    
    const totalUsers = db.users.filter(u => u.role !== 'admin').length;
    const activeInvestments = db.investments.filter(inv => inv.status === 'active').length;
    
    // Financial sums
    const totalDeposits = db.transactions
      .filter(tx => tx.type === 'deposit' && tx.status === 'completed')
      .reduce((sum, tx) => sum + tx.amount, 0);
      
    const totalWithdrawals = db.transactions
      .filter(tx => tx.type === 'withdrawal' && tx.status === 'completed')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const pendingRechargesCount = db.transactions.filter(tx => tx.type === 'deposit' && tx.status === 'pending').length;
    const pendingWithdrawalsCount = db.transactions.filter(tx => tx.type === 'withdrawal' && tx.status === 'pending').length;
    const openTicketsCount = db.tickets.filter(t => t.status !== 'closed').length;

    res.json({
      stats: {
        totalUsers,
        activeInvestments,
        totalDeposits,
        totalWithdrawals,
        pendingRechargesCount,
        pendingWithdrawalsCount,
        openTicketsCount
      }
    });
  });

  // GET ALL USERS FOR MANAGEMENT
  app.get('/api/admin/users', requireAuth, requireAdmin, (req: Request, res: Response) => {
    const db = readDb();
    res.json({ users: db.users.filter(u => u.role !== 'admin') });
  });

  // EDIT USER STATUS OR WALLET BALANCE
  app.put('/api/admin/users/:id', requireAuth, requireAdmin, (req: Request, res: Response) => {
    const userId = req.params.id;
    const { status, deposit_balance, profit_balance, bonus_balance, kycStatus } = req.body;

    const db = readDb();
    const user = db.users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ error: 'User account not found' });
    }

    if (status) user.status = status;
    if (kycStatus) user.kycStatus = kycStatus;
    
    let balanceAdjusted = false;
    
    if (deposit_balance !== undefined) {
      user.wallet.deposit_balance = Number(deposit_balance);
      balanceAdjusted = true;
    }
    if (profit_balance !== undefined) {
      user.wallet.profit_balance = Number(profit_balance);
      balanceAdjusted = true;
    }
    if (bonus_balance !== undefined) {
      user.wallet.bonus_balance = Number(bonus_balance);
      balanceAdjusted = true;
    }

    if (balanceAdjusted) {
      user.wallet.total_balance = 
        user.wallet.deposit_balance + 
        user.wallet.profit_balance + 
        user.wallet.bonus_balance + 
        user.wallet.referral_balance +
        user.wallet.frozen_balance;

      // Add audit adjustment transaction
      db.transactions.push({
        id: 'tx_' + Math.random().toString(36).substring(2, 9),
        userId,
        type: 'signup_bonus', // General system ledger adjustment
        amount: 0,
        status: 'completed',
        remarks: 'Wallet balance adjusted by Admin',
        createdAt: new Date().toISOString()
      });
    }

    writeDb(db);
    res.json({ message: 'User settings and wallet adjusted successfully', user });
  });

  // GET ALL RECHARGE REQUESTS
  app.get('/api/admin/recharges', requireAuth, requireAdmin, (req: Request, res: Response) => {
    const db = readDb();
    const recharges = db.transactions
      .filter(tx => tx.type === 'deposit')
      .sort((a,b) => b.createdAt.localeCompare(a.createdAt));
      
    // Attach user names
    const rechargesWithUser = recharges.map(r => {
      const u = db.users.find(usr => usr.id === r.userId);
      return {
        ...r,
        userName: u ? u.fullName : 'Unknown User',
        userEmail: u ? u.email : 'N/A'
      };
    });

    res.json({ recharges: rechargesWithUser });
  });

  // APPROVE / REJECT RECHARGE REQUEST
  app.post('/api/admin/recharges/:id/resolve', requireAuth, requireAdmin, (req: Request, res: Response) => {
    const txId = req.params.id;
    const { action } = req.body; // 'approve' or 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Valid action (approve or reject) is required' });
    }

    const db = readDb();
    const tx = db.transactions.find(t => t.id === txId && t.type === 'deposit');

    if (!tx) {
      return res.status(404).json({ error: 'Recharge transaction not found' });
    }

    if (tx.status !== 'pending') {
      return res.status(400).json({ error: 'This transaction is already resolved' });
    }

    const user = db.users.find(u => u.id === tx.userId);
    if (!user) {
      return res.status(404).json({ error: 'Associated user account not found' });
    }

    if (action === 'approve') {
      tx.status = 'completed';
      tx.remarks = `Recharge approved: ₹${tx.amount} credited to Deposit Wallet`;
      user.wallet.deposit_balance += tx.amount;
    } else {
      tx.status = 'rejected';
      tx.remarks = `Recharge rejected: Payment could not be verified.`;
    }

    user.wallet.total_balance = 
      user.wallet.deposit_balance + 
      user.wallet.profit_balance + 
      user.wallet.bonus_balance + 
      user.wallet.referral_balance +
      user.wallet.frozen_balance;

    writeDb(db);
    res.json({ message: `Recharge request successfully ${action}d.`, transaction: tx });
  });

  // GET ALL WITHDRAWAL REQUESTS
  app.get('/api/admin/withdrawals', requireAuth, requireAdmin, (req: Request, res: Response) => {
    const db = readDb();
    const withdrawals = db.transactions
      .filter(tx => tx.type === 'withdrawal')
      .sort((a,b) => b.createdAt.localeCompare(a.createdAt));
      
    const withdrawalsWithUser = withdrawals.map(w => {
      const u = db.users.find(usr => usr.id === w.userId);
      return {
        ...w,
        userName: u ? u.fullName : 'Unknown User',
        userEmail: u ? u.email : 'N/A'
      };
    });

    res.json({ withdrawals: withdrawalsWithUser });
  });

  // APPROVE / REJECT WITHDRAWAL
  app.post('/api/admin/withdrawals/:id/resolve', requireAuth, requireAdmin, (req: Request, res: Response) => {
    const txId = req.params.id;
    const { action } = req.body; // 'approve' or 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Valid action (approve or reject) is required' });
    }

    const db = readDb();
    const tx = db.transactions.find(t => t.id === txId && t.type === 'withdrawal');

    if (!tx) {
      return res.status(404).json({ error: 'Withdrawal transaction not found' });
    }

    if (tx.status !== 'pending') {
      return res.status(400).json({ error: 'This transaction is already resolved' });
    }

    const user = db.users.find(u => u.id === tx.userId);
    if (!user) {
      return res.status(404).json({ error: 'Associated user account not found' });
    }

    // Deduct from frozen wallet
    user.wallet.frozen_balance -= tx.amount;

    if (action === 'approve') {
      tx.status = 'completed';
      tx.remarks = `Withdrawal request verified and completed: ₹${tx.amount} disbursed successfully.`;
    } else {
      tx.status = 'rejected';
      tx.remarks = `Withdrawal request rejected by admin. Funds returned to Profit balance.`;
      user.wallet.profit_balance += tx.amount; // return funds to user
    }

    user.wallet.total_balance = 
      user.wallet.deposit_balance + 
      user.wallet.profit_balance + 
      user.wallet.bonus_balance + 
      user.wallet.referral_balance +
      user.wallet.frozen_balance;

    writeDb(db);
    res.json({ message: `Withdrawal request successfully ${action}d.`, transaction: tx });
  });

  // GET ALL SUPPORT TICKETS FOR ADMIN
  app.get('/api/admin/tickets', requireAuth, requireAdmin, (req: Request, res: Response) => {
    const db = readDb();
    res.json({ tickets: db.tickets.sort((a,b) => b.createdAt.localeCompare(a.createdAt)) });
  });

  // REPLY TO SUPPORT TICKET
  app.post('/api/admin/tickets/:id/reply', requireAuth, requireAdmin, (req: Request, res: Response) => {
    const ticketId = req.params.id;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message content cannot be blank' });
    }

    const db = readDb();
    const ticket = db.tickets.find(t => t.id === ticketId);

    if (!ticket) {
      return res.status(404).json({ error: 'Support ticket not found' });
    }

    ticket.status = 'replied';
    ticket.replies.push({
      sender: 'admin',
      message,
      createdAt: new Date().toISOString()
    });

    writeDb(db);
    res.json({ ticket });
  });

  // CREATE / MANAGE MINING PLANS (ADMIN)
  app.post('/api/admin/plans', requireAuth, requireAdmin, (req: Request, res: Response) => {
    const { name, category, image, price, dailyIncome, durationDays, maxPurchase, description } = req.body;

    if (!name || !price || !dailyIncome || !durationDays) {
      return res.status(400).json({ error: 'Missing core plan parameters' });
    }

    const db = readDb();
    const planId = 'plan_' + Math.random().toString(36).substring(2, 9);
    
    const totalIncome = Number(dailyIncome) * Number(durationDays);
    const roiPercentage = Math.round((totalIncome / Number(price)) * 100);

    const newPlan: InvestmentPlan = {
      id: planId,
      name,
      category: category || 'normal',
      image: image || 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&auto=format&fit=crop&q=60',
      price: Number(price),
      dailyIncome: Number(dailyIncome),
      durationDays: Number(durationDays),
      totalIncome,
      roiPercentage,
      maxPurchase: Number(maxPurchase) || 1,
      description: description || 'High yielding green crypto mining node.',
      isActive: true
    };

    db.plans.push(newPlan);
    writeDb(db);

    res.json({ message: 'Mining Plan created successfully', plan: newPlan });
  });

  // DELETE MINING PLAN (SOFT OR HARD)
  app.delete('/api/admin/plans/:id', requireAuth, requireAdmin, (req: Request, res: Response) => {
    const planId = req.params.id;
    const db = readDb();
    
    const plan = db.plans.find(p => p.id === planId);
    if (!plan) {
      return res.status(404).json({ error: 'Mining Plan not found' });
    }

    plan.isActive = false; // Soft delete
    writeDb(db);

    res.json({ message: 'Mining Plan removed successfully' });
  });


  // 10. VITE OR PRODUCTION BUILD MIDDLEWARE FALLBACK
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mining Energy backend server booting up...`);
    console.log(`Server listening on port ${PORT}`);
    console.log(`Running in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer();
