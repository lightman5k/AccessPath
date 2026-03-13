import { Skeleton } from "@/components/ui";

export default function WorkflowBuilderLoading() {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <aside className="rounded-lg border border-gray-200 bg-white p-4 xl:col-span-3">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="mt-2 h-4 w-40" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton className="h-16 w-full" key={`wf-library-skeleton-${index}`} />
            ))}
          </div>
        </aside>

        <article className="rounded-lg border border-gray-200 bg-white p-4 xl:col-span-6">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="mt-2 h-4 w-56 max-w-full" />
          <Skeleton className="mt-4 h-64 w-full" />
        </article>

        <aside className="rounded-lg border border-gray-200 bg-white p-4 xl:col-span-3">
          <Skeleton className="h-6 w-28" />
          <div className="mt-4 space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-32" />
          </div>
        </aside>
      </section>
    </div>
  );
}
