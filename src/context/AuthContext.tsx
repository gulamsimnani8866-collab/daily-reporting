import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile, AppNotification } from '../types';
import { StorageService } from '../services/storage';
import { FirebaseService } from '../services/firebase';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isSuspended: boolean;
  notifications: AppNotification[];
  unreadNotifCount: number;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchUserAccount: (uid: string) => void;
  toggleCurrentAccountStatus: () => void;
  refreshUserData: () => void;
  markNotificationsRead: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => StorageService.getCurrentUser());
  const [notifications, setNotifications] = useState<AppNotification[]>(() => StorageService.getNotifications());

  useEffect(() => {
    StorageService.initStorage();
    const currentUser = StorageService.getCurrentUser();
    setUser(currentUser);
    setNotifications(StorageService.getNotifications());

    // Subscribe to Firebase Auth changes
    const unsubAuth = FirebaseService.onAuthChanged(async (fbUser) => {
      if (fbUser) {
        const rtdbProfile = await FirebaseService.getUserProfile(fbUser.uid);
        if (!rtdbProfile) {
          console.warn('[Security Audit] Unregistered user detected. Revoking access for UID:', fbUser.uid);
          await FirebaseService.logoutUser();
          setUser(null);
          localStorage.removeItem('delivery_current_user');
          return;
        }
        console.log(`[Data Security] Authenticated isolated user scope for UID: ${rtdbProfile.uid}`);
        StorageService.setCurrentUser(rtdbProfile);
        setUser(rtdbProfile);
        setNotifications(StorageService.getNotifications(rtdbProfile.uid));
      } else {
        setUser(null);
        localStorage.removeItem('delivery_current_user');
      }
    });

    return () => {
      unsubAuth();
    };
  }, []);

  // Realtime Database subscription for user profile updates (e.g. status changes by Admin)
  useEffect(() => {
    if (!user?.uid) return;
    const unsubProfile = FirebaseService.subscribeUserProfile(user.uid, (rtdbProfile) => {
      if (rtdbProfile) {
        setUser(rtdbProfile);
        StorageService.setCurrentUser(rtdbProfile);
      } else {
        // If Admin removed user profile from database, log out user immediately
        console.warn('[Security Audit] User profile deleted from database by Admin. Logging out UID:', user.uid);
        logout();
      }
    });
    return () => {
      unsubProfile();
    };
  }, [user?.uid]);

  const refreshUserData = async () => {
    if (user?.uid) {
      const rtdbProfile = await FirebaseService.getUserProfile(user.uid);
      if (rtdbProfile) {
        setUser(rtdbProfile);
        StorageService.setCurrentUser(rtdbProfile);
      }
      setNotifications(StorageService.getNotifications(user.uid));
    }
  };

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    
    // 1. Authenticate with Firebase Authentication
    const fbRes = await FirebaseService.loginUser(cleanEmail, pass);
    
    if (!fbRes.user) {
      return { 
        success: false, 
        error: fbRes.error || 'Login Failed: Invalid credentials.' 
      };
    }

    // 2. Fetch profile from Firebase Realtime Database to verify Admin provisioning
    const rtdbProfile = await FirebaseService.getUserProfile(fbRes.user.uid);
    
    if (!rtdbProfile) {
      // User is not created in the database by Admin -> DENY ACCESS
      await FirebaseService.logoutUser();
      console.warn('[Security Audit] Access Denied: User profile missing in database for UID:', fbRes.user.uid);
      return {
        success: false,
        error: 'Access Denied: Your User ID is not registered in the database. Please ask your Admin to assign your account.'
      };
    }

    if (rtdbProfile.accountStatus === 'suspended') {
      console.warn('[Security Audit] Access Denied: Account suspended for UID:', fbRes.user.uid);
      return {
        success: false,
        error: 'Access Denied: Your account has been suspended by the Administrator.'
      };
    }

    console.log(`[Data Security] Login successful. Isolated scope active for User UID: ${rtdbProfile.uid}`);
    StorageService.setCurrentUser(rtdbProfile);
    setUser(rtdbProfile);
    setNotifications(StorageService.getNotifications(rtdbProfile.uid));

    return { success: true };
  };

  const logout = async () => {
    const currentUid = user?.uid;
    await FirebaseService.logoutUser();
    setUser(null);
    localStorage.removeItem('delivery_current_user');
    if (currentUid) {
      console.log(`[Data Security] Logged out & purged session scope for User UID: ${currentUid}`);
    }
  };

  const switchUserAccount = (_uid: string) => {
    // No-op - Demo switcher removed
  };

  const toggleCurrentAccountStatus = () => {
    // No-op - Demo toggle removed
  };

  const markNotificationsRead = () => {
    StorageService.markNotificationsRead();
    setNotifications(StorageService.getNotifications());
  };

  const unreadNotifCount = notifications.filter(n => !n.read).length;
  const isSuspended = user?.accountStatus === 'suspended';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isSuspended,
        notifications,
        unreadNotifCount,
        login,
        logout,
        switchUserAccount,
        toggleCurrentAccountStatus,
        refreshUserData,
        markNotificationsRead
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

