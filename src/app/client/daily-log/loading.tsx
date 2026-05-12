export default function DailyLogLoading() {
  return (
    <div className="space-y-6 pb-24 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-7 w-44 bg-zinc-800 rounded-lg" />
        <div className="h-4 w-36 bg-zinc-800 rounded-lg" />
      </div>

      {/* Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-5">
        <div className="h-4 w-40 bg-zinc-800 rounded" />

        {/* Energy buttons */}
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-1 h-20 bg-zinc-800 rounded-xl" />
          ))}
        </div>

        {/* Textarea */}
        <div className="space-y-1">
          <div className="h-3 w-20 bg-zinc-800 rounded" />
          <div className="h-20 bg-zinc-800 rounded-xl" />
        </div>

        {/* Button */}
        <div className="h-12 bg-zinc-800 rounded-xl" />
      </div>

      {/* Last 7 days */}
      <div className="space-y-3">
        <div className="h-4 w-28 bg-zinc-800 rounded" />
        <div className="flex gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex-1 h-20 bg-zinc-800 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
