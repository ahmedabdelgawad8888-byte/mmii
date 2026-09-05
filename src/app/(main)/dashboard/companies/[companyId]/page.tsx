import { CompanyDetail } from "../_components/companies-workspace";

export default async function Page({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  return <CompanyDetail companyId={companyId} />;
}
