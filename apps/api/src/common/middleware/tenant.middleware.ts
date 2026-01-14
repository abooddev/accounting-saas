import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import { TenantsService } from '../../modules/tenants/tenants.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly configService: ConfigService,
    private readonly tenantsService: TenantsService,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const host = req.headers.host || '';
    const tenantDomain = this.configService.get<string>('tenant.domain') || 'localhost';

    let slug: string | undefined;

    // Check for subdomain (e.g., demo.localhost or demo.myapp.com)
    const hostWithoutPort = host.split(':')[0];
    const hostParts = hostWithoutPort.split('.');

    // Only extract subdomain if host has more parts than the tenant domain
    // e.g., demo.localhost has 2 parts, localhost has 1 part
    const domainParts = tenantDomain.split('.');
    if (hostParts.length > domainParts.length) {
      const subdomain = hostParts[0];
      if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
        slug = subdomain;
      }
    }

    // Fallback to X-Tenant-Slug header
    if (!slug) {
      slug = req.headers['x-tenant-slug'] as string;
    }

    if (slug) {
      const tenant = await this.tenantsService.findBySlug(slug);
      if (tenant && tenant.isActive) {
        req['tenantId'] = tenant.id;
        req['tenantSlug'] = tenant.slug;
      }
    }

    next();
  }
}
