import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';
import { tenants, Tenant, NewTenant } from '../../database/schema';

@Injectable()
export class TenantsService {
  constructor(
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
  ) {}

  async create(data: NewTenant): Promise<Tenant> {
    const existing = await this.findBySlug(data.slug);
    if (existing) {
      throw new ConflictException('A business with this slug already exists');
    }

    const [tenant] = await this.db.insert(tenants).values(data).returning();
    return tenant;
  }

  async findById(id: string): Promise<Tenant | undefined> {
    const [tenant] = await this.db
      .select()
      .from(tenants)
      .where(eq(tenants.id, id))
      .limit(1);
    return tenant;
  }

  async findBySlug(slug: string): Promise<Tenant | undefined> {
    const [tenant] = await this.db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);
    return tenant;
  }

  async update(id: string, data: Partial<NewTenant>): Promise<Tenant> {
    const [tenant] = await this.db
      .update(tenants)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tenants.id, id))
      .returning();
    return tenant;
  }
}
