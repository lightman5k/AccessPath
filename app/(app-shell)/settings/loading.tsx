import { Skeleton } from "@/components/ui";

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            className="rounded-lg border border-gray-200 bg-white p-4"
            key={`settings-card-skeleton-${index}`}
          >
            <Skeleton className="h-6 w-32" />
            <div className="mt-4 space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="mt-4 h-40 w-full" />
      </section>
    </div>
  );
}
