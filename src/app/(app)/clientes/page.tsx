'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Hash,
  Phone,
  MapPin,
  Search,
  PlusCircle,
  Edit,
  Trash2,
  Download,
  ArrowLeft,
  CircleDollarSign,
  TrendingUp,
  Mail,
} from 'lucide-react';
import type { Client, Loan, Payment } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useFinancialData } from '@/context/financial-context';
import { ClientDialog } from './components/new-client-dialog';
import { DeleteAlertDialog } from '@/components/delete-alert-dialog';
import { useToast } from '@/hooks/use-toast';

function ClientCard({
  client,
  onSelect,
  isSelected,
  onEdit,
  onDelete,
}: {
  client: Client;
  onSelect: () => void;
  isSelected: boolean;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:bg-card-foreground/5',
        isSelected && 'ring-2 ring-primary bg-card-foreground/10'
      )}
      onClick={onSelect}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <client.avatar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{client.name}</CardTitle>
              <p className="text-sm text-muted-foreground">ID: {client.id.substring(0, 8)}</p>
            </div>
          </div>
          <div className="flex gap-1">
             <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={(e) => { e.stopPropagation(); onEdit(client);}}><Edit className="h-4 w-4" /></Button>
             <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(client);}}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Hash className="h-4 w-4" />
          <span>{client.cpf}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="h-4 w-4" />
          <span>{client.email}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="h-4 w-4" />
          <span>{client.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{client.address}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function ClientDetails({ client, loans, accounts }: { client: Client | null; loans: Loan[]; accounts: any[] }) {
  if (!client) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Selecione um cliente para ver os detalhes
      </div>
    );
  }

  const clientLoans = loans.filter(loan => loan.clientId === client.id);
  const totalBorrowed = clientLoans.reduce((acc, loan) => acc + loan.amount, 0);
  const allClientPayments = clientLoans.flatMap(loan => loan.payments);
  const totalPaid = allClientPayments.reduce((acc, p) => acc + p.amount, 0);

  const getStatusVariant = (status: Loan['status']): 'default' | 'secondary' | 'destructive' => {
      switch (status) {
        case 'Pago':
        case 'Quitado':
          return 'default'
        case 'Atrasado':
          return 'destructive';
        case 'Ativo':
        case 'Pendente':
        default:
          return 'secondary';
      }
    };

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Detalhes do Cliente</h2>
             <div className="flex items-center gap-2">
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar CSV
                </Button>
            </div>
        </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <client.avatar className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">{client.name}</CardTitle>
              <p className="text-sm text-muted-foreground">ID: {client.id.substring(0, 8)}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
                <Hash className="h-4 w-4" />
                <span>{client.cpf}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{client.email}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{client.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{client.address}</span>
            </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Resumo Financeiro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2"><CircleDollarSign className="h-5 w-5" /> Total Emprestado</span>
                    <span className="font-bold text-lg text-red-400">{formatCurrency(totalBorrowed)}</span>
                </div>
                 <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Total Pago</span>
                    <span className="font-bold text-lg text-green-400">{formatCurrency(totalPaid)}</span>
                </div>
            </CardContent>
        </Card>
      </div>

        <Card>
            <CardHeader>
                <CardTitle>Empréstimos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {clientLoans.map(loan => (
                    <div key={loan.id} className="flex items-center justify-between p-3 rounded-md bg-card-foreground/5">
                        <div>
                            <p className="font-semibold">{formatCurrency(loan.amount)}</p>
                            <p className="text-xs text-muted-foreground">{loan.id.substring(0,8)} • Início: {new Date(loan.startDate + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                        </div>
                        <Badge variant={getStatusVariant(loan.status)}>{loan.status}</Badge>
                    </div>
                ))}
                {clientLoans.length === 0 && <p className="text-sm text-muted-foreground text-center">Nenhum empréstimo para este cliente.</p>}
            </CardContent>
        </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {allClientPayments.length > 0 ? (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>ID Empréstimo</TableHead>
                        <TableHead>Conta</TableHead>
                        <TableHead>Forma</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {allClientPayments.map((payment) => {
                      const account = accounts.find(a => a.id === payment.destinationAccountId);
                      return (
                        <TableRow key={payment.id}>
                            <TableCell>{new Date(payment.paymentDate + 'T00:00:00').toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell className="font-mono text-xs">{payment.loanId.substring(0,8)}</TableCell>
                            <TableCell>{account?.name || 'N/D'}</TableCell>
                            <TableCell>
                                <Badge variant="secondary">{payment.method || 'N/D'}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium text-green-400">{formatCurrency(payment.amount)}</TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
            </Table>
          ) : (
            <div className="flex h-24 items-center justify-center rounded-lg border border-dashed">
                <p className="text-center text-sm text-muted-foreground">Nenhum pagamento registrado para este cliente.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ClientesPage() {
  const { clients, loans, accounts, deleteClient } = useFinancialData();
  const [selectedClientId, setSelectedClientId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [isClientDialogOpen, setClientDialogOpen] = React.useState(false);
  const [editingClient, setEditingClient] = React.useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = React.useState<Client | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    if (!selectedClientId && clients.length > 0) {
      setSelectedClientId(clients[0].id);
    }
  }, [clients, selectedClientId]);

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
  };
  
  const handleOpenNewClient = () => {
    setEditingClient(null);
    setClientDialogOpen(true);
  };

  const handleOpenEditClient = (client: Client) => {
    setEditingClient(client);
    setClientDialogOpen(true);
  };

  const handleOpenDeleteClient = (client: Client) => {
    setDeletingClient(client);
  };

  const handleDeleteClient = async () => {
    if (!deletingClient) return;

    // Check if client has active loans
    const clientHasLoans = loans.some(loan => loan.clientId === deletingClient.id && loan.status !== 'Quitado' && loan.status !== 'Pago');
    
    if (clientHasLoans) {
      toast({
        variant: 'destructive',
        title: 'Ação Bloqueada',
        description: 'Não é possível excluir um cliente com empréstimos ativos.',
      });
      setDeletingClient(null);
      return;
    }

    await deleteClient(deletingClient.id);
    toast({
      title: 'Cliente Excluído',
      description: `O cliente "${deletingClient.name}" foi removido com sucesso.`,
    });
    setDeletingClient(null);
    if (selectedClientId === deletingClient.id) {
        setSelectedClientId(clients.length > 1 ? clients.find(c => c.id !== deletingClient.id)!.id : null);
    }
  };

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.cpf.includes(search)
  );
  
  const selectedClient = clients.find(c => c.id === selectedClientId);

  return (
    <>
        <div className="grid grid-cols-1 md:grid-cols-[450px_1fr] gap-8 items-start">
            {/* Left Column */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar por nome ou CPF..." 
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button className="shrink-0" onClick={handleOpenNewClient}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Novo Cliente
                    </Button>
                </div>
                <div className="space-y-4 h-[calc(100vh-150px)] overflow-y-auto pr-2">
                    {filteredClients.map((client) => (
                    <ClientCard
                        key={client.id}
                        client={client}
                        onSelect={() => handleSelectClient(client.id)}
                        isSelected={selectedClientId === client.id}
                        onEdit={handleOpenEditClient}
                        onDelete={handleOpenDeleteClient}
                    />
                    ))}
                </div>
            </div>
            
            {/* Right Column */}
            <div className="h-[calc(100vh-100px)] overflow-y-auto pr-2">
               <ClientDetails client={selectedClient || null} loans={loans} accounts={accounts} />
            </div>
        </div>
        <ClientDialog 
            isOpen={isClientDialogOpen} 
            onOpenChange={setClientDialogOpen}
            clientToEdit={editingClient}
        />
        <DeleteAlertDialog
            isOpen={!!deletingClient}
            onOpenChange={(isOpen) => !isOpen && setDeletingClient(null)}
            onConfirm={handleDeleteClient}
            title="Confirmar Exclusão"
            description={`Tem certeza que deseja excluir o cliente "${deletingClient?.name}"? Esta ação não pode ser desfeita.`}
        />
    </>
  );
}
