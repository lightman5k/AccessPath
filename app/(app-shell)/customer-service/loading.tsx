import { Skeleton } from "@/components/ui";

export default function CustomerServiceLoading() {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            className="rounded-lg border border-gray-200 bg-white p-4"
            key={`cs-kpi-skeleton-${index}`}
          >
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-3 h-8 w-20" />
            <Skeleton className="mt-3 h-4 w-32" />
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <aside className="rounded-lg border border-gray-200 bg-white p-4">
          <Skeleton className="h-6 w-16" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton className="h-14 w-full" key={`queue-skeleton-${index}`} />
            ))}
          </div>
        </aside>

        <article className="rounded-lg border border-gray-200 bg-white p-4 xl:col-span-2">
          <Skeleton className="h-6 w-40" />
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
          <Skeleton className="mt-4 h-40 w-full" />
        </article>
      </section>
    </div>
  );
}
