export default function AdminLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Title skeleton */}
      <div className="space-y-2">
        <div className="h-7 bg-slate-200 rounded w-1/4 animate-pulse" />
        <div className="h-4 bg-slate-200 rounded w-1/3 animate-pulse" />
      </div>

      {/* Financial Metrics Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-slate-100 rounded-2xl p-6 h-32 flex justify-between items-center">
          <div className="space-y-3 flex-1">
            <div className="h-3 bg-slate-200 rounded w-1/4 animate-pulse" />
            <div className="h-8 bg-slate-200 rounded w-1/2 animate-pulse" />
            <div className="h-3 bg-slate-200 rounded w-3/4 animate-pulse" />
          </div>
          <div className="w-12 h-12 bg-slate-200 rounded-xl shrink-0 animate-pulse" />
        </div>
        <div className="bg-slate-100 rounded-2xl p-6 h-32 flex justify-between items-center">
          <div className="space-y-3 flex-1">
            <div className="h-3 bg-slate-200 rounded w-1/4 animate-pulse" />
            <div className="h-8 bg-slate-200 rounded w-1/2 animate-pulse" />
            <div className="h-3 bg-slate-200 rounded w-3/4 animate-pulse" />
          </div>
          <div className="w-12 h-12 bg-slate-200 rounded-xl shrink-0 animate-pulse" />
        </div>
      </div>

      {/* Stats Cards Skeletons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-border p-5 h-32 flex flex-col justify-between"
          >
            <div className="w-10 h-10 bg-slate-200 rounded-xl animate-pulse" />
            <div className="space-y-1">
              <div className="h-5 bg-slate-200 rounded w-2/3 animate-pulse" />
              <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border">
          <div className="h-5 bg-slate-200 rounded w-1/3 animate-pulse" />
        </div>
        <div className="p-5 space-y-4">
          <div className="h-4 bg-slate-100 rounded w-full animate-pulse" />
          <div className="h-4 bg-slate-100 rounded w-full animate-pulse" />
          <div className="h-4 bg-slate-100 rounded w-full animate-pulse" />
          <div className="h-4 bg-slate-100 rounded w-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
