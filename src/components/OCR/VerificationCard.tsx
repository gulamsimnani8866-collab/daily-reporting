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
        borderRadius: '14px',
        padding: '14px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        marginTop: '12px',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
        paddingBottom: '10px',
        borderBottom: '1px solid var(--border-color, #e2e8f0)',
        flexWrap: 'wrap',
        gap: '6px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <div style={{
            padding: '6px',
            borderRadius: '8px',
            background: 'rgba(34, 197, 94, 0.12)',
            color: '#16a34a',
            flexShrink: 0
          }}>
            <CheckCircle2 size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: '0.925rem', fontWeight: 700, color: 'var(--text-main, #1e293b)', lineHeight: 1.2 }}>
              Verification & Parcel Confirmation
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.7rem', color: 'var(--text-muted, #64748b)' }}>
              Review extracted numbers. Edit if needed.
            </p>
          </div>
        </div>

        <span style={{
          fontSize: '0.675rem',
          padding: '3px 8px',
          borderRadius: '9999px',
          background: 'rgba(59, 130, 246, 0.1)',
          color: '#2563eb',
          fontWeight: 600,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          flexShrink: 0
        }}>
          <Sparkles size={11} />
          OCR Extracted
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Responsive Mobile-Compact Verification Inputs Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(95px, 1fr))',
          gap: '8px',
          marginBottom: '12px'
        }}>
          {/* Total Parcels Field */}
          <div style={{
            background: 'var(--bg-main, #f8fafc)',
            padding: '10px 8px',
            borderRadius: '10px',
            border: '1px solid var(--border-color, #e2e8f0)',
            textAlign: 'center'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              fontSize: '0.7rem',
              fontWeight: 700,
              color: 'var(--text-muted, #64748b)',
              marginBottom: '4px',
              whiteSpace: 'nowrap'
            }}>
              <Package size={13} className="text-blue-500" />
              Total
            </label>
            <input
              type="number"
              min="0"
              value={total}
              onChange={(e) => setTotal(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              placeholder="0"
              style={{
                width: '100%',
                padding: '6px 4px',
                borderRadius: '6px',
                border: '1px solid var(--border-color, #cbd5e1)',
                fontSize: '1.05rem',
                fontWeight: 800,
                color: 'var(--text-main, #1e293b)',
                background: '#fff',
                textAlign: 'center',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Completed Parcels Field */}
          <div style={{
            background: 'rgba(34, 197, 94, 0.04)',
            padding: '10px 8px',
            borderRadius: '10px',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            textAlign: 'center'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              fontSize: '0.7rem',
              fontWeight: 700,
              color: '#16a34a',
              marginBottom: '4px',
              whiteSpace: 'nowrap'
            }}>
              <PackageCheck size={13} />
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
                padding: '6px 4px',
                borderRadius: '6px',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                fontSize: '1.05rem',
                fontWeight: 800,
                color: '#15803d',
                background: '#fff',
                textAlign: 'center',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Returned Parcels Field */}
          <div style={{
            background: 'rgba(239, 68, 68, 0.04)',
            padding: '10px 8px',
            borderRadius: '10px',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            textAlign: 'center'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              fontSize: '0.7rem',
              fontWeight: 700,
              color: '#dc2626',
              marginBottom: '4px',
              whiteSpace: 'nowrap'
            }}>
              <RotateCcw size={13} />
              Returned
            </label>
            <input
              type="number"
              min="0"
              value={returned}
              onChange={(e) => setReturned(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              placeholder="0"
              style={{
                width: '100%',
                padding: '6px 4px',
                borderRadius: '6px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                fontSize: '1.05rem',
                fontWeight: 800,
                color: '#b91c1c',
                background: '#fff',
                textAlign: 'center',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Dynamic Mobile Compact Earnings Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(99, 102, 241, 0.1) 100%)',
          borderRadius: '10px',
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
          border: '1px solid rgba(37, 99, 235, 0.15)',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            <Calculator size={16} style={{ color: '#2563eb', flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748b)', fontWeight: 500, display: 'block' }}>
                Rate Applied:
              </span>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main, #1e293b)', whiteSpace: 'nowrap' }}>
                ₹{rateApplied}/parcel ({numCompleted > 70 ? 'Tier 2' : 'Tier 1'})
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.3px', display: 'block' }}>
              Est. Daily Payout
            </span>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#16a34a', lineHeight: 1.1 }}>
              ₹{earning}
            </div>
          </div>
        </div>

        {/* Validation Errors & API Error Alert */}
        {(validationError || submitError) && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '8px 12px',
            color: '#dc2626',
            fontSize: '0.775rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '12px'
          }}>
            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
            <span>{validationError || submitError}</span>
          </div>
        )}

        {/* Notes Field */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-muted, #64748b)', display: 'block', marginBottom: '4px' }}>
            Optional Notes / Hub Details:
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Morning runsheet completed"
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: '8px',
              border: '1px solid var(--border-color, #cbd5e1)',
              fontSize: '0.825rem',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* OCR Raw Text Details Drawer */}
        {rawText && (
          <div style={{ marginBottom: '12px' }}>
            <button
              type="button"
              onClick={() => setShowRawText(!showRawText)}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563eb',
                fontSize: '0.725rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: 0
              }}
            >
              <FileText size={13} />
              {showRawText ? 'Hide Scanned Text' : 'View Scanned Text'}
            </button>

            {showRawText && (
              <pre style={{
                marginTop: '4px',
                padding: '8px',
                background: 'var(--bg-main, #f8fafc)',
                borderRadius: '6px',
                fontSize: '0.7rem',
                color: 'var(--text-muted, #64748b)',
                maxHeight: '100px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                border: '1px solid var(--border-color, #e2e8f0)'
              }}>
                {rawText}
              </pre>
            )}
          </div>
        )}

        {/* Mobile-First Full Width Touch Submit Action */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          width: '100%',
          marginTop: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img
              src={previewUrl}
              alt="Screenshot proof"
              style={{
                width: '34px',
                height: '34px',
                objectFit: 'cover',
                borderRadius: '6px',
                border: '1px solid rgba(0,0,0,0.1)',
                flexShrink: 0
              }}
            />
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted, #64748b)', lineHeight: 1.2 }}>
              Screenshot attached for Cloudinary & Admin verification
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || Boolean(validationError)}
            style={{
              width: '100%',
              minHeight: '46px',
              padding: '12px 20px',
              borderRadius: '10px',
              background: isSubmitting || validationError ? '#cbd5e1' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.925rem',
              border: 'none',
              cursor: isSubmitting || validationError ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: isSubmitting || validationError ? 'none' : '0 4px 14px rgba(37, 99, 235, 0.3)',
              transition: 'all 0.2s',
              boxSizing: 'border-box'
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
