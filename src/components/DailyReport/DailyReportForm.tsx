import React, { useState, useEffect, useRef } from 'react';
import { StorageService } from '../../services/storage';
import { FirebaseService } from '../../services/firebase';
import type { DailyReport, UserProfile } from '../../types';
import {
  Calendar, CheckCircle2, Edit3, UserX, AlertTriangle, X, Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { uploadToCloudinary } from '../../services/cloudinary';
import { processScreenshotOCR, type OCRResult } from '../../services/ocr';
import { ImageUploader } from '../OCR/ImageUploader';
import { OCRProcessor } from '../OCR/OCRProcessor';
import { VerificationCard } from '../OCR/VerificationCard';

interface DailyReportFormProps {
  user: UserProfile;
  onReportSubmitted: () => void;
  selectedEditDate?: string;
}

interface SuccessDetails {
  isUpdate: boolean;
  isAbsent?: boolean;
  date: string;
  totalParcels: number;
  completedParcels: number;
  returnParcels: number;
  earning: number;
  submittedAtTime: string;
}

export const DailyReportForm: React.FC<DailyReportFormProps> = ({ user, onReportSubmitted, selectedEditDate }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(todayStr);

  useEffect(() => {
    if (selectedEditDate) {
      setDate(selectedEditDate);
    }
  }, [selectedEditDate]);

  // OCR & Cloudinary States
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [isScanningOCR, setIsScanningOCR] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState('');
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [ocrSubmitError, setOcrSubmitError] = useState<string | null>(null);

  // Absent Reporting Modal state
  const [showAbsentModal, setShowAbsentModal] = useState(false);
  const [absentDate, setAbsentDate] = useState(todayStr);
  const [absentReason, setAbsentReason] = useState('Personal Work');

  const [existingReport, setExistingReport] = useState<DailyReport | null>(null);
  const [successDetails, setSuccessDetails] = useState<SuccessDetails | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const successBarRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll into view and 8-second auto-dismiss timer for success message bar
  useEffect(() => {
    if (successDetails) {
      if (successBarRef.current) {
        successBarRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      const timer = setTimeout(() => {
        setSuccessDetails(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [successDetails]);

  // Check existing reports for date duplicate detection
  useEffect(() => {
    FirebaseService.getDailyReports(user.uid).then(reports => {
      const match = reports.find(r => r.date === date);
      if (match) {
        setExistingReport(match);
      } else {
        setExistingReport(null);
      }
    });
  }, [date, user.uid]);

  // Handle Screenshot Upload & Trigger Tesseract OCR Scanning
  const handleImageSelected = async (file: File) => {
    setOcrFile(file);
    setOcrResult(null);
    setOcrSubmitError(null);
    setIsScanningOCR(true);
    setOcrProgress(10);
    setOcrStatus('Initializing Tesseract.js OCR engine...');

    try {
      const result = await processScreenshotOCR(file, (progress, status) => {
        setOcrProgress(progress);
        setOcrStatus(status);
      });
      setOcrResult(result);
    } catch (err: any) {
      console.warn('OCR Scanning warning:', err);
      // Fallback result so rider can still verify/edit numbers manually
      setOcrResult({
        rawText: '',
        totalParcels: null,
        completedParcels: null,
        returnParcels: null,
        confidence: 0
      });
    } finally {
      setIsScanningOCR(false);
    }
  };

  const handleClearImage = () => {
    setOcrFile(null);
    setOcrResult(null);
    setOcrSubmitError(null);
    setIsScanningOCR(false);
  };

  // Handle OCR Form Confirmation Submit
  const handleConfirmOcrSubmit = async (data: {
    totalParcels: number;
    completedParcels: number;
    returnParcels: number;
    notes?: string;
  }) => {
    setErrorMsg(null);
    setOcrSubmitError(null);
    setIsSubmitting(true);

    try {
      let proofUrl = undefined;
      if (ocrFile) {
        setOcrStatus('Uploading screenshot to Cloudinary...');
        proofUrl = await uploadToCloudinary(ocrFile);
      }

      const { report, isUpdate } = await StorageService.saveDailyReport({
        uid: user.uid,
        date,
        totalParcels: data.totalParcels,
        completedParcels: data.completedParcels,
        returnParcels: data.returnParcels,
        notes: data.notes,
        proofUrl,
        ocrRawText: ocrResult?.rawText,
        isAbsent: false
      }, user);

      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 }
      });

      const nowTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setSuccessDetails({
        isUpdate,
        isAbsent: false,
        date,
        totalParcels: data.totalParcels,
        completedParcels: data.completedParcels,
        returnParcels: data.returnParcels,
        earning: report.earning || 0,
        submittedAtTime: nowTimeStr
      });

      handleClearImage();
      onReportSubmitted();
    } catch (err: any) {
      setOcrSubmitError(err.message || 'Failed to save daily report to Cloudinary / Firebase.');
    } finally {
      setIsSubmitting(false);
    }
  };



  // Absent Reporting Submit
  const handleAbsentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessDetails(null);

    setIsSubmitting(true);
    try {
      await StorageService.saveDailyReport({
        uid: user.uid,
        date: absentDate,
        totalParcels: 0,
        completedParcels: 0,
        returnParcels: 0,
        notes: `ABSENT: ${absentReason}`,
        isAbsent: true
      }, user);

      const nowTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setSuccessDetails({
        isUpdate: false,
        isAbsent: true,
        date: absentDate,
        totalParcels: 0,
        completedParcels: 0,
        returnParcels: 0,
        earning: 0,
        submittedAtTime: nowTimeStr
      });

      setShowAbsentModal(false);
      onReportSubmitted();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save absent report to Firebase Database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLocked = existingReport?.status === 'verified';

  return (
    <div id="report-section" className="glass-panel glass-panel-hover" style={{
      padding: '14px',
      border: '1px solid var(--border-glow)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '3px',
        background: 'linear-gradient(90deg, var(--primary-emerald), var(--primary-cyan), var(--accent-blue))'
      }} />

      {/* Header Bar with Title & Corner Absent Button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '10px',
        flexWrap: 'wrap',
        gap: '6px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
              Daily Reporting
            </h3>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {existingReport && (
            <span className={`pulse-badge ${isLocked ? 'pulse-badge-active' : (existingReport.status === 'rejected' ? 'pulse-badge-suspended' : 'pulse-badge-pending')}`}>
              <span className="pulse-dot"></span>
              {isLocked ? 'Verified' : (existingReport.status === 'rejected' ? 'Action Required' : 'Pending Review')}
            </span>
          )}

          <button
            type="button"
            onClick={() => setShowAbsentModal(true)}
            className="cyber-button-secondary"
            title="Mark Absent Day"
            style={{
              padding: '6px 12px',
              height: '34px',
              minHeight: '34px',
              fontSize: '0.75rem',
              color: 'var(--accent-rose)',
              borderColor: 'rgba(244, 63, 94, 0.3)'
            }}
          >
            <UserX size={15} /> Mark Absent
          </button>
        </div>
      </div>

      {existingReport?.status === 'rejected' && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.12)',
          border: '1px solid rgba(244, 63, 94, 0.4)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 12px',
          marginBottom: '10px',
          color: 'var(--accent-rose)',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <div>
            <strong>Action Required:</strong> Admin rejected your report for {date}.<br />
            <strong>Reason:</strong> <em>{existingReport.rejectionReason || 'Incorrect parcel details. Please update and resubmit.'}</em>
          </div>
        </div>
      )}

      {/* Successfully Submitted Animated Message Bar */}
      {successDetails && (
        <div
          ref={successBarRef}
          className="success-message-bar"
          id="submitted-success-bar"
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.2)',
                color: 'var(--primary-emerald)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 18px rgba(16, 185, 129, 0.4)',
                flexShrink: 0
              }}>
                <CheckCircle2 size={24} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h4 style={{ fontSize: '0.975rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {successDetails.isAbsent
                      ? 'Absent Report Logged Successfully! 📋'
                      : (successDetails.isUpdate ? 'Shift Report Updated Successfully! ⚡' : 'Shift Report Submitted Successfully! 🎉')}
                  </h4>
                  <span className="pulse-badge pulse-badge-active" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                    <span className="pulse-dot"></span> Realtime Synced
                  </span>
                </div>
                <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {successDetails.isAbsent
                    ? `Zero shift logged for ${successDetails.date} at ${successDetails.submittedAtTime}`
                    : `Your dispatch entries & ₹${successDetails.earning.toLocaleString('en-IN')} provisional earnings for ${successDetails.date} have been saved.`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSuccessDetails(null)}
              style={{
                background: 'rgba(0, 0, 0, 0.05)',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                borderRadius: '50%',
                padding: '4px 6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              title="Dismiss message bar"
            >
              <X size={16} />
            </button>
          </div>

          {!successDetails.isAbsent && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
              gap: '8px',
              marginTop: '8px',
              marginBottom: '4px'
            }}>
              <div className="success-metric-card">
                <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', display: 'block', fontWeight: 700 }}>REPORT DATE</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)' }}>{successDetails.date}</span>
              </div>
              <div className="success-metric-card">
                <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', display: 'block', fontWeight: 700 }}>PARCELS DELIVERED</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary-emerald)' }}>
                  {successDetails.completedParcels} / {successDetails.totalParcels}
                </span>
              </div>
              <div className="success-metric-card">
                <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', display: 'block', fontWeight: 700 }}>SHIFT EARNING</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary-emerald)' }}>
                  ₹{successDetails.earning.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="success-metric-card">
                <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', display: 'block', fontWeight: 700 }}>SUBMISSION TIME</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{successDetails.submittedAtTime}</span>
              </div>
            </div>
          )}

          <div className="success-message-bar-progress" />
        </div>
      )}

      {errorMsg && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.12)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 12px',
          marginBottom: '10px',
          color: 'var(--accent-rose)',
          fontSize: '0.8rem'
        }}>
          {errorMsg}
        </div>
      )}

      {/* Date Selector */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <label style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            Select Reporting Date
          </label>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              onClick={() => setDate(todayStr)}
              style={{
                background: date === todayStr ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-dark)',
                border: date === todayStr ? '1px solid var(--primary-emerald)' : '1px solid var(--border-glass)',
                color: date === todayStr ? 'var(--primary-emerald)' : 'var(--text-dim)',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.7rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                const y = new Date();
                y.setDate(y.getDate() - 1);
                setDate(y.toISOString().split('T')[0]);
              }}
              style={{
                background: 'var(--bg-dark)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-dim)',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.7rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Yesterday
            </button>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <Calendar size={17} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-cyan)' }} />
          <input
            type="date"
            max={todayStr}
            required
            className="cyber-input"
            style={{ paddingLeft: '38px', minHeight: '40px', fontSize: '0.9rem', fontWeight: 600 }}
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>
      </div>

      {/* Already Submitted Date Notification Banner */}
      {existingReport && (
        <div style={{
          background: existingReport.status === 'verified'
            ? 'rgba(16, 185, 129, 0.12)'
            : (existingReport.status === 'rejected' ? 'rgba(244, 63, 94, 0.12)' : 'rgba(245, 158, 11, 0.12)'),
          border: existingReport.status === 'verified'
            ? '1px solid rgba(16, 185, 129, 0.35)'
            : (existingReport.status === 'rejected' ? '1px solid rgba(244, 63, 94, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)'),
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          fontSize: '0.825rem'
        }}>
          <AlertTriangle size={18} style={{
            flexShrink: 0,
            marginTop: '2px',
            color: existingReport.status === 'verified'
              ? 'var(--primary-emerald)'
              : (existingReport.status === 'rejected' ? 'var(--accent-rose)' : 'var(--accent-amber)')
          }} />
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '2px' }}>
              Report Already Submitted for {date} ({existingReport.status.toUpperCase()})
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.775rem' }}>
              {isLocked
                ? `A verified shift entry already exists for ${date}. You cannot submit multiple reports for the same date. Please select a different date to submit a new report.`
                : (existingReport.status === 'rejected'
                  ? `Your previous report for ${date} was rejected by Admin. Reason: "${existingReport.rejectionReason || 'Incorrect details'}". You can correct and resubmit below.`
                  : `A report for ${date} is already logged. You are currently editing the existing entry.`)}
            </div>
          </div>
        </div>
      )}

      {/* SCREENSHOT OCR UPLOAD & SCAN WORKFLOW */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Step 1: Image Selection */}
        <ImageUploader
          onImageSelected={handleImageSelected}
          selectedImage={ocrFile}
          onClearImage={handleClearImage}
          disabled={isSubmitting || isScanningOCR || isLocked}
        />

        {/* Step 2: OCR Scanning Animation */}
        {isScanningOCR && (
          <OCRProcessor progress={ocrProgress} status={ocrStatus} />
        )}

        {/* Step 3: Verification Card */}
        {ocrFile && !isScanningOCR && ocrResult && (
          <VerificationCard
            extractedTotal={ocrResult.totalParcels}
            extractedCompleted={ocrResult.completedParcels}
            extractedReturned={ocrResult.returnParcels}
            rawText={ocrResult.rawText}
            imageFile={ocrFile}
            onConfirmSubmit={handleConfirmOcrSubmit}
            isSubmitting={isSubmitting}
            submitError={ocrSubmitError}
          />
        )}
      </div>

      {/* Absent Reporting Modal */}
      {showAbsentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 120,
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
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
          }}>
            <button
              onClick={() => setShowAbsentModal(false)}
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(244, 63, 94, 0.15)',
                color: 'var(--accent-rose)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <UserX size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Log Absenteeism
                </h3>
                <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                  Report zero parcel shift for absent date
                </p>
              </div>
            </div>

            <form onSubmit={handleAbsentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Select Absent Date
                </label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    type="date"
                    max={todayStr}
                    required
                    className="cyber-input"
                    style={{ paddingLeft: '36px', minHeight: '40px', fontSize: '0.875rem' }}
                    value={absentDate}
                    onChange={e => setAbsentDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Reason for Absence
                </label>
                <select
                  className="cyber-input"
                  style={{ minHeight: '40px', fontSize: '0.875rem' }}
                  value={absentReason}
                  onChange={e => setAbsentReason(e.target.value)}
                >
                  <option value="Personal Work">Personal Work / Leave</option>
                  <option value="Sick Leave">Sick Leave / Unwell</option>
                  <option value="Vehicle Repair">Vehicle Out of Service / Repair</option>
                  <option value="Emergency">Family Emergency</option>
                  <option value="Weekly Off">Scheduled Weekly Off</option>
                </select>
              </div>

              <div style={{
                background: 'rgba(244, 63, 94, 0.08)',
                border: '1px solid rgba(244, 63, 94, 0.2)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px',
                fontSize: '0.75rem',
                color: 'var(--text-muted)'
              }}>
                This will log <strong>0 completed parcels</strong> and <strong>₹0 earnings</strong> for {absentDate}.
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="cyber-button-primary"
                style={{
                  width: '100%',
                  minHeight: '42px',
                  background: 'linear-gradient(135deg, #e11d48, #be123c)',
                  boxShadow: '0 4px 14px rgba(225, 29, 72, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: isSubmitting ? 0.65 : 1,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin-fast" />
                    <span>Submitting Absent Report...</span>
                  </>
                ) : (
                  'Submit Absent Report'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
