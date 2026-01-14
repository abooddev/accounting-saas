'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Contact } from '@accounting/shared';

const contactSchema = z.object({
  type: z.enum(['supplier', 'customer', 'both']),
  name: z.string().min(1, 'Name is required'),
  nameAr: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  taxNumber: z.string().optional(),
  paymentTermsDays: z.number().min(0).optional(),
  creditLimit: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;

interface ContactFormProps {
  contact?: Contact;
  onSubmit: (data: ContactFormData) => void;
  isLoading?: boolean;
}

export function ContactForm({ contact, onSubmit, isLoading }: ContactFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      type: contact?.type ?? 'supplier',
      name: contact?.name ?? '',
      nameAr: contact?.nameAr ?? '',
      phone: contact?.phone ?? '',
      email: contact?.email ?? '',
      address: contact?.address ?? '',
      taxNumber: contact?.taxNumber ?? '',
      paymentTermsDays: contact?.paymentTermsDays ?? 0,
      creditLimit: Number(contact?.creditLimit) || 0,
      notes: contact?.notes ?? '',
    },
  });

  const type = watch('type');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={type} onValueChange={(value) => setValue('type', value as 'supplier' | 'customer' | 'both')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="supplier">Supplier</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="both">Both</SelectItem>
            </SelectContent>
          </Select>
          {errors.type && <p className="text-sm text-red-500">{errors.type.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="nameAr">Name (Arabic)</Label>
          <Input id="nameAr" dir="rtl" {...register('nameAr')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...register('phone')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register('email')} />
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input id="address" {...register('address')} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="taxNumber">Tax Number</Label>
          <Input id="taxNumber" {...register('taxNumber')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="paymentTermsDays">Payment Terms (Days)</Label>
          <Input
            id="paymentTermsDays"
            type="number"
            min="0"
            {...register('paymentTermsDays', { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="creditLimit">Credit Limit (USD)</Label>
          <Input
            id="creditLimit"
            type="number"
            min="0"
            step="0.01"
            {...register('creditLimit', { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" {...register('notes')} />
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : contact ? 'Update Contact' : 'Create Contact'}
      </Button>
    </form>
  );
}
