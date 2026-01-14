declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      tenantSlug?: string;
      user?: {
        id: string;
        tenantId: string;
        email: string;
        role: string;
      };
    }
  }
}

export {};
