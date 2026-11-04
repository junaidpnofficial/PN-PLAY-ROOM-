/**
 * Content Moderation Service for Play Room Arcade
 * Enforces a safe, child-friendly, respectful gaming environment.
 */

// Common toxic, profane, and abusive terms to block from public titles, names, and notes
const BLOCKED_TERMS = [
  'fuck', 'shit', 'asshole', 'bitch', 'cunt', 'bastard', 'nigger', 'nigga',
  'faggot', 'whore', 'slut', 'dick', 'pussy', 'cock', 'penis', 'vagina',
  'retard', 'kill yourself', 'kys', 'nazi', 'hitler', 'porn', 'sex', 'boobs',
  'scam', 'crypto', 'telegram', 'whatsapp spam'
];

export interface ModerationResult {
  isClean: boolean;
  flaggedTerms: string[];
  reason?: string;
}

/**
 * Checks arbitrary user content (title, player name, details) against community safety rules.
 */
export function checkContentModeration(text: string): ModerationResult {
  if (!text || typeof text !== 'string') {
    return { isClean: true, flaggedTerms: [] };
  }

  const normalized = text.toLowerCase().replace(/[@$!013]/g, (char) => {
    switch (char) {
      case '@': return 'a';
      case '$': return 's';
      case '!': return 'i';
      case '0': return 'o';
      case '1': return 'i';
      case '3': return 'e';
      default: return char;
    }
  });

  const flagged: string[] = [];

  for (const term of BLOCKED_TERMS) {
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    if (regex.test(normalized) || normalized.includes(term)) {
      flagged.push(term);
    }
  }

  // Detect spammy repetitive strings (e.g. "aaaaaaa", "!!!!!!!!!!")
  if (/(.)\1{9,}/.test(text)) {
    return {
      isClean: false,
      flaggedTerms: ['spam_characters'],
      reason: 'Please avoid excessive repetitive characters.',
    };
  }

  // Detect external scam links or unauthorized promotions
  if (/https?:\/\/|\bwww\.|\.com\/|\.gg\//i.test(text)) {
    return {
      isClean: false,
      flaggedTerms: ['external_link'],
      reason: 'External web links are not allowed in public challenge titles or notes.',
    };
  }

  if (flagged.length > 0) {
    return {
      isClean: false,
      flaggedTerms: flagged,
      reason: 'Content contains words or terms that violate Play Room kid-friendly arcade guidelines.',
    };
  }

  return { isClean: true, flaggedTerms: [] };
}

/**
 * Sanitizes text by replacing any flagged words with asterisks if needed.
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  let result = text;
  for (const term of BLOCKED_TERMS) {
    const reg = new RegExp(term, 'gi');
    result = result.replace(reg, '***');
  }
  return result;
}

export const REPORT_REASONS = [
  'Inappropriate language or profanity',
  'Harassment or offensive content',
  'Spam, scam, or advertising',
  'Cheating or corrupted score record',
  'Other community guideline violation',
] as const;
