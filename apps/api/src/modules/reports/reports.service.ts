import { Injectable, Inject } from '@nestjs/common';
import { sql, eq, and, between, isNull, inArray, gte, lte, desc, asc } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';
import { invoices, payments, contacts, products, categories, moneyAccounts, accountMovements } from '../../database/schema';
import { EXPENSE_CATEGORIES } from '@accounting/shared';

@Injectable()
export class ReportsService {
  constructor(
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
  ) {}

  async getProfitLoss(tenantId: string, startDate: string, endDate: string) {
    // Get purchases total
    const purchasesResult = await this.db
      .select({
        total: sql<string>`COALESCE(SUM(${invoices.total}::numeric), 0)`,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.tenantId, tenantId),
          eq(invoices.type, 'purchase'),
          inArray(invoices.status, ['pending', 'partial', 'paid']),
          gte(invoices.date, startDate),
          lte(invoices.date, endDate),
          isNull(invoices.deletedAt),
        ),
      );

    // Get expenses by category
    const expensesResult = await this.db
      .select({
        category: invoices.expenseCategory,
        amount: sql<string>`COALESCE(SUM(${invoices.total}::numeric), 0)`,
        amountLbp: sql<string>`COALESCE(SUM(${invoices.totalLbp}::numeric), 0)`,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.tenantId, tenantId),
          eq(invoices.type, 'expense'),
          inArray(invoices.status, ['pending', 'partial', 'paid']),
          gte(invoices.date, startDate),
          lte(invoices.date, endDate),
          isNull(invoices.deletedAt),
        ),
      )
      .groupBy(invoices.expenseCategory);

    const purchases = parseFloat(purchasesResult[0]?.total || '0');

    const expensesByCategory = expensesResult.map(e => {
      const categoryInfo = EXPENSE_CATEGORIES.find(c => c.value === e.category);
      return {
        category: e.category || 'other',
        categoryLabel: categoryInfo?.label || 'Other',
        categoryLabelAr: categoryInfo?.labelAr || 'أخرى',
        amount: parseFloat(e.amount),
        amountLbp: parseFloat(e.amountLbp),
        invoiceCount: e.count,
      };
    });

    const totalExpenses = expensesByCategory.reduce((sum, e) => sum + e.amount, 0);

    return {
      period: { startDate, endDate },
      revenue: {
        sales: 0, // Future - when POS added
        otherIncome: 0,
        total: 0,
      },
      costOfGoodsSold: {
        purchases,
        total: purchases,
      },
      grossProfit: -purchases,
      expenses: {
        byCategory: expensesByCategory,
        total: totalExpenses,
      },
      netProfit: -(purchases + totalExpenses),
      currency: 'USD',
    };
  }

  async getSupplierBalances(tenantId: string) {
    const suppliers = await this.db
      .select({
        id: contacts.id,
        name: contacts.name,
        nameAr: contacts.nameAr,
        balanceUsd: contacts.balanceUsd,
        balanceLbp: contacts.balanceLbp,
      })
      .from(contacts)
      .where(
        and(
          eq(contacts.tenantId, tenantId),
          inArray(contacts.type, ['supplier', 'both']),
          isNull(contacts.deletedAt),
        ),
      )
      .orderBy(desc(contacts.balanceUsd));

    // Get totals from invoices and payments for each supplier
    const suppliersWithTotals = await Promise.all(
      suppliers.map(async (supplier) => {
        const [purchasesResult] = await this.db
          .select({
            total: sql<string>`COALESCE(SUM(${invoices.total}::numeric), 0)`,
            lastDate: sql<string>`MAX(${invoices.date})`,
          })
          .from(invoices)
          .where(
            and(
              eq(invoices.tenantId, tenantId),
              eq(invoices.contactId, supplier.id),
              eq(invoices.type, 'purchase'),
              inArray(invoices.status, ['pending', 'partial', 'paid']),
              isNull(invoices.deletedAt),
            ),
          );

        const [paymentsResult] = await this.db
          .select({
            total: sql<string>`COALESCE(SUM(${payments.amount}::numeric), 0)`,
            lastDate: sql<string>`MAX(${payments.date})`,
          })
          .from(payments)
          .where(
            and(
              eq(payments.tenantId, tenantId),
              eq(payments.contactId, supplier.id),
              isNull(payments.deletedAt),
            ),
          );

        return {
          id: supplier.id,
          name: supplier.name,
          nameAr: supplier.nameAr,
          totalPurchases: parseFloat(purchasesResult?.total || '0'),
          totalPaid: parseFloat(paymentsResult?.total || '0'),
          balanceUsd: parseFloat(supplier.balanceUsd || '0'),
          balanceLbp: parseFloat(supplier.balanceLbp || '0'),
          lastPurchaseDate: purchasesResult?.lastDate || null,
          lastPaymentDate: paymentsResult?.lastDate || null,
        };
      }),
    );

    const totals = suppliersWithTotals.reduce(
      (acc, s) => ({
        totalPurchases: acc.totalPurchases + s.totalPurchases,
        totalPaid: acc.totalPaid + s.totalPaid,
        totalBalance: acc.totalBalance + s.balanceUsd,
      }),
      { totalPurchases: 0, totalPaid: 0, totalBalance: 0 },
    );

    return {
      suppliers: suppliersWithTotals.filter(s => s.totalPurchases > 0 || s.balanceUsd > 0 || s.balanceLbp > 0),
      totals,
    };
  }

  async getSupplierStatement(tenantId: string, contactId: string, startDate: string, endDate: string) {
    // Get supplier info
    const [supplier] = await this.db
      .select({
        id: contacts.id,
        name: contacts.name,
        nameAr: contacts.nameAr,
      })
      .from(contacts)
      .where(eq(contacts.id, contactId))
      .limit(1);

    if (!supplier) {
      return null;
    }

    // Get invoices
    const invoicesList = await this.db
      .select({
        date: invoices.date,
        reference: invoices.internalNumber,
        description: sql<string>`CONCAT('Invoice ', ${invoices.internalNumber})`,
        amount: invoices.total,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.tenantId, tenantId),
          eq(invoices.contactId, contactId),
          eq(invoices.type, 'purchase'),
          inArray(invoices.status, ['pending', 'partial', 'paid']),
          gte(invoices.date, startDate),
          lte(invoices.date, endDate),
          isNull(invoices.deletedAt),
        ),
      );

    // Get payments
    const paymentsList = await this.db
      .select({
        date: payments.date,
        reference: payments.paymentNumber,
        description: sql<string>`CONCAT('Payment - ', ${payments.paymentMethod})`,
        amount: payments.amount,
      })
      .from(payments)
      .where(
        and(
          eq(payments.tenantId, tenantId),
          eq(payments.contactId, contactId),
          gte(payments.date, startDate),
          lte(payments.date, endDate),
          isNull(payments.deletedAt),
        ),
      );

    // Combine and sort transactions
    const transactions: Array<{
      date: string;
      reference: string;
      type: 'invoice' | 'payment';
      description: string;
      debit: number;
      credit: number;
      balance: number;
    }> = [];

    invoicesList.forEach(inv => {
      transactions.push({
        date: inv.date,
        reference: inv.reference,
        type: 'invoice',
        description: inv.description,
        debit: parseFloat(inv.amount || '0'),
        credit: 0,
        balance: 0,
      });
    });

    paymentsList.forEach(pmt => {
      transactions.push({
        date: pmt.date,
        reference: pmt.reference,
        type: 'payment',
        description: pmt.description,
        debit: 0,
        credit: parseFloat(pmt.amount || '0'),
        balance: 0,
      });
    });

    // Sort by date
    transactions.sort((a, b) => a.date.localeCompare(b.date));

    // Calculate running balance
    // For opening balance, we need to calculate from all previous transactions
    const [prevBalance] = await this.db
      .select({
        invoiceTotal: sql<string>`COALESCE((
          SELECT SUM(total::numeric) FROM invoices
          WHERE tenant_id = ${tenantId}
          AND contact_id = ${contactId}
          AND type = 'purchase'
          AND status IN ('pending', 'partial', 'paid')
          AND date < ${startDate}
          AND deleted_at IS NULL
        ), 0)`,
        paymentTotal: sql<string>`COALESCE((
          SELECT SUM(amount::numeric) FROM payments
          WHERE tenant_id = ${tenantId}
          AND contact_id = ${contactId}
          AND date < ${startDate}
          AND deleted_at IS NULL
        ), 0)`,
      })
      .from(sql`(SELECT 1) as dummy`);

    const openingBalance = parseFloat(prevBalance?.invoiceTotal || '0') - parseFloat(prevBalance?.paymentTotal || '0');

    let runningBalance = openingBalance;
    transactions.forEach(t => {
      runningBalance = runningBalance + t.debit - t.credit;
      t.balance = runningBalance;
    });

    return {
      supplier,
      period: { startDate, endDate },
      openingBalance,
      transactions,
      closingBalance: runningBalance,
      currency: 'USD',
    };
  }

  async getExpensesByCategory(tenantId: string, startDate: string, endDate: string) {
    const result = await this.db
      .select({
        category: invoices.expenseCategory,
        amount: sql<string>`COALESCE(SUM(${invoices.total}::numeric), 0)`,
        amountLbp: sql<string>`COALESCE(SUM(${invoices.totalLbp}::numeric), 0)`,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.tenantId, tenantId),
          eq(invoices.type, 'expense'),
          inArray(invoices.status, ['pending', 'partial', 'paid']),
          gte(invoices.date, startDate),
          lte(invoices.date, endDate),
          isNull(invoices.deletedAt),
        ),
      )
      .groupBy(invoices.expenseCategory)
      .orderBy(desc(sql`SUM(${invoices.total}::numeric)`));

    const totalAmount = result.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const totalAmountLbp = result.reduce((sum, r) => sum + parseFloat(r.amountLbp), 0);
    const totalCount = result.reduce((sum, r) => sum + r.count, 0);

    const categories = result.map(r => {
      const categoryInfo = EXPENSE_CATEGORIES.find(c => c.value === r.category);
      const amount = parseFloat(r.amount);
      return {
        category: r.category || 'other',
        categoryLabel: categoryInfo?.label || 'Other',
        categoryLabelAr: categoryInfo?.labelAr || 'أخرى',
        amount,
        amountLbp: parseFloat(r.amountLbp),
        percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
        invoiceCount: r.count,
      };
    });

    return {
      period: { startDate, endDate },
      categories,
      totals: {
        amount: totalAmount,
        amountLbp: totalAmountLbp,
        invoiceCount: totalCount,
      },
    };
  }

  async getPaymentsDue(tenantId: string) {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const weekFromNow = new Date();
    weekFromNow.setDate(today.getDate() + 7);
    const weekFromNowStr = weekFromNow.toISOString().split('T')[0];

    const monthFromNow = new Date();
    monthFromNow.setDate(today.getDate() + 30);
    const monthFromNowStr = monthFromNow.toISOString().split('T')[0];

    const dueInvoices = await this.db
      .select({
        id: invoices.id,
        internalNumber: invoices.internalNumber,
        date: invoices.date,
        dueDate: invoices.dueDate,
        total: invoices.total,
        balance: invoices.balance,
        currency: invoices.currency,
        supplierId: contacts.id,
        supplierName: contacts.name,
        supplierNameAr: contacts.nameAr,
      })
      .from(invoices)
      .leftJoin(contacts, eq(invoices.contactId, contacts.id))
      .where(
        and(
          eq(invoices.tenantId, tenantId),
          eq(invoices.type, 'purchase'),
          inArray(invoices.status, ['pending', 'partial']),
          sql`${invoices.balance}::numeric > 0`,
          isNull(invoices.deletedAt),
        ),
      )
      .orderBy(asc(invoices.dueDate));

    const overdue: any[] = [];
    const dueThisWeek: any[] = [];
    const upcoming: any[] = [];

    dueInvoices.forEach(inv => {
      const dueDate = inv.dueDate || inv.date;
      const daysOverdue = Math.floor((today.getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24));

      const invoiceDue = {
        id: inv.id,
        internalNumber: inv.internalNumber,
        supplier: {
          id: inv.supplierId,
          name: inv.supplierName,
          nameAr: inv.supplierNameAr,
        },
        date: inv.date,
        dueDate,
        total: parseFloat(inv.total || '0'),
        balance: parseFloat(inv.balance || '0'),
        daysOverdue,
        currency: inv.currency,
      };

      if (dueDate < todayStr) {
        overdue.push(invoiceDue);
      } else if (dueDate <= weekFromNowStr) {
        dueThisWeek.push(invoiceDue);
      } else if (dueDate <= monthFromNowStr) {
        upcoming.push(invoiceDue);
      }
    });

    return {
      overdue,
      dueThisWeek,
      upcoming,
      totals: {
        overdueAmount: overdue.reduce((sum, i) => sum + i.balance, 0),
        dueThisWeekAmount: dueThisWeek.reduce((sum, i) => sum + i.balance, 0),
        upcomingAmount: upcoming.reduce((sum, i) => sum + i.balance, 0),
        totalDue: dueInvoices.reduce((sum, i) => sum + parseFloat(i.balance || '0'), 0),
      },
    };
  }

  async getCashFlow(tenantId: string, startDate: string, endDate: string) {
    // Get opening balances (sum of all accounts at start date)
    const accounts = await this.db
      .select()
      .from(moneyAccounts)
      .where(
        and(
          eq(moneyAccounts.tenantId, tenantId),
          isNull(moneyAccounts.deletedAt),
        ),
      );

    // Get movements for the period
    const movementsIn = await this.db
      .select({
        accountId: accountMovements.accountId,
        total: sql<string>`COALESCE(SUM(${accountMovements.amount}::numeric), 0)`,
      })
      .from(accountMovements)
      .where(
        and(
          eq(accountMovements.tenantId, tenantId),
          gte(accountMovements.date, startDate),
          lte(accountMovements.date, endDate),
          sql`${accountMovements.amount}::numeric > 0`,
        ),
      )
      .groupBy(accountMovements.accountId);

    const movementsOut = await this.db
      .select({
        accountId: accountMovements.accountId,
        total: sql<string>`COALESCE(SUM(ABS(${accountMovements.amount}::numeric)), 0)`,
      })
      .from(accountMovements)
      .where(
        and(
          eq(accountMovements.tenantId, tenantId),
          gte(accountMovements.date, startDate),
          lte(accountMovements.date, endDate),
          sql`${accountMovements.amount}::numeric < 0`,
        ),
      )
      .groupBy(accountMovements.accountId);

    // Get payment totals by type
    const [supplierPayments] = await this.db
      .select({
        total: sql<string>`COALESCE(SUM(${payments.amount}::numeric), 0)`,
      })
      .from(payments)
      .where(
        and(
          eq(payments.tenantId, tenantId),
          eq(payments.type, 'supplier_payment'),
          gte(payments.date, startDate),
          lte(payments.date, endDate),
          isNull(payments.deletedAt),
        ),
      );

    const [expensePayments] = await this.db
      .select({
        total: sql<string>`COALESCE(SUM(${payments.amount}::numeric), 0)`,
      })
      .from(payments)
      .where(
        and(
          eq(payments.tenantId, tenantId),
          eq(payments.type, 'expense_payment'),
          gte(payments.date, startDate),
          lte(payments.date, endDate),
          isNull(payments.deletedAt),
        ),
      );

    const supplierPaymentsTotal = parseFloat(supplierPayments?.total || '0');
    const expensePaymentsTotal = parseFloat(expensePayments?.total || '0');

    // Calculate balances
    let openingUsd = 0;
    let openingLbp = 0;
    let closingUsd = 0;
    let closingLbp = 0;

    const byAccount = accounts.map(acc => {
      const currentBalance = parseFloat(acc.currentBalance || '0');
      const inMovement = movementsIn.find(m => m.accountId === acc.id);
      const outMovement = movementsOut.find(m => m.accountId === acc.id);
      const totalIn = parseFloat(inMovement?.total || '0');
      const totalOut = parseFloat(outMovement?.total || '0');

      // Opening = Current - In + Out (reverse the movements)
      const opening = currentBalance - totalIn + totalOut;

      if (acc.currency === 'USD') {
        openingUsd += opening;
        closingUsd += currentBalance;
      } else {
        openingLbp += opening;
        closingLbp += currentBalance;
      }

      return {
        accountId: acc.id,
        accountName: acc.name,
        currency: acc.currency,
        opening,
        totalIn,
        totalOut,
        closing: currentBalance,
      };
    });

    const totalOut = supplierPaymentsTotal + expensePaymentsTotal;

    return {
      period: { startDate, endDate },
      openingBalances: {
        usd: openingUsd,
        lbp: openingLbp,
      },
      moneyIn: {
        customerPayments: 0, // Future
        otherIncome: 0,
        total: 0,
      },
      moneyOut: {
        supplierPayments: supplierPaymentsTotal,
        expensePayments: expensePaymentsTotal,
        total: totalOut,
      },
      netCashFlow: -totalOut,
      closingBalances: {
        usd: closingUsd,
        lbp: closingLbp,
      },
      byAccount,
    };
  }

  async getInventoryValue(tenantId: string) {
    // Get inventory by category
    const byCategory = await this.db
      .select({
        categoryId: categories.id,
        categoryName: categories.name,
        productCount: sql<number>`COUNT(${products.id})::int`,
        totalQuantity: sql<string>`COALESCE(SUM(${products.currentStock}::numeric), 0)`,
        stockValue: sql<string>`COALESCE(SUM(${products.currentStock}::numeric * ${products.costPrice}::numeric), 0)`,
      })
      .from(categories)
      .leftJoin(
        products,
        and(
          eq(products.categoryId, categories.id),
          eq(products.trackStock, true),
          isNull(products.deletedAt),
        ),
      )
      .where(
        and(
          eq(categories.tenantId, tenantId),
          isNull(categories.deletedAt),
        ),
      )
      .groupBy(categories.id, categories.name)
      .orderBy(desc(sql`SUM(${products.currentStock}::numeric * ${products.costPrice}::numeric)`));

    // Calculate totals
    const totalStockValue = byCategory.reduce((sum, c) => sum + parseFloat(c.stockValue), 0);
    const totalProductCount = byCategory.reduce((sum, c) => sum + c.productCount, 0);
    const totalQuantity = byCategory.reduce((sum, c) => sum + parseFloat(c.totalQuantity), 0);

    const categoriesWithPercentage = byCategory.map(c => ({
      categoryId: c.categoryId,
      categoryName: c.categoryName,
      productCount: c.productCount,
      totalQuantity: parseFloat(c.totalQuantity),
      stockValue: parseFloat(c.stockValue),
      percentage: totalStockValue > 0 ? (parseFloat(c.stockValue) / totalStockValue) * 100 : 0,
    }));

    // Get low stock items
    const lowStock = await this.db
      .select({
        productId: products.id,
        productName: products.name,
        productNameAr: products.nameAr,
        currentStock: products.currentStock,
        minStockLevel: products.minStockLevel,
      })
      .from(products)
      .where(
        and(
          eq(products.tenantId, tenantId),
          eq(products.trackStock, true),
          sql`${products.currentStock}::numeric < ${products.minStockLevel}::numeric`,
          isNull(products.deletedAt),
        ),
      )
      .orderBy(asc(sql`${products.currentStock}::numeric - ${products.minStockLevel}::numeric`));

    const lowStockWithStatus = lowStock.map(p => {
      const current = parseFloat(p.currentStock || '0');
      const min = parseFloat(p.minStockLevel || '0');
      const ratio = min > 0 ? current / min : 1;

      return {
        productId: p.productId,
        productName: p.productName,
        productNameAr: p.productNameAr,
        currentStock: current,
        minStockLevel: min,
        status: ratio < 0.25 ? 'critical' : ratio < 0.5 ? 'low' : 'ok',
      };
    });

    return {
      byCategory: categoriesWithPercentage.filter(c => c.productCount > 0),
      totals: {
        productCount: totalProductCount,
        totalQuantity,
        stockValue: totalStockValue,
      },
      lowStock: lowStockWithStatus,
    };
  }

  async getSupplierHistory(tenantId: string, contactId: string, months: number = 12) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    // Get supplier info
    const [supplier] = await this.db
      .select({
        id: contacts.id,
        name: contacts.name,
        nameAr: contacts.nameAr,
      })
      .from(contacts)
      .where(eq(contacts.id, contactId))
      .limit(1);

    if (!supplier) {
      return null;
    }

    // Get monthly purchases
    const monthlyData = await this.db
      .select({
        month: sql<string>`TO_CHAR(${invoices.date}::date, 'YYYY-MM')`,
        invoiceCount: sql<number>`COUNT(*)::int`,
        totalAmount: sql<string>`COALESCE(SUM(${invoices.total}::numeric), 0)`,
        paidAmount: sql<string>`COALESCE(SUM(${invoices.amountPaid}::numeric), 0)`,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.tenantId, tenantId),
          eq(invoices.contactId, contactId),
          eq(invoices.type, 'purchase'),
          inArray(invoices.status, ['pending', 'partial', 'paid']),
          gte(invoices.date, startDate.toISOString().split('T')[0]),
          lte(invoices.date, endDate.toISOString().split('T')[0]),
          isNull(invoices.deletedAt),
        ),
      )
      .groupBy(sql`TO_CHAR(${invoices.date}::date, 'YYYY-MM')`)
      .orderBy(desc(sql`TO_CHAR(${invoices.date}::date, 'YYYY-MM')`));

    // Get top products purchased from this supplier
    const topProducts = await this.db
      .select({
        productId: products.id,
        productName: products.name,
        productNameAr: products.nameAr,
        quantity: sql<string>`COALESCE(SUM(ii.quantity::numeric), 0)`,
        totalValue: sql<string>`COALESCE(SUM(ii.line_total::numeric), 0)`,
      })
      .from(sql`invoice_items ii`)
      .innerJoin(invoices, sql`ii.invoice_id = ${invoices.id}`)
      .innerJoin(products, sql`ii.product_id = ${products.id}`)
      .where(
        and(
          eq(invoices.tenantId, tenantId),
          eq(invoices.contactId, contactId),
          eq(invoices.type, 'purchase'),
          inArray(invoices.status, ['pending', 'partial', 'paid']),
          isNull(invoices.deletedAt),
        ),
      )
      .groupBy(products.id, products.name, products.nameAr)
      .orderBy(desc(sql`SUM(ii.line_total::numeric)`))
      .limit(10);

    const monthlyPurchases = monthlyData.map(m => ({
      month: m.month,
      invoiceCount: m.invoiceCount,
      totalAmount: parseFloat(m.totalAmount),
      paidAmount: parseFloat(m.paidAmount),
      balance: parseFloat(m.totalAmount) - parseFloat(m.paidAmount),
    }));

    const totals = monthlyPurchases.reduce(
      (acc, m) => ({
        invoiceCount: acc.invoiceCount + m.invoiceCount,
        totalAmount: acc.totalAmount + m.totalAmount,
        paidAmount: acc.paidAmount + m.paidAmount,
        balance: acc.balance + m.balance,
      }),
      { invoiceCount: 0, totalAmount: 0, paidAmount: 0, balance: 0 },
    );

    return {
      supplier,
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        months,
      },
      monthlyPurchases,
      totals,
      topProducts: topProducts.map(p => ({
        productId: p.productId,
        productName: p.productName,
        productNameAr: p.productNameAr,
        quantity: parseFloat(p.quantity),
        totalValue: parseFloat(p.totalValue),
        avgPrice: parseFloat(p.quantity) > 0 ? parseFloat(p.totalValue) / parseFloat(p.quantity) : 0,
      })),
    };
  }
}
