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
        let rtdbProfile = await FirebaseService.getUserProfile(fbUser.uid);
        if (!rtdbProfile) {
          const autoProfile: UserProfile = {
            uid: fbUser.uid,
            partnerId: `DP-${fbUser.uid.substring(0, 4).toUpperCase()}`,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Delivery Partner',
            email: fbUser.email || '',
            phone: '',
            city: 'Main Zone',
            vehicleNumber: 'N/A',
            accountStatus: 'active',
            createdAt: new Date().toISOString()
          };
          await FirebaseService.saveUserProfile(autoProfile);
          rtdbProfile = autoProfile;
        }
        StorageService.setCurrentUser(rtdbProfile);
        setUser(rtdbProfile);
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
    }
    setNotifications(StorageService.getNotifications());
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

    // 2. Fetch or auto-initialize profile in Firebase Realtime Database
    let rtdbProfile = await FirebaseService.getUserProfile(fbRes.user.uid);
    
    if (!rtdbProfile) {
      rtdbProfile = {
        uid: fbRes.user.uid,
        partnerId: `DP-${fbRes.user.uid.substring(0, 4).toUpperCase()}`,
        name: fbRes.user.displayName || cleanEmail.split('@')[0] || 'Delivery Partner',
        email: cleanEmail,
        phone: '',
        city: 'Main Zone',
        vehicleNumber: 'N/A',
        accountStatus: 'active',
        createdAt: new Date().toISOString()
      };
      await FirebaseService.saveUserProfile(rtdbProfile);
    }

    StorageService.setCurrentUser(rtdbProfile);
    setUser(rtdbProfile);
    setNotifications(StorageService.getNotifications());

    return { success: true };
  };

  const logout = async () => {
    await FirebaseService.logoutUser();
    setUser(null);
    localStorage.removeItem('delivery_current_user');
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

