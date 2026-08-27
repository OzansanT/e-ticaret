import { Storefront } from "@/features";
import { listCampaignRules, listProducts } from "@/db/catalog";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [catalog, campaigns] = await Promise.all([listProducts(), listCampaignRules()]);
  return <Storefront catalog={catalog} campaigns={campaigns} />;
}
