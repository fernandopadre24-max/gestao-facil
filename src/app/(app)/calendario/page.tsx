'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { useFinancialData } from '@/context/financial-context';
import type { Loan } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

export default function CalendarioPage() {
  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const { loans } = useFinancialData();

  React.useEffect(() => {
    setDate(new Date());
  }, []);

  // Find all due dates for pending installments
  const dueDates = React.useMemo(() => {
    return loans.flatMap(loan => 
      loan.installments
        .filter(inst => inst.status === 'Pendente' || inst.status === 'Parcialmente Pago')
        .map(inst => new Date(inst.dueDate + 'T00:00:00'))
    );
  }, [loans]);
  
  const selectedDayInstallments = React.useMemo(() => {
    if (!date) return [];
    
    const selectedDateString = date.toISOString().split('T')[0];

    return loans.flatMap(loan => 
      loan.installments
        .filter(inst => inst.dueDate === selectedDateString && (inst.status === 'Pendente' || inst.status === 'Parcialmente Pago'))
        .map(inst => ({ ...inst, borrowerName: loan.borrowerName, loanId: loan.id }))
    );
  }, [date, loans]);

  const modifiers = {
    due: dueDates,
  };

  const modifiersStyles = {
    due: {
      color: 'hsl(var(--primary-foreground))',
      backgroundColor: 'hsl(var(--primary))',
    },
  };

  return (
    <>
      <PageHeader
        title="Calendário"
        description="Visualize os próximos vencimentos e pagamentos."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <Card>
          <CardContent className="pt-6 flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              Vencimentos para {date ? date.toLocaleDateString('pt-BR') : 'a data selecionada'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDayInstallments.length > 0 ? (
              <ul className="space-y-3">
                {selectedDayInstallments.map((inst) => (
                  <li key={`${inst.loanId}-${inst.number}`} className="flex justify-between items-center bg-muted/50 p-3 rounded-md">
                    <div>
                      <p className="font-semibold">{inst.borrowerName}</p>
                      <p className="text-sm text-muted-foreground">Parcela #{inst.number}</p>
                    </div>
                    <p className="font-bold text-primary">{formatCurrency(inst.amount - inst.paidAmount)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex h-40 items-center justify-center rounded-lg border border-dashed">
                <p className="text-center text-sm text-muted-foreground">{date ? 'Nenhum vencimento para esta data.' : 'Selecione uma data para ver os vencimentos.'}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
