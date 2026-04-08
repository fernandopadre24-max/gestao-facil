'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import type { Loan } from '@/lib/types';
import { ArrowUpDown, MoreHorizontal, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export const columns: ColumnDef<Loan>[] = [
  {
    id: 'expander',
    header: () => null,
    cell: ({ row }) => {
      return (
        <Button
          onClick={row.getToggleExpandedHandler()}
          variant="ghost"
          size="icon"
          className="h-8 w-8"
        >
          <ChevronRight
            className={cn(
              'h-4 w-4 transition-transform',
              row.getIsExpanded() && 'rotate-90'
            )}
          />
          <span className="sr-only">{row.getIsExpanded() ? 'Recolher' : 'Expandir'}</span>
        </Button>
      );
    },
  },
  {
    accessorKey: 'borrowerName',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Mutuário
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="pl-2">{row.getValue('borrowerName')}</div>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const variant: 'default' | 'secondary' | 'destructive' =
        status === 'Pago'
          ? 'default'
          : status === 'Atrasado'
            ? 'destructive'
            : 'secondary';
      return <Badge variant={variant}>{status}</Badge>;
    },
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => {
      return (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Valor
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('amount'));
      return (
        <div className="text-right font-medium">{formatCurrency(amount)}</div>
      );
    },
  },
  {
    accessorKey: 'dueDate',
    header: 'Vencimento',
    cell: ({ row }) => {
      const dateString = row.getValue('dueDate') as string;
      // The 'T00:00:00' ensures the date is parsed in the local timezone, preventing hydration errors.
      const date = new Date(`${dateString}T00:00:00`);
      return <div>{date.toLocaleDateString('pt-BR')}</div>;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const loan = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/emprestimos/${loan.id}`}>Ver detalhes</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Registrar Pagamento</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
