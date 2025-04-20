import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'text':
        return 'rounded-md';
      case 'circular':
        return 'rounded-full';
      case 'rectangular':
        return '';
      case 'rounded':
        return 'rounded-lg';
      default:
        return 'rounded-md';
    }
  };

  const getAnimationClasses = () => {
    switch (animation) {
      case 'pulse':
        return 'animate-pulse';
      case 'wave':
        return 'skeleton';
      case 'none':
        return '';
      default:
        return 'animate-pulse';
    }
  };

  const style: React.CSSProperties = {
    width: width || undefined,
    height: height || undefined,
  };

  return (
    <div
      className={`bg-muted/60 ${getVariantClasses()} ${getAnimationClasses()} ${className}`}
      style={style}
    />
  );
}

interface SkeletonTextProps {
  lines?: number;
  className?: string;
  animation?: 'pulse' | 'wave' | 'none';
}

export function SkeletonText({ lines = 3, className = '', animation = 'pulse' }: SkeletonTextProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          width={index === lines - 1 && lines > 1 ? '70%' : '100%'}
          height={16}
          animation={animation}
        />
      ))}
    </div>
  );
}

interface SkeletonCardProps {
  className?: string;
  imageHeight?: string | number;
  lines?: number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function SkeletonCard({
  className = '',
  imageHeight = 200,
  lines = 3,
  animation = 'pulse',
}: SkeletonCardProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <Skeleton
        variant="rounded"
        width="100%"
        height={imageHeight}
        animation={animation}
      />
      <div className="space-y-2 p-2">
        <Skeleton
          variant="text"
          width="60%"
          height={24}
          animation={animation}
          className="mb-1"
        />
        <SkeletonText lines={lines} animation={animation} />
      </div>
    </div>
  );
}

interface SkeletonListProps {
  count?: number;
  className?: string;
  itemHeight?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function SkeletonList({
  count = 5,
  className = '',
  itemHeight = 60,
  animation = 'pulse',
}: SkeletonListProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={index}
          variant="rounded"
          width="100%"
          height={itemHeight}
          animation={animation}
        />
      ))}
    </div>
  );
}

interface SkeletonAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animation?: 'pulse' | 'wave' | 'none';
  className?: string;
}

export function SkeletonAvatar({
  size = 'md',
  animation = 'pulse',
  className = '',
}: SkeletonAvatarProps) {
  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'h-8 w-8';
      case 'md':
        return 'h-12 w-12';
      case 'lg':
        return 'h-16 w-16';
      case 'xl':
        return 'h-24 w-24';
      default:
        return 'h-12 w-12';
    }
  };

  return (
    <Skeleton
      variant="circular"
      className={`${getSizeClass()} ${className}`}
      animation={animation}
    />
  );
}

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
  animation?: 'pulse' | 'wave' | 'none';
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  className = '',
  animation = 'pulse',
}: SkeletonTableProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton
            key={`header-${index}`}
            variant="text"
            width={`${100 / columns}%`}
            height={24}
            animation={animation}
          />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={`cell-${rowIndex}-${colIndex}`}
              variant="text"
              width={`${100 / columns}%`}
              height={16}
              animation={animation}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
