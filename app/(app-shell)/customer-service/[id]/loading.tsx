import { Skeleton } from "@/components/ui";

export default function CustomerServiceDetailLoading() {
  return (
    <div className="space-y-6">
      <section className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <Skeleton className="h-10 w-40" />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <article className="rounded-lg border border-gray-200 bg-white p-4 xl:col-span-2">
          <Skeleton className="h-6 w-28" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton className="h-16 w-full" key={`cs-detail-transcript-${index}`} />
            ))}
          </div>
        </article>
        <aside className="rounded-lg border border-gray-200 bg-white p-4">
          <Skeleton className="h-6 w-24" />
          <div className="mt-4 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </aside>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <article className="rounded-lg border border-gray-200 bg-white p-4 xl:col-span-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="mt-4 h-40 w-full" />
        </article>
        <aside className="rounded-lg border border-gray-200 bg-white p-4">
          <Skeleton className="h-6 w-24" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton className="h-14 w-full" key={`cs-detail-timeline-${index}`} />
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
