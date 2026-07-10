// CCA: 1
export type EntityType = 'asset' | 'liability' | 'income' | 'expense';

export type CurrencyCode = string;

export interface Category {
  id: string;
  userId: string;
  entityType: EntityType;
  name: string;
  parentId: string | null;
  isSystem: boolean;
  createdAt: string;
}

export interface Entry {
  id: string;
  userId: string;
  categoryId: string;
  entityType: EntityType;
  amount: number;
  currency: CurrencyCode;
  fxRateToBase: number;
  date: string;
  note?: string;
  createdAt: string;
}

export type LanguagePreference = 'en' | 'id';
export type NumberFormatPreference = 'en-US' | 'id-ID';
export type DateFormatPreference = 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM-DD-YYYY';
export const SUPPORTED_LANGUAGES: LanguagePreference[] = ['en', 'id'];
export const DEFAULT_LANGUAGE: LanguagePreference = 'en';
export const DEFAULT_NUMBER_FORMAT: NumberFormatPreference = 'id-ID';
export const DEFAULT_DATE_FORMAT: DateFormatPreference = 'YYYY-MM-DD';

export interface UserSettings {
  userId: string;
  baseCurrency: CurrencyCode | null;
  language: LanguagePreference;
  numberFormat: NumberFormatPreference;
  dateFormat: DateFormatPreference;
  lastBackupAt: string | null;
  lastBackupStatus: 'success' | 'failure' | null;
  lastBackupPendingChanges: boolean;
}

export const UNCATEGORIZED_NAME = 'Uncategorized';

export const ENTITY_TYPES: EntityType[] = ['asset', 'liability', 'income', 'expense'];

export function isSnapshotEntityType(entityType: EntityType): boolean {
  return entityType === 'asset' || entityType === 'liability';
}

export function isTransactionEntityType(entityType: EntityType): boolean {
  return entityType === 'income' || entityType === 'expense';
}
