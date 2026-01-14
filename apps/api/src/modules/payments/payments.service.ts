import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';
import { payments, Payment, NewPayment, contacts, sequences, moneyAccounts, invoices } from '../../database/schema';
import { AccountsService } from '../accounts/accounts.service';
import { InvoicesService } from '../invoices/invoices.service';

export interface PaymentWithRelations extends Payment {
  contact?: { id: string; name: string; nameAr: string | null } | null;
  invoice?: { id: string; internalNumber: string; total: string } | null;
  account?: { id: string; name: string; currency: string } | null;
}

export interface PaymentFilters {
  type?: string;
  contactId?: string;
  dateFrom?: string;
  dateTo?: string;
}

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
    private accountsService: AccountsService,
    private invoicesService: InvoicesService,
  ) {}

  async create(tenantId: string, userId: string, data: {
    type: string;
    contactId?: string;
    invoiceId?: string;
    accountId: string;
    date: string;
    amount: number;
    currency: string;
    exchangeRate: number;
    paymentMethod: string;
    reference?: string;
    notes?: string;
  }): Promise<PaymentWithRelations> {
    // Validate account exists and has sufficient balance
    const account = await this.accountsService.findById(tenantId, data.accountId);
    const currentBalance = parseFloat(account.currentBalance ?? '0');

    if (currentBalance < data.amount) {
      throw new BadRequestException(`Insufficient balance in ${account.name}. Available: ${currentBalance}`);
    }

    // Calculate LBP equivalent
    const amountLbp = data.currency === 'USD' ? data.amount * data.exchangeRate : data.amount;

    // Generate payment number
    const paymentNumber = await this.getNextNumber(tenantId);

    // Create payment
    const paymentData: NewPayment = {
      tenantId,
      type: data.type,
      paymentNumber,
      contactId: data.contactId,
      invoiceId: data.invoiceId,
      accountId: data.accountId,
      date: data.date,
      amount: data.amount.toString(),
      currency: data.currency,
      exchangeRate: data.exchangeRate.toString(),
      amountLbp: amountLbp.toString(),
      paymentMethod: data.paymentMethod,
      reference: data.reference,
      notes: data.notes,
      createdBy: userId,
    };

    const [payment] = await this.db.insert(payments).values(paymentData).returning();

    // Deduct from account
    await this.accountsService.createMovement(tenantId, {
      accountId: data.accountId,
      type: 'out',
      amount: data.amount,
      referenceType: 'payment',
      referenceId: payment.id,
      description: `Payment ${paymentNumber}`,
      date: data.date,
    });

    // Update invoice if linked
    if (data.invoiceId) {
      await this.invoicesService.updatePayment(data.invoiceId, data.amount);
    }

    // Update supplier balance
    if (data.contactId) {
      const [contact] = await this.db
        .select()
        .from(contacts)
        .where(eq(contacts.id, data.contactId))
        .limit(1);

      if (contact) {
        const currentBalanceUsd = parseFloat(contact.balanceUsd ?? '0');
        const currentBalanceLbp = parseFloat(contact.balanceLbp ?? '0');

        if (data.currency === 'USD') {
          await this.db
            .update(contacts)
            .set({
              balanceUsd: (currentBalanceUsd - data.amount).toString(),
              balanceLbp: (currentBalanceLbp - amountLbp).toString(),
              updatedAt: new Date(),
            })
            .where(eq(contacts.id, data.contactId));
        } else {
          await this.db
            .update(contacts)
            .set({
              balanceLbp: (currentBalanceLbp - data.amount).toString(),
              updatedAt: new Date(),
            })
            .where(eq(contacts.id, data.contactId));
        }
      }
    }

    return this.findById(tenantId, payment.id);
  }

  async findAll(tenantId: string, filters?: PaymentFilters): Promise<PaymentWithRelations[]> {
    const conditions = [
      eq(payments.tenantId, tenantId),
      isNull(payments.deletedAt),
    ];

    if (filters?.type) {
      conditions.push(eq(payments.type, filters.type));
    }
    if (filters?.contactId) {
      conditions.push(eq(payments.contactId, filters.contactId));
    }

    const results = await this.db
      .select({
        payment: payments,
        contact: {
          id: contacts.id,
          name: contacts.name,
          nameAr: contacts.nameAr,
        },
        invoice: {
          id: invoices.id,
          internalNumber: invoices.internalNumber,
          total: invoices.total,
        },
        account: {
          id: moneyAccounts.id,
          name: moneyAccounts.name,
          currency: moneyAccounts.currency,
        },
      })
      .from(payments)
      .leftJoin(contacts, eq(payments.contactId, contacts.id))
      .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
      .leftJoin(moneyAccounts, eq(payments.accountId, moneyAccounts.id))
      .where(and(...conditions))
      .orderBy(desc(payments.date), desc(payments.createdAt));

    return results.map(r => ({
      ...r.payment,
      contact: r.contact?.id ? r.contact : null,
      invoice: r.invoice?.id ? r.invoice : null,
      account: r.account?.id ? r.account : null,
    }));
  }

  async findById(tenantId: string, id: string): Promise<PaymentWithRelations> {
    const [result] = await this.db
      .select({
        payment: payments,
        contact: {
          id: contacts.id,
          name: contacts.name,
          nameAr: contacts.nameAr,
        },
        invoice: {
          id: invoices.id,
          internalNumber: invoices.internalNumber,
          total: invoices.total,
        },
        account: {
          id: moneyAccounts.id,
          name: moneyAccounts.name,
          currency: moneyAccounts.currency,
        },
      })
      .from(payments)
      .leftJoin(contacts, eq(payments.contactId, contacts.id))
      .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
      .leftJoin(moneyAccounts, eq(payments.accountId, moneyAccounts.id))
      .where(
        and(
          eq(payments.id, id),
          eq(payments.tenantId, tenantId),
          isNull(payments.deletedAt),
        ),
      )
      .limit(1);

    if (!result) {
      throw new NotFoundException('Payment not found');
    }

    return {
      ...result.payment,
      contact: result.contact?.id ? result.contact : null,
      invoice: result.invoice?.id ? result.invoice : null,
      account: result.account?.id ? result.account : null,
    };
  }

  async void(tenantId: string, id: string): Promise<void> {
    const payment = await this.findById(tenantId, id);

    // Reverse account movement (add back to account)
    await this.accountsService.createMovement(tenantId, {
      accountId: payment.accountId,
      type: 'in',
      amount: parseFloat(payment.amount),
      referenceType: 'payment_void',
      referenceId: payment.id,
      description: `Voided payment ${payment.paymentNumber}`,
      date: new Date().toISOString().split('T')[0],
    });

    // Reverse invoice payment if linked
    if (payment.invoiceId) {
      await this.invoicesService.updatePayment(payment.invoiceId, parseFloat(payment.amount), true);
    }

    // Reverse supplier balance
    if (payment.contactId) {
      const [contact] = await this.db
        .select()
        .from(contacts)
        .where(eq(contacts.id, payment.contactId))
        .limit(1);

      if (contact) {
        const currentBalanceUsd = parseFloat(contact.balanceUsd ?? '0');
        const currentBalanceLbp = parseFloat(contact.balanceLbp ?? '0');

        if (payment.currency === 'USD') {
          await this.db
            .update(contacts)
            .set({
              balanceUsd: (currentBalanceUsd + parseFloat(payment.amount)).toString(),
              balanceLbp: (currentBalanceLbp + parseFloat(payment.amountLbp)).toString(),
              updatedAt: new Date(),
            })
            .where(eq(contacts.id, payment.contactId));
        } else {
          await this.db
            .update(contacts)
            .set({
              balanceLbp: (currentBalanceLbp + parseFloat(payment.amount)).toString(),
              updatedAt: new Date(),
            })
            .where(eq(contacts.id, payment.contactId));
        }
      }
    }

    // Mark payment as deleted (voided)
    await this.db
      .update(payments)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(payments.id, id));
  }

  private async getNextNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const type = 'payment';
    const prefix = 'PAY';

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

    const newNumber = (seq.currentNumber ?? 0) + 1;
    await this.db
      .update(sequences)
      .set({ currentNumber: newNumber })
      .where(eq(sequences.id, seq.id));

    return `${prefix}-${year}-${String(newNumber).padStart(5, '0')}`;
  }
}
