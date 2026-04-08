'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, cn } from '@/lib/utils';
import { ArrowUpRight, DollarSign, List, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useFinancialData } from '@/context/financial-context';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  Pie,
  PieChart,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
} from 'recharts';
import type { TimeRange } from '@/context/financial-context';


export default function DashboardPage() {
  const { filteredLoans, setTimeRange, timeRange } = useFinancialData();
  const totalEmprestado = filteredLoans.reduce((acc, loan) => acc + loan.amount, 0);
  const totalRecebido = filteredLoans
    .flatMap((l) => l.payments)
    .reduce((acc, p) => acc + p.amount, 0);
  const emprestimosAtivos = filteredLoans.filter((l) => l.status === 'Ativo').length;
  const emprestimosAtrasados = filteredLoans.filter(
    (l) => l.status === 'Atrasado'
  ).length;

  const recentLoans = [...filteredLoans]
    .sort(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    )
    .slice(0, 5);

  const getStatusVariant = (
    status: 'Ativo' | 'Atrasado' | 'Pago' | 'Pendente' | 'Quitado' | undefined
  ): 'default' | 'secondary' | 'destructive' => {
    switch (status) {
      case 'Pago':
      case 'Quitado':
        return 'default';
      case 'Atrasado':
        return 'destructive';
      case 'Ativo':
      case 'Pendente':
      default:
        return 'secondary';
    }
  };

  const statusData = React.useMemo(
    () => [
      {
        name: 'Ativo',
        value: filteredLoans.filter((l) => l.status === 'Ativo').length,
        fill: 'hsl(var(--chart-2))',
      },
      {
        name: 'Atrasado',
        value: filteredLoans.filter((l) => l.status === 'Atrasado').length,
        fill: 'hsl(var(--chart-5))',
      },
      {
        name: 'Quitado',
        value: filteredLoans.filter(
          (l) => l.status === 'Quitado' || l.status === 'Pago'
        ).length,
        fill: 'hsl(var(--chart-3))',
      },
    ],
    [filteredLoans]
  );

  const monthlyPaymentsData = React.useMemo(() => {
    const monthlyPayments = filteredLoans
      .flatMap((l) => l.payments)
      .reduce((acc, payment) => {
        const month = new Date(
          payment.paymentDate + 'T00:00:00'
        ).toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
        acc[month] = (acc[month] || 0) + payment.amount;
        return acc;
      }, {} as Record<string, number>);

    const dateMap = new Map(
      Object.entries(monthlyPayments).map(([key, value]) => {
        const [monthStr, yearStr] = key.split(' de ');
        const monthIndex = [
          'jan',
          'fev',
          'mar',
          'abr',
          'mai',
          'jun',
          'jul',
          'ago',
          'set',
          'out',
          'nov',
          'dez',
        ].indexOf(monthStr);
        return [
          new Date(parseInt('20' + yearStr), monthIndex),
          { month: key, total: value },
        ];
      })
    );

    const sortedDates = Array.from(dateMap.keys()).sort(
      (a, b) => a.getTime() - b.getTime()
    );

    return sortedDates.map((date) => dateMap.get(date)!);
  }, [filteredLoans]);

  const newLoansData = React.useMemo(() => {
    const monthlyNewLoans = filteredLoans.reduce((acc, loan) => {
      const month = new Date(loan.startDate + 'T00:00:00').toLocaleString(
        'pt-BR',
        { month: 'short', year: '2-digit' }
      );
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

     const dateMap = new Map(
      Object.entries(monthlyNewLoans).map(([key, value]) => {
        const [monthStr, yearStr] = key.split(' de ');
        const monthIndex = [
          'jan',
          'fev',
          'mar',
          'abr',
          'mai',
          'jun',
          'jul',
          'ago',
          'set',
          'out',
          'nov',
          'dez',
        ].indexOf(monthStr);
        return [
          new Date(parseInt('20' + yearStr), monthIndex),
          { month: key, count: value },
        ];
      })
    );

    const sortedDates = Array.from(dateMap.keys()).sort(
      (a, b) => a.getTime() - b.getTime()
    );

    return sortedDates.map((date) => dateMap.get(date)!);
  }, [filteredLoans]);
  
  const timeRangeOptions: {label: string, value: TimeRange}[] = [
      { label: 'Todo o Período', value: 'all' },
      { label: 'Últimos 30 dias', value: '30d' },
      { label: 'Últimos 90 dias', value: '90d' },
      { label: 'Último Ano', value: '1y' },
  ];

  return (
    <>
      <PageHeader
        title="Visão Geral"
        description="Bem-vindo ao seu painel de gestão de empréstimos."
        action={
            <div className="flex items-center gap-2">
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
        }
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Emprestado
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalEmprestado)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor total de todos os empréstimos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Recebido
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalRecebido)}
            </div>
            <p className="text-xs text-muted-foreground">
              Soma de todos os pagamentos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Empréstimos Ativos
            </CardTitle>
            <List className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{emprestimosAtivos}</div>
            <p className="text-xs text-muted-foreground">
              Empréstimos aguardando quitação
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Alertas de Pagamento
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{emprestimosAtrasados}</div>
            <p className="text-xs text-muted-foreground">
              Empréstimos com pagamentos atrasados
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recebimentos Mensais</CardTitle>
            <CardDescription>
              Total de pagamentos recebidos por mês.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[250px] w-full">
              <BarChart data={monthlyPaymentsData} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCurrency(Number(value))}
                      indicator="dot"
                    />
                  }
                />
                <Bar
                  dataKey="total"
                  fill="hsl(var(--chart-2))"
                  radius={4}
                  name="Total Recebido"
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ChartContainer config={{}} className="h-[250px] w-full">
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  strokeWidth={5}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Legend
                  content={({ payload }) => {
                    return (
                      <ul className="flex flex-wrap gap-x-4 gap-y-1 justify-center text-sm text-muted-foreground">
                        {payload?.map((entry, index) => (
                          <li key={`item-${index}`} className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: entry.color }}
                            />
                            {entry.value}
                          </li>
                        ))}
                      </ul>
                    );
                  }}
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Novos Empréstimos</CardTitle>
            <CardDescription>
              Volume de novos empréstimos concedidos por mês.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[250px] w-full">
              <LineChart data={newLoansData} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                       formatter={(value) => `${value} empréstimos`}
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--chart-4))"
                  strokeWidth={2}
                  dot={false}
                  name="Novos Empréstimos"
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Empréstimos Recentes</CardTitle>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
              <Link href="/emprestimos">
                Ver Todos
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mutuário</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLoans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell>
                      <div className="font-medium">{loan.borrowerName}</div>
                       <div className="text-xs text-muted-foreground">{new Date(loan.startDate + 'T00:00:00').toLocaleDateString('pt-BR')}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(loan.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
