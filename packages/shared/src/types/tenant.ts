export interface Tenant {
  id: string;
  name: string;
  slug: string;
  settings: TenantSettings;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantSettings {
  defaultCurrency?: 'USD' | 'LBP';
  exchangeRate?: number;
  timezone?: string;
  dateFormat?: string;
  logo?: string;
}

export interface CreateTenantInput {
  name: string;
  slug: string;
  settings?: TenantSettings;
}

export interface UpdateTenantInput {
  name?: string;
  settings?: TenantSettings;
  isActive?: boolean;
}
