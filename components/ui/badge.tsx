import { ReactNode } from "react";

/**
 * Badge: small status/tag label with accessible text sizing.
 */
export type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "info";

const badgeVariantClasses: Record<BadgeVariant, string> = {
  neutral: "bg-gray-100 text-gray-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
};

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

export function Badge({ children, variant = "neutral", className }: BadgeProps) {
  const classes =
    `inline-flex rounded-full px-2 py-1 text-xs font-medium ${badgeVariantClasses[variant]} ${className ?? ""}`.trim();

  return <span className={classes}>{children}</span>;
}
