'use client';

import { useAccountMovements } from '@/hooks/use-accounts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatMoney } from '@accounting/shared';

interface AccountMovementsProps {
  accountId: string;
}

export function AccountMovements({ accountId }: AccountMovementsProps) {
  const { data: movements, isLoading } = useAccountMovements(accountId);

  if (isLoading) {
    return <div className="py-8 text-center">Loading...</div>;
  }

  if (!movements?.length) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No movements yet
      </div>
    );
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      initial: 'Initial',
      payment_out: 'Payment Out',
      payment_in: 'Payment In',
      transfer_out: 'Transfer Out',
      transfer_in: 'Transfer In',
      adjustment: 'Adjustment',
    };
    return labels[type] || type;
  };

  const getTypeBadgeVariant = (type: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (type.includes('out') || type === 'payment_out') return 'destructive';
    if (type.includes('in') || type === 'payment_in') return 'default';
    return 'secondary';
  };

  return (
    <div className="mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((movement) => (
            <TableRow key={movement.id}>
              <TableCell>{movement.date}</TableCell>
              <TableCell>
                <Badge variant={getTypeBadgeVariant(movement.type)}>
                  {getTypeLabel(movement.type)}
                </Badge>
              </TableCell>
              <TableCell className={`text-right ${parseFloat(movement.amount) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {parseFloat(movement.amount) > 0 ? '+' : ''}
                {formatMoney(parseFloat(movement.amount), movement.currency)}
              </TableCell>
              <TableCell className="text-right">
                {formatMoney(parseFloat(movement.balanceAfter), movement.currency)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
