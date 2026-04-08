'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatCPF, formatPhone, validateCPF } from '@/lib/utils';
import { add } from 'date-fns';
import type { Client } from '@/lib/types';
import { useFinancialData } from '@/context/financial-context';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { ArrowLeft, Loader2, Wand2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Label } from '@/components/ui/label';

type SimulatedInstallment = {
  number: number;
  dueDate: string;
  amount: number;
  principal: number;
  interest: number;
};

type SimulationResult = {
  installments: SimulatedInstallment[];
  totalAmount: number;
  totalInterest: number;
};

const formSchema = z.object({
  isNewClient: z.boolean().default(false),
  clientId: z.string().optional(),
  borrowerName: z.string().optional(),
  borrowerCpf: z.string().optional(),
  borrowerPhone: z.string().optional(),
  borrowerAddress: z.string().optional(),
  email: z.string().email({ message: 'Email inválido.' }).optional().or(z.literal('')),
  accountId: z.string().min(1, 'Selecione uma conta.'),
  amount: z.coerce.number().positive('O valor principal deve ser positivo.'),
  installments: z.coerce
    .number()
    .int()
    .positive('O número de parcelas deve ser um inteiro positivo.'),
  interestRate: z.coerce.number().min(0, 'A taxa de juros não pode ser negativa.'),
  iofRate: z.coerce.number().min(0, 'A taxa de IOF não pode ser negativa.').optional(),
  iofValue: z.coerce.number().min(0, 'O valor do IOF não pode ser negativo.').optional(),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Data de início inválida.',
  }),
});

export type NewLoanFormValues = z.infer<typeof formSchema>;

export default function NewLoanPage() {
  const { toast } = useToast();
  const { accounts, clients, createLoan } = useFinancialData();
  const [simulation, setSimulation] = React.useState<SimulationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSimulationEnabled, setIsSimulationEnabled] = React.useState(false);
  const router = useRouter();

  const refinedSchema = formSchema.superRefine((data, ctx) => {
    if (data.isNewClient) {
        if (!data.borrowerName || data.borrowerName.trim().length < 3) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "O nome é obrigatório (mín. 3 caracteres).", path: ["borrowerName"] });
        if (!data.borrowerCpf || !validateCPF(data.borrowerCpf)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "O CPF informado é inválido.", path: ["borrowerCpf"] });
    } else {
        if (!data.clientId) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Selecione um cliente.", path: ["clientId"] });
    }

    if (data.accountId && data.amount) {
        const selectedAccount = accounts.find(acc => acc.id === data.accountId);
        if (selectedAccount && data.amount > selectedAccount.balance) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'O valor do empréstimo não pode exceder o saldo da conta selecionada.',
                path: ['amount'],
            });
        }
    }
  });

  const defaultFormValues = {
      isNewClient: false,
      clientId: '',
      borrowerName: '',
      borrowerCpf: '',
      borrowerPhone: '',
      borrowerAddress: '',
      email: '',
      accountId: '',
      amount: 1000,
      installments: 12,
      interestRate: 1.99,
      startDate: new Date().toISOString().split('T')[0],
      iofRate: '' as any,
      iofValue: '' as any,
  };

  const form = useForm<NewLoanFormValues>({
    resolver: zodResolver(refinedSchema),
    defaultValues: defaultFormValues,
    mode: 'onChange',
  });

  const amount = form.watch('amount');
  const installments = form.watch('installments');
  const interestRate = form.watch('interestRate');
  const startDate = form.watch('startDate');
  const iofRate = form.watch('iofRate');
  const iofValue = form.watch('iofValue');

  React.useEffect(() => {
    if (!isSimulationEnabled) {
      setSimulation(null);
      return;
    }
  
    const validationResult = formSchema
      .pick({
        amount: true,
        installments: true,
        interestRate: true,
        startDate: true,
      })
      .safeParse({ amount, installments, interestRate, startDate });
  
    if (!validationResult.success || !startDate || amount <= 0 || installments <= 0 || interestRate < 0) {
      setSimulation(null);
      return;
    }
  
    const monthlyInterestRate = interestRate / 100;
    const currentIof = iofValue || (iofRate ? amount * (iofRate / 100) : 0);
    const totalLoanAmount = amount + currentIof;
  
    let installmentAmount: number;
    if (monthlyInterestRate > 0) {
        installmentAmount =
        totalLoanAmount *
        (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, installments)) /
        (Math.pow(1 + monthlyInterestRate, installments) - 1);
    } else {
        installmentAmount = totalLoanAmount / installments;
    }
    
    if (isNaN(installmentAmount) || !isFinite(installmentAmount)) {
        setSimulation(null);
        return;
    }
  
    let remainingBalance = totalLoanAmount;
    let totalInterestPaid = 0;
    const simulatedInstallments: SimulatedInstallment[] = [];
    
    for (let i = 1; i <= installments; i++) {
        const interestPayment = remainingBalance * monthlyInterestRate;
        const principalPayment = installmentAmount - interestPayment;
        remainingBalance -= principalPayment;
        totalInterestPaid += interestPayment;

        const dueDate = add(new Date(`${startDate}T00:00:00`), { months: i });

        simulatedInstallments.push({
            number: i,
            dueDate: dueDate.toLocaleDateString('pt-BR'),
            amount: installmentAmount,
            principal: principalPayment,
            interest: interestPayment,
        });
    }

    const totalAmountPaid = installmentAmount * installments;
  
    setSimulation({
      installments: simulatedInstallments,
      totalAmount: totalAmountPaid,
      totalInterest: totalInterestPaid,
    });
  }, [
    amount,
    installments,
    interestRate,
    startDate,
    iofRate,
    iofValue,
    isSimulationEnabled,
    form,
  ]);


  async function onSubmit(values: NewLoanFormValues) {
    setIsSubmitting(true);
    const borrowerName = values.isNewClient ? values.borrowerName : clients.find(c => c.id === values.clientId)?.name;
    
    const formattedValues = {
        ...values,
        borrowerCpf: values.borrowerCpf?.replace(/\D/g, ''),
        borrowerPhone: values.borrowerPhone?.replace(/\D/g, ''),
    }

    try {
        await createLoan(formattedValues);
        
        toast({
          title: 'Empréstimo Criado!',
          description: `O empréstimo para ${borrowerName} foi registrado.`,
          className: 'bg-primary text-primary-foreground',
        });
        
        router.push('/emprestimos');
    } catch (error) {
         toast({
            variant: 'destructive',
            title: 'Erro ao Criar Empréstimo',
            description: 'Ocorreu um erro ao tentar salvar o empréstimo. Por favor, tente novamente.',
        });
    } finally {
        setIsSubmitting(false);
    }

  }

  return (
    <>
    <PageHeader 
        title="Novo Empréstimo"
        description="Preencha os detalhes para simular e criar um novo empréstimo."
    >
        <Button variant="outline" asChild>
            <Link href="/emprestimos">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Empréstimos
            </Link>
        </Button>
    </PageHeader>
    <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <Card className="lg:sticky lg:top-6">
            <CardHeader>
                <CardTitle>Detalhes do Empréstimo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                 <FormField
                    control={form.control}
                    name="isNewClient"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <FormLabel>Adicionar Novo Cliente?</FormLabel>
                        </div>
                        <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                form.setValue('clientId', undefined, { shouldValidate: true });
                                form.setValue('borrowerName', undefined, { shouldValidate: true });
                                form.setValue('borrowerCpf', undefined, { shouldValidate: true });
                              }}
                            />
                        </FormControl>
                        </FormItem>
                    )}
                    />

                    {form.watch('isNewClient') ? (
                        <div className="space-y-4 rounded-md border p-4">
                            <FormField
                                control={form.control}
                                name="borrowerName"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome do Cliente</FormLabel>
                                    <FormControl>
                                    <Input placeholder="Nome completo" {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="borrowerCpf"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>CPF</FormLabel>
                                        <FormControl>
                                        <Input placeholder="000.000.000-00" {...field} value={field.value || ''} onChange={(e) => field.onChange(formatCPF(e.target.value))} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="borrowerPhone"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Telefone</FormLabel>
                                        <FormControl>
                                        <Input placeholder="(00) 90000-0000" {...field} value={field.value || ''} onChange={(e) => field.onChange(formatPhone(e.target.value))} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            </div>
                             <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email (Opcional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="cliente@email.com" {...field} value={field.value || ''}/>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="borrowerAddress"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Endereço</FormLabel>
                                    <FormControl>
                                    <Input placeholder="Rua, número, bairro..." {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                    ) : (
                        <FormField
                            control={form.control}
                            name="clientId"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Cliente</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Selecione o cliente" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {clients.map((client: Client) => (
                                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                                    ))}
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    )}

                    <Separator />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="accountId"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Conta de Saída</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Selecione a conta" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {accounts.map(account => (
                                <SelectItem key={account.id} value={account.id}>
                                    {account.name} ({formatCurrency(account.balance)})
                                </SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Valor Principal (R$)</FormLabel>
                            <FormControl>
                            <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="installments"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nº de Parcelas</FormLabel>
                            <FormControl>
                            <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="interestRate"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Taxa de Juros Mensal (%)</FormLabel>
                            <FormControl>
                            <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Data de Início</FormLabel>
                            <FormControl>
                            <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                        <FormField
                        control={form.control}
                        name="iofRate"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Taxa de IOF (%) (Opcional)</FormLabel>
                            <FormControl>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="Ex: 0.38"
                                {...field}
                                value={field.value ?? ''}
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="iofValue"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Valor do IOF (R$) (Opcional)</FormLabel>
                            <FormControl>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="Calculado ou manual"
                                {...field}
                                value={field.value ?? ''}
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    </div>
            </CardContent>
            <CardFooter>
                 <Button type="submit" className="w-full" disabled={isSubmitting || !form.formState.isValid}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                        </>
                        ) : (
                        'Criar Empréstimo'
                    )}
                </Button>
            </CardFooter>
        </Card>
        
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Simulação</CardTitle>
                        <CardDescription>Visualize o plano de amortização.</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="simulation-mode"
                            checked={isSimulationEnabled}
                            onCheckedChange={setIsSimulationEnabled}
                        />
                        <Label htmlFor="simulation-mode">Simular</Label>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isSimulationEnabled && simulation ? (
                    <div className="space-y-4">
                        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm'>
                            <div className="rounded-md border p-3">
                                <p className="text-muted-foreground">Valor da Parcela</p>
                                <p className="font-bold text-lg">{formatCurrency(simulation.installments[0]?.amount || 0)}</p>
                            </div>
                            <div className="rounded-md border p-3">
                                <p className="text-muted-foreground">Total de Juros</p>
                                <p className="font-bold text-lg">{formatCurrency(simulation.totalInterest)}</p>
                            </div>
                            <div className="rounded-md border p-3">
                                <p className="text-muted-foreground">Custo Total</p>
                                <p className="font-bold text-lg">{formatCurrency(simulation.totalAmount)}</p>
                            </div>
                        </div>
                        
                        <div className="max-h-[400px] overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>#</TableHead>
                                        <TableHead>Vencimento</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {simulation.installments.map((inst) => (
                                        <TableRow key={inst.number}>
                                            <TableCell>{inst.number}</TableCell>
                                            <TableCell>{inst.dueDate}</TableCell>
                                            <TableCell className="text-right font-bold">{formatCurrency(inst.amount)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                ) : (
                    <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-center">
                        <div className="space-y-2">
                             <div className="flex justify-center">
                                <Wand2 className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground">
                                {isSimulationEnabled ? 'Preencha os campos para simular.' : 'A simulação está desativada.'}
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    </form>
    </Form>
    </>
  );
}
