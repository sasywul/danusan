export default function MemberLoading() {
  return (
    <div className="space-y-5 animate-pulse pb-4">
      {/* Greeting card skeleton */}
      <div className="bg-slate-200 rounded-2xl p-5 h-32 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="h-4 bg-slate-300 rounded w-1/4 animate-pulse" />
          <div className="h-6 bg-slate-300 rounded w-1/2 animate-pulse" />
        </div>
        <div className="flex gap-6 mt-4">
          <div className="space-y-1">
            <div className="h-6 bg-slate-300 rounded w-12 animate-pulse" />
            <div className="h-3 bg-slate-300 rounded w-10 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="h-6 bg-slate-300 rounded w-20 animate-pulse" />
            <div className="h-3 bg-slate-300 rounded w-14 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Title skeleton */}
      <div className="flex items-center gap-2 px-1">
        <div className="w-5 h-5 bg-slate-300 rounded-full animate-pulse" />
        <div className="h-5 bg-slate-300 rounded w-32 animate-pulse" />
        <div className="h-5 bg-slate-300 rounded-full w-8 animate-pulse" />
      </div>

      {/* Product list skeleton */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-border overflow-hidden p-4"
          >
            {/* Product info skeleton */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 w-full">
                <div className="w-11 h-11 bg-slate-200 rounded-xl shrink-0 animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-2/3 animate-pulse" />
                  <div className="h-3 bg-slate-200 rounded w-1/3 animate-pulse" />
                </div>
              </div>
              <div className="text-right w-12 shrink-0 space-y-1">
                <div className="h-3 bg-slate-200 rounded w-full ml-auto animate-pulse" />
                <div className="h-4 bg-slate-200 rounded w-1/2 ml-auto animate-pulse" />
              </div>
            </div>

            {/* Stepper row skeleton */}
            <div className="h-12 bg-slate-100 rounded-xl mb-3 animate-pulse" />

            {/* Button skeleton */}
            <div className="h-14 bg-slate-200 rounded-xl animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
