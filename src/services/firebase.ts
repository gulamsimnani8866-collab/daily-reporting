import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
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
export const auth = getAuth(app);
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

// Strip out undefined values to prevent Firebase RTDB set() exceptions
export function sanitizeForFirebase<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  return JSON.parse(JSON.stringify(obj, (_, value) => {
    return value === undefined ? null : value;
  }));
}

// Normalizer function to handle all variant schemas between Admin and User applications
export function normalizeDailyReport(raw: any, parentUid?: string, nodeKey?: string, userProfile?: Partial<UserProfile>): any {
  const activeUid = auth.currentUser?.uid || raw.uid || raw.userId || parentUid || '';
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
  // --- AUTHENTICATION ---
  async loginUser(email: string, pass: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      return { user: userCredential.user, error: null };
    } catch (err: any) {
      let msg = 'Authentication failed. Please check your credentials.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = 'Invalid Email/ID or Password. Only accounts created by the Administrator in the database can log in.';
      } else if (err.message) {
        msg = err.message;
      }
      return { user: null, error: msg };
    }
  },

  async logoutUser() {
    try {
      await signOut(auth);
      return true;
    } catch (err) {
      console.warn('Firebase logout warning:', err);
      return false;
    }
  },

  onAuthChanged(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  // --- REALTIME DATABASE: USER PROFILES ---
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const activeUid = auth.currentUser?.uid || uid;
      const dbRef = ref(rtdb);
      const snapshot = await get(child(dbRef, `users/${activeUid}`));
      if (snapshot.exists()) {
        const val = snapshot.val();
        return {
          uid: val.uid || activeUid,
          partnerId: val.partnerId || `DP-${activeUid.substring(0, 4).toUpperCase()}`,
          name: val.name || val.userName || 'Delivery Partner',
          email: val.email || val.userEmail || '',
          phone: val.phone || val.mobile || '',
          city: val.city || 'General Zone',
          vehicleNumber: val.vehicleNumber || 'N/A',
          accountStatus: val.accountStatus === 'suspended' || val.accountStatus === 'disabled' ? 'suspended' : 'active',
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
      const activeUid = auth.currentUser?.uid || profile.uid;
      const sanitized = sanitizeForFirebase({ ...profile, uid: activeUid });
      const userRef = ref(rtdb, `users/${activeUid}`);
      await set(userRef, sanitized);
      return true;
    } catch (err) {
      console.warn('Firebase RTDB save profile warning:', err);
      return false;
    }
  },

  subscribeUserProfile(uid: string, callback: (profile: UserProfile | null) => void): Unsubscribe {
    const activeUid = auth.currentUser?.uid || uid;
    const userRef = ref(rtdb, `users/${activeUid}`);
    return onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        callback({
          uid: val.uid || activeUid,
          partnerId: val.partnerId || `DP-${activeUid.substring(0, 4).toUpperCase()}`,
          name: val.name || val.userName || 'Delivery Partner',
          email: val.email || val.userEmail || '',
          phone: val.phone || val.mobile || '',
          city: val.city || 'General Zone',
          vehicleNumber: val.vehicleNumber || 'N/A',
          accountStatus: val.accountStatus === 'suspended' || val.accountStatus === 'disabled' ? 'suspended' : 'active',
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
    const activeUid = auth.currentUser?.uid || uid;
    const normalized = normalizeDailyReport(reportData, activeUid, date, userProfile);
    const sanitized = sanitizeForFirebase(normalized);
    
    // Write exclusively to primary dailyReports node
    const dailyReportRef = ref(rtdb, `dailyReports/${activeUid}/${date}`);
    await set(dailyReportRef, sanitized);

    return true;
  },

  async getDailyReports(uid: string): Promise<DailyReport[]> {
    try {
      const activeUid = auth.currentUser?.uid || uid;
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
    const activeUid = auth.currentUser?.uid || uid;
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
      const activeUid = auth.currentUser?.uid || uid;
      const dailyReportRef = ref(rtdb, `dailyReports/${activeUid}/${date}`);
      await set(dailyReportRef, null);
      return true;
    } catch (err) {
      console.warn('Firebase RTDB delete daily report warning:', err);
      return false;
    }
  }
};

