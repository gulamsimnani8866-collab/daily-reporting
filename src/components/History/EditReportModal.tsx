import React, { useState, useEffect } from 'react';
import type { DailyReport } from '../../types';
import { StorageService, calculateDailyEarnings, RATE_RULE } from '../../services/storage';
import { Edit3, X, PackageCheck, RotateCcw, Package, Calculator, Loader2, AlertTriangle } from 'lucide-react';

interface EditReportModalProps {
  report: DailyReport;
  onClose: () => void;
  onSaveSuccess: () => void;
}

export const EditReportModal: React.FC<EditReportModalProps> = ({ report, onClose, onSaveSuccess }) => {
  const [totalParcels, setTotalParcels] = useState<number | ''>(report.totalParcels ?? (report.completedParcels + report.returnParcels));
  const [completed, setCompleted] = useState<number | ''>(report.completedParcels);
  const [returned, setReturned] = useState<number | ''>(report.returnParcels);
  const [notes, setNotes] = useState(report.notes || '');
  const [isAutoCalcReturn, setIsAutoCalcReturn] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto calculate returns
  useEffect(() => {
    if (isAutoCalcReturn) {
      const tot = typeof totalParcels === 'number' ? totalParcels : 0;
      const comp = typeof completed === 'number' ? completed : 0;
      setReturned(Math.max(0, tot - comp));
    }
  }, [totalParcels, completed, isAutoCalcReturn]);

  const numTotal = typeof totalParcels === 'number' ? totalParcels : 0;
  const numCompleted = typeof completed === 'number' ? completed : 0;
  const numReturned = typeof returned === 'number' ? returned : 0;

  const { rateApplied, earning } = calculateDailyEarnings(numCompleted);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (numCompleted < 0 || numReturned < 0 || numTotal < 0) {
      setErrorMsg('Parcel counts cannot be negative.');
      return;
    }

    if (numCompleted > numTotal && numTotal > 0) {
      setErrorMsg('Completed parcels cannot exceed Total parcels.');
      return;
    }

    setIsSubmitting(true);
    try {
      await StorageService.saveDailyReport({
        uid: report.uid,
        date: report.date,
        totalParcels: numTotal,
        completedParcels: numCompleted,
        returnParcels: numReturned,
        notes,
        isAbsent: report.isAbsent || false
      });

      onSaveSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update daily report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 150,
      background: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '20px',
        position: 'relative',
        border: '1px solid var(--border-glow)',
        boxShadow: '0 12px 35px rgba(0, 0, 0, 0.35)',
        animation: 'toastSlidePop 0.3s ease-out'
      }}>
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>

        {/* Modal Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.15)',
            color: 'var(--primary-emerald)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Edit3 size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Edit Shift Log ({report.date})
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Update completed, returned parcels and notes.
            </p>
          </div>
        </div>

        {report.status === 'rejected' && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            marginBottom: '12px',
            color: 'var(--accent-rose)',
            fontSize: '0.775rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <div>
              <strong>Rejection Reason:</strong> {report.rejectionReason || 'Incorrect parcel count logged.'}
            </div>
          </div>
        )}

        {errorMsg && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            marginBottom: '12px',
            color: 'var(--accent-rose)',
            fontSize: '0.8rem'
          }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
              Total Parcels (Assigned)
            </label>
            <div style={{ position: 'relative' }}>
              <Package size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-blue)' }} />
              <input
                type="number"
                min="0"
                required
                className="cyber-input"
                style={{ paddingLeft: '36px', minHeight: '38px', fontSize: '0.9rem', fontWeight: 600 }}
                value={totalParcels}
                onChange={e => setTotalParcels(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>
              Completed Parcels
            </label>
            <div style={{ position: 'relative' }}>
              <PackageCheck size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-emerald)' }} />
              <input
                type="number"
                min="0"
                required
                className="cyber-input"
                style={{ paddingLeft: '36px', minHeight: '38px', fontSize: '0.9rem', fontWeight: 600 }}
                value={completed}
                onChange={e => setCompleted(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                Return Parcels
              </label>
              <span style={{ fontSize: '0.65rem', color: 'var(--primary-teal)', fontWeight: 600 }}>
                ⚡ Auto-Calculated
              </span>
            </div>
            <div style={{ position: 'relative' }}>
              <RotateCcw size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-amber)' }} />
              <input
                type="number"
                min="0"
                required
                className="cyber-input"
                style={{ paddingLeft: '36px', minHeight: '38px', fontSize: '0.9rem', fontWeight: 600, background: 'var(--bg-dark)' }}
                value={returned}
                onChange={e => {
                  setIsAutoCalcReturn(false);
                  setReturned(e.target.value === '' ? '' : parseInt(e.target.value, 10));
                }}
              />
            </div>
          </div>

          {/* Rate & Earning Preview */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calculator size={13} /> Rate Applied
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                ₹{rateApplied} / parcel ({numCompleted > RATE_RULE.THRESHOLD ? 'Tier 2' : 'Standard'})
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Provisional Earning</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-emerald)' }}>
                ₹{earning.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={onClose}
              className="cyber-button-secondary"
              style={{ flex: 1, minHeight: '40px', fontSize: '0.85rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="cyber-button-primary"
              style={{ flex: 1, minHeight: '40px', fontSize: '0.85rem' }}
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin-fast" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
