export const EXPENSE_CATEGORIES = [
  { value: 'rent', label: 'Rent', labelAr: 'إيجار' },
  { value: 'utilities_edl', label: 'Electricity (EDL)', labelAr: 'كهرباء الدولة' },
  { value: 'utilities_generator', label: 'Generator (Ishtirak)', labelAr: 'اشتراك مولد' },
  { value: 'utilities_water', label: 'Water', labelAr: 'مياه' },
  { value: 'utilities_internet', label: 'Internet & Phone', labelAr: 'انترنت وهاتف' },
  { value: 'salaries', label: 'Salaries & Wages', labelAr: 'رواتب وأجور' },
  { value: 'nssf', label: 'NSSF', labelAr: 'الضمان الاجتماعي' },
  { value: 'supplies', label: 'Office Supplies', labelAr: 'لوازم مكتبية' },
  { value: 'repairs', label: 'Repairs & Maintenance', labelAr: 'صيانة وتصليحات' },
  { value: 'marketing', label: 'Marketing & Advertising', labelAr: 'تسويق وإعلان' },
  { value: 'transportation', label: 'Transportation', labelAr: 'نقل ومواصلات' },
  { value: 'bank_charges', label: 'Bank Charges', labelAr: 'عمولات بنكية' },
  { value: 'licenses', label: 'Licenses & Permits', labelAr: 'رخص وتصاريح' },
  { value: 'insurance', label: 'Insurance', labelAr: 'تأمين' },
  { value: 'other', label: 'Other', labelAr: 'أخرى' },
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]['value'];

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', labelAr: 'نقداً' },
  { value: 'bank_transfer', label: 'Bank Transfer', labelAr: 'تحويل بنكي' },
  { value: 'check', label: 'Check', labelAr: 'شيك' },
  { value: 'whish', label: 'Whish', labelAr: 'ويش' },
  { value: 'omt', label: 'OMT', labelAr: 'او ام تي' },
] as const;

export type PaymentMethod = typeof PAYMENT_METHODS[number]['value'];

export const INVOICE_STATUSES = [
  { value: 'draft', label: 'Draft', labelAr: 'مسودة' },
  { value: 'pending', label: 'Pending', labelAr: 'معلق' },
  { value: 'partial', label: 'Partially Paid', labelAr: 'مدفوع جزئياً' },
  { value: 'paid', label: 'Paid', labelAr: 'مدفوع' },
  { value: 'cancelled', label: 'Cancelled', labelAr: 'ملغي' },
] as const;

export type InvoiceStatus = typeof INVOICE_STATUSES[number]['value'];

export const INVOICE_TYPES = [
  { value: 'purchase', label: 'Purchase', labelAr: 'مشتريات' },
  { value: 'expense', label: 'Expense', labelAr: 'مصاريف' },
  { value: 'sale', label: 'Sale', labelAr: 'مبيعات' },
] as const;

export type InvoiceType = typeof INVOICE_TYPES[number]['value'];

export const ACCOUNT_TYPES = [
  { value: 'cash', label: 'Cash', labelAr: 'صندوق' },
  { value: 'bank', label: 'Bank', labelAr: 'بنك' },
] as const;

export type AccountType = typeof ACCOUNT_TYPES[number]['value'];
