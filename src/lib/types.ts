import { LucideIcon } from "lucide-react";

export type Client = {
  id: string;
  name: string;
  cpf: string;
  email: string;
  phone: string;
  address: string;
  avatar?: LucideIcon;
};

export type Loan = {
  id: string;
  code: string;
  borrowerName: string;
  clientId: string;
  accountId: string; // ID of the account from which the loan amount was debited
  amount: number;
  interestRate: number;
  iofRate?: number;
  iofValue?: number;
  startDate: string;
  installments: {
    number: number;
    dueDate: string;
    amount: number;
    principal: number;
    interest: number;
    paidAmount: number;
    status: 'Pendente' | 'Pago' | 'Parcialmente Pago' | 'Atrasado';
  }[];
  status: 'Ativo' | 'Atrasado' | 'Pago' | 'Pendente' | 'Quitado';
  payments: Payment[];
};

export type Payment = {
  id: string;
  loanId: string;
  installmentNumber: number;
  amount: number;
  paymentDate: string;
  method?: string; // e.g., 'PIX', 'Boleto'
  destinationAccountId?: string; // ID of the account where the payment was credited
};

export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'Receita' | 'Despesa';
  category: string;
  referenceId?: string; // e.g., Loan ID or Payment ID
  referenceCode?: string; // e.g., Loan Code
}

export type Account = {
  id: string;
  name: string;
  balance: number;
  icon?: LucideIcon;
  transactions: Transaction[];
}
