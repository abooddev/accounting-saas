import { Injectable, Inject } from '@nestjs/common';
import { eq, and, isNull, desc, gte, lte } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';
import { moneyAccounts, invoices, payments, contacts } from '../../database/schema';

@Injectable()
export class DashboardService {
  constructor(
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
  ) {}

  async getSummary(tenantId: string) {
    // Get cash positions
    const accounts = await this.db
      .select()
      .from(moneyAccounts)
      .where(
        and(
          eq(moneyAccounts.tenantId, tenantId),
          isNull(moneyAccounts.deletedAt),
        ),
      );

    const cashUsd = accounts
      .filter(a => a.currency === 'USD')
      .reduce((sum, a) => sum + parseFloat(a.currentBalance ?? '0'), 0);

    const cashLbp = accounts
      .filter(a => a.currency === 'LBP')
      .reduce((sum, a) => sum + parseFloat(a.currentBalance ?? '0'), 0);

    // Get pending payables (unpaid purchase invoices)
    const pendingInvoices = await this.db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.tenantId, tenantId),
          eq(invoices.type, 'purchase'),
          isNull(invoices.deletedAt),
        ),
      );

    const unpaidInvoices = pendingInvoices.filter(
      i => i.status === 'pending' || i.status === 'partial'
    );

    const today = new Date().toISOString().split('T')[0];
    const overdueInvoices = unpaidInvoices.filter(
      i => i.dueDate && i.dueDate < today
    );

    const totalPayables = unpaidInvoices.reduce(
      (sum, i) => sum + parseFloat(i.balance ?? '0'),
      0
    );

    const totalOverdue = overdueInvoices.reduce(
      (sum, i) => sum + parseFloat(i.balance ?? '0'),
      0
    );

    return {
      cashPosition: {
        usd: cashUsd,
        lbp: cashLbp,
      },
      payables: {
        total: totalPayables,
        overdue: totalOverdue,
        count: unpaidInvoices.length,
        overdueCount: overdueInvoices.length,
      },
    };
  }

  async getPayables(tenantId: string) {
    // Get suppliers with balance
    const suppliers = await this.db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.tenantId, tenantId),
          isNull(contacts.deletedAt),
        ),
      );

    return suppliers
      .filter(s => {
        const balanceUsd = parseFloat(s.balanceUsd ?? '0');
        const balanceLbp = parseFloat(s.balanceLbp ?? '0');
        return balanceUsd > 0 || balanceLbp > 0;
      })
      .map(s => ({
        id: s.id,
        name: s.name,
        nameAr: s.nameAr,
        balanceUsd: parseFloat(s.balanceUsd ?? '0'),
        balanceLbp: parseFloat(s.balanceLbp ?? '0'),
      }))
      .sort((a, b) => b.balanceUsd - a.balanceUsd);
  }

  async getRecent(tenantId: string, limit = 10) {
    // Get recent invoices
    const recentInvoices = await this.db
      .select({
        id: invoices.id,
        type: invoices.type,
        internalNumber: invoices.internalNumber,
        date: invoices.date,
        total: invoices.total,
        currency: invoices.currency,
        status: invoices.status,
        contactName: contacts.name,
      })
      .from(invoices)
      .leftJoin(contacts, eq(invoices.contactId, contacts.id))
      .where(
        and(
          eq(invoices.tenantId, tenantId),
          isNull(invoices.deletedAt),
        ),
      )
      .orderBy(desc(invoices.createdAt))
      .limit(limit);

    // Get recent payments
    const recentPayments = await this.db
      .select({
        id: payments.id,
        paymentNumber: payments.paymentNumber,
        date: payments.date,
        amount: payments.amount,
        currency: payments.currency,
        contactName: contacts.name,
      })
      .from(payments)
      .leftJoin(contacts, eq(payments.contactId, contacts.id))
      .where(
        and(
          eq(payments.tenantId, tenantId),
          isNull(payments.deletedAt),
        ),
      )
      .orderBy(desc(payments.createdAt))
      .limit(limit);

    return {
      invoices: recentInvoices,
      payments: recentPayments,
    };
  }

  async getDueThisWeek(tenantId: string) {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const todayStr = today.toISOString().split('T')[0];
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    const dueInvoices = await this.db
      .select({
        id: invoices.id,
        internalNumber: invoices.internalNumber,
        dueDate: invoices.dueDate,
        balance: invoices.balance,
        currency: invoices.currency,
        contactName: contacts.name,
      })
      .from(invoices)
      .leftJoin(contacts, eq(invoices.contactId, contacts.id))
      .where(
        and(
          eq(invoices.tenantId, tenantId),
          isNull(invoices.deletedAt),
          gte(invoices.dueDate, todayStr),
          lte(invoices.dueDate, nextWeekStr),
        ),
      )
      .orderBy(invoices.dueDate);

    return dueInvoices.filter(
      i => i.balance && parseFloat(i.balance) > 0
    );
  }
}
