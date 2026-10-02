/**
 * Unit Measurement Formatter and Normalizer
 * Strictly validates units of measurement and protects against SKU/code column pollution from CSV imports.
 */

// List of strictly valid measurement units
const KNOWN_UNITS: { [key: string]: string } = {
  // Pieces
  'шт': 'шт',
  'шт.': 'шт',
  'штука': 'шт',
  'штук': 'шт',
  'штуки': 'шт',
  'од': 'шт',
  'од.': 'шт',
  'одиниця': 'шт',
  'pcs': 'шт',
  'pc': 'шт',
  'item': 'шт',
  'items': 'шт',

  // Length
  'м': 'м',
  'м.': 'м',
  'метр': 'м',
  'метри': 'м',
  'метрів': 'м',
  'пог.м': 'м',
  'пог. м': 'м',
  'пог.м.': 'м',
  'пог м': 'м',
  'погонний метр': 'м',
  'погонних метрів': 'м',
  'm': 'м',
  'lm': 'м',
  'см': 'см',
  'см.': 'см',
  'мм': 'мм',
  'мм.': 'мм',
  'км': 'км',

  // Area & Volume
  'м2': 'м²',
  'м²': 'м²',
  'кв.м': 'м²',
  'кв. м': 'м²',
  'кв.м.': 'м²',
  'кв м': 'м²',
  'sqm': 'м²',
  'м3': 'м³',
  'м³': 'м³',
  'куб.м': 'м³',
  'куб. м': 'м³',
  'куб': 'м³',
  'cbm': 'м³',

  // Packaging / Sets
  'уп': 'уп',
  'уп.': 'уп',
  'упак': 'уп',
  'упак.': 'уп',
  'упаковка': 'уп',
  'упаковки': 'уп',
  'упаковок': 'уп',
  'пач': 'уп',
  'пач.': 'уп',
  'пачка': 'уп',
  'пачки': 'уп',
  'ящ': 'уп',
  'ящ.': 'уп',
  'ящик': 'уп',
  'ящики': 'уп',
  'box': 'уп',
  'pkg': 'уп',
  'pack': 'уп',
  'компл': 'компл',
  'компл.': 'компл',
  'комплект': 'компл',
  'комплекти': 'компл',
  'комплектів': 'компл',
  'набір': 'компл',
  'набор': 'компл',
  'set': 'компл',

  // Weight & Volume
  'кг': 'кг',
  'кг.': 'кг',
  'кілограм': 'кг',
  'кілограми': 'кг',
  'кілограмів': 'кг',
  'килограмм': 'кг',
  'г': 'г',
  'г.': 'г',
  'грам': 'г',
  'грами': 'г',
  'грамів': 'г',
  'т': 'т',
  'т.': 'т',
  'тонна': 'т',
  'тонн': 'т',
  'kg': 'кг',
  'g': 'г',

  // Liquids
  'л': 'л',
  'л.': 'л',
  'літр': 'л',
  'літри': 'л',
  'літрів': 'л',
  'литр': 'л',
  'мл': 'мл',
  'мл.': 'мл',
  'l': 'л',
  'ml': 'мл',

  // Special Hardware / Plumbing units
  'пара': 'пара',
  'пари': 'пара',
  'пар': 'пара',
  'pair': 'пара',
  'рул': 'рул',
  'рул.': 'рул',
  'рулон': 'рул',
  'рулони': 'рул',
  'рулонів': 'рул',
  'roll': 'рул',
  'бухта': 'бухта',
  'бухти': 'бухта',
  'бухт': 'бухта',
  'бух.': 'бухта',
  'пал': 'пал',
  'палета': 'пал',
  'секц': 'секц',
  'секція': 'секц',
  'секцій': 'секц',
  'лист': 'лист',
  'листи': 'лист',
  'панель': 'панель',
  'модуль': 'модуль',
  'банка': 'банка',
  'флакон': 'флакон',
  'тюбик': 'тюбик',
  'мішок': 'мішок'
};

/**
 * Validates and formats a measurement unit.
 * If raw input looks like an article/SKU, barcode, numbers, or unknown code (e.g. "-ELP-024"),
 * it immediately defaults to 'шт'.
 */
export function formatUnit(rawUnit?: string | null): string {
  if (!rawUnit || typeof rawUnit !== 'string') {
    return 'шт';
  }

  let cleaned = rawUnit.trim();

  // Remove surrounding quotes
  cleaned = cleaned.replace(/^["'`]+|["'`]+$/g, '').trim();

  // Strip common currency prefixes like "грн/", "грн /", "UAH /", "грн", etc.
  cleaned = cleaned.replace(/^(?:грн|uah|гривень|грн\.)\s*[\/\-]?\s*/i, '').trim();

  // Strip leading & trailing slashes, dashes, dots, underscores
  cleaned = cleaned.replace(/^[\/\-\.\s_]+|[\/\-\.\s_]+$/g, '').trim();

  const lower = cleaned.toLowerCase();

  if (!lower || lower === '/' || lower === 'null' || lower === 'undefined' || lower === 'грн' || lower === 'none' || lower === '-') {
    return 'шт';
  }

  // Check direct lookup table
  if (KNOWN_UNITS[lower]) {
    return KNOWN_UNITS[lower];
  }

  // If the string contains digits (e.g. "024", "1-ELP", "100"), it's definitely NOT a unit (it's a SKU or size/quantity)
  if (/\d/.test(cleaned)) {
    // Exception: m2, m3, м2, м3
    if (lower === 'м2' || lower === 'м²') return 'м²';
    if (lower === 'м3' || lower === 'м³') return 'м³';
    return 'шт';
  }

  // If the string contains hyphens, underscores, or uppercase latin SKU codes (like "ELP-", "SKU")
  if (/[\-_]/.test(cleaned) || /[A-Z]{3,}/.test(cleaned)) {
    return 'шт';
  }

  // Check prefix matches
  if (lower.startsWith('шт')) return 'шт';
  if (lower.startsWith('метр') || lower.startsWith('пог')) return 'м';
  if (lower.startsWith('упак') || lower.startsWith('пач') || lower.startsWith('ящ')) return 'уп';
  if (lower.startsWith('компл') || lower.startsWith('набір') || lower.startsWith('набор')) return 'компл';
  if (lower.startsWith('кілог') || lower.startsWith('килог')) return 'кг';
  if (lower.startsWith('літ')) return 'л';
  if (lower.startsWith('пар')) return 'пара';
  if (lower.startsWith('рул')) return 'рул';
  if (lower.startsWith('бухт')) return 'бухта';
  if (lower.startsWith('секц')) return 'секц';

  // If it's a short valid word (<= 8 letters) without strange characters, check if it's Ukrainian letters
  if (cleaned.length <= 8 && /^[а-яіїєґА-ЯІЇЄҐa-zA-Z\.]+$/.test(cleaned)) {
    return cleaned.toLowerCase();
  }

  // Default fallback for any non-unit string
  return 'шт';
}

/**
 * Returns formatted unit with slash for price tags (e.g. "/шт", "/м", "/уп")
 */
export function formatPriceUnit(rawUnit?: string | null): string {
  const u = formatUnit(rawUnit);
  return `/${u}`;
}

/**
 * Normalizes unit to standard database format (e.g. "грн/шт", "грн/м")
 */
export function normalizeStorageUnit(rawUnit?: string | null): string {
  const u = formatUnit(rawUnit);
  return `грн/${u}`;
}
