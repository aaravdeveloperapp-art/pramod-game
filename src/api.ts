import { 
  User, InvestmentPlan, Investment, DailyEarning, 
  Transaction, SupportTicket, Announcement, AppBanner 
} from './types';

const API_BASE = '/api';

export function getToken(): string | null {
  return localStorage.getItem('mining_session_token');
}

export function setToken(token: string) {
  localStorage.setItem('mining_session_token', token);
}

export function removeToken() {
  localStorage.removeItem('mining_session_token');
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `Error ${response.status}: ${response.statusText}`);
    }
    return data;
  } else {
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText || 'Error'} - ${text.substring(0, 100)}`);
    }
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
    }
  }
}

export const api = {
  // Auth
  register: async (payload: any) => {
    const data = await fetchWithAuth('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    setToken(data.token);
    return data;
  },

  login: async (payload: any) => {
    const data = await fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    setToken(data.token);
    return data;
  },

  getProfile: async () => {
    return fetchWithAuth('/auth/me');
  },

  logout: async () => {
    removeToken();
    return { success: true };
  },

  // Plans
  getPlans: async () => {
    return fetchWithAuth('/plans');
  },

  // Investments
  getInvestments: async () => {
    return fetchWithAuth('/investments');
  },

  buyPlan: async (planId: string) => {
    return fetchWithAuth('/investments/buy', {
      method: 'POST',
      body: JSON.stringify({ planId })
    });
  },

  simulateMiningDay: async () => {
    return fetchWithAuth('/investments/simulate-day', {
      method: 'POST'
    });
  },

  // Wallet
  rechargeWallet: async (amount: number, paymentMethod: string, paymentReference: string) => {
    return fetchWithAuth('/wallet/recharge', {
      method: 'POST',
      body: JSON.stringify({ amount, paymentMethod, paymentReference })
    });
  },

  withdrawWallet: async (payload: any) => {
    return fetchWithAuth('/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  getTransactions: async () => {
    return fetchWithAuth('/wallet/transactions');
  },

  // Team
  getTeamStats: async () => {
    return fetchWithAuth('/team');
  },

  // Support
  getTickets: async () => {
    return fetchWithAuth('/support/tickets');
  },

  createTicket: async (payload: any) => {
    return fetchWithAuth('/support/tickets', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  replyTicket: async (ticketId: string, message: string) => {
    return fetchWithAuth(`/support/tickets/${ticketId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  },

  // Static content
  getHomeContent: async () => {
    return fetchWithAuth('/home/content');
  },

  // Admin APIs
  getAdminStats: async () => {
    return fetchWithAuth('/admin/stats');
  },

  getAdminUsers: async () => {
    return fetchWithAuth('/admin/users');
  },

  updateAdminUser: async (userId: string, payload: any) => {
    return fetchWithAuth(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  getAdminRecharges: async () => {
    return fetchWithAuth('/admin/recharges');
  },

  resolveAdminRecharge: async (txId: string, action: 'approve' | 'reject') => {
    return fetchWithAuth(`/admin/recharges/${txId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ action })
    });
  },

  getAdminWithdrawals: async () => {
    return fetchWithAuth('/admin/withdrawals');
  },

  resolveAdminWithdrawal: async (txId: string, action: 'approve' | 'reject') => {
    return fetchWithAuth(`/admin/withdrawals/${txId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ action })
    });
  },

  getAdminTickets: async () => {
    return fetchWithAuth('/admin/tickets');
  },

  replyAdminTicket: async (ticketId: string, message: string) => {
    return fetchWithAuth(`/admin/tickets/${ticketId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  },

  createAdminPlan: async (payload: any) => {
    return fetchWithAuth('/admin/plans', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  deleteAdminPlan: async (planId: string) => {
    return fetchWithAuth(`/admin/plans/${planId}`, {
      method: 'DELETE'
    });
  }
};
