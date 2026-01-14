import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';
import { moneyAccounts, MoneyAccount, NewMoneyAccount, accountMovements, AccountMovement, NewAccountMovement } from '../../database/schema';
import { ExchangeRatesService } from '../exchange-rates/exchange-rates.service';

@Injectable()
export class AccountsService {
  constructor(
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
    private exchangeRatesService: ExchangeRatesService,
  ) {}

  async create(tenantId: string, data: {
    name: string;
    nameAr?: string;
    type: string;
    currency: string;
    isDefault?: boolean;
    openingBalance?: number;
  }): Promise<MoneyAccount> {
    const newAccount: NewMoneyAccount = {
      tenantId,
      name: data.name,
      nameAr: data.nameAr,
      type: data.type,
      currency: data.currency,
      currentBalance: '0',
      isDefault: data.isDefault ?? false,
    };

    const [account] = await this.db.insert(moneyAccounts).values(newAccount).returning();

    // Create opening balance movement if provided
    if (data.openingBalance && data.openingBalance > 0) {
      await this.createMovement(tenantId, {
        accountId: account.id,
        type: 'in',
        amount: data.openingBalance,
        referenceType: 'opening',
        description: 'Opening Balance',
        date: new Date().toISOString().split('T')[0],
      });
    }

    return this.findById(tenantId, account.id);
  }

  async findAll(tenantId: string): Promise<MoneyAccount[]> {
    return this.db
      .select()
      .from(moneyAccounts)
      .where(
        and(
          eq(moneyAccounts.tenantId, tenantId),
          isNull(moneyAccounts.deletedAt),
        ),
      )
      .orderBy(moneyAccounts.currency, moneyAccounts.name);
  }

  async findById(tenantId: string, id: string): Promise<MoneyAccount> {
    const [account] = await this.db
      .select()
      .from(moneyAccounts)
      .where(
        and(
          eq(moneyAccounts.id, id),
          eq(moneyAccounts.tenantId, tenantId),
          isNull(moneyAccounts.deletedAt),
        ),
      )
      .limit(1);

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  async findDefaultByCurrency(tenantId: string, currency: string): Promise<MoneyAccount | null> {
    const [account] = await this.db
      .select()
      .from(moneyAccounts)
      .where(
        and(
          eq(moneyAccounts.tenantId, tenantId),
          eq(moneyAccounts.currency, currency),
          eq(moneyAccounts.isDefault, true),
          isNull(moneyAccounts.deletedAt),
        ),
      )
      .limit(1);

    return account ?? null;
  }

  async update(tenantId: string, id: string, data: {
    name?: string;
    nameAr?: string;
    isDefault?: boolean;
    isActive?: boolean;
  }): Promise<MoneyAccount> {
    await this.findById(tenantId, id);

    const updateData: Partial<NewMoneyAccount> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.nameAr !== undefined) updateData.nameAr = data.nameAr;
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    await this.db
      .update(moneyAccounts)
      .set(updateData)
      .where(and(eq(moneyAccounts.id, id), eq(moneyAccounts.tenantId, tenantId)));

    return this.findById(tenantId, id);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    const account = await this.findById(tenantId, id);

    if (parseFloat(account.currentBalance ?? '0') !== 0) {
      throw new BadRequestException('Cannot delete account with non-zero balance');
    }

    await this.db
      .update(moneyAccounts)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(moneyAccounts.id, id), eq(moneyAccounts.tenantId, tenantId)));
  }

  async getMovements(tenantId: string, accountId: string, limit = 50): Promise<AccountMovement[]> {
    await this.findById(tenantId, accountId);

    return this.db
      .select()
      .from(accountMovements)
      .where(
        and(
          eq(accountMovements.tenantId, tenantId),
          eq(accountMovements.accountId, accountId),
        ),
      )
      .orderBy(desc(accountMovements.createdAt))
      .limit(limit);
  }

  async createMovement(tenantId: string, data: {
    accountId: string;
    type: 'in' | 'out' | 'transfer_in' | 'transfer_out';
    amount: number;
    referenceType?: string;
    referenceId?: string;
    description?: string;
    date: string;
  }): Promise<AccountMovement> {
    const account = await this.findById(tenantId, data.accountId);
    const currentBalance = parseFloat(account.currentBalance ?? '0');

    let newBalance: number;
    if (data.type === 'in' || data.type === 'transfer_in') {
      newBalance = currentBalance + data.amount;
    } else {
      if (currentBalance < data.amount) {
        throw new BadRequestException('Insufficient balance');
      }
      newBalance = currentBalance - data.amount;
    }

    // Update account balance
    await this.db
      .update(moneyAccounts)
      .set({
        currentBalance: newBalance.toString(),
        updatedAt: new Date(),
      })
      .where(eq(moneyAccounts.id, data.accountId));

    // Create movement record
    const movement: NewAccountMovement = {
      tenantId,
      accountId: data.accountId,
      type: data.type,
      amount: data.amount.toString(),
      balanceAfter: newBalance.toString(),
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      description: data.description,
      date: data.date,
    };

    const [created] = await this.db.insert(accountMovements).values(movement).returning();
    return created;
  }

  async transfer(tenantId: string, data: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    exchangeRate?: number;
    date: string;
    notes?: string;
  }): Promise<{ fromMovement: AccountMovement; toMovement: AccountMovement }> {
    const fromAccount = await this.findById(tenantId, data.fromAccountId);
    const toAccount = await this.findById(tenantId, data.toAccountId);

    // Create out movement from source account
    const fromMovement = await this.createMovement(tenantId, {
      accountId: data.fromAccountId,
      type: 'transfer_out',
      amount: data.amount,
      referenceType: 'transfer',
      description: data.notes ?? `Transfer to ${toAccount.name}`,
      date: data.date,
    });

    // Calculate amount for destination (handle currency conversion)
    let toAmount = data.amount;
    if (fromAccount.currency !== toAccount.currency && data.exchangeRate) {
      if (fromAccount.currency === 'USD' && toAccount.currency === 'LBP') {
        toAmount = data.amount * data.exchangeRate;
      } else if (fromAccount.currency === 'LBP' && toAccount.currency === 'USD') {
        toAmount = data.amount / data.exchangeRate;
      }
    }

    // Create in movement to destination account
    const toMovement = await this.createMovement(tenantId, {
      accountId: data.toAccountId,
      type: 'transfer_in',
      amount: toAmount,
      referenceType: 'transfer',
      referenceId: fromMovement.id,
      description: data.notes ?? `Transfer from ${fromAccount.name}`,
      date: data.date,
    });

    return { fromMovement, toMovement };
  }

  async adjust(tenantId: string, accountId: string, data: {
    amount: number;
    type: 'in' | 'out';
    description: string;
    date: string;
  }): Promise<AccountMovement> {
    return this.createMovement(tenantId, {
      accountId,
      type: data.type,
      amount: data.amount,
      referenceType: 'adjustment',
      description: data.description,
      date: data.date,
    });
  }

  async createDefaultAccounts(tenantId: string): Promise<void> {
    const defaultAccounts = [
      { name: 'Cash (USD)', nameAr: 'صندوق (دولار)', type: 'cash', currency: 'USD', isDefault: true },
      { name: 'Cash (LBP)', nameAr: 'صندوق (ليرة)', type: 'cash', currency: 'LBP', isDefault: true },
    ];

    for (const account of defaultAccounts) {
      await this.create(tenantId, account);
    }
  }
}
