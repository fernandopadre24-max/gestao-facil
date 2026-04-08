import type { Loan, Account, Client } from '@/lib/types';
import { Library, Wallet, User as UserIcon } from 'lucide-react';

export const clients: Client[] = [
  {
    id: 'client-1',
    name: 'João da Silva',
    cpf: '123.456.789-00',
    phone: '(11) 98765-4321',
    address: 'Rua das Flores, 123, São Paulo, SP',
    avatar: UserIcon
  },
  {
    id: 'client-2',
    name: 'Maria Oliveira',
    cpf: '987.654.321-00',
    phone: '(21) 91234-5678',
    address: 'Avenida Copacabana, 456, Rio de Janeiro, RJ',
    avatar: UserIcon
  },
    {
    id: 'client-3',
    name: 'Fernando Sena',
    cpf: '367.904.865-34',
    phone: '(71) 8118-4589',
    address: 'Trv. Does Leoes 19 Pernambues',
    avatar: UserIcon
  },
]


export const loans: Loan[] = [
  {
    id: 'EMP-232570',
    borrowerName: 'João da Silva',
    clientId: 'client-1',
    amount: 1500,
    interestRate: 10,
    startDate: '2025-11-08',
    status: 'Ativo',
    installments: [
      {
        number: 1,
        dueDate: '2025-12-08',
        amount: 525.0,
        principal: 500.0,
        interest: 25.0,
        paidAmount: 525.0,
        status: 'Pago',
      },
      {
        number: 2,
        dueDate: '2026-01-08',
        amount: 525.0,
        principal: 500.0,
        interest: 25.0,
        paidAmount: 0,
        status: 'Pendente',
      },
      {
        number: 3,
        dueDate: '2026-02-08',
        amount: 525.0,
        principal: 500.0,
        interest: 25.0,
        paidAmount: 0,
        status: 'Pendente',
      },
    ],
    payments: [
      { id: 'PAG-001', loanId: 'EMP-232570', amount: 525.0, paymentDate: '2025-12-05' },
    ],
  },
  {
    id: 'EMP-761238',
    borrowerName: 'Maria Oliveira',
    clientId: 'client-2',
    amount: 500,
    interestRate: 12,
    startDate: '2025-11-16',
    status: 'Quitado',
    installments: [
       { number: 1, dueDate: '2025-12-16', amount: 105, principal: 100, interest: 5, paidAmount: 105, status: 'Pago' },
       { number: 2, dueDate: '2026-01-16', amount: 105, principal: 100, interest: 5, paidAmount: 105, status: 'Pago' },
       { number: 3, dueDate: '2026-02-16', amount: 105, principal: 100, interest: 5, paidAmount: 105, status: 'Pago' },
       { number: 4, dueDate: '2026-03-16', amount: 105, principal: 100, interest: 5, paidAmount: 105, status: 'Pago' },
       { number: 5, dueDate: '2026-04-16', amount: 105, principal: 100, interest: 5, paidAmount: 105, status: 'Pago' },
    ],
    payments: [
        { id: 'PAG-002', loanId: 'EMP-761238', amount: 525, paymentDate: '2026-04-15' },
    ]
  },
  {
    id: 'EMP-9368',
    borrowerName: 'Fernando Sena',
    clientId: 'client-3',
    amount: 5000,
    interestRate: 8,
    startDate: '2025-11-17',
    status: 'Ativo',
    installments: Array.from({ length: 6 }, (_, i) => ({
      number: i + 1,
      dueDate: new Date(2025, 11, 17 + i * 30).toISOString().split('T')[0],
      amount: 875,
      principal: 833.33,
      interest: 41.67,
      paidAmount: 0,
      status: 'Pendente',
    })),
    payments: []
  },
    {
    id: 'EMP-6001',
    borrowerName: 'Fernando Sena',
    clientId: 'client-3',
    amount: 5000,
    interestRate: 8,
    startDate: '2025-11-17',
    status: 'Ativo',
    installments: Array.from({ length: 12 }, (_, i) => ({
      number: i + 1,
      dueDate: new Date(2025, 11, 17 + i * 30).toISOString().split('T')[0],
      amount: 458.33,
      principal: 416.67,
      interest: 41.66,
      paidAmount: 0,
      status: 'Pendente',
    })),
    payments: []
  },
   {
    id: 'EMP-6147',
    borrowerName: 'Fernando Sena',
    clientId: 'client-3',
    amount: 10000,
    interestRate: 8,
    startDate: '2025-12-11',
    status: 'Ativo',
    installments: Array.from({ length: 12 }, (_, i) => ({
      number: i + 1,
      dueDate: new Date(2025, 11, 17 + i * 30).toISOString().split('T')[0],
      amount: 458.33,
      principal: 416.67,
      interest: 41.66,
      paidAmount: 0,
      status: 'Pendente',
    })),
    payments: []
  },
];


export const accounts: Account[] = [
    {
        id: 'investimentos',
        name: 'Investimentos',
        balance: 40000.00,
        icon: Library,
        transactions: [
            { id: 'TR-001', date: '2024-07-01', description: 'Aplicação Tesouro Selic', amount: 5000, type: 'Despesa', category: 'Investimento' },
            { id: 'TR-002', date: '2024-07-10', description: 'Dividendos FII XPTO', amount: 150.75, type: 'Receita', category: 'Dividendos' },
            { id: 'TR-003', date: '2024-07-20', description: 'Resgate Fundo Multimercado', amount: 2000, type: 'Receita', category: 'Resgate' }
        ]
    },
    {
        id: 'nubank',
        name: 'Nubank',
        balance: 4128.10,
        icon: Wallet,
        transactions: [
            { id: 'TR-004', date: '2024-07-05', description: 'Supermercado', amount: 250.40, type: 'Despesa', category: 'Alimentação' },
            { id: 'TR-005', date: '2024-07-08', description: 'Salário', amount: 6000.00, type: 'Receita', category: 'Salário' },
            { id: 'TR-006', date: '2024-07-15', description: 'Pagamento Fatura Cartão', amount: 1500.00, type: 'Despesa', category: 'Cartão de Crédito' }
        ]
    }
]
