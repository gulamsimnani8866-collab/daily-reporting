import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getDatabase, 
  ref, 
  get, 
  child, 
  set, 
  onValue,
  type Unsubscribe 
} from 'firebase/database';
import { getAnalytics, isSupported } from 'firebase/analytics';
import type { UserProfile, DailyReport } from '../types';

export const firebaseConfig = {
  apiKey: "AIzaSyAgaNERpbmajCclrr5wKfBil02nBS5L1mQ",
  authDomain: "delivery-report-admin.firebaseapp.com",
  databaseURL: "https://delivery-report-admin-default-rtdb.firebaseio.com",
  projectId: "delivery-report-admin",
  storageBucket: "delivery-report-admin.firebasestorage.app",
  messagingSenderId: "438736861562",
  appId: "1:438736861562:web:2ebdd49167018974dafec3",
  measurementId: "G-H492ZWDCBH"
};

// Initialize Firebase App singleton
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const rtdb = getDatabase(app);

// Initialize Analytics conditionally
export let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Ignore analytics unsupported error in non-browser env
  });
}

// Key Sanitization Helper as specified in Section 4.1 of PRD
export function sanitizeDbKey(key: string): string {
  if (!key) return '';
  return String(key).trim().replace(/[.#$[\]]/g, '_');
}

// Direct Database Authentication Verification Function as specified in Section 4.2 of PRD
export async function loginUserWithRealtimeDB(
  identityInput: string,
  passInput: string
): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
  try {
    const cleanId = identityInput.trim();
    if (!cleanId || !passInput) {
      return { success: false, message: 'Please enter User ID / Email and Password.' };
    }
    const dbKey = sanitizeDbKey(cleanId);
    const snapshot = await get(ref(rtdb, `users/${dbKey}`));
    let userVal: UserProfile | null = snapshot.exists() ? (snapshot.val() as UserProfile) : null;

    // Fallback: Query all users if direct key lookup fails
    if (!userVal) {
      const allSnap = await get(ref(rtdb, 'users'));
      if (allSnap.exists()) {
        const val = allSnap.val();
        const found = Object.values(val).find((u: any) =>
          u && (u.userId === cleanId || u.uid === cleanId || u.email === cleanId)
        ) as UserProfile | undefined;
        if (found) userVal = found;
      }
    }

    if (!userVal) {
      return { success: false, message: 'Invalid User ID or Password' };
    }

    if (userVal.accountStatus === 'disabled' || (userVal as any).accountStatus === 'suspended') {
      return { success: false, message: 'Your account is disabled. Please contact Admin.' };
    }

    if (userVal.password && userVal.password !== passInput) {
      return { success: false, message: 'Invalid User ID or Password' };
    }

    // Normalize Profile fields
    const normalizedUser: UserProfile = {
      ...userVal,
      userId: userVal.userId || userVal.uid || dbKey,
      uid: userVal.uid || userVal.userId || dbKey,
      name: userVal.name || 'Delivery Partner',
      email: userVal.email || '',
      mobile: userVal.mobile || userVal.phone || '',
      phone: userVal.mobile || userVal.phone || '',
      hubName: userVal.hubName || 'Ahmedabad Central Hub',
      deliveryPartner: userVal.deliveryPartner || 'Flipkart',
      partnerId: userVal.partnerId || userVal.userId || userVal.uid || `DP-${dbKey}`,
      accountStatus: userVal.accountStatus || 'active',
      createdAt: userVal.createdAt || new Date().toISOString()
    };

    return { success: true, user: normalizedUser };
  } catch (err: any) {
    return { success: false, message: err.message || 'Database connection error.' };
  }
}

// Strip out undefined values to prevent Firebase RTDB set() exceptions
export function sanitizeForFirebase<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  return JSON.parse(JSON.stringify(obj, (_, value) => {
    return value === undefined ? null : value;
  }));
}

// Normalizer function to handle all variant schemas between Admin and User applications
export function normalizeDailyReport(raw: any, parentUid?: string, nodeKey?: string, userProfile?: Partial<UserProfile>): any {
  const activeUid = raw.uid || raw.userId || parentUid || '';
  const date = raw.date || (nodeKey && /^\d{4}-\d{2}-\d{2}$/.test(nodeKey) ? nodeKey : '') || new Date().toISOString().split('T')[0];
  const id = raw.id || `${activeUid}_${date}`;

  const completedParcels = Number(raw.completedParcels ?? 0);
  const returnParcels = Number(raw.returnParcels ?? 0);
  const totalParcels = Number(raw.totalParcels ?? (completedParcels + returnParcels));
  const rateApplied = Number(raw.rateApplied ?? raw.appliedRate ?? (completedParcels > 70 ? 17 : 16));
  const earning = Number(raw.earning ?? raw.earnings ?? (completedParcels * rateApplied));
  const rawStatus = raw.status || raw.verificationStatus || 'pending';
  const status: DailyReport['status'] = (rawStatus === 'verified' || rawStatus === 'rejected') ? rawStatus : 'pending';
  const submittedAt = raw.submittedAt || raw.createdAt || (date ? `${date}T00:00:00.000Z` : new Date().toISOString());

  // Calculate periodKey e.g. 2026-08-P1
  const dateObj = new Date(date + 'T00:00:00');
  const year = dateObj.getFullYear() || 2026;
  const monthStr = ((dateObj.getMonth() || 0) + 1).toString().padStart(2, '0');
  const periodType = (dateObj.getDate() || 1) <= 15 ? 'P1' : 'P2';
  const periodKey = `${year}-${monthStr}-${periodType}`;

  const normalized: any = {
    id,
    uid: activeUid,
    userId: activeUid,
    date,
    totalParcels: isNaN(totalParcels) ? 0 : totalParcels,
    completedParcels: isNaN(completedParcels) ? 0 : completedParcels,
    returnParcels: isNaN(returnParcels) ? 0 : returnParcels,
    rateApplied: isNaN(rateApplied) ? 16 : rateApplied,
    earning: isNaN(earning) ? 0 : earning,
    status,
    submittedAt,
    periodKey,
    userName: userProfile?.name || raw.userName || 'Delivery Partner',
    userEmail: userProfile?.email || raw.userEmail || '',
    isAbsent: Boolean(raw.isAbsent)
  };

  if (raw.verifiedAt) normalized.verifiedAt = raw.verifiedAt;
  if (raw.verifiedBy) normalized.verifiedBy = raw.verifiedBy;
  if (raw.notes) normalized.notes = raw.notes;
  if (raw.rejectionReason) normalized.rejectionReason = raw.rejectionReason;
  if (raw.proofUrl || raw.screenshotUrl) normalized.proofUrl = raw.proofUrl || raw.screenshotUrl;
  if (raw.ocrRawText) normalized.ocrRawText = raw.ocrRawText;

  return sanitizeForFirebase(normalized);
}

export const FirebaseService = {
  // --- REALTIME DATABASE DIRECT AUTHENTICATION ---
  async loginUser(identityInput: string, passInput: string) {
    const res = await loginUserWithRealtimeDB(identityInput, passInput);
    if (!res.success || !res.user) {
      return { user: null, error: res.message || 'Invalid User ID or Password' };
    }
    return { user: res.user, error: null };
  },

  async logoutUser() {
    return true;
  },

  // --- REALTIME DATABASE: USER PROFILES ---
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const dbKey = sanitizeDbKey(uid);
      const dbRef = ref(rtdb);
      let snapshot = await get(child(dbRef, `users/${dbKey}`));
      if (!snapshot.exists()) {
        snapshot = await get(child(dbRef, `users/${uid}`));
      }
      let val: any = snapshot.exists() ? snapshot.val() : null;

      if (!val) {
        // Search fallback across all users
        const allSnap = await get(child(dbRef, 'users'));
        if (allSnap.exists()) {
          const allVal = allSnap.val();
          val = Object.values(allVal).find((u: any) => u && (u.userId === uid || u.uid === uid || u.email === uid));
        }
      }

      if (val) {
        return {
          userId: val.userId || val.uid || uid,
          uid: val.uid || val.userId || uid,
          partnerId: val.partnerId || val.userId || val.uid || `DP-${uid}`,
          employeeId: val.employeeId || val.userId || val.partnerId || '100001563365',
          deliveryPartner: val.deliveryPartner || 'Flipkart',
          hubName: val.hubName || 'Ahmedabad Central Hub',
          name: val.name || val.userName || 'Delivery Partner',
          email: val.email || val.userEmail || '',
          mobile: val.mobile || val.phone || '',
          phone: val.mobile || val.phone || '',
          password: val.password,
          role: val.role || 'user',
          city: val.city || 'General Zone',
          vehicleNumber: val.vehicleNumber || 'N/A',
          accountStatus: val.accountStatus || 'active',
          createdAt: val.createdAt || new Date().toISOString(),
          avatarUrl: val.avatarUrl || undefined
        };
      }
      return null;
    } catch (err) {
      console.warn('Firebase RTDB read profile warning:', err);
      return null;
    }
  },

  async saveUserProfile(profile: UserProfile): Promise<boolean> {
    try {
      const dbKey = sanitizeDbKey(profile.userId || profile.uid);
      const sanitized = sanitizeForFirebase({ ...profile });
      const userRef = ref(rtdb, `users/${dbKey}`);
      await set(userRef, sanitized);
      return true;
    } catch (err) {
      console.warn('Firebase RTDB save profile warning:', err);
      return false;
    }
  },

  subscribeUserProfile(uid: string, callback: (profile: UserProfile | null) => void): Unsubscribe {
    const dbKey = sanitizeDbKey(uid);
    const userRef = ref(rtdb, `users/${dbKey}`);
    return onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        callback({
          userId: val.userId || val.uid || uid,
          uid: val.uid || val.userId || uid,
          partnerId: val.partnerId || val.userId || val.uid || `DP-${uid}`,
          employeeId: val.employeeId || val.userId || val.partnerId || '100001563365',
          deliveryPartner: val.deliveryPartner || 'Flipkart',
          hubName: val.hubName || 'Ahmedabad Central Hub',
          name: val.name || val.userName || 'Delivery Partner',
          email: val.email || val.userEmail || '',
          mobile: val.mobile || val.phone || '',
          phone: val.mobile || val.phone || '',
          password: val.password,
          role: val.role || 'user',
          city: val.city || 'General Zone',
          vehicleNumber: val.vehicleNumber || 'N/A',
          accountStatus: val.accountStatus || 'active',
          createdAt: val.createdAt || new Date().toISOString(),
          avatarUrl: val.avatarUrl || undefined
        });
      } else {
        callback(null);
      }
    }, (err) => {
      console.warn('Firebase RTDB profile listener warning:', err);
    });
  },

  // --- REALTIME DATABASE: DAILY REPORTS ---
  async saveDailyReport(uid: string, date: string, reportData: DailyReport, userProfile?: Partial<UserProfile>): Promise<boolean> {
    const activeUid = sanitizeDbKey(uid);
    const normalized = normalizeDailyReport(reportData, activeUid, date, userProfile);
    const sanitized = sanitizeForFirebase(normalized);
    
    // Write exclusively to primary dailyReports node
    const dailyReportRef = ref(rtdb, `dailyReports/${activeUid}/${date}`);
    await set(dailyReportRef, sanitized);

    return true;
  },

  async getDailyReports(uid: string): Promise<DailyReport[]> {
    try {
      const activeUid = sanitizeDbKey(uid);
      const dbRef = ref(rtdb);
      const snapshot = await get(child(dbRef, `dailyReports/${activeUid}`));
      if (snapshot.exists()) {
        const val = snapshot.val();
        return Object.keys(val).map(key => normalizeDailyReport(val[key], activeUid, key));
      }
      return [];
    } catch (err) {
      console.warn('Firebase RTDB get daily reports warning:', err);
      return [];
    }
  },

  subscribeDailyReports(uid: string, callback: (reportsMap: Record<string, DailyReport>) => void): Unsubscribe {
    const activeUid = sanitizeDbKey(uid);
    const userReportsRef = ref(rtdb, `dailyReports/${activeUid}`);
    return onValue(userReportsRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const normalizedMap: Record<string, DailyReport> = {};
        Object.keys(val).forEach(key => {
          const norm = normalizeDailyReport(val[key], activeUid, key);
          normalizedMap[norm.id || key] = norm;
        });
        callback(normalizedMap);
      } else {
        callback({});
      }
    }, (error) => {
      console.warn('RTDB Listener warning:', error);
    });
  },

  async deleteDailyReport(uid: string, date: string): Promise<boolean> {
    try {
      const activeUid = sanitizeDbKey(uid);
      const dailyReportRef = ref(rtdb, `dailyReports/${activeUid}/${date}`);
      await set(dailyReportRef, null);
      return true;
    } catch (err) {
      console.warn('Firebase RTDB delete daily report warning:', err);
      return false;
    }
  }
};

