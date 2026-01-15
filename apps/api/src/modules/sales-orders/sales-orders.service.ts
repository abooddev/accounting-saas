import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, isNull, desc, gte, lte, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';
import {
  salesOrders, SalesOrder, NewSalesOrder,
  salesOrderItems, SalesOrderItem, NewSalesOrderItem,
  contacts, products, sequences, invoices, invoiceItems, NewInvoice, NewInvoiceItem,
} from '../../database/schema';

export interface SalesOrderWithItems extends SalesOrder {
  items: SalesOrderItem[];
  customer?: { id: string; name: string; nameAr: string | null } | null;
  salesRep?: { id: string; name: string } | null;
}

export interface SalesOrderFilters {
  status?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  salesRepId?: string;
}

export interface DeliveryItem {
  itemId: string;
  quantityDelivered: number;
}

@Injectable()
export class SalesOrdersService {
  constructor(
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
  ) {}

  async create(tenantId: string, userId: string, data: {
    customerId: string;
    date: string;
    expectedDeliveryDate?: string;
    status?: string;
    currency: string;
    exchangeRate: number;
    priceListId?: string;
    salesRepId?: string;
    notes?: string;
    items: {
      productId: string;
      description: string;
      quantityOrdered: number;
      unitPrice: number;
      discountPercent?: number;
    }[];
  }): Promise<SalesOrderWithItems> {
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
      const lineTotal = item.quantityOrdered * item.unitPrice * discountMultiplier;
      const discountAmount = item.quantityOrdered * item.unitPrice * (item.discountPercent ?? 0) / 100;
      subtotal += item.quantityOrdered * item.unitPrice;
      totalDiscount += discountAmount;
      return { ...item, lineTotal, sortOrder: index };
    });

    const total = subtotal - totalDiscount;

    // Generate order number
    const orderNumber = await this.getNextNumber(tenantId);

    // Create sales order
    const salesOrderData: NewSalesOrder = {
      tenantId,
      number: orderNumber,
      customerId: data.customerId,
      date: data.date,
      expectedDeliveryDate: data.expectedDeliveryDate,
      status: (data.status ?? 'draft') as 'draft' | 'confirmed' | 'partial' | 'fulfilled' | 'cancelled',
      currency: data.currency,
      exchangeRate: data.exchangeRate.toString(),
      subtotal: subtotal.toString(),
      discountAmount: totalDiscount.toString(),
      taxAmount: '0', // Tax can be added later
      total: total.toString(),
      priceListId: data.priceListId,
      salesRepId: data.salesRepId,
      notes: data.notes,
      createdBy: userId,
    };

    const [salesOrder] = await this.db.insert(salesOrders).values(salesOrderData).returning();

    // Create sales order items
    const itemsData: NewSalesOrderItem[] = itemsWithTotals.map(item => ({
      salesOrderId: salesOrder.id,
      productId: item.productId,
      description: item.description,
      quantityOrdered: item.quantityOrdered.toString(),
      quantityDelivered: '0',
      unitPrice: item.unitPrice.toString(),
      discountPercent: (item.discountPercent ?? 0).toString(),
      lineTotal: item.lineTotal.toString(),
      sortOrder: item.sortOrder.toString(),
    }));

    await this.db.insert(salesOrderItems).values(itemsData);

    return this.findById(tenantId, salesOrder.id);
  }

  async findAll(tenantId: string, filters?: SalesOrderFilters): Promise<SalesOrderWithItems[]> {
    const conditions = [
      eq(salesOrders.tenantId, tenantId),
      isNull(salesOrders.deletedAt),
    ];

    if (filters?.status) {
      conditions.push(eq(salesOrders.status, filters.status as 'draft' | 'confirmed' | 'partial' | 'fulfilled' | 'cancelled'));
    }
    if (filters?.customerId) {
      conditions.push(eq(salesOrders.customerId, filters.customerId));
    }
    if (filters?.dateFrom) {
      conditions.push(gte(salesOrders.date, filters.dateFrom));
    }
    if (filters?.dateTo) {
      conditions.push(lte(salesOrders.date, filters.dateTo));
    }
    if (filters?.salesRepId) {
      conditions.push(eq(salesOrders.salesRepId, filters.salesRepId));
    }

    const results = await this.db
      .select({
        salesOrder: salesOrders,
        customer: {
          id: contacts.id,
          name: contacts.name,
          nameAr: contacts.nameAr,
        },
      })
      .from(salesOrders)
      .leftJoin(contacts, eq(salesOrders.customerId, contacts.id))
      .where(and(...conditions))
      .orderBy(desc(salesOrders.date), desc(salesOrders.createdAt));

    // Get items for each sales order
    const orderIds = results.map(r => r.salesOrder.id);
    const allItems = orderIds.length > 0
      ? await this.db
          .select()
          .from(salesOrderItems)
          .where(sql`${salesOrderItems.salesOrderId} IN ${orderIds}`)
      : [];

    return results.map(r => ({
      ...r.salesOrder,
      customer: r.customer?.id ? r.customer : null,
      salesRep: null, // Can be joined if needed
      items: allItems.filter(item => item.salesOrderId === r.salesOrder.id),
    }));
  }

  async findById(tenantId: string, id: string): Promise<SalesOrderWithItems> {
    const [result] = await this.db
      .select({
        salesOrder: salesOrders,
        customer: {
          id: contacts.id,
          name: contacts.name,
          nameAr: contacts.nameAr,
        },
      })
      .from(salesOrders)
      .leftJoin(contacts, eq(salesOrders.customerId, contacts.id))
      .where(
        and(
          eq(salesOrders.id, id),
          eq(salesOrders.tenantId, tenantId),
          isNull(salesOrders.deletedAt),
        ),
      )
      .limit(1);

    if (!result) {
      throw new NotFoundException('Sales order not found');
    }

    const items = await this.db
      .select()
      .from(salesOrderItems)
      .where(eq(salesOrderItems.salesOrderId, id))
      .orderBy(salesOrderItems.sortOrder);

    return {
      ...result.salesOrder,
      customer: result.customer?.id ? result.customer : null,
      salesRep: null,
      items,
    };
  }

  async update(tenantId: string, id: string, data: {
    customerId?: string;
    date?: string;
    expectedDeliveryDate?: string;
    currency?: string;
    exchangeRate?: number;
    priceListId?: string;
    salesRepId?: string;
    notes?: string;
    items?: {
      productId: string;
      description: string;
      quantityOrdered: number;
      unitPrice: number;
      discountPercent?: number;
    }[];
  }): Promise<SalesOrderWithItems> {
    const existing = await this.findById(tenantId, id);

    if (existing.status !== 'draft') {
      throw new BadRequestException('Only draft sales orders can be edited');
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
        const lineTotal = item.quantityOrdered * item.unitPrice * discountMultiplier;
        const discountAmount = item.quantityOrdered * item.unitPrice * (item.discountPercent ?? 0) / 100;
        subtotal += item.quantityOrdered * item.unitPrice;
        totalDiscount += discountAmount;
        return { ...item, lineTotal, sortOrder: index };
      });

      const total = subtotal - totalDiscount;

      // Delete existing items
      await this.db.delete(salesOrderItems).where(eq(salesOrderItems.salesOrderId, id));

      // Insert new items
      const itemsData: NewSalesOrderItem[] = itemsWithTotals.map(item => ({
        salesOrderId: id,
        productId: item.productId,
        description: item.description,
        quantityOrdered: item.quantityOrdered.toString(),
        quantityDelivered: '0',
        unitPrice: item.unitPrice.toString(),
        discountPercent: (item.discountPercent ?? 0).toString(),
        lineTotal: item.lineTotal.toString(),
        sortOrder: item.sortOrder.toString(),
      }));

      await this.db.insert(salesOrderItems).values(itemsData);

      // Update sales order with new totals
      await this.db
        .update(salesOrders)
        .set({
          customerId: data.customerId ?? existing.customerId,
          date: data.date ?? existing.date,
          expectedDeliveryDate: data.expectedDeliveryDate ?? existing.expectedDeliveryDate,
          currency: data.currency ?? existing.currency,
          exchangeRate: data.exchangeRate?.toString() ?? existing.exchangeRate,
          subtotal: subtotal.toString(),
          discountAmount: totalDiscount.toString(),
          total: total.toString(),
          priceListId: data.priceListId ?? existing.priceListId,
          salesRepId: data.salesRepId ?? existing.salesRepId,
          notes: data.notes ?? existing.notes,
          updatedAt: new Date(),
        })
        .where(eq(salesOrders.id, id));
    } else {
      // Just update non-item fields
      const updateData: Partial<NewSalesOrder> = { updatedAt: new Date() };
      if (data.customerId !== undefined) updateData.customerId = data.customerId;
      if (data.date !== undefined) updateData.date = data.date;
      if (data.expectedDeliveryDate !== undefined) updateData.expectedDeliveryDate = data.expectedDeliveryDate;
      if (data.currency !== undefined) updateData.currency = data.currency;
      if (data.exchangeRate !== undefined) updateData.exchangeRate = data.exchangeRate.toString();
      if (data.priceListId !== undefined) updateData.priceListId = data.priceListId;
      if (data.salesRepId !== undefined) updateData.salesRepId = data.salesRepId;
      if (data.notes !== undefined) updateData.notes = data.notes;

      await this.db.update(salesOrders).set(updateData).where(eq(salesOrders.id, id));
    }

    return this.findById(tenantId, id);
  }

  async confirm(tenantId: string, id: string): Promise<SalesOrderWithItems> {
    const salesOrder = await this.findById(tenantId, id);

    if (salesOrder.status !== 'draft') {
      throw new BadRequestException('Only draft sales orders can be confirmed');
    }

    // Optionally reserve stock (check availability)
    for (const item of salesOrder.items) {
      if (item.productId) {
        const [product] = await this.db
          .select()
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);

        if (product && product.trackStock) {
          const currentStock = parseFloat(product.currentStock ?? '0');
          const quantityOrdered = parseFloat(item.quantityOrdered);

          if (currentStock < quantityOrdered) {
            throw new BadRequestException(
              `Insufficient stock for product "${product.name}". Available: ${currentStock}, Ordered: ${quantityOrdered}`,
            );
          }
        }
      }
    }

    // Update sales order status
    await this.db
      .update(salesOrders)
      .set({ status: 'confirmed', updatedAt: new Date() })
      .where(eq(salesOrders.id, id));

    return this.findById(tenantId, id);
  }

  async deliver(tenantId: string, id: string, items: DeliveryItem[]): Promise<SalesOrderWithItems> {
    const salesOrder = await this.findById(tenantId, id);

    if (salesOrder.status !== 'confirmed' && salesOrder.status !== 'partial') {
      throw new BadRequestException('Only confirmed or partially delivered orders can be delivered');
    }

    // Validate and update each item's delivered quantity
    for (const deliveryItem of items) {
      const orderItem = salesOrder.items.find(i => i.id === deliveryItem.itemId);

      if (!orderItem) {
        throw new BadRequestException(`Item ${deliveryItem.itemId} not found in this order`);
      }

      const currentDelivered = parseFloat(orderItem.quantityDelivered);
      const ordered = parseFloat(orderItem.quantityOrdered);
      const newDelivered = currentDelivered + deliveryItem.quantityDelivered;

      if (newDelivered > ordered) {
        throw new BadRequestException(
          `Cannot deliver more than ordered. Item: ${orderItem.description}, Ordered: ${ordered}, Already delivered: ${currentDelivered}, Attempting to deliver: ${deliveryItem.quantityDelivered}`,
        );
      }

      // Update the item's delivered quantity
      await this.db
        .update(salesOrderItems)
        .set({ quantityDelivered: newDelivered.toString() })
        .where(eq(salesOrderItems.id, deliveryItem.itemId));

      // Update product stock
      if (orderItem.productId) {
        const [product] = await this.db
          .select()
          .from(products)
          .where(eq(products.id, orderItem.productId))
          .limit(1);

        if (product && product.trackStock) {
          const currentStock = parseFloat(product.currentStock ?? '0');
          const newStock = Math.max(0, currentStock - deliveryItem.quantityDelivered);

          await this.db
            .update(products)
            .set({
              currentStock: newStock.toString(),
              updatedAt: new Date(),
            })
            .where(eq(products.id, orderItem.productId));
        }
      }
    }

    // Determine new status
    const updatedOrder = await this.findById(tenantId, id);
    let newStatus: 'confirmed' | 'partial' | 'fulfilled' = 'confirmed';
    let allFulfilled = true;
    let anyDelivered = false;

    for (const item of updatedOrder.items) {
      const delivered = parseFloat(item.quantityDelivered);
      const ordered = parseFloat(item.quantityOrdered);

      if (delivered > 0) {
        anyDelivered = true;
      }
      if (delivered < ordered) {
        allFulfilled = false;
      }
    }

    if (allFulfilled) {
      newStatus = 'fulfilled';
    } else if (anyDelivered) {
      newStatus = 'partial';
    }

    await this.db
      .update(salesOrders)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(salesOrders.id, id));

    return this.findById(tenantId, id);
  }

  async convertToInvoice(tenantId: string, id: string, userId: string): Promise<{ invoiceId: string }> {
    const salesOrder = await this.findById(tenantId, id);

    if (salesOrder.status === 'draft') {
      throw new BadRequestException('Cannot convert draft sales order to invoice. Please confirm the order first.');
    }

    if (salesOrder.status === 'cancelled') {
      throw new BadRequestException('Cannot convert cancelled sales order to invoice');
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

    // Create invoice from sales order
    const invoiceData: NewInvoice = {
      tenantId,
      type: 'sale',
      internalNumber,
      contactId: salesOrder.customerId,
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      currency: salesOrder.currency,
      exchangeRate: salesOrder.exchangeRate,
      subtotal: salesOrder.subtotal,
      discountAmount: salesOrder.discountAmount,
      taxAmount: salesOrder.taxAmount,
      total: salesOrder.total,
      totalLbp: salesOrder.currency === 'USD'
        ? (parseFloat(salesOrder.total) * parseFloat(salesOrder.exchangeRate)).toString()
        : salesOrder.total,
      balance: salesOrder.total,
      notes: `Created from Sales Order ${salesOrder.number}`,
      createdBy: userId,
    };

    const [invoice] = await this.db.insert(invoices).values(invoiceData).returning();

    // Create invoice items from sales order items
    const invoiceItemsData: NewInvoiceItem[] = salesOrder.items.map((item, index) => ({
      invoiceId: invoice.id,
      productId: item.productId,
      description: item.description,
      quantity: item.quantityOrdered,
      unit: 'piece',
      unitPrice: item.unitPrice,
      discountPercent: item.discountPercent ?? '0',
      lineTotal: item.lineTotal,
      sortOrder: index.toString(),
    }));

    await this.db.insert(invoiceItems).values(invoiceItemsData);

    return { invoiceId: invoice.id };
  }

  async cancel(tenantId: string, id: string): Promise<SalesOrderWithItems> {
    const salesOrder = await this.findById(tenantId, id);

    if (salesOrder.status === 'cancelled') {
      throw new BadRequestException('Sales order is already cancelled');
    }

    if (salesOrder.status === 'fulfilled') {
      throw new BadRequestException('Cannot cancel a fulfilled sales order');
    }

    // If any items have been delivered, we need to reverse the stock
    if (salesOrder.status === 'partial') {
      for (const item of salesOrder.items) {
        const deliveredQty = parseFloat(item.quantityDelivered);
        if (deliveredQty > 0 && item.productId) {
          const [product] = await this.db
            .select()
            .from(products)
            .where(eq(products.id, item.productId))
            .limit(1);

          if (product && product.trackStock) {
            const currentStock = parseFloat(product.currentStock ?? '0');
            const newStock = currentStock + deliveredQty;

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
      .update(salesOrders)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(salesOrders.id, id));

    return this.findById(tenantId, id);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    const salesOrder = await this.findById(tenantId, id);

    if (salesOrder.status !== 'draft') {
      throw new BadRequestException('Only draft sales orders can be deleted');
    }

    await this.db
      .update(salesOrders)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(salesOrders.id, id));
  }

  private async getNextNumber(tenantId: string): Promise<string> {
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

    return `${prefix}-${year}-${String(newNumber).padStart(5, '0')}`;
  }

  async getStats(tenantId: string): Promise<{
    totalDraft: number;
    totalConfirmed: number;
    totalPartial: number;
    countDraft: number;
    countConfirmed: number;
    countPartial: number;
  }> {
    const draftOrders = await this.db
      .select()
      .from(salesOrders)
      .where(
        and(
          eq(salesOrders.tenantId, tenantId),
          eq(salesOrders.status, 'draft'),
          isNull(salesOrders.deletedAt),
        ),
      );

    const confirmedOrders = await this.db
      .select()
      .from(salesOrders)
      .where(
        and(
          eq(salesOrders.tenantId, tenantId),
          eq(salesOrders.status, 'confirmed'),
          isNull(salesOrders.deletedAt),
        ),
      );

    const partialOrders = await this.db
      .select()
      .from(salesOrders)
      .where(
        and(
          eq(salesOrders.tenantId, tenantId),
          eq(salesOrders.status, 'partial'),
          isNull(salesOrders.deletedAt),
        ),
      );

    return {
      totalDraft: draftOrders.reduce((sum, o) => sum + parseFloat(o.total), 0),
      totalConfirmed: confirmedOrders.reduce((sum, o) => sum + parseFloat(o.total), 0),
      totalPartial: partialOrders.reduce((sum, o) => sum + parseFloat(o.total), 0),
      countDraft: draftOrders.length,
      countConfirmed: confirmedOrders.length,
      countPartial: partialOrders.length,
    };
  }
}
