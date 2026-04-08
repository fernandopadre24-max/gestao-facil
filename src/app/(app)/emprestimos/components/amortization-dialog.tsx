'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import type { Loan } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

type Installment = Loan['installments'][0];

interface AmortizationDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  loan: Loan | null;
  onPayClick: (installment: Installment) => void;
  onHistoryClick: (installment: Installment) => void;
}

export function AmortizationDialog({
  isOpen,
  onOpenChange,
  loan,
  onPayClick,
  onHistoryClick,
}: AmortizationDialogProps) {
    
  if (!loan) return null;

  const getStatusInfo = (status: Installment['status'], dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDateObj = new Date(dueDate + 'T00:00:00');

    if ((status === 'Pendente' || status === 'Parcialmente Pago') && dueDateObj < today) {
      return { text: 'Atrasado', variant: 'destructive' };
    }

    switch (status) {
      case 'Pago':
        return { text: 'Pago', variant: 'default' };
      case 'Parcialmente Pago':
        return { text: 'Parcialmente Pago', variant: 'secondary' };
      case 'Pendente':
      default:
        return { text: 'Pendente', variant: 'outline' };
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Plano de Amortização</DialogTitle>
          <DialogDescription>
            Detalhes das parcelas para o empréstimo de {loan.borrowerName}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor Parcela</TableHead>
                <TableHead>Principal</TableHead>
                <TableHead>Juros</TableHead>
                <TableHead>Valor Pago</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loan.installments.map((installment) => {
                const statusInfo = getStatusInfo(installment.status, installment.dueDate);
                return (
                  <TableRow key={installment.number}>
                    <TableCell className="font-medium">{installment.number}</TableCell>
                    <TableCell>{new Date(installment.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{formatCurrency(installment.amount)}</TableCell>
                    <TableCell>{formatCurrency(installment.principal)}</TableCell>
                    <TableCell>{formatCurrency(installment.interest)}</TableCell>
                    <TableCell className="text-green-400">{formatCurrency(installment.paidAmount)}</TableCell>
                    <TableCell>
                      <Badge variant={statusInfo.variant as any} className="text-xs">
                        {statusInfo.text}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button
                        variant="link"
                        className="text-primary p-0 h-auto disabled:text-muted-foreground disabled:no-underline"
                        onClick={() => onPayClick(installment)}
                        disabled={installment.status === 'Pago'}
                      >
                        Pagar
                      </Button>
                      <Button
                        variant="link"
                        className="text-muted-foreground p-0 h-auto ml-4"
                        onClick={() => onHistoryClick(installment)}
                      >
                        Histórico
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Fechar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
