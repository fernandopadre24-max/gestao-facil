'use server';

/**
 * @fileOverview This file defines a Genkit flow for assessing credit risk of new borrowers.
 *
 * It uses AI to analyze historical data and available information to provide a risk assessment.
 * - assessCreditRisk - The function to assess credit risk.
 * - CreditRiskInput - The input type for the assessCreditRisk function.
 * - CreditRiskOutput - The output type for the assessCreditrisk function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CreditRiskInputSchema = z.object({
  borrowerData: z.string().describe('Detailed information about the borrower, including financial history, credit score, loan history, payment performance and other relevant data. This data will be in JSON format.'),
  loanAmount: z.number().describe('The amount of the loan requested.'),
  loanPurpose: z.string().describe('The stated purpose of the loan.'),
});
export type CreditRiskInput = z.infer<typeof CreditRiskInputSchema>;

const CreditRiskOutputSchema = z.object({
  riskLevel: z.enum(['Low', 'Medium', 'High']).describe('The assessed risk level of the borrower.'),
  riskFactors: z.string().describe('A summary of the key factors contributing to the risk assessment.'),
  recommendedAction: z.string().describe('Recommended action based on the risk assessment, such as approve, deny, or request additional information.'),
});
export type CreditRiskOutput = z.infer<typeof CreditRiskOutputSchema>;

export async function assessCreditRisk(input: CreditRiskInput): Promise<CreditRiskOutput> {
  return assessCreditRiskFlow(input);
}

const assessCreditRiskPrompt = ai.definePrompt({
  name: 'assessCreditRiskPrompt',
  input: {schema: CreditRiskInputSchema},
  output: {schema: CreditRiskOutputSchema},
  prompt: `You are an expert credit risk analyst.
  Assess the credit risk of a borrower based on the following information provided in JSON format:

  Borrower Data: {{{borrowerData}}}
  Loan Amount: {{{loanAmount}}}
  Loan Purpose: {{{loanPurpose}}}

  Analyze the provided data, which includes the client's profile, their loan history (if any), and payment performance.
  
  Based on your analysis, provide a comprehensive risk assessment. Your output must include:
  - riskLevel: The assessed risk level for the borrower (Low, Medium, or High).
  - riskFactors: A concise summary of the key factors that led to your risk assessment. Mention positive and negative points.
  - recommendedAction: A clear recommended action (e.g., "Approve Loan", "Deny Loan", "Approve with caution", "Request more documents").

  Ensure that the output is structured according to the CreditRiskOutputSchema.
  `,
});

const assessCreditRiskFlow = ai.defineFlow(
  {
    name: 'assessCreditRiskFlow',
    inputSchema: CreditRiskInputSchema,
    outputSchema: CreditRiskOutputSchema,
  },
  async input => {
    const {output} = await assessCreditRiskPrompt(input);
    return output!;
  }
);
