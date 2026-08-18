import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Truck, Lock, User, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';

export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const [identityInput, setIdentityInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(identityInput, password);
      setLoading(false);
      if (!res.success && res.error) {
        setError(res.error);
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Database connection error.');
    }
  };

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
        maxWidth: '440px',
        padding: '36px 28px',
        border: '1px solid var(--border-glow)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
      }}>
        {/* Delivery Partner App Logo & Title */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, var(--primary-emerald), var(--primary-cyan))',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
            marginBottom: '16px'
          }}>
            <Truck size={32} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Partner Portal Login
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '6px' }}>
            Direct Realtime DB Authentication & Parcel Reporting
          </p>
        </div>

        {/* Red Alert Banner */}
        {error && (
          <div 
            id="login-error-alert"
            style={{
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              color: 'var(--accent-rose)',
              fontSize: '0.875rem',
              fontWeight: 500
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.825rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              marginBottom: '6px'
            }}>
              User ID / Email
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-dim)'
              }} />
              <input
                type="text"
                required
                className="cyber-input"
                style={{ paddingLeft: '42px' }}
                placeholder="Enter User ID (e.g. 100001389287) or Email"
                value={identityInput}
                onChange={e => setIdentityInput(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.825rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              marginBottom: '6px'
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-dim)'
              }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="cyber-input"
                style={{ paddingLeft: '42px', paddingRight: '42px' }}
                placeholder="••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="cyber-button-primary"
            style={{ width: '100%', marginTop: '6px', justifyContent: 'center' }}
          >
            {loading ? 'Authenticating Login...' : 'Sign In to Dashboard'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          paddingTop: '18px',
          borderTop: '1px solid var(--border-glass)',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
            🔒 Direct Realtime Database Auth. Credentials are created by the Admin.
          </p>
        </div>
      </div>
    </div>
  );
};
