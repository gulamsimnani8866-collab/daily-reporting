import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, CheckCircle, FileText, AlertTriangle, Info, CheckCheck } from 'lucide-react';

interface NotificationDrawerProps {
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ onClose }) => {
  const { notifications, markNotificationsRead } = useAuth();

  const getIcon = (type: string) => {
    switch (type) {
      case 'verification':
        return <CheckCircle size={18} color="var(--primary-emerald)" />;
      case 'cycle_closed':
        return <FileText size={18} color="var(--primary-cyan)" />;
      case 'account_status':
        return <AlertTriangle size={18} color="var(--accent-rose)" />;
      default:
        return <Info size={18} color="var(--accent-blue)" />;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(4px)',
      zIndex: 100,
      display: 'flex',
      justifyContent: 'flex-end'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '380px',
        height: '100%',
        borderRadius: 0,
        borderLeft: '1px solid var(--border-glass)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-10px 0 30px rgba(0,0,0,0.5)'
      }}>
        {/* Drawer Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-glass)'
        }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Notifications
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Activity alerts & payout report updates
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Bar */}
        {notifications.length > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '10px 0'
          }}>
            <button
              onClick={markNotificationsRead}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary-emerald)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          </div>
        )}

        {/* Notification List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          paddingTop: '8px'
        }}>
          {notifications.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'var(--text-dim)'
            }}>
              No notifications yet.
            </div>
          ) : (
            notifications.map(notif => (
              <div
                key={notif.id}
                style={{
                  background: notif.read ? 'rgba(255, 255, 255, 0.02)' : 'rgba(16, 185, 129, 0.06)',
                  border: notif.read ? '1px solid var(--border-glass)' : '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                  display: 'flex',
                  gap: '12px',
                  position: 'relative'
                }}
              >
                <div style={{ marginTop: '2px' }}>{getIcon(notif.type)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    marginBottom: '4px'
                  }}>
                    {notif.title}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {notif.message}
                  </div>
                  <div style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-dim)',
                    marginTop: '6px'
                  }}>
                    {new Date(notif.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
