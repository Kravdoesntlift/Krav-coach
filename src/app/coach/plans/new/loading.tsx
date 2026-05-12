import { SkeletonCard, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-64" />
      </div>
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
