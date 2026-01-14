export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: {
    id: string;
    tenantId: string;
    email: string;
    name: string;
    role: string;
  };
  tokens: AuthTokens;
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface JwtPayload {
  id: string;
  tenantId: string;
  email: string;
  role: string;
}
