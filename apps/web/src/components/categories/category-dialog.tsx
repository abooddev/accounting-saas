'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Category, CategoryWithChildren } from '@accounting/shared';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  nameAr: z.string().optional(),
  parentId: z.string().optional(),
  sortOrder: z.number().min(0).optional(),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryFormData) => void;
  category?: Category;
  categories: CategoryWithChildren[];
  isLoading?: boolean;
}

export function CategoryDialog({
  open,
  onClose,
  onSubmit,
  category,
  categories,
  isLoading,
}: CategoryDialogProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? '',
      nameAr: category?.nameAr ?? '',
      parentId: category?.parentId ?? undefined,
      sortOrder: category?.sortOrder ?? 0,
    },
  });

  const parentId = watch('parentId');

  const flattenCategories = (cats: CategoryWithChildren[], depth = 0): { id: string; name: string; depth: number }[] => {
    return cats.flatMap((cat) => [
      { id: cat.id, name: cat.name, depth },
      ...flattenCategories(cat.children, depth + 1),
    ]).filter((c) => c.id !== category?.id);
  };

  const flatCategories = flattenCategories(categories);

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? 'Edit Category' : 'New Category'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nameAr">Name (Arabic)</Label>
            <Input id="nameAr" dir="rtl" {...register('nameAr')} />
          </div>

          <div className="space-y-2">
            <Label>Parent Category</Label>
            <Select
              value={parentId ?? 'none'}
              onValueChange={(value) => setValue('parentId', value === 'none' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="No parent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No parent</SelectItem>
                {flatCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {'  '.repeat(cat.depth)}{cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sortOrder">Sort Order</Label>
            <Input
              id="sortOrder"
              type="number"
              min="0"
              {...register('sortOrder', { valueAsNumber: true })}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : category ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
