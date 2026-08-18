import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Truck, Bell, LogOut, User, MapPin, Building2, ShieldCheck } from 'lucide-react';
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

  const userId = user?.userId || user?.uid || '100001389287';
  const hubName = user?.hubName || 'Ahmedabad Central Hub';
  const company = user?.deliveryPartner || 'Flipkart';

  return (
    <header className="mobile-header">
      <div className="header-container" style={{ flexWrap: 'wrap', gap: '12px' }}>
        {/* Brand Logo & User Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            onClick={handleProfileClick}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, var(--primary-emerald), var(--primary-teal))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <Truck size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2 }}>
                {user?.name || 'Saiyed Aadil'}
              </h2>
              <span className="pulse-badge pulse-badge-active" style={{ fontSize: '0.65rem', padding: '2px 7px' }}>
                <ShieldCheck size={10} style={{ marginRight: '3px' }} /> Active
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Delivery Partner Portal
            </p>
          </div>
        </div>

        {/* Badges: User ID, Delivery Partner Company, Hub Name */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          {/* User ID Badge */}
          <div 
            id="user-id-badge"
            style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '20px',
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--primary-emerald)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <User size={13} />
            <span>ID: {userId}</span>
          </div>

          {/* Company Badge */}
          <div 
            id="company-badge"
            style={{
              background: 'rgba(6, 182, 212, 0.12)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              borderRadius: '20px',
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--primary-cyan)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Building2 size={13} />
            <span>{company}</span>
          </div>

          {/* Hub Badge */}
          <div 
            id="hub-badge"
            style={{
              background: 'rgba(139, 92, 246, 0.12)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '20px',
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#a78bfa',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <MapPin size={13} />
            <span>Hub: {hubName}</span>
          </div>
        </div>

        {/* Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
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
            title="Partner Profile"
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

          {/* Logout Button */}
          <button
            onClick={logout}
            className="cyber-button-secondary"
            title="Logout"
            style={{
              height: '36px',
              minHeight: '36px',
              padding: '0 12px',
              fontSize: '0.775rem',
              fontWeight: 700,
              color: 'var(--accent-rose)',
              borderColor: 'rgba(244, 63, 94, 0.3)',
              background: 'rgba(244, 63, 94, 0.08)'
            }}
          >
            <LogOut size={15} /> Logout
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
