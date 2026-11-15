/**
 * ERAS Batch Upload Queue — Concurrency-Limited Client-Side Pipeline
 * ===================================================================
 * Processes multiple image files through the compression + upload pipeline
 * with a configurable concurrency limit (default 3 simultaneous).
 *
 * Individual file failures do NOT abort the batch — errors are collected
 * and returned alongside successful results.
 */

import {
  compressImage,
  uploadCompressedPair,
  type CompressionResult,
} from './imagePipeline';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BatchProgressEvent {
  /** Index of the file being processed (0-based) */
  fileIndex: number;
  /** Total number of files in the batch */
  totalFiles: number;
  /** Current processing stage for this file */
  status: 'compressing' | 'uploading' | 'done' | 'error';
  /** Card-resolution public URL (set when status is 'done') */
  cardUrl?: string;
  /** Full-resolution public URL (set when status is 'done') */
  fullUrl?: string;
  /** Error message (set when status is 'error') */
  error?: string;
}

export interface BatchUploadResult {
  /** Card URL, full URL, and compression metadata for each file (null on failure) */
  cardUrl: string;
  fullUrl: string;
  meta: CompressionResult;
}

export interface BatchUploadResponse {
  /** Results array in the same order as input files — null for failed items */
  results: Array<BatchUploadResult | null>;
  /** Errors collected during processing */
  errors: Array<{ index: number; message: string }>;
}

// ---------------------------------------------------------------------------
// Concurrency-Limited Batch Processor
// ---------------------------------------------------------------------------

/** Maximum number of files processed simultaneously */
const MAX_CONCURRENCY = 3;

/**
 * Processes a batch of image files through the compression + upload pipeline
 * with concurrency-limited parallelism.
 *
 * @param files      - Raw image Files from an <input> element
 * @param supabase   - Supabase client instance (browser-side)
 * @param userId     - Authenticated user ID for storage paths
 * @param onProgress - Optional callback invoked for each stage of each file
 * @returns Results and errors for the entire batch
 */
export async function processBatchUpload(
  files: File[],
  supabase: any,
  userId: string,
  onProgress?: (event: BatchProgressEvent) => void
): Promise<BatchUploadResponse> {
  const totalFiles = files.length;
  const results: Array<BatchUploadResult | null> = new Array(totalFiles).fill(null);
  const errors: Array<{ index: number; message: string }> = [];

  // Build an index queue for the concurrency pool
  let nextIndex = 0;

  async function processFile(fileIndex: number): Promise<void> {
    const file = files[fileIndex];

    try {
      // --- Compress ---
      onProgress?.({ fileIndex, totalFiles, status: 'compressing' });
      const compressed = await compressImage(file);

      // --- Upload ---
      onProgress?.({ fileIndex, totalFiles, status: 'uploading' });
      const { cardUrl, fullUrl } = await uploadCompressedPair(
        supabase,
        userId,
        compressed,
        fileIndex
      );

      // --- Done ---
      results[fileIndex] = { cardUrl, fullUrl, meta: compressed };
      onProgress?.({ fileIndex, totalFiles, status: 'done', cardUrl, fullUrl });
    } catch (err: any) {
      const message = err?.message || 'Unknown error';
      errors.push({ index: fileIndex, message });
      onProgress?.({ fileIndex, totalFiles, status: 'error', error: message });
    }
  }

  async function worker(): Promise<void> {
    while (nextIndex < totalFiles) {
      const idx = nextIndex++;
      await processFile(idx);
    }
  }

  // Launch up to MAX_CONCURRENCY workers
  const workers: Promise<void>[] = [];
  for (let i = 0; i < Math.min(MAX_CONCURRENCY, totalFiles); i++) {
    workers.push(worker());
  }

  await Promise.all(workers);

  return { results, errors };
}
