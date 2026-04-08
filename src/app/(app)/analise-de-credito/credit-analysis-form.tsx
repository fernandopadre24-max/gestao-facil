'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { runCreditAnalysis, type AnalysisResult } from './actions';
import { Loader2, ThumbsUp, ThumbsDown, AlertCircle, UserCheck, UserX, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { formatCPF, validateCPF } from '@/lib/utils';
import type { Client } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { useUser } from '@/firebase';

const formSchema = z.object({
  cpf: z.string().refine(validateCPF, {
    message: 'O CPF informado é inválido.',
  }),
  loanAmount: z.coerce.number().positive({ message: 'O valor do empréstimo deve ser positivo.' }),
  loanPurpose: z.string().min(5, { message: 'O propósito do empréstimo deve ter pelo menos 5 caracteres.' }),
});

export function CreditAnalysisForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();
  const { user } = useUser();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cpf: '',
      loanAmount: 1000,
      loanPurpose: 'Despesas pessoais',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    try {
      const analysisResult = await runCreditAnalysis(values.cpf, values.loanAmount, values.loanPurpose, user?.uid);
      setResult(analysisResult);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro na Análise',
        description: (error as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  const getRiskBadgeVariant = (riskLevel: 'Low' | 'Medium' | 'High' | undefined) => {
    switch (riskLevel) {
      case 'Low':
        return 'default';
      case 'Medium':
        return 'secondary';
      case 'High':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getRiskIcon = (riskLevel: 'Low' | 'Medium' | 'High' | undefined) => {
    switch (riskLevel) {
        case 'Low':
            return <ThumbsUp className="h-6 w-6 text-green-500" />;
        case 'Medium':
            return <AlertCircle className="h-6 w-6 text-yellow-500" />;
        case 'High':
            return <ThumbsDown className="h-6 w-6 text-destructive" />;
        default:
            return null;
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Dados para Análise</CardTitle>
          <CardDescription>Preencha o CPF do cliente e os detalhes do empréstimo para a análise de risco.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF do Cliente</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="000.000.000-00"
                        {...field}
                         onChange={(e) => field.onChange(formatCPF(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="loanAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor do Empréstimo (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Ex: 10000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="loanPurpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Propósito do Empréstimo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Compra de veículo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" disabled={isLoading || !user} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                  <Search className="mr-2 h-4 w-4" />
                  Realizar Análise
                  </>
                )}
              </Button>
               {!user && !isLoading && <p className="text-xs text-center text-muted-foreground">Você precisa estar logado para realizar uma análise.</p>}
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Resultado da Análise</CardTitle>
          <CardDescription>A recomendação da IA será exibida aqui.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          {isLoading && (
            <div className="flex h-full flex-col items-center justify-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Aguarde, a IA está consultando dados e processando...</p>
            </div>
          )}
          {result && !isLoading && (
            <div className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Nível de Risco</p>
                        <Badge variant={getRiskBadgeVariant(result.aiResponse.riskLevel)} className="text-lg">
                            {result.aiResponse.riskLevel === 'Low' ? 'Baixo' : result.aiResponse.riskLevel === 'Medium' ? 'Médio' : 'Alto'}
                        </Badge>
                    </div>
                    {getRiskIcon(result.aiResponse.riskLevel)}
                </div>
              
              <div>
                <h3 className="font-semibold">Fatores de Risco (Análise IA)</h3>
                <p className="mt-1 text-sm text-muted-foreground">{result.aiResponse.riskFactors}</p>
              </div>
              <div>
                <h3 className="font-semibold">Ação Recomendada (Análise IA)</h3>
                <p className="mt-1 text-sm text-muted-foreground">{result.aiResponse.recommendedAction}</p>
              </div>
              <Separator />
               <div>
                 <h3 className="font-semibold mb-2">Dados Considerados</h3>
                {result.clientExists && result.clientData ? (
                    <div className="space-y-2 text-sm p-3 bg-muted/50 rounded-lg">
                        <p className="flex items-center gap-2"><UserCheck className="h-4 w-4 text-green-500"/> Cliente encontrado no banco de dados.</p>
                        <p><strong>Nome:</strong> {result.clientData.name}</p>
                        <p><strong>Telefone:</strong> {result.clientData.phone}</p>
                    </div>
                ) : (
                    <div className="space-y-2 text-sm p-3 bg-destructive/10 text-destructive-foreground rounded-lg">
                        <p className="flex items-center gap-2"><UserX className="h-4 w-4 text-destructive"/> Cliente não encontrado no banco de dados.</p>
                        <p className="text-xs">A análise foi realizada com base em um cenário hipotético.</p>
                    </div>
                )}
               </div>
            </div>
          )}
          {!result && !isLoading && (
             <div className="flex h-full items-center justify-center rounded-lg border border-dashed">
                <p className="text-center text-muted-foreground">O resultado aparecerá aqui.</p>
             </div>
          )}
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground">Atenção: Esta é uma recomendação gerada por IA e deve ser usada como um auxílio à decisão, não como uma aprovação ou negação final.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
