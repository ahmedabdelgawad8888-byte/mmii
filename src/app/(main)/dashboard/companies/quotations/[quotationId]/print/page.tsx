import { QuotationDocument } from "../../../_components/quotation-document";

export default async function Page({ params }: { params: Promise<{ quotationId: string }> }) {
  const { quotationId } = await params;
  return <QuotationDocument quotationId={quotationId} />;
}
