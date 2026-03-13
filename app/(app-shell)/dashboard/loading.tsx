import { Skeleton } from "@/components/ui";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            className="rounded-lg border border-gray-200 bg-white p-4"
            key={`kpi-skeleton-${index}`}
          >
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-3 h-8 w-24" />
            <Skeleton className="mt-3 h-4 w-36" />
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="mt-4 h-64 w-full" />
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="mt-4 h-40 w-full" />
          </div>
        </div>
        <aside className="rounded-lg border border-gray-200 bg-white p-4">
          <Skeleton className="h-6 w-24" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton className="h-14 w-full" key={`insight-skeleton-${index}`} />
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
