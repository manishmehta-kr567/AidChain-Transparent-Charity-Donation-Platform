import streamifier from 'streamifier';
import crypto from 'crypto';
import cloudinary from '../config/cloudinary';
import { AppError } from '../utils/AppError';

interface UploadResult {
  url: string;
  proofHash: string;
}

/**
 * Uploads a buffer (e.g. an expense proof image from multer) to Cloudinary
 * and computes a SHA-256 hash of the raw bytes. The hash — not the URL,
 * which could change if re-hosted — is what gets written on-chain, so
 * proof integrity survives even if the hosting provider changes.
 */
export const uploadProofImage = (
  buffer: Buffer,
  folder = 'aidchain/expense-proofs'
): Promise<UploadResult> => {
  const proofHash = crypto.createHash('sha256').update(buffer).digest('hex');

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error || !result) {
          return reject(new AppError(`Image upload failed: ${error?.message}`, 502));
        }
        resolve({ url: result.secure_url, proofHash });
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};
