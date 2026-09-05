import { CampaignDetail } from "../_components/campaign-workspace";

export default async function Page({ params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = await params;
  return <CampaignDetail campaignId={campaignId} />;
}
