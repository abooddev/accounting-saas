export const PRODUCT_UNITS = {
  piece: {
    name: 'Piece',
    nameAr: 'قطعة',
    abbreviation: 'pc',
    allowDecimals: false,
  },
  kg: {
    name: 'Kilogram',
    nameAr: 'كيلوغرام',
    abbreviation: 'kg',
    allowDecimals: true,
  },
  g: {
    name: 'Gram',
    nameAr: 'غرام',
    abbreviation: 'g',
    allowDecimals: true,
  },
  liter: {
    name: 'Liter',
    nameAr: 'لتر',
    abbreviation: 'L',
    allowDecimals: true,
  },
  ml: {
    name: 'Milliliter',
    nameAr: 'ميليلتر',
    abbreviation: 'ml',
    allowDecimals: true,
  },
  box: {
    name: 'Box',
    nameAr: 'صندوق',
    abbreviation: 'box',
    allowDecimals: false,
  },
  pack: {
    name: 'Pack',
    nameAr: 'علبة',
    abbreviation: 'pack',
    allowDecimals: false,
  },
  dozen: {
    name: 'Dozen',
    nameAr: 'درزن',
    abbreviation: 'dz',
    allowDecimals: false,
  },
} as const;

export type UnitName = keyof typeof PRODUCT_UNITS;

export const UNIT_NAMES = Object.keys(PRODUCT_UNITS) as UnitName[];
