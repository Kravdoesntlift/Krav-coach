import { WorkoutSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="bg-zinc-800 rounded-lg h-7 w-40 animate-pulse" />
        <div className="bg-zinc-800 rounded-lg h-4 w-52 animate-pulse" />
      </div>
      <WorkoutSkeleton />
    </div>
  );
}
