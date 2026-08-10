import React from 'react';
import type { PayoutCycle, DailyReport, UserProfile } from '../../types';
import { generateCyclePDF } from '../../services/pdfGenerator';
import { FileText, Download, Sparkles, Lock, CheckCircle2, Clock } from 'lucide-react';

interface PayoutCyclesSectionProps {
  user: UserProfile;
  cycles: PayoutCycle[];
  reports: DailyReport[];
}

export const PayoutCyclesSection: React.FC<PayoutCyclesSectionProps> = ({ user, cycles, reports }) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const handleDownloadPDF = (cycle: PayoutCycle) => {
    // Only pass verified reports to the PDF statement generator
    const verifiedCycleReports = reports.filter(r => {
      return r.date >= cycle.startDate && r.date <= cycle.endDate && r.status === 'verified';
    });

    generateCyclePDF(cycle, verifiedCycleReports, user);
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={22} color="var(--primary-cyan)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Bi-Monthly Payout Statements & Reports
            </h3>
          </div>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            15-Day Billing Cycle Summary (Cycle A: 1st–15th | Cycle B: 16th–End of Month)
          </p>
        </div>

        <div style={{
          fontSize: '0.75rem',
          color: 'var(--primary-emerald)',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          padding: '6px 12px',
          borderRadius: 'var(--radius-full)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Sparkles size={14} /> Verified Parcels Only
        </div>
      </div>

      {cycles.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
          No billing cycle history recorded yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
          {cycles.map(cycle => {
            const isFullyVerified = cycle.verifiedCount > 0 && cycle.pendingCount === 0;
            const isCycleCompleted = todayStr > cycle.endDate;

            return (
              <div
                key={cycle.cycleId}
                className="glass-panel glass-panel-hover"
                style={{
                  padding: '20px',
                  border: '1px solid var(--border-glass)',
                  background: 'var(--bg-card)',
                  position: 'relative'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '14px',
                  paddingBottom: '10px',
                  borderBottom: '1px solid var(--border-glass)'
                }}>
                  <div>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      color: 'var(--primary-cyan)',
                      letterSpacing: '0.05em'
                    }}>
                      CYCLE {cycle.cycleType} ({cycle.monthName} {cycle.year})
                    </span>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                      {cycle.startDate} → {cycle.endDate}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span className={`pulse-badge ${isFullyVerified ? 'pulse-badge-active' : 'pulse-badge-pending'}`} style={{ fontSize: '0.65rem' }}>
                      <span className="pulse-dot"></span>
                      {isFullyVerified ? 'Audited & Verified' : 'Open / Pending'}
                    </span>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      color: isCycleCompleted ? 'var(--primary-emerald)' : 'var(--accent-amber)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {isCycleCompleted ? (
                        <>
                          <CheckCircle2 size={12} /> Cycle Completed
                        </>
                      ) : (
                        <>
                          <Clock size={12} /> Cycle In Progress
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '10px',
                  marginBottom: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Completed</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-emerald)' }}>
                      {cycle.totalCompleted}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Returned</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
                      {cycle.totalReturned}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Net Earning</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      ₹{cycle.totalEarning.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {cycle.pendingCount > 0 && (
                  <div style={{
                    fontSize: '0.725rem',
                    color: 'var(--accent-amber)',
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '6px 10px',
                    marginBottom: '12px',
                    textAlign: 'center'
                  }}>
                    🛡️ Showing verified parcels only. {cycle.pendingCount} pending {cycle.pendingCount === 1 ? 'report is' : 'reports are'} awaiting Admin verification.
                  </div>
                )}

                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span>Verification Status:</span>
                  <span style={{ fontWeight: 600, color: isFullyVerified ? 'var(--primary-emerald)' : 'var(--accent-amber)' }}>
                    {cycle.verifiedCount} / {cycle.verifiedCount + cycle.pendingCount} Days Verified
                  </span>
                </div>

                {isCycleCompleted ? (
                  <button
                    onClick={() => handleDownloadPDF(cycle)}
                    className="cyber-button-primary"
                    style={{
                      width: '100%',
                      minHeight: '42px',
                      fontSize: '0.875rem',
                      background: 'linear-gradient(135deg, var(--primary-teal), var(--primary-cyan))',
                      boxShadow: '0 4px 14px rgba(6, 182, 212, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Download size={16} /> Download Official PDF Report
                  </button>
                ) : (
                  <div>
                    <button
                      disabled
                      className="cyber-button-secondary"
                      style={{
                        width: '100%',
                        minHeight: '42px',
                        fontSize: '0.825rem',
                        opacity: 0.6,
                        cursor: 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        color: 'var(--text-muted)',
                        borderColor: 'var(--border-glass)'
                      }}
                      title={`PDF report is locked. Available after ${cycle.endDate} when cycle ends.`}
                    >
                      <Lock size={15} /> PDF Download Locked (Unlocks after {cycle.cycleType === 'A' ? '15th' : 'End of Month'})
                    </button>
                    <div style={{
                      fontSize: '0.675rem',
                      color: 'var(--text-dim)',
                      textAlign: 'center',
                      marginTop: '4px'
                    }}>
                      🔒 Official PDF statement compiles after cycle completion ({cycle.endDate}).
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
