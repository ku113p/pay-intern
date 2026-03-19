export function SkeletonLine({ width = 'w-full', height = 'h-4' }: { width?: string; height?: string }) {
  return <div className={`skeleton ${width} ${height}`} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <SkeletonLine width="w-2/3" height="h-5" />
          <SkeletonLine width="w-1/3" height="h-3" />
        </div>
        <div className="flex gap-1.5">
          <SkeletonLine width="w-16" height="h-6" />
          <SkeletonLine width="w-16" height="h-6" />
        </div>
      </div>
      <SkeletonLine width="w-full" height="h-3" />
      <SkeletonLine width="w-4/5" height="h-3" />
      <div className="flex gap-1.5 pt-1">
        <SkeletonLine width="w-14" height="h-5" />
        <SkeletonLine width="w-14" height="h-5" />
        <SkeletonLine width="w-14" height="h-5" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
