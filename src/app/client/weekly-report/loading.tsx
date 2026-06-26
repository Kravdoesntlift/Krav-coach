import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";

export default function WeeklyReportLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <Skeleton className="h-7 w-48" />
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-4 space-y-2">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-7 w-10" />
          </div>
        ))}
      </div>
      {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}
