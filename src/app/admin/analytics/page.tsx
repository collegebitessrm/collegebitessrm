import type { Metadata } from "next";
import { AnalyticsDashboard } from "@/components/admin/analytics/analytics-dashboard";
import { getOrdersAnalyticsData } from "@/lib/data/analytics";

export const metadata: Metadata = {
  title: "Orders Analytics · College Bites Admin",
};

type PageProps = {
  searchParams: Promise<{
    mode?: string;
    from?: string;
    to?: string;
    restaurant?: string;
    rate?: string;
  }>;
};

export default async function AdminAnalyticsPage(props: PageProps) {
  const searchParams = await props.searchParams;

  const analyticsData = await getOrdersAnalyticsData({
    mode: searchParams.mode,
    startDate: searchParams.from,
    endDate: searchParams.to,
    restaurant: searchParams.restaurant,
    profitRate: searchParams.rate,
  });

  return (
    <div className="pb-12">
      <AnalyticsDashboard data={analyticsData} />
    </div>
  );
}