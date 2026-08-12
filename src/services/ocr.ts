import { createWorker } from 'tesseract.js';

export interface OCRResult {
  rawText: string;
  totalParcels: number | null;
  completedParcels: number | null;
  returnParcels: number | null;
  confidence: number;
}

export type OCRProgressCallback = (progress: number, status: string) => void;

/**
 * Finds the closest 1-3 digit parcel count near ALL occurrences of keyword in OCR text.
 */
function findNumberNearKeyword(text: string, keywordRegex: RegExp, maxCharDist: number = 45): number | null {
  const globalRegex = new RegExp(keywordRegex.source, keywordRegex.flags.includes('g') ? keywordRegex.flags : keywordRegex.flags + 'g');
  let match: RegExpExecArray | null;

  let bestVal: number | null = null;
  let minDistance = Infinity;

  while ((match = globalRegex.exec(text)) !== null) {
    const keywordIndex = match.index;
    const numRegex = /\b\d{1,3}\b/g;
    let numMatch: RegExpExecArray | null;

    while ((numMatch = numRegex.exec(text)) !== null) {
      const numVal = parseInt(numMatch[0], 10);
      const distance = Math.abs(numMatch.index - keywordIndex);

      if (distance <= maxCharDist && distance < minDistance && numVal > 0 && numVal <= 400) {
        minDistance = distance;
        bestVal = numVal;
      }
    }
  }

  return bestVal;
}

/**
 * Enhanced Multi-Tier Parser for Delivery Screenshots (Flipkart, Delhivery, Shadowfax, Porter, etc.)
 */
export function parseDeliveryOCRText(rawText: string): {
  totalParcels: number | null;
  completedParcels: number | null;
  returnParcels: number | null;
} {
  const allLines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  // Clean lines by stripping monetary / battery percentage / status bar noise & Tote bag lines
  const parcelLines = allLines.filter(line => {
    const isMoney = /[₹$]|\b(?:cash|payment|digital|pos|mswipe|webpay|collected|rupees|rs|amount)\b/i.test(line);
    const isBatteryOrTime = /^\d{1,2}:\d{2}|\b\d{1,3}%\b/.test(line);
    const isTotes = /\btotes\s*-\s*\d+/i.test(line); // Ignore "Totes - 0" subheader
    return !isMoney && !isBatteryOrTime && !isTotes;
  });

  const cleanParcelText = parcelLines.join('\n');

  let total: number | null = null;
  let completed: number | null = null;
  let returned: number | null = null;

  // STRICT KEYWORD REGEXES
  const TOTAL_REGEX = /\b(?:total|tota[li1|]|assigned|all\s*parcels|runsheet|count)\b/i;
  const COMPLETED_REGEX = /\b(?:completed|complete|comp|delivered|deliver|success|successful|done|reached)\b/i;
  const FAILED_REGEX = /\b(?:failed|fail|returned|return|rto|undelivered|cancelled)\b/i;

  // TIER 1: Grid & Column Position Alignment (Handles summary grids where numbers are on line above labels)
  // Line i: "58 0", Line i+1: "Total Pending"
  // Line i+2: "8 50", Line i+3: "Failed Completed"
  for (let i = 0; i < parcelLines.length; i++) {
    const line = parcelLines[i];
    const prevLine = i > 0 ? parcelLines[i - 1] : '';
    const nextLine = i < parcelLines.length - 1 ? parcelLines[i + 1] : '';

    const numsInPrev = prevLine.match(/\b\d{1,3}\b/g);
    const numsInNext = nextLine.match(/\b\d{1,3}\b/g);
    const wordsInLine = line.split(/\s+/);

    if (numsInPrev && numsInPrev.length >= 2) {
      wordsInLine.forEach((word, idx) => {
        if (idx < numsInPrev.length) {
          const numVal = parseInt(numsInPrev[idx], 10);
          if (TOTAL_REGEX.test(word) && numVal > 0) total = numVal;
          if (COMPLETED_REGEX.test(word) && numVal > 0) completed = numVal;
          if (FAILED_REGEX.test(word)) returned = numVal;
        }
      });
    }

    if (numsInNext && numsInNext.length >= 2) {
      wordsInLine.forEach((word, idx) => {
        if (idx < numsInNext.length) {
          const numVal = parseInt(numsInNext[idx], 10);
          if (TOTAL_REGEX.test(word) && numVal > 0) total = numVal;
          if (COMPLETED_REGEX.test(word) && numVal > 0) completed = numVal;
          if (FAILED_REGEX.test(word)) returned = numVal;
        }
      });
    }
  }

  // TIER 2: Proximity Window Matching across text
  if (total === null || total === 0) {
    total = findNumberNearKeyword(cleanParcelText, TOTAL_REGEX, 45);
  }
  if (completed === null || completed === 0) {
    completed = findNumberNearKeyword(cleanParcelText, COMPLETED_REGEX, 45);
  }
  if (returned === null) {
    returned = findNumberNearKeyword(cleanParcelText, FAILED_REGEX, 45);
  }

  // TIER 3: Fraction Patterns (e.g. "50 / 58", "50 of 58", "Delivered 50/58")
  if (completed === null || total === null) {
    const fractionMatch = cleanParcelText.match(/(?:delivered|completed|orders|parcels)?\s*(\d+)\s*(?:\/|of|out of)\s*(\d+)/i);
    if (fractionMatch) {
      const compCand = parseInt(fractionMatch[1], 10);
      const totCand = parseInt(fractionMatch[2], 10);
      if (totCand >= compCand) {
        if (completed === null) completed = compCand;
        if (total === null) total = totCand;
      }
    }
  }

  // TIER 4: Mathematical Reconciliation & Self-Correction
  // Rule 4A: Total = Completed + Returned/Failed
  if (completed !== null && returned !== null) {
    const calculatedTotal = completed + returned;
    if (total === null || total < completed || (total !== calculatedTotal && calculatedTotal > completed)) {
      total = calculatedTotal;
    }
  }

  // Rule 4B: If Completed is known but Total is missing or smaller than Completed
  if (completed !== null && (total === null || total < completed)) {
    total = completed + (returned || 0);
  }

  // Rule 4C: If Total and Completed are known, Returned = max(0, Total - Completed)
  if (returned === null && total !== null && completed !== null) {
    returned = Math.max(0, total - completed);
  }

  return {
    totalParcels: total !== null ? total : (completed !== null ? completed : 0),
    completedParcels: completed !== null ? completed : 0,
    returnParcels: returned !== null ? returned : 0
  };
}

/**
 * Runs Tesseract.js OCR engine on an uploaded screenshot file or blob.
 */
export async function processScreenshotOCR(
  imageFile: File | Blob,
  onProgress?: OCRProgressCallback
): Promise<OCRResult> {
  onProgress?.(10, 'Initializing OCR Engine...');

  const worker = await createWorker('eng');

  try {
    onProgress?.(30, 'Scanning image text...');
    
    const ret = await worker.recognize(imageFile);
    const text = ret.data.text || '';
    const confidence = ret.data.confidence || 0;

    onProgress?.(80, 'Extracting parcel counts & figures...');

    const parsed = parseDeliveryOCRText(text);

    onProgress?.(100, 'OCR Analysis Complete');

    await worker.terminate();

    return {
      rawText: text,
      totalParcels: parsed.totalParcels,
      completedParcels: parsed.completedParcels,
      returnParcels: parsed.returnParcels,
      confidence
    };
  } catch (err) {
    await worker.terminate().catch(() => {});
    throw err;
  }
}
