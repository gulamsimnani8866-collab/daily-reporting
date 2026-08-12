import React from 'react';
import { Loader2, ScanText, Sparkles } from 'lucide-react';

interface OCRProcessorProps {
  progress: number;
  status: string;
}

export const OCRProcessor: React.FC<OCRProcessorProps> = ({ progress, status }) => {
  return (
    <div
      style={{
        border: '1px solid rgba(59, 130, 246, 0.3)',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(99, 102, 241, 0.08) 100%)',
        borderRadius: '14px',
        padding: '20px 16px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.08)'
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: 'rgba(59, 130, 246, 0.15)',
          color: '#2563eb',
          marginBottom: '10px'
        }}
      >
        <ScanText size={22} className="animate-pulse" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '6px' }}>
        <Sparkles size={16} style={{ color: '#6366f1' }} />
        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main, #1e293b)' }}>
          AI Screenshot Text Scanner
        </h4>
      </div>

      <p style={{ margin: '0 0 14px 0', fontSize: '0.8rem', color: 'var(--text-muted, #64748b)' }}>
        {status || 'Extracting delivery figures...'}
      </p>

      {/* Animated Progress Bar */}
      <div
        style={{
          width: '100%',
          height: '8px',
          background: 'rgba(0, 0, 0, 0.08)',
          borderRadius: '9999px',
          overflow: 'hidden',
          marginBottom: '8px'
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.min(100, Math.max(5, progress))}%`,
            background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)',
            borderRadius: '9999px',
            transition: 'width 0.3s ease-in-out'
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.725rem', color: 'var(--text-muted, #64748b)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Loader2 size={12} className="animate-spin text-blue-500" />
          Running browser Tesseract.js OCR
        </span>
        <span style={{ fontWeight: 700, color: '#2563eb' }}>{progress}%</span>
      </div>
    </div>
  );
};
