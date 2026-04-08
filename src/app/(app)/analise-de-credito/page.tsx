import { PageHeader } from '@/components/page-header';
import { CreditAnalysisForm } from './credit-analysis-form';

export default function CreditAnalysisPage() {
  return (
    <>
      <PageHeader
        title="Análise de Crédito com IA"
        description="Utilize nosso modelo de IA para avaliar o risco de crédito de novos mutuários."
      />
      <CreditAnalysisForm />
    </>
  );
}
