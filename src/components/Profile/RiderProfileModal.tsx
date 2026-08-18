import React from 'react';
import type { UserProfile } from '../../types';
import { User, ShieldCheck, Phone, Mail, MapPin, Calendar, LogOut, X, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface RiderProfileModalProps {
  user: UserProfile;
  onClose: () => void;
}

export const RiderProfileModal: React.FC<RiderProfileModalProps> = ({ user, onClose }) => {
  const { logout } = useAuth();
  const userId = user.userId || user.uid;
  const mobile = user.mobile || user.phone || 'N/A';
  const hubName = user.hubName || 'Ahmedabad Central Hub';
  const company = user.deliveryPartner || 'Flipkart';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 100,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '440px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '24px',
        position: 'relative',
        border: '1px solid var(--border-glow)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-glass)',
            color: 'var(--text-muted)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            position: 'relative',
            width: '80px',
            height: '80px',
            margin: '0 auto 12px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '3px solid var(--primary-emerald)',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
          }}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'var(--bg-card-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={40} color="var(--primary-emerald)" />
              </div>
            )}
          </div>

          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {user.name}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--primary-cyan)', fontWeight: 700, marginTop: '2px' }}>
            User ID: {userId}
          </p>
          <div style={{ display: 'inline-block', marginTop: '6px' }}>
            <span className={`pulse-badge ${user.accountStatus === 'active' ? 'pulse-badge-active' : 'pulse-badge-suspended'}`}>
              <span className="pulse-dot"></span>
              {user.accountStatus === 'active' ? 'Active Partner' : 'Account Disabled'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          <div style={{
            background: 'var(--bg-dark)',
            border: '1px solid var(--border-glass)',
            padding: '12px 14px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Building2 size={20} color="var(--primary-cyan)" />
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Delivery Partner Company</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{company}</div>
            </div>
          </div>

          <div style={{
            background: 'var(--bg-dark)',
            border: '1px solid var(--border-glass)',
            padding: '12px 14px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <MapPin size={20} color="#a78bfa" />
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Designated Hub Name</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{hubName}</div>
            </div>
          </div>

          <div style={{
            background: 'var(--bg-dark)',
            border: '1px solid var(--border-glass)',
            padding: '12px 14px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Phone size={20} color="var(--primary-emerald)" />
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Mobile Number</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{mobile}</div>
            </div>
          </div>

          <div style={{
            background: 'var(--bg-dark)',
            border: '1px solid var(--border-glass)',
            padding: '12px 14px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Mail size={20} color="var(--accent-amber)" />
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Email Address</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', wordBreak: 'break-all' }}>{user.email}</div>
            </div>
          </div>

          <div style={{
            background: 'var(--bg-dark)',
            border: '1px solid var(--border-glass)',
            padding: '12px 14px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Calendar size={20} color="var(--primary-teal)" />
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Created At</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            </div>
          </div>
        </div>

        <div style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          padding: '12px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <ShieldCheck size={20} color="var(--primary-emerald)" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Direct Firebase Realtime DB authenticated session active for user node /users/{userId}.
          </div>
        </div>

        <button
          onClick={logout}
          className="cyber-button-secondary"
          style={{ width: '100%', borderColor: 'rgba(244, 63, 94, 0.3)', color: 'var(--accent-rose)', justifyContent: 'center' }}
        >
          <LogOut size={18} /> Sign Out of Account
        </button>
      </div>
    </div>
  );
};
