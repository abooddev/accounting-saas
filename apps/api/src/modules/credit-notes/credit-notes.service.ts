import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, isNull, desc, gte, lte, sql, ne } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';
import {
  creditNotes, CreditNote, NewCreditNote,
  creditNoteItems, CreditNoteItem, NewCreditNoteItem,
  creditNoteAllocations, CreditNoteAllocation, NewCreditNoteAllocation,
  contacts, invoices, sequences,
} from '../../database/schema';

export interface CreditNoteWithDetails extends CreditNote {
  items: CreditNoteItem[];
  allocations: CreditNoteAllocation[];
  contact?: { id: string; name: string; nameAr: string | null } | null;
  originalInvoice?: { id: string; internalNumber: string } | null;
}

export interface CreditNoteFilters {
  type?: 'credit' | 'debit';
  status?: 'draft' | 'issued' | 'applied' | 'cancelled';
  contactId?: string;
  contactType?: 'customer' | 'supplier';
  dateFrom?: string;
  dateTo?: string;
}

export interface ReturnData {
  contactId: string;
  contactType: 'customer' | 'supplier';
  originalInvoiceId?: string;
  date: string;
  reason: string;
  currency: string;
  exchangeRate: number;
  items: {
    productId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
}

@Injectable()
export class CreditNotesService {
  constructor(
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Create a new credit or debit note
   */
  async create(tenantId: string, userId: string, data: {
    type: 'credit' | 'debit';
    contactId: string;
    contactType: 'customer' | 'supplier';
    originalInvoiceId?: string;
    date: string;
    reason?: string;
    currency: string;
    exchangeRate: number;
    taxRate?: number;
    notes?: string;
    items: {
      productId?: string;
      description: string;
      quantity: number;
      unitPrice: number;
    }[];
  }): Promise<CreditNoteWithDetails> {
    // Calculate totals
    let subtotal = 0;
    const itemsWithTotals = data.items.map((item, index) => {
      const lineTotal = item.quantity * item.unitPrice;
      subtotal += lineTotal;
      return { ...item, lineTotal, sortOrder: index };
    });

    const taxAmount = subtotal * ((data.taxRate ?? 0) / 100);
    const total = subtotal + taxAmount;
    const totalLbp = data.currency === 'USD' ? total * data.exchangeRate : total;

    // Generate number based on type
    const sequenceType = data.type === 'credit' ? 'credit_note' : 'debit_note';
    const number = await this.getNextNumber(tenantId, sequenceType);

    // Create credit note
    const creditNoteData: NewCreditNote = {
      tenantId,
      number,
      type: data.type,
      contactId: data.contactId,
      contactType: data.contactType,
      originalInvoiceId: data.originalInvoiceId,
      date: data.date,
      reason: data.reason,
      currency: data.currency,
      exchangeRate: data.exchangeRate.toString(),
      subtotal: subtotal.toString(),
      taxRate: (data.taxRate ?? 0).toString(),
      taxAmount: taxAmount.toString(),
      total: total.toString(),
      totalLbp: totalLbp.toString(),
      status: 'draft',
      appliedAmount: '0',
      unappliedAmount: total.toString(),
      notes: data.notes,
      createdBy: userId,
    };

    const [creditNote] = await this.db.insert(creditNotes).values(creditNoteData).returning();

    // Create items
    const itemsData: NewCreditNoteItem[] = itemsWithTotals.map(item => ({
      creditNoteId: creditNote.id,
      productId: item.productId,
      description: item.description,
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toString(),
      lineTotal: item.lineTotal.toString(),
      sortOrder: item.sortOrder.toString(),
    }));

    await this.db.insert(creditNoteItems).values(itemsData);

    return this.findById(tenantId, creditNote.id);
  }

  /**
   * Create credit note automatically from a POS return
   */
  async createFromReturn(tenantId: string, userId: string, returnData: ReturnData): Promise<CreditNoteWithDetails> {
    return this.create(tenantId, userId, {
      type: 'credit',
      contactId: returnData.contactId,
      contactType: returnData.contactType,
      originalInvoiceId: returnData.originalInvoiceId,
      date: returnData.date,
      reason: returnData.reason,
      currency: returnData.currency,
      exchangeRate: returnData.exchangeRate,
      items: returnData.items,
    });
  }

  /**
   * Find all credit/debit notes with filtering
   */
  async findAll(tenantId: string, filters?: CreditNoteFilters): Promise<CreditNoteWithDetails[]> {
    const conditions = [
      eq(creditNotes.tenantId, tenantId),
      isNull(creditNotes.deletedAt),
    ];

    if (filters?.type) {
      conditions.push(eq(creditNotes.type, filters.type));
    }
    if (filters?.status) {
      conditions.push(eq(creditNotes.status, filters.status));
    }
    if (filters?.contactId) {
      conditions.push(eq(creditNotes.contactId, filters.contactId));
    }
    if (filters?.contactType) {
      conditions.push(eq(creditNotes.contactType, filters.contactType));
    }
    if (filters?.dateFrom) {
      conditions.push(gte(creditNotes.date, filters.dateFrom));
    }
    if (filters?.dateTo) {
      conditions.push(lte(creditNotes.date, filters.dateTo));
    }

    const results = await this.db
      .select({
        creditNote: creditNotes,
        contact: {
          id: contacts.id,
          name: contacts.name,
          nameAr: contacts.nameAr,
        },
        originalInvoice: {
          id: invoices.id,
          internalNumber: invoices.internalNumber,
        },
      })
      .from(creditNotes)
      .leftJoin(contacts, eq(creditNotes.contactId, contacts.id))
      .leftJoin(invoices, eq(creditNotes.originalInvoiceId, invoices.id))
      .where(and(...conditions))
      .orderBy(desc(creditNotes.date), desc(creditNotes.createdAt));

    // Get items and allocations for each credit note
    const creditNoteIds = results.map(r => r.creditNote.id);

    const allItems = creditNoteIds.length > 0
      ? await this.db
          .select()
          .from(creditNoteItems)
          .where(sql`${creditNoteItems.creditNoteId} IN ${creditNoteIds}`)
      : [];

    const allAllocations = creditNoteIds.length > 0
      ? await this.db
          .select()
          .from(creditNoteAllocations)
          .where(sql`${creditNoteAllocations.creditNoteId} IN ${creditNoteIds}`)
      : [];

    return results.map(r => ({
      ...r.creditNote,
      contact: r.contact?.id ? r.contact : null,
      originalInvoice: r.originalInvoice?.id ? r.originalInvoice : null,
      items: allItems.filter(item => item.creditNoteId === r.creditNote.id),
      allocations: allAllocations.filter(alloc => alloc.creditNoteId === r.creditNote.id),
    }));
  }

  /**
   * Find a credit/debit note by ID with full details
   */
  async findById(tenantId: string, id: string): Promise<CreditNoteWithDetails> {
    const [result] = await this.db
      .select({
        creditNote: creditNotes,
        contact: {
          id: contacts.id,
          name: contacts.name,
          nameAr: contacts.nameAr,
        },
        originalInvoice: {
          id: invoices.id,
          internalNumber: invoices.internalNumber,
        },
      })
      .from(creditNotes)
      .leftJoin(contacts, eq(creditNotes.contactId, contacts.id))
      .leftJoin(invoices, eq(creditNotes.originalInvoiceId, invoices.id))
      .where(
        and(
          eq(creditNotes.id, id),
          eq(creditNotes.tenantId, tenantId),
          isNull(creditNotes.deletedAt),
        ),
      )
      .limit(1);

    if (!result) {
      throw new NotFoundException('Credit/Debit note not found');
    }

    const items = await this.db
      .select()
      .from(creditNoteItems)
      .where(eq(creditNoteItems.creditNoteId, id))
      .orderBy(creditNoteItems.sortOrder);

    const allocations = await this.db
      .select()
      .from(creditNoteAllocations)
      .where(eq(creditNoteAllocations.creditNoteId, id))
      .orderBy(creditNoteAllocations.allocatedAt);

    return {
      ...result.creditNote,
      contact: result.contact?.id ? result.contact : null,
      originalInvoice: result.originalInvoice?.id ? result.originalInvoice : null,
      items,
      allocations,
    };
  }

  /**
   * Update a draft credit/debit note
   */
  async update(tenantId: string, id: string, data: {
    contactId?: string;
    contactType?: 'customer' | 'supplier';
    originalInvoiceId?: string;
    date?: string;
    reason?: string;
    currency?: string;
    exchangeRate?: number;
    taxRate?: number;
    notes?: string;
    items?: {
      productId?: string;
      description: string;
      quantity: number;
      unitPrice: number;
    }[];
  }): Promise<CreditNoteWithDetails> {
    const existing = await this.findById(tenantId, id);

    if (existing.status !== 'draft') {
      throw new BadRequestException('Only draft credit/debit notes can be edited');
    }

    // If items are provided, recalculate totals
    if (data.items) {
      let subtotal = 0;
      const itemsWithTotals = data.items.map((item, index) => {
        const lineTotal = item.quantity * item.unitPrice;
        subtotal += lineTotal;
        return { ...item, lineTotal, sortOrder: index };
      });

      const taxRate = data.taxRate ?? parseFloat(existing.taxRate ?? '0');
      const taxAmount = subtotal * (taxRate / 100);
      const total = subtotal + taxAmount;
      const exchangeRate = data.exchangeRate ?? parseFloat(existing.exchangeRate);
      const currency = data.currency ?? existing.currency;
      const totalLbp = currency === 'USD' ? total * exchangeRate : total;

      // Delete existing items
      await this.db.delete(creditNoteItems).where(eq(creditNoteItems.creditNoteId, id));

      // Insert new items
      const itemsData: NewCreditNoteItem[] = itemsWithTotals.map(item => ({
        creditNoteId: id,
        productId: item.productId,
        description: item.description,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
        lineTotal: item.lineTotal.toString(),
        sortOrder: item.sortOrder.toString(),
      }));

      await this.db.insert(creditNoteItems).values(itemsData);

      // Update credit note with new totals
      await this.db
        .update(creditNotes)
        .set({
          contactId: data.contactId ?? existing.contactId,
          contactType: data.contactType ?? existing.contactType,
          originalInvoiceId: data.originalInvoiceId ?? existing.originalInvoiceId,
          date: data.date ?? existing.date,
          reason: data.reason ?? existing.reason,
          currency,
          exchangeRate: exchangeRate.toString(),
          subtotal: subtotal.toString(),
          taxRate: taxRate.toString(),
          taxAmount: taxAmount.toString(),
          total: total.toString(),
          totalLbp: totalLbp.toString(),
          unappliedAmount: total.toString(),
          notes: data.notes ?? existing.notes,
          updatedAt: new Date(),
        })
        .where(eq(creditNotes.id, id));
    } else {
      // Just update non-item fields
      const updateData: Partial<NewCreditNote> = { updatedAt: new Date() };
      if (data.contactId !== undefined) updateData.contactId = data.contactId;
      if (data.contactType !== undefined) updateData.contactType = data.contactType;
      if (data.originalInvoiceId !== undefined) updateData.originalInvoiceId = data.originalInvoiceId;
      if (data.date !== undefined) updateData.date = data.date;
      if (data.reason !== undefined) updateData.reason = data.reason;
      if (data.notes !== undefined) updateData.notes = data.notes;

      await this.db.update(creditNotes).set(updateData).where(eq(creditNotes.id, id));
    }

    return this.findById(tenantId, id);
  }

  /**
   * Issue a credit/debit note and update contact balance
   *
   * Balance Logic:
   * - Credit Note (to customer): Reduces what customer owes (decrease AR, negative balance)
   * - Debit Note (to customer): Increases what customer owes (increase AR, positive balance)
   * - Credit Note (from supplier): Reduces what we owe supplier (decrease AP, positive balance for us)
   * - Debit Note (from supplier): Increases what we owe supplier (increase AP, negative balance for us)
   */
  async issue(tenantId: string, id: string): Promise<CreditNoteWithDetails> {
    const creditNote = await this.findById(tenantId, id);

    if (creditNote.status !== 'draft') {
      throw new BadRequestException('Only draft credit/debit notes can be issued');
    }

    // Get contact for balance update
    const [contact] = await this.db
      .select()
      .from(contacts)
      .where(eq(contacts.id, creditNote.contactId))
      .limit(1);

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    const total = parseFloat(creditNote.total);
    const totalLbp = parseFloat(creditNote.totalLbp);
    const currentBalanceUsd = parseFloat(contact.balanceUsd ?? '0');
    const currentBalanceLbp = parseFloat(contact.balanceLbp ?? '0');

    let newBalanceUsd = currentBalanceUsd;
    let newBalanceLbp = currentBalanceLbp;

    // Calculate balance change based on type and contact type
    if (creditNote.contactType === 'customer') {
      if (creditNote.type === 'credit') {
        // Credit Note to customer: reduce what they owe us (decrease their balance)
        if (creditNote.currency === 'USD') {
          newBalanceUsd = currentBalanceUsd - total;
          newBalanceLbp = currentBalanceLbp - totalLbp;
        } else {
          newBalanceLbp = currentBalanceLbp - total;
        }
      } else {
        // Debit Note to customer: increase what they owe us (increase their balance)
        if (creditNote.currency === 'USD') {
          newBalanceUsd = currentBalanceUsd + total;
          newBalanceLbp = currentBalanceLbp + totalLbp;
        } else {
          newBalanceLbp = currentBalanceLbp + total;
        }
      }
    } else {
      // Supplier
      if (creditNote.type === 'credit') {
        // Credit Note from supplier: reduce what we owe them (decrease our payable = negative adjustment)
        if (creditNote.currency === 'USD') {
          newBalanceUsd = currentBalanceUsd - total;
          newBalanceLbp = currentBalanceLbp - totalLbp;
        } else {
          newBalanceLbp = currentBalanceLbp - total;
        }
      } else {
        // Debit Note from supplier: increase what we owe them (increase our payable)
        if (creditNote.currency === 'USD') {
          newBalanceUsd = currentBalanceUsd + total;
          newBalanceLbp = currentBalanceLbp + totalLbp;
        } else {
          newBalanceLbp = currentBalanceLbp + total;
        }
      }
    }

    // Update contact balance
    await this.db
      .update(contacts)
      .set({
        balanceUsd: newBalanceUsd.toString(),
        balanceLbp: newBalanceLbp.toString(),
        updatedAt: new Date(),
      })
      .where(eq(contacts.id, creditNote.contactId));

    // Update credit note status
    await this.db
      .update(creditNotes)
      .set({ status: 'issued', updatedAt: new Date() })
      .where(eq(creditNotes.id, id));

    return this.findById(tenantId, id);
  }

  /**
   * Apply credit to an invoice
   * Updates invoice.amountPaid and invoice.balance
   */
  async applyToInvoice(
    tenantId: string,
    noteId: string,
    invoiceId: string,
    amount: number,
    userId: string,
    notes?: string,
  ): Promise<CreditNoteWithDetails> {
    const creditNote = await this.findById(tenantId, noteId);

    if (creditNote.status !== 'issued' && creditNote.status !== 'applied') {
      throw new BadRequestException('Credit note must be issued before it can be applied');
    }

    if (creditNote.type !== 'credit') {
      throw new BadRequestException('Only credit notes can be applied to invoices');
    }

    const unappliedAmount = parseFloat(creditNote.unappliedAmount ?? '0');
    if (amount > unappliedAmount) {
      throw new BadRequestException(`Cannot apply more than the unapplied amount (${unappliedAmount})`);
    }

    // Get the invoice
    const [invoice] = await this.db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.id, invoiceId),
          eq(invoices.tenantId, tenantId),
          isNull(invoices.deletedAt),
        ),
      )
      .limit(1);

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Validate invoice belongs to same contact
    if (invoice.contactId !== creditNote.contactId) {
      throw new BadRequestException('Invoice must belong to the same contact as the credit note');
    }

    const invoiceBalance = parseFloat(invoice.balance ?? '0');
    if (amount > invoiceBalance) {
      throw new BadRequestException(`Cannot apply more than the invoice balance (${invoiceBalance})`);
    }

    // Create allocation record
    const allocationData: NewCreditNoteAllocation = {
      creditNoteId: noteId,
      invoiceId,
      amount: amount.toString(),
      allocatedBy: userId,
      notes,
    };

    await this.db.insert(creditNoteAllocations).values(allocationData);

    // Update credit note amounts
    const newAppliedAmount = parseFloat(creditNote.appliedAmount ?? '0') + amount;
    const newUnappliedAmount = parseFloat(creditNote.total) - newAppliedAmount;
    const newStatus = newUnappliedAmount <= 0 ? 'applied' : creditNote.status;

    await this.db
      .update(creditNotes)
      .set({
        appliedAmount: newAppliedAmount.toString(),
        unappliedAmount: newUnappliedAmount.toString(),
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(creditNotes.id, noteId));

    // Update invoice amounts
    const newAmountPaid = parseFloat(invoice.amountPaid ?? '0') + amount;
    const newInvoiceBalance = parseFloat(invoice.total) - newAmountPaid;
    let newInvoiceStatus = invoice.status;

    if (newInvoiceBalance <= 0) {
      newInvoiceStatus = 'paid';
    } else if (newAmountPaid > 0) {
      newInvoiceStatus = 'partial';
    }

    await this.db
      .update(invoices)
      .set({
        amountPaid: newAmountPaid.toString(),
        balance: newInvoiceBalance.toString(),
        status: newInvoiceStatus,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId));

    return this.findById(tenantId, noteId);
  }

  /**
   * Get unapplied credits for a contact
   */
  async getUnappliedCredits(tenantId: string, contactId: string): Promise<CreditNoteWithDetails[]> {
    const results = await this.db
      .select({
        creditNote: creditNotes,
        contact: {
          id: contacts.id,
          name: contacts.name,
          nameAr: contacts.nameAr,
        },
      })
      .from(creditNotes)
      .leftJoin(contacts, eq(creditNotes.contactId, contacts.id))
      .where(
        and(
          eq(creditNotes.tenantId, tenantId),
          eq(creditNotes.contactId, contactId),
          eq(creditNotes.type, 'credit'),
          sql`${creditNotes.status} IN ('issued', 'applied')`,
          sql`CAST(${creditNotes.unappliedAmount} AS DECIMAL) > 0`,
          isNull(creditNotes.deletedAt),
        ),
      )
      .orderBy(desc(creditNotes.date));

    const creditNoteIds = results.map(r => r.creditNote.id);

    const allItems = creditNoteIds.length > 0
      ? await this.db
          .select()
          .from(creditNoteItems)
          .where(sql`${creditNoteItems.creditNoteId} IN ${creditNoteIds}`)
      : [];

    const allAllocations = creditNoteIds.length > 0
      ? await this.db
          .select()
          .from(creditNoteAllocations)
          .where(sql`${creditNoteAllocations.creditNoteId} IN ${creditNoteIds}`)
      : [];

    return results.map(r => ({
      ...r.creditNote,
      contact: r.contact?.id ? r.contact : null,
      originalInvoice: null,
      items: allItems.filter(item => item.creditNoteId === r.creditNote.id),
      allocations: allAllocations.filter(alloc => alloc.creditNoteId === r.creditNote.id),
    }));
  }

  /**
   * Cancel a credit/debit note and reverse balance changes
   */
  async cancel(tenantId: string, id: string, reason: string): Promise<CreditNoteWithDetails> {
    const creditNote = await this.findById(tenantId, id);

    if (creditNote.status === 'cancelled') {
      throw new BadRequestException('Credit/Debit note is already cancelled');
    }

    // Check if there are any allocations
    if (creditNote.allocations.length > 0) {
      throw new BadRequestException('Cannot cancel a credit note that has been applied to invoices. Reverse the allocations first.');
    }

    // If it was issued, reverse the balance changes
    if (creditNote.status === 'issued') {
      const [contact] = await this.db
        .select()
        .from(contacts)
        .where(eq(contacts.id, creditNote.contactId))
        .limit(1);

      if (contact) {
        const total = parseFloat(creditNote.total);
        const totalLbp = parseFloat(creditNote.totalLbp);
        const currentBalanceUsd = parseFloat(contact.balanceUsd ?? '0');
        const currentBalanceLbp = parseFloat(contact.balanceLbp ?? '0');

        let newBalanceUsd = currentBalanceUsd;
        let newBalanceLbp = currentBalanceLbp;

        // Reverse the balance change (opposite of issue)
        if (creditNote.contactType === 'customer') {
          if (creditNote.type === 'credit') {
            // Reversing credit note to customer: add back what we reduced
            if (creditNote.currency === 'USD') {
              newBalanceUsd = currentBalanceUsd + total;
              newBalanceLbp = currentBalanceLbp + totalLbp;
            } else {
              newBalanceLbp = currentBalanceLbp + total;
            }
          } else {
            // Reversing debit note to customer: reduce what we added
            if (creditNote.currency === 'USD') {
              newBalanceUsd = currentBalanceUsd - total;
              newBalanceLbp = currentBalanceLbp - totalLbp;
            } else {
              newBalanceLbp = currentBalanceLbp - total;
            }
          }
        } else {
          // Supplier - reverse
          if (creditNote.type === 'credit') {
            if (creditNote.currency === 'USD') {
              newBalanceUsd = currentBalanceUsd + total;
              newBalanceLbp = currentBalanceLbp + totalLbp;
            } else {
              newBalanceLbp = currentBalanceLbp + total;
            }
          } else {
            if (creditNote.currency === 'USD') {
              newBalanceUsd = currentBalanceUsd - total;
              newBalanceLbp = currentBalanceLbp - totalLbp;
            } else {
              newBalanceLbp = currentBalanceLbp - total;
            }
          }
        }

        await this.db
          .update(contacts)
          .set({
            balanceUsd: newBalanceUsd.toString(),
            balanceLbp: newBalanceLbp.toString(),
            updatedAt: new Date(),
          })
          .where(eq(contacts.id, creditNote.contactId));
      }
    }

    // Update credit note status
    await this.db
      .update(creditNotes)
      .set({
        status: 'cancelled',
        cancellationReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(creditNotes.id, id));

    return this.findById(tenantId, id);
  }

  /**
   * Delete a draft credit/debit note (soft delete)
   */
  async delete(tenantId: string, id: string): Promise<void> {
    const creditNote = await this.findById(tenantId, id);

    if (creditNote.status !== 'draft') {
      throw new BadRequestException('Only draft credit/debit notes can be deleted');
    }

    await this.db
      .update(creditNotes)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(creditNotes.id, id));
  }

  /**
   * Get statistics for credit/debit notes
   */
  async getStats(tenantId: string): Promise<{
    totalCreditNotes: number;
    totalDebitNotes: number;
    totalUnappliedCredits: number;
    countCreditNotes: number;
    countDebitNotes: number;
    countUnapplied: number;
  }> {
    const allNotes = await this.db
      .select()
      .from(creditNotes)
      .where(
        and(
          eq(creditNotes.tenantId, tenantId),
          ne(creditNotes.status, 'cancelled'),
          isNull(creditNotes.deletedAt),
        ),
      );

    const creditNotesList = allNotes.filter(n => n.type === 'credit');
    const debitNotesList = allNotes.filter(n => n.type === 'debit');
    const unappliedList = creditNotesList.filter(n =>
      (n.status === 'issued' || n.status === 'applied') &&
      parseFloat(n.unappliedAmount ?? '0') > 0
    );

    return {
      totalCreditNotes: creditNotesList.reduce((sum, n) => sum + parseFloat(n.total), 0),
      totalDebitNotes: debitNotesList.reduce((sum, n) => sum + parseFloat(n.total), 0),
      totalUnappliedCredits: unappliedList.reduce((sum, n) => sum + parseFloat(n.unappliedAmount ?? '0'), 0),
      countCreditNotes: creditNotesList.length,
      countDebitNotes: debitNotesList.length,
      countUnapplied: unappliedList.length,
    };
  }

  /**
   * Generate next sequence number for credit/debit notes
   */
  private async getNextNumber(tenantId: string, type: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = type === 'credit_note' ? 'CN' : 'DN';

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
}
