import { Category } from '../database/schema';

export interface CategoryWithChildren extends Category {
  children: CategoryWithChildren[];
}
