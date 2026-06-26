import { Skeleton } from "@/components/ui/Skeleton";

export default function HabitsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-3 gap-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card p-3 space-y-1.5">
            <Skeleton className="h-6 w-8" />
            <Skeleton className="h-2.5 w-14" />
          </div>
        ))}
      </div>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-2.5 w-16" />
            </div>
          </div>
          <div className="flex gap-1.5">
            {[...Array(7)].map((_, j) => <Skeleton key={j} className="w-7 h-7 rounded-lg" />)}
          </div>
        </div>
      ))}
    </div>
  );
}
