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
  const [notifications, setNotifications] = useState<AppNotification[]>(() => 
    StorageService.getNotifications(user?.uid)
  );

  useEffect(() => {
    StorageService.initStorage();
    const currentUser = StorageService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setNotifications(StorageService.getNotifications(currentUser.uid));
    }
  }, []);

  // Realtime Database subscription for user profile updates (e.g. status changes by Admin)
  useEffect(() => {
    if (!user?.uid && !user?.userId) return;
    const activeId = user.userId || user.uid;
    const unsubProfile = FirebaseService.subscribeUserProfile(activeId, (rtdbProfile) => {
      if (rtdbProfile) {
        setUser(rtdbProfile);
        StorageService.setCurrentUser(rtdbProfile);
      } else {
        // If Admin removed user profile from database, log out user immediately
        console.warn('[Security Audit] User profile deleted from database by Admin. Logging out ID:', activeId);
        logout();
      }
    });
    return () => {
      unsubProfile();
    };
  }, [user?.uid, user?.userId]);

  const refreshUserData = async () => {
    const activeId = user?.userId || user?.uid;
    if (activeId) {
      const rtdbProfile = await FirebaseService.getUserProfile(activeId);
      if (rtdbProfile) {
        setUser(rtdbProfile);
        StorageService.setCurrentUser(rtdbProfile);
      }
      setNotifications(StorageService.getNotifications(activeId));
    }
  };

  const login = async (identityInput: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const cleanInput = identityInput.trim();
    if (!cleanInput || !pass) {
      return { success: false, error: 'Please enter User ID / Email and Password.' };
    }

    const res = await FirebaseService.loginUser(cleanInput, pass);

    if (!res.user) {
      return {
        success: false,
        error: res.error || 'Invalid User ID or Password'
      };
    }

    if (res.user.accountStatus === 'disabled' || (res.user as any).accountStatus === 'suspended') {
      return {
        success: false,
        error: 'Your account is disabled. Please contact Admin.'
      };
    }

    console.log(`[Data Security] Direct DB Login successful for User ID: ${res.user.userId || res.user.uid}`);
    StorageService.setCurrentUser(res.user);
    setUser(res.user);
    setNotifications(StorageService.getNotifications(res.user.uid));

    return { success: true };
  };

  const logout = async () => {
    const currentId = user?.userId || user?.uid;
    await FirebaseService.logoutUser();
    setUser(null);
    localStorage.removeItem('dprs_user_session');
    localStorage.removeItem('delivery_current_user');
    if (currentId) {
      console.log(`[Data Security] Logged out & purged session scope for User ID: ${currentId}`);
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

