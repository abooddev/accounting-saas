import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';
import { posSessions, posSales, posSaleItems } from '../../database/schema';

export interface OpenSessionDto {
  terminalId: string;
  terminalCode: string;
  openingCashUSD: number;
  openingCashLBP: number;
}

export interface CloseSessionDto {
  closingCashUSD: number;
  closingCashLBP: number;
}

export interface CreateSaleDto {
  sessionId: string;
  localId?: string;
  customerId?: string;
  customerName?: string;
  items: {
    productId: string;
    barcode?: string;
    productName: string;
    productNameAr?: string;
    quantity: number;
    unitPrice: number;
    discountPercent?: number;
    lineTotal: number;
  }[];
  subtotal: number;
  discountPercent?: number;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  total: number;
  currency: 'USD' | 'LBP';
  exchangeRate: number;
  totalLBP: number;
  payment: {
    method: 'cash_usd' | 'cash_lbp' | 'card' | 'mixed';
    amountUSD: number;
    amountLBP: number;
    cashReceivedUSD: number;
    cashReceivedLBP: number;
    changeUSD: number;
    changeLBP: number;
  };
}

@Injectable()
export class PosService {
  constructor(
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
  ) {}

  async openSession(tenantId: string, userId: string, userName: string, dto: OpenSessionDto) {
    // Check for existing open session for this user
    const existingSession = await this.db
      .select()
      .from(posSessions)
      .where(
        and(
          eq(posSessions.tenantId, tenantId),
          eq(posSessions.cashierId, userId),
          eq(posSessions.status, 'open'),
        ),
      )
      .limit(1);

    if (existingSession.length > 0) {
      throw new BadRequestException('You already have an open session. Please close it first.');
    }

    const [session] = await this.db
      .insert(posSessions)
      .values({
        tenantId,
        terminalId: dto.terminalId,
        terminalCode: dto.terminalCode,
        cashierId: userId,
        cashierName: userName,
        openedAt: new Date(),
        openingCashUSD: dto.openingCashUSD.toString(),
        openingCashLBP: dto.openingCashLBP.toString(),
        expectedCashUSD: dto.openingCashUSD.toString(),
        expectedCashLBP: dto.openingCashLBP.toString(),
        status: 'open',
      })
      .returning();

    return session;
  }

  async closeSession(tenantId: string, sessionId: string, dto: CloseSessionDto) {
    const [session] = await this.db
      .select()
      .from(posSessions)
      .where(
        and(
          eq(posSessions.id, sessionId),
          eq(posSessions.tenantId, tenantId),
        ),
      )
      .limit(1);

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.status === 'closed') {
      throw new BadRequestException('Session is already closed');
    }

    const expectedUSD = parseFloat(session.expectedCashUSD || '0');
    const expectedLBP = parseFloat(session.expectedCashLBP || '0');

    const [updatedSession] = await this.db
      .update(posSessions)
      .set({
        closedAt: new Date(),
        closingCashUSD: dto.closingCashUSD.toString(),
        closingCashLBP: dto.closingCashLBP.toString(),
        differenceUSD: (dto.closingCashUSD - expectedUSD).toString(),
        differenceLBP: (dto.closingCashLBP - expectedLBP).toString(),
        status: 'closed',
        updatedAt: new Date(),
      })
      .where(eq(posSessions.id, sessionId))
      .returning();

    return updatedSession;
  }

  async getActiveSession(tenantId: string, userId: string) {
    const [session] = await this.db
      .select()
      .from(posSessions)
      .where(
        and(
          eq(posSessions.tenantId, tenantId),
          eq(posSessions.cashierId, userId),
          eq(posSessions.status, 'open'),
        ),
      )
      .limit(1);

    return session || null;
  }

  async getSession(tenantId: string, sessionId: string) {
    const [session] = await this.db
      .select()
      .from(posSessions)
      .where(
        and(
          eq(posSessions.id, sessionId),
          eq(posSessions.tenantId, tenantId),
        ),
      )
      .limit(1);

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }

  async getSessions(tenantId: string, limit = 20) {
    const sessions = await this.db
      .select()
      .from(posSessions)
      .where(eq(posSessions.tenantId, tenantId))
      .orderBy(desc(posSessions.openedAt))
      .limit(limit);

    return sessions;
  }

  async createSale(tenantId: string, userId: string, userName: string, dto: CreateSaleDto) {
    // Verify session exists and is open
    const session = await this.getSession(tenantId, dto.sessionId);
    if (session.status !== 'open') {
      throw new BadRequestException('Session is not open');
    }

    // Generate receipt number
    const receiptNumber = `RCP-${Date.now()}`;

    // Create sale
    const [sale] = await this.db
      .insert(posSales)
      .values({
        tenantId,
        sessionId: dto.sessionId,
        receiptNumber,
        localId: dto.localId,
        customerId: dto.customerId,
        customerName: dto.customerName,
        subtotal: dto.subtotal.toString(),
        discountPercent: (dto.discountPercent || 0).toString(),
        discountAmount: (dto.discountAmount || 0).toString(),
        taxRate: (dto.taxRate || 0).toString(),
        taxAmount: (dto.taxAmount || 0).toString(),
        total: dto.total.toString(),
        currency: dto.currency,
        exchangeRate: dto.exchangeRate.toString(),
        totalLBP: dto.totalLBP.toString(),
        payment: dto.payment,
        cashierId: userId,
        cashierName: userName,
        status: 'completed',
      })
      .returning();

    // Create sale items
    if (dto.items.length > 0) {
      await this.db.insert(posSaleItems).values(
        dto.items.map((item) => ({
          saleId: sale.id,
          productId: item.productId,
          barcode: item.barcode,
          productName: item.productName,
          productNameAr: item.productNameAr,
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toString(),
          discountPercent: (item.discountPercent || 0).toString(),
          lineTotal: item.lineTotal.toString(),
        })),
      );
    }

    // Update session totals
    const currentTotalSales = parseFloat(session.totalSales || '0');
    const currentTransactions = parseInt(session.totalTransactions || '0', 10);
    const currentExpectedUSD = parseFloat(session.expectedCashUSD || '0');

    await this.db
      .update(posSessions)
      .set({
        totalSales: (currentTotalSales + dto.total).toString(),
        totalTransactions: (currentTransactions + 1).toString(),
        expectedCashUSD: (currentExpectedUSD + dto.total).toString(),
        updatedAt: new Date(),
      })
      .where(eq(posSessions.id, dto.sessionId));

    return { ...sale, receiptNumber };
  }

  async getSales(tenantId: string, sessionId?: string, limit = 50) {
    let query = this.db
      .select()
      .from(posSales)
      .where(eq(posSales.tenantId, tenantId));

    if (sessionId) {
      query = this.db
        .select()
        .from(posSales)
        .where(
          and(
            eq(posSales.tenantId, tenantId),
            eq(posSales.sessionId, sessionId),
          ),
        );
    }

    const sales = await query.orderBy(desc(posSales.createdAt)).limit(limit);
    return sales;
  }

  async getSale(tenantId: string, saleId: string) {
    const [sale] = await this.db
      .select()
      .from(posSales)
      .where(
        and(
          eq(posSales.id, saleId),
          eq(posSales.tenantId, tenantId),
        ),
      )
      .limit(1);

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    const items = await this.db
      .select()
      .from(posSaleItems)
      .where(eq(posSaleItems.saleId, saleId));

    return { ...sale, items };
  }
}
