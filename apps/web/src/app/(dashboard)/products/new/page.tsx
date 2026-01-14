'use client';

import { useRouter } from 'next/navigation';
import { useCreateProduct } from '@/hooks/use-products';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductForm, type ProductFormData } from '@/components/products/product-form';

export default function NewProductPage() {
  const router = useRouter();
  const createProduct = useCreateProduct();

  const handleSubmit = async (data: ProductFormData) => {
    await createProduct.mutateAsync(data);
    router.push('/products');
  };

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>New Product</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm
            onSubmit={handleSubmit}
            isLoading={createProduct.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
