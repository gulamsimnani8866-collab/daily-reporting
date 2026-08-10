import React, { useState } from 'react';
import type { DailyReport } from '../../types';
import { AlertTriangle, Edit3, X, ChevronRight, AlertCircle } from 'lucide-react';

interface RejectedAlertBannerProps {
  reports: DailyReport[];
  onSelectReportToEdit: (date: string) => void;
}

export const RejectedAlertBanner: React.FC<RejectedAlertBannerProps> = ({ reports, onSelectReportToEdit }) => {
  const [dismissed, setDismissed] = useState(false);

  const rejectedReports = reports.filter(r => r.status === 'rejected');

  if (dismissed || rejectedReports.length === 0) {
    return null;
  }

  const handleEditClick = (date: string) => {
    onSelectReportToEdit(date);
    const formEl = document.getElementById('report-section');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div
      className="rejected-alert-banner"
      style={{
        background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.12) 0%, rgba(225, 29, 72, 0.06) 100%)',
        border: '1.5px solid rgba(244, 63, 94, 0.45)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 16px',
        marginBottom: '18px',
        boxShadow: '0 8px 25px -5px rgba(244, 63, 94, 0.2)',
        position: 'relative',
        animation: 'toastSlidePop 0.4s ease-out'
      }}
    >
      {/* Banner Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: 'rgba(244, 63, 94, 0.2)',
            color: 'var(--accent-rose)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(244, 63, 94, 0.35)',
            flexShrink: 0
          }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-rose)' }}>
                Action Required: Admin Rejected {rejectedReports.length > 1 ? `${rejectedReports.length} Shift Reports` : 'Shift Report'} ⚠️
              </h3>
              <span className="pulse-badge pulse-badge-suspended" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                <span className="pulse-dot"></span> Rejection Alert
              </span>
            </div>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Admin has flagged incorrect details in your report. Please review the reasons below, update the entry, and resubmit for verification.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          style={{
            background: 'rgba(244, 63, 94, 0.1)',
            border: 'none',
            color: 'var(--text-dim)',
            cursor: 'pointer',
            borderRadius: '50%',
            padding: '5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          title="Dismiss alert banner"
        >
          <X size={16} />
        </button>
      </div>

      {/* Rejected Items List */}
      <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {rejectedReports.map(report => (
          <div
            key={report.id || report.date}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-main)' }}>
                📅 {report.date}
              </div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                • Completed: <strong style={{ color: 'var(--primary-emerald)' }}>{report.completedParcels}</strong> / Returned: <strong style={{ color: 'var(--accent-amber)' }}>{report.returnParcels}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-rose)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={14} />
                <span>Reason: {report.rejectionReason || 'Incorrect details reported'}</span>
              </div>

              <button
                type="button"
                onClick={() => handleEditClick(report.date)}
                className="cyber-button-primary"
                style={{
                  padding: '6px 14px',
                  minHeight: '34px',
                  fontSize: '0.775rem',
                  background: 'linear-gradient(135deg, #e11d48, #be123c)',
                  boxShadow: '0 3px 10px rgba(225, 29, 72, 0.3)',
                  gap: '6px'
                }}
              >
                <Edit3 size={14} /> Correct & Resubmit <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
