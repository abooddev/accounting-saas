import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, isNull, desc, gte, lte, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';
import {
  purchaseOrders, PurchaseOrder, NewPurchaseOrder,
  purchaseOrderItems, PurchaseOrderItem, NewPurchaseOrderItem,
  contacts, products, sequences, invoices, invoiceItems,
} from '../../database/schema';

export interface PurchaseOrderWithItems extends PurchaseOrder {
  items: PurchaseOrderItem[];
  supplier?: { id: string; name: string; nameAr: string | null } | null;
}

export interface PurchaseOrderFilters {
  status?: string;
  supplierId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ReceiveGoodsItem {
  itemId: string;
  quantityReceived: number;
}

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
  ) {}

  async create(tenantId: string, userId: string, data: {
    supplierId?: string;
    date: string;
    expectedDeliveryDate?: string;
    status?: string;
    currency: string;
    exchangeRate: number;
    taxAmount?: number;
    notes?: string;
    items: {
      productId?: string;
      description: string;
      quantityOrdered: number;
      unitPrice: number;
    }[];
  }): Promise<PurchaseOrderWithItems> {
    // Calculate totals
    let subtotal = 0;
    const itemsWithTotals = data.items.map((item, index) => {
      const lineTotal = item.quantityOrdered * item.unitPrice;
      subtotal += lineTotal;
      return { ...item, lineTotal, sortOrder: index };
    });

    const taxAmount = data.taxAmount ?? 0;
    const total = subtotal + taxAmount;

    // Generate PO number
    const number = await this.getNextNumber(tenantId);

    // Create purchase order
    const poData: NewPurchaseOrder = {
      tenantId,
      number,
      supplierId: data.supplierId,
      date: data.date,
      expectedDeliveryDate: data.expectedDeliveryDate,
      status: (data.status ?? 'draft') as 'draft' | 'sent' | 'partial' | 'received' | 'cancelled',
      currency: data.currency,
      exchangeRate: data.exchangeRate.toString(),
      subtotal: subtotal.toString(),
      taxAmount: taxAmount.toString(),
      total: total.toString(),
      notes: data.notes,
      createdBy: userId,
    };

    const [purchaseOrder] = await this.db.insert(purchaseOrders).values(poData).returning();

    // Create purchase order items
    const itemsData: NewPurchaseOrderItem[] = itemsWithTotals.map(item => ({
      purchaseOrderId: purchaseOrder.id,
      productId: item.productId,
      description: item.description,
      quantityOrdered: item.quantityOrdered.toString(),
      quantityReceived: '0',
      unitPrice: item.unitPrice.toString(),
      lineTotal: item.lineTotal.toString(),
      sortOrder: item.sortOrder.toString(),
    }));

    await this.db.insert(purchaseOrderItems).values(itemsData);

    return this.findById(tenantId, purchaseOrder.id);
  }

  async findAll(tenantId: string, filters?: PurchaseOrderFilters): Promise<PurchaseOrderWithItems[]> {
    const conditions = [
      eq(purchaseOrders.tenantId, tenantId),
      isNull(purchaseOrders.deletedAt),
    ];

    if (filters?.status) {
      conditions.push(eq(purchaseOrders.status, filters.status as 'draft' | 'sent' | 'partial' | 'received' | 'cancelled'));
    }
    if (filters?.supplierId) {
      conditions.push(eq(purchaseOrders.supplierId, filters.supplierId));
    }
    if (filters?.dateFrom) {
      conditions.push(gte(purchaseOrders.date, filters.dateFrom));
    }
    if (filters?.dateTo) {
      conditions.push(lte(purchaseOrders.date, filters.dateTo));
    }

    const results = await this.db
      .select({
        purchaseOrder: purchaseOrders,
        supplier: {
          id: contacts.id,
          name: contacts.name,
          nameAr: contacts.nameAr,
        },
      })
      .from(purchaseOrders)
      .leftJoin(contacts, eq(purchaseOrders.supplierId, contacts.id))
      .where(and(...conditions))
      .orderBy(desc(purchaseOrders.date), desc(purchaseOrders.createdAt));

    // Get items for each purchase order
    const poIds = results.map(r => r.purchaseOrder.id);
    const allItems = poIds.length > 0
      ? await this.db
          .select()
          .from(purchaseOrderItems)
          .where(sql`${purchaseOrderItems.purchaseOrderId} IN ${poIds}`)
      : [];

    return results.map(r => ({
      ...r.purchaseOrder,
      supplier: r.supplier?.id ? r.supplier : null,
      items: allItems.filter(item => item.purchaseOrderId === r.purchaseOrder.id),
    }));
  }

  async findById(tenantId: string, id: string): Promise<PurchaseOrderWithItems> {
    const [result] = await this.db
      .select({
        purchaseOrder: purchaseOrders,
        supplier: {
          id: contacts.id,
          name: contacts.name,
          nameAr: contacts.nameAr,
        },
      })
      .from(purchaseOrders)
      .leftJoin(contacts, eq(purchaseOrders.supplierId, contacts.id))
      .where(
        and(
          eq(purchaseOrders.id, id),
          eq(purchaseOrders.tenantId, tenantId),
          isNull(purchaseOrders.deletedAt),
        ),
      )
      .limit(1);

    if (!result) {
      throw new NotFoundException('Purchase order not found');
    }

    const items = await this.db
      .select()
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.purchaseOrderId, id))
      .orderBy(purchaseOrderItems.sortOrder);

    return {
      ...result.purchaseOrder,
      supplier: result.supplier?.id ? result.supplier : null,
      items,
    };
  }

  async update(tenantId: string, id: string, data: {
    supplierId?: string;
    date?: string;
    expectedDeliveryDate?: string;
    currency?: string;
    exchangeRate?: number;
    taxAmount?: number;
    notes?: string;
    items?: {
      productId?: string;
      description: string;
      quantityOrdered: number;
      unitPrice: number;
    }[];
  }): Promise<PurchaseOrderWithItems> {
    const existing = await this.findById(tenantId, id);

    if (existing.status !== 'draft') {
      throw new BadRequestException('Only draft purchase orders can be edited');
    }

    // If items are provided, recalculate totals
    if (data.items) {
      let subtotal = 0;
      const itemsWithTotals = data.items.map((item, index) => {
        const lineTotal = item.quantityOrdered * item.unitPrice;
        subtotal += lineTotal;
        return { ...item, lineTotal, sortOrder: index };
      });

      const taxAmount = data.taxAmount ?? parseFloat(existing.taxAmount ?? '0');
      const total = subtotal + taxAmount;

      // Delete existing items
      await this.db.delete(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, id));

      // Insert new items
      const itemsData: NewPurchaseOrderItem[] = itemsWithTotals.map(item => ({
        purchaseOrderId: id,
        productId: item.productId,
        description: item.description,
        quantityOrdered: item.quantityOrdered.toString(),
        quantityReceived: '0',
        unitPrice: item.unitPrice.toString(),
        lineTotal: item.lineTotal.toString(),
        sortOrder: item.sortOrder.toString(),
      }));

      await this.db.insert(purchaseOrderItems).values(itemsData);

      // Update purchase order with new totals
      await this.db
        .update(purchaseOrders)
        .set({
          supplierId: data.supplierId ?? existing.supplierId,
          date: data.date ?? existing.date,
          expectedDeliveryDate: data.expectedDeliveryDate ?? existing.expectedDeliveryDate,
          currency: data.currency ?? existing.currency,
          exchangeRate: (data.exchangeRate ?? parseFloat(existing.exchangeRate)).toString(),
          subtotal: subtotal.toString(),
          taxAmount: taxAmount.toString(),
          total: total.toString(),
          notes: data.notes ?? existing.notes,
          updatedAt: new Date(),
        })
        .where(eq(purchaseOrders.id, id));
    } else {
      // Just update non-item fields
      const updateData: Partial<NewPurchaseOrder> = { updatedAt: new Date() };
      if (data.supplierId !== undefined) updateData.supplierId = data.supplierId;
      if (data.date !== undefined) updateData.date = data.date;
      if (data.expectedDeliveryDate !== undefined) updateData.expectedDeliveryDate = data.expectedDeliveryDate;
      if (data.notes !== undefined) updateData.notes = data.notes;

      await this.db.update(purchaseOrders).set(updateData).where(eq(purchaseOrders.id, id));
    }

    return this.findById(tenantId, id);
  }

  async updateStatus(tenantId: string, id: string, status: 'draft' | 'sent' | 'partial' | 'received' | 'cancelled'): Promise<PurchaseOrderWithItems> {
    const existing = await this.findById(tenantId, id);

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      draft: ['sent', 'cancelled'],
      sent: ['partial', 'received', 'cancelled'],
      partial: ['received', 'cancelled'],
      received: [],
      cancelled: [],
    };

    if (!validTransitions[existing.status]?.includes(status)) {
      throw new BadRequestException(`Cannot transition from ${existing.status} to ${status}`);
    }

    await this.db
      .update(purchaseOrders)
      .set({ status, updatedAt: new Date() })
      .where(eq(purchaseOrders.id, id));

    return this.findById(tenantId, id);
  }

  async receiveGoods(tenantId: string, id: string, items: ReceiveGoodsItem[]): Promise<PurchaseOrderWithItems> {
    const existing = await this.findById(tenantId, id);

    if (!['sent', 'partial'].includes(existing.status)) {
      throw new BadRequestException('Can only receive goods for sent or partially received purchase orders');
    }

    let allReceived = true;
    let anyReceived = false;

    for (const receiveItem of items) {
      const existingItem = existing.items.find(i => i.id === receiveItem.itemId);
      if (!existingItem) {
        throw new BadRequestException(`Item ${receiveItem.itemId} not found in purchase order`);
      }

      const currentReceived = parseFloat(existingItem.quantityReceived ?? '0');
      const ordered = parseFloat(existingItem.quantityOrdered);
      const newReceived = currentReceived + receiveItem.quantityReceived;

      if (newReceived > ordered) {
        throw new BadRequestException(`Cannot receive more than ordered quantity for item ${receiveItem.itemId}`);
      }

      // Update item quantity received
      await this.db
        .update(purchaseOrderItems)
        .set({ quantityReceived: newReceived.toString() })
        .where(eq(purchaseOrderItems.id, receiveItem.itemId));

      // Update product stock if productId exists
      if (existingItem.productId) {
        const [product] = await this.db
          .select()
          .from(products)
          .where(eq(products.id, existingItem.productId))
          .limit(1);

        if (product && product.trackStock) {
          const currentStock = parseFloat(product.currentStock ?? '0');
          const newStock = currentStock + receiveItem.quantityReceived;

          await this.db
            .update(products)
            .set({
              currentStock: newStock.toString(),
              costPrice: existingItem.unitPrice,
              costCurrency: existing.currency as 'USD' | 'LBP',
              updatedAt: new Date(),
            })
            .where(eq(products.id, existingItem.productId));
        }
      }

      if (newReceived > 0) anyReceived = true;
      if (newReceived < ordered) allReceived = false;
    }

    // Check all items to determine final status
    const updatedPO = await this.findById(tenantId, id);
    let finalAllReceived = true;
    let finalAnyReceived = false;

    for (const item of updatedPO.items) {
      const received = parseFloat(item.quantityReceived ?? '0');
      const ordered = parseFloat(item.quantityOrdered);
      if (received > 0) finalAnyReceived = true;
      if (received < ordered) finalAllReceived = false;
    }

    // Update status based on receipt
    let newStatus: 'sent' | 'partial' | 'received' = existing.status as 'sent' | 'partial' | 'received';
    if (finalAllReceived) {
      newStatus = 'received';
    } else if (finalAnyReceived) {
      newStatus = 'partial';
    }

    if (newStatus !== existing.status) {
      await this.db
        .update(purchaseOrders)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(purchaseOrders.id, id));
    }

    return this.findById(tenantId, id);
  }

  async convertToInvoice(tenantId: string, id: string, userId: string): Promise<{ invoiceId: string }> {
    const purchaseOrder = await this.findById(tenantId, id);

    if (purchaseOrder.status === 'draft' || purchaseOrder.status === 'cancelled') {
      throw new BadRequestException('Cannot convert draft or cancelled purchase orders to invoice');
    }

    // Generate invoice internal number
    const year = new Date().getFullYear();
    const prefix = 'PUR';
    const type = 'purchase_invoice';

    // Get or create sequence for purchase invoice
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

    const internalNumber = `${prefix}-${year}-${String(newNumber).padStart(5, '0')}`;

    // Calculate totals from received quantities
    let subtotal = 0;
    const invoiceItemsData = purchaseOrder.items
      .filter(item => parseFloat(item.quantityReceived ?? '0') > 0)
      .map((item, index) => {
        const quantity = parseFloat(item.quantityReceived ?? '0');
        const unitPrice = parseFloat(item.unitPrice);
        const lineTotal = quantity * unitPrice;
        subtotal += lineTotal;
        return {
          productId: item.productId,
          description: item.description,
          quantity: quantity.toString(),
          unit: 'piece',
          unitPrice: item.unitPrice,
          discountPercent: '0',
          lineTotal: lineTotal.toString(),
          sortOrder: index.toString(),
        };
      });

    if (invoiceItemsData.length === 0) {
      throw new BadRequestException('No items have been received yet');
    }

    const taxAmount = parseFloat(purchaseOrder.taxAmount ?? '0');
    const total = subtotal + taxAmount;
    const totalLbp = purchaseOrder.currency === 'USD'
      ? total * parseFloat(purchaseOrder.exchangeRate)
      : total;

    // Create the purchase invoice
    const [invoice] = await this.db.insert(invoices).values({
      tenantId,
      type: 'purchase',
      internalNumber,
      contactId: purchaseOrder.supplierId,
      date: new Date().toISOString().split('T')[0],
      status: 'draft',
      currency: purchaseOrder.currency,
      exchangeRate: purchaseOrder.exchangeRate,
      subtotal: subtotal.toString(),
      taxAmount: taxAmount.toString(),
      total: total.toString(),
      totalLbp: totalLbp.toString(),
      balance: total.toString(),
      notes: `Created from Purchase Order ${purchaseOrder.number}`,
      createdBy: userId,
    }).returning();

    // Create invoice items
    await this.db.insert(invoiceItems).values(
      invoiceItemsData.map(item => ({
        ...item,
        invoiceId: invoice.id,
      })),
    );

    return { invoiceId: invoice.id };
  }

  async delete(tenantId: string, id: string): Promise<void> {
    const purchaseOrder = await this.findById(tenantId, id);

    if (purchaseOrder.status !== 'draft') {
      throw new BadRequestException('Only draft purchase orders can be deleted');
    }

    await this.db
      .update(purchaseOrders)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(purchaseOrders.id, id));
  }

  private async getNextNumber(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = 'PO';
    const type = 'purchase_order';

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
    totalPartial: number;
    countDraft: number;
    countSent: number;
    countPartial: number;
  }> {
    const draftOrders = await this.db
      .select()
      .from(purchaseOrders)
      .where(
        and(
          eq(purchaseOrders.tenantId, tenantId),
          eq(purchaseOrders.status, 'draft'),
          isNull(purchaseOrders.deletedAt),
        ),
      );

    const sentOrders = await this.db
      .select()
      .from(purchaseOrders)
      .where(
        and(
          eq(purchaseOrders.tenantId, tenantId),
          eq(purchaseOrders.status, 'sent'),
          isNull(purchaseOrders.deletedAt),
        ),
      );

    const partialOrders = await this.db
      .select()
      .from(purchaseOrders)
      .where(
        and(
          eq(purchaseOrders.tenantId, tenantId),
          eq(purchaseOrders.status, 'partial'),
          isNull(purchaseOrders.deletedAt),
        ),
      );

    return {
      totalPending: sentOrders.reduce((sum, po) => sum + parseFloat(po.total ?? '0'), 0),
      totalPartial: partialOrders.reduce((sum, po) => sum + parseFloat(po.total ?? '0'), 0),
      countDraft: draftOrders.length,
      countSent: sentOrders.length,
      countPartial: partialOrders.length,
    };
  }
}
