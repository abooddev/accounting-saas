'use client';

import { useRouter, useParams } from 'next/navigation';
import { useProduct, useUpdateProduct } from '@/hooks/use-products';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductForm, type ProductFormData } from '@/components/products/product-form';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: product, isLoading } = useProduct(id);
  const updateProduct = useUpdateProduct();

  const handleSubmit = async (data: ProductFormData) => {
    await updateProduct.mutateAsync({ id, data });
    router.push('/products');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Product not found
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Edit Product</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm
            product={product}
            onSubmit={handleSubmit}
            isLoading={updateProduct.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
