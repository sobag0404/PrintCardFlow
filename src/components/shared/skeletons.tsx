// PrintCardFlow — Skeleton components for loading states.
import { cn } from "@/lib/utils";

export function ArtRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <div className="pcf-shimmer-bg h-4 w-4 rounded" />
      <div className="pcf-shimmer-bg h-4 w-4 rounded" />
      <div className="pcf-shimmer-bg h-4 flex-1 max-w-[180px] rounded" />
      <div className="pcf-shimmer-bg h-7 w-32 rounded" />
      <div className="pcf-shimmer-bg h-7 w-20 rounded" />
      <div className="pcf-shimmer-bg h-4 w-40 rounded" />
      <div className="pcf-shimmer-bg h-7 w-7 rounded" />
    </div>
  );
}

export function ArtRowSkeletonList({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <ArtRowSkeleton key={i} />
      ))}
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="rounded-lg border p-4">
      <div className="pcf-shimmer-bg h-3 w-16 rounded" />
      <div className="pcf-shimmer-bg mt-2 h-7 w-20 rounded" />
    </div>
  );
}

export function ExportCardSkeleton() {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <div className="pcf-shimmer-bg h-10 w-10 rounded-lg" />
        <div className="flex-1 space-y-1.5">
          <div className="pcf-shimmer-bg h-4 w-32 rounded" />
          <div className="pcf-shimmer-bg h-3 w-48 rounded" />
        </div>
      </div>
      <div className="pcf-shimmer-bg mt-4 h-9 w-full rounded-md" />
    </div>
  );
}

export function HistoryItemSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-md border p-2.5", className)}>
      <div className="pcf-shimmer-bg h-8 w-8 rounded" />
      <div className="flex-1 space-y-1.5">
        <div className="pcf-shimmer-bg h-3.5 w-32 rounded" />
        <div className="pcf-shimmer-bg h-3 w-20 rounded" />
      </div>
      <div className="pcf-shimmer-bg h-6 w-6 rounded" />
    </div>
  );
}
