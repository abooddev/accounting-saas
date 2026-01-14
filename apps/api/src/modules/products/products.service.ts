import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { eq, and, isNull, or, ilike, lt } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';
import { products, Product, NewProduct, categories } from '../../database/schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFilters, ProductWithCategory } from '../../types';

@Injectable()
export class ProductsService {
  constructor(
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
  ) {}

  async create(tenantId: string, dto: CreateProductDto): Promise<Product> {
    if (dto.barcode) {
      const existingBarcode = await this.findByBarcode(tenantId, dto.barcode);
      if (existingBarcode) {
        throw new ConflictException('A product with this barcode already exists');
      }
    }

    if (dto.sku) {
      const existingSku = await this.findBySku(tenantId, dto.sku);
      if (existingSku) {
        throw new ConflictException('A product with this SKU already exists');
      }
    }

    const data: NewProduct = {
      tenantId,
      categoryId: dto.categoryId,
      name: dto.name,
      nameAr: dto.nameAr,
      barcode: dto.barcode,
      sku: dto.sku,
      unit: dto.unit ?? 'piece',
      costPrice: dto.costPrice?.toString(),
      costCurrency: dto.costCurrency ?? 'USD',
      sellingPrice: dto.sellingPrice?.toString(),
      sellingCurrency: dto.sellingCurrency ?? 'USD',
      trackStock: dto.trackStock ?? true,
      currentStock: dto.currentStock?.toString() ?? '0',
      minStockLevel: dto.minStockLevel?.toString() ?? '0',
      imageUrl: dto.imageUrl,
    };

    const [product] = await this.db.insert(products).values(data).returning();
    return product;
  }

  async findAll(tenantId: string, filters?: ProductFilters): Promise<ProductWithCategory[]> {
    const conditions = [
      eq(products.tenantId, tenantId),
      isNull(products.deletedAt),
    ];

    if (filters?.categoryId) {
      conditions.push(eq(products.categoryId, filters.categoryId));
    }

    if (filters?.isActive !== undefined) {
      conditions.push(eq(products.isActive, filters.isActive));
    }

    if (filters?.search) {
      conditions.push(
        or(
          ilike(products.name, `%${filters.search}%`),
          ilike(products.nameAr ?? '', `%${filters.search}%`),
          ilike(products.barcode ?? '', `%${filters.search}%`),
          ilike(products.sku ?? '', `%${filters.search}%`),
        )!,
      );
    }

    if (filters?.lowStock) {
      conditions.push(
        and(
          eq(products.trackStock, true),
          lt(products.currentStock, products.minStockLevel),
        )!,
      );
    }

    const result = await this.db
      .select({
        product: products,
        category: {
          id: categories.id,
          name: categories.name,
          nameAr: categories.nameAr,
        },
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(products.name);

    return result.map((row) => ({
      ...row.product,
      category: row.category?.id ? row.category : null,
    }));
  }

  async findById(tenantId: string, id: string): Promise<ProductWithCategory> {
    const [result] = await this.db
      .select({
        product: products,
        category: {
          id: categories.id,
          name: categories.name,
          nameAr: categories.nameAr,
        },
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(
        and(
          eq(products.id, id),
          eq(products.tenantId, tenantId),
          isNull(products.deletedAt),
        ),
      )
      .limit(1);

    if (!result) {
      throw new NotFoundException('Product not found');
    }

    return {
      ...result.product,
      category: result.category?.id ? result.category : null,
    };
  }

  async findByBarcode(tenantId: string, barcode: string): Promise<ProductWithCategory | null> {
    const [result] = await this.db
      .select({
        product: products,
        category: {
          id: categories.id,
          name: categories.name,
          nameAr: categories.nameAr,
        },
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(
        and(
          eq(products.barcode, barcode),
          eq(products.tenantId, tenantId),
          isNull(products.deletedAt),
        ),
      )
      .limit(1);

    if (!result) {
      return null;
    }

    return {
      ...result.product,
      category: result.category?.id ? result.category : null,
    };
  }

  async findBySku(tenantId: string, sku: string): Promise<Product | null> {
    const [product] = await this.db
      .select()
      .from(products)
      .where(
        and(
          eq(products.sku, sku),
          eq(products.tenantId, tenantId),
          isNull(products.deletedAt),
        ),
      )
      .limit(1);

    return product ?? null;
  }

  async update(tenantId: string, id: string, dto: UpdateProductDto): Promise<Product> {
    const existing = await this.findById(tenantId, id);

    if (dto.barcode && dto.barcode !== existing.barcode) {
      const existingBarcode = await this.findByBarcode(tenantId, dto.barcode);
      if (existingBarcode && existingBarcode.id !== id) {
        throw new ConflictException('A product with this barcode already exists');
      }
    }

    if (dto.sku && dto.sku !== existing.sku) {
      const existingSku = await this.findBySku(tenantId, dto.sku);
      if (existingSku && existingSku.id !== id) {
        throw new ConflictException('A product with this SKU already exists');
      }
    }

    const updateData: Partial<NewProduct> = {
      updatedAt: new Date(),
    };

    if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId;
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.nameAr !== undefined) updateData.nameAr = dto.nameAr;
    if (dto.barcode !== undefined) updateData.barcode = dto.barcode;
    if (dto.sku !== undefined) updateData.sku = dto.sku;
    if (dto.unit !== undefined) updateData.unit = dto.unit;
    if (dto.costPrice !== undefined) updateData.costPrice = dto.costPrice.toString();
    if (dto.costCurrency !== undefined) updateData.costCurrency = dto.costCurrency;
    if (dto.sellingPrice !== undefined) updateData.sellingPrice = dto.sellingPrice.toString();
    if (dto.sellingCurrency !== undefined) updateData.sellingCurrency = dto.sellingCurrency;
    if (dto.trackStock !== undefined) updateData.trackStock = dto.trackStock;
    if (dto.currentStock !== undefined) updateData.currentStock = dto.currentStock.toString();
    if (dto.minStockLevel !== undefined) updateData.minStockLevel = dto.minStockLevel.toString();
    if (dto.imageUrl !== undefined) updateData.imageUrl = dto.imageUrl;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    const [product] = await this.db
      .update(products)
      .set(updateData)
      .where(and(eq(products.id, id), eq(products.tenantId, tenantId)))
      .returning();

    return product;
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.findById(tenantId, id);

    await this.db
      .update(products)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(products.id, id), eq(products.tenantId, tenantId)));
  }
}
