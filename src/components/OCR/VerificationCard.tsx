import React, { useState, useEffect } from 'react';
import { calculateDailyEarnings } from '../../services/storage';
import {
  CheckCircle2, AlertTriangle, Calculator, FileText,
  Package, PackageCheck, RotateCcw, CloudUpload, Loader2, Sparkles
} from 'lucide-react';

interface VerificationCardProps {
  extractedTotal: number | null;
  extractedCompleted: number | null;
  extractedReturned: number | null;
  rawText: string;
  imageFile: File;
  onConfirmSubmit: (data: {
    totalParcels: number;
    completedParcels: number;
    returnParcels: number;
    notes?: string;
  }) => Promise<void>;
  isSubmitting: boolean;
  submitError?: string | null;
}

export const VerificationCard: React.FC<VerificationCardProps> = ({
  extractedTotal,
  extractedCompleted,
  extractedReturned,
  rawText,
  imageFile,
  onConfirmSubmit,
  isSubmitting,
  submitError
}) => {
  const [showRawText, setShowRawText] = useState(false);
  const compVal = typeof extractedCompleted === 'number' ? extractedCompleted : 0;
  const retVal = typeof extractedReturned === 'number' ? extractedReturned : 0;
  const initialTotal = extractedTotal && extractedTotal >= compVal ? extractedTotal : (compVal > 0 ? compVal + retVal : '');

  const [total, setTotal] = useState<number | ''>(initialTotal);
  const [completed, setCompleted] = useState<number | ''>(extractedCompleted ?? '');
  const [returned, setReturned] = useState<number | ''>(retVal);
  const [notes, setNotes] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Auto calculate returned when total or completed changes
  useEffect(() => {
    const tot = typeof total === 'number' ? total : 0;
    const comp = typeof completed === 'number' ? completed : 0;
    if (tot > 0 || comp > 0) {
      setReturned(Math.max(0, tot - comp));
    }
  }, [total, completed]);

  // Perform real-time validation checks
  const numTotal = typeof total === 'number' ? total : 0;
  const numCompleted = typeof completed === 'number' ? completed : 0;
  const numReturned = typeof returned === 'number' ? returned : 0;

  useEffect(() => {
    if (numCompleted < 0 || numReturned < 0 || numTotal < 0) {
      setValidationError('Parcel counts cannot be negative.');
    } else if (numTotal > 0 && numCompleted > numTotal) {
      setValidationError('Completed parcels cannot exceed Total parcels assigned.');
    } else {
      setValidationError(null);
    }
  }, [numTotal, numCompleted, numReturned]);

  const { rateApplied, earning } = calculateDailyEarnings(numCompleted);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validationError) return;
    onConfirmSubmit({
      totalParcels: numTotal,
      completedParcels: numCompleted,
      returnParcels: numReturned,
      notes
    });
  };

  const previewUrl = URL.createObjectURL(imageFile);

  return (
    <div
      style={{
        background: 'var(--bg-secondary, #ffffff)',
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        marginTop: '16px'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '1px solid var(--border-color, #e2e8f0)',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            padding: '8px',
            borderRadius: '10px',
            background: 'rgba(34, 197, 94, 0.12)',
            color: '#16a34a'
          }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main, #1e293b)' }}>
              Step 3: Verification & Parcel Confirmation
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
              Review extracted parcel numbers below. Edit fields if any number requires correction.
            </p>
          </div>
        </div>

        <span style={{
          fontSize: '0.725rem',
          padding: '4px 10px',
          borderRadius: '9999px',
          background: 'rgba(59, 130, 246, 0.1)',
          color: '#2563eb',
          fontWeight: 600,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <Sparkles size={12} />
          OCR Extracted
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Verification Inputs Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px',
          marginBottom: '16px'
        }}>
          {/* Total Parcels Field */}
          <div style={{
            background: 'var(--bg-main, #f8fafc)',
            padding: '12px',
            borderRadius: '12px',
            border: '1px solid var(--border-color, #e2e8f0)'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--text-muted, #64748b)',
              marginBottom: '6px'
            }}>
              <Package size={14} className="text-blue-500" />
              Total Parcels
            </label>
            <input
              type="number"
              min="0"
              value={total}
              onChange={(e) => setTotal(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              placeholder="0"
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #cbd5e1)',
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--text-main, #1e293b)',
                background: '#fff'
              }}
            />
          </div>

          {/* Completed Parcels Field */}
          <div style={{
            background: 'rgba(34, 197, 94, 0.04)',
            padding: '12px',
            borderRadius: '12px',
            border: '1px solid rgba(34, 197, 94, 0.2)'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#16a34a',
              marginBottom: '6px'
            }}>
              <PackageCheck size={14} />
              Completed
            </label>
            <input
              type="number"
              min="0"
              value={completed}
              onChange={(e) => setCompleted(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              placeholder="0"
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                fontSize: '1.1rem',
                fontWeight: 700,
                color: '#15803d',
                background: '#fff'
              }}
            />
          </div>

          {/* Returned Parcels Field */}
          <div style={{
            background: 'rgba(239, 68, 68, 0.04)',
            padding: '12px',
            borderRadius: '12px',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#dc2626',
              marginBottom: '6px'
            }}>
              <RotateCcw size={14} />
              Returned / RTO
            </label>
            <input
              type="number"
              min="0"
              value={returned}
              onChange={(e) => setReturned(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              placeholder="0"
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                fontSize: '1.1rem',
                fontWeight: 700,
                color: '#b91c1c',
                background: '#fff'
              }}
            />
          </div>
        </div>

        {/* Dynamic Provisional Earnings Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(99, 102, 241, 0.1) 100%)',
          borderRadius: '12px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          border: '1px solid rgba(37, 99, 235, 0.15)',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calculator size={18} style={{ color: '#2563eb' }} />
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', fontWeight: 500 }}>
                Calculated Earnings Rate:
              </span>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main, #1e293b)' }}>
                ₹{rateApplied} / parcel ({numCompleted > 70 ? 'Tier 2 High Volume Rate' : 'Tier 1 Standard Rate'})
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Est. Daily Payout
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a' }}>
              ₹{earning}
            </div>
          </div>
        </div>

        {/* Validation Errors & API Error Alert */}
        {(validationError || submitError) && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            padding: '10px 14px',
            color: '#dc2626',
            fontSize: '0.8rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>{validationError || submitError}</span>
          </div>
        )}

        {/* Notes Field */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted, #64748b)', display: 'block', marginBottom: '4px' }}>
            Optional Notes / Hub Details:
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Morning runsheet completed, 3 customer rejected"
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color, #cbd5e1)',
              fontSize: '0.85rem'
            }}
          />
        </div>

        {/* OCR Raw Text Details Drawer */}
        {rawText && (
          <div style={{ marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => setShowRawText(!showRawText)}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563eb',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: 0
              }}
            >
              <FileText size={14} />
              {showRawText ? 'Hide Raw Scanned Text' : 'View Raw Scanned Text'}
            </button>

            {showRawText && (
              <pre style={{
                marginTop: '6px',
                padding: '10px',
                background: 'var(--bg-main, #f8fafc)',
                borderRadius: '8px',
                fontSize: '0.725rem',
                color: 'var(--text-muted, #64748b)',
                maxHeight: '120px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                border: '1px solid var(--border-color, #e2e8f0)'
              }}>
                {rawText}
              </pre>
            )}
          </div>
        )}

        {/* Upload Proof Thumbnail & Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img
              src={previewUrl}
              alt="Screenshot proof"
              style={{
                width: '40px',
                height: '40px',
                objectFit: 'cover',
                borderRadius: '6px',
                border: '1px solid rgba(0,0,0,0.1)'
              }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)' }}>
              Screenshot attached for Cloudinary & Admin audit
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || Boolean(validationError)}
            style={{
              padding: '10px 24px',
              borderRadius: '10px',
              background: isSubmitting || validationError ? '#cbd5e1' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.9rem',
              border: 'none',
              cursor: isSubmitting || validationError ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: isSubmitting || validationError ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.25)',
              transition: 'all 0.2s'
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Uploading & Saving...
              </>
            ) : (
              <>
                <CloudUpload size={18} />
                Confirm & Submit Report
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
