import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Truck, Bell, LogOut, User } from 'lucide-react';
import { NotificationDrawer } from './NotificationDrawer';
import { RiderProfileModal } from '../Profile/RiderProfileModal';

interface HeaderProps {
  onOpenProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenProfile }) => {
  const { user, logout, unreadNotifCount } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleProfileClick = () => {
    if (onOpenProfile) {
      onOpenProfile();
    } else {
      setShowProfileModal(true);
    }
  };

  return (
    <header className="mobile-header">
      <div className="header-container">
        {/* Brand & Partner ID */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            onClick={handleProfileClick}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--primary-emerald), var(--primary-teal))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <Truck size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2 }}>
                Delivery Express
              </h2>
              <span className="pulse-badge pulse-badge-active" style={{ fontSize: '0.6rem', padding: '1px 6px' }}>
                <span className="pulse-dot"></span> Active
              </span>
            </div>
            <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--primary-cyan)' }}>{user?.partnerId || 'Partner'}</strong>{user?.name ? ` • ${user.name.split(' ')[0]}` : ''}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

          {/* Notifications Trigger */}
          <button
            onClick={() => setShowNotifications(true)}
            className="cyber-button-secondary"
            title="Notifications"
            style={{
              position: 'relative',
              width: '36px',
              height: '36px',
              minHeight: '36px',
              padding: 0,
              borderRadius: '50%'
            }}
          >
            <Bell size={17} />
            {unreadNotifCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: 'var(--accent-rose)',
                color: '#ffffff',
                fontSize: '0.6rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 8px var(--accent-rose)'
              }}>
                {unreadNotifCount}
              </span>
            )}
          </button>

          {/* User Profile Avatar */}
          <button
            onClick={handleProfileClick}
            className="cyber-button-secondary"
            title="Rider Profile"
            style={{
              width: '36px',
              height: '36px',
              minHeight: '36px',
              padding: 0,
              borderRadius: '50%',
              borderColor: 'var(--primary-emerald)'
            }}
          >
            <User size={17} color="var(--primary-emerald)" />
          </button>

          {/* Sign Out Button (desktop) */}
          <button
            onClick={logout}
            className="cyber-button-secondary desktop-only"
            title="Sign Out"
            style={{
              height: '36px',
              minHeight: '36px',
              padding: '0 10px',
              fontSize: '0.775rem',
              color: 'var(--accent-rose)',
              borderColor: 'rgba(244, 63, 94, 0.2)'
            }}
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </div>

      {showNotifications && (
        <NotificationDrawer onClose={() => setShowNotifications(false)} />
      )}

      {showProfileModal && user && (
        <RiderProfileModal user={user} onClose={() => setShowProfileModal(false)} />
      )}
    </header>
  );
};

