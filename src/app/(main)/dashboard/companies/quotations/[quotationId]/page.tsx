import { QuotationDetail } from "../../_components/companies-workspace";

export default async function Page({ params }: { params: Promise<{ quotationId: string }> }) {
  const { quotationId } = await params;
  return <QuotationDetail quotationId={quotationId} />;
}
