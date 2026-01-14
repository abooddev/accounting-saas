'use client';

import { useState } from 'react';
import { useAccounts, useDeleteAccount, useTransfer, useAdjustAccount } from '@/hooks/use-accounts';
import { useCurrentExchangeRate } from '@/hooks/use-exchange-rates';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Plus, ArrowRightLeft, Pencil, Trash2, History } from 'lucide-react';
import { formatMoney } from '@accounting/shared';
import type { MoneyAccount } from '@accounting/shared';
import { AccountForm } from './account-form';
import { AccountMovements } from './account-movements';

export default function AccountsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editAccount, setEditAccount] = useState<MoneyAccount | null>(null);
  const [deleteAccount, setDeleteAccount] = useState<MoneyAccount | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showMovements, setShowMovements] = useState<MoneyAccount | null>(null);
  const [showAdjust, setShowAdjust] = useState<MoneyAccount | null>(null);

  const { data: accounts, isLoading } = useAccounts();
  const { data: exchangeRate } = useCurrentExchangeRate();
  const deleteMutation = useDeleteAccount();
  const transferMutation = useTransfer();
  const adjustMutation = useAdjustAccount();

  // Transfer form state
  const [transferData, setTransferData] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Adjust form state
  const [adjustData, setAdjustData] = useState({
    amount: '',
    type: 'add' as 'add' | 'subtract',
    reason: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleDelete = async () => {
    if (deleteAccount) {
      await deleteMutation.mutateAsync(deleteAccount.id);
      setDeleteAccount(null);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const fromAccount = accounts?.find(a => a.id === transferData.fromAccountId);
    const toAccount = accounts?.find(a => a.id === transferData.toAccountId);

    await transferMutation.mutateAsync({
      ...transferData,
      amount: parseFloat(transferData.amount),
      exchangeRate: fromAccount?.currency !== toAccount?.currency ? parseFloat(exchangeRate?.rate || '0') : undefined,
    });
    setShowTransfer(false);
    setTransferData({
      fromAccountId: '',
      toAccountId: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAdjust) return;

    await adjustMutation.mutateAsync({
      id: showAdjust.id,
      data: {
        ...adjustData,
        amount: parseFloat(adjustData.amount),
      },
    });
    setShowAdjust(null);
    setAdjustData({
      amount: '',
      type: 'add',
      reason: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const usdAccounts = accounts?.filter(a => a.currency === 'USD') || [];
  const lbpAccounts = accounts?.filter(a => a.currency === 'LBP') || [];

  const totalUsd = usdAccounts.reduce((sum, a) => sum + parseFloat(a.currentBalance ?? '0'), 0);
  const totalLbp = lbpAccounts.reduce((sum, a) => sum + parseFloat(a.currentBalance ?? '0'), 0);

  const AccountCard = ({ account }: { account: MoneyAccount }) => (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{account.name}</CardTitle>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => setShowMovements(account)}>
              <History className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowAdjust(account)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setDeleteAccount(account)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          {account.type === 'cash' ? 'Cash' : 'Bank'} - {account.currency}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formatMoney(parseFloat(account.currentBalance ?? '0'), account.currency)}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Money Accounts</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowTransfer(true)}>
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Transfer
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total USD</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {formatMoney(totalUsd, 'USD')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total LBP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {formatMoney(totalLbp, 'LBP')}
            </div>
          </CardContent>
        </Card>
      </div>

      {usdAccounts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">USD Accounts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {usdAccounts.map(account => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        </div>
      )}

      {lbpAccounts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">LBP Accounts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lbpAccounts.map(account => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        </div>
      )}

      {accounts?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No accounts yet</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add your first account
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Account Sheet */}
      <Sheet open={showForm || !!editAccount} onOpenChange={(open) => {
        if (!open) {
          setShowForm(false);
          setEditAccount(null);
        }
      }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editAccount ? 'Edit Account' : 'New Account'}</SheetTitle>
            <SheetDescription>
              {editAccount ? 'Update account details' : 'Add a new money account'}
            </SheetDescription>
          </SheetHeader>
          <AccountForm
            account={editAccount}
            onSuccess={() => {
              setShowForm(false);
              setEditAccount(null);
            }}
          />
        </SheetContent>
      </Sheet>

      {/* Transfer Dialog */}
      <Dialog open={showTransfer} onOpenChange={setShowTransfer}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Between Accounts</DialogTitle>
            <DialogDescription>
              Move money between your accounts
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTransfer} className="space-y-4">
            <div className="space-y-2">
              <Label>From Account</Label>
              <Select
                value={transferData.fromAccountId}
                onValueChange={(v) => setTransferData({ ...transferData, fromAccountId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} ({formatMoney(parseFloat(account.currentBalance ?? '0'), account.currency)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>To Account</Label>
              <Select
                value={transferData.toAccountId}
                onValueChange={(v) => setTransferData({ ...transferData, toAccountId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select destination account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.filter(a => a.id !== transferData.fromAccountId).map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} ({account.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                step="0.01"
                value={transferData.amount}
                onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={transferData.date}
                onChange={(e) => setTransferData({ ...transferData, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input
                value={transferData.notes}
                onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowTransfer(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={transferMutation.isPending}>
                {transferMutation.isPending ? 'Transferring...' : 'Transfer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Adjust Dialog */}
      <Dialog open={!!showAdjust} onOpenChange={() => setShowAdjust(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Balance</DialogTitle>
            <DialogDescription>
              Add or subtract from {showAdjust?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdjust} className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={adjustData.type}
                onValueChange={(v: 'add' | 'subtract') => setAdjustData({ ...adjustData, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add</SelectItem>
                  <SelectItem value="subtract">Subtract</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                step="0.01"
                value={adjustData.amount}
                onChange={(e) => setAdjustData({ ...adjustData, amount: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input
                value={adjustData.reason}
                onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={adjustData.date}
                onChange={(e) => setAdjustData({ ...adjustData, date: e.target.value })}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAdjust(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={adjustMutation.isPending}>
                {adjustMutation.isPending ? 'Adjusting...' : 'Adjust'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteAccount} onOpenChange={() => setDeleteAccount(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteAccount?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAccount(null)}>
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

      {/* Movements Sheet */}
      <Sheet open={!!showMovements} onOpenChange={() => setShowMovements(null)}>
        <SheetContent className="w-[600px] sm:max-w-[600px]">
          <SheetHeader>
            <SheetTitle>{showMovements?.name} - Movements</SheetTitle>
            <SheetDescription>
              Transaction history for this account
            </SheetDescription>
          </SheetHeader>
          {showMovements && <AccountMovements accountId={showMovements.id} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}
