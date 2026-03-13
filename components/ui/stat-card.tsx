import { ReactNode } from "react";
import { Card } from "./card";

/**
 * StatCard: compact KPI card with title, value, and optional supporting text.
 */
type StatCardProps = {
  label: string;
  value: ReactNode;
  helperText?: ReactNode;
  className?: string;
};

export function StatCard({ label, value, helperText, className }: StatCardProps) {
  return (
    <Card as="article" className={className}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {helperText ? <p className="mt-1 text-sm text-gray-600">{helperText}</p> : null}
    </Card>
  );
}
