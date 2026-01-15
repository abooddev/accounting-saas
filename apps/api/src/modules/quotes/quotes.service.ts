import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, isNull, desc, gte, lte, lt, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';
import {
  quotes, Quote, NewQuote,
  quoteItems, QuoteItem, NewQuoteItem,
  contacts, sequences,
  salesOrders, NewSalesOrder,
  salesOrderItems, NewSalesOrderItem,
  invoices, NewInvoice,
  invoiceItems, NewInvoiceItem,
} from '../../database/schema';

export interface QuoteWithItems extends Quote {
  items: QuoteItem[];
  customer?: { id: string; name: string; nameAr: string | null } | null;
}

export interface QuoteFilters {
  status?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
}

@Injectable()
export class QuotesService {
  constructor(
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
  ) {}

  async create(tenantId: string, userId: string, data: {
    customerId: string;
    date: string;
    validUntil: string;
    status?: string;
    currency: string;
    exchangeRate: number;
    terms?: string;
    notes?: string;
    items: {
      productId?: string;
      description: string;
      quantity: number;
      unitPrice: number;
      discountPercent?: number;
    }[];
  }): Promise<QuoteWithItems> {
    // Validate customer exists and is a customer
    const [customer] = await this.db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.id, data.customerId),
          eq(contacts.tenantId, tenantId),
          isNull(contacts.deletedAt),
        ),
      )
      .limit(1);

    if (!customer) {
      throw new BadRequestException('Customer not found');
    }

    if (customer.type !== 'customer' && customer.type !== 'both') {
      throw new BadRequestException('Contact is not a customer');
    }

    // Calculate totals
    let subtotal = 0;
    let totalDiscount = 0;
    const itemsWithTotals = data.items.map((item, index) => {
      const discountMultiplier = 1 - (item.discountPercent ?? 0) / 100;
      const lineTotal = item.quantity * item.unitPrice * discountMultiplier;
      const discountAmount = item.quantity * item.unitPrice * (item.discountPercent ?? 0) / 100;
      subtotal += item.quantity * item.unitPrice;
      totalDiscount += discountAmount;
      return { ...item, lineTotal, sortOrder: index };
    });

    const total = subtotal - totalDiscount;

    // Generate quote number
    const quoteNumber = await this.getNextNumber(tenantId);

    // Create quote
    const quoteData: NewQuote = {
      tenantId,
      number: quoteNumber,
      customerId: data.customerId,
      date: data.date,
      validUntil: data.validUntil,
      status: (data.status ?? 'draft') as 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted',
      currency: data.currency,
      exchangeRate: data.exchangeRate.toString(),
      subtotal: subtotal.toString(),
      discountAmount: totalDiscount.toString(),
      taxAmount: '0', // Tax can be added later
      total: total.toString(),
      terms: data.terms,
      notes: data.notes,
      createdBy: userId,
    };

    const [quote] = await this.db.insert(quotes).values(quoteData).returning();

    // Create quote items
    const itemsData: NewQuoteItem[] = itemsWithTotals.map(item => ({
      quoteId: quote.id,
      productId: item.productId,
      description: item.description,
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toString(),
      discountPercent: (item.discountPercent ?? 0).toString(),
      lineTotal: item.lineTotal.toString(),
      sortOrder: item.sortOrder.toString(),
    }));

    await this.db.insert(quoteItems).values(itemsData);

    return this.findById(tenantId, quote.id);
  }

  async findAll(tenantId: string, filters?: QuoteFilters): Promise<QuoteWithItems[]> {
    const conditions = [
      eq(quotes.tenantId, tenantId),
      isNull(quotes.deletedAt),
    ];

    if (filters?.status) {
      conditions.push(eq(quotes.status, filters.status as 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted'));
    }
    if (filters?.customerId) {
      conditions.push(eq(quotes.customerId, filters.customerId));
    }
    if (filters?.dateFrom) {
      conditions.push(gte(quotes.date, filters.dateFrom));
    }
    if (filters?.dateTo) {
      conditions.push(lte(quotes.date, filters.dateTo));
    }

    const results = await this.db
      .select({
        quote: quotes,
        customer: {
          id: contacts.id,
          name: contacts.name,
          nameAr: contacts.nameAr,
        },
      })
      .from(quotes)
      .leftJoin(contacts, eq(quotes.customerId, contacts.id))
      .where(and(...conditions))
      .orderBy(desc(quotes.date), desc(quotes.createdAt));

    // Get items for each quote
    const quoteIds = results.map(r => r.quote.id);
    const allItems = quoteIds.length > 0
      ? await this.db
          .select()
          .from(quoteItems)
          .where(sql`${quoteItems.quoteId} IN ${quoteIds}`)
      : [];

    return results.map(r => ({
      ...r.quote,
      customer: r.customer?.id ? r.customer : null,
      items: allItems.filter(item => item.quoteId === r.quote.id),
    }));
  }

  async findById(tenantId: string, id: string): Promise<QuoteWithItems> {
    const [result] = await this.db
      .select({
        quote: quotes,
        customer: {
          id: contacts.id,
          name: contacts.name,
          nameAr: contacts.nameAr,
        },
      })
      .from(quotes)
      .leftJoin(contacts, eq(quotes.customerId, contacts.id))
      .where(
        and(
          eq(quotes.id, id),
          eq(quotes.tenantId, tenantId),
          isNull(quotes.deletedAt),
        ),
      )
      .limit(1);

    if (!result) {
      throw new NotFoundException('Quote not found');
    }

    const items = await this.db
      .select()
      .from(quoteItems)
      .where(eq(quoteItems.quoteId, id))
      .orderBy(quoteItems.sortOrder);

    return {
      ...result.quote,
      customer: result.customer?.id ? result.customer : null,
      items,
    };
  }

  async update(tenantId: string, id: string, data: {
    customerId?: string;
    date?: string;
    validUntil?: string;
    currency?: string;
    exchangeRate?: number;
    terms?: string;
    notes?: string;
    items?: {
      productId?: string;
      description: string;
      quantity: number;
      unitPrice: number;
      discountPercent?: number;
    }[];
  }): Promise<QuoteWithItems> {
    const existing = await this.findById(tenantId, id);

    if (existing.status !== 'draft') {
      throw new BadRequestException('Only draft quotes can be edited');
    }

    // If customer is being changed, validate the new customer
    if (data.customerId && data.customerId !== existing.customerId) {
      const [customer] = await this.db
        .select()
        .from(contacts)
        .where(
          and(
            eq(contacts.id, data.customerId),
            eq(contacts.tenantId, tenantId),
            isNull(contacts.deletedAt),
          ),
        )
        .limit(1);

      if (!customer) {
        throw new BadRequestException('Customer not found');
      }

      if (customer.type !== 'customer' && customer.type !== 'both') {
        throw new BadRequestException('Contact is not a customer');
      }
    }

    // If items are provided, recalculate totals
    if (data.items) {
      let subtotal = 0;
      let totalDiscount = 0;
      const itemsWithTotals = data.items.map((item, index) => {
        const discountMultiplier = 1 - (item.discountPercent ?? 0) / 100;
        const lineTotal = item.quantity * item.unitPrice * discountMultiplier;
        const discountAmount = item.quantity * item.unitPrice * (item.discountPercent ?? 0) / 100;
        subtotal += item.quantity * item.unitPrice;
        totalDiscount += discountAmount;
        return { ...item, lineTotal, sortOrder: index };
      });

      const total = subtotal - totalDiscount;

      // Delete existing items
      await this.db.delete(quoteItems).where(eq(quoteItems.quoteId, id));

      // Insert new items
      const itemsData: NewQuoteItem[] = itemsWithTotals.map(item => ({
        quoteId: id,
        productId: item.productId,
        description: item.description,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
        discountPercent: (item.discountPercent ?? 0).toString(),
        lineTotal: item.lineTotal.toString(),
        sortOrder: item.sortOrder.toString(),
      }));

      await this.db.insert(quoteItems).values(itemsData);

      // Update quote with new totals
      await this.db
        .update(quotes)
        .set({
          customerId: data.customerId ?? existing.customerId,
          date: data.date ?? existing.date,
          validUntil: data.validUntil ?? existing.validUntil,
          currency: data.currency ?? existing.currency,
          exchangeRate: data.exchangeRate?.toString() ?? existing.exchangeRate,
          subtotal: subtotal.toString(),
          discountAmount: totalDiscount.toString(),
          total: total.toString(),
          terms: data.terms ?? existing.terms,
          notes: data.notes ?? existing.notes,
          updatedAt: new Date(),
        })
        .where(eq(quotes.id, id));
    } else {
      // Just update non-item fields
      const updateData: Partial<NewQuote> = { updatedAt: new Date() };
      if (data.customerId !== undefined) updateData.customerId = data.customerId;
      if (data.date !== undefined) updateData.date = data.date;
      if (data.validUntil !== undefined) updateData.validUntil = data.validUntil;
      if (data.currency !== undefined) updateData.currency = data.currency;
      if (data.exchangeRate !== undefined) updateData.exchangeRate = data.exchangeRate.toString();
      if (data.terms !== undefined) updateData.terms = data.terms;
      if (data.notes !== undefined) updateData.notes = data.notes;

      await this.db.update(quotes).set(updateData).where(eq(quotes.id, id));
    }

    return this.findById(tenantId, id);
  }

  async send(tenantId: string, id: string): Promise<QuoteWithItems> {
    const quote = await this.findById(tenantId, id);

    if (quote.status !== 'draft') {
      throw new BadRequestException('Only draft quotes can be sent');
    }

    await this.db
      .update(quotes)
      .set({ status: 'sent', updatedAt: new Date() })
      .where(eq(quotes.id, id));

    return this.findById(tenantId, id);
  }

  async accept(tenantId: string, id: string): Promise<QuoteWithItems> {
    const quote = await this.findById(tenantId, id);

    if (quote.status !== 'sent') {
      throw new BadRequestException('Only sent quotes can be accepted');
    }

    // Check if quote is expired
    const today = new Date().toISOString().split('T')[0];
    if (quote.validUntil < today) {
      throw new BadRequestException('Quote has expired and cannot be accepted');
    }

    await this.db
      .update(quotes)
      .set({ status: 'accepted', updatedAt: new Date() })
      .where(eq(quotes.id, id));

    return this.findById(tenantId, id);
  }

  async reject(tenantId: string, id: string, reason?: string): Promise<QuoteWithItems> {
    const quote = await this.findById(tenantId, id);

    if (quote.status !== 'sent') {
      throw new BadRequestException('Only sent quotes can be rejected');
    }

    await this.db
      .update(quotes)
      .set({
        status: 'rejected',
        rejectionReason: reason ?? null,
        updatedAt: new Date()
      })
      .where(eq(quotes.id, id));

    return this.findById(tenantId, id);
  }

  async convertToSalesOrder(tenantId: string, id: string, userId: string): Promise<{ salesOrderId: string }> {
    const quote = await this.findById(tenantId, id);

    if (quote.status !== 'accepted') {
      throw new BadRequestException('Only accepted quotes can be converted to sales orders');
    }

    // Generate sales order number
    const year = new Date().getFullYear();
    const prefix = 'SO';

    let [seq] = await this.db
      .select()
      .from(sequences)
      .where(
        and(
          eq(sequences.tenantId, tenantId),
          eq(sequences.type, 'sales_order'),
          eq(sequences.year, year),
        ),
      )
      .limit(1);

    if (!seq) {
      [seq] = await this.db
        .insert(sequences)
        .values({
          tenantId,
          type: 'sales_order',
          prefix,
          currentNumber: 0,
          year,
        })
        .returning();
    }

    const newNumber = (seq.currentNumber ?? 0) + 1;
    await this.db
      .update(sequences)
      .set({ currentNumber: newNumber })
      .where(eq(sequences.id, seq.id));

    const orderNumber = `${prefix}-${year}-${String(newNumber).padStart(5, '0')}`;

    // Create sales order from quote
    const salesOrderData: NewSalesOrder = {
      tenantId,
      number: orderNumber,
      customerId: quote.customerId,
      date: new Date().toISOString().split('T')[0],
      status: 'draft',
      currency: quote.currency,
      exchangeRate: quote.exchangeRate,
      subtotal: quote.subtotal,
      discountAmount: quote.discountAmount,
      taxAmount: quote.taxAmount,
      total: quote.total,
      notes: `Created from Quote ${quote.number}`,
      createdBy: userId,
    };

    const [salesOrder] = await this.db.insert(salesOrders).values(salesOrderData).returning();

    // Create sales order items from quote items
    const salesOrderItemsData: NewSalesOrderItem[] = quote.items.map((item, index) => ({
      salesOrderId: salesOrder.id,
      productId: item.productId ?? '',
      description: item.description,
      quantityOrdered: item.quantity,
      quantityDelivered: '0',
      unitPrice: item.unitPrice,
      discountPercent: item.discountPercent ?? '0',
      lineTotal: item.lineTotal,
      sortOrder: index.toString(),
    }));

    await this.db.insert(salesOrderItems).values(salesOrderItemsData);

    // Update quote status to converted
    await this.db
      .update(quotes)
      .set({
        status: 'converted',
        convertedToType: 'sales_order',
        convertedToId: salesOrder.id,
        updatedAt: new Date()
      })
      .where(eq(quotes.id, id));

    return { salesOrderId: salesOrder.id };
  }

  async convertToInvoice(tenantId: string, id: string, userId: string): Promise<{ invoiceId: string }> {
    const quote = await this.findById(tenantId, id);

    if (quote.status !== 'accepted') {
      throw new BadRequestException('Only accepted quotes can be converted to invoices');
    }

    // Generate invoice internal number
    const year = new Date().getFullYear();
    const prefix = 'SAL';

    let [seq] = await this.db
      .select()
      .from(sequences)
      .where(
        and(
          eq(sequences.tenantId, tenantId),
          eq(sequences.type, 'sale_invoice'),
          eq(sequences.year, year),
        ),
      )
      .limit(1);

    if (!seq) {
      [seq] = await this.db
        .insert(sequences)
        .values({
          tenantId,
          type: 'sale_invoice',
          prefix,
          currentNumber: 0,
          year,
        })
        .returning();
    }

    const newNumber = (seq.currentNumber ?? 0) + 1;
    await this.db
      .update(sequences)
      .set({ currentNumber: newNumber })
      .where(eq(sequences.id, seq.id));

    const internalNumber = `${prefix}-${year}-${String(newNumber).padStart(5, '0')}`;

    // Create invoice from quote
    const invoiceData: NewInvoice = {
      tenantId,
      type: 'sale',
      internalNumber,
      contactId: quote.customerId,
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      currency: quote.currency,
      exchangeRate: quote.exchangeRate,
      subtotal: quote.subtotal,
      discountAmount: quote.discountAmount,
      taxAmount: quote.taxAmount,
      total: quote.total,
      totalLbp: quote.currency === 'USD'
        ? (parseFloat(quote.total) * parseFloat(quote.exchangeRate)).toString()
        : quote.total,
      balance: quote.total,
      notes: `Created from Quote ${quote.number}`,
      createdBy: userId,
    };

    const [invoice] = await this.db.insert(invoices).values(invoiceData).returning();

    // Create invoice items from quote items
    const invoiceItemsData: NewInvoiceItem[] = quote.items.map((item, index) => ({
      invoiceId: invoice.id,
      productId: item.productId,
      description: item.description,
      quantity: item.quantity,
      unit: 'piece',
      unitPrice: item.unitPrice,
      discountPercent: item.discountPercent ?? '0',
      lineTotal: item.lineTotal,
      sortOrder: index.toString(),
    }));

    await this.db.insert(invoiceItems).values(invoiceItemsData);

    // Update quote status to converted
    await this.db
      .update(quotes)
      .set({
        status: 'converted',
        convertedToType: 'invoice',
        convertedToId: invoice.id,
        updatedAt: new Date()
      })
      .where(eq(quotes.id, id));

    return { invoiceId: invoice.id };
  }

  async duplicate(tenantId: string, id: string, userId: string): Promise<QuoteWithItems> {
    const original = await this.findById(tenantId, id);

    // Generate new quote number
    const quoteNumber = await this.getNextNumber(tenantId);

    // Calculate new valid until date (e.g., 30 days from today)
    const today = new Date();
    const validUntil = new Date(today);
    validUntil.setDate(validUntil.getDate() + 30);

    // Create new quote
    const quoteData: NewQuote = {
      tenantId,
      number: quoteNumber,
      customerId: original.customerId,
      date: today.toISOString().split('T')[0],
      validUntil: validUntil.toISOString().split('T')[0],
      status: 'draft',
      currency: original.currency,
      exchangeRate: original.exchangeRate,
      subtotal: original.subtotal,
      discountAmount: original.discountAmount,
      taxAmount: original.taxAmount,
      total: original.total,
      terms: original.terms,
      notes: `Duplicated from Quote ${original.number}`,
      createdBy: userId,
    };

    const [quote] = await this.db.insert(quotes).values(quoteData).returning();

    // Copy items to new quote
    const itemsData: NewQuoteItem[] = original.items.map((item, index) => ({
      quoteId: quote.id,
      productId: item.productId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountPercent: item.discountPercent ?? '0',
      lineTotal: item.lineTotal,
      sortOrder: index.toString(),
    }));

    await this.db.insert(quoteItems).values(itemsData);

    return this.findById(tenantId, quote.id);
  }

  async checkExpired(): Promise<{ updatedCount: number }> {
    const today = new Date().toISOString().split('T')[0];

    // Find all sent quotes that have expired
    const result = await this.db
      .update(quotes)
      .set({ status: 'expired', updatedAt: new Date() })
      .where(
        and(
          eq(quotes.status, 'sent'),
          lt(quotes.validUntil, today),
          isNull(quotes.deletedAt),
        ),
      )
      .returning();

    return { updatedCount: result.length };
  }

  async delete(tenantId: string, id: string): Promise<void> {
    const quote = await this.findById(tenantId, id);

    if (quote.status !== 'draft') {
      throw new BadRequestException('Only draft quotes can be deleted');
    }

    await this.db
      .update(quotes)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(quotes.id, id));
  }

  private async getNextNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = 'QUO';

    let [seq] = await this.db
      .select()
      .from(sequences)
      .where(
        and(
          eq(sequences.tenantId, tenantId),
          eq(sequences.type, 'quote'),
          eq(sequences.year, year),
        ),
      )
      .limit(1);

    if (!seq) {
      [seq] = await this.db
        .insert(sequences)
        .values({
          tenantId,
          type: 'quote',
          prefix,
          currentNumber: 0,
          year,
        })
        .returning();
    }

    const newNumber = (seq.currentNumber ?? 0) + 1;
    await this.db
      .update(sequences)
      .set({ currentNumber: newNumber })
      .where(eq(sequences.id, seq.id));

    return `${prefix}-${year}-${String(newNumber).padStart(5, '0')}`;
  }

  async getStats(tenantId: string): Promise<{
    totalDraft: number;
    totalSent: number;
    totalAccepted: number;
    countDraft: number;
    countSent: number;
    countAccepted: number;
    countExpired: number;
    countRejected: number;
    countConverted: number;
  }> {
    const draftQuotes = await this.db
      .select()
      .from(quotes)
      .where(
        and(
          eq(quotes.tenantId, tenantId),
          eq(quotes.status, 'draft'),
          isNull(quotes.deletedAt),
        ),
      );

    const sentQuotes = await this.db
      .select()
      .from(quotes)
      .where(
        and(
          eq(quotes.tenantId, tenantId),
          eq(quotes.status, 'sent'),
          isNull(quotes.deletedAt),
        ),
      );

    const acceptedQuotes = await this.db
      .select()
      .from(quotes)
      .where(
        and(
          eq(quotes.tenantId, tenantId),
          eq(quotes.status, 'accepted'),
          isNull(quotes.deletedAt),
        ),
      );

    const expiredQuotes = await this.db
      .select()
      .from(quotes)
      .where(
        and(
          eq(quotes.tenantId, tenantId),
          eq(quotes.status, 'expired'),
          isNull(quotes.deletedAt),
        ),
      );

    const rejectedQuotes = await this.db
      .select()
      .from(quotes)
      .where(
        and(
          eq(quotes.tenantId, tenantId),
          eq(quotes.status, 'rejected'),
          isNull(quotes.deletedAt),
        ),
      );

    const convertedQuotes = await this.db
      .select()
      .from(quotes)
      .where(
        and(
          eq(quotes.tenantId, tenantId),
          eq(quotes.status, 'converted'),
          isNull(quotes.deletedAt),
        ),
      );

    return {
      totalDraft: draftQuotes.reduce((sum, q) => sum + parseFloat(q.total), 0),
      totalSent: sentQuotes.reduce((sum, q) => sum + parseFloat(q.total), 0),
      totalAccepted: acceptedQuotes.reduce((sum, q) => sum + parseFloat(q.total), 0),
      countDraft: draftQuotes.length,
      countSent: sentQuotes.length,
      countAccepted: acceptedQuotes.length,
      countExpired: expiredQuotes.length,
      countRejected: rejectedQuotes.length,
      countConverted: convertedQuotes.length,
    };
  }

  async getExpiringSoon(tenantId: string, days = 7): Promise<QuoteWithItems[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const results = await this.db
      .select({
        quote: quotes,
        customer: {
          id: contacts.id,
          name: contacts.name,
          nameAr: contacts.nameAr,
        },
      })
      .from(quotes)
      .leftJoin(contacts, eq(quotes.customerId, contacts.id))
      .where(
        and(
          eq(quotes.tenantId, tenantId),
          eq(quotes.status, 'sent'),
          gte(quotes.validUntil, today.toISOString().split('T')[0]),
          lte(quotes.validUntil, futureDate.toISOString().split('T')[0]),
          isNull(quotes.deletedAt),
        ),
      )
      .orderBy(quotes.validUntil);

    // Get items for each quote
    const quoteIds = results.map(r => r.quote.id);
    const allItems = quoteIds.length > 0
      ? await this.db
          .select()
          .from(quoteItems)
          .where(sql`${quoteItems.quoteId} IN ${quoteIds}`)
      : [];

    return results.map(r => ({
      ...r.quote,
      customer: r.customer?.id ? r.customer : null,
      items: allItems.filter(item => item.quoteId === r.quote.id),
    }));
  }
}
