/**
 * Cloudinary Unsigned Image Upload Service
 * Uploads screenshot files directly from the browser to Cloudinary.
 */

export async function uploadToCloudinary(file: File | Blob): Promise<string> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'qdrawmyb';
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'delivery_screenshots';

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary configuration error: Cloud Name or Upload Preset missing.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Cloudinary upload failed with status ${response.status}`);
  }

  const data = await response.json();
  if (!data.secure_url) {
    throw new Error('Cloudinary response did not return a valid secure URL.');
  }

  return data.secure_url;
}
