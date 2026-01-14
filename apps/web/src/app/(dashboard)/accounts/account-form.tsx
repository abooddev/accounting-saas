'use client';

import { useState } from 'react';
import { useCreateAccount, useUpdateAccount } from '@/hooks/use-accounts';
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
import type { MoneyAccount } from '@accounting/shared';

interface AccountFormProps {
  account?: MoneyAccount | null;
  onSuccess: () => void;
}

export function AccountForm({ account, onSuccess }: AccountFormProps) {
  const [formData, setFormData] = useState<{
    name: string;
    nameAr: string;
    type: 'cash' | 'bank';
    currency: 'USD' | 'LBP';
    openingBalance: string;
  }>({
    name: account?.name || '',
    nameAr: account?.nameAr || '',
    type: (account?.type as 'cash' | 'bank') || 'cash',
    currency: (account?.currency as 'USD' | 'LBP') || 'USD',
    openingBalance: account?.currentBalance || '0',
  });

  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (account) {
      await updateMutation.mutateAsync({
        id: account.id,
        data: {
          name: formData.name,
          nameAr: formData.nameAr || undefined,
        },
      });
    } else {
      await createMutation.mutateAsync({
        name: formData.name,
        nameAr: formData.nameAr || undefined,
        type: formData.type as 'cash' | 'bank',
        currency: formData.currency as 'USD' | 'LBP',
        openingBalance: parseFloat(formData.openingBalance),
      });
    }

    onSuccess();
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label>Name</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Main Cash, Bank of Beirut"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Name (Arabic)</Label>
        <Input
          value={formData.nameAr}
          onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
          placeholder="الاسم بالعربي"
          dir="rtl"
        />
      </div>

      {!account && (
        <>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={formData.type}
              onValueChange={(v: 'cash' | 'bank') => setFormData({ ...formData, type: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank">Bank</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Currency</Label>
            <Select
              value={formData.currency}
              onValueChange={(v: 'USD' | 'LBP') => setFormData({ ...formData, currency: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="LBP">LBP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Opening Balance</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.openingBalance}
              onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })}
            />
          </div>
        </>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Saving...' : account ? 'Update Account' : 'Create Account'}
      </Button>
    </form>
  );
}
