'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useIntersectionObserver } from '@/hooks/usePerformance';

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight?: number;
  containerHeight?: number;
  overscan?: number;
  className?: string;
  onEndReached?: () => void;
  endReachedThreshold?: number;
}

export default function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight = 100,
  containerHeight = 400,
  overscan = 5,
  className = '',
  onEndReached,
  endReachedThreshold = 0.8
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const { isIntersecting, setElement } = useIntersectionObserver();

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);

    // Check if we've reached the end
    if (onEndReached) {
      const scrollPercentage = (newScrollTop + containerHeight) / totalHeight;
      if (scrollPercentage >= endReachedThreshold) {
        onEndReached();
      }
    }
  };

  return (
    <div
      ref={(el) => {
        setContainerRef(el);
        setElement(el);
      }}
      className={className}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {isIntersecting &&
            visibleItems.map((item, index) => (
              <div
                key={visibleRange.startIndex + index}
                style={{ height: itemHeight }}
              >
                {renderItem(item, visibleRange.startIndex + index)}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// Optimized grid component for trip cards
interface OptimizedGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  columns?: number;
  gap?: number;
  className?: string;
  loadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
}

export function OptimizedGrid<T>({
  items,
  renderItem,
  columns = 3,
  gap = 24,
  className = '',
  loadMore,
  hasMore = false,
  loading = false
}: OptimizedGridProps<T>) {
  const [visibleItems, setVisibleItems] = useState(12); // Initial load
  const { isIntersecting, setElement } = useIntersectionObserver();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isIntersecting && hasMore && !loading && loadMore) {
      loadMore();
    }
  }, [isIntersecting, hasMore, loading, loadMore]);

  const handleLoadMore = () => {
    setVisibleItems(prev => Math.min(prev + 12, items.length));
  };

  const displayedItems = items.slice(0, visibleItems);

  return (
    <div className={className}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: `${gap}px`
        }}
      >
        {displayedItems.map((item, index) => (
          <div key={index}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {/* Load more trigger */}
      {visibleItems < items.length && (
        <div
          ref={(el) => {
            loadMoreRef.current = el;
            setElement(el);
          }}
          className="flex justify-center mt-8"
        >
          <button
            onClick={handleLoadMore}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}

// Infinite scroll hook for performance optimization
export function useInfiniteScroll<T>(
  initialItems: T[],
  fetchMore: () => Promise<T[]>,
  pageSize = 12
) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const newItems = await fetchMore();
      
      if (newItems.length === 0) {
        setHasMore(false);
      } else {
        setItems(prev => [...prev, ...newItems]);
        if (newItems.length < pageSize) {
          setHasMore(false);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more items');
    } finally {
      setLoading(false);
    }
  };

  const reset = (newItems: T[]) => {
    setItems(newItems);
    setHasMore(true);
    setError(null);
  };

  return {
    items,
    loading,
    hasMore,
    error,
    loadMore,
    reset
  };
}
