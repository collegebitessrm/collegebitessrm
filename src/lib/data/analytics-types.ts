export type DateFilterMode = "today" | "custom";
export type RestaurantFilterKey = "all" | "biryani" | "triangle" | "home";

export const RESTAURANT_TABS: { key: RestaurantFilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "biryani", label: "Biriyani Nation" },
  { key: "triangle", label: "Triangle Food Court" },
  { key: "home", label: "Local Home Kitchen" },
];

/** Standard commission profit per item sold in a delivered order (₹10/item default). */
export const DEFAULT_COMMISSION_PER_ITEM = 10;

/** Granular profit rates per restaurant and Biryani Nation sub-categories. */
export type ProfitRates = {
  biryani: {
    full: number;
    single: number;
    starters: number;
    chinese: number;
  };
  triangle: number;
  home: number;
};

export const DEFAULT_PROFIT_RATES: ProfitRates = {
  biryani: {
    full: 10,
    single: 10,
    starters: 10,
    chinese: 10,
  },
  triangle: 10,
  home: 10,
};

export type AnalyticsItemDetail = {
  dishName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  commission: number;
  categoryTag?: "full" | "single" | "starters" | "chinese" | "other";
};

export type DeliveredOrderRecord = {
  id: string;
  dailyNumber: number;
  token: string;
  createdAt: string;
  formattedTime: string;
  studentName: string;
  contactPhone: string;
  restaurantId: string;
  restaurantName: string;
  restaurantKey: RestaurantFilterKey;
  itemCount: number;
  items: AnalyticsItemDetail[];
  totalAmount: number;
  profit: number;
  status: "delivered";
};

export type RestaurantPerformance = {
  id: string;
  name: string;
  key: RestaurantFilterKey;
  isActive: boolean;
  deliveredOrders: number;
  itemsSold: number;
  collections: number;
  profit: number;
  avgOrderValue: number;
  actualProfit?: number;
  actualCollections?: number;
  actualOrders?: number;
  actualItemsSold?: number;
  adjustments?: KpiAdjustmentTotals;
  isEdited?: boolean;
};

export type CategoryStat = {
  categoryName: string;
  itemsSold: number;
  collections: number;
  ratePerItem: number;
  profit: number;
};

export type BiryaniNationBreakdown = {
  fulls: { count: number; collections: number; rate: number; profit: number };
  singles: { count: number; collections: number; rate: number; profit: number };
  starters: { count: number; collections: number; rate: number; profit: number };
  chinese: { count: number; collections: number; rate: number; profit: number };
  others: { count: number; collections: number; rate: number; profit: number };
  totalItems: number;
  totalCollections: number;
  totalProfit: number;
};

export type KpiOverrides = {
  collections?: number | null;
  profit?: number | null;
  orders?: number | null;
  itemsSold?: number | null;
};

export type RestaurantKpiOverridesMap = {
  all?: KpiOverrides | null;
  biryani?: KpiOverrides | null;
  triangle?: KpiOverrides | null;
  home?: KpiOverrides | null;
};

export function parseKpiOverridesMap(raw: unknown): RestaurantKpiOverridesMap {
  if (!raw) return {};
  let obj: any = raw;
  if (typeof raw === "string") {
    try {
      obj = JSON.parse(decodeURIComponent(raw));
    } catch {
      try {
        obj = JSON.parse(raw);
      } catch {
        return {};
      }
    }
  }
  if (!obj || typeof obj !== "object") return {};

  if ("all" in obj || "biryani" in obj || "triangle" in obj || "home" in obj) {
    return {
      all: obj.all ?? null,
      biryani: obj.biryani ?? null,
      triangle: obj.triangle ?? null,
      home: obj.home ?? null,
    };
  }

  if ("collections" in obj || "profit" in obj || "orders" in obj || "itemsSold" in obj) {
    return {
      all: {
        collections: typeof obj.collections === "number" ? obj.collections : null,
        profit: typeof obj.profit === "number" ? obj.profit : null,
        orders: typeof obj.orders === "number" ? obj.orders : null,
        itemsSold: typeof obj.itemsSold === "number" ? obj.itemsSold : null,
      },
    };
  }

  return {};
}

export type KpiType = "collections" | "profit" | "orders" | "items_sold";

export type KpiAdjustment = {
  id: string;
  restaurantId: string;
  restaurantName?: string;
  restaurantKey: RestaurantFilterKey;
  businessDate: string; // YYYY-MM-DD
  kpiType: KpiType;
  amount: number;
  reason: string;
  adminId?: string | null;
  createdBy?: string | null;
  createdAt: string;
  isReversed: boolean;
  reversedAt?: string | null;
  reversedBy?: string | null;
  reversalReason?: string | null;
};

export type KpiAdjustmentTotals = {
  collections: number;
  profit: number;
  orders: number;
  itemsSold: number;
};

export type PartnerRestaurantInfo = {
  id: string;
  name: string;
  key: RestaurantFilterKey;
};

export type OrdersAnalyticsData = {
  mode: DateFilterMode;
  startDate: string; // YYYY-MM-DD IST
  endDate: string; // YYYY-MM-DD IST
  dateRangeLabel: string;
  selectedRestaurant: RestaurantFilterKey;
  // Profit rates configured
  profitRate: number;
  rates: ProfitRates;
  // Summary KPIs (Strictly delivered orders - baseline calculated)
  totalCollections: number;
  totalOrders: number;
  totalItemsSold: number;
  totalProfit: number;
  // Partner restaurants for mapping and selection
  partnerRestaurants: PartnerRestaurantInfo[];
  // Active manual KPI adjustments for the active date range
  adjustments: KpiAdjustment[];
  restaurantAdjustments: Record<RestaurantFilterKey, KpiAdjustmentTotals>;
  totalAdjustments: KpiAdjustmentTotals;
  // Optional KPI display overrides per restaurant tab (legacy)
  kpiOverrides?: RestaurantKpiOverridesMap | null;
  // Restaurant breakdowns
  restaurantsPerformance: RestaurantPerformance[];
  biryaniNationBreakdown: BiryaniNationBreakdown | null;
  categoryBreakdown: CategoryStat[] | null;
  // Detailed delivered order logs
  deliveredOrders: DeliveredOrderRecord[];
};

