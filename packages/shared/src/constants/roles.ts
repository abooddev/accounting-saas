export const USER_ROLES = {
  owner: {
    name: 'Owner',
    description: 'Full access to all features and settings',
    level: 100,
  },
  admin: {
    name: 'Admin',
    description: 'Full access except billing and ownership transfer',
    level: 80,
  },
  accountant: {
    name: 'Accountant',
    description: 'Access to financial reports and transactions',
    level: 60,
  },
  cashier: {
    name: 'Cashier',
    description: 'POS access and basic inventory',
    level: 40,
  },
  viewer: {
    name: 'Viewer',
    description: 'Read-only access to reports',
    level: 20,
  },
} as const;

export type RoleName = keyof typeof USER_ROLES;

export const ROLE_NAMES = Object.keys(USER_ROLES) as RoleName[];
