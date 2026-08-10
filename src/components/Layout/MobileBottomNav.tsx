import React from 'react';
import { LayoutDashboard, FileEdit, Banknote, History, User } from 'lucide-react';

export type MobileTab = 'dashboard' | 'report' | 'payouts' | 'history' | 'profile';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  setActiveTab: (tab: MobileTab) => void;
  unreadCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab
}) => {
  const navItems: { id: MobileTab; label: string; icon: React.ReactNode }[] = [
    { id: 'report', label: 'Report', icon: <FileEdit size={20} /> },
    { id: 'dashboard', label: 'Stats', icon: <LayoutDashboard size={20} /> },
    { id: 'history', label: 'History', icon: <History size={20} /> },
    { id: 'payouts', label: 'Payouts', icon: <Banknote size={20} /> },
    { id: 'profile', label: 'Profile', icon: <User size={20} /> }
  ];

  return (
    <nav className="mobile-bottom-nav">
      <div className="mobile-nav-container">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="mobile-nav-icon">
                {item.icon}
                {isActive && <span className="mobile-active-glow" />}
              </div>
              <span className="mobile-nav-label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
