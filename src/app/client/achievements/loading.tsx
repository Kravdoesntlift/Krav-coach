import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-1.5 w-full rounded-full" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card p-4 flex items-center gap-4 animate-pulse">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800 shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
