import React from 'react';
import type { DailyReport, PayoutCycle } from '../../types';
import { Wallet, CalendarRange, TrendingUp, Package } from 'lucide-react';

interface StatsDashboardProps {
  reports: DailyReport[];
  cycles: PayoutCycle[];
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ reports }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayReport = reports.find(r => r.date === todayStr);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthStr = (now.getMonth() + 1).toString().padStart(2, '0');
  const monthPrefix = `${currentYear}-${currentMonthStr}`;

  const dayOfMonth = now.getDate();
  const currentCycleType = dayOfMonth <= 15 ? 'A' : 'B';

  const currentCycleReports = reports.filter(r => {
    const d = new Date(r.date + 'T00:00:00');
    const day = d.getDate();
    const isCurrentMonth = r.date.startsWith(monthPrefix);
    return isCurrentMonth && (currentCycleType === 'A' ? day <= 15 : day >= 16);
  });

  const currentCycleEarning = currentCycleReports.reduce((sum, r) => sum + r.earning, 0);
  const currentCycleCompleted = currentCycleReports.reduce((sum, r) => sum + r.completedParcels, 0);

  const currentMonthReports = reports.filter(r => r.date.startsWith(monthPrefix));
  const currentMonthEarning = currentMonthReports.reduce((sum, r) => sum + r.earning, 0);

  const allTimeEarning = reports.reduce((sum, r) => sum + r.earning, 0);
  const allTimeCompleted = reports.reduce((sum, r) => sum + r.completedParcels, 0);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
      {/* Card 1: Today's Shift */}
      <div className="glass-panel glass-panel-hover" style={{
        padding: '20px',
        borderLeft: '4px solid var(--primary-emerald)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            TODAY'S SHIFT
          </span>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.15)',
            color: 'var(--primary-emerald)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Package size={18} />
          </div>
        </div>

        {todayReport ? (
          <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
              ₹{todayReport.earning.toLocaleString('en-IN')}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '6px',
              fontSize: '0.775rem'
            }}>
              <span style={{ color: 'var(--primary-emerald)', fontWeight: 600 }}>
                {todayReport.completedParcels} Parcels Completed
              </span>
              <span className={`pulse-badge ${todayReport.status === 'verified' ? 'pulse-badge-active' : 'pulse-badge-pending'}`} style={{ fontSize: '0.625rem', padding: '1px 6px' }}>
                {todayReport.status === 'verified' ? 'Verified' : 'Provisional'}
              </span>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-amber)', margin: '4px 0' }}>
              Pending Entry
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              No parcels logged for today yet.
            </p>
          </div>
        )}
      </div>

      {/* Card 2: Current Cycle */}
      <div className="glass-panel glass-panel-hover" style={{
        padding: '20px',
        borderLeft: '4px solid var(--primary-cyan)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            CURRENT CYCLE ({currentCycleType === 'A' ? '1st-15th' : '16th-End'})
          </span>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            background: 'rgba(6, 182, 212, 0.15)',
            color: 'var(--primary-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CalendarRange size={18} />
          </div>
        </div>

        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-cyan)', fontFamily: 'var(--font-heading)' }}>
          ₹{currentCycleEarning.toLocaleString('en-IN')}
        </div>
        <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '6px' }}>
          {currentCycleCompleted} Completed Parcels ({currentCycleReports.length} days logged)
        </div>
      </div>

      {/* Card 3: Current Month Total */}
      <div className="glass-panel glass-panel-hover" style={{
        padding: '20px',
        borderLeft: '4px solid var(--accent-blue)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            CURRENT MONTH TOTAL
          </span>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            background: 'rgba(59, 130, 246, 0.15)',
            color: 'var(--accent-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <TrendingUp size={18} />
          </div>
        </div>

        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
          ₹{currentMonthEarning.toLocaleString('en-IN')}
        </div>
        <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '6px' }}>
          {currentMonthReports.length} Active Work Days Logged
        </div>
      </div>

      {/* Card 4: Lifetime Earnings */}
      <div className="glass-panel glass-panel-hover" style={{
        padding: '20px',
        borderLeft: '4px solid var(--accent-amber)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            LIFETIME EARNINGS
          </span>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            background: 'rgba(245, 158, 11, 0.15)',
            color: 'var(--accent-amber)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Wallet size={18} />
          </div>
        </div>

        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-amber)', fontFamily: 'var(--font-heading)' }}>
          ₹{allTimeEarning.toLocaleString('en-IN')}
        </div>
        <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '6px' }}>
          {allTimeCompleted.toLocaleString('en-IN')} Parcels Delivered Overall
        </div>
      </div>
    </div>
  );
};
