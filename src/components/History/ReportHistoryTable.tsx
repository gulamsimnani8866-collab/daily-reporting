import React, { useState } from 'react';
import type { DailyReport } from '../../types';
import { StorageService } from '../../services/storage';
import { EditReportModal } from './EditReportModal';
import { Search, PackageCheck, RotateCcw, AlertTriangle, Edit3, Trash2, Lock, X, Loader2 } from 'lucide-react';
import { formatDateDDMMYYYY } from '../../utils/dateFormatter';

interface ReportHistoryTableProps {
  reports: DailyReport[];
  onDataChanged: () => void;
  onSelectReportToEdit?: (date: string) => void;
}

export const ReportHistoryTable: React.FC<ReportHistoryTableProps> = ({ reports, onDataChanged, onSelectReportToEdit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'pending' | 'rejected'>('all');

  // Edit and Delete state
  const [editingReport, setEditingReport] = useState<DailyReport | null>(null);
  const [deletingReport, setDeletingReport] = useState<DailyReport | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredReports = reports.filter(r => {
    const formattedDate = formatDateDDMMYYYY(r.date);
    const matchesSearch = r.date.includes(searchTerm) || formattedDate.includes(searchTerm) || (r.notes && r.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' ? true : r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleEditClick = (report: DailyReport) => {
    if (report.status === 'verified') {
      return;
    }
    if (onSelectReportToEdit) {
      onSelectReportToEdit(report.date);
      const formEl = document.getElementById('report-section');
      if (formEl) {
        formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      setEditingReport(report);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingReport) return;
    setIsDeleting(true);
    try {
      await StorageService.deleteDailyReport(deletingReport.uid, deletingReport.date);
      setDeletingReport(null);
      onDataChanged();
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: DailyReport['status']) => {
    switch (status) {
      case 'verified':
        return (
          <span className="pulse-badge pulse-badge-active" style={{ fontSize: '0.65rem' }}>
            <span className="pulse-dot"></span> Verified
          </span>
        );
      case 'rejected':
        return (
          <span className="pulse-badge pulse-badge-suspended" style={{ fontSize: '0.65rem' }}>
            <span className="pulse-dot"></span> Action Required
          </span>
        );
      default:
        return (
          <span className="pulse-badge pulse-badge-pending" style={{ fontSize: '0.65rem' }}>
            <span className="pulse-dot"></span> Pending Review
          </span>
        );
    }
  };

  return (
    <div id="history-section" className="glass-panel" style={{ padding: '14px', marginBottom: '10px' }}>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        marginBottom: '10px'
      }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Work Shift History
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Logged parcel dispatches, verification status & earnings.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '160px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              placeholder="Search date..."
              className="cyber-input"
              style={{ paddingLeft: '30px', minHeight: '32px', fontSize: '0.75rem' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{
            display: 'flex',
            background: 'var(--bg-dark)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px'
          }}>
            {(['all', 'pending', 'verified', 'rejected'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  background: statusFilter === st ? 'var(--bg-card)' : 'transparent',
                  border: 'none',
                  color: statusFilter === st ? 'var(--text-main)' : 'var(--text-dim)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Card List View (visible on small screens) */}
      <div 
        className="mobile-only-cards"
        style={{
          maxHeight: filteredReports.length > 10 ? '540px' : 'auto',
          overflowY: filteredReports.length > 10 ? 'auto' : 'visible',
          paddingRight: filteredReports.length > 10 ? '4px' : '0'
        }}
      >
        {filteredReports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
            No shift logs found.
          </div>
        ) : (
          filteredReports.map(report => (
            <div
              key={report.id}
              className="glass-panel"
              style={{
                padding: '12px',
                marginBottom: '8px',
                border: report.status === 'rejected' ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid var(--border-glass)',
                background: 'var(--bg-card)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                  {formatDateDDMMYYYY(report.date)}
                  {report.isAbsent && (
                    <span style={{ marginLeft: '6px', fontSize: '0.65rem', color: 'var(--accent-rose)', background: 'rgba(244, 63, 94, 0.1)', padding: '1px 6px', borderRadius: '4px' }}>
                      Absent
                    </span>
                  )}
                </div>
                {getStatusBadge(report.status)}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', textAlign: 'center', background: 'var(--bg-dark)', padding: '8px 4px', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <div style={{ fontSize: '0.625rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Total</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.85rem' }}>{report.totalParcels ?? (report.completedParcels + report.returnParcels)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.625rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Completed</div>
                  <div style={{ fontWeight: 700, color: 'var(--primary-emerald)', fontSize: '0.85rem' }}>{report.completedParcels}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.625rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Returned</div>
                  <div style={{ fontWeight: 700, color: 'var(--accent-amber)', fontSize: '0.85rem' }}>{report.returnParcels}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.625rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Earning</div>
                  <div style={{ fontWeight: 800, color: 'var(--primary-cyan)', fontSize: '0.85rem' }}>₹{report.earning.toLocaleString('en-IN')}</div>
                </div>
              </div>

              {report.status === 'rejected' && (
                <div style={{ marginTop: '8px', padding: '6px 8px', background: 'rgba(244, 63, 94, 0.08)', borderRadius: '4px', fontSize: '0.725rem', color: 'var(--accent-rose)' }}>
                  <AlertTriangle size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                  <strong>Rejection Note:</strong> {report.rejectionReason || 'Incorrect parcel count logged. Please update.'}
                </div>
              )}

              {/* Mobile Card Footer: Rate Applied Badge on Left, Status/Actions on Right */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed var(--border-glass)' }}>
                <span style={{
                  background: report.rateApplied === 17 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(148, 163, 184, 0.12)',
                  color: report.rateApplied === 17 ? 'var(--primary-emerald)' : 'var(--text-muted)',
                  border: `1px solid ${report.rateApplied === 17 ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-glass)'}`,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.675rem',
                  fontWeight: 700
                }}>
                  ₹{report.rateApplied || (report.completedParcels > 70 ? 17 : 16)} / parcel
                </span>

                {report.status === 'verified' ? (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Lock size={12} /> Verified & Locked
                  </span>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleEditClick(report)}
                      className="cyber-button-secondary"
                      style={{ height: '30px', minHeight: '30px', padding: '0 10px', fontSize: '0.725rem' }}
                    >
                      <Edit3 size={13} /> Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeletingReport(report)}
                      style={{
                        height: '30px',
                        minHeight: '30px',
                        padding: '0 10px',
                        fontSize: '0.725rem',
                        background: 'rgba(244, 63, 94, 0.08)',
                        border: '1px solid rgba(244, 63, 94, 0.25)',
                        color: 'var(--accent-rose)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 600
                      }}
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table (visible on larger screens) */}
      <div 
        className="desktop-table-wrapper" 
        style={{ 
          overflowX: 'auto',
          maxHeight: filteredReports.length > 10 ? '480px' : 'auto',
          overflowY: filteredReports.length > 10 ? 'auto' : 'visible',
          border: filteredReports.length > 10 ? '1px solid var(--border-glass)' : 'none',
          borderRadius: filteredReports.length > 10 ? 'var(--radius-sm)' : 0
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{
            position: filteredReports.length > 10 ? 'sticky' : 'static',
            top: 0,
            background: 'var(--bg-card)',
            zIndex: 2,
            boxShadow: filteredReports.length > 10 ? '0 2px 8px rgba(0,0,0,0.15)' : 'none'
          }}>
            <tr style={{
              borderBottom: '1px solid var(--border-glass)',
              color: 'var(--text-dim)',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <th style={{ padding: '10px 12px' }}>Date</th>
              <th style={{ padding: '10px 12px' }}>Total</th>
              <th style={{ padding: '10px 12px' }}>Completed</th>
              <th style={{ padding: '10px 12px' }}>Returned</th>
              <th style={{ padding: '10px 12px' }}>Rate Applied</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Earning</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.875rem' }}>
                  No daily reports found.
                </td>
              </tr>
            ) : (
              filteredReports.map(report => (
                <tr
                  key={report.id}
                  style={{
                    borderBottom: '1px solid rgba(226, 232, 240, 0.6)',
                    background: report.status === 'rejected' ? 'rgba(244, 63, 94, 0.03)' : 'transparent'
                  }}
                >
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                    {formatDateDDMMYYYY(report.date)}
                    {report.isAbsent && (
                      <span style={{ marginLeft: '6px', fontSize: '0.65rem', color: 'var(--accent-rose)', background: 'rgba(244, 63, 94, 0.1)', padding: '1px 6px', borderRadius: '4px' }}>
                        Absent
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: '0.85rem', fontWeight: 600 }}>
                    {report.totalParcels ?? (report.completedParcels + report.returnParcels)}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: '0.85rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--primary-emerald)', fontWeight: 700 }}>
                      <PackageCheck size={14} /> {report.completedParcels}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <RotateCcw size={13} color="var(--accent-amber)" /> {report.returnParcels}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: '0.8rem' }}>
                    <span style={{
                      background: report.rateApplied === 17 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(148, 163, 184, 0.12)',
                      color: report.rateApplied === 17 ? 'var(--primary-emerald)' : 'var(--text-muted)',
                      border: `1px solid ${report.rateApplied === 17 ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-glass)'}`,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: 700
                    }}>
                      ₹{report.rateApplied} / parcel
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                    ₹{report.earning.toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    {getStatusBadge(report.status)}
                    {report.status === 'rejected' && report.rejectionReason && (
                      <div style={{ fontSize: '0.675rem', color: 'var(--accent-rose)', marginTop: '2px' }}>
                        {report.rejectionReason}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    {report.status === 'verified' ? (
                      <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)', display: 'inline-flex', alignItems: 'center', gap: '4px' }} title="Verified reports cannot be edited or deleted">
                        <Lock size={13} /> Locked
                      </span>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleEditClick(report)}
                          className="cyber-button-secondary"
                          title="Edit shift report"
                          style={{
                            height: '28px',
                            minHeight: '28px',
                            padding: '0 8px',
                            fontSize: '0.725rem'
                          }}
                        >
                          <Edit3 size={13} /> Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeletingReport(report)}
                          title="Delete shift report"
                          style={{
                            height: '28px',
                            minHeight: '28px',
                            padding: '0 8px',
                            fontSize: '0.725rem',
                            background: 'rgba(244, 63, 94, 0.08)',
                            border: '1px solid rgba(244, 63, 94, 0.25)',
                            color: 'var(--accent-rose)',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 600
                          }}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredReports.length > 10 && (
        <div style={{
          textAlign: 'center',
          fontSize: '0.725rem',
          color: 'var(--text-dim)',
          marginTop: '8px',
          padding: '6px 12px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-glass)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}>
          📜 Total {filteredReports.length} history entries logged. Scroll vertically inside table to view all records.
        </div>
      )}

      {/* Edit Modal (if triggered directly from table) */}
      {editingReport && (
        <EditReportModal
          report={editingReport}
          onClose={() => setEditingReport(null)}
          onSaveSuccess={() => {
            onDataChanged();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingReport && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 160,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '400px',
            padding: '20px',
            position: 'relative',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.35)',
            animation: 'toastSlidePop 0.3s ease-out'
          }}>
            <button
              onClick={() => setDeletingReport(null)}
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(244, 63, 94, 0.15)',
                color: 'var(--accent-rose)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Trash2 size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Delete Shift Log?
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Permanently remove report entry for <strong>{formatDateDDMMYYYY(deletingReport.date)}</strong>
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.4 }}>
              Are you sure you want to delete this shift report? This will remove the logged parcels ({deletingReport.completedParcels} completed) and ₹{deletingReport.earning.toLocaleString('en-IN')} earnings for {formatDateDDMMYYYY(deletingReport.date)}.
            </p>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setDeletingReport(null)}
                className="cyber-button-secondary"
                style={{ flex: 1, minHeight: '40px', fontSize: '0.85rem' }}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="cyber-button-primary"
                style={{
                  flex: 1,
                  minHeight: '40px',
                  fontSize: '0.85rem',
                  background: 'linear-gradient(135deg, #e11d48, #be123c)',
                  boxShadow: '0 4px 14px rgba(225, 29, 72, 0.3)'
                }}
              >
                {isDeleting ? <Loader2 size={16} className="animate-spin-fast" /> : 'Yes, Delete Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
