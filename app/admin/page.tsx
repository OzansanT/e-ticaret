import type { Metadata } from "next";
import Link from "next/link";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { listProducts } from "@/db/catalog";
import { AdminDashboard } from "@/features/admin/admin-dashboard";
import { isCurrentUserAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Lorem Ipsum | Dolor Sit Amet" };

export default async function AdminPage() {
  await requireChatGPTUser("/admin");
  if (!(await isCurrentUserAdmin())) {
    return <main className="access-denied"><span className="eyebrow">Lorem ipsum</span><h1>Dolor sit amet.</h1><p>Consectetur adipiscing elit, sed do eiusmod tempor.</p><Link className="primary-link" href="/">Lorem ipsum</Link></main>;
  }
  return <AdminDashboard initialProducts={await listProducts()} />;
}
