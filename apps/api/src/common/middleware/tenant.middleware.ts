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

    if (host.includes(tenantDomain)) {
      const subdomain = host.split('.')[0];
      if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
        slug = subdomain;
      }
    }

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
