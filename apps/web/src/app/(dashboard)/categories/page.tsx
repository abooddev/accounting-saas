'use client';

import { useState } from 'react';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/hooks/use-categories';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { CategoryDialog, type CategoryFormData } from '@/components/categories/category-dialog';
import type { Category, CategoryWithChildren } from '@accounting/shared';
import { cn } from '@/lib/utils';

interface CategoryItemProps {
  category: CategoryWithChildren;
  depth: number;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

function CategoryItem({ category, depth, onEdit, onDelete }: CategoryItemProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = category.children.length > 0;

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 py-2 px-3 rounded-md hover:bg-accent group',
        )}
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 hover:bg-muted rounded"
          disabled={!hasChildren}
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : (
            <span className="w-4" />
          )}
        </button>
        {hasChildren ? (
          expanded ? (
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Folder className="h-4 w-4 text-muted-foreground" />
          )
        ) : (
          <Folder className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="flex-1">{category.name}</span>
        {category.nameAr && (
          <span className="text-sm text-muted-foreground" dir="rtl">
            {category.nameAr}
          </span>
        )}
        <div className="opacity-0 group-hover:opacity-100 flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(category)}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onDelete(category)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      {expanded &&
        hasChildren &&
        category.children.map((child) => (
          <CategoryItem
            key={child.id}
            category={child}
            depth={depth + 1}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
    </div>
  );
}

export default function CategoriesPage() {
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);

  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const handleSubmit = async (data: CategoryFormData) => {
    if (editCategory) {
      await updateCategory.mutateAsync({ id: editCategory.id, data });
    } else {
      await createCategory.mutateAsync(data);
    }
    setShowDialog(false);
    setEditCategory(null);
  };

  const handleEdit = (category: Category) => {
    setEditCategory(category);
    setShowDialog(true);
  };

  const handleDelete = async () => {
    if (deleteCategory) {
      await deleteMutation.mutateAsync(deleteCategory.id);
      setDeleteCategory(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Category Tree</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : categories?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No categories yet. Create your first category to get started.
            </div>
          ) : (
            <div className="space-y-1">
              {categories?.map((category) => (
                <CategoryItem
                  key={category.id}
                  category={category}
                  depth={0}
                  onEdit={handleEdit}
                  onDelete={setDeleteCategory}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CategoryDialog
        open={showDialog}
        onClose={() => {
          setShowDialog(false);
          setEditCategory(null);
        }}
        onSubmit={handleSubmit}
        category={editCategory ?? undefined}
        categories={categories ?? []}
        isLoading={createCategory.isPending || updateCategory.isPending}
      />

      <Dialog open={!!deleteCategory} onOpenChange={() => setDeleteCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteCategory?.name}&quot;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCategory(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
