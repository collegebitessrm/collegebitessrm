import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AnalyticsDashboard } from "@/components/admin/analytics/analytics-dashboard";
import { parseKpiOverridesMap } from "@/lib/data/analytics-types";
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
  const cookieStore = await cookies();
  const savedCookieRates = cookieStore.get("cb_profit_rates")?.value;
  const savedCookieOverridesRaw = cookieStore.get("cb_analytics_kpi_overrides")?.value;
  if (savedCookieOverridesRaw) {
    try {
      cookieStore.delete("cb_analytics_kpi_overrides");
    } catch {
      // ignore
    }
  }
  const kpiOverrides = parseKpiOverridesMap(savedCookieOverridesRaw);

  const analyticsData = await getOrdersAnalyticsData({
    mode: searchParams.mode,
    startDate: searchParams.from,
    endDate: searchParams.to,
    restaurant: searchParams.restaurant,
    profitRate: searchParams.rate || savedCookieRates,
  });

  analyticsData.kpiOverrides = kpiOverrides;

  return (
    <div className="pb-12">
      <AnalyticsDashboard data={analyticsData} />
    </div>
  );
}