export type LogisticsRouteStatus = "On Time" | "At Risk" | "Delayed";

export type LogisticsRegion = "Midwest" | "South" | "West" | "Northeast";

export type LogisticsRoute = {
  id: string;
  routeCode: string;
  origin: string;
  destination: string;
  region: LogisticsRegion;
  status: LogisticsRouteStatus;
  etaHours: number;
  loadUtilization: number;
  stops: number;
};

export type LogisticsKpi = {
  label: string;
  value: string;
  helperText: string;
};
