import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BackToDashboardLink } from "@/components/admin/back-to-dashboard-link";
import { OrderDetailView } from "@/components/admin/order-detail-view";
import { getAdminOrderDetail } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Order · MuteBites Admin" };

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  const order = await getAdminOrderDetail(id);
  if (!order) notFound();

  return (
    <>
      <BackToDashboardLink />
      <OrderDetailView order={order} />
    </>
  );
}
