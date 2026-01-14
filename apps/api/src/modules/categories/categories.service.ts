import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, isNull } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../database/schema';
import { categories, Category, NewCategory, products } from '../../database/schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryWithChildren } from '../../types';

@Injectable()
export class CategoriesService {
  constructor(
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
  ) {}

  async create(tenantId: string, dto: CreateCategoryDto): Promise<Category> {
    if (dto.parentId) {
      await this.findById(tenantId, dto.parentId);
    }

    const data: NewCategory = {
      tenantId,
      name: dto.name,
      nameAr: dto.nameAr,
      parentId: dto.parentId,
      sortOrder: dto.sortOrder ?? 0,
    };

    const [category] = await this.db.insert(categories).values(data).returning();
    return category;
  }

  async findAll(tenantId: string): Promise<Category[]> {
    return this.db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.tenantId, tenantId),
          isNull(categories.deletedAt),
        ),
      )
      .orderBy(categories.sortOrder, categories.name);
  }

  async findTree(tenantId: string): Promise<CategoryWithChildren[]> {
    const allCategories = await this.findAll(tenantId);
    return this.buildTree(allCategories);
  }

  private buildTree(
    items: Category[],
    parentId: string | null = null,
  ): CategoryWithChildren[] {
    return items
      .filter((item) => item.parentId === parentId)
      .map((item) => ({
        ...item,
        children: this.buildTree(items, item.id),
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async findById(tenantId: string, id: string): Promise<Category> {
    const [category] = await this.db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.id, id),
          eq(categories.tenantId, tenantId),
          isNull(categories.deletedAt),
        ),
      )
      .limit(1);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async findByIdWithChildren(tenantId: string, id: string): Promise<CategoryWithChildren> {
    const category = await this.findById(tenantId, id);
    const allCategories = await this.findAll(tenantId);
    const children = this.buildTree(allCategories, id);

    return {
      ...category,
      children,
    };
  }

  async update(tenantId: string, id: string, dto: UpdateCategoryDto): Promise<Category> {
    await this.findById(tenantId, id);

    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }
      await this.findById(tenantId, dto.parentId);
    }

    const updateData: Partial<NewCategory> = {
      updatedAt: new Date(),
    };

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.nameAr !== undefined) updateData.nameAr = dto.nameAr;
    if (dto.parentId !== undefined) updateData.parentId = dto.parentId;
    if (dto.sortOrder !== undefined) updateData.sortOrder = dto.sortOrder;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    const [category] = await this.db
      .update(categories)
      .set(updateData)
      .where(and(eq(categories.id, id), eq(categories.tenantId, tenantId)))
      .returning();

    return category;
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.findById(tenantId, id);

    const childCategories = await this.db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.parentId, id),
          eq(categories.tenantId, tenantId),
          isNull(categories.deletedAt),
        ),
      );

    if (childCategories.length > 0) {
      throw new BadRequestException('Cannot delete category with child categories');
    }

    const categoryProducts = await this.db
      .select()
      .from(products)
      .where(
        and(
          eq(products.categoryId, id),
          eq(products.tenantId, tenantId),
          isNull(products.deletedAt),
        ),
      )
      .limit(1);

    if (categoryProducts.length > 0) {
      throw new BadRequestException('Cannot delete category with products');
    }

    await this.db
      .update(categories)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(categories.id, id), eq(categories.tenantId, tenantId)));
  }
}
