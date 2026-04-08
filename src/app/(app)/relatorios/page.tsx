'use client'

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell, Legend } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { useMemo } from 'react';
import { useFinancialData } from '@/context/financial-context';

export default function RelatoriosPage() {
    const { loans } = useFinancialData();

    const chartData = useMemo(() => {
        const monthlyPayments = loans.flatMap(l => l.payments).reduce((acc, payment) => {
            const month = new Date(payment.paymentDate).toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
            acc[month] = (acc[month] || 0) + payment.amount;
            return acc;
        }, {} as Record<string, number>);

        const dateMap = new Map(Object.entries(monthlyPayments).map(([key, value]) => {
            const [monthStr, yearStr] = key.split(' de ');
            const monthIndex = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'].indexOf(monthStr);
            return [new Date(parseInt('20' + yearStr), monthIndex), { month: key, total: value }];
        }));

        const sortedDates = Array.from(dateMap.keys()).sort((a, b) => a.getTime() - b.getTime());

        return sortedDates.map(date => dateMap.get(date)!);
    }, [loans]);

    const statusData = useMemo(() => [
        { name: 'Ativo', value: loans.filter(l => l.status === 'Ativo').length, fill: 'var(--color-chart-3)' },
        { name: 'Atrasado', value: loans.filter(l => l.status === 'Atrasado').length, fill: 'hsl(var(--destructive))' },
        { name: 'Pago', value: loans.filter(l => l.status === 'Pago').length, fill: 'var(--color-chart-1)' },
    ], [loans]);


    return (
        <>
            <PageHeader
                title="Relatórios Financeiros"
                description="Analise o desempenho dos seus empréstimos."
            />
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Recebimentos Mensais</CardTitle>
                        <CardDescription>Total de pagamentos recebidos por mês.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={{}} className="h-[300px] w-full">
                            <BarChart data={chartData} accessibilityLayer>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="month"
                                    tickLine={false}
                                    tickMargin={10}
                                    axisLine={false}
                                    tickFormatter={(value) => value.replace(' de', '')}
                                />
                                <YAxis
                                    tickFormatter={(value) => formatCurrency(Number(value)).replace('R$', '')}
                                    width={80}
                                />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent
                                        formatter={(value) => formatCurrency(Number(value))}
                                        indicator="dot"
                                    />}
                                />
                                <Bar dataKey="total" fill="hsl(var(--primary))" radius={4} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Status dos Empréstimos</CardTitle>
                        <CardDescription>Distribuição dos empréstimos por status.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center">
                         <ChartContainer config={{}} className="h-[300px] w-full">
                            <PieChart>
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent hideLabel />}
                                />
                                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={5}>
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Legend />
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
        </>
    )
}
