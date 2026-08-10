export interface UserProfile {
  uid: string;
  partnerId: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  vehicleNumber: string;
  accountStatus: 'active' | 'suspended';
  createdAt: string;
  avatarUrl?: string;
}

export interface DailyReport {
  id: string; // YYYY-MM-DD
  uid: string;
  date: string; // YYYY-MM-DD
  totalParcels?: number;
  completedParcels: number;
  returnParcels: number;
  rateApplied: number; // 16 or 17
  earning: number;
  status: 'pending' | 'verified' | 'rejected';
  submittedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  notes?: string;
  rejectionReason?: string;
  isAbsent?: boolean;
}

export interface PayoutCycle {
  cycleId: string; // e.g. "2026-08-A" or "2026-08-B"
  uid: string;
  year: number;
  monthName: string;
  cycleType: 'A' | 'B';
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalCompleted: number;
  totalReturned: number;
  totalEarning: number;
  verifiedCount: number;
  pendingCount: number;
  status: 'open' | 'closed' | 'verified';
  generatedAt?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'verification' | 'cycle_closed' | 'account_status' | 'system';
  read: boolean;
  actionUrl?: string;
}

export interface RateRuleConfig {
  threshold: number; // 70
  tier1Rate: number; // 16
  tier2Rate: number; // 17
}
