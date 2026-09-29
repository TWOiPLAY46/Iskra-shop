/**
 * Utility functions for Ukrainian phone number formatting and validation (+380 (XX) XXX-XX-XX)
 */

export interface OperatorInfo {
  code: string;
  name: string;
}

export const UKRAINIAN_OPERATOR_CODES: OperatorInfo[] = [
  { code: '67', name: 'Київстар' },
  { code: '97', name: 'Київстар' },
  { code: '68', name: 'Київстар' },
  { code: '96', name: 'Київстар' },
  { code: '98', name: 'Київстар' },
  { code: '50', name: 'Vodafone' },
  { code: '66', name: 'Vodafone' },
  { code: '95', name: 'Vodafone' },
  { code: '99', name: 'Vodafone' },
  { code: '63', name: 'lifecell' },
  { code: '73', name: 'lifecell' },
  { code: '93', name: 'lifecell' },
];

/**
 * Strips all non-digit characters and normalizes to the 9-digit Ukrainian local number (operator + 7 digits)
 */
export function extractLocalPhoneDigits(input: string): string {
  if (!input) return '';
  let digits = input.replace(/\D/g, '');
  
  // Strip country code prefix (380 or 38)
  if (digits.startsWith('380')) {
    digits = digits.slice(3);
  } else if (digits.startsWith('38') && digits.length > 2) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Max 9 digits for UA local phone (2-digit operator + 7-digit subscriber number)
  return digits.slice(0, 9);
}

/**
 * Formats digits into standard readable Ukrainian phone mask:
 * "+380 (XX) XXX-XX-XX"
 */
export function formatUkrainianPhone(input: string): string {
  if (!input) return '';
  const digits = extractLocalPhoneDigits(input);
  if (!digits) return '+380 (';

  const op = digits.slice(0, 2);
  const part1 = digits.slice(2, 5);
  const part2 = digits.slice(5, 7);
  const part3 = digits.slice(7, 9);

  let formatted = `+380 (${op}`;
  if (digits.length >= 2) {
    formatted += `)`;
  }
  if (part1) {
    formatted += ` ${part1}`;
  }
  if (part2) {
    formatted += `-${part2}`;
  }
  if (part3) {
    formatted += `-${part3}`;
  }

  return formatted;
}

/**
 * Returns full international format "380XXXXXXXXX"
 */
export function getFullInternationalPhone(input: string): string {
  const local = extractLocalPhoneDigits(input);
  if (!local) return '';
  return `380${local}`;
}

/**
 * Validates if the phone has all 9 local digits (+380...)
 */
export function isValidUkrainianPhone(input: string): boolean {
  const local = extractLocalPhoneDigits(input);
  return local.length === 9;
}
