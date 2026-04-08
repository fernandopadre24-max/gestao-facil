'use client';

import * as React from 'react';
import type { Account, Client, Loan, Payment, Transaction } from '@/lib/types';
import type { NewLoanFormValues } from '@/app/(app)/emprestimos/components/new-loan-dialog';
import type { NewTransactionFormValues } from '@/app/(app)/contas/components/new-transaction-dialog';
import { User as UserIcon, Library, Wallet } from 'lucide-react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { writeBatch, collection, doc, serverTimestamp, Timestamp, setDoc, addDoc, deleteDoc, updateDoc, runTransaction, where, query, getDocs, arrayUnion } from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { add, format, sub, isWithinInterval } from 'date-fns';
import type { NewAccountFormValues } from '@/app/(app)/contas/components/new-account-dialog';
import type { NewClientFormValues } from '@/app/(app)/clientes/components/new-client-dialog';

export type TimeRange = 'all' | '30d' | '90d' | '1y';

interface FinancialDataContextType {
  accounts: Account[];
  clients: Client[];
  loans: Loan[];
  filteredLoans: Loan[];
  loading: boolean;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  createLoan: (values: NewLoanFormValues) => Promise<void>;
  updateLoan: (values: NewLoanFormValues, id: string) => Promise<void>;
  deleteLoan: (id: string) => Promise<void>;
  registerPayment: (
    loanId: string,
    installmentNumber: number,
    paymentAmount: number,
    paymentDate: string,
    paymentMethod: string,
    destinationAccountId: string
  ) => Promise<void>;
  seedDatabase: () => Promise<void>;
  createAccount: (values: NewAccountFormValues) => Promise<void>;
  updateAccount: (id: string, values: NewAccountFormValues) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  createClient: (values: NewClientFormValues) => Promise<void>;
  updateClient: (id: string, values: NewClientFormValues) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  createTransaction: (values: NewTransactionFormValues) => Promise<void>;
}

const FinancialDataContext = React.createContext<FinancialDataContextType | undefined>(undefined);

export function FinancialProvider({ children }: { children: React.ReactNode }) {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [timeRange, setTimeRange] = React.useState<TimeRange>('all');

  const userId = user?.uid;

  const accountsCollection = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return collection(firestore, 'users', userId, 'accounts');
  }, [firestore, userId]);

  const clientsCollection = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return collection(firestore, 'users', userId, 'clients');
  }, [firestore, userId]);

  const loansCollection = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return collection(firestore, 'users', userId, 'loans');
  }, [firestore, userId]);

  const { data: accountsData, isLoading: accountsLoading } = useCollection<Account>(accountsCollection);
  const { data: clientsData, isLoading: clientsLoading } = useCollection<Client>(clientsCollection);
  const { data: loansData, isLoading: loansLoading } = useCollection<Loan>(loansCollection);
  
  const loading = accountsLoading || clientsLoading || loansLoading || isUserLoading;

  const accounts = React.useMemo(() => {
    if (!accountsData) return [];
    return accountsData.map(a => {
        let icon = Wallet; 
        if (a.name.toLowerCase().includes('investimento')) icon = Library;
        return {...a, icon };
    });
  }, [accountsData]);

  const clients = React.useMemo(() => {
    if (!clientsData) return [];
    return clientsData.map(c => ({...c, avatar: UserIcon}));
  }, [clientsData]);

  const loans = React.useMemo(() => {
    if (!loansData || !clientsData) return [];
    return loansData.map(loan => {
      const client = clientsData.find(c => c.id === loan.clientId);
      return {
        ...loan,
        borrowerName: client?.name || loan.borrowerName || 'Cliente Desconhecido',
      };
    });
  }, [loansData, clientsData]);

  const filteredLoans = React.useMemo(() => {
    if (!loans) return [];
    if (timeRange === 'all') return loans;

    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
        case '30d':
            startDate = sub(now, { days: 30 });
            break;
        case '90d':
            startDate = sub(now, { days: 90 });
            break;
        case '1y':
            startDate = sub(now, { years: 1 });
            break;
        default:
            startDate = new Date(0); // Should not happen
    }
    
    return loans.filter(loan => {
        const loanDate = new Date(loan.startDate + 'T00:00:00');
        return isWithinInterval(loanDate, { start: startDate, end: now });
    });
  }, [loans, timeRange]);

  const createAccount = async (values: NewAccountFormValues) => {
    if (!firestore || !userId) return;
    const newAccountRef = doc(collection(firestore, 'users', userId, 'accounts'));
    const newAccountData = { ...values, id: newAccountRef.id, transactions: [] };
    
    setDoc(newAccountRef, newAccountData).catch(err => {
       errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: newAccountRef.path,
          operation: 'create',
          requestResourceData: newAccountData,
        }));
    });
  }

  const updateAccount = async (id: string, values: NewAccountFormValues) => {
    if (!firestore || !userId) return;
    const accountRef = doc(firestore, 'users', userId, 'accounts', id);
    // Balance cannot be edited directly, so we only update the name.
    updateDoc(accountRef, { name: values.name }).catch(err => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: accountRef.path,
            operation: 'update',
            requestResourceData: { name: values.name },
        }));
    });
    };

    const deleteAccount = async (id: string) => {
    if (!firestore || !loansData || !userId) return;
    
    const accountToDelete = accounts.find(acc => acc.id === id);
    if (!accountToDelete) throw new Error("Conta não encontrada.");

    if (accountToDelete.balance !== 0) {
        throw new Error("Não é possível excluir uma conta com saldo diferente de zero.");
    }
    
    const isAccountUsedInLoans = loansData.some(loan => loan.accountId === id || loan.payments.some(p => p.destinationAccountId === id));
    if (isAccountUsedInLoans) {
        throw new Error("Não é possível excluir uma conta associada a empréstimos existentes.");
    }

    const accountRef = doc(firestore, 'users', userId, 'accounts', id);
    deleteDoc(accountRef).catch(err => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: accountRef.path,
            operation: 'delete',
        }));
    });
  };
  
  const createClient = async (values: NewClientFormValues) => {
    if (!firestore || !userId) return;
    const newClientRef = doc(collection(firestore, 'users', userId, 'clients'));
    const newClientData = { ...values, id: newClientRef.id };

    setDoc(newClientRef, newClientData).catch(err => {
       errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: newClientRef.path,
          operation: 'create',
          requestResourceData: newClientData,
        }));
    });
  }

  const updateClient = async (id: string, values: NewClientFormValues) => {
    if (!firestore || !userId) return;
    const clientRef = doc(firestore, 'users', userId, 'clients', id);
    updateDoc(clientRef, values as any).catch(err => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: clientRef.path,
            operation: 'update',
            requestResourceData: values,
        }));
    });
  };

  const deleteClient = async (id: string) => {
    if (!firestore || !userId) return;
    const clientRef = doc(firestore, 'users', userId, 'clients', id);
    // Note: This is a simple deletion. In a real-world app,
    // you'd want to check for associated loans before deleting.
    deleteDoc(clientRef).catch(err => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: clientRef.path,
            operation: 'delete',
        }));
    });
  };


  const createLoan = async (values: NewLoanFormValues) => {
    if (!firestore || !loansData || !userId) return;

    try {
      await runTransaction(firestore, async (transaction) => {
        let clientId = values.clientId;
        let borrowerName = clients.find(c => c.id === clientId)?.name;
        
        const loansColRef = collection(firestore, 'users', userId, 'loans');
        const loanRef = doc(loansColRef);

        // Perform all reads first
        const accountRef = doc(firestore, 'users', userId, 'accounts', values.accountId);
        const accountDoc = await transaction.get(accountRef);
        if (!accountDoc.exists()) throw new Error("Conta de origem não encontrada.");

        const accountData = accountDoc.data() as Account;
        if (accountData.balance < values.amount) throw new Error("Saldo insuficiente na conta de origem.");
        
        // Now perform all writes
        if (values.isNewClient && values.borrowerName) {
            const newClientRef = doc(collection(firestore, 'users', userId, 'clients'));
            clientId = newClientRef.id;
            borrowerName = values.borrowerName;
            const newClientData: Omit<Client, 'avatar'> = { 
                id: clientId,
                name: values.borrowerName,
                cpf: values.borrowerCpf || '',
                phone: values.borrowerPhone || '',
                address: values.borrowerAddress || '',
                email: values.email || 'n/a',
            };
            transaction.set(newClientRef, newClientData);
        }
        
        const newLoanCode = `EMP-${(loansData.length + 1).toString().padStart(3, '0')}`;
        const newBalance = accountData.balance - values.amount;
        const loanTransaction: Transaction = {
            id: nanoid(10),
            date: format(new Date(), 'yyyy-MM-dd'),
            description: `Empréstimo concedido para ${borrowerName}`,
            amount: values.amount,
            type: 'Despesa',
            category: 'Empréstimo Concedido',
            referenceId: loanRef.id,
            referenceCode: newLoanCode,
        };
        transaction.update(accountRef, { 
            balance: newBalance,
            transactions: arrayUnion(loanTransaction) 
        });

        // Calculate installments
        const { amount, installments: numInstallments, interestRate, startDate, iofRate, iofValue } = values;
        const monthlyInterestRate = interestRate / 100;
        const currentIof = iofValue || (iofRate ? amount * (iofRate / 100) : 0);
        const totalLoanAmount = amount + currentIof;
        
        let installmentAmount: number;
        if (monthlyInterestRate > 0) {
            installmentAmount =
            totalLoanAmount *
            (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numInstallments)) /
            (Math.pow(1 + monthlyInterestRate, numInstallments) - 1);
        } else {
            installmentAmount = totalLoanAmount / numInstallments;
        }

        
        let remainingBalance = totalLoanAmount;
        const installments = Array.from({ length: numInstallments }).map((_, i) => {
            const interest = remainingBalance * monthlyInterestRate;
            const principal = installmentAmount - interest;
            remainingBalance -= principal;

            const dueDate = add(new Date(`${startDate}T00:00:00`), { months: i + 1 });

            return {
                number: i + 1,
                dueDate: format(dueDate, 'yyyy-MM-dd'),
                amount: parseFloat(installmentAmount.toFixed(2)),
                principal: parseFloat(principal.toFixed(2)),
                interest: parseFloat(interest.toFixed(2)),
                paidAmount: 0,
                status: 'Pendente' as const,
            };
        });

        // Create loan document
        const newLoan: Omit<Loan, 'payments'> = {
            id: loanRef.id,
            code: newLoanCode,
            borrowerName: borrowerName!,
            clientId: clientId!,
            accountId: values.accountId,
            amount,
            interestRate,
            iofRate: iofRate || 0,
            iofValue: iofValue || 0,
            startDate,
            status: 'Ativo',
            installments,
        };

        transaction.set(loanRef, {...newLoan, payments: []});
      });
    } catch (err: any) {
        console.error("Erro ao criar empréstimo:", err);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `users/${userId}/loans`,
          operation: 'write',
          requestResourceData: values,
        }));
        throw err;
    }
  };

  const updateLoan = async (values: NewLoanFormValues, id: string) => {
    if (!firestore || !userId) return;
    const loanRef = doc(firestore, 'users', userId, 'loans', id);

    try {
      // NOTE: This is a simplified update. A full update would need to handle
      // transaction rollbacks and recalculations if the amount changes.
      // For now, we recalculate installments but don't adjust past account transactions.
      const { amount, installments: numInstallments, interestRate, startDate, iofRate, iofValue } = values;
      const monthlyInterestRate = interestRate / 100;
      const iof = iofValue || (iofRate ? amount * (iofRate / 100) : 0);
      const totalLoanAmount = amount + iof;
      
      let installmentAmount: number;
        if (monthlyInterestRate > 0) {
            installmentAmount =
            totalLoanAmount *
            (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numInstallments)) /
            (Math.pow(1 + monthlyInterestRate, numInstallments) - 1);
        } else {
            installmentAmount = totalLoanAmount / numInstallments;
        }

      
      let remainingBalance = totalLoanAmount;
      const installments = Array.from({ length: numInstallments }).map((_, i) => {
          const interest = remainingBalance * monthlyInterestRate;
          const principal = installmentAmount - interest;
          remainingBalance -= principal;
          const dueDate = add(new Date(`${startDate}T00:00:00`), { months: i + 1 });
          return {
              number: i + 1,
              dueDate: format(dueDate, 'yyyy-MM-dd'),
              amount: parseFloat(installmentAmount.toFixed(2)),
              principal: parseFloat(principal.toFixed(2)),
              interest: parseFloat(interest.toFixed(2)),
              paidAmount: 0, // Resets payment status on edit
              status: 'Pendente' as const,
          };
      });

      const updatedLoanData = {
        amount,
        interestRate,
        iofRate: iofRate || 0,
        iofValue: iofValue || 0,
        startDate,
        installments,
        payments: [], // Resets payments on edit
        status: 'Ativo',
      };

      await updateDoc(loanRef, updatedLoanData);

    } catch (err: any) {
        console.error("Erro ao atualizar empréstimo:", err);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: loanRef.path,
          operation: 'update',
          requestResourceData: values,
        }));
    }
  };
  
  const deleteLoan = async (id: string) => {
     if (!firestore || !userId) return;
    try {
      await runTransaction(firestore, async (transaction) => {
        const loanRef = doc(firestore, 'users', userId, 'loans', id);
        const loanDoc = await transaction.get(loanRef);
        if (!loanDoc.exists()) throw new Error("Empréstimo não encontrado.");

        const loanData = loanDoc.data() as Loan;
        const accountRef = doc(firestore, 'users', userId, 'accounts', loanData.accountId);
        const accountDoc = await transaction.get(accountRef);
        if (!accountDoc.exists()) throw new Error("Conta associada não encontrada.");

        // Revert the original loan transaction
        const accountData = accountDoc.data() as Account;
        const newBalance = accountData.balance + loanData.amount;
        const updatedTransactions = accountData.transactions.filter(t => t.referenceId !== id);

        transaction.update(accountRef, {
            balance: newBalance,
            transactions: updatedTransactions,
        });

        // Delete the loan
        transaction.delete(loanRef);
      });
    } catch (err: any) {
      console.error("Erro ao deletar empréstimo:", err);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `users/${userId}/loans/${id}`,
        operation: 'delete',
      }));
    }
  };
  
  const registerPayment = async (
    loanId: string,
    installmentNumber: number,
    paymentAmount: number,
    paymentDate: string,
    paymentMethod: string,
    destinationAccountId: string
  ) => {
    if (!firestore || !userId) return;
    
    try {
      await runTransaction(firestore, async (transaction) => {
        // 1. READ all documents first
        const loanRef = doc(firestore, 'users', userId, 'loans', loanId);
        const accountRef = doc(firestore, 'users', userId, 'accounts', destinationAccountId);
        
        const loanDoc = await transaction.get(loanRef);
        if (!loanDoc.exists()) throw new Error("Empréstimo não encontrado.");
        
        const accountDoc = await transaction.get(accountRef);
        if (!accountDoc.exists()) throw new Error("Conta de destino não encontrada.");

        // 2. PREPARE changes on copies of data, not direct mutation
        const loanData = loanDoc.data() as Loan;
        const accountData = accountDoc.data() as Account;
        
        // Find the correct installment
        const installmentIndex = loanData.installments.findIndex(i => i.number === installmentNumber);
        if (installmentIndex === -1) throw new Error("Parcela não encontrada.");

        const installmentToUpdate = { ...loanData.installments[installmentIndex] };

        // Create a new updated installment object
        const newPaidAmount = installmentToUpdate.paidAmount + paymentAmount;
        
        installmentToUpdate.paidAmount = parseFloat(newPaidAmount.toFixed(2));

        if (newPaidAmount >= installmentToUpdate.amount - 0.01) { // Tolerance for float precision
          installmentToUpdate.status = 'Pago';
        } else {
          installmentToUpdate.status = 'Parcialmente Pago';
        }
        
        // Create new installments array
        const updatedInstallments = loanData.installments.map(inst => 
            inst.number === installmentNumber ? installmentToUpdate : inst
        );
        
        // Create new payment object and updated payments array
        const newPayment: Payment = {
          id: nanoid(10),
          loanId,
          installmentNumber,
          amount: paymentAmount,
          paymentDate,
          method: paymentMethod,
          destinationAccountId,
        };
        const updatedPayments = [...loanData.payments, newPayment];

        // Check overall loan status
        const allPaid = updatedInstallments.every(i => i.status === 'Pago');
        const newLoanStatus = allPaid ? 'Quitado' : loanData.status;

        // Prepare account updates
        const newBalance = accountData.balance + paymentAmount;
        const paymentTransaction: Transaction = {
          id: nanoid(10),
          date: paymentDate,
          description: `Pagamento recebido de ${loanData.borrowerName} (Parcela #${installmentNumber})`,
          amount: paymentAmount,
          type: 'Receita',
          category: 'Recebimento Empréstimo',
          referenceId: loanId,
          referenceCode: loanData.code,
        };

        // 3. WRITE all changes at the end
        transaction.update(loanRef, {
          installments: updatedInstallments,
          payments: updatedPayments,
          status: newLoanStatus,
        });

        transaction.update(accountRef, {
            balance: newBalance,
            transactions: arrayUnion(paymentTransaction),
        });
      });
    } catch (err: any) {
        console.error("Erro ao registrar pagamento:", err);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `users/${userId}/loans/${loanId} ou users/${userId}/accounts/${destinationAccountId}`,
            operation: 'update',
        }));
    }
  };

  const createTransaction = async (values: NewTransactionFormValues) => {
    if (!firestore || !userId) return;

    try {
        await runTransaction(firestore, async (transaction) => {
            const accountRef = doc(firestore, 'users', userId, 'accounts', values.accountId);
            const accountDoc = await transaction.get(accountRef);
            if (!accountDoc.exists()) throw new Error("Conta não encontrada.");

            const accountData = accountDoc.data() as Account;
            
            const newBalance = values.type === 'Receita' 
                ? accountData.balance + values.amount
                : accountData.balance - values.amount;

            const newTransaction: Transaction = {
                id: nanoid(10),
                ...values
            };

            transaction.update(accountRef, {
                balance: newBalance,
                transactions: arrayUnion(newTransaction)
            });
        });
    } catch (err: any) {
        console.error("Erro ao criar transação:", err);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `users/${userId}/accounts/${values.accountId}`,
            operation: 'update',
            requestResourceData: values,
        }));
        throw err;
    }
  };
  
  const seedDatabase = async () => {
    if (!firestore || !userId) return;
    const batch = writeBatch(firestore);

    // This will seed data under the current user's path
    const userRoot = `users/${userId}`;

    // 1. Seed Accounts (2)
    const accountIds = ['nubank', 'itau'];
    const accountNames = ['Nubank', 'Itaú'];
    const seededAccounts = accountIds.map((id, index) => {
        const accountRef = doc(firestore, userRoot, 'accounts', id);
        const data = {
            id,
            name: accountNames[index],
            balance: Math.random() * 20000 + 5000,
            transactions: [],
        };
        batch.set(accountRef, data);
        return data;
    });
    
    // 2. Seed Clients (4)
    const firstNames = ['Ana', 'Bruno', 'Carla', 'Daniel'];
    const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza'];
    
    const seededClients = firstNames.map((_, index) => {
        const clientRef = doc(collection(firestore, userRoot, 'clients'));
        const client = {
            id: clientRef.id,
            name: `${firstNames[index]} ${lastNames[index]}`,
            cpf: `000.000.000-0${index}`,
            email: `${firstNames[index].toLowerCase()}.${lastNames[index].toLowerCase()}@example.com`,
            phone: `(11) 90000-000${index}`,
            address: `Rua Teste, ${index}, Bairro Exemplo`,
        };
        batch.set(clientRef, client);
        return client;
    });

    // 3. Seed Loans (10)
    for (let i = 0; i < 10; i++) {
        const loanRef = doc(collection(firestore, userRoot, 'loans'));
        const randomClient = seededClients[Math.floor(Math.random() * seededClients.length)];
        const randomAccount = seededAccounts[Math.floor(Math.random() * seededAccounts.length)];
        
        const amount = Math.floor(Math.random() * 9000) + 1000;
        const interestRate = parseFloat((Math.random() * 5 + 1).toFixed(2));
        const numInstallments = [3, 6, 12, 24][Math.floor(Math.random() * 4)];
        const startDate = format(add(new Date(), { months: -Math.floor(Math.random() * 6) }), 'yyyy-MM-dd');
        
        const monthlyInterestRate = interestRate / 100;
        const installmentAmount = (amount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numInstallments))) / (Math.pow(1 + monthlyInterestRate, numInstallments) - 1);

        let remainingBalance = amount;
        const installments = Array.from({ length: numInstallments }).map((_, j) => {
            const interest = remainingBalance * monthlyInterestRate;
            const principal = installmentAmount - interest;
            remainingBalance -= principal;

            const dueDate = add(new Date(`${startDate}T00:00:00`), { months: j + 1 });
            return {
                number: j + 1,
                dueDate: format(dueDate, 'yyyy-MM-dd'),
                amount: parseFloat(installmentAmount.toFixed(2)),
                principal: parseFloat(principal.toFixed(2)),
                interest: parseFloat(interest.toFixed(2)),
                paidAmount: 0,
                status: 'Pendente' as const,
            };
        });
        
        batch.set(loanRef, {
            id: loanRef.id,
            code: `EMP-${(i + 1).toString().padStart(3, '0')}`,
            borrowerName: randomClient.name,
            clientId: randomClient.id,
            accountId: randomAccount.id,
            amount,
            interestRate,
            startDate,
            status: 'Ativo',
            installments,
            payments: [],
        });
    }

    try {
        await batch.commit();
    } catch(err) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'batch write',
          operation: 'write',
        }));
    }
  };

  const value = {
    accounts,
    clients,
    loans,
    filteredLoans,
    loading,
    timeRange,
    setTimeRange,
    createLoan,
    updateLoan,
    deleteLoan,
    registerPayment,
    seedDatabase,
    createAccount,
    updateAccount,
    deleteAccount,
    createClient,
    updateClient,
    deleteClient,
    createTransaction,
  };

  return (
    <FinancialDataContext.Provider value={value}>
      {children}
    </FinancialDataContext.Provider>
  );
}

export function useFinancialData() {
  const context = React.useContext(FinancialDataContext);
  if (context === undefined) {
    throw new Error('useFinancialData must be used within a FinancialProvider');
  }
  return context;
}
