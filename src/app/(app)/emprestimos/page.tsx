'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Banknote, Calendar, Percent, FileSpreadsheet, ChevronDown, TrendingUp, DollarSign, Landmark, Search } from 'lucide-react';
import type { Loan, Payment } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PaymentDialog } from './components/payment-dialog';
import { NewLoanDialog } from './components/new-loan-dialog';
import { DeleteAlertDialog } from '@/components/delete-alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { PaymentHistoryDialog } from './components/payment-history-dialog';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { List, AlertTriangle } from 'lucide-react';
import { useFinancialData } from '@/context/financial-context';
import Link from 'next/link';
import { NewLoanFormValues } from './components/new-loan-dialog';
import { AmortizationDialog } from './components/amortization-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { TimeRange } from '@/context/financial-context';
import { Input } from '@/components/ui/input';


type LoanStatusFilter = 'Todos' | 'Atrasado' | 'Parcialmente Pago' | 'Pendente' | 'Quitado' | 'Ativo';
type Installment = Loan['installments'][0];

export default function EmprestimosPage() {
  const { filteredLoans: timeFilteredLoans, setTimeRange, timeRange, accounts, clients, deleteLoan, registerPayment, createLoan, updateLoan } = useFinancialData();
  const [activeFilter, setActiveFilter] = React.useState<LoanStatusFilter>('Todos');
  const [search, setSearch] = React.useState('');
  const [isNewLoanOpen, setNewLoanOpen] = React.useState(false);
  const [editingLoan, setEditingLoan] = React.useState<Loan | null>(null);
  const [deletingLoanId, setDeletingLoanId] = React.useState<string | null>(null);
  const [paymentState, setPaymentState] = React.useState<{ loan: Loan; installment: Installment } | null>(null);
  const [historyState, setHistoryState] = React.useState<{ loan: Loan; installment: Installment } | null>(null);
  const [amortizationState, setAmortizationState] = React.useState<Loan | null>(null);
  const [openCollapsibles, setOpenCollapsibles] = React.useState<Set<string>>(new Set());


  const { toast } = useToast();

  const handleOpenEditLoan = (loan: Loan) => {
    setEditingLoan(loan);
    setNewLoanOpen(true);
  };
  
  const handleOpenDeleteDialog = (loanId: string) => {
    setDeletingLoanId(loanId);
  };

  const handleOpenPaymentDialog = (loan: Loan, installment: Installment) => {
    setPaymentState({ loan, installment });
  };

  const handleOpenHistoryDialog = (loan: Loan, installment: Installment) => {
    setHistoryState({ loan, installment });
  };

  const handleDeleteLoan = async () => {
    if (!deletingLoanId) return;
    const loanToDelete = timeFilteredLoans.find(l => l.id === deletingLoanId);
    await deleteLoan(deletingLoanId);
    toast({
      title: "Empréstimo Excluído",
      description: `O empréstimo para ${loanToDelete?.borrowerName} foi removido.`,
    });
    setDeletingLoanId(null);
  };
  
  const handlePayment = (
    loanId: string,
    installmentNumber: number,
    paymentAmount: number,
    paymentDate: string,
    paymentMethod: string,
    destinationAccountId: string,
  ) => {
    registerPayment(loanId, installmentNumber, paymentAmount, paymentDate, paymentMethod, destinationAccountId);
    setPaymentState(null); // Close dialog on success
  };

  const handleConfirmLoanDialog = (values: NewLoanFormValues, id?: string) => {
    if (id) {
        updateLoan(values, id);
    } else {
        // In the full page form, loan creation is handled there.
        // This is primarily for editing from the list view.
    }
  }
  
  const getInstallmentStatusInfo = (status: Installment['status'], dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDateObj = new Date(dueDate + 'T00:00:00');

    if ((status === 'Pendente' || status === 'Parcialmente Pago') && dueDateObj < today) {
      return { text: 'Atrasado', variant: 'destructive' as const };
    }

    switch (status) {
      case 'Pago':
        return { text: 'Pago', variant: 'default' as const };
      case 'Parcialmente Pago':
        return { text: 'Parcial', variant: 'secondary' as const };
      case 'Pendente':
      default:
        return { text: 'Pendente', variant: 'outline' as const };
    }
  };

  const filteredLoans = React.useMemo(() => {
    const searchLower = search.toLowerCase();

    const loansAfterSearch = timeFilteredLoans.filter(loan => {
        const client = clients.find(c => c.id === loan.clientId);
        const clientCpf = client?.cpf.replace(/\D/g, '') || '';
        return loan.borrowerName.toLowerCase().includes(searchLower) || clientCpf.includes(searchLower.replace(/\D/g, ''));
    });

    if (activeFilter === 'Todos') return loansAfterSearch;
    if (activeFilter === 'Parcialmente Pago') return loansAfterSearch.filter(loan => loan.installments.some(i => i.status === 'Parcialmente Pago'));
    if (activeFilter === 'Quitado') return loansAfterSearch.filter(loan => loan.status === 'Quitado' || loan.status === 'Pago');
    
    return loansAfterSearch.filter(loan => {
      const isOverdue = (loan.status === 'Ativo' || loan.status === 'Pendente') && loan.installments.some(i => (i.status === 'Pendente' || i.status === 'Parcialmente Pago') && new Date(i.dueDate + 'T00:00:00') < new Date());
      const displayStatus = isOverdue ? 'Atrasado' : loan.status;
      return displayStatus === activeFilter;
    });
  }, [activeFilter, timeFilteredLoans, search, clients]);

  const summary = React.useMemo(() => ({
    totalEmprestado: timeFilteredLoans.reduce((acc, loan) => acc + loan.amount, 0),
    totalRecebido: timeFilteredLoans.flatMap(l => l.payments).reduce((acc, p) => acc + p.amount, 0),
    emprestimosAtivos: timeFilteredLoans.filter(l => l.status === 'Ativo').length,
    emprestimosAtrasados: timeFilteredLoans.filter(l => l.status === 'Atrasado' || l.installments.some(i => i.status === 'Pendente' && new Date(i.dueDate + 'T00:00:00') < new Date())).length,
  }), [timeFilteredLoans]);
  
  const loanToDelete = timeFilteredLoans.find(l => l.id === deletingLoanId);

  const toggleCollapsible = (loanId: string) => {
    setOpenCollapsibles(prev => {
        const newSet = new Set(prev);
        if (newSet.has(loanId)) {
            newSet.delete(loanId);
        } else {
            newSet.add(loanId);
        }
        return newSet;
    });
  };
  
    const timeRangeOptions: {label: string, value: TimeRange}[] = [
      { label: 'Todo o Período', value: 'all' },
      { label: 'Últimos 30 dias', value: '30d' },
      { label: 'Últimos 90 dias', value: '90d' },
      { label: 'Último Ano', value: '1y' },
  ];

  return (
    <div className="text-white">
      <PageHeader
        title="Empréstimos"
        description="Gerencie todos os seus empréstimos aqui."
        action={
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/emprestimos/novo">
                <PlusCircle className="mr-2 h-4 w-4" />
                Novo Empréstimo
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Emprestado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalEmprestado)}</div>
            <p className="text-xs text-muted-foreground">Valor filtrado por período</p>
          </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-green-500">{formatCurrency(summary.totalRecebido)}</div>
                <p className="text-xs text-muted-foreground">Pagamentos no período selecionado</p>
            </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empréstimos Ativos</CardTitle>
            <List className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{summary.emprestimosAtivos}</div>
            <p className="text-xs text-muted-foreground">Empréstimos ativos no período</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas de Pagamento</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">+{summary.emprestimosAtrasados}</div>
            <p className="text-xs text-muted-foreground">Atrasados no período</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4 space-y-4">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Buscar por nome ou CPF do mutuário..." 
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
        </div>
        <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {(['Todos', 'Ativo', 'Atrasado', 'Pendente', 'Quitado'] as LoanStatusFilter[]).map(filter => (
                <Button
                  key={filter}
                  variant={activeFilter === filter ? 'default' : 'outline'}
                  size="sm"
                  className={cn('shrink-0', activeFilter === filter ? 'bg-primary text-primary-foreground' : 'bg-card text-card-foreground border-border')}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </Button>
              ))}
            </div>
             <div className="my-2 h-6 w-px bg-border" />
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {timeRangeOptions.map(option => (
                    <Button
                        key={option.value}
                        variant={timeRange === option.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTimeRange(option.value)}
                    >
                        {option.label}
                    </Button>
                ))}
            </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredLoans.map(loan => {
          const totalInstallments = loan.installments.length;
          const paidInstallments = loan.installments.filter(i => i.status === 'Pago').length;
          const progress = totalInstallments > 0 ? (paidInstallments / totalInstallments) * 100 : 0;
          const totalAmountPayable = loan.installments.reduce((acc, i) => acc + i.amount, 0);
          const loanAccount = accounts.find(acc => acc.id === loan.accountId);

          const nextInstallment = loan.installments.find(i => i.status === 'Pendente' || i.status === 'Parcialmente Pago');

          const isOverdue = (loan.status === 'Ativo' || loan.status === 'Pendente') && loan.installments.some(i => (i.status === 'Pendente' || i.status === 'Parcialmente Pago') && new Date(i.dueDate + 'T00:00:00') < new Date());
          const displayStatus = isOverdue ? 'Atrasado' : loan.status;

          const getStatusClasses = (status: Loan['status']) => {
            switch (status) {
              case 'Quitado':
              case 'Pago':
                return 'border-green-500/50 bg-green-500/10 text-green-400';
              case 'Atrasado':
                return 'border-red-500/50 bg-red-500/10 text-red-400';
              case 'Ativo':
              case 'Pendente':
              default:
                return 'border-blue-500/50 bg-blue-500/10 text-blue-400';
            }
          };

          return (
            <Collapsible key={loan.id} asChild onOpenChange={() => toggleCollapsible(loan.id)}>
                 <Card>
                    <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 rounded-t-lg p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg">{loan.borrowerName}</CardTitle>
                                    <CardDescription className="text-xs">{loan.code}</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                     <Badge className={cn('text-xs', getStatusClasses(displayStatus))}>{displayStatus}</Badge>
                                      <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", openCollapsibles.has(loan.id) && "rotate-180")} />
                                </div>
                            </div>
                        </CardHeader>
                    </CollapsibleTrigger>
                    <CardContent className="space-y-4 px-4 pb-4 pt-0">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm pt-4">
                            <div className="space-y-1">
                                <p className="text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3" /> Principal</p>
                                <p className="font-semibold">{formatCurrency(loan.amount)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-muted-foreground flex items-center gap-1"><Percent className="w-3 h-3" /> Juros (mês)</p>
                                <p className="font-semibold">{loan.interestRate}%</p>
                            </div>
                             <div className="space-y-1">
                                <p className="text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Total a Pagar</p>
                                <p className="font-semibold">{formatCurrency(totalAmountPayable)}</p>
                            </div>
                             <div className="space-y-1">
                                <p className="text-muted-foreground flex items-center gap-1"><Landmark className="w-3 h-3" /> Conta de Origem</p>
                                <p className="font-semibold">{loanAccount?.name || 'N/A'}</p>
                            </div>
                            {nextInstallment && (
                                <div className="space-y-1">
                                    <p className="text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Próx. Parcela</p>
                                    <p className="font-semibold">{new Date(nextInstallment.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                                </div>
                            )}
                        </div>

                        <div>
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Progresso</span>
                                <span>{paidInstallments}/{totalInstallments} pagas</span>
                            </div>
                            <Progress value={progress} className="h-2 bg-white/10" />
                        </div>
                    </CardContent>

                    <CollapsibleContent>
                        <div className="px-6 pb-4 bg-muted/50">
                            <h4 className="mb-2 pt-4 font-semibold text-sm">Parcelas</h4>
                            <div className="rounded-md border max-h-60 overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>#</TableHead>
                                            <TableHead>Venc.</TableHead>
                                            <TableHead>Valor</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loan.installments.map((inst) => {
                                            const statusInfo = getInstallmentStatusInfo(inst.status, inst.dueDate);
                                            return (
                                                <TableRow key={inst.number}>
                                                    <TableCell>{inst.number}</TableCell>
                                                    <TableCell>{new Date(inst.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}</TableCell>
                                                    <TableCell>{formatCurrency(inst.amount)}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={statusInfo.variant} className="text-xs">{statusInfo.text}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="link" size="sm" className="h-auto p-0" onClick={() => handleOpenPaymentDialog(loan, inst)} disabled={inst.status === 'Pago'}>Pagar</Button>
                                                        <Button variant="link" size="sm" className="h-auto p-0 ml-2 text-muted-foreground" onClick={() => handleOpenHistoryDialog(loan, inst)}>Hist.</Button>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </CollapsibleContent>

                    <CardFooter className="flex gap-2">
                        <Button variant="ghost" size="icon" className="shrink-0 ml-auto" onClick={(e) => { e.stopPropagation(); handleOpenEditLoan(loan);}}><Edit /></Button>
                        <Button variant="ghost" size="icon" className="shrink-0 hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleOpenDeleteDialog(loan.id);}}><Trash2 /></Button>
                    </CardFooter>
                 </Card>
            </Collapsible>
          );
        })}
        {filteredLoans.length === 0 && (
          <div className="col-span-full flex h-40 w-full items-center justify-center rounded-lg border border-dashed text-center">
            <p className="text-muted-foreground">Nenhum empréstimo encontrado para o filtro "{activeFilter}".</p>
          </div>
        )}
      </div>

      <NewLoanDialog
        isOpen={isNewLoanOpen}
        onOpenChange={(isOpen) => {
            if (!isOpen) setEditingLoan(null);
            setNewLoanOpen(isOpen);
        }}
        loanToEdit={editingLoan}
        onConfirm={handleConfirmLoanDialog}
      />

      <DeleteAlertDialog
        isOpen={!!deletingLoanId}
        onOpenChange={(isOpen) => !isOpen && setDeletingLoanId(null)}
        onConfirm={handleDeleteLoan}
        title="Confirmar Exclusão"
        description={`Tem certeza que deseja excluir o empréstimo para ${loanToDelete?.borrowerName}? Esta ação não pode ser desfeita.`}
      />

       <AmortizationDialog
          isOpen={!!amortizationState}
          onOpenChange={(isOpen) => !isOpen && setAmortizationState(null)}
          loan={amortizationState}
          onPayClick={(inst) => amortizationState && handleOpenPaymentDialog(amortizationState, inst)}
          onHistoryClick={(inst) => amortizationState && handleOpenHistoryDialog(amortizationState, inst)}
        />

      <PaymentDialog
        isOpen={!!paymentState}
        onOpenChange={(isOpen) => !isOpen && setPaymentState(null)}
        loan={paymentState?.loan ?? null}
        installment={paymentState?.installment ?? null}
        onPaymentSuccess={handlePayment}
      />

      <PaymentHistoryDialog
        isOpen={!!historyState}
        onOpenChange={(isOpen) => !isOpen && setHistoryState(null)}
        loan={historyState?.loan ?? null}
        installment={historyState?.installment ?? null}
      />
    </div>
  );
}
