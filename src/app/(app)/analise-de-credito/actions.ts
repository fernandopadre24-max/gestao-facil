'use server';

import { assessCreditRisk } from '@/ai/flows/credit-risk-assessment';
import type { CreditRiskInput, CreditRiskOutput } from '@/ai/flows/credit-risk-assessment';
import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { Client, Loan } from '@/lib/types';


if (getApps().length === 0) {
  // This is a temporary workaround for a bug in the environment.
  // In a real-world scenario, you would not parse the service account key like this.
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : undefined;

  if (!serviceAccount) {
    // In a development or non-server environment, we might not have the service account.
    // Let's not throw an error, but AI analysis will be limited.
    console.warn('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. Credit analysis will be limited.');
  } else {
      initializeApp({
        credential: cert(serviceAccount),
        databaseURL: firebaseConfig.databaseURL,
        projectId: firebaseConfig.projectId,
      });
  }
}

const db = getApps().length > 0 ? getFirestore() : null;

export type AnalysisResult = {
  aiResponse: CreditRiskOutput;
  clientData?: Client;
  clientExists: boolean;
};

export async function runCreditAnalysis(
  cpf: string,
  loanAmount: number,
  loanPurpose: string,
  userId?: string | null
): Promise<AnalysisResult> {
  try {
    const cleanCpf = cpf.replace(/\D/g, '');
    let borrowerData: any = { cpf: cleanCpf };
    let clientExists = false;
    let foundClient: Client | undefined = undefined;

    if (db && userId) {
        // Search for client by CPF in the user's subcollection
        const clientsRef = db.collection('users').doc(userId).collection('clients');
        const clientSnapshot = await clientsRef.where('cpf', '==', cleanCpf).limit(1).get();

        if (!clientSnapshot.empty) {
          clientExists = true;
          const clientDoc = clientSnapshot.docs[0];
          foundClient = { id: clientDoc.id, ...clientDoc.data() } as Client;

          // If client exists, gather more data from the user's loans
          const loansRef = db.collection('users').doc(userId).collection('loans');
          const loansSnapshot = await loansRef.where('clientId', '==', foundClient.id).get();
          
          const clientLoansData = loansSnapshot.docs.map(doc => {
            const data = doc.data() as Loan;
            return {
              ...data,
              id: doc.id,
            };
          });


          borrowerData = {
            profile: foundClient,
            loanHistory: clientLoansData.map(loan => ({
              amount: loan.amount,
              status: loan.status,
              startDate: loan.startDate,
              installmentsCount: loan.installments.length,
              paidInstallments: loan.installments.filter(i => i.status === 'Pago').length
            })),
            paymentSummary: {
              totalPaid: clientLoansData.flatMap(l => l.payments || []).reduce((acc, p) => acc + p.amount, 0),
              overdueInstallments: clientLoansData.flatMap(l => l.installments || []).filter(i => (i.status === 'Pendente' || i.status === 'Parcialmente Pago') && new Date(i.dueDate) < new Date()).length,
            }
          };
        } else {
            borrowerData.message = "No existing client found with this CPF for this user. Analysis will be based on general assumptions."
        }
    } else {
        borrowerData.message = "Database not available or user not logged in. Analysis will be based on general assumptions."
    }

    const aiInput: CreditRiskInput = {
      borrowerData: JSON.stringify(borrowerData, null, 2),
      loanAmount,
      loanPurpose,
    };

    const aiResult = await assessCreditRisk(aiInput);
    
    return {
      aiResponse: aiResult,
      clientData: foundClient,
      clientExists,
    };

  } catch (error) {
    console.error('Error in credit analysis:', error);
    // @ts-ignore
    throw new Error(error.message || 'Falha ao realizar a análise de crédito. Tente novamente.');
  }
}
