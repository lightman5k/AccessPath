import { Skeleton } from "@/components/ui";

export default function IntegrationsLoading() {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            className="rounded-lg border border-gray-200 bg-white p-4"
            key={`integration-skeleton-${index}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-56 max-w-full" />
              </div>
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="mt-4 h-4 w-36" />
            <div className="mt-4 flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-36" />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
