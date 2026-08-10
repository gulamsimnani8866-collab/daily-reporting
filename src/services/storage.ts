import type { DailyReport, UserProfile, PayoutCycle, AppNotification } from '../types';
import { FirebaseService } from './firebase';

const USERS_KEY = 'delivery_user_profiles';
const CURRENT_USER_KEY = 'delivery_current_user';
const REPORTS_KEY = 'delivery_daily_reports';
const NOTIFICATIONS_KEY = 'delivery_notifications';

export const RATE_RULE = {
  THRESHOLD: 70,
  TIER_1_RATE: 16,
  TIER_2_RATE: 17
};

export function calculateDailyEarnings(completedParcels: number): { rateApplied: number; earning: number } {
  const safeCompleted = Math.max(0, Math.floor(completedParcels));
  const rateApplied = safeCompleted > RATE_RULE.THRESHOLD ? RATE_RULE.TIER_2_RATE : RATE_RULE.TIER_1_RATE;
  const earning = safeCompleted * rateApplied;
  return { rateApplied, earning };
}

export const StorageService = {
  initStorage() {
    // Storage initialization - no demo data seeding
  },

  getUsers(): UserProfile[] {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  },

  getCurrentUser(): UserProfile | null {
    const data = localStorage.getItem(CURRENT_USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  setCurrentUser(user: UserProfile) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  },

  updateUserStatus(uid: string, status: 'active' | 'suspended') {
    const users = this.getUsers();
    const index = users.findIndex(u => u.uid === uid);
    if (index !== -1) {
      users[index].accountStatus = status;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      
      const current = this.getCurrentUser();
      if (current && current.uid === uid) {
        current.accountStatus = status;
        this.setCurrentUser(current);
      }
    }
  },

  getReports(uid: string): DailyReport[] {
    this.initStorage();
    const data = localStorage.getItem(REPORTS_KEY);
    const allReports: DailyReport[] = data ? JSON.parse(data) : [];
    return allReports.filter(r => r.uid === uid).sort((a, b) => b.date.localeCompare(a.date));
  },

  async saveDailyReport(
    reportData: { uid: string; date: string; completedParcels: number; returnParcels: number; totalParcels?: number; notes?: string; isAbsent?: boolean },
    userProfile?: Partial<UserProfile>
  ): Promise<{ report: DailyReport; isUpdate: boolean }> {
    this.initStorage();
    const allReports: DailyReport[] = JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]');
    
    const safeCompleted = Math.max(0, Math.floor(reportData.completedParcels));
    const safeReturned = Math.max(0, Math.floor(reportData.returnParcels));
    const safeTotal = reportData.totalParcels !== undefined ? Math.max(0, Math.floor(reportData.totalParcels)) : safeCompleted + safeReturned;

    const { rateApplied, earning } = reportData.isAbsent
      ? { rateApplied: 0, earning: 0 }
      : calculateDailyEarnings(safeCompleted);
    
    const existingIndex = allReports.findIndex(r => r.uid === reportData.uid && r.date === reportData.date);
    
    let resultReport: DailyReport;
    let isUpdate = false;

    if (existingIndex !== -1) {
      const existing = allReports[existingIndex];
      if (existing.status === 'verified') {
        throw new Error('This report has already been verified by the Admin and cannot be edited.');
      }
      
      resultReport = {
        ...existing,
        totalParcels: safeTotal,
        completedParcels: safeCompleted,
        returnParcels: safeReturned,
        rateApplied,
        earning,
        status: 'pending',
        rejectionReason: undefined,
        isAbsent: reportData.isAbsent || false,
        notes: reportData.notes || existing.notes,
        submittedAt: new Date().toISOString()
      };
      
      allReports[existingIndex] = resultReport;
      isUpdate = true;
    } else {
      resultReport = {
        id: `${reportData.uid}_${reportData.date}`,
        uid: reportData.uid,
        date: reportData.date,
        totalParcels: safeTotal,
        completedParcels: safeCompleted,
        returnParcels: safeReturned,
        rateApplied,
        earning,
        isAbsent: reportData.isAbsent || false,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        notes: reportData.notes
      };
      
      allReports.unshift(resultReport);
    }

    localStorage.setItem(REPORTS_KEY, JSON.stringify(allReports));

    // Await sync to Firebase Realtime Database
    await FirebaseService.saveDailyReport(reportData.uid, reportData.date, resultReport, userProfile);

    return { report: resultReport, isUpdate };
  },

  async deleteDailyReport(uid: string, date: string): Promise<boolean> {
    this.initStorage();
    const allReports: DailyReport[] = JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]');
    const filtered = allReports.filter(r => !(r.uid === uid && r.date === date));
    localStorage.setItem(REPORTS_KEY, JSON.stringify(filtered));

    await FirebaseService.deleteDailyReport(uid, date);
    return true;
  },

  toggleReportVerification(reportId: string) {
    this.initStorage();
    const allReports: DailyReport[] = JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]');
    const index = allReports.findIndex(r => r.id === reportId);
    if (index !== -1) {
      const current = allReports[index];
      const newStatus = current.status === 'verified' ? 'pending' : 'verified';
      const updated = {
        ...current,
        status: newStatus as 'pending' | 'verified',
        verifiedAt: newStatus === 'verified' ? new Date().toISOString() : undefined,
        verifiedBy: newStatus === 'verified' ? 'Admin (Demo Action)' : undefined
      };
      allReports[index] = updated;
      localStorage.setItem(REPORTS_KEY, JSON.stringify(allReports));
      
      // Sync to Firebase RTDB
      FirebaseService.saveDailyReport(current.uid, current.date, updated);

      this.addNotification({
        title: newStatus === 'verified' ? 'Daily Report Verified' : 'Report Verification Status Changed',
        message: `Your report for ${current.date} has been marked as ${newStatus.toUpperCase()} by Admin.`,
        type: 'verification'
      });
    }
  },

  getNotifications(): AppNotification[] {
    this.initStorage();
    const data = localStorage.getItem(NOTIFICATIONS_KEY);
    return data ? JSON.parse(data) : [];
  },

  addNotification(notif: { title: string; message: string; type: AppNotification['type'] }) {
    const notifs = this.getNotifications();
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      timestamp: new Date().toISOString(),
      read: false
    };
    notifs.unshift(newNotif);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifs));
  },

  markNotificationsRead() {
    const notifs = this.getNotifications();
    const updated = notifs.map(n => ({ ...n, read: true }));
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
  },

  getPayoutCycles(uid: string, reportsInput?: DailyReport[]): PayoutCycle[] {
    const reports = reportsInput || this.getReports(uid);
    const cyclesMap: { [key: string]: DailyReport[] } = {};

    reports.forEach(report => {
      const date = new Date(report.date + 'T00:00:00');
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();

      const cycleType = day <= 15 ? 'A' : 'B';
      const monthStr = (month + 1).toString().padStart(2, '0');
      const cycleId = `${year}-${monthStr}-${cycleType}`;

      if (!cyclesMap[cycleId]) {
        cyclesMap[cycleId] = [];
      }
      cyclesMap[cycleId].push(report);
    });

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const cycleList: PayoutCycle[] = Object.keys(cyclesMap).map(cycleId => {
      const [yearStr, monthStr, cycleType] = cycleId.split('-');
      const year = parseInt(yearStr, 10);
      const monthIndex = parseInt(monthStr, 10) - 1;
      const monthName = monthNames[monthIndex];

      let startDate = `${year}-${monthStr}-01`;
      let endDate = `${year}-${monthStr}-15`;

      if (cycleType === 'B') {
        startDate = `${year}-${monthStr}-16`;
        const lastDay = new Date(year, monthIndex + 1, 0).getDate();
        endDate = `${year}-${monthStr}-${lastDay.toString().padStart(2, '0')}`;
      }

      const cycleReports = cyclesMap[cycleId];
      const verifiedReports = cycleReports.filter(r => r.status === 'verified');

      const totalCompleted = verifiedReports.reduce((sum, r) => sum + r.completedParcels, 0);
      const totalReturned = verifiedReports.reduce((sum, r) => sum + r.returnParcels, 0);
      const totalEarning = verifiedReports.reduce((sum, r) => sum + r.earning, 0);
      const verifiedCount = verifiedReports.length;
      const pendingCount = cycleReports.filter(r => r.status === 'pending').length;

      const today = new Date().toISOString().split('T')[0];
      const isPastCycle = endDate < today;
      const status: PayoutCycle['status'] = pendingCount === 0 && cycleReports.length > 0 ? 'verified' : (isPastCycle ? 'closed' : 'open');

      return {
        cycleId,
        uid,
        year,
        monthName,
        cycleType: cycleType as 'A' | 'B',
        startDate,
        endDate,
        totalCompleted,
        totalReturned,
        totalEarning,
        verifiedCount,
        pendingCount,
        status,
        generatedAt: isPastCycle ? `${endDate}T23:59:59Z` : undefined
      };
    });

    return cycleList.sort((a, b) => b.startDate.localeCompare(a.startDate));
  }
};
