type EmptyStateProps = {
  title: string;
  description?: string;
  className?: string;
};

export function EmptyState({ title, description, className }: EmptyStateProps) {
  return (
    <div
      className={`rounded-md border border-dashed border-gray-300 bg-gray-50 px-3 py-6 text-center ${className ?? ""}`.trim()}
    >
      <p className="text-sm font-medium text-gray-700">{title}</p>
      {description ? <p className="mt-1 text-sm text-gray-500">{description}</p> : null}
    </div>
  );
}
