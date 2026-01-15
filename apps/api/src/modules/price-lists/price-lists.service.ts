import { Injectable, Inject, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { eq, and, isNull, desc, asc, lte } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';
import {
  priceLists,
  priceListItems,
  customerPriceLists,
  products,
  contacts,
  PriceList,
  NewPriceList,
  PriceListItem,
  NewPriceListItem,
  CustomerPriceList,
  NewCustomerPriceList,
} from '../../database/schema';
import { CreatePriceListDto } from './dto/create-price-list.dto';
import { UpdatePriceListDto } from './dto/update-price-list.dto';
import { AddPriceListItemDto, UpdatePriceListItemDto } from './dto/price-list-item.dto';

export interface PriceListWithItems extends PriceList {
  items: (PriceListItem & { product: { id: string; name: string; nameAr: string | null } })[];
}

export interface ProductPriceResult {
  price: string;
  currency: string;
  priceListId: string;
  priceListName: string;
  minQuantity: number;
}

@Injectable()
export class PriceListsService {
  constructor(
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
  ) {}

  async create(tenantId: string, dto: CreatePriceListDto): Promise<PriceList> {
    // If this is set as default, unset other defaults
    if (dto.isDefault) {
      await this.db
        .update(priceLists)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(
          and(
            eq(priceLists.tenantId, tenantId),
            eq(priceLists.isDefault, true),
            isNull(priceLists.deletedAt),
          ),
        );
    }

    const data: NewPriceList = {
      tenantId,
      name: dto.name,
      nameAr: dto.nameAr,
      currency: dto.currency ?? 'USD',
      isDefault: dto.isDefault ?? false,
      isActive: dto.isActive ?? true,
    };

    const [priceList] = await this.db.insert(priceLists).values(data).returning();
    return priceList;
  }

  async findAll(tenantId: string): Promise<PriceList[]> {
    return this.db
      .select()
      .from(priceLists)
      .where(
        and(
          eq(priceLists.tenantId, tenantId),
          isNull(priceLists.deletedAt),
        ),
      )
      .orderBy(desc(priceLists.isDefault), asc(priceLists.name));
  }

  async findById(tenantId: string, id: string): Promise<PriceListWithItems> {
    const [priceList] = await this.db
      .select()
      .from(priceLists)
      .where(
        and(
          eq(priceLists.id, id),
          eq(priceLists.tenantId, tenantId),
          isNull(priceLists.deletedAt),
        ),
      )
      .limit(1);

    if (!priceList) {
      throw new NotFoundException('Price list not found');
    }

    const items = await this.db
      .select({
        item: priceListItems,
        product: {
          id: products.id,
          name: products.name,
          nameAr: products.nameAr,
        },
      })
      .from(priceListItems)
      .innerJoin(products, eq(priceListItems.productId, products.id))
      .where(eq(priceListItems.priceListId, id))
      .orderBy(products.name, asc(priceListItems.minQuantity));

    return {
      ...priceList,
      items: items.map((row) => ({
        ...row.item,
        product: row.product,
      })),
    };
  }

  async update(tenantId: string, id: string, dto: UpdatePriceListDto): Promise<PriceList> {
    await this.findById(tenantId, id);

    // If setting as default, unset other defaults
    if (dto.isDefault) {
      await this.db
        .update(priceLists)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(
          and(
            eq(priceLists.tenantId, tenantId),
            eq(priceLists.isDefault, true),
            isNull(priceLists.deletedAt),
          ),
        );
    }

    const updateData: Partial<NewPriceList> = {
      updatedAt: new Date(),
    };

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.nameAr !== undefined) updateData.nameAr = dto.nameAr;
    if (dto.currency !== undefined) updateData.currency = dto.currency;
    if (dto.isDefault !== undefined) updateData.isDefault = dto.isDefault;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    const [priceList] = await this.db
      .update(priceLists)
      .set(updateData)
      .where(and(eq(priceLists.id, id), eq(priceLists.tenantId, tenantId)))
      .returning();

    return priceList;
  }

  async delete(tenantId: string, id: string): Promise<void> {
    const priceList = await this.findById(tenantId, id);

    if (priceList.isDefault) {
      throw new BadRequestException('Cannot delete the default price list');
    }

    // Check if assigned to any customers
    const [assignment] = await this.db
      .select()
      .from(customerPriceLists)
      .where(eq(customerPriceLists.priceListId, id))
      .limit(1);

    if (assignment) {
      throw new BadRequestException('Cannot delete price list that is assigned to customers');
    }

    await this.db
      .update(priceLists)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(priceLists.id, id), eq(priceLists.tenantId, tenantId)));
  }

  async addItems(tenantId: string, priceListId: string, items: AddPriceListItemDto[]): Promise<PriceListItem[]> {
    // Verify price list exists
    await this.findById(tenantId, priceListId);

    // Validate all products exist
    for (const item of items) {
      const [product] = await this.db
        .select()
        .from(products)
        .where(
          and(
            eq(products.id, item.productId),
            eq(products.tenantId, tenantId),
            isNull(products.deletedAt),
          ),
        )
        .limit(1);

      if (!product) {
        throw new NotFoundException(`Product with id ${item.productId} not found`);
      }
    }

    const itemsData: NewPriceListItem[] = items.map((item) => ({
      priceListId,
      productId: item.productId,
      price: item.price.toString(),
      minQuantity: item.minQuantity ?? 1,
    }));

    const createdItems = await this.db
      .insert(priceListItems)
      .values(itemsData)
      .onConflictDoUpdate({
        target: [priceListItems.priceListId, priceListItems.productId, priceListItems.minQuantity],
        set: {
          price: itemsData[0]?.price, // This updates the price on conflict
          updatedAt: new Date(),
        },
      })
      .returning();

    return createdItems;
  }

  async updateItem(tenantId: string, itemId: string, dto: UpdatePriceListItemDto): Promise<PriceListItem> {
    // Get the item and verify it belongs to a price list owned by the tenant
    const [item] = await this.db
      .select({
        item: priceListItems,
        priceList: priceLists,
      })
      .from(priceListItems)
      .innerJoin(priceLists, eq(priceListItems.priceListId, priceLists.id))
      .where(
        and(
          eq(priceListItems.id, itemId),
          eq(priceLists.tenantId, tenantId),
          isNull(priceLists.deletedAt),
        ),
      )
      .limit(1);

    if (!item) {
      throw new NotFoundException('Price list item not found');
    }

    const updateData: Partial<NewPriceListItem> = {
      updatedAt: new Date(),
    };

    if (dto.price !== undefined) updateData.price = dto.price.toString();
    if (dto.minQuantity !== undefined) updateData.minQuantity = dto.minQuantity;

    const [updatedItem] = await this.db
      .update(priceListItems)
      .set(updateData)
      .where(eq(priceListItems.id, itemId))
      .returning();

    return updatedItem;
  }

  async removeItem(tenantId: string, itemId: string): Promise<void> {
    // Get the item and verify it belongs to a price list owned by the tenant
    const [item] = await this.db
      .select({
        item: priceListItems,
        priceList: priceLists,
      })
      .from(priceListItems)
      .innerJoin(priceLists, eq(priceListItems.priceListId, priceLists.id))
      .where(
        and(
          eq(priceListItems.id, itemId),
          eq(priceLists.tenantId, tenantId),
          isNull(priceLists.deletedAt),
        ),
      )
      .limit(1);

    if (!item) {
      throw new NotFoundException('Price list item not found');
    }

    await this.db
      .delete(priceListItems)
      .where(eq(priceListItems.id, itemId));
  }

  async assignToCustomer(
    tenantId: string,
    customerId: string,
    priceListId: string,
    priority?: number,
  ): Promise<CustomerPriceList> {
    // Verify customer exists and is a customer type
    const [customer] = await this.db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.id, customerId),
          eq(contacts.tenantId, tenantId),
          isNull(contacts.deletedAt),
        ),
      )
      .limit(1);

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (customer.type !== 'customer' && customer.type !== 'both') {
      throw new BadRequestException('Contact is not a customer');
    }

    // Verify price list exists
    await this.findById(tenantId, priceListId);

    // Check if assignment already exists
    const [existing] = await this.db
      .select()
      .from(customerPriceLists)
      .where(
        and(
          eq(customerPriceLists.customerId, customerId),
          eq(customerPriceLists.priceListId, priceListId),
        ),
      )
      .limit(1);

    if (existing) {
      // Update priority
      const [updated] = await this.db
        .update(customerPriceLists)
        .set({ priority: priority ?? existing.priority, updatedAt: new Date() })
        .where(eq(customerPriceLists.id, existing.id))
        .returning();
      return updated;
    }

    const data: NewCustomerPriceList = {
      customerId,
      priceListId,
      priority: priority ?? 0,
    };

    const [assignment] = await this.db
      .insert(customerPriceLists)
      .values(data)
      .returning();

    return assignment;
  }

  async removeCustomerAssignment(tenantId: string, customerId: string, priceListId: string): Promise<void> {
    // Verify customer exists
    const [customer] = await this.db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.id, customerId),
          eq(contacts.tenantId, tenantId),
          isNull(contacts.deletedAt),
        ),
      )
      .limit(1);

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    await this.db
      .delete(customerPriceLists)
      .where(
        and(
          eq(customerPriceLists.customerId, customerId),
          eq(customerPriceLists.priceListId, priceListId),
        ),
      );
  }

  async getCustomerPriceLists(tenantId: string, customerId: string): Promise<(CustomerPriceList & { priceList: PriceList })[]> {
    // Verify customer exists
    const [customer] = await this.db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.id, customerId),
          eq(contacts.tenantId, tenantId),
          isNull(contacts.deletedAt),
        ),
      )
      .limit(1);

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const result = await this.db
      .select({
        assignment: customerPriceLists,
        priceList: priceLists,
      })
      .from(customerPriceLists)
      .innerJoin(priceLists, eq(customerPriceLists.priceListId, priceLists.id))
      .where(
        and(
          eq(customerPriceLists.customerId, customerId),
          eq(priceLists.tenantId, tenantId),
          eq(priceLists.isActive, true),
          isNull(priceLists.deletedAt),
        ),
      )
      .orderBy(desc(customerPriceLists.priority));

    return result.map((row) => ({
      ...row.assignment,
      priceList: row.priceList,
    }));
  }

  async getProductPrice(
    tenantId: string,
    productId: string,
    customerId?: string,
    quantity?: number,
  ): Promise<ProductPriceResult | null> {
    const qty = quantity ?? 1;

    // First, check customer-specific price lists if customerId is provided
    if (customerId) {
      const customerPrices = await this.db
        .select({
          price: priceListItems.price,
          minQuantity: priceListItems.minQuantity,
          priceListId: priceLists.id,
          priceListName: priceLists.name,
          currency: priceLists.currency,
          priority: customerPriceLists.priority,
        })
        .from(customerPriceLists)
        .innerJoin(priceLists, eq(customerPriceLists.priceListId, priceLists.id))
        .innerJoin(priceListItems, eq(priceLists.id, priceListItems.priceListId))
        .where(
          and(
            eq(customerPriceLists.customerId, customerId),
            eq(priceListItems.productId, productId),
            eq(priceLists.tenantId, tenantId),
            eq(priceLists.isActive, true),
            isNull(priceLists.deletedAt),
            lte(priceListItems.minQuantity, qty),
          ),
        )
        .orderBy(desc(customerPriceLists.priority), desc(priceListItems.minQuantity));

      if (customerPrices.length > 0) {
        const bestPrice = customerPrices[0];
        return {
          price: bestPrice.price,
          currency: bestPrice.currency,
          priceListId: bestPrice.priceListId,
          priceListName: bestPrice.priceListName,
          minQuantity: bestPrice.minQuantity,
        };
      }
    }

    // Fall back to default price list
    const defaultPrices = await this.db
      .select({
        price: priceListItems.price,
        minQuantity: priceListItems.minQuantity,
        priceListId: priceLists.id,
        priceListName: priceLists.name,
        currency: priceLists.currency,
      })
      .from(priceLists)
      .innerJoin(priceListItems, eq(priceLists.id, priceListItems.priceListId))
      .where(
        and(
          eq(priceLists.tenantId, tenantId),
          eq(priceLists.isDefault, true),
          eq(priceLists.isActive, true),
          isNull(priceLists.deletedAt),
          eq(priceListItems.productId, productId),
          lte(priceListItems.minQuantity, qty),
        ),
      )
      .orderBy(desc(priceListItems.minQuantity));

    if (defaultPrices.length > 0) {
      const bestPrice = defaultPrices[0];
      return {
        price: bestPrice.price,
        currency: bestPrice.currency,
        priceListId: bestPrice.priceListId,
        priceListName: bestPrice.priceListName,
        minQuantity: bestPrice.minQuantity,
      };
    }

    return null;
  }

  async getDefaultPriceList(tenantId: string): Promise<PriceList | null> {
    const [priceList] = await this.db
      .select()
      .from(priceLists)
      .where(
        and(
          eq(priceLists.tenantId, tenantId),
          eq(priceLists.isDefault, true),
          eq(priceLists.isActive, true),
          isNull(priceLists.deletedAt),
        ),
      )
      .limit(1);

    return priceList ?? null;
  }
}
