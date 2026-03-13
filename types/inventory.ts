export type InventoryStatus = "Healthy" | "Low Stock" | "Critical";

export type InventoryCategory =
  | "Electronics"
  | "Apparel"
  | "Home Goods"
  | "Office";

export type InventoryItem = {
  id: string;
  sku: string;
  name: string;
  category: InventoryCategory;
  location: string;
  stock: number;
  reorderPoint: number;
  incomingUnits: number;
  status: InventoryStatus;
};

export type InventoryKpi = {
  label: string;
  value: string;
  helperText: string;
};

export type InventoryAiAction = {
  id: string;
  title: string;
  description: string;
  impact: string;
};
