import {
  Injectable,
  Inject,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { eq, and, gt } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { v4 as uuidv4 } from 'uuid';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';
import { refreshTokens } from '../../database/schema';
import { TenantsService } from '../tenants/tenants.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthTokens, AuthResponse } from '../../types';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private tenantsService: TenantsService,
    private usersService: UsersService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existingTenant = await this.tenantsService.findBySlug(dto.businessSlug);
    if (existingTenant) {
      throw new ConflictException('A business with this URL already exists');
    }

    const tenant = await this.tenantsService.create({
      name: dto.businessName,
      slug: dto.businessSlug,
    });

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.create({
      tenantId: tenant.id,
      email: dto.email,
      passwordHash,
      name: dto.name,
      role: 'owner',
    });

    const tokens = await this.generateTokens(user.id, user.tenantId, user.email, user.role);

    return {
      user: {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tokens,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
    };
  }

  async login(dto: LoginDto, tenantSlug?: string): Promise<AuthResponse> {
    let user;

    if (tenantSlug) {
      const tenant = await this.tenantsService.findBySlug(tenantSlug);
      if (!tenant || !tenant.isActive) {
        throw new UnauthorizedException('Invalid credentials');
      }
      user = await this.usersService.findByEmail(tenant.id, dto.email);
    } else {
      user = await this.usersService.findByEmailAcrossTenants(dto.email);
    }

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tenant = await this.tenantsService.findById(user.tenantId);
    if (!tenant || !tenant.isActive) {
      throw new UnauthorizedException('Your account has been deactivated');
    }

    await this.usersService.updateLastLogin(user.id);

    const tokens = await this.generateTokens(user.id, user.tenantId, user.email, user.role);

    return {
      user: {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tokens,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const [storedToken] = await this.db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.token, refreshToken),
          gt(refreshTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!storedToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersService.findById(storedToken.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    await this.db.delete(refreshTokens).where(eq(refreshTokens.id, storedToken.id));

    return this.generateTokens(user.id, user.tenantId, user.email, user.role);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.db.delete(refreshTokens).where(eq(refreshTokens.token, refreshToken));
  }

  async getMe(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const tenant = await this.tenantsService.findById(user.tenantId);

    return {
      user: {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tenant: tenant ? {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      } : null,
    };
  }

  private async generateTokens(
    userId: string,
    tenantId: string,
    email: string,
    role: string,
  ): Promise<AuthTokens> {
    const payload = {
      sub: userId,
      tenantId,
      email,
      role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('jwt.accessExpiry'),
    });

    const refreshToken = uuidv4();
    const refreshExpiry = this.configService.get<string>('jwt.refreshExpiry') || '7d';
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(refreshExpiry));

    await this.db.insert(refreshTokens).values({
      userId,
      token: refreshToken,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }
}
