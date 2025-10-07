export function ArticleCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-gradient-to-br from-background/80 via-background/60 to-background/40 backdrop-blur-xl border-2 border-border/30 rounded-2xl overflow-hidden shadow-lg h-full">
        {/* Image Skeleton */}
        <div className="w-full h-48 bg-muted" />

        {/* Content Skeleton */}
        <div className="p-6 space-y-4">
          {/* Title */}
          <div className="h-6 bg-muted rounded w-3/4" />
          <div className="h-6 bg-muted rounded w-1/2" />

          {/* Excerpt */}
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4 pt-2">
            <div className="h-4 bg-muted rounded w-24" />
            <div className="h-4 bg-muted rounded w-20" />
            <div className="h-4 bg-muted rounded w-16" />
          </div>

          {/* Tags */}
          <div className="flex gap-2 pt-2">
            <div className="h-6 bg-muted rounded w-16" />
            <div className="h-6 bg-muted rounded w-20" />
            <div className="h-6 bg-muted rounded w-14" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function HubHeroSkeleton() {
  return (
    <div className="relative w-full h-[600px] md:h-[700px] bg-gradient-to-br from-muted/30 to-muted/10 animate-pulse">
      <div className="container mx-auto px-4 sm:px-6 h-full flex items-center">
        <div className="max-w-3xl space-y-6">
          {/* Badge */}
          <div className="h-8 bg-muted rounded-full w-32" />

          {/* Title */}
          <div className="space-y-3">
            <div className="h-12 bg-muted rounded w-full" />
            <div className="h-12 bg-muted rounded w-3/4" />
          </div>

          {/* Excerpt */}
          <div className="space-y-2">
            <div className="h-6 bg-muted rounded w-full" />
            <div className="h-6 bg-muted rounded w-5/6" />
          </div>

          {/* Meta */}
          <div className="flex gap-4">
            <div className="h-8 bg-muted rounded w-32" />
            <div className="h-8 bg-muted rounded w-24" />
            <div className="h-8 bg-muted rounded w-28" />
          </div>

          {/* Button */}
          <div className="h-14 bg-muted rounded-xl w-48" />
        </div>
      </div>
    </div>
  );
}

export function ArticleDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Skeleton */}
      <div className="relative w-full h-[500px] bg-muted animate-pulse" />

      {/* Content Skeleton */}
      <div className="container mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-6 animate-pulse">
            {/* Share Buttons */}
            <div className="flex gap-3 pb-8 border-b border-border/50">
              <div className="h-10 bg-muted rounded w-24" />
              <div className="h-10 bg-muted rounded w-24" />
              <div className="h-10 bg-muted rounded w-24" />
              <div className="h-10 bg-muted rounded w-28" />
            </div>

            {/* Content Lines */}
            {[...Array(15)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-3/4" />
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 bg-muted/30 rounded-2xl p-6 animate-pulse">
              <div className="h-6 bg-muted rounded w-48 mb-4" />
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-4 bg-muted rounded w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CategoryFilterSkeleton() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 animate-pulse">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="h-12 bg-muted rounded-xl w-32 flex-shrink-0" />
      ))}
    </div>
  );
}

export function SearchSkeleton() {
  return (
    <div className="w-full max-w-2xl mx-auto animate-pulse">
      <div className="h-14 bg-muted rounded-xl" />
    </div>
  );
}

