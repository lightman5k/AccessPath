import { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

/**
 * Card: generic bordered surface for grouped content sections.
 */
type CardProps<T extends ElementType = "section"> = {
  as?: T;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export function Card<T extends ElementType = "section">({
  as,
  children,
  className,
  ...props
}: CardProps<T>) {
  const Component = as ?? "section";
  const classes = `rounded-lg border border-gray-200 bg-white p-4 ${
    className ?? ""
  }`.trim();

  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
}
