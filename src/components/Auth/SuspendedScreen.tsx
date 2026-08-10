import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, PhoneCall, LogOut } from 'lucide-react';

export const SuspendedScreen: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      zIndex: 1
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '480px',
        padding: '36px 28px',
        border: '1px solid rgba(244, 63, 94, 0.4)',
        boxShadow: '0 20px 40px rgba(244, 63, 94, 0.15)',
        textAlign: 'center'
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'rgba(244, 63, 94, 0.15)',
          border: '2px solid rgba(244, 63, 94, 0.4)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px'
        }}>
          <ShieldAlert size={38} color="var(--accent-rose)" />
        </div>

        <div className="pulse-badge pulse-badge-suspended" style={{ marginBottom: '14px' }}>
          <span className="pulse-dot"></span> Account Suspended
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px' }}>
          Access Disabled by Admin
        </h2>

        <p style={{
          color: 'var(--text-muted)',
          fontSize: '0.95rem',
          lineHeight: 1.6,
          background: 'var(--bg-dark)',
          padding: '16px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-glass)',
          marginBottom: '24px'
        }}>
          "Your access has been disabled by the admin. Please contact your administrator."
        </p>

        <div style={{
          fontSize: '0.85rem',
          color: 'var(--text-dim)',
          marginBottom: '28px',
          textAlign: 'left',
          background: 'rgba(255, 255, 255, 0.03)',
          padding: '14px',
          borderRadius: 'var(--radius-sm)'
        }}>
          <div><strong>Partner Name:</strong> {user?.name}</div>
          <div><strong>Partner ID:</strong> {user?.partnerId}</div>
          <div><strong>Email:</strong> {user?.email}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <a
            href="tel:+919876543210"
            className="cyber-button-primary"
            style={{
              textDecoration: 'none',
              background: 'linear-gradient(135deg, #e11d48, #be123c)',
              boxShadow: '0 4px 14px rgba(225, 29, 72, 0.35)'
            }}
          >
            <PhoneCall size={18} /> Contact Business Admin
          </a>

          <button
            onClick={logout}
            className="cyber-button-secondary"
            style={{ width: '100%' }}
          >
            <LogOut size={18} /> Return to Login
          </button>
        </div>
      </div>
    </div>
  );
};
