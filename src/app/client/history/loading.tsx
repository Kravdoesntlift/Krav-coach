import { SkeletonCard, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );
}
