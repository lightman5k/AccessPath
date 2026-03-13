import { Skeleton } from "@/components/ui";

export default function ReportsLoading() {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            className="rounded-lg border border-gray-200 bg-white p-4"
            key={`reports-kpi-skeleton-${index}`}
          >
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-3 h-8 w-24" />
            <Skeleton className="mt-3 h-4 w-36" />
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            className="rounded-lg border border-gray-200 bg-white p-4"
            key={`reports-panel-skeleton-${index}`}
          >
            <Skeleton className="h-6 w-40" />
            <Skeleton className="mt-2 h-4 w-56 max-w-full" />
            <Skeleton className="mt-4 h-40 w-full" />
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="mt-4 h-48 w-full" />
      </section>
    </div>
  );
}
