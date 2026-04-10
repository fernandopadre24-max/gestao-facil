'use client'

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell, Legend, Line, LineChart, ResponsiveContainer } from 'recharts';
import { formatCurrency, cn } from '@/lib/utils';
import { useMemo, useState } from 'react';
import { useFinancialData } from '@/context/financial-context';
import { 
    Download, 
    TrendingUp, 
    TrendingDown, 
    Users, 
    AlertCircle, 
    ArrowUpRight, 
    DollarSign,
    Calendar as CalendarIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { format, isAfter, isBefore, addDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function RelatoriosPage() {
    const { loans, clients } = useFinancialData();
    const [isExporting, setIsExporting] = useState(false);

    // --- KPIs ---
    const stats = useMemo(() => {
        const totalLent = loans.reduce((acc, l) => acc + l.amount, 0);
        
        const allInstallments = loans.flatMap(l => l.installments);
        const totalInterestProjected = allInstallments.reduce((acc, i) => acc + i.interest, 0);
        
        const overdueInstallments = allInstallments.filter(i => 
            (i.status === 'Atrasado' || i.status === 'Pendente') && 
            isBefore(new Date(i.dueDate), new Date())
        );
        const totalOverdueValue = overdueInstallments.reduce((acc, i) => acc + (i.amount - i.paidAmount), 0);
        const defaultRate = totalLent > 0 ? (totalOverdueValue / totalLent) * 100 : 0;

        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);

        const receivedThisMonth = loans.flatMap(l => l.payments)
            .filter(p => isWithinInterval(new Date(p.paymentDate), { start: monthStart, end: monthEnd }))
            .reduce((acc, p) => acc + p.amount, 0);

        const expectedThisMonth = allInstallments
            .filter(i => isWithinInterval(new Date(i.dueDate), { start: monthStart, end: monthEnd }))
            .reduce((acc, i) => acc + i.amount, 0);

        return {
            totalLent,
            totalInterestProjected,
            totalOverdueValue,
            defaultRate,
            receivedThisMonth,
            expectedThisMonth
        };
    }, [loans]);

    // --- Chart Data: Monthly Performance ---
    const monthlyPerformanceData = useMemo(() => {
        const months: Record<string, { month: string, received: number, expected: number }> = {};
        
        // Fill last 6 months
        for (let i = 5; i >= 0; i--) {
            const date = addDays(new Date(), -i * 30);
            const key = format(date, 'MMM/yy', { locale: ptBR });
            months[key] = { month: key, received: 0, expected: 0 };
        }

        loans.flatMap(l => l.payments).forEach(p => {
            const key = format(new Date(p.paymentDate), 'MMM/yy', { locale: ptBR });
            if (months[key]) months[key].received += p.amount;
        });

        loans.flatMap(l => l.installments).forEach(i => {
            const key = format(new Date(i.dueDate), 'MMM/yy', { locale: ptBR });
            if (months[key]) months[key].expected += i.amount;
        });

        return Object.values(months);
    }, [loans]);

    // --- Chart Data: Status Distribution ---
    const statusData = useMemo(() => [
        { name: 'Em Dia', value: loans.filter(l => l.status === 'Ativo' || l.status === 'Pago' || l.status === 'Pendente').length, fill: 'hsl(var(--primary))' },
        { name: 'Atrasado', value: loans.filter(l => l.status === 'Atrasado').length, fill: 'hsl(var(--destructive))' },
        { name: 'Quitado', value: loans.filter(l => l.status === 'Quitado').length, fill: 'var(--color-chart-2)' },
    ], [loans]);

    // --- Chart Data: Top Clients ---
    const topClientsData = useMemo(() => {
        const clientDebt: Record<string, number> = {};
        loans.forEach(l => {
            clientDebt[l.borrowerName] = (clientDebt[l.borrowerName] || 0) + l.amount;
        });

        return Object.entries(clientDebt)
            .map(([name, total]) => ({ name, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);
    }, [loans]);

    // --- Critical Installments ---
    const criticalInstallments = useMemo(() => {
        return loans.flatMap(l => l.installments.map(i => ({ ...i, borrowerName: l.borrowerName, loanCode: l.code })))
            .filter(i => (i.status === 'Atrasado' || i.status === 'Pendente') && isBefore(new Date(i.dueDate), addDays(new Date(), 7)))
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            .slice(0, 5);
    }, [loans]);

    const handleExport = () => {
        setIsExporting(true);
        setTimeout(() => setIsExporting(false), 2000);
        // Em um app real, aqui geraria o CSV/PDF
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Relatórios Financeiros"
                description="Visão detalhada da sua carteira e fluxo de caixa."
                action={
                    <Button onClick={handleExport} disabled={isExporting} variant="outline" className="gap-2">
                        {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        Exportar Dados
                    </Button>
                }
            />

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-card/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Carteira Ativa</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.totalLent)}</div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-primary" />
                            Previsão de {formatCurrency(stats.totalInterestProjected)} em juros
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Inadimplência</CardTitle>
                        <AlertCircle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{stats.defaultRate.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            Total de {formatCurrency(stats.totalOverdueValue)} em atraso
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Recebido no Mês</CardTitle>
                        <TrendingUp className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.receivedThisMonth)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Meta do mês: {formatCurrency(stats.expectedThisMonth)}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-card/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total de Clientes</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{clients.length}</div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            {loans.filter(l => l.status === 'Ativo').length} contratos ativos
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Flow Chart */}
                <Card className="bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Fluxo de Recebimento</CardTitle>
                        <CardDescription>Previsto vs. Realizado nos últimos 6 meses.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={{}} className="h-[300px] w-full">
                            <BarChart data={monthlyPerformanceData}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.1} />
                                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                                <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v/1000}k`} />
                                <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatCurrency(Number(v))} />} />
                                <Bar dataKey="expected" name="Previsto" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="received" name="Realizado" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                <Legend />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Top Clients Chart */}
                <Card className="bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Top Clientes</CardTitle>
                        <CardDescription>Maiores volumes de crédito concedido.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={{}} className="h-[300px] w-full">
                            <BarChart data={topClientsData} layout="vertical">
                                <CartesianGrid horizontal={false} strokeDasharray="3 3" opacity={0.1} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={100} />
                                <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatCurrency(Number(v))} />} />
                                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Status Pie */}
                <Card className="bg-card/50 backdrop-blur-sm md:col-span-1">
                    <CardHeader>
                        <CardTitle>Status da Carteira</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={{}} className="h-[250px] w-full">
                            <PieChart>
                                <Pie 
                                    data={statusData} 
                                    dataKey="value" 
                                    nameKey="name" 
                                    cx="50%" 
                                    cy="50%" 
                                    innerRadius={60} 
                                    outerRadius={80} 
                                    paddingAngle={5}
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Critical Installments Table */}
                <Card className="bg-card/50 backdrop-blur-sm md:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Alertas de Parcelas</CardTitle>
                            <CardDescription>Vencidas ou a vencer nos próximos 7 dias.</CardDescription>
                        </div>
                        <AlertCircle className="h-5 w-5 text-destructive animate-pulse" />
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Vencimento</TableHead>
                                    <TableHead>Valor</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {criticalInstallments.length > 0 ? (
                                    criticalInstallments.map((inst, i) => (
                                        <TableRow key={i}>
                                            <TableCell>
                                                <div className="font-medium">{inst.borrowerName}</div>
                                                <div className="text-xs text-muted-foreground">{inst.loanCode}</div>
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(inst.dueDate), 'dd/MM/yyyy')}
                                            </TableCell>
                                            <TableCell>{formatCurrency(inst.amount)}</TableCell>
                                            <TableCell>
                                                <Badge variant={inst.status === 'Atrasado' ? 'destructive' : 'secondary'}>
                                                    {inst.status === 'Atrasado' ? 'Vencida' : 'A Vencer'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                            Nenhum alerta crítico para hoje.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function Loader2(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    )
}

