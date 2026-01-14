export interface Category {
  id: string;
  tenantId: string;
  name: string;
  nameAr: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CategoryWithChildren extends Category {
  children: CategoryWithChildren[];
}

export interface CreateCategoryInput {
  name: string;
  nameAr?: string;
  parentId?: string;
  sortOrder?: number;
}

export interface UpdateCategoryInput {
  name?: string;
  nameAr?: string;
  parentId?: string;
  sortOrder?: number;
  isActive?: boolean;
}
