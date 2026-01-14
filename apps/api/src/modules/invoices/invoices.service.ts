import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, isNull, desc, gte, lte, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';
import {
  invoices, Invoice, NewInvoice,
  invoiceItems, InvoiceItem, NewInvoiceItem,
  contacts, products, sequences,
} from '../../database/schema';
import { ExchangeRatesService } from '../exchange-rates/exchange-rates.service';

export interface InvoiceWithItems extends Invoice {
  items: InvoiceItem[];
  contact?: { id: string; name: string; nameAr: string | null } | null;
}

export interface InvoiceFilters {
  type?: string;
  status?: string;
  contactId?: string;
  dateFrom?: string;
  dateTo?: string;
}

@Injectable()
export class InvoicesService {
  constructor(
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
    private exchangeRatesService: ExchangeRatesService,
  ) {}

  async create(tenantId: string, userId: string, data: {
    type: string;
    invoiceNumber?: string;
    contactId?: string;
    date: string;
    dueDate?: string;
    status?: string;
    currency: string;
    exchangeRate: number;
    discountType?: string;
    discountValue?: number;
    taxRate?: number;
    notes?: string;
    expenseCategory?: string;
    items: {
      productId?: string;
      description: string;
      quantity: number;
      unit?: string;
      unitPrice: number;
      discountPercent?: number;
    }[];
  }): Promise<InvoiceWithItems> {
    // Calculate totals
    let subtotal = 0;
    const itemsWithTotals = data.items.map((item, index) => {
      const lineTotal = item.quantity * item.unitPrice * (1 - (item.discountPercent ?? 0) / 100);
      subtotal += lineTotal;
      return { ...item, lineTotal, sortOrder: index };
    });

    // Calculate discount
    let discountAmount = 0;
    if (data.discountType === 'percent' && data.discountValue) {
      discountAmount = subtotal * (data.discountValue / 100);
    } else if (data.discountType === 'fixed' && data.discountValue) {
      discountAmount = data.discountValue;
    }

    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * ((data.taxRate ?? 0) / 100);
    const total = afterDiscount + taxAmount;
    const totalLbp = data.currency === 'USD' ? total * data.exchangeRate : total;

    // Generate internal number
    const internalNumber = await this.getNextNumber(tenantId, `${data.type}_invoice`);

    // Create invoice
    const invoiceData: NewInvoice = {
      tenantId,
      type: data.type,
      invoiceNumber: data.invoiceNumber,
      internalNumber,
      contactId: data.contactId,
      date: data.date,
      dueDate: data.dueDate,
      status: data.status ?? 'draft',
      currency: data.currency,
      exchangeRate: data.exchangeRate.toString(),
      subtotal: subtotal.toString(),
      discountType: data.discountType,
      discountValue: (data.discountValue ?? 0).toString(),
      discountAmount: discountAmount.toString(),
      taxRate: (data.taxRate ?? 0).toString(),
      taxAmount: taxAmount.toString(),
      total: total.toString(),
      totalLbp: totalLbp.toString(),
      balance: total.toString(),
      notes: data.notes,
      expenseCategory: data.expenseCategory,
      createdBy: userId,
    };

    const [invoice] = await this.db.insert(invoices).values(invoiceData).returning();

    // Create invoice items
    const itemsData: NewInvoiceItem[] = itemsWithTotals.map(item => ({
      invoiceId: invoice.id,
      productId: item.productId,
      description: item.description,
      quantity: item.quantity.toString(),
      unit: item.unit ?? 'piece',
      unitPrice: item.unitPrice.toString(),
      discountPercent: (item.discountPercent ?? 0).toString(),
      lineTotal: item.lineTotal.toString(),
      sortOrder: item.sortOrder.toString(),
    }));

    await this.db.insert(invoiceItems).values(itemsData);

    return this.findById(tenantId, invoice.id);
  }

  async findAll(tenantId: string, filters?: InvoiceFilters): Promise<InvoiceWithItems[]> {
    const conditions = [
      eq(invoices.tenantId, tenantId),
      isNull(invoices.deletedAt),
    ];

    if (filters?.type) {
      conditions.push(eq(invoices.type, filters.type));
    }
    if (filters?.status) {
      conditions.push(eq(invoices.status, filters.status));
    }
    if (filters?.contactId) {
      conditions.push(eq(invoices.contactId, filters.contactId));
    }
    if (filters?.dateFrom) {
      conditions.push(gte(invoices.date, filters.dateFrom));
    }
    if (filters?.dateTo) {
      conditions.push(lte(invoices.date, filters.dateTo));
    }

    const results = await this.db
      .select({
        invoice: invoices,
        contact: {
          id: contacts.id,
          name: contacts.name,
          nameAr: contacts.nameAr,
        },
      })
      .from(invoices)
      .leftJoin(contacts, eq(invoices.contactId, contacts.id))
      .where(and(...conditions))
      .orderBy(desc(invoices.date), desc(invoices.createdAt));

    // Get items for each invoice
    const invoiceIds = results.map(r => r.invoice.id);
    const allItems = invoiceIds.length > 0
      ? await this.db
          .select()
          .from(invoiceItems)
          .where(sql`${invoiceItems.invoiceId} IN ${invoiceIds}`)
      : [];

    return results.map(r => ({
      ...r.invoice,
      contact: r.contact?.id ? r.contact : null,
      items: allItems.filter(item => item.invoiceId === r.invoice.id),
    }));
  }

  async findById(tenantId: string, id: string): Promise<InvoiceWithItems> {
    const [result] = await this.db
      .select({
        invoice: invoices,
        contact: {
          id: contacts.id,
          name: contacts.name,
          nameAr: contacts.nameAr,
        },
      })
      .from(invoices)
      .leftJoin(contacts, eq(invoices.contactId, contacts.id))
      .where(
        and(
          eq(invoices.id, id),
          eq(invoices.tenantId, tenantId),
          isNull(invoices.deletedAt),
        ),
      )
      .limit(1);

    if (!result) {
      throw new NotFoundException('Invoice not found');
    }

    const items = await this.db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, id))
      .orderBy(invoiceItems.sortOrder);

    return {
      ...result.invoice,
      contact: result.contact?.id ? result.contact : null,
      items,
    };
  }

  async update(tenantId: string, id: string, data: {
    invoiceNumber?: string;
    contactId?: string;
    date?: string;
    dueDate?: string;
    currency?: string;
    exchangeRate?: number;
    discountType?: string;
    discountValue?: number;
    taxRate?: number;
    notes?: string;
    expenseCategory?: string;
    items?: {
      productId?: string;
      description: string;
      quantity: number;
      unit?: string;
      unitPrice: number;
      discountPercent?: number;
    }[];
  }): Promise<InvoiceWithItems> {
    const existing = await this.findById(tenantId, id);

    if (existing.status !== 'draft') {
      throw new BadRequestException('Only draft invoices can be edited');
    }

    // If items are provided, recalculate totals
    if (data.items) {
      let subtotal = 0;
      const itemsWithTotals = data.items.map((item, index) => {
        const lineTotal = item.quantity * item.unitPrice * (1 - (item.discountPercent ?? 0) / 100);
        subtotal += lineTotal;
        return { ...item, lineTotal, sortOrder: index };
      });

      const discountType = data.discountType ?? existing.discountType;
      const discountValue = data.discountValue ?? parseFloat(existing.discountValue ?? '0');
      let discountAmount = 0;
      if (discountType === 'percent') {
        discountAmount = subtotal * (discountValue / 100);
      } else if (discountType === 'fixed') {
        discountAmount = discountValue;
      }

      const afterDiscount = subtotal - discountAmount;
      const taxRate = data.taxRate ?? parseFloat(existing.taxRate ?? '0');
      const taxAmount = afterDiscount * (taxRate / 100);
      const total = afterDiscount + taxAmount;
      const exchangeRate = data.exchangeRate ?? parseFloat(existing.exchangeRate);
      const currency = data.currency ?? existing.currency;
      const totalLbp = currency === 'USD' ? total * exchangeRate : total;

      // Delete existing items
      await this.db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));

      // Insert new items
      const itemsData: NewInvoiceItem[] = itemsWithTotals.map(item => ({
        invoiceId: id,
        productId: item.productId,
        description: item.description,
        quantity: item.quantity.toString(),
        unit: item.unit ?? 'piece',
        unitPrice: item.unitPrice.toString(),
        discountPercent: (item.discountPercent ?? 0).toString(),
        lineTotal: item.lineTotal.toString(),
        sortOrder: item.sortOrder.toString(),
      }));

      await this.db.insert(invoiceItems).values(itemsData);

      // Update invoice with new totals
      await this.db
        .update(invoices)
        .set({
          invoiceNumber: data.invoiceNumber ?? existing.invoiceNumber,
          contactId: data.contactId ?? existing.contactId,
          date: data.date ?? existing.date,
          dueDate: data.dueDate ?? existing.dueDate,
          currency,
          exchangeRate: exchangeRate.toString(),
          subtotal: subtotal.toString(),
          discountType,
          discountValue: discountValue.toString(),
          discountAmount: discountAmount.toString(),
          taxRate: taxRate.toString(),
          taxAmount: taxAmount.toString(),
          total: total.toString(),
          totalLbp: totalLbp.toString(),
          balance: total.toString(),
          notes: data.notes ?? existing.notes,
          expenseCategory: data.expenseCategory ?? existing.expenseCategory,
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, id));
    } else {
      // Just update non-item fields
      const updateData: Partial<NewInvoice> = { updatedAt: new Date() };
      if (data.invoiceNumber !== undefined) updateData.invoiceNumber = data.invoiceNumber;
      if (data.contactId !== undefined) updateData.contactId = data.contactId;
      if (data.date !== undefined) updateData.date = data.date;
      if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.expenseCategory !== undefined) updateData.expenseCategory = data.expenseCategory;

      await this.db.update(invoices).set(updateData).where(eq(invoices.id, id));
    }

    return this.findById(tenantId, id);
  }

  async confirm(tenantId: string, id: string): Promise<InvoiceWithItems> {
    const invoice = await this.findById(tenantId, id);

    if (invoice.status !== 'draft') {
      throw new BadRequestException('Only draft invoices can be confirmed');
    }

    // Update invoice status
    await this.db
      .update(invoices)
      .set({ status: 'pending', updatedAt: new Date() })
      .where(eq(invoices.id, id));

    // Update supplier balance (for purchase invoices)
    if (invoice.type === 'purchase' && invoice.contactId) {
      const contact = await this.db
        .select()
        .from(contacts)
        .where(eq(contacts.id, invoice.contactId))
        .limit(1);

      if (contact[0]) {
        const currentBalanceUsd = parseFloat(contact[0].balanceUsd ?? '0');
        const currentBalanceLbp = parseFloat(contact[0].balanceLbp ?? '0');

        if (invoice.currency === 'USD') {
          await this.db
            .update(contacts)
            .set({
              balanceUsd: (currentBalanceUsd + parseFloat(invoice.total)).toString(),
              balanceLbp: (currentBalanceLbp + parseFloat(invoice.totalLbp)).toString(),
              updatedAt: new Date(),
            })
            .where(eq(contacts.id, invoice.contactId));
        } else {
          await this.db
            .update(contacts)
            .set({
              balanceLbp: (currentBalanceLbp + parseFloat(invoice.total)).toString(),
              updatedAt: new Date(),
            })
            .where(eq(contacts.id, invoice.contactId));
        }
      }
    }

    // Update product stock and cost (for purchase invoices)
    if (invoice.type === 'purchase') {
      for (const item of invoice.items) {
        if (item.productId) {
          const [product] = await this.db
            .select()
            .from(products)
            .where(eq(products.id, item.productId))
            .limit(1);

          if (product) {
            const currentStock = parseFloat(product.currentStock ?? '0');
            const newStock = currentStock + parseFloat(item.quantity);

            await this.db
              .update(products)
              .set({
                currentStock: newStock.toString(),
                costPrice: item.unitPrice,
                costCurrency: invoice.currency as 'USD' | 'LBP',
                updatedAt: new Date(),
              })
              .where(eq(products.id, item.productId));
          }
        }
      }
    }

    return this.findById(tenantId, id);
  }

  async cancel(tenantId: string, id: string): Promise<InvoiceWithItems> {
    const invoice = await this.findById(tenantId, id);

    if (invoice.status === 'cancelled') {
      throw new BadRequestException('Invoice is already cancelled');
    }

    if (parseFloat(invoice.amountPaid ?? '0') > 0) {
      throw new BadRequestException('Cannot cancel invoice with payments. Void payments first.');
    }

    // Reverse supplier balance if was confirmed
    if (invoice.status !== 'draft' && invoice.type === 'purchase' && invoice.contactId) {
      const [contact] = await this.db
        .select()
        .from(contacts)
        .where(eq(contacts.id, invoice.contactId))
        .limit(1);

      if (contact) {
        const currentBalanceUsd = parseFloat(contact.balanceUsd ?? '0');
        const currentBalanceLbp = parseFloat(contact.balanceLbp ?? '0');

        if (invoice.currency === 'USD') {
          await this.db
            .update(contacts)
            .set({
              balanceUsd: (currentBalanceUsd - parseFloat(invoice.total)).toString(),
              balanceLbp: (currentBalanceLbp - parseFloat(invoice.totalLbp)).toString(),
              updatedAt: new Date(),
            })
            .where(eq(contacts.id, invoice.contactId));
        } else {
          await this.db
            .update(contacts)
            .set({
              balanceLbp: (currentBalanceLbp - parseFloat(invoice.total)).toString(),
              updatedAt: new Date(),
            })
            .where(eq(contacts.id, invoice.contactId));
        }
      }
    }

    // Reverse product stock if was confirmed
    if (invoice.status !== 'draft' && invoice.type === 'purchase') {
      for (const item of invoice.items) {
        if (item.productId) {
          const [product] = await this.db
            .select()
            .from(products)
            .where(eq(products.id, item.productId))
            .limit(1);

          if (product) {
            const currentStock = parseFloat(product.currentStock ?? '0');
            const newStock = Math.max(0, currentStock - parseFloat(item.quantity));

            await this.db
              .update(products)
              .set({
                currentStock: newStock.toString(),
                updatedAt: new Date(),
              })
              .where(eq(products.id, item.productId));
          }
        }
      }
    }

    await this.db
      .update(invoices)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(invoices.id, id));

    return this.findById(tenantId, id);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    const invoice = await this.findById(tenantId, id);

    if (invoice.status !== 'draft') {
      throw new BadRequestException('Only draft invoices can be deleted');
    }

    await this.db
      .update(invoices)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(invoices.id, id));
  }

  async updatePayment(invoiceId: string, paymentAmount: number, isVoid = false): Promise<void> {
    const [invoice] = await this.db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    if (!invoice) return;

    const currentPaid = parseFloat(invoice.amountPaid ?? '0');
    const total = parseFloat(invoice.total);
    const newPaid = isVoid ? currentPaid - paymentAmount : currentPaid + paymentAmount;
    const newBalance = total - newPaid;

    let newStatus = invoice.status;
    if (newBalance <= 0) {
      newStatus = 'paid';
    } else if (newPaid > 0) {
      newStatus = 'partial';
    } else {
      newStatus = 'pending';
    }

    await this.db
      .update(invoices)
      .set({
        amountPaid: newPaid.toString(),
        balance: newBalance.toString(),
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId));
  }

  private async getNextNumber(tenantId: string, type: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = type === 'purchase_invoice' ? 'PUR' : type === 'expense_invoice' ? 'EXP' : 'SAL';

    // Get or create sequence
    let [seq] = await this.db
      .select()
      .from(sequences)
      .where(
        and(
          eq(sequences.tenantId, tenantId),
          eq(sequences.type, type),
          eq(sequences.year, year),
        ),
      )
      .limit(1);

    if (!seq) {
      [seq] = await this.db
        .insert(sequences)
        .values({
          tenantId,
          type,
          prefix,
          currentNumber: 0,
          year,
        })
        .returning();
    }

    // Increment and return
    const newNumber = (seq.currentNumber ?? 0) + 1;
    await this.db
      .update(sequences)
      .set({ currentNumber: newNumber })
      .where(eq(sequences.id, seq.id));

    return `${prefix}-${year}-${String(newNumber).padStart(5, '0')}`;
  }

  async getStats(tenantId: string): Promise<{
    totalPending: number;
    totalOverdue: number;
    countPending: number;
    countOverdue: number;
  }> {
    const today = new Date().toISOString().split('T')[0];

    const pendingInvoices = await this.db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.tenantId, tenantId),
          eq(invoices.status, 'pending'),
          isNull(invoices.deletedAt),
        ),
      );

    const partialInvoices = await this.db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.tenantId, tenantId),
          eq(invoices.status, 'partial'),
          isNull(invoices.deletedAt),
        ),
      );

    const allUnpaid = [...pendingInvoices, ...partialInvoices];
    const overdue = allUnpaid.filter(inv => inv.dueDate && inv.dueDate < today);

    return {
      totalPending: allUnpaid.reduce((sum, inv) => sum + parseFloat(inv.balance ?? '0'), 0),
      totalOverdue: overdue.reduce((sum, inv) => sum + parseFloat(inv.balance ?? '0'), 0),
      countPending: allUnpaid.length,
      countOverdue: overdue.length,
    };
  }

  async getDueSoon(tenantId: string, days = 7): Promise<InvoiceWithItems[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    return this.findAll(tenantId, {
      status: 'pending',
      dateFrom: today.toISOString().split('T')[0],
      dateTo: futureDate.toISOString().split('T')[0],
    });
  }
}
