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

export type OrdersAnalyticsData = {
  mode: DateFilterMode;
  startDate: string; // YYYY-MM-DD IST
  endDate: string; // YYYY-MM-DD IST
  dateRangeLabel: string;
  selectedRestaurant: RestaurantFilterKey;
  // Profit rates configured
  profitRate: number;
  rates: ProfitRates;
  // Summary KPIs (Strictly delivered orders)
  totalCollections: number;
  totalOrders: number;
  totalItemsSold: number;
  totalProfit: number;
  // Restaurant breakdowns
  restaurantsPerformance: RestaurantPerformance[];
  biryaniNationBreakdown: BiryaniNationBreakdown | null;
  categoryBreakdown: CategoryStat[] | null;
  // Detailed delivered order logs
  deliveredOrders: DeliveredOrderRecord[];
};
