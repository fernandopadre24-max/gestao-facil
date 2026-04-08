'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFinancialData } from '@/context/financial-context';
import { Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ThemeCustomizer } from '@/components/theme-customizer';

export default function ConfiguracoesPage() {
  const { seedDatabase } = useFinancialData();
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = React.useState(false);

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await seedDatabase();
      toast({
        title: 'Sucesso!',
        description: 'O banco de dados foi populado com dados de teste.',
        className: 'bg-primary text-primary-foreground',
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Erro ao popular o banco',
        description: (error as Error).message || 'Ocorreu um erro inesperado.',
      });
    } finally {
      setIsSeeding(false);
    }
  };


  return (
    <>
      <PageHeader
        title="Configurações"
        description="Gerencie as configurações da sua conta e do aplicativo."
      />
      <div className="space-y-6">
         <Card>
          <CardHeader>
            <CardTitle>Aparência</CardTitle>
            <CardDescription>
              Personalize a aparência do aplicativo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeCustomizer />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
            <CardDescription>
              Suas informações pessoais.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">As opções de configuração de perfil serão exibidas aqui.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados de Teste</CardTitle>
            <CardDescription>
              Use esta opção para popular o banco de dados com dados de teste para fins de demonstração.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSeed} disabled={isSeeding}>
              <Database className="mr-2 h-4 w-4" />
              {isSeeding ? 'Populando...' : 'Popular Banco de Dados'}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Atenção: Esta ação irá adicionar vários registros (clientes, contas, empréstimos) ao seu banco de dados Firestore.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
