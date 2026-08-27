import type { Metadata } from "next";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { listCampaignRules, listProducts } from "@/db/catalog";
import { getTaxRate, listShippingMethods } from "@/db/commerce-config";
import { CheckoutFlow } from "@/features/checkout/checkout-flow";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lorem Ipsum | Dolor Sit Amet",
  description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
};

export default async function CheckoutPage() {
  const [catalog, campaigns, user, shippingMethods, taxRate] = await Promise.all([
    listProducts(),
    listCampaignRules(),
    getChatGPTUser(),
    listShippingMethods(),
    getTaxRate("TR"),
  ]);
  return <CheckoutFlow catalog={catalog} campaigns={campaigns} initialEmail={user?.email ?? ""} shippingMethods={shippingMethods} taxRate={taxRate} />;
}
