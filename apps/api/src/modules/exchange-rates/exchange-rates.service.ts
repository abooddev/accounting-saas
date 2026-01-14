import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc, lte } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';
import { exchangeRates, ExchangeRate, NewExchangeRate } from '../../database/schema';

@Injectable()
export class ExchangeRatesService {
  constructor(
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
  ) {}

  async create(tenantId: string, data: {
    rate: number;
    effectiveDate: string;
    fromCurrency?: string;
    toCurrency?: string;
    source?: string;
  }): Promise<ExchangeRate> {
    const newRate: NewExchangeRate = {
      tenantId,
      fromCurrency: data.fromCurrency ?? 'USD',
      toCurrency: data.toCurrency ?? 'LBP',
      rate: data.rate.toString(),
      effectiveDate: data.effectiveDate,
      source: data.source ?? 'manual',
      isActive: true,
    };

    const [rate] = await this.db.insert(exchangeRates).values(newRate).returning();
    return rate;
  }

  async findAll(tenantId: string): Promise<ExchangeRate[]> {
    return this.db
      .select()
      .from(exchangeRates)
      .where(eq(exchangeRates.tenantId, tenantId))
      .orderBy(desc(exchangeRates.effectiveDate));
  }

  async getCurrentRate(tenantId: string, fromCurrency = 'USD', toCurrency = 'LBP'): Promise<number> {
    const today = new Date().toISOString().split('T')[0];

    const [rate] = await this.db
      .select()
      .from(exchangeRates)
      .where(
        and(
          eq(exchangeRates.tenantId, tenantId),
          eq(exchangeRates.fromCurrency, fromCurrency),
          eq(exchangeRates.toCurrency, toCurrency),
          eq(exchangeRates.isActive, true),
          lte(exchangeRates.effectiveDate, today),
        ),
      )
      .orderBy(desc(exchangeRates.effectiveDate))
      .limit(1);

    return rate ? parseFloat(rate.rate) : 89500; // Default fallback
  }

  async getOrCreateDefaultRate(tenantId: string): Promise<ExchangeRate> {
    const currentRate = await this.getCurrentRate(tenantId);

    const [existingRate] = await this.db
      .select()
      .from(exchangeRates)
      .where(eq(exchangeRates.tenantId, tenantId))
      .limit(1);

    if (existingRate) {
      return existingRate;
    }

    // Create default rate
    return this.create(tenantId, {
      rate: 89500,
      effectiveDate: new Date().toISOString().split('T')[0],
      source: 'default',
    });
  }
}
