import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, AlertCircle } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelected: (file: File) => void;
  selectedImage: File | null;
  onClearImage: () => void;
  disabled?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelected,
  selectedImage,
  onClearImage,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = (file: File) => {
    setError(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPEG, PNG, WEBP).');
      return;
    }

    // Validate file size (Max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size exceeds 10MB limit. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string || null);
    };
    reader.onerror = () => {
      setError('Failed to read image file. Please select another image.');
    };
    reader.readAsDataURL(file);

    onImageSelected(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClearImage();
  };

  return (
    <div style={{ width: '100%' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
        disabled={disabled}
      />

      {selectedImage && previewUrl ? (
        <div
          style={{
            position: 'relative',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '2px solid var(--accent-primary, #3b82f6)',
            background: 'rgba(59, 130, 246, 0.04)',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          {previewUrl.startsWith('data:image') ? (
            <img
              src={previewUrl}
              alt="Screenshot preview"
              onError={() => setError('Image preview failed to display.')}
              style={{
                width: '72px',
                height: '72px',
                objectFit: 'cover',
                borderRadius: '8px',
                border: '1px solid rgba(0,0,0,0.1)'
              }}
            />
          ) : (
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '8px',
              background: 'rgba(59, 130, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3b82f6'
            }}>
              <ImageIcon size={32} />
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 600,
              fontSize: '0.875rem',
              color: 'var(--text-main, #1e293b)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              <ImageIcon size={16} className="text-blue-500" style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedImage.name}</span>
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
              {(selectedImage.size / (1024 * 1024)).toFixed(2)} MB • Ready for OCR
            </p>

            <span style={{
              display: 'inline-block',
              marginTop: '4px',
              padding: '2px 8px',
              borderRadius: '9999px',
              background: 'rgba(34, 197, 94, 0.15)',
              color: '#16a34a',
              fontSize: '0.7rem',
              fontWeight: 700
            }}>
              ✓ Image Uploaded
            </span>
          </div>

          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: 'none',
                color: '#ef4444',
                padding: '8px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              title="Remove image"
            >
              <X size={18} />
            </button>
          )}
        </div>
      ) : (
        <div
          onClick={() => !disabled && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: isDragging ? '2px dashed #3b82f6' : '2px dashed var(--border-color, #cbd5e1)',
            borderRadius: '14px',
            padding: '24px 16px',
            textAlign: 'center',
            background: isDragging ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-secondary, #f8fafc)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease-in-out',
            opacity: disabled ? 0.6 : 1
          }}
        >
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(59, 130, 246, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 10px auto',
            color: '#2563eb'
          }}>
            <UploadCloud size={24} />
          </div>

          <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main, #1e293b)', marginBottom: '4px' }}>
            Upload Work Screenshot (Flipkart, Delhivery, Shadowfax, etc.)
          </p>

          <p style={{ fontSize: '0.775rem', color: 'var(--text-muted, #64748b)', marginBottom: '10px' }}>
            Drag & drop your screenshot here or <span style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'underline' }}>Browse File</span>
          </p>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '6px',
            background: 'rgba(0,0,0,0.03)',
            fontSize: '0.725rem',
            color: 'var(--text-muted, #64748b)'
          }}>
            <span>Supports PNG, JPG, WEBP • Max 10MB</span>
          </div>
        </div>
      )}

      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginTop: '8px',
          color: '#dc2626',
          fontSize: '0.775rem',
          fontWeight: 500
        }}>
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
